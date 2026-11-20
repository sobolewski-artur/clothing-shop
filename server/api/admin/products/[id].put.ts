/** Replaces a product's details (admins only). Its ID (URL) and creation date stay the same. */
export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const id = readProductId(event)
  const product = await readProductInput(event)

  const ref = useAdminFirestore().collection('products').doc(id)
  const previousImage = await useAdminFirestore().runTransaction(async (tx) => {
    const snap = await tx.get(ref)
    if (!snap.exists) throw createError({ statusCode: 404, statusMessage: 'Product not found' })
    tx.update(ref, product)
    return snap.get('image') as string | undefined
  })

  // Remove the old uploaded photo once nothing points to it any more.
  if (previousImage !== product.image) await deleteProductImage(previousImage)
  return { id }
})
