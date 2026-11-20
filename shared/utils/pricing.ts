// Shared by the browser (cart, checkout) and the server (order creation),
// so both always calculate the same totals.

/** Orders from this amount (PLN) ship for free, as promised on the home page. */
export const FREE_SHIPPING_THRESHOLD = 200
/** Shipping cost (PLN) below the free-shipping threshold. */
export const SHIPPING_COST = 14.99
/** Highest quantity of one product and size in a single order. */
export const MAX_QUANTITY = 10

/** Converts PLN to grosze so totals add up without floating-point errors. */
export const toCents = (amount: number) => Math.round(amount * 100)

export const shippingCentsFor = (subtotalCents: number) =>
  subtotalCents >= toCents(FREE_SHIPPING_THRESHOLD) ? 0 : toCents(SHIPPING_COST)
