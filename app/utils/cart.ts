/** Orders from this amount (PLN) ship for free, as promised on the home page. */
export const FREE_SHIPPING_THRESHOLD = 200
/** Shipping cost (PLN) below the free-shipping threshold. */
export const SHIPPING_COST = 14.99

/** Converts PLN to grosze so totals add up without floating-point errors. */
export const toCents = (amount: number) => Math.round(amount * 100)
