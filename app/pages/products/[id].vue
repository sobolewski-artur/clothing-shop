<script setup lang="ts">
import { ONE_SIZE } from '#shared/types/products'
import { localized } from '~/utils/products'

const { t, locale } = useI18n()
const route = useRoute()
const localePath = useLocalePath()
const cart = useCart()

const id = computed(() => String(route.params.id))
const { data: product, error } = await useProduct(id)

if (error.value) {
  throw createError({ statusCode: 500, statusMessage: t('shop.error'), fatal: true })
}
if (!product.value) {
  throw createError({ statusCode: 404, statusMessage: t('product.notFound'), fatal: true })
}

const name = computed(() => localized(product.value?.name, locale.value))
const description = computed(() => localized(product.value?.description, locale.value))

useSeoMeta({
  title: name,
  description,
  ogImage: () => product.value?.image
})

const sizeLabel = (size: string) => (size === ONE_SIZE ? t('product.oneSize') : size)

// Preselect when there is only one size to choose from.
const selectedSize = ref<string | undefined>(
  product.value.sizes.length === 1 ? product.value.sizes[0] : undefined
)
const showSizeError = ref(false)
const addedSize = ref<string>()

watch(selectedSize, () => {
  showSizeError.value = false
  addedSize.value = undefined
})

function addToCart() {
  if (!product.value) return
  if (!selectedSize.value) {
    showSizeError.value = true
    return
  }
  cart.add(product.value.id, selectedSize.value)
  addedSize.value = selectedSize.value
}
</script>

<template>
  <main v-if="product" class="mx-auto max-w-6xl px-4 py-10">
    <nav class="text-sm text-stone-500" :aria-label="t('product.breadcrumb')">
      <NuxtLink :to="localePath('/products')" class="hover:text-stone-900">{{ t('shop.title') }}</NuxtLink>
      <span class="mx-2">/</span>
      <NuxtLink
        :to="{ path: localePath('/products'), query: { category: product.category } }"
        class="hover:text-stone-900"
      >
        {{ t(`home.categories.${product.category}`) }}
      </NuxtLink>
    </nav>

    <div class="mt-6 grid gap-10 md:grid-cols-2">
      <div class="aspect-[3/4] overflow-hidden rounded-2xl bg-stone-200">
        <img :src="product.image" :alt="name" class="h-full w-full object-cover" fetchpriority="high">
      </div>

      <div class="md:py-4">
        <h1 class="text-3xl font-bold">{{ name }}</h1>
        <p class="mt-2 text-xl text-stone-700">{{ formatPrice(product.price, locale) }}</p>
        <p class="mt-6 leading-relaxed text-stone-700">{{ description }}</p>

        <fieldset class="mt-8">
          <legend class="text-sm font-medium">
            {{ t('product.size') }}<span v-if="selectedSize" class="font-normal text-stone-500">: {{ sizeLabel(selectedSize) }}</span>
          </legend>
          <div class="mt-3 flex flex-wrap gap-2">
            <label v-for="size in product.sizes" :key="size" class="cursor-pointer">
              <input v-model="selectedSize" type="radio" name="size" :value="size" class="peer sr-only">
              <span
                class="flex h-11 min-w-11 items-center justify-center rounded-md border border-stone-300 px-3 text-sm transition
                       hover:border-stone-900 peer-checked:border-stone-900 peer-checked:bg-stone-900 peer-checked:text-white
                       peer-focus-visible:ring-2 peer-focus-visible:ring-stone-900 peer-focus-visible:ring-offset-2"
              >
                {{ sizeLabel(size) }}
              </span>
            </label>
          </div>
        </fieldset>

        <button
          type="button"
          class="mt-8 w-full rounded-full bg-stone-900 px-6 py-3.5 text-sm font-semibold text-white hover:bg-stone-700 sm:w-auto sm:px-10"
          @click="addToCart"
        >
          {{ t('product.addToCart') }}
        </button>

        <p aria-live="polite" class="mt-3 min-h-6 text-sm">
          <span v-if="showSizeError" class="text-red-700">{{ t('product.chooseSize') }}</span>
          <span v-else-if="addedSize" class="text-green-700">
            {{ addedSize === ONE_SIZE ? t('product.addedOneSize') : t('product.added', { size: addedSize }) }}
          </span>
        </p>
      </div>
    </div>
  </main>
</template>
