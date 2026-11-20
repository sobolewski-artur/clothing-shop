// Adds sample products to the Firestore `products` collection.
//
// Usage:
//   node scripts/seed-products.mjs [path/to/service-account.json]
//
// The key file defaults to ./service-account.json (git-ignored). Download it from
// Firebase console → Project settings → Service accounts → Generate new private key.
// Documents use fixed IDs, so running the script again updates them instead of
// creating duplicates.

import { readFileSync } from 'node:fs'
import { cert, initializeApp } from 'firebase-admin/app'
import { getFirestore, Timestamp } from 'firebase-admin/firestore'

const keyPath = process.argv[2] ?? 'service-account.json'
const serviceAccount = JSON.parse(readFileSync(keyPath, 'utf8'))

initializeApp({ credential: cert(serviceAccount) })
const db = getFirestore()

const image = id => `https://images.unsplash.com/photo-${id}?w=800&q=75&auto=format&fit=crop`

// "ONE" = one size fits all (shown as "One size" / "Rozmiar uniwersalny").
const SIZES = {
  women: ['XS', 'S', 'M', 'L', 'XL'],
  men: ['S', 'M', 'L', 'XL', 'XXL'],
  accessories: ['ONE']
}
const SIZE_OVERRIDES = {
  'knitted-poncho': ['ONE'],
  'navy-suit-jacket': ['46', '48', '50', '52', '54']
}

const products = [
  {
    id: 'knitted-poncho',
    category: 'women',
    price: 249,
    image: image('1434389677669-e08b4cac3105'),
    name: { pl: 'Dzianinowe ponczo', en: 'Knitted poncho' },
    description: {
      pl: 'Lekkie ponczo z ażurowej dzianiny z frędzlami. Idealne na chłodniejsze wieczory.',
      en: 'Light open-knit poncho with fringe. Perfect for cooler evenings.'
    }
  },
  {
    id: 'checked-wool-coat',
    category: 'women',
    price: 459,
    image: image('1485968579580-b6d095142e6e'),
    name: { pl: 'Wełniany płaszcz w kratę', en: 'Checked wool coat' },
    description: {
      pl: 'Ciepły płaszcz z domieszką wełny w ciemną kratę. Klasyczny krój na lata.',
      en: 'Warm wool-blend coat in a dark check. A classic cut that lasts for years.'
    }
  },
  {
    id: 'powder-pink-trousers',
    category: 'women',
    price: 189,
    image: image('1594633312681-425c7b97ccd1'),
    name: { pl: 'Pudrowe spodnie', en: 'Powder pink trousers' },
    description: {
      pl: 'Zwiewne spodnie z gumką w pasie i ściągaczami przy kostkach.',
      en: 'Airy trousers with an elastic waist and cuffed ankles.'
    }
  },
  {
    id: 'yellow-tracksuit',
    category: 'women',
    price: 279,
    image: image('1515886657613-9f3515b0c78f'),
    name: { pl: 'Żółty komplet dresowy', en: 'Yellow tracksuit set' },
    description: {
      pl: 'Krótka bluza z kapturem i spodnie joggery z miękkiej bawełny.',
      en: 'Cropped hoodie and jogger trousers in soft cotton.'
    }
  },
  {
    id: 'classic-white-tee',
    category: 'men',
    price: 79,
    image: image('1521572163474-6864f9cf17ab'),
    name: { pl: 'Klasyczny biały T-shirt', en: 'Classic white T-shirt' },
    description: {
      pl: 'Podstawa każdej szafy. Gruba bawełna, która nie traci kształtu.',
      en: 'A wardrobe essential. Heavyweight cotton that keeps its shape.'
    }
  },
  {
    id: 'navy-suit-jacket',
    category: 'men',
    price: 699,
    image: image('1507679799987-c73779587ccf'),
    name: { pl: 'Granatowa marynarka', en: 'Navy suit jacket' },
    description: {
      pl: 'Dopasowana marynarka z wełny, na biuro i na wyjątkowe okazje.',
      en: 'Tailored wool jacket for the office and special occasions.'
    }
  },
  {
    id: 'rust-bomber-jacket',
    category: 'men',
    price: 329,
    image: image('1591047139829-d91aecb6caea'),
    name: { pl: 'Rdzawa kurtka bomber', en: 'Rust bomber jacket' },
    description: {
      pl: 'Lekka kurtka bomber na zamek, w ciepłym rdzawym kolorze.',
      en: 'Lightweight zip-up bomber jacket in a warm rust colour.'
    }
  },
  {
    id: 'washed-cap',
    category: 'accessories',
    price: 89,
    image: image('1521369909029-2afed882baee'),
    name: { pl: 'Sprana czapka z daszkiem', en: 'Washed baseball cap' },
    description: {
      pl: 'Bawełniana czapka z regulacją, w spranym grafitowym kolorze.',
      en: 'Adjustable cotton cap in a washed graphite colour.'
    }
  },
  {
    id: 'round-sunglasses',
    category: 'accessories',
    price: 159,
    image: image('1511499767150-a48a237f0083'),
    name: { pl: 'Okrągłe okulary przeciwsłoneczne', en: 'Round sunglasses' },
    description: {
      pl: 'Metalowe oprawki w złotym kolorze i zielone szkła z filtrem UV400.',
      en: 'Gold-tone metal frames with green UV400 lenses.'
    }
  },
  {
    id: 'everyday-backpack',
    category: 'accessories',
    price: 219,
    image: image('1553062407-98eeb64c6a62'),
    name: { pl: 'Plecak na co dzień', en: 'Everyday backpack' },
    description: {
      pl: 'Granatowy plecak z kieszenią na laptopa i wodoodpornym dnem.',
      en: 'Navy backpack with a laptop sleeve and water-resistant base.'
    }
  }
]

const batch = db.batch()
const now = Date.now()
products.forEach(({ id, ...data }, index) => {
  // Space creation dates a day apart so "Newest" sorting has a clear order.
  const createdAt = Timestamp.fromMillis(now - index * 24 * 60 * 60 * 1000)
  const sizes = SIZE_OVERRIDES[id] ?? SIZES[data.category]
  batch.set(db.collection('products').doc(id), { ...data, sizes, createdAt })
})
await batch.commit()

console.log(`Saved ${products.length} products to Firestore.`)
