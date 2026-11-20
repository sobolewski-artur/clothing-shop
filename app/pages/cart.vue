<script setup lang="ts">
const { t } = useI18n()

useSeoMeta({
  title: () => t('cart.title'),
  robots: 'noindex'
})
</script>

<template>
  <main class="mx-auto max-w-6xl px-4 py-12">
    <h1 class="text-3xl font-bold">{{ t('cart.title') }}</h1>
    <!-- The cart is stored in the browser, so it can only be shown there. -->
    <ClientOnly>
      <CartView />
      <template #fallback>
        <CartSkeleton />
      </template>
    </ClientOnly>
  </main>
</template>
