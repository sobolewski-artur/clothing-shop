<script setup lang="ts">
import { ORDER_STATUSES, type OrderStatus, type StoredOrder } from '#shared/types/orders'

const props = defineProps<{
  session: ReturnType<typeof useAdminSession>
  order: StoredOrder
}>()
const emit = defineEmits<{ updated: [order: StoredOrder] }>()
const { t } = useI18n()

const status = ref<OrderStatus>(props.order.status)
const notify = ref(true)
const saving = ref(false)
const message = ref('')
const failed = ref(false)

const canNotify = computed(() => status.value !== 'new')
const changed = computed(() => status.value !== props.order.status)

async function save() {
  saving.value = true
  message.value = ''
  failed.value = false
  try {
    const updated = await props.session.adminFetch<StoredOrder>(`/api/admin/orders/${props.order.number}`, {
      method: 'PATCH',
      body: { status: status.value, notify: notify.value && canNotify.value }
    })
    emit('updated', updated)
    message.value = notify.value && canNotify.value ? t('admin.orders.savedNotified') : t('admin.orders.saved')
  } catch {
    failed.value = true
    message.value = t('admin.orders.saveFailed')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <form class="mt-4 rounded-lg border border-stone-200 bg-white p-3" @submit.prevent="save">
    <label :for="`status-${order.number}`" class="block text-sm font-semibold">{{ t('admin.orders.changeStatus') }}</label>
    <select
      :id="`status-${order.number}`"
      v-model="status"
      class="mt-2 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm"
    >
      <option v-for="s in ORDER_STATUSES" :key="s" :value="s">{{ t(`admin.status.${s}`) }}</option>
    </select>
    <label class="mt-2 flex items-center gap-2 text-sm" :class="canNotify ? '' : 'text-stone-400'">
      <input v-model="notify" type="checkbox" :disabled="!canNotify" class="accent-stone-900">
      {{ t('admin.orders.notify') }}
    </label>
    <button
      type="submit"
      class="mt-3 w-full rounded-full bg-stone-900 px-4 py-2 text-sm font-semibold text-white hover:bg-stone-700 disabled:opacity-40"
      :disabled="saving || !changed"
    >
      {{ saving ? t('admin.product.saving') : t('admin.orders.saveStatus') }}
    </button>
    <p aria-live="polite" class="mt-2 text-sm" :class="failed ? 'text-red-700' : 'text-green-700'">{{ message }}</p>
  </form>
</template>
