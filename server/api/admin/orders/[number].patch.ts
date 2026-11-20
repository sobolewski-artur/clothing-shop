import { z } from 'zod'
import { ORDER_NUMBER_PATTERN, ORDER_STATUSES, type StoredOrder } from '#shared/types/orders'

const bodySchema = z.object({
  status: z.enum(ORDER_STATUSES),
  /** Email the customer about the change (not for "new"). */
  notify: z.boolean().default(false)
})

/**
 * Changes an order's status (admins only): adds a status-history entry and,
 * if requested, queues a status email linked to that entry.
 */
export default defineEventHandler(async (event): Promise<StoredOrder> => {
  await requireAdmin(event)

  const number = getRouterParam(event, 'number') ?? ''
  if (!ORDER_NUMBER_PATTERN.test(number)) throw createError({ statusCode: 400, statusMessage: 'Invalid order number' })

  const parsed = bodySchema.safeParse(await readBody(event))
  if (!parsed.success) throw createError({ statusCode: 400, statusMessage: 'Invalid status' })
  const { status, notify } = parsed.data

  const db = useAdminFirestore()
  const ref = db.collection('orders').doc(number)

  return db.runTransaction(async (tx) => {
    const snap = await tx.get(ref)
    if (!snap.exists) throw createError({ statusCode: 404, statusMessage: 'Order not found' })
    const order = snap.data() as StoredOrder
    if (order.status === status) throw createError({ statusCode: 409, statusMessage: 'Order already has this status' })

    const at = new Date().toISOString()
    const updated: StoredOrder = {
      ...order,
      status,
      statusHistory: [...(order.statusHistory ?? []), { status, at }]
    }
    tx.update(ref, { status, statusHistory: updated.statusHistory })
    if (notify && status !== 'new') tx.create(newMailRef(db), orderStatusMail(updated, at))
    return updated
  })
})
