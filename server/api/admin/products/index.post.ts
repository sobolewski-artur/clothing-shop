import { Timestamp } from 'firebase-admin/firestore'

/** "Wełniany płaszcz" -> "welniany-plaszcz" */
function slugify(text: string) {
  return text
    .replaceAll('ł', 'l').replaceAll('Ł', 'L')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/, '') || 'product'
}

/** Adds a product to the catalogue (admins only). */
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const product = await readProductInput(event)
  const doc = { ...product, createdAt: Timestamp.now() }

  // The ID becomes the product URL. create() never overwrites an existing product,
  // so on a clash try "name-2", "name-3", ...
  const db = useAdminFirestore()
  const base = slugify(product.name.en || product.name.pl)
  for (let n = 1; n <= 20; n++) {
    const id = n === 1 ? base : `${base}-${n}`
    try {
      await db.collection('products').doc(id).create(doc)
      return { id }
    } catch (error) {
      if ((error as { code?: number }).code !== 6) throw error // 6 = ALREADY_EXISTS
    }
  }
  throw createError({ statusCode: 409, statusMessage: 'Could not create a unique product ID' })
})
