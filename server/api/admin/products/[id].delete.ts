/**
 * Removes a product from the shop (admins only), together with its uploaded photo.
 * Past orders keep their own copy of the product name and price.
 */
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const id = readProductId(event)

  const ref = useAdminFirestore().collection('products').doc(id)
  const snap = await ref.get()
  if (!snap.exists) throw createError({ statusCode: 404, statusMessage: 'Product not found' })

  await ref.delete()
  await deleteProductImage(snap.get('image'))
  return { id }
})
