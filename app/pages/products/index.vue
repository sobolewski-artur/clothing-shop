<script setup lang="ts">
import { PRODUCT_CATEGORIES, isProductCategory } from '~/utils/products'

const { t } = useI18n()
const route = useRoute()

useHead({ title: () => t('shop.title') })

const category = computed(() => {
  const value = route.query.category
  return isProductCategory(value) ? value : undefined
})

type SortOption = 'newest' | 'priceAsc' | 'priceDesc'
const sortOptions: SortOption[] = ['newest', 'priceAsc', 'priceDesc']
const sort = ref<SortOption>('newest')

const { data: products, status, refresh } = await useProducts(category)

const sortedProducts = computed(() => {
  const list = [...(products.value ?? [])]
  if (sort.value === 'priceAsc') return list.sort((a, b) => a.price - b.price)
  if (sort.value === 'priceDesc') return list.sort((a, b) => b.price - a.price)
  return list.sort((a, b) => b.createdAt - a.createdAt)
})

const filters = [undefined, ...PRODUCT_CATEGORIES]
</script>

<template>
  <main class="mx-auto max-w-6xl px-4 py-12">
    <header>
      <h1 class="text-3xl font-bold">{{ t('shop.title') }}</h1>
      <p class="mt-1 text-stone-600">{{ t('shop.subtitle') }}</p>
    </header>

    <div class="mt-8 flex flex-wrap items-center justify-between gap-4 border-b border-stone-200 pb-4">
      <nav class="flex flex-wrap gap-2" :aria-label="t('shop.filterLabel')">
        <NuxtLink
          v-for="c in filters"
          :key="c ?? 'all'"
          :to="{ query: c ? { category: c } : {} }"
          class="rounded-full border px-4 py-1.5 text-sm"
          :class="c === category
            ? 'border-stone-900 bg-stone-900 text-white'
            : 'border-stone-300 text-stone-700 hover:border-stone-900'"
        >
          {{ c ? t(`home.categories.${c}`) : t('shop.all') }}
        </NuxtLink>
      </nav>

      <label class="flex items-center gap-2 text-sm text-stone-600">
        {{ t('shop.sort.label') }}
        <select v-model="sort" class="rounded-md border border-stone-300 bg-white px-2 py-1.5 text-stone-900">
          <option v-for="option in sortOptions" :key="option" :value="option">
            {{ t(`shop.sort.${option}`) }}
          </option>
        </select>
      </label>
    </div>

    <!-- Loading -->
    <div v-if="status === 'pending'" class="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-4">
      <div v-for="n in 8" :key="n" class="animate-pulse">
        <div class="aspect-[3/4] rounded-xl bg-stone-200" />
        <div class="mt-3 h-3 w-1/3 rounded bg-stone-200" />
        <div class="mt-2 h-4 w-2/3 rounded bg-stone-200" />
      </div>
    </div>

    <!-- Error -->
    <div v-else-if="status === 'error'" class="mt-12 rounded-2xl bg-red-50 p-8 text-center">
      <p class="text-red-800">{{ t('shop.error') }}</p>
      <button
        type="button"
        class="mt-4 rounded-full bg-stone-900 px-5 py-2 text-sm font-semibold text-white hover:bg-stone-700"
        @click="refresh()"
      >
        {{ t('shop.retry') }}
      </button>
    </div>

    <!-- Empty -->
    <p v-else-if="!sortedProducts.length" class="mt-12 text-center text-stone-600">
      {{ t('shop.empty') }}
    </p>

    <!-- Products -->
    <template v-else>
      <p class="mt-6 text-sm text-stone-500">{{ t('shop.count', sortedProducts.length) }}</p>
      <div class="mt-4 grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-4">
        <ProductCard v-for="product in sortedProducts" :key="product.id" :product="product" />
      </div>
    </template>
  </main>
</template>
