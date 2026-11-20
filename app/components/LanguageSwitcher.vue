<script setup lang="ts">
const { locale, locales } = useI18n()
const switchLocalePath = useSwitchLocalePath()
</script>

<template>
  <nav class="flex items-center gap-2 text-sm" :aria-label="$t('language')">
    <NuxtLink
      v-for="l in locales"
      :key="l.code"
      :to="switchLocalePath(l.code)"
      class="rounded px-2 py-1"
      :class="l.code === locale ? 'bg-black text-white' : 'hover:bg-gray-100'"
    >
      {{ l.name }}
    </NuxtLink>
  </nav>
</template>
