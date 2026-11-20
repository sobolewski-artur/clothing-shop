import type { CartItem } from '~/composables/useCart'

const STORAGE_KEY = 'cart'

function isCartItem(value: unknown): value is CartItem {
  const item = value as CartItem
  return typeof item?.productId === 'string'
    && typeof item.size === 'string'
    && Number.isInteger(item.quantity) && item.quantity > 0
}

/** Restores the cart from localStorage and keeps it saved there. */
export default defineNuxtPlugin(() => {
  const { items } = useCart()

  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
    if (Array.isArray(saved)) items.value = saved.filter(isCartItem)
  } catch {
    // Storage unavailable or corrupted: start with an empty cart.
  }

  watch(items, (value) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
    } catch {
      // Storage unavailable (e.g. private mode): the cart still works for this visit.
    }
  }, { deep: true })
})
