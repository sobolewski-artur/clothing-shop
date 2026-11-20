import { initializeApp, getApps, getApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig().public.firebase

  // On the server the module stays loaded between requests, so reuse the existing app.
  const app = getApps().length ? getApp() : initializeApp(config)

  // Analytics only works in the browser.
  if (import.meta.client && config.measurementId) {
    import('firebase/analytics').then(async ({ getAnalytics, isSupported }) => {
      if (await isSupported()) getAnalytics(app)
    })
  }

  return {
    provide: {
      firebaseApp: app,
      auth: getAuth(app),
      firestore: getFirestore(app),
      storage: getStorage(app)
    }
  }
})
