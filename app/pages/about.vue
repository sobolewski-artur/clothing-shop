<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()

useHead({ title: () => t('about.title') })

const values = ['quality', 'sustainable', 'local']

const stats = [
  { value: '8', key: 'years' },
  { value: '25 000+', key: 'customers' },
  { value: '600+', key: 'products' }
]

const gallery = [
  { image: '1490481651871-ab68de25d43d', alt: 'alt1' },
  { image: '1551232864-3f0890e580d9', alt: 'alt2' },
  { image: '1523381210434-271e8be1f52b', alt: 'alt3' }
]
</script>

<template>
  <main>
    <!-- Hero -->
    <section class="relative isolate overflow-hidden">
      <img
        :src="unsplash('1441986300917-64674bd600d8', 1920)"
        :alt="t('about.hero.alt')"
        class="absolute inset-0 -z-10 h-full w-full object-cover"
        fetchpriority="high"
      >
      <div class="absolute inset-0 -z-10 bg-black/55" />
      <div class="mx-auto max-w-6xl px-4 py-24 text-center sm:py-32">
        <p class="text-sm font-medium uppercase tracking-widest text-amber-200">{{ t('about.title') }}</p>
        <h1 class="mx-auto mt-3 max-w-2xl text-4xl font-bold leading-tight text-white sm:text-5xl">
          {{ t('about.hero.title') }}
        </h1>
        <p class="mx-auto mt-4 max-w-xl text-lg text-stone-200">{{ t('about.hero.text') }}</p>
      </div>
    </section>

    <!-- Story -->
    <section class="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 md:grid-cols-2">
      <div>
        <h2 class="text-3xl font-bold">{{ t('about.story.title') }}</h2>
        <p class="mt-4 leading-relaxed text-stone-700">{{ t('about.story.p1') }}</p>
        <p class="mt-4 leading-relaxed text-stone-700">{{ t('about.story.p2') }}</p>
      </div>
      <img
        :src="unsplash('1558769132-cb1aea458c5e', 900)"
        :alt="t('about.story.alt')"
        loading="lazy"
        class="aspect-[4/3] w-full rounded-3xl object-cover"
      >
    </section>

    <!-- Values -->
    <section class="bg-stone-50">
      <div class="mx-auto max-w-6xl px-4 py-16">
        <h2 class="text-center text-3xl font-bold">{{ t('about.values.title') }}</h2>
        <div class="mt-10 grid gap-6 sm:grid-cols-3">
          <div v-for="(v, i) in values" :key="v" class="rounded-2xl bg-white p-6 shadow-sm">
            <span class="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 font-semibold text-amber-800">
              {{ i + 1 }}
            </span>
            <h3 class="mt-4 text-lg font-semibold">{{ t(`about.values.${v}`) }}</h3>
            <p class="mt-2 text-stone-600">{{ t(`about.values.${v}Text`) }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Stats -->
    <section class="mx-auto grid max-w-6xl gap-8 px-4 py-16 text-center sm:grid-cols-3">
      <div v-for="s in stats" :key="s.key">
        <p class="text-4xl font-bold">{{ s.value }}</p>
        <p class="mt-1 text-stone-600">{{ t(`about.stats.${s.key}`) }}</p>
      </div>
    </section>

    <!-- Gallery -->
    <section class="mx-auto max-w-6xl px-4 pb-16">
      <h2 class="text-2xl font-bold">{{ t('about.gallery.title') }}</h2>
      <div class="mt-6 grid gap-4 sm:grid-cols-3">
        <img
          v-for="g in gallery"
          :key="g.image"
          :src="unsplash(g.image, 700)"
          :alt="t(`about.gallery.${g.alt}`)"
          loading="lazy"
          class="aspect-square w-full rounded-2xl object-cover"
        >
      </div>
    </section>

    <!-- CTA -->
    <section class="bg-stone-900">
      <div class="mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 py-14 text-center">
        <h2 class="text-2xl font-bold text-white sm:text-3xl">{{ t('about.cta.title') }}</h2>
        <NuxtLink
          :to="localePath('/products')"
          class="rounded-full bg-white px-6 py-3 text-sm font-semibold text-stone-900 hover:bg-stone-100"
        >
          {{ t('about.cta.button') }}
        </NuxtLink>
      </div>
    </section>
  </main>
</template>
