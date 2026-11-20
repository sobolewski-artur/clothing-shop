// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxtjs/i18n'],
  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    public: {
      firebase: {
        apiKey: 'AIzaSyBJ1rNxfYJK0QsfCGKB46VUD9nGtvIhQ78',
        authDomain: 'clothing-storee.firebaseapp.com',
        projectId: 'clothing-storee',
        storageBucket: 'clothing-storee.firebasestorage.app',
        messagingSenderId: '535013976756',
        appId: '1:535013976756:web:af0b89924bf2e2a08505e1',
        measurementId: 'G-LMK9J0BG46'
      }
    }
  },
  vite: {
    plugins: [tailwindcss()]
  },
  i18n: {
    defaultLocale: 'pl',
    strategy: 'prefix_except_default',
    locales: [
      { code: 'pl', language: 'pl-PL', name: 'Polski', file: 'pl.json' },
      { code: 'en', language: 'en-US', name: 'English', file: 'en.json' }
    ],
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'i18n_redirected',
      redirectOn: 'root'
    }
  }
})
