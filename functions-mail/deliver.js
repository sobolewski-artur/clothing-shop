// Delivery logic for one queued email (Firestore "mail/{id}" document),
// kept free of Firebase-specific imports so it can be tested with a fake db.
//
// Mail document (written by the shop, server/utils/mailer.ts):
//   to: { name, address }, subject, text, html,
//   orderNumber, historyAt   – which order history entry to update,
//   attempts: number, delivery: { state: PENDING|SENDING|RETRY|SENT|FAILED, … },
//   createdAt, expireAt      – expireAt drives a Firestore TTL policy (30 days).

/** After this many failed attempts the email is marked FAILED and not retried. */
export const MAX_ATTEMPTS = 5
/** How long one attempt "owns" an email, so parallel deliveries don't double-send. */
export const LEASE_MS = 2 * 60 * 1000

/**
 * Sends one queued email. Resolves with the outcome, or throws to ask the
 * platform to retry later (the function is deployed with retry: true).
 *
 * @param {object} options
 * @param {object} options.db       Firestore (or compatible fake)
 * @param {object} options.mailRef  reference to mail/{id}
 * @param {(mail: object) => Promise<void>} options.send  sends the email
 * @param {() => number} [options.now]
 */
export async function deliverMail({ db, mailRef, send, now = Date.now }) {
  // 1. Claim the email in a transaction.
  const claim = await db.runTransaction(async (tx) => {
    const snap = await tx.get(mailRef)
    if (!snap.exists) return { skip: 'MISSING' }
    const mail = snap.data()
    const state = mail.delivery?.state
    if (state === 'SENT' || state === 'FAILED') return { skip: state }
    if (state === 'SENDING' && mail.delivery.leaseUntil > now()) return { busy: true }
    const attempts = (mail.attempts ?? 0) + 1
    tx.update(mailRef, { attempts, delivery: { state: 'SENDING', leaseUntil: now() + LEASE_MS } })
    return { mail, attempts }
  })
  if (claim.skip) return claim.skip
  if (claim.busy) throw new Error('Another attempt is sending this email; retrying later')

  // 2. Send.
  try {
    await send(claim.mail)
  } catch (error) {
    const message = String(error?.message ?? error).slice(0, 500)
    if (claim.attempts >= MAX_ATTEMPTS) {
      await mailRef.update({ delivery: { state: 'FAILED', error: message, at: new Date(now()).toISOString() } })
      await recordResult(db, claim.mail, 'failed')
      return 'FAILED'
    }
    await mailRef.update({ delivery: { state: 'RETRY', error: message, at: new Date(now()).toISOString() } })
    throw error // let the platform retry with backoff
  }

  // 3. Mark as sent and update the order history.
  await mailRef.update({ delivery: { state: 'SENT', at: new Date(now()).toISOString() } })
  await recordResult(db, claim.mail, 'sent')
  return 'SENT'
}

/** Writes "sent"/"failed" onto the order's status-history entry the email belongs to. */
async function recordResult(db, mail, result) {
  if (!mail.orderNumber || !mail.historyAt) return
  const orderRef = db.collection('orders').doc(mail.orderNumber)
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(orderRef)
    if (!snap.exists) return
    const order = snap.data()
    const history = order.statusHistory?.length ? order.statusHistory : [{ status: order.status, at: order.createdAt }]
    if (!history.some(change => change.at === mail.historyAt)) return
    tx.update(orderRef, {
      statusHistory: history.map(change => (change.at === mail.historyAt ? { ...change, notification: result } : change))
    })
  })
}
