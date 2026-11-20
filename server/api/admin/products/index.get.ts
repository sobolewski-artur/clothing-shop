import type { Timestamp } from 'firebase-admin/firestore'
import type { AdminProduct } from '#shared/types/products'

/** Lists all products, newest first (admins only). */
export default defineEventHandler(async (event): Promise<AdminProduct[]> => {
  await requireAdmin(event)

  const snapshot = await useAdminFirestore().collection('products').orderBy('createdAt', 'desc').get()
  return snapshot.docs.map((doc) => {
    const { createdAt, ...data } = doc.data() as Omit<AdminProduct, 'id' | 'createdAt'> & { createdAt?: Timestamp }
    return { id: doc.id, ...data, createdAt: createdAt?.toMillis() ?? 0 }
  })
})
