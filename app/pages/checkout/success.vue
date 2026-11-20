<script setup lang="ts">
import { ORDER_NUMBER_PATTERN } from '#shared/types/orders'

const { t, locale } = useI18n()
const route = useRoute()
const localePath = useLocalePath()
const { bankAccount, bankRecipient } = useRuntimeConfig().public.shop

useSeoMeta({
  title: () => t('checkout.success.title'),
  robots: 'noindex'
})

const number = computed(() => {
  const value = String(route.query.number ?? '')
  return ORDER_NUMBER_PATTERN.test(value) ? value : ''
})

// Details are only known right after ordering (not after a page reload).
const lastOrder = useLastOrder()
const order = computed(() => (lastOrder.value?.number === number.value ? lastOrder.value : null))
</script>

<template>
  <main class="mx-auto max-w-2xl px-4 py-16 text-center">
    <div class="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-2xl text-green-800" aria-hidden="true">
      ✓
    </div>
    <h1 class="mt-6 text-3xl font-bold">{{ t('checkout.success.title') }}</h1>

    <p v-if="number" class="mt-4 text-stone-700">
      {{ t('checkout.success.number') }}
      <strong class="font-mono text-stone-900">{{ number }}</strong>
    </p>
    <p class="mt-2 text-stone-600">{{ t('checkout.success.saveNumber') }}</p>

    <!-- Bank transfer details -->
    <section v-if="order?.payment === 'transfer'" class="mt-10 rounded-2xl bg-stone-50 p-6 text-left">
      <h2 class="font-semibold">{{ t('checkout.success.transferTitle') }}</h2>
      <dl class="mt-4 space-y-2 text-sm">
        <div class="flex justify-between gap-4">
          <dt class="text-stone-600">{{ t('checkout.success.amount') }}</dt>
          <dd class="font-medium">{{ formatPrice(order.total, locale) }}</dd>
        </div>
        <div class="flex justify-between gap-4">
          <dt class="text-stone-600">{{ t('checkout.success.transferReference') }}</dt>
          <dd class="font-mono">{{ order.number }}</dd>
        </div>
        <template v-if="bankAccount">
          <div v-if="bankRecipient" class="flex justify-between gap-4">
            <dt class="text-stone-600">{{ t('checkout.success.recipient') }}</dt>
            <dd>{{ bankRecipient }}</dd>
          </div>
          <div class="flex justify-between gap-4">
            <dt class="text-stone-600">{{ t('checkout.success.account') }}</dt>
            <dd class="font-mono">{{ bankAccount }}</dd>
          </div>
        </template>
      </dl>
      <p v-if="!bankAccount" class="mt-4 text-sm text-stone-600">{{ t('checkout.success.accountLater') }}</p>
    </section>

    <!-- Cash on delivery -->
    <section v-else-if="order?.payment === 'cod'" class="mt-10 rounded-2xl bg-stone-50 p-6">
      <p>{{ t('checkout.success.codText', { amount: formatPrice(order.total, locale) }) }}</p>
    </section>

    <NuxtLink
      :to="localePath('/products')"
      class="mt-10 inline-block rounded-full bg-stone-900 px-6 py-3 text-sm font-semibold text-white hover:bg-stone-700"
    >
      {{ t('cart.continue') }}
    </NuxtLink>
  </main>
</template>
