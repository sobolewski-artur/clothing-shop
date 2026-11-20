export interface CartItem {
  productId: string
  size: string
  quantity: number
}

/** Shopping cart shared across the app. Saved in the browser by plugins/cart.client.ts. */
export function useCart() {
  const items = useState<CartItem[]>('cart', () => [])

  const count = computed(() => items.value.reduce((total, item) => total + item.quantity, 0))

  function add(productId: string, size: string) {
    const existing = items.value.find(item => item.productId === productId && item.size === size)
    if (existing) existing.quantity++
    else items.value.push({ productId, size, quantity: 1 })
  }

  return { items, count, add }
}
