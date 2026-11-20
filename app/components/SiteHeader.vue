<script setup lang="ts">
const localePath = useLocalePath()
const route = useRoute()
const { count: cartCount } = useCart()

const links = [
  { to: '/', label: 'nav.home' },
  { to: '/products', label: 'nav.products' },
  { to: '/about', label: 'nav.about' }
]

// Compare paths only, so "/products?category=men" still highlights "Shop".
const isActive = (to: string) => route.path === localePath(to)
</script>

<template>
  <header class="sticky top-0 z-20 border-b border-stone-200 bg-white/90 backdrop-blur">
    <div class="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
      <NuxtLink :to="localePath('/')" class="text-lg font-semibold tracking-tight">
        {{ $t('brand') }}
      </NuxtLink>
      <nav class="flex items-center gap-5 text-sm">
        <NuxtLink
          v-for="link in links"
          :key="link.to"
          :to="localePath(link.to)"
          :class="isActive(link.to) ? 'font-medium text-stone-900' : 'text-stone-600 hover:text-stone-900'"
        >
          {{ $t(link.label) }}
        </NuxtLink>
        <!-- The cart is restored from the browser, so the count is rendered only there. -->
        <NuxtLink
          :to="localePath('/cart')"
          class="rounded-full px-3 py-1"
          :class="isActive('/cart') ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-900 hover:bg-stone-200'"
        >
          {{ $t('cart.label') }}<ClientOnly><span v-if="cartCount"> ({{ cartCount }})</span></ClientOnly>
        </NuxtLink>
        <LanguageSwitcher />
      </nav>
    </div>
  </header>
</template>
