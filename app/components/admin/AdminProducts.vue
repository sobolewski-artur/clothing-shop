<script setup lang="ts">
import type { AdminProduct } from '#shared/types/products'

const props = defineProps<{ session: ReturnType<typeof useAdminSession> }>()
const { t, locale } = useI18n()
const localePath = useLocalePath()

const products = ref<AdminProduct[]>([])
const loading = ref(false)
const loaded = ref(false)
const error = ref('')
const notice = ref('')

/** null = list; 'new' = create form; a product = edit form */
const editing = ref<AdminProduct | 'new' | null>(null)
const confirmingDelete = ref<string | null>(null)
const deleting = ref<string | null>(null)

async function load() {
  loading.value = true
  error.value = ''
  try {
    products.value = await props.session.adminFetch<AdminProduct[]>('/api/admin/products')
    loaded.value = true
  } catch {
    error.value = t('admin.products.error')
  } finally {
    loading.value = false
  }
}
onMounted(load)

// Reload first, so the list never shows the old version of the saved product.
async function onSaved(message: string) {
  await load()
  editing.value = null
  notice.value = message
}

async function remove(product: AdminProduct) {
  deleting.value = product.id
  error.value = ''
  try {
    await props.session.adminFetch(`/api/admin/products/${product.id}`, { method: 'DELETE' })
    products.value = products.value.filter(p => p.id !== product.id)
    notice.value = t('admin.products.deleted', { name: product.name.pl })
  } catch {
    error.value = t('admin.products.deleteFailed')
  } finally {
    deleting.value = null
    confirmingDelete.value = null
  }
}

const name = (p: AdminProduct) => (locale.value === 'en' ? p.name.en : p.name.pl) || p.name.pl
</script>

<template>
  <section class="mt-6">
    <!-- Create / edit -->
    <template v-if="editing">
      <button type="button" class="text-sm text-stone-600 underline hover:text-stone-900" @click="editing = null">
        ← {{ t('admin.products.backToList') }}
      </button>
      <h2 class="mt-4 text-xl font-semibold">
        {{ editing === 'new' ? t('admin.products.new') : t('admin.products.edit', { name: name(editing) }) }}
      </h2>
      <AdminProductForm
        :key="editing === 'new' ? 'new' : editing.id"
        :session="session"
        :product="editing === 'new' ? undefined : editing"
        @saved="onSaved"
      />
    </template>

    <!-- List -->
    <template v-else>
      <div class="flex flex-wrap items-center justify-between gap-3">
        <p class="text-sm text-stone-600">{{ loaded ? t('admin.products.count', { count: products.length }) : t('admin.loading') }}</p>
        <div class="flex gap-2">
          <button
            type="button"
            class="rounded-full border border-stone-300 px-4 py-1.5 text-sm hover:border-stone-900 disabled:opacity-50"
            :disabled="loading"
            @click="load"
          >
            {{ loading ? t('admin.loading') : t('admin.orders.refresh') }}
          </button>
          <button
            type="button"
            class="rounded-full bg-stone-900 px-4 py-1.5 text-sm font-semibold text-white hover:bg-stone-700"
            @click="notice = ''; editing = 'new'"
          >
            + {{ t('admin.products.new') }}
          </button>
        </div>
      </div>

      <p v-if="notice" class="mt-4 rounded-xl bg-green-50 p-3 text-sm text-green-800" aria-live="polite">{{ notice }}</p>
      <p v-if="error" class="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-800" aria-live="assertive">{{ error }}</p>

      <ul class="mt-4 divide-y divide-stone-200 rounded-xl border border-stone-200">
        <li v-for="product in products" :key="product.id" class="flex flex-wrap items-center gap-4 p-3">
          <img :src="product.image" alt="" class="h-16 w-12 shrink-0 rounded object-cover">
          <div class="min-w-40 flex-1">
            <NuxtLink :to="localePath(`/products/${product.id}`)" target="_blank" class="font-medium hover:underline">
              {{ name(product) }}
            </NuxtLink>
            <p class="text-sm text-stone-500">
              {{ t(`home.categories.${product.category}`) }} · {{ formatPrice(product.price, locale) }} ·
              {{ product.sizes.map(s => s === 'ONE' ? t('product.oneSize') : s).join(', ') }}
            </p>
          </div>
          <div class="flex items-center gap-2 text-sm">
            <button
              type="button"
              class="rounded-full border border-stone-300 px-3 py-1 hover:border-stone-900"
              @click="notice = ''; editing = product"
            >
              {{ t('admin.products.editButton') }}
            </button>
            <template v-if="confirmingDelete === product.id">
              <button
                type="button"
                class="rounded-full bg-red-700 px-3 py-1 font-medium text-white hover:bg-red-800 disabled:opacity-50"
                :disabled="deleting === product.id"
                @click="remove(product)"
              >
                {{ t('admin.products.confirmDelete') }}
              </button>
              <button type="button" class="px-2 py-1 text-stone-600 underline" @click="confirmingDelete = null">
                {{ t('admin.products.cancel') }}
              </button>
            </template>
            <button
              v-else
              type="button"
              class="rounded-full border border-stone-300 px-3 py-1 text-red-700 hover:border-red-700"
              @click="confirmingDelete = product.id"
            >
              {{ t('admin.products.delete') }}
            </button>
          </div>
        </li>
        <li v-if="loaded && !products.length" class="p-6 text-center text-stone-500">{{ t('admin.products.empty') }}</li>
      </ul>
    </template>
  </section>
</template>
