import { MAX_QUANTITY } from '#shared/utils/pricing'

export interface CartItem {
  productId: string
  size: string
  quantity: number
}

/** Shopping cart shared across the app. Saved in the browser by plugins/cart.client.ts. */
export function useCart() {
  const items = useState<CartItem[]>('cart', () => [])

  const count = computed(() => items.value.reduce((total, item) => total + item.quantity, 0))

  const find = (productId: string, size: string) =>
    items.value.find(item => item.productId === productId && item.size === size)

  function add(productId: string, size: string) {
    const existing = find(productId, size)
    if (existing) existing.quantity = Math.min(existing.quantity + 1, MAX_QUANTITY)
    else items.value.push({ productId, size, quantity: 1 })
  }

  function setQuantity(productId: string, size: string, quantity: number) {
    const item = find(productId, size)
    if (!item) return
    if (quantity < 1) remove(productId, size)
    else item.quantity = Math.min(quantity, MAX_QUANTITY)
  }

  function remove(productId: string, size: string) {
    items.value = items.value.filter(item => !(item.productId === productId && item.size === size))
  }

  function clear() {
    items.value = []
  }

  return { items, count, add, setQuantity, remove, clear }
}
