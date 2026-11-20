import { Timestamp, type DocumentReference, type Firestore } from 'firebase-admin/firestore'
import type { StoredOrder } from '#shared/types/orders'

/** Queued emails are deleted by a Firestore TTL policy on `expireAt` after this long. */
const MAIL_RETENTION_MS = 30 * 24 * 60 * 60 * 1000

/**
 * Builds the `mail/{id}` document for an order confirmation.
 *
 * The deployed `sendQueuedMail` Cloud Function sends every new mail document over
 * SMTP and then marks the order's status-history entry (matched by `historyAt`)
 * as notification "sent" or "failed".
 */
export function orderConfirmationMail(order: StoredOrder) {
  const { bankAccount, bankRecipient } = useRuntimeConfig().public.shop
  const { subject, text, html } = renderOrderConfirmation(order, { bankAccount, bankRecipient })
  const now = Date.now()

  return {
    to: { name: order.customer.name, address: order.customer.email },
    subject,
    text,
    html,
    orderNumber: order.number,
    historyAt: order.statusHistory[0]!.at,
    attempts: 0,
    delivery: { state: 'PENDING' },
    createdAt: Timestamp.fromMillis(now),
    expireAt: Timestamp.fromMillis(now + MAIL_RETENTION_MS)
  }
}

/** A new document reference in the `mail` queue. */
export function newMailRef(db: Firestore): DocumentReference {
  return db.collection('mail').doc()
}
