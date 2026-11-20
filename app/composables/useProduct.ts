import { doc, getDoc } from 'firebase/firestore'
import { toProduct } from '~/utils/products'

/** Loads a single product by its document ID. Resolves to null when it doesn't exist. */
export function useProduct(id: MaybeRefOrGetter<string>) {
  const { $firestore } = useNuxtApp()

  return useAsyncData(
    () => `product:${toValue(id)}`,
    async () => {
      const snapshot = await getDoc(doc($firestore, 'products', toValue(id)))
      return snapshot.exists() ? toProduct(snapshot.id, snapshot.data()) : null
    }
  )
}
