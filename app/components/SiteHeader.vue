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
        <!-- The cart is restored from the browser, so render the count only there. -->
        <ClientOnly>
          <span
            v-if="cartCount"
            class="rounded-full bg-stone-100 px-3 py-1 text-stone-900"
            :aria-label="$t('cart.label') + ': ' + cartCount"
          >
            {{ $t('cart.label') }} ({{ cartCount }})
          </span>
        </ClientOnly>
        <LanguageSwitcher />
      </nav>
    </div>
  </header>
</template>
