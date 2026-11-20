<script setup lang="ts">
import { doc, getDoc } from 'firebase/firestore'
import { ONE_SIZE, localized, toProduct, type Product } from '~/utils/products'
import { FREE_SHIPPING_THRESHOLD, SHIPPING_COST, toCents } from '~/utils/cart'
import { MAX_QUANTITY } from '~/composables/useCart'

// Rendered inside <ClientOnly>: the cart only exists in the visitor's browser.
const { t, locale } = useI18n()
const localePath = useLocalePath()
const { $firestore } = useNuxtApp()
const cart = useCart()

/** Loaded products by ID; null = no longer in Firestore. */
const products = ref<Record<string, Product | null>>({})
const loading = ref(false)
const loadFailed = ref(false)

async function loadMissingProducts() {
  const missing = [...new Set(cart.items.value.map(item => item.productId))]
    .filter(id => !(id in products.value))
  if (!missing.length) return

  loading.value = true
  loadFailed.value = false
  try {
    const snapshots = await Promise.all(missing.map(id => getDoc(doc($firestore, 'products', id))))
    for (const snap of snapshots) {
      products.value[snap.id] = snap.exists() ? toProduct(snap.id, snap.data()) : null
    }
  } catch {
    loadFailed.value = true
  } finally {
    loading.value = false
  }
}

watch(() => cart.items.value.map(item => item.productId).join(), loadMissingProducts, { immediate: true })

const lines = computed(() => cart.items.value.map(item => {
  const product = products.value[item.productId]
  return {
    ...item,
    key: `${item.productId}:${item.size}`,
    product,
    name: product ? localized(product.name, locale.value) : '',
    totalCents: product ? toCents(product.price) * item.quantity : 0
  }
}))

const subtotalCents = computed(() => lines.value.reduce((sum, line) => sum + line.totalCents, 0))
const shippingCents = computed(() =>
  subtotalCents.value >= toCents(FREE_SHIPPING_THRESHOLD) ? 0 : toCents(SHIPPING_COST))
const totalCents = computed(() => subtotalCents.value + shippingCents.value)
const missingForFreeShipping = computed(() => toCents(FREE_SHIPPING_THRESHOLD) - subtotalCents.value)

const price = (cents: number) => formatPrice(cents / 100, locale.value)
const sizeLabel = (size: string) => (size === ONE_SIZE ? t('product.oneSize') : size)
const isReady = computed(() => cart.items.value.every(item => item.productId in products.value))
</script>

<template>
  <!-- Empty -->
  <div v-if="!cart.items.value.length" class="mt-10 rounded-2xl bg-stone-50 p-10 text-center">
    <p class="text-stone-600">{{ t('cart.empty') }}</p>
    <NuxtLink
      :to="localePath('/products')"
      class="mt-6 inline-block rounded-full bg-stone-900 px-6 py-3 text-sm font-semibold text-white hover:bg-stone-700"
    >
      {{ t('cart.emptyCta') }}
    </NuxtLink>
  </div>

  <!-- Error -->
  <div v-else-if="loadFailed" class="mt-10 rounded-2xl bg-red-50 p-8 text-center">
    <p class="text-red-800">{{ t('cart.error') }}</p>
    <button
      type="button"
      class="mt-4 rounded-full bg-stone-900 px-5 py-2 text-sm font-semibold text-white hover:bg-stone-700"
      @click="loadMissingProducts"
    >
      {{ t('shop.retry') }}
    </button>
  </div>

  <!-- Loading -->
  <CartSkeleton v-else-if="loading && !isReady" />

  <!-- Items + summary -->
  <div v-else class="mt-8 grid gap-10 lg:grid-cols-[1fr_20rem]">
    <ul class="divide-y divide-stone-200 border-y border-stone-200">
      <li v-for="line in lines" :key="line.key" class="flex gap-4 py-5">
        <template v-if="line.product">
          <NuxtLink :to="localePath(`/products/${line.productId}`)" class="shrink-0">
            <img :src="line.product.image" :alt="line.name" class="h-32 w-24 rounded-lg object-cover">
          </NuxtLink>

          <div class="flex flex-1 flex-col">
            <div class="flex justify-between gap-4">
              <div>
                <NuxtLink :to="localePath(`/products/${line.productId}`)" class="font-medium hover:underline">
                  {{ line.name }}
                </NuxtLink>
                <p class="mt-1 text-sm text-stone-500">{{ t('product.size') }}: {{ sizeLabel(line.size) }}</p>
                <p class="mt-1 text-sm text-stone-500">{{ formatPrice(line.product.price, locale) }}</p>
              </div>
              <p class="font-medium">{{ price(line.totalCents) }}</p>
            </div>

            <div class="mt-auto flex items-center justify-between pt-3">
              <div class="flex items-center rounded-full border border-stone-300" role="group" :aria-label="t('cart.quantity')">
                <button
                  type="button"
                  class="flex h-9 w-9 items-center justify-center rounded-full text-lg hover:bg-stone-100"
                  :aria-label="t('cart.decrease')"
                  @click="cart.setQuantity(line.productId, line.size, line.quantity - 1)"
                >
                  −
                </button>
                <span class="w-8 text-center text-sm" aria-live="polite">{{ line.quantity }}</span>
                <button
                  type="button"
                  class="flex h-9 w-9 items-center justify-center rounded-full text-lg hover:bg-stone-100 disabled:opacity-30 disabled:hover:bg-transparent"
                  :aria-label="t('cart.increase')"
                  :disabled="line.quantity >= MAX_QUANTITY"
                  @click="cart.setQuantity(line.productId, line.size, line.quantity + 1)"
                >
                  +
                </button>
              </div>
              <button
                type="button"
                class="text-sm text-stone-500 underline-offset-2 hover:text-stone-900 hover:underline"
                @click="cart.remove(line.productId, line.size)"
              >
                {{ t('cart.remove') }}
              </button>
            </div>
          </div>
        </template>

        <!-- Product was removed from the shop -->
        <div v-else class="flex flex-1 items-center justify-between gap-4 text-sm">
          <p class="text-stone-500">{{ t('cart.unavailable') }}</p>
          <button type="button" class="underline" @click="cart.remove(line.productId, line.size)">
            {{ t('cart.remove') }}
          </button>
        </div>
      </li>
    </ul>

    <aside class="h-fit rounded-2xl bg-stone-50 p-6">
      <h2 class="text-lg font-semibold">{{ t('cart.summary') }}</h2>
      <dl class="mt-4 space-y-2 text-sm">
        <div class="flex justify-between">
          <dt class="text-stone-600">{{ t('cart.subtotal') }}</dt>
          <dd>{{ price(subtotalCents) }}</dd>
        </div>
        <div class="flex justify-between">
          <dt class="text-stone-600">{{ t('cart.shipping') }}</dt>
          <dd>{{ shippingCents ? price(shippingCents) : t('cart.free') }}</dd>
        </div>
        <div class="flex justify-between border-t border-stone-200 pt-3 text-base font-semibold">
          <dt>{{ t('cart.total') }}</dt>
          <dd>{{ price(totalCents) }}</dd>
        </div>
      </dl>
      <p v-if="missingForFreeShipping > 0" class="mt-4 text-sm text-stone-600">
        {{ t('cart.freeShippingHint', { amount: price(missingForFreeShipping) }) }}
      </p>
      <NuxtLink
        :to="localePath('/products')"
        class="mt-6 block text-center text-sm text-stone-600 underline-offset-2 hover:text-stone-900 hover:underline"
      >
        {{ t('cart.continue') }}
      </NuxtLink>
    </aside>
  </div>
</template>
