// Product constants shared by the shop pages and the admin API.
// Keep in sync with the `products` data model in firestore.rules.

export const PRODUCT_CATEGORIES = ['women', 'men', 'accessories'] as const
export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number]

/** "ONE" means one size fits all. */
export const ONE_SIZE = 'ONE'

/** Allowed size codes, in the order they are shown. */
export const PRODUCT_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', ONE_SIZE, '44', '46', '48', '50', '52', '54', '56'] as const

export type LocalizedText = { pl: string, en: string }

/** Product as returned by the admin API (createdAt in milliseconds). */
export interface AdminProduct {
  id: string
  name: LocalizedText
  description: LocalizedText
  price: number
  category: ProductCategory
  sizes: string[]
  image: string
  createdAt: number
}

export function isProductCategory(value: unknown): value is ProductCategory {
  return typeof value === 'string' && (PRODUCT_CATEGORIES as readonly string[]).includes(value)
}
