<script setup lang="ts">
import { TERMS_VERSION } from '#shared/types/orders'

const { t, locale } = useI18n()
const localePath = useLocalePath()

useSeoMeta({
  title: () => t('terms.title'),
  description: () => t('terms.description')
})

interface Section { title: string, paragraphs: string[] }

// The terms text, per language. When changing it, update TERMS_VERSION
// in shared/types/orders.ts so new orders record the new version.
const sections: Record<'pl' | 'en', Section[]> = {
  pl: [
    {
      title: '1. Charakter serwisu',
      paragraphs: [
        'Ten serwis jest aplikacją deweloperską (testową), tworzoną w celach rozwojowych i demonstracyjnych. Nie jest prawdziwym sklepem internetowym i nie prowadzi sprzedaży.',
        'Wszystkie produkty, ceny, opisy i zdjęcia są przykładowe. Zdjęcia pochodzą z serwisu Unsplash.'
      ]
    },
    {
      title: '2. Zamówienia',
      paragraphs: [
        'Zamówienia złożone w serwisie nie są i nie będą realizowane. Żaden towar nie zostanie wysłany.',
        'Złożenie zamówienia nie powoduje zawarcia umowy sprzedaży ani żadnych zobowiązań po stronie użytkownika lub właściciela serwisu. Przycisk „Zamawiam z obowiązkiem zapłaty” służy wyłącznie do testów.'
      ]
    },
    {
      title: '3. Płatności',
      paragraphs: [
        'Serwis nie pobiera żadnych płatności. Nie wykonuj przelewów i nie płać za zamówienia złożone w serwisie, nawet jeśli strona lub wiadomość e-mail zawiera dane do przelewu.'
      ]
    },
    {
      title: '4. Dane osobowe',
      paragraphs: [
        'Dane wpisane w formularzu zamówienia (imię i nazwisko, adres e-mail, telefon, adres) są zapisywane w bazie danych Firebase (Google Cloud, region w Unii Europejskiej) wyłącznie na potrzeby testów działania aplikacji.',
        'Na podany adres e-mail może zostać wysłana wiadomość z potwierdzeniem zamówienia lub zmianą jego statusu.',
        'Zalecamy używanie danych testowych zamiast prawdziwych. Dane testowe mogą zostać usunięte w dowolnym momencie bez uprzedzenia. Aby poprosić o usunięcie swoich danych, odpowiedz na wiadomość z potwierdzeniem zamówienia.'
      ]
    },
    {
      title: '5. Odpowiedzialność',
      paragraphs: [
        'Serwis jest udostępniany w obecnej postaci, bez gwarancji dostępności i poprawnego działania. Może być w każdej chwili zmieniony, wyłączony lub wyczyszczony z danych.'
      ]
    },
    {
      title: '6. Zmiany regulaminu',
      paragraphs: [
        'Regulamin może być zmieniany w trakcie rozwoju aplikacji. Aktualna wersja jest zawsze dostępna na tej stronie.'
      ]
    }
  ],
  en: [
    {
      title: '1. About this website',
      paragraphs: [
        'This website is a development (test) application, built for development and demonstration purposes. It is not a real online shop and does not sell anything.',
        'All products, prices, descriptions and photos are examples. Photos come from Unsplash.'
      ]
    },
    {
      title: '2. Orders',
      paragraphs: [
        'Orders placed on this website are not and will not be fulfilled. No goods will be shipped.',
        'Placing an order does not create a sales contract or any obligation for the user or the website owner. The "Place order with obligation to pay" button exists for testing only.'
      ]
    },
    {
      title: '3. Payments',
      paragraphs: [
        'This website does not take any payments. Do not make transfers or pay for orders placed here, even if a page or email shows payment details.'
      ]
    },
    {
      title: '4. Personal data',
      paragraphs: [
        'Details entered in the order form (name, email, phone, address) are stored in a Firebase database (Google Cloud, located in the European Union) only to test how the application works.',
        'An order confirmation or status update email may be sent to the email address you enter.',
        'We recommend using test details rather than real ones. Test data may be deleted at any time without notice. To ask for your data to be deleted, reply to the order confirmation email.'
      ]
    },
    {
      title: '5. Liability',
      paragraphs: [
        'The website is provided as is, without any guarantee of availability or correct operation. It may be changed, switched off or have its data cleared at any time.'
      ]
    },
    {
      title: '6. Changes to these terms',
      paragraphs: [
        'These terms may change while the application is being developed. The current version is always available on this page.'
      ]
    }
  ]
}

const content = computed(() => sections[locale.value === 'en' ? 'en' : 'pl'])
const versionDate = computed(() =>
  new Intl.DateTimeFormat(locale.value, { dateStyle: 'long' }).format(new Date(TERMS_VERSION)))
</script>

<template>
  <main class="mx-auto max-w-3xl px-4 py-12">
    <h1 class="text-3xl font-bold">{{ t('terms.title') }}</h1>
    <p class="mt-2 text-sm text-stone-500">{{ t('terms.version', { date: versionDate }) }}</p>

    <div class="mt-8 rounded-2xl border border-amber-300 bg-amber-50 p-5 text-amber-950" role="note">
      <p class="font-semibold">{{ t('terms.notice.title') }}</p>
      <p class="mt-1">{{ t('terms.notice.text') }}</p>
    </div>

    <section v-for="section in content" :key="section.title" class="mt-10">
      <h2 class="text-xl font-semibold">{{ section.title }}</h2>
      <p v-for="(paragraph, i) in section.paragraphs" :key="i" class="mt-3 leading-relaxed text-stone-700">
        {{ paragraph }}
      </p>
    </section>

    <NuxtLink
      :to="localePath('/products')"
      class="mt-12 inline-block text-sm text-stone-600 underline-offset-2 hover:text-stone-900 hover:underline"
    >
      ← {{ t('cart.continue') }}
    </NuxtLink>
  </main>
</template>
