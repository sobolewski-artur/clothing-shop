<script setup lang="ts">
import { ONE_SIZE } from '#shared/types/products'
import {
  PAYMENT_METHODS,
  type CheckoutCustomer,
  type CheckoutErrorCode,
  type CheckoutRequest,
  type CheckoutResponse
} from '#shared/types/orders'

// Rendered inside <ClientOnly>: the cart only exists in the visitor's browser.
const { t, locale } = useI18n()
const localePath = useLocalePath()
const cart = useCart()
const lastOrder = useLastOrder()
const {
  lines, loading, loadFailed, isReady, hasUnavailable,
  subtotalCents, shippingCents, totalCents, loadMissingProducts, reloadProducts
} = useCartLines()

type Field = Exclude<keyof CheckoutCustomer, 'payment'>

const form = reactive<CheckoutCustomer>({
  name: '',
  email: '',
  phone: '',
  street: '',
  postalCode: '',
  city: '',
  notes: '',
  payment: 'transfer'
})
const website = ref('') // honeypot, hidden from real visitors
const acceptedTerms = ref(false)
const turnstileToken = ref('')
const turnstile = ref<{ reset: () => void }>()

const fields: { name: Field, type: string, autocomplete: string, pattern?: string, half?: boolean }[] = [
  { name: 'name', type: 'text', autocomplete: 'name' },
  { name: 'email', type: 'email', autocomplete: 'email', half: true },
  { name: 'phone', type: 'tel', autocomplete: 'tel', pattern: '\\+?[0-9 ()\\-]{9,20}', half: true },
  { name: 'street', type: 'text', autocomplete: 'street-address' },
  { name: 'postalCode', type: 'text', autocomplete: 'postal-code', pattern: '\\d{2}-\\d{3}', half: true },
  { name: 'city', type: 'text', autocomplete: 'address-level2', half: true }
]

const submitting = ref(false)
const fieldErrors = ref<string[]>([])
const formError = ref('')

const price = (cents: number) => formatPrice(cents / 100, locale.value)
const sizeLabel = (size: string) => (size === ONE_SIZE ? t('product.oneSize') : size)
const hasError = (field: string) => fieldErrors.value.includes(field)

async function submit() {
  if (submitting.value || hasUnavailable.value) return
  fieldErrors.value = []
  formError.value = ''
  if (!turnstileToken.value) {
    fieldErrors.value = ['turnstileToken']
    formError.value = t('checkout.captcha.required')
    return
  }
  submitting.value = true

  const body: CheckoutRequest = {
    locale: locale.value as CheckoutRequest['locale'],
    customer: { ...form },
    items: cart.items.value.map(({ productId, size, quantity }) => ({ productId, size, quantity })),
    expectedTotal: totalCents.value / 100,
    acceptedTerms: acceptedTerms.value,
    turnstileToken: turnstileToken.value,
    website: website.value
  }

  try {
    const order = await $fetch<CheckoutResponse>('/api/orders', { method: 'POST', body })
    lastOrder.value = order
    cart.clear()
    await navigateTo(localePath({ path: '/checkout/success', query: { number: order.number } }))
  } catch (error) {
    // Turnstile tokens are single-use: get a fresh one for the next attempt.
    turnstile.value?.reset()
    // $fetch puts the response body in error.data; our server details are in its `data`.
    const data = (error as { data?: { data?: { code?: string, fields?: string[] } } }).data?.data
    const code = data?.code as CheckoutErrorCode | undefined
    if (code === 'captcha' || code === 'captcha_unavailable') {
      fieldErrors.value = ['turnstileToken']
      formError.value = t(`checkout.captcha.${code === 'captcha' ? 'failed' : 'unavailable'}`)
    } else if (code === 'invalid') {
      fieldErrors.value = data?.fields ?? []
      formError.value = t('checkout.errors.invalid')
    } else if (code === 'unavailable' || code === 'price_changed') {
      // Show the current products and prices, so the customer can review them.
      await reloadProducts()
      formError.value = t(`checkout.errors.${code}`)
    } else {
      formError.value = t('checkout.errors.generic')
    }
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <!-- Empty cart -->
  <div v-if="!cart.items.value.length" class="mt-10 rounded-2xl bg-stone-50 p-10 text-center">
    <p class="text-stone-600">{{ t('cart.empty') }}</p>
    <NuxtLink
      :to="localePath('/products')"
      class="mt-6 inline-block rounded-full bg-stone-900 px-6 py-3 text-sm font-semibold text-white hover:bg-stone-700"
    >
      {{ t('cart.emptyCta') }}
    </NuxtLink>
  </div>

  <div v-else-if="loadFailed" class="mt-10 rounded-2xl bg-red-50 p-8 text-center">
    <p class="text-red-800">{{ t('cart.error') }}</p>
    <button
      type="button"
      class="mt-4 rounded-full bg-stone-900 px-5 py-2 text-sm font-semibold text-white hover:bg-stone-700"
      @click="loadMissingProducts"
    >
      {{ t('shop.retry') }}
    </button>
  </div>

  <CartSkeleton v-else-if="loading && !isReady" />

  <form v-else class="mt-8 grid gap-10 lg:grid-cols-[1fr_22rem]" novalidate @submit.prevent="submit">
    <div class="min-w-0 space-y-10">
      <!-- Contact and delivery -->
      <fieldset>
        <legend class="text-lg font-semibold">{{ t('checkout.delivery') }}</legend>
        <div class="mt-4 grid gap-4 sm:grid-cols-2">
          <div v-for="field in fields" :key="field.name" :class="field.half ? '' : 'sm:col-span-2'">
            <label :for="`checkout-${field.name}`" class="block text-sm font-medium">
              {{ t(`checkout.fields.${field.name}`) }}
            </label>
            <input
              :id="`checkout-${field.name}`"
              v-model="form[field.name]"
              :type="field.type"
              :name="field.name"
              :autocomplete="field.autocomplete"
              :pattern="field.pattern"
              :placeholder="field.name === 'postalCode' ? '00-000' : undefined"
              :aria-invalid="hasError(field.name)"
              :aria-describedby="hasError(field.name) ? `checkout-${field.name}-error` : undefined"
              required
              class="mt-1 w-full rounded-lg border px-3 py-2.5 text-sm outline-none focus:border-stone-900 focus:ring-1 focus:ring-stone-900"
              :class="hasError(field.name) ? 'border-red-600' : 'border-stone-300'"
            >
            <p v-if="hasError(field.name)" :id="`checkout-${field.name}-error`" class="mt-1 text-sm text-red-700">
              {{ t(`checkout.fieldErrors.${field.name}`) }}
            </p>
          </div>

          <div class="sm:col-span-2">
            <label for="checkout-notes" class="block text-sm font-medium">
              {{ t('checkout.fields.notes') }} <span class="font-normal text-stone-500">({{ t('checkout.optional') }})</span>
            </label>
            <textarea
              id="checkout-notes"
              v-model="form.notes"
              name="notes"
              rows="3"
              maxlength="500"
              class="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2.5 text-sm outline-none focus:border-stone-900 focus:ring-1 focus:ring-stone-900"
            />
          </div>

          <!-- Honeypot: hidden from people, filled in only by spam bots -->
          <div class="hidden" aria-hidden="true">
            <label for="checkout-website">Website</label>
            <input id="checkout-website" v-model="website" name="website" type="text" tabindex="-1" autocomplete="off">
          </div>
        </div>
      </fieldset>

      <!-- Payment -->
      <fieldset>
        <legend class="text-lg font-semibold">{{ t('checkout.payment') }}</legend>
        <div class="mt-4 space-y-3">
          <label
            v-for="method in PAYMENT_METHODS"
            :key="method"
            class="flex cursor-pointer gap-3 rounded-xl border border-stone-300 p-4 has-checked:border-stone-900 has-checked:bg-stone-50"
          >
            <input v-model="form.payment" type="radio" name="payment" :value="method" class="mt-1 accent-stone-900">
            <span>
              <span class="block text-sm font-medium">{{ t(`checkout.methods.${method}`) }}</span>
              <span class="block text-sm text-stone-600">{{ t(`checkout.methods.${method}Text`) }}</span>
            </span>
          </label>
        </div>
      </fieldset>
    </div>

    <!-- Order summary -->
    <aside class="h-fit min-w-0 rounded-2xl bg-stone-50 p-5 sm:p-6">
      <h2 class="text-lg font-semibold">{{ t('cart.summary') }}</h2>
      <ul class="mt-4 space-y-3">
        <li v-for="line in lines" :key="line.key" class="flex gap-3 text-sm">
          <img v-if="line.product" :src="line.product.image" :alt="line.name" class="h-16 w-12 shrink-0 rounded object-cover">
          <div class="flex-1">
            <p class="font-medium">{{ line.name || line.productId }}</p>
            <p class="text-stone-500">{{ sizeLabel(line.size) }} · {{ line.quantity }} ×</p>
            <p v-if="!line.available" class="text-red-700">{{ t('cart.unavailable') }}</p>
          </div>
          <p v-if="line.available">{{ price(line.totalCents) }}</p>
        </li>
      </ul>

      <dl class="mt-5 space-y-2 border-t border-stone-200 pt-4 text-sm">
        <div class="flex justify-between">
          <dt class="text-stone-600">{{ t('cart.subtotal') }}</dt>
          <dd>{{ price(subtotalCents) }}</dd>
        </div>
        <div class="flex justify-between">
          <dt class="text-stone-600">{{ t('cart.shipping') }}</dt>
          <dd>{{ shippingCents ? price(shippingCents) : t('cart.free') }}</dd>
        </div>
        <div class="flex justify-between border-t border-stone-200 pt-3 text-base font-semibold">
          <dt>{{ t('cart.total') }}</dt>
          <dd>{{ price(totalCents) }}</dd>
        </div>
      </dl>

      <p v-if="hasUnavailable" class="mt-4 text-sm text-red-700">
        {{ t('cart.removeUnavailable') }}
        <NuxtLink :to="localePath('/cart')" class="underline">{{ t('checkout.backToCart') }}</NuxtLink>
      </p>

      <!-- Terms: this is a development app, orders are not fulfilled -->
      <label
        class="mt-6 flex gap-3 rounded-xl border p-3 text-sm"
        :class="hasError('acceptedTerms') ? 'border-red-600 bg-red-50' : 'border-amber-300 bg-amber-50'"
      >
        <input
          v-model="acceptedTerms"
          type="checkbox"
          name="acceptedTerms"
          required
          class="mt-0.5 shrink-0 accent-stone-900"
          :aria-invalid="hasError('acceptedTerms')"
          :aria-describedby="hasError('acceptedTerms') ? 'checkout-terms-error' : undefined"
        >
        <span>
          {{ t('checkout.terms.before') }}
          <NuxtLink :to="localePath('/terms')" target="_blank" class="font-medium underline">{{ t('checkout.terms.link') }}</NuxtLink>
          {{ t('checkout.terms.after') }}
        </span>
      </label>
      <p v-if="hasError('acceptedTerms')" id="checkout-terms-error" class="mt-1 text-sm text-red-700">
        {{ t('checkout.fieldErrors.acceptedTerms') }}
      </p>

      <!-- Cloudflare Turnstile bot check -->
      <div class="mt-4 rounded-xl" :class="hasError('turnstileToken') ? 'ring-2 ring-red-600 ring-offset-2' : ''">
        <TurnstileWidget ref="turnstile" v-model="turnstileToken" action="checkout" />
      </div>

      <button
        type="submit"
        class="mt-4 w-full rounded-full bg-stone-900 px-6 py-3.5 text-sm font-semibold text-white hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-50"
        :disabled="submitting || hasUnavailable"
      >
        {{ submitting ? t('checkout.submitting') : t('checkout.submit') }}
      </button>
      <p aria-live="assertive" class="mt-3 text-sm text-red-700">{{ formError }}</p>

      <NuxtLink
        :to="localePath('/cart')"
        class="mt-2 block text-center text-sm text-stone-600 underline-offset-2 hover:text-stone-900 hover:underline"
      >
        {{ t('checkout.backToCart') }}
      </NuxtLink>
    </aside>
  </form>
</template>
