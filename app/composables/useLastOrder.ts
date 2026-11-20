import type { CheckoutResponse } from '#shared/types/orders'

/** The order just placed, shown on the confirmation page (kept for this visit only). */
export const useLastOrder = () => useState<CheckoutResponse | null>('last-order', () => null)
