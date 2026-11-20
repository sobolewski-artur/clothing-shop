import type { StoredOrder } from '#shared/types/orders'

/** Lists the newest orders (admins only). */
export default defineEventHandler(async (event): Promise<StoredOrder[]> => {
  await requireAdmin(event)

  const limit = Math.min(Math.max(Number(getQuery(event).limit) || 100, 1), 500)
  const snapshot = await useAdminFirestore()
    .collection('orders')
    .orderBy('createdAt', 'desc') // ISO strings sort chronologically
    .limit(limit)
    .get()

  return snapshot.docs.map(doc => doc.data() as StoredOrder)
})
