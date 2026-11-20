<script setup lang="ts">
// Not linked from the shop. Access is enforced by the server (/api/admin/*),
// which checks the signed-in user's `admin` claim on every request.
const { t } = useI18n()

useSeoMeta({
  title: () => t('admin.title'),
  robots: 'noindex, nofollow'
})
</script>

<template>
  <main class="mx-auto max-w-6xl px-4 py-10">
    <ClientOnly>
      <AdminPanel />
      <template #fallback>
        <p class="py-20 text-center text-stone-500">{{ t('admin.loading') }}</p>
      </template>
    </ClientOnly>
  </main>
</template>
