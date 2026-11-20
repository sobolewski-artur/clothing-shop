import { randomUUID } from 'node:crypto'

/** Uploaded product photos live under this folder in the default bucket. */
const FOLDER = 'products/'
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024

const IMAGE_TYPES = [
  { ext: 'jpg', type: 'image/jpeg', matches: (b: Buffer) => b[0] === 0xFF && b[1] === 0xD8 && b[2] === 0xFF },
  { ext: 'png', type: 'image/png', matches: (b: Buffer) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A])) },
  { ext: 'webp', type: 'image/webp', matches: (b: Buffer) => b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP' },
  { ext: 'avif', type: 'image/avif', matches: (b: Buffer) => b.toString('ascii', 4, 12) === 'ftypavif' }
]

/** Detects the image type from the file's first bytes (never trusts the file name). */
export const detectImageType = (data: Buffer) => IMAGE_TYPES.find(t => data.length > 12 && t.matches(data))

/**
 * Saves a product photo and returns its public URL.
 *
 * The URL carries a download token, so images load without making the bucket
 * readable: storage.rules deny all direct client access.
 */
export async function saveProductImage(data: Buffer, image: { ext: string, type: string }) {
  const bucket = useAdminBucket()
  const path = `${FOLDER}${randomUUID()}.${image.ext}`
  const token = randomUUID()
  await bucket.file(path).save(data, {
    resumable: false,
    metadata: {
      contentType: image.type,
      cacheControl: 'public, max-age=31536000, immutable',
      metadata: { firebaseStorageDownloadTokens: token }
    }
  })
  return `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(path)}?alt=media&token=${token}`
}

/** Deletes a photo previously saved by saveProductImage. Other URLs are left alone. */
export async function deleteProductImage(url: string | undefined) {
  if (!url) return
  const bucket = useAdminBucket()
  const prefix = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/`
  if (!url.startsWith(prefix)) return
  const path = decodeURIComponent(url.slice(prefix.length).split('?')[0] ?? '')
  if (!path.startsWith(FOLDER) || path.includes('..')) return
  try {
    await bucket.file(path).delete({ ignoreNotFound: true })
  } catch (error) {
    // The product change already succeeded; a leftover file only costs a little storage.
    console.error('Could not delete product image', path, error)
  }
}
