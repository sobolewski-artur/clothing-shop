import { Timestamp, type DocumentReference, type Firestore } from 'firebase-admin/firestore'
import type { StoredOrder } from '#shared/types/orders'

/** Queued emails are deleted by a Firestore TTL policy on `expireAt` after this long. */
const MAIL_RETENTION_MS = 30 * 24 * 60 * 60 * 1000

/**
 * Builds a `mail/{id}` document for the customer of an order.
 *
 * The deployed `sendQueuedMail` Cloud Function (functions-mail/) sends every new
 * mail document over SMTP and then marks the order's status-history entry whose
 * `at` equals `historyAt` with notification "sent" or "failed".
 */
function customerMail(order: StoredOrder, historyAt: string, content: { subject: string, text: string, html: string }) {
  const now = Date.now()
  return {
    to: { name: order.customer.name, address: order.customer.email },
    ...content,
    orderNumber: order.number,
    historyAt,
    attempts: 0,
    delivery: { state: 'PENDING' },
    createdAt: Timestamp.fromMillis(now),
    expireAt: Timestamp.fromMillis(now + MAIL_RETENTION_MS)
  }
}

/** Order confirmation, linked to the order's first ("new") history entry. */
export function orderConfirmationMail(order: StoredOrder) {
  const { bankAccount, bankRecipient } = useRuntimeConfig().public.shop
  return customerMail(order, order.statusHistory[0]!.at, renderOrderConfirmation(order, { bankAccount, bankRecipient }))
}

/** Status update ("your order has been shipped"), linked to the given history entry. */
export function orderStatusMail(order: StoredOrder, historyAt: string) {
  return customerMail(order, historyAt, renderStatusUpdate(order))
}

/** A new document reference in the `mail` queue. */
export function newMailRef(db: Firestore): DocumentReference {
  return db.collection('mail').doc()
}
