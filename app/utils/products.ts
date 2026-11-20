import type { DocumentData, Timestamp } from 'firebase/firestore'

export const PRODUCT_CATEGORIES = ['women', 'men', 'accessories'] as const
export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number]

export type LocalizedText = { pl: string, en: string }

/** Shape of a document in the Firestore `products` collection. */
export interface ProductDoc {
  name: LocalizedText
  description: LocalizedText
  price: number
  category: ProductCategory
  image: string
  /** Sizes in display order, e.g. ["S", "M", "L"]. "ONE" means one size fits all. */
  sizes: string[]
  createdAt: Timestamp
}

export const ONE_SIZE = 'ONE'

/** Product as used in the app (serializable, so it can be sent from SSR to the browser). */
export interface Product extends Omit<ProductDoc, 'createdAt'> {
  id: string
  createdAt: number
}

export function isProductCategory(value: unknown): value is ProductCategory {
  return typeof value === 'string' && (PRODUCT_CATEGORIES as readonly string[]).includes(value)
}

export function toProduct(id: string, data: DocumentData): Product {
  const doc = data as ProductDoc
  return {
    id,
    name: doc.name,
    description: doc.description,
    price: doc.price,
    category: doc.category,
    image: doc.image,
    sizes: Array.isArray(doc.sizes) ? doc.sizes : [],
    createdAt: doc.createdAt?.toMillis?.() ?? 0
  }
}

export function localized(text: LocalizedText | undefined, locale: string) {
  if (!text) return ''
  return text[locale as keyof LocalizedText] || text.pl
}
