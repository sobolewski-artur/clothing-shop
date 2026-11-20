<script setup lang="ts">
const head = useLocaleHead()
const { t } = useI18n()

useHead({
  titleTemplate: (title) => (title ? `${title} · ${t('brand')}` : t('brand'))
})
</script>

<template>
  <Html :lang="head.htmlAttrs.lang" :dir="head.htmlAttrs.dir">
    <Head>
      <template v-for="link in head.link" :key="link.key">
        <Link :id="link.key" :rel="link.rel" :href="link.href" :hreflang="link.hreflang" />
      </template>
      <template v-for="meta in head.meta" :key="meta.key">
        <Meta :id="meta.key" :property="meta.property" :content="meta.content" />
      </template>
    </Head>
    <Body class="flex min-h-screen flex-col bg-white text-stone-900 antialiased">
      <NuxtRouteAnnouncer />
      <SiteHeader />
      <div class="flex-1">
        <NuxtPage />
      </div>
      <SiteFooter />
    </Body>
  </Html>
</template>
