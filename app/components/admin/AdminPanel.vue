<script setup lang="ts">
const { t } = useI18n()
const session = useAdminSession()
const { user, isAdmin, ready } = session

type Tab = 'orders' | 'products'
const tab = ref<Tab>('orders')
const tabs: Tab[] = ['orders', 'products']
</script>

<template>
  <p v-if="!ready" class="py-20 text-center text-stone-500">{{ t('admin.loading') }}</p>

  <AdminLogin v-else-if="!user" :session="session" />

  <!-- Signed in, but not an admin -->
  <div v-else-if="!isAdmin" class="mx-auto max-w-md py-16 text-center">
    <h1 class="text-2xl font-bold">{{ t('admin.noAccess.title') }}</h1>
    <p class="mt-3 text-stone-600">{{ t('admin.noAccess.text', { email: user.email ?? '' }) }}</p>
    <button
      type="button"
      class="mt-6 rounded-full bg-stone-900 px-5 py-2 text-sm font-semibold text-white hover:bg-stone-700"
      @click="session.signOut()"
    >
      {{ t('admin.signOut') }}
    </button>
  </div>

  <div v-else>
    <header class="flex flex-wrap items-center justify-between gap-4">
      <h1 class="text-3xl font-bold">{{ t('admin.title') }}</h1>
      <div class="flex items-center gap-3 text-sm text-stone-600">
        <span>{{ user.email }}</span>
        <button type="button" class="underline hover:text-stone-900" @click="session.signOut()">
          {{ t('admin.signOut') }}
        </button>
      </div>
    </header>

    <div class="mt-6 flex gap-2 border-b border-stone-200" role="tablist">
      <button
        v-for="name in tabs"
        :key="name"
        type="button"
        role="tab"
        :aria-selected="tab === name"
        class="-mb-px border-b-2 px-4 py-2 text-sm font-medium"
        :class="tab === name ? 'border-stone-900 text-stone-900' : 'border-transparent text-stone-500 hover:text-stone-900'"
        @click="tab = name"
      >
        {{ t(`admin.tabs.${name}`) }}
      </button>
    </div>

    <AdminOrders v-if="tab === 'orders'" :session="session" />
    <AdminProducts v-else :session="session" />
  </div>
</template>
