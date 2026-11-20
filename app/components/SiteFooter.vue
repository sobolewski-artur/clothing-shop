<script setup lang="ts">
const localePath = useLocalePath()
</script>

<template>
  <footer class="border-t border-stone-200 bg-stone-50">
    <div class="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 text-sm text-stone-500 sm:flex-row sm:justify-between">
      <div>
        <p>© {{ new Date().getFullYear() }} {{ $t('brand') }}. {{ $t('footer.rights') }}</p>
        <p class="mt-1">{{ $t('footer.creator', { name: 'Artur Sobolewski' }) }}</p>
      </div>
      <div class="flex flex-wrap gap-x-6 gap-y-2">
        <NuxtLink :to="localePath('/terms')" class="hover:text-stone-900 hover:underline">{{ $t('footer.terms') }}</NuxtLink>
        <p>{{ $t('footer.photos') }}</p>
      </div>
    </div>
  </footer>
</template>
