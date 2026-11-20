/** Builds a resized Unsplash image URL from a photo id (the part after "photo-"). */
export function unsplash(id: string, width = 800) {
  return `https://images.unsplash.com/photo-${id}?w=${width}&q=75&auto=format&fit=crop`
}

export function formatPrice(value: number, locale: string) {
  return new Intl.NumberFormat(locale, { style: 'currency', currency: 'PLN' }).format(value)
}
