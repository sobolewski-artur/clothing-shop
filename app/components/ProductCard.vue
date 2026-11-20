<script setup lang="ts">
import { localized, type Product } from '~/utils/products'

const props = defineProps<{ product: Product }>()
const { t, locale } = useI18n()

const name = computed(() => localized(props.product.name, locale.value))
</script>

<template>
  <article class="group">
    <div class="aspect-[3/4] overflow-hidden rounded-xl bg-stone-200">
      <img
        :src="product.image"
        :alt="name"
        loading="lazy"
        class="h-full w-full object-cover transition duration-500 group-hover:scale-105"
      >
    </div>
    <p class="mt-3 text-xs uppercase tracking-wide text-stone-500">
      {{ t(`home.categories.${product.category}`) }}
    </p>
    <h3 class="mt-1 text-sm font-medium">{{ name }}</h3>
    <p class="mt-1 text-sm text-stone-600">{{ formatPrice(product.price, locale) }}</p>
  </article>
</template>
