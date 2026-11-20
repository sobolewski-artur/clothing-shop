<script setup lang="ts">
// Cloudflare Turnstile ("I'm not a robot") widget. Client-only.
// v-model holds the current token ('' when there is none or it expired).
import { loadTurnstile, type TurnstileApi } from '~/utils/turnstile'

const props = defineProps<{ action: string }>()
const token = defineModel<string>({ default: '' })

const { locale, t } = useI18n()
const { siteKey } = useRuntimeConfig().public.turnstile

const container = ref<HTMLElement>()
const loadFailed = ref(false)
let api: TurnstileApi | undefined
let widgetId: string | undefined

onMounted(async () => {
  try {
    api = await loadTurnstile()
  } catch {
    loadFailed.value = true
    return
  }
  if (!container.value) return
  widgetId = api.render(container.value, {
    'sitekey': siteKey,
    'action': props.action,
    'language': locale.value,
    'theme': 'light',
    'size': 'flexible',
    'callback': (value: string) => { token.value = value },
    'expired-callback': () => { token.value = '' },
    'error-callback': () => { token.value = '' }
  })
})

onBeforeUnmount(() => {
  if (api && widgetId) api.remove(widgetId)
})

/** Gets a fresh token: needed after every submit attempt, because tokens are single-use. */
function reset() {
  token.value = ''
  if (api && widgetId) api.reset(widgetId)
}
defineExpose({ reset })
</script>

<template>
  <div>
    <div ref="container" />
    <p v-if="loadFailed" class="text-sm text-red-700">{{ t('checkout.captcha.loadFailed') }}</p>
  </div>
</template>
