import { doc, getDoc } from 'firebase/firestore'
import { localized, toProduct, type Product } from '~/utils/products'
import { FREE_SHIPPING_THRESHOLD, shippingCentsFor, toCents } from '#shared/utils/pricing'

/**
 * Cart items joined with their products from Firestore, plus totals.
 * Client-only: use it inside <ClientOnly>, because the cart lives in the browser.
 */
export function useCartLines() {
  const { locale } = useI18n()
  const { $firestore } = useNuxtApp()
  const cart = useCart()

  /** Loaded products by ID; null = no longer in Firestore. */
  const products = ref<Record<string, Product | null>>({})
  const loading = ref(false)
  const loadFailed = ref(false)

  async function loadMissingProducts() {
    const missing = [...new Set(cart.items.value.map(item => item.productId))]
      .filter(id => !(id in products.value))
    if (!missing.length) return

    loading.value = true
    loadFailed.value = false
    try {
      const snapshots = await Promise.all(missing.map(id => getDoc(doc($firestore, 'products', id))))
      for (const snap of snapshots) {
        products.value[snap.id] = snap.exists() ? toProduct(snap.id, snap.data()) : null
      }
    } catch {
      loadFailed.value = true
    } finally {
      loading.value = false
    }
  }

  /** Reloads every product, e.g. after the server reported changed prices. */
  function reloadProducts() {
    products.value = {}
    return loadMissingProducts()
  }

  watch(() => cart.items.value.map(item => item.productId).join(), loadMissingProducts, { immediate: true })

  const lines = computed(() => cart.items.value.map((item) => {
    const product = products.value[item.productId]
    const available = !!product && product.sizes.includes(item.size)
    return {
      ...item,
      key: `${item.productId}:${item.size}`,
      product,
      available,
      name: product ? localized(product.name, locale.value) : '',
      totalCents: product && available ? toCents(product.price) * item.quantity : 0
    }
  }))

  const isReady = computed(() => cart.items.value.every(item => item.productId in products.value))
  const hasUnavailable = computed(() => lines.value.some(line => !line.available))
  const subtotalCents = computed(() => lines.value.reduce((sum, line) => sum + line.totalCents, 0))
  const shippingCents = computed(() => shippingCentsFor(subtotalCents.value))
  const totalCents = computed(() => subtotalCents.value + shippingCents.value)
  const missingForFreeShipping = computed(() => toCents(FREE_SHIPPING_THRESHOLD) - subtotalCents.value)

  return {
    lines,
    loading,
    loadFailed,
    isReady,
    hasUnavailable,
    subtotalCents,
    shippingCents,
    totalCents,
    missingForFreeShipping,
    loadMissingProducts,
    reloadProducts
  }
}
