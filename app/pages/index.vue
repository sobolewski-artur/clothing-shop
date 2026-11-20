<script setup lang="ts">
const { t, locale } = useI18n()
const localePath = useLocalePath()

useHead({ title: () => t('home.title') })

const categories = [
  { key: 'women', image: '1485968579580-b6d095142e6e' },
  { key: 'men', image: '1507679799987-c73779587ccf' },
  { key: 'accessories', image: '1556905055-8f358a7a47b2' }
]

const products = [
  { key: 'poncho', price: 249, image: '1434389677669-e08b4cac3105' },
  { key: 'bomber', price: 329, image: '1591047139829-d91aecb6caea' },
  { key: 'tee', price: 79, image: '1521572163474-6864f9cf17ab' },
  { key: 'trousers', price: 189, image: '1594633312681-425c7b97ccd1' }
]

const features = ['shipping', 'returns', 'payment']
</script>

<template>
  <main>
    <!-- Hero -->
    <section class="relative isolate overflow-hidden">
      <img
        :src="unsplash('1445205170230-053b83016050', 1920)"
        :alt="t('home.hero.alt')"
        class="absolute inset-0 -z-10 h-full w-full object-cover"
        fetchpriority="high"
      >
      <div class="absolute inset-0 -z-10 bg-linear-to-r from-black/75 via-black/50 to-black/20" />
      <div class="mx-auto max-w-6xl px-4 py-28 sm:py-40">
        <p class="text-sm font-medium uppercase tracking-widest text-amber-200">
          {{ t('home.hero.eyebrow') }}
        </p>
        <h1 class="mt-3 max-w-xl text-4xl font-bold leading-tight text-white sm:text-5xl">
          {{ t('home.hero.title') }}
        </h1>
        <p class="mt-4 max-w-lg text-lg text-stone-200">
          {{ t('home.hero.text') }}
        </p>
        <div class="mt-8 flex flex-wrap gap-3">
          <NuxtLink
            :to="localePath('/products')"
            class="rounded-full bg-white px-6 py-3 text-sm font-semibold text-stone-900 hover:bg-stone-100"
          >
            {{ t('home.hero.cta') }}
          </NuxtLink>
          <NuxtLink
            :to="localePath('/about')"
            class="rounded-full border border-white/60 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10"
          >
            {{ t('home.hero.secondary') }}
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- Categories -->
    <section class="mx-auto max-w-6xl px-4 py-16">
      <h2 class="text-2xl font-bold">{{ t('home.categories.title') }}</h2>
      <div class="mt-6 grid gap-4 sm:grid-cols-3">
        <NuxtLink
          v-for="cat in categories"
          :key="cat.key"
          :to="{ path: localePath('/products'), query: { category: cat.key } }"
          class="group relative block aspect-[4/5] overflow-hidden rounded-2xl"
        >
          <img
            :src="unsplash(cat.image, 700)"
            :alt="t(`home.categories.${cat.key}Alt`)"
            loading="lazy"
            class="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          >
          <div class="absolute inset-0 bg-linear-to-t from-black/60 to-transparent" />
          <span class="absolute bottom-4 left-4 text-xl font-semibold text-white">
            {{ t(`home.categories.${cat.key}`) }}
          </span>
        </NuxtLink>
      </div>
    </section>

    <!-- New arrivals -->
    <section id="new" class="scroll-mt-20 bg-stone-50">
      <div class="mx-auto max-w-6xl px-4 py-16">
        <h2 class="text-2xl font-bold">{{ t('home.new.title') }}</h2>
        <p class="mt-1 text-stone-600">{{ t('home.new.subtitle') }}</p>
        <div class="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-4">
          <article v-for="product in products" :key="product.key" class="group">
            <div class="aspect-[3/4] overflow-hidden rounded-xl bg-stone-200">
              <img
                :src="unsplash(product.image, 600)"
                :alt="t(`home.products.${product.key}`)"
                loading="lazy"
                class="h-full w-full object-cover transition duration-500 group-hover:scale-105"
              >
            </div>
            <h3 class="mt-3 text-sm font-medium">{{ t(`home.products.${product.key}`) }}</h3>
            <p class="mt-1 text-sm text-stone-600">{{ formatPrice(product.price, locale) }}</p>
          </article>
        </div>
      </div>
    </section>

    <!-- Promo -->
    <section class="mx-auto max-w-6xl px-4 py-16">
      <div class="grid items-center overflow-hidden rounded-3xl bg-amber-100 md:grid-cols-2">
        <img
          :src="unsplash('1515886657613-9f3515b0c78f', 900)"
          :alt="t('home.promo.alt')"
          loading="lazy"
          class="h-80 w-full object-cover md:h-full"
        >
        <div class="p-8 sm:p-12">
          <p class="text-sm font-medium uppercase tracking-widest text-amber-800">
            {{ t('home.promo.eyebrow') }}
          </p>
          <h2 class="mt-2 text-3xl font-bold">{{ t('home.promo.title') }}</h2>
          <p class="mt-4 text-stone-700">{{ t('home.promo.text') }}</p>
          <NuxtLink
            :to="{ path: localePath('/products'), query: { category: 'women' } }"
            class="mt-6 inline-block rounded-full bg-stone-900 px-6 py-3 text-sm font-semibold text-white hover:bg-stone-700"
          >
            {{ t('home.promo.cta') }}
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- Features -->
    <section class="border-t border-stone-200">
      <div class="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-3">
        <div v-for="f in features" :key="f">
          <h3 class="font-semibold">{{ t(`home.features.${f}`) }}</h3>
          <p class="mt-1 text-sm text-stone-600">{{ t(`home.features.${f}Text`) }}</p>
        </div>
      </div>
    </section>
  </main>
</template>
