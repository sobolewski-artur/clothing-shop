<script setup lang="ts">
const { t } = useI18n()

useSeoMeta({
  title: () => t('checkout.title'),
  robots: 'noindex'
})
</script>

<template>
  <main class="mx-auto max-w-6xl px-4 py-12">
    <h1 class="text-3xl font-bold">{{ t('checkout.title') }}</h1>
    <!-- The cart is stored in the browser, so checkout can only be shown there. -->
    <ClientOnly>
      <CheckoutForm />
      <template #fallback>
        <CartSkeleton />
      </template>
    </ClientOnly>
  </main>
</template>
