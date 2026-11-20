import { z } from 'zod'
import { PRODUCT_CATEGORIES, PRODUCT_SIZES } from '#shared/types/products'

const localizedText = (min: number, max: number) => z.object({
  pl: z.string().trim().min(min).max(max),
  en: z.string().trim().min(min).max(max)
})

/** Product fields an admin can set. Mirrors isValidProduct() in firestore.rules. */
export const productInputSchema = z.object({
  name: localizedText(1, 120),
  description: localizedText(0, 2000),
  price: z.number().positive().lt(100000)
    .refine(value => Math.abs(value * 100 - Math.round(value * 100)) < 1e-6, 'At most 2 decimal places'),
  category: z.enum(PRODUCT_CATEGORIES),
  sizes: z.array(z.enum(PRODUCT_SIZES)).min(1).max(12)
    .refine(sizes => new Set(sizes).size === sizes.length, 'Duplicate sizes'),
  image: z.string().trim().max(500).pipe(z.url({ protocol: /^https$/ }))
})

/** Validates a request body as product input, or throws a 400 listing the invalid fields. */
export async function readProductInput(event: Parameters<typeof readBody>[0]) {
  const parsed = productInputSchema.safeParse(await readBody(event))
  if (!parsed.success) {
    const fields = [...new Set(parsed.error.issues.map(issue => issue.path.join('.')))]
    throw createError({ statusCode: 400, statusMessage: 'Invalid product', data: { code: 'invalid', fields } })
  }
  const product = parsed.data
  return {
    ...product,
    price: Math.round(product.price * 100) / 100,
    // Store sizes in the shop's display order (XS, S, M, ...).
    sizes: PRODUCT_SIZES.filter(size => product.sizes.includes(size))
  }
}

/** Product document ID must look like a slug (as created by POST /api/admin/products). */
export function readProductId(event: Parameters<typeof getRouterParam>[0]) {
  const id = getRouterParam(event, 'id') ?? ''
  if (!/^[a-z0-9-]{1,100}$/.test(id)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid product ID' })
  }
  return id
}
