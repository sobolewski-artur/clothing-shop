<script setup lang="ts">
import { ONE_SIZE, PRODUCT_CATEGORIES, PRODUCT_SIZES, type AdminProduct, type ProductCategory } from '#shared/types/products'

const props = defineProps<{
  session: ReturnType<typeof useAdminSession>
  /** Product to edit; omit to create a new one. */
  product?: AdminProduct
}>()
const emit = defineEmits<{ saved: [message: string] }>()
const { t } = useI18n()

const p = props.product
const form = reactive({
  namePl: p?.name.pl ?? '',
  nameEn: p?.name.en ?? '',
  descriptionPl: p?.description.pl ?? '',
  descriptionEn: p?.description.en ?? '',
  price: p ? String(p.price).replace('.', ',') : '',
  category: (p?.category ?? 'women') as ProductCategory,
  sizes: [...(p?.sizes ?? [])] as string[],
  image: p?.image ?? ''
})

const busy = ref(false)
const uploading = ref(false)
const error = ref('')
const invalidFields = ref<string[]>([])

const imagePreview = computed(() => (/^https:\/\/\S+$/.test(form.image.trim()) ? form.image.trim() : ''))
const sizeLabel = (size: string) => (size === ONE_SIZE ? t('product.oneSize') : size)
const invalid = (field: string) => invalidFields.value.some(f => f === field || f.startsWith(`${field}.`))

// "One size" can't be combined with other sizes.
watch(() => form.sizes, (sizes, previous) => {
  if (sizes.includes(ONE_SIZE) && sizes.length > 1) {
    form.sizes = previous?.includes(ONE_SIZE) ? sizes.filter(s => s !== ONE_SIZE) : [ONE_SIZE]
  }
})

const MAX_BYTES = 5 * 1024 * 1024

async function upload(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = '' // allow choosing the same file again
  if (!file) return

  error.value = ''
  if (file.size > MAX_BYTES) {
    error.value = t('admin.product.uploadErrors.too_large')
    return
  }
  uploading.value = true
  try {
    const body = new FormData()
    body.append('file', file)
    const { url } = await props.session.adminFetch<{ url: string }>('/api/admin/uploads', { method: 'POST', body })
    form.image = url
    invalidFields.value = invalidFields.value.filter(f => f !== 'image')
  } catch (e) {
    const code = (e as { data?: { data?: { code?: string } } }).data?.data?.code
    error.value = t(`admin.product.uploadErrors.${code === 'too_large' || code === 'bad_type' ? code : 'failed'}`)
  } finally {
    uploading.value = false
  }
}

async function submit() {
  busy.value = true
  error.value = ''
  invalidFields.value = []
  const body = {
    name: { pl: form.namePl, en: form.nameEn },
    description: { pl: form.descriptionPl, en: form.descriptionEn },
    price: Number(String(form.price).replace(',', '.')),
    category: form.category,
    sizes: form.sizes,
    image: form.image
  }
  try {
    if (props.product) {
      await props.session.adminFetch(`/api/admin/products/${props.product.id}`, { method: 'PUT', body })
      emit('saved', t('admin.product.updated', { name: form.namePl }))
    } else {
      await props.session.adminFetch('/api/admin/products', { method: 'POST', body })
      emit('saved', t('admin.product.created', { name: form.namePl }))
    }
  } catch (e) {
    const data = (e as { data?: { data?: { fields?: string[] } } }).data?.data
    invalidFields.value = data?.fields ?? []
    error.value = invalidFields.value.length ? t('admin.product.invalid') : t('admin.product.failed')
  } finally {
    busy.value = false
  }
}

const inputClass = (field: string) => [
  'mt-1 w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:border-stone-900 focus:ring-1 focus:ring-stone-900',
  invalid(field) ? 'border-red-600' : 'border-stone-300'
]
</script>

<template>
  <form class="mt-6 grid gap-8 lg:grid-cols-[1fr_18rem]" novalidate @submit.prevent="submit">
    <div class="space-y-6">
      <div class="grid gap-4 sm:grid-cols-2">
        <div>
          <label for="p-name-pl" class="block text-sm font-medium">{{ t('admin.product.name') }} (PL)</label>
          <input id="p-name-pl" v-model="form.namePl" required maxlength="120" :class="inputClass('name.pl')">
        </div>
        <div>
          <label for="p-name-en" class="block text-sm font-medium">{{ t('admin.product.name') }} (EN)</label>
          <input id="p-name-en" v-model="form.nameEn" required maxlength="120" :class="inputClass('name.en')">
        </div>
        <div>
          <label for="p-desc-pl" class="block text-sm font-medium">{{ t('admin.product.description') }} (PL)</label>
          <textarea id="p-desc-pl" v-model="form.descriptionPl" rows="3" maxlength="2000" :class="inputClass('description.pl')" />
        </div>
        <div>
          <label for="p-desc-en" class="block text-sm font-medium">{{ t('admin.product.description') }} (EN)</label>
          <textarea id="p-desc-en" v-model="form.descriptionEn" rows="3" maxlength="2000" :class="inputClass('description.en')" />
        </div>
        <div>
          <label for="p-price" class="block text-sm font-medium">{{ t('admin.product.price') }}</label>
          <input id="p-price" v-model="form.price" inputmode="decimal" placeholder="199,99" required :class="inputClass('price')">
        </div>
        <div>
          <label for="p-category" class="block text-sm font-medium">{{ t('admin.product.category') }}</label>
          <select id="p-category" v-model="form.category" :class="inputClass('category')" class="bg-white">
            <option v-for="c in PRODUCT_CATEGORIES" :key="c" :value="c">{{ t(`home.categories.${c}`) }}</option>
          </select>
        </div>
      </div>

      <fieldset>
        <legend class="text-sm font-medium" :class="invalid('sizes') ? 'text-red-700' : ''">{{ t('admin.product.sizes') }}</legend>
        <div class="mt-2 flex flex-wrap gap-2">
          <label v-for="size in PRODUCT_SIZES" :key="size" class="cursor-pointer">
            <input v-model="form.sizes" type="checkbox" :value="size" class="peer sr-only">
            <span
              class="flex h-10 min-w-10 items-center justify-center rounded-md border border-stone-300 px-3 text-sm
                     hover:border-stone-900 peer-checked:border-stone-900 peer-checked:bg-stone-900 peer-checked:text-white
                     peer-focus-visible:ring-2 peer-focus-visible:ring-stone-900 peer-focus-visible:ring-offset-2"
            >
              {{ sizeLabel(size) }}
            </span>
          </label>
        </div>
      </fieldset>

      <div>
        <span class="block text-sm font-medium" :class="invalid('image') ? 'text-red-700' : ''">{{ t('admin.product.photo') }}</span>
        <div class="mt-1 flex flex-wrap items-center gap-3">
          <label
            class="cursor-pointer rounded-full border border-stone-300 px-4 py-2 text-sm font-medium hover:border-stone-900 has-focus-visible:ring-2 has-focus-visible:ring-stone-900"
            :class="uploading ? 'pointer-events-none opacity-50' : ''"
          >
            {{ uploading ? t('admin.product.uploading') : t('admin.product.upload') }}
            <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" class="sr-only" :disabled="uploading" @change="upload">
          </label>
          <span class="text-xs text-stone-500">{{ t('admin.product.uploadHint') }}</span>
        </div>
        <label for="p-image" class="mt-3 block text-xs text-stone-600">{{ t('admin.product.imageUrl') }}</label>
        <input id="p-image" v-model="form.image" type="url" placeholder="https://…" maxlength="500" :class="inputClass('image')">
      </div>

      <div class="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          :disabled="busy || uploading"
          class="rounded-full bg-stone-900 px-6 py-3 text-sm font-semibold text-white hover:bg-stone-700 disabled:opacity-50"
        >
          {{ busy ? t('admin.product.saving') : product ? t('admin.product.save') : t('admin.product.submit') }}
        </button>
        <p aria-live="assertive" class="text-sm text-red-700">{{ error }}</p>
      </div>
    </div>

    <!-- Preview -->
    <aside>
      <p class="text-sm font-medium">{{ t('admin.product.preview') }}</p>
      <div class="mt-2 aspect-[3/4] overflow-hidden rounded-xl bg-stone-100">
        <img v-if="imagePreview" :src="imagePreview" alt="" class="h-full w-full object-cover">
      </div>
      <p class="mt-3 text-sm font-medium">{{ form.namePl || '—' }}</p>
      <p class="text-sm text-stone-600">{{ form.price ? `${form.price} zł` : '' }}</p>
    </aside>
  </form>
</template>
