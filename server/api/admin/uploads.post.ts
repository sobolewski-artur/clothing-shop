/**
 * Uploads a product photo (admins only). Body: multipart/form-data with a "file" field.
 * Returns { url } to put in the product's image field.
 */
export default defineEventHandler(async (event) => {
  await requireAdmin(event)

  // Reject oversized uploads before reading them into memory.
  const length = Number(getRequestHeader(event, 'content-length') ?? 0)
  if (length > MAX_IMAGE_BYTES + 64 * 1024) {
    throw createError({ statusCode: 413, statusMessage: 'Image too large', data: { code: 'too_large' } })
  }

  const parts = await readMultipartFormData(event)
  const file = parts?.find(part => part.name === 'file' && part.data.length)
  if (!file) throw createError({ statusCode: 400, statusMessage: 'No file', data: { code: 'no_file' } })
  if (file.data.length > MAX_IMAGE_BYTES) {
    throw createError({ statusCode: 413, statusMessage: 'Image too large', data: { code: 'too_large' } })
  }

  const image = detectImageType(file.data)
  if (!image) {
    throw createError({ statusCode: 415, statusMessage: 'Unsupported image type', data: { code: 'bad_type' } })
  }

  return { url: await saveProductImage(file.data, image) }
})
