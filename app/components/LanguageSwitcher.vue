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
      class="rounded-md px-2.5 py-1.5"
      :class="l.code === locale ? 'bg-stone-900 text-white' : 'text-stone-700 hover:bg-stone-100'"
      :aria-current="l.code === locale ? 'true' : undefined"
    >
      {{ l.name }}
    </NuxtLink>
  </nav>
</template>
