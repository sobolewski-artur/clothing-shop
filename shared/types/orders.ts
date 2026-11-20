// Order data shared by the checkout page and the /api/orders server route.
// Stored orders are written only by the server (Admin SDK); see firestore.rules.

export const PAYMENT_METHODS = ['transfer', 'cod'] as const
export type PaymentMethod = (typeof PAYMENT_METHODS)[number]

export const ORDER_STATUSES = ['new', 'processing', 'shipped', 'delivered', 'cancelled'] as const
export type OrderStatus = (typeof ORDER_STATUSES)[number]

/** Order number format, e.g. "ES-261120-4F09A2". */
export const ORDER_NUMBER_PATTERN = /^ES-\d{6}-[0-9A-F]{6}$/

export interface CheckoutCustomer {
  name: string
  email: string
  phone: string
  street: string
  postalCode: string
  city: string
  notes: string
  payment: PaymentMethod
}

/** Body of POST /api/orders. */
export interface CheckoutRequest {
  locale: 'pl' | 'en'
  customer: CheckoutCustomer
  items: { productId: string, size: string, quantity: number }[]
  /** Total (PLN) the customer saw; the order is rejected if the server's total differs. */
  expectedTotal: number
  /** Honeypot field: real visitors never fill it in. */
  website?: string
}

/** Response of POST /api/orders. */
export interface CheckoutResponse {
  number: string
  total: number
  payment: PaymentMethod
}

/** Error codes returned by POST /api/orders (in `data.code`). */
export type CheckoutErrorCode = 'invalid' | 'unavailable' | 'price_changed'

export interface StoredOrderItem {
  id: string
  name: string
  size: string
  quantity: number
  unitPrice: number
  total: number
}

/** Document in the Firestore `orders` collection (document ID = number). */
export interface StoredOrder {
  number: string
  createdAt: string
  status: OrderStatus
  statusHistory: { status: OrderStatus, at: string, notification?: string }[]
  locale: 'pl' | 'en'
  customer: CheckoutCustomer
  items: StoredOrderItem[]
  subtotal: number
  shipping: number
  total: number
  currency: 'PLN'
}
