import { collection, getDocs, query, where } from 'firebase/firestore'
import { toProduct, type ProductCategory } from '~/utils/products'

/**
 * Loads products from Firestore, optionally filtered by category.
 * Runs during server rendering and re-fetches when the category changes.
 */
export function useProducts(category: MaybeRefOrGetter<ProductCategory | undefined>) {
  const { $firestore } = useNuxtApp()

  return useAsyncData(
    () => `products:${toValue(category) ?? 'all'}`,
    async () => {
      const selected = toValue(category)
      const productsRef = collection($firestore, 'products')
      const q = selected ? query(productsRef, where('category', '==', selected)) : productsRef
      const snapshot = await getDocs(q)
      return snapshot.docs.map(doc => toProduct(doc.id, doc.data()))
    }
  )
}
