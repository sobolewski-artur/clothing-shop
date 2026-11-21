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

// Burger menu, shown below the md breakpoint (768px).
const menuOpen = ref(false)
const menuButton = ref<HTMLButtonElement>()
const menuPanel = ref<HTMLElement>()

function closeMenu(returnFocus = false) {
  if (!menuOpen.value) return
  menuOpen.value = false
  if (returnFocus) menuButton.value?.focus()
}

// Close as soon as any link in the menu is tapped (pages, language). The route only
// changes once the next page has loaded its data, which can take a moment.
function onMenuClick(event: MouseEvent) {
  if ((event.target as Element).closest('a')) closeMenu()
}
// ...and after any other navigation (e.g. browser back).
watch(() => route.fullPath, () => closeMenu())

watch(menuOpen, async (open) => {
  if (!import.meta.client) return
  // Stop the page behind the menu from scrolling.
  document.documentElement.classList.toggle('overflow-hidden', open)
  if (open) {
    await nextTick()
    menuPanel.value?.querySelector<HTMLElement>('a')?.focus()
  }
})

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') closeMenu(true)
}

// The menu has no meaning on wide screens: close it if the window grows past md.
let desktop: MediaQueryList | undefined
const onBreakpoint = (event: MediaQueryListEvent) => { if (event.matches) closeMenu() }

onMounted(() => {
  document.addEventListener('keydown', onKeydown)
  desktop = window.matchMedia('(min-width: 48rem)')
  desktop.addEventListener('change', onBreakpoint)
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeydown)
  desktop?.removeEventListener('change', onBreakpoint)
  document.documentElement.classList.remove('overflow-hidden')
})
</script>

<template>
  <header class="sticky top-0 z-20 border-b border-stone-200 bg-white/90 backdrop-blur">
    <div class="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
      <NuxtLink :to="localePath('/')" class="truncate text-lg font-semibold tracking-tight">
        {{ $t('brand') }}
      </NuxtLink>

      <div class="flex items-center gap-2 md:gap-5">
        <!-- Desktop navigation -->
        <nav class="hidden items-center gap-5 text-sm md:flex" :aria-label="$t('nav.main')">
          <NuxtLink
            v-for="link in links"
            :key="link.to"
            :to="localePath(link.to)"
            :aria-current="isActive(link.to) ? 'page' : undefined"
            :class="isActive(link.to) ? 'font-medium text-stone-900' : 'text-stone-600 hover:text-stone-900'"
          >
            {{ $t(link.label) }}
          </NuxtLink>
        </nav>

        <!-- Cart: always visible. Icon only on small screens, with the label on desktop.
             The count comes from the browser, so it is rendered only there. -->
        <NuxtLink
          :to="localePath('/cart')"
          class="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm md:py-1"
          :class="isActive('/cart') ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-900 hover:bg-stone-200'"
          :aria-current="isActive('/cart') ? 'page' : undefined"
        >
          <svg class="size-5 md:hidden" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M6 7h12l-1 13H7L6 7Z" />
            <path d="M9 7V6a3 3 0 0 1 6 0v1" />
          </svg>
          <span class="sr-only md:not-sr-only">{{ $t('cart.label') }}</span>
          <ClientOnly>
            <span
              v-if="cartCount"
              class="min-w-5 rounded-full px-1.5 text-center text-xs font-semibold leading-5"
              :class="isActive('/cart') ? 'bg-white text-stone-900' : 'bg-stone-900 text-white'"
            >{{ cartCount }}</span>
          </ClientOnly>
        </NuxtLink>

        <div class="hidden md:block">
          <LanguageSwitcher />
        </div>

        <!-- Burger button (small screens) -->
        <button
          ref="menuButton"
          type="button"
          class="inline-flex size-10 items-center justify-center rounded-full text-stone-900 hover:bg-stone-100 md:hidden"
          :aria-expanded="menuOpen"
          aria-controls="site-menu"
          :aria-label="menuOpen ? $t('nav.closeMenu') : $t('nav.openMenu')"
          @click="menuOpen = !menuOpen"
        >
          <svg class="size-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true">
            <template v-if="menuOpen">
              <path d="M6 6l12 12M18 6L6 18" />
            </template>
            <template v-else>
              <path d="M4 7h16M4 12h16M4 17h16" />
            </template>
          </svg>
        </button>
      </div>
    </div>

    <!-- Mobile menu: drops down under the header over a dimmed page; tap outside to close. -->
    <Transition
      enter-active-class="transition duration-150 ease-out"
      enter-from-class="opacity-0"
      leave-active-class="transition duration-100 ease-in"
      leave-to-class="opacity-0"
    >
      <div
        v-if="menuOpen"
        class="absolute inset-x-0 top-full h-[100dvh] bg-stone-900/30 md:hidden"
        @click.self="closeMenu()"
      >
        <nav
          id="site-menu"
          ref="menuPanel"
          class="border-b border-stone-200 bg-white px-4 pb-6 pt-2 shadow-lg"
          :aria-label="$t('nav.main')"
          @click="onMenuClick"
        >
          <ul class="divide-y divide-stone-100">
            <li v-for="link in links" :key="link.to">
              <NuxtLink
                :to="localePath(link.to)"
                class="flex items-center justify-between py-4 text-lg"
                :class="isActive(link.to) ? 'font-semibold text-stone-900' : 'text-stone-700'"
                :aria-current="isActive(link.to) ? 'page' : undefined"
              >
                {{ $t(link.label) }}
                <span v-if="isActive(link.to)" class="size-2 rounded-full bg-stone-900" aria-hidden="true" />
              </NuxtLink>
            </li>
          </ul>
          <div class="mt-4 flex items-center justify-between border-t border-stone-200 pt-4">
            <span class="text-sm text-stone-500">{{ $t('language') }}</span>
            <LanguageSwitcher />
          </div>
        </nav>
      </div>
    </Transition>
  </header>
</template>
