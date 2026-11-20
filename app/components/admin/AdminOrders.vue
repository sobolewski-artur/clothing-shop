<script setup lang="ts">
import { ONE_SIZE } from '#shared/types/products'
import { ORDER_STATUSES, type StoredOrder } from '#shared/types/orders'

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
    // The newest 500 orders (the server's maximum); sorting below applies to these.
    orders.value = await props.session.adminFetch<StoredOrder[]>('/api/admin/orders', { query: { limit: 500 } })
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

// Sorting (in the browser, over the loaded orders)
type SortKey = 'number' | 'date' | 'customer' | 'payment' | 'status' | 'total'
type SortDir = 'asc' | 'desc'
const sortKey = ref<SortKey>('date')
const sortDir = ref<SortDir>('desc')

const columns: { key: SortKey, label: string, align?: 'right' }[] = [
  { key: 'number', label: 'admin.orders.number' },
  { key: 'date', label: 'admin.orders.date' },
  { key: 'customer', label: 'admin.orders.customer' },
  { key: 'payment', label: 'checkout.payment' },
  { key: 'status', label: 'admin.orders.status' },
  { key: 'total', label: 'cart.total', align: 'right' }
]

/** Clicking the active column flips the direction; a new column starts newest/highest first for date and total. */
function sortBy(key: SortKey) {
  if (sortKey.value === key) {
    sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortKey.value = key
    sortDir.value = key === 'date' || key === 'total' ? 'desc' : 'asc'
  }
}

const compareText = (a: string, b: string) => a.localeCompare(b, locale.value, { sensitivity: 'base' })
const comparators: Record<SortKey, (a: StoredOrder, b: StoredOrder) => number> = {
  number: (a, b) => a.number.localeCompare(b.number),
  date: (a, b) => a.createdAt.localeCompare(b.createdAt), // ISO strings sort chronologically
  customer: (a, b) => compareText(a.customer.name, b.customer.name),
  payment: (a, b) => compareText(t(`checkout.methods.${a.customer.payment}`), t(`checkout.methods.${b.customer.payment}`)),
  status: (a, b) => ORDER_STATUSES.indexOf(a.status) - ORDER_STATUSES.indexOf(b.status), // workflow order: new → cancelled
  total: (a, b) => a.total - b.total
}

const sortedOrders = computed(() => {
  const direction = sortDir.value === 'asc' ? 1 : -1
  const compare = comparators[sortKey.value]
  // Ties are broken by date, newest first, so the order is always predictable.
  return [...orders.value].sort((a, b) => compare(a, b) * direction || comparators.date(b, a))
})

const ariaSort = (key: SortKey) => (sortKey.value === key ? (sortDir.value === 'asc' ? 'ascending' : 'descending') : 'none')

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
            <th
              v-for="column in columns"
              :key="column.key"
              scope="col"
              :aria-sort="ariaSort(column.key)"
              class="px-2 py-1.5 font-medium"
              :class="column.align === 'right' ? 'text-right' : ''"
            >
              <button
                type="button"
                class="inline-flex items-center gap-1 rounded px-2 py-1.5 hover:bg-stone-200/60 hover:text-stone-900"
                :class="[sortKey === column.key ? 'text-stone-900' : '', column.align === 'right' ? 'flex-row-reverse' : '']"
                :title="t('admin.orders.sortBy', { column: t(column.label) })"
                @click="sortBy(column.key)"
              >
                {{ t(column.label) }}
                <span aria-hidden="true" class="w-3 text-xs" :class="sortKey === column.key ? '' : 'opacity-0'">
                  {{ sortKey === column.key && sortDir === 'asc' ? '▲' : '▼' }}
                </span>
              </button>
            </th>
          </tr>
        </thead>
        <tbody>
          <template v-for="order in sortedOrders" :key="order.number">
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
