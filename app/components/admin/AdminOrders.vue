<script setup lang="ts">
import { ONE_SIZE } from '#shared/types/products'
import type { StoredOrder } from '#shared/types/orders'

const props = defineProps<{ session: ReturnType<typeof useAdminSession> }>()
const { t, locale } = useI18n()

const orders = ref<StoredOrder[]>([])
const loading = ref(false)
const error = ref('')
const expanded = ref<string | null>(null)

async function load() {
  loading.value = true
  error.value = ''
  try {
    orders.value = await props.session.adminFetch<StoredOrder[]>('/api/admin/orders')
  } catch {
    error.value = t('admin.orders.error')
  } finally {
    loading.value = false
  }
}
onMounted(load)

const date = (iso: string) => new Intl.DateTimeFormat(locale.value, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso))
const sizeLabel = (size: string) => (size === ONE_SIZE ? t('product.oneSize') : size)
const toggle = (number: string) => { expanded.value = expanded.value === number ? null : number }
const replaceOrder = (updated: StoredOrder) => {
  orders.value = orders.value.map(order => (order.number === updated.number ? updated : order))
}

const statusClass: Record<string, string> = {
  new: 'bg-amber-100 text-amber-900',
  processing: 'bg-blue-100 text-blue-900',
  shipped: 'bg-violet-100 text-violet-900',
  delivered: 'bg-green-100 text-green-900',
  cancelled: 'bg-stone-200 text-stone-700'
}
</script>

<template>
  <section class="mt-6">
    <div class="flex items-center justify-between">
      <p class="text-sm text-stone-600">{{ t('admin.orders.count', { count: orders.length }) }}</p>
      <button
        type="button"
        class="rounded-full border border-stone-300 px-4 py-1.5 text-sm hover:border-stone-900 disabled:opacity-50"
        :disabled="loading"
        @click="load"
      >
        {{ loading ? t('admin.loading') : t('admin.orders.refresh') }}
      </button>
    </div>

    <p v-if="error" class="mt-6 rounded-xl bg-red-50 p-4 text-sm text-red-800">{{ error }}</p>
    <p v-else-if="!loading && !orders.length" class="mt-10 text-center text-stone-500">{{ t('admin.orders.empty') }}</p>

    <div v-else class="mt-4 overflow-x-auto rounded-xl border border-stone-200">
      <table class="w-full min-w-[720px] text-left text-sm">
        <thead class="bg-stone-50 text-stone-500">
          <tr>
            <th class="px-4 py-3 font-medium">{{ t('admin.orders.number') }}</th>
            <th class="px-4 py-3 font-medium">{{ t('admin.orders.date') }}</th>
            <th class="px-4 py-3 font-medium">{{ t('admin.orders.customer') }}</th>
            <th class="px-4 py-3 font-medium">{{ t('checkout.payment') }}</th>
            <th class="px-4 py-3 font-medium">{{ t('admin.orders.status') }}</th>
            <th class="px-4 py-3 text-right font-medium">{{ t('cart.total') }}</th>
          </tr>
        </thead>
        <tbody>
          <template v-for="order in orders" :key="order.number">
            <tr
              class="cursor-pointer border-t border-stone-200 hover:bg-stone-50"
              :aria-expanded="expanded === order.number"
              tabindex="0"
              @click="toggle(order.number)"
              @keydown.enter="toggle(order.number)"
            >
              <td class="px-4 py-3 font-mono">{{ order.number }}</td>
              <td class="px-4 py-3 whitespace-nowrap">{{ date(order.createdAt) }}</td>
              <td class="px-4 py-3">{{ order.customer.name }}<br><span class="text-stone-500">{{ order.customer.email }}</span></td>
              <td class="px-4 py-3">{{ t(`checkout.methods.${order.customer.payment}`) }}</td>
              <td class="px-4 py-3">
                <span class="rounded-full px-2.5 py-0.5 text-xs font-medium" :class="statusClass[order.status]">
                  {{ t(`admin.status.${order.status}`) }}
                </span>
              </td>
              <td class="px-4 py-3 text-right font-medium whitespace-nowrap">{{ formatPrice(order.total, locale) }}</td>
            </tr>

            <!-- Details -->
            <tr v-if="expanded === order.number" class="bg-stone-50">
              <td colspan="6" class="px-4 py-5">
                <div class="grid gap-6 md:grid-cols-3">
                  <div class="md:col-span-2">
                    <h3 class="font-semibold">{{ t('admin.orders.items') }}</h3>
                    <ul class="mt-2 space-y-1">
                      <li v-for="item in order.items" :key="`${item.id}:${item.size}`" class="flex justify-between gap-4">
                        <span>{{ item.name }} · {{ sizeLabel(item.size) }} · {{ item.quantity }} × {{ formatPrice(item.unitPrice, locale) }}</span>
                        <span>{{ formatPrice(item.total, locale) }}</span>
                      </li>
                    </ul>
                    <dl class="mt-3 space-y-1 border-t border-stone-200 pt-3 text-stone-600">
                      <div class="flex justify-between"><dt>{{ t('cart.subtotal') }}</dt><dd>{{ formatPrice(order.subtotal, locale) }}</dd></div>
                      <div class="flex justify-between"><dt>{{ t('cart.shipping') }}</dt><dd>{{ order.shipping ? formatPrice(order.shipping, locale) : t('cart.free') }}</dd></div>
                      <div class="flex justify-between font-semibold text-stone-900"><dt>{{ t('cart.total') }}</dt><dd>{{ formatPrice(order.total, locale) }}</dd></div>
                    </dl>
                  </div>
                  <div>
                    <h3 class="font-semibold">{{ t('checkout.delivery') }}</h3>
                    <p class="mt-2 leading-relaxed">
                      {{ order.customer.name }}<br>
                      {{ order.customer.street }}<br>
                      {{ order.customer.postalCode }} {{ order.customer.city }}<br>
                      {{ order.customer.phone }}<br>
                      <a :href="`mailto:${order.customer.email}`" class="underline">{{ order.customer.email }}</a>
                    </p>
                    <p v-if="order.customer.notes" class="mt-3">
                      <span class="text-stone-500">{{ t('checkout.fields.notes') }}:</span> {{ order.customer.notes }}
                    </p>
                    <AdminOrderStatus :session="session" :order="order" @updated="replaceOrder" />
                    <h3 class="mt-4 font-semibold">{{ t('admin.orders.history') }}</h3>
                    <ul class="mt-2 space-y-1 text-stone-600">
                      <li v-for="change in order.statusHistory" :key="change.at">
                        {{ date(change.at) }}: {{ t(`admin.status.${change.status}`) }}
                        <span v-if="change.notification" :class="change.notification === 'failed' ? 'text-red-700' : 'text-green-700'">
                          · {{ t(`admin.orders.email.${change.notification}`) }}
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>
  </section>
</template>
