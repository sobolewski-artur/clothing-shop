<script setup lang="ts">
const props = defineProps<{ session: ReturnType<typeof useAdminSession> }>()
const { t } = useI18n()

const email = ref('')
const password = ref('')
const busy = ref(false)
const error = ref('')

async function run(action: () => Promise<unknown>) {
  busy.value = true
  error.value = ''
  try {
    await action()
  } catch (e) {
    const code = (e as { code?: string }).code ?? ''
    error.value = code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request'
      ? ''
      : code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found'
        ? t('admin.login.wrongCredentials')
        : code === 'auth/too-many-requests'
          ? t('admin.login.tooMany')
          : t('admin.login.failed')
  } finally {
    busy.value = false
  }
}

const signInWithEmail = () => run(() => props.session.signInWithEmail(email.value.trim(), password.value))
const signInWithGoogle = () => run(() => props.session.signInWithGoogle())
</script>

<template>
  <div class="mx-auto max-w-sm py-12">
    <h1 class="text-center text-2xl font-bold">{{ t('admin.login.title') }}</h1>

    <form class="mt-8 space-y-4" @submit.prevent="signInWithEmail">
      <div>
        <label for="admin-email" class="block text-sm font-medium">{{ t('checkout.fields.email') }}</label>
        <input
          id="admin-email"
          v-model="email"
          type="email"
          autocomplete="username"
          required
          class="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2.5 text-sm outline-none focus:border-stone-900 focus:ring-1 focus:ring-stone-900"
        >
      </div>
      <div>
        <label for="admin-password" class="block text-sm font-medium">{{ t('admin.login.password') }}</label>
        <input
          id="admin-password"
          v-model="password"
          type="password"
          autocomplete="current-password"
          required
          class="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2.5 text-sm outline-none focus:border-stone-900 focus:ring-1 focus:ring-stone-900"
        >
      </div>
      <button
        type="submit"
        :disabled="busy"
        class="w-full rounded-full bg-stone-900 px-6 py-3 text-sm font-semibold text-white hover:bg-stone-700 disabled:opacity-50"
      >
        {{ t('admin.login.submit') }}
      </button>
    </form>

    <div class="my-6 flex items-center gap-3 text-xs uppercase text-stone-400">
      <span class="h-px flex-1 bg-stone-200" />{{ t('admin.login.or') }}<span class="h-px flex-1 bg-stone-200" />
    </div>

    <button
      type="button"
      :disabled="busy"
      class="w-full rounded-full border border-stone-300 px-6 py-3 text-sm font-semibold hover:border-stone-900 disabled:opacity-50"
      @click="signInWithGoogle"
    >
      {{ t('admin.login.google') }}
    </button>

    <p aria-live="assertive" class="mt-4 min-h-5 text-center text-sm text-red-700">{{ error }}</p>
  </div>
</template>
