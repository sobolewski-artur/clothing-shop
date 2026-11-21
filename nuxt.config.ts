// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxtjs/i18n'],
  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    // Server-only. Set with NUXT_TURNSTILE_SECRET_KEY (.env locally; in production the
    // Secret Manager secret of the same name, see nitro.firebase below). Never commit it.
    turnstile: {
      secretKey: ''
    },
    public: {
      // Cloudflare Turnstile widget on the checkout form (the site key is public).
      turnstile: {
        siteKey: '0x4AAAAAAGLqcrYgEpchDghH'
      },
      // Shown to customers who pay by bank transfer. Set these before going live
      // (here or with NUXT_PUBLIC_SHOP_BANK_ACCOUNT / NUXT_PUBLIC_SHOP_BANK_RECIPIENT).
      shop: {
        bankAccount: '',
        bankRecipient: ''
      },
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
  // Production runs on Firebase Hosting + a Cloud Function: `pnpm build:firebase`
  // (Nitro's "firebase" preset) bundles the Nuxt server into .output/server as the
  // function "shop", and Hosting serves .output/public. See firebase.json.
  // These options are ignored by the plain `pnpm build` (node server).
  nitro: {
    firebase: {
      gen: 2,
      nodeVersion: '22',
      serverFunctionName: 'shop',
      httpsOptions: {
        region: 'europe-west4',
        memory: '512MiB',
        maxInstances: 3,
        // Secret Manager secret exposed as an env var (overrides runtimeConfig.turnstile.secretKey).
        secrets: ['NUXT_TURNSTILE_SECRET_KEY']
      }
    }
  },
  i18n: {
    // Used for absolute SEO links (canonical, hreflang, og:url). No trailing slash.
    baseUrl: 'https://clothing-storee.web.app',
    defaultLocale: 'pl',
    strategy: 'prefix_except_default',
    locales: [
      { code: 'pl', language: 'pl-PL', name: 'Polski', file: 'pl.json' },
      { code: 'en', language: 'en-US', name: 'English', file: 'en.json' }
    ],
    detectBrowserLanguage: {
      useCookie: true,
      // Firebase Hosting strips every cookie except "__session" before calling the
      // function, so the language choice must use that name to reach the server.
      cookieKey: '__session',
      redirectOn: 'root'
    }
  }
})
