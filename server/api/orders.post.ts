import { randomBytes } from 'node:crypto'
import { z } from 'zod'
import { PAYMENT_METHODS, type CheckoutResponse, type StoredOrder, type StoredOrderItem } from '#shared/types/orders'
import { MAX_QUANTITY, shippingCentsFor, toCents } from '#shared/utils/pricing'

const checkoutSchema = z.object({
  locale: z.enum(['pl', 'en']),
  website: z.string().max(0).optional(),
  expectedTotal: z.number().nonnegative(),
  customer: z.object({
    name: z.string().trim().min(2).max(100),
    email: z.string().trim().pipe(z.email().max(200)),
    phone: z.string().trim().regex(/^\+?[0-9 ()-]{9,20}$/),
    street: z.string().trim().min(3).max(200),
    postalCode: z.string().trim().regex(/^\d{2}-\d{3}$/),
    city: z.string().trim().min(2).max(100),
    notes: z.string().trim().max(500).default(''),
    payment: z.enum(PAYMENT_METHODS)
  }),
  items: z.array(z.object({
    productId: z.string().regex(/^[a-z0-9-]{1,100}$/),
    size: z.string().min(1).max(10),
    quantity: z.number().int().min(1).max(MAX_QUANTITY)
  })).min(1).max(50)
})

interface ProductData {
  name: { pl: string, en: string }
  price: number
  sizes?: string[]
}

function newOrderNumber(date: Date) {
  const yymmdd = date.toISOString().slice(2, 10).replaceAll('-', '')
  return `ES-${yymmdd}-${randomBytes(3).toString('hex').toUpperCase()}`
}

/** Creates an order. Prices always come from Firestore, never from the browser. */
export default defineEventHandler(async (event): Promise<CheckoutResponse> => {
  const parsed = checkoutSchema.safeParse(await readBody(event))
  if (!parsed.success) {
    // Report which form fields are wrong, e.g. ["email", "postalCode"].
    const fields = [...new Set(parsed.error.issues.map(issue =>
      String(issue.path[0] === 'customer' ? issue.path[1] : issue.path[0])))]
    throw createError({ statusCode: 400, statusMessage: 'Invalid order', data: { code: 'invalid', fields } })
  }
  const { locale, customer, items, expectedTotal } = parsed.data

  // Merge duplicate lines (same product and size).
  const merged = new Map<string, { productId: string, size: string, quantity: number }>()
  for (const item of items) {
    const key = `${item.productId}:${item.size}`
    const existing = merged.get(key)
    if (existing) existing.quantity = Math.min(existing.quantity + item.quantity, MAX_QUANTITY)
    else merged.set(key, { ...item })
  }
  const lines = [...merged.values()]

  const db = useAdminFirestore()
  const productIds = [...new Set(lines.map(line => line.productId))]
  const snapshots = await db.getAll(...productIds.map(id => db.collection('products').doc(id)))
  const products = new Map(snapshots.filter(s => s.exists).map(s => [s.id, s.data() as ProductData]))

  const unavailable = lines
    .filter(line => !products.get(line.productId)?.sizes?.includes(line.size))
    .map(line => `${line.productId}:${line.size}`)
  if (unavailable.length) {
    throw createError({ statusCode: 409, statusMessage: 'Products unavailable', data: { code: 'unavailable', items: unavailable } })
  }

  const orderItems: StoredOrderItem[] = lines.map((line) => {
    const product = products.get(line.productId)!
    const unitCents = toCents(product.price)
    return {
      id: line.productId,
      name: product.name[locale] || product.name.pl,
      size: line.size,
      quantity: line.quantity,
      unitPrice: unitCents / 100,
      total: (unitCents * line.quantity) / 100
    }
  })
  const subtotalCents = orderItems.reduce((sum, item) => sum + toCents(item.total), 0)
  const shippingCents = shippingCentsFor(subtotalCents)
  const totalCents = subtotalCents + shippingCents

  // Never charge a different amount than the customer saw.
  if (totalCents !== toCents(expectedTotal)) {
    throw createError({ statusCode: 409, statusMessage: 'Prices changed', data: { code: 'price_changed', total: totalCents / 100 } })
  }

  const now = new Date()
  const createdAt = now.toISOString()
  const baseOrder: Omit<StoredOrder, 'number'> = {
    createdAt,
    status: 'new',
    statusHistory: [{ status: 'new', at: createdAt }],
    locale,
    customer,
    items: orderItems,
    subtotal: subtotalCents / 100,
    shipping: shippingCents / 100,
    total: totalCents / 100,
    currency: 'PLN'
  }

  // create() fails if the number is taken, so a collision can never overwrite an order.
  for (let attempt = 0; attempt < 3; attempt++) {
    const number = newOrderNumber(now)
    try {
      await db.collection('orders').doc(number).create({ number, ...baseOrder } satisfies StoredOrder)
      return { number, total: baseOrder.total, payment: customer.payment }
    } catch (error) {
      if ((error as { code?: number }).code !== 6) throw error // 6 = ALREADY_EXISTS
    }
  }
  throw createError({ statusCode: 500, statusMessage: 'Could not create order number' })
})
