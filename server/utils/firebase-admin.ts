import { getApps, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'
import { getStorage } from 'firebase-admin/storage'

/**
 * Firebase Admin app, for server routes only.
 *
 * Credentials come from Application Default Credentials: automatic on Firebase
 * App Hosting; locally, set GOOGLE_APPLICATION_CREDENTIALS in .env to the path
 * of a service account key file.
 */
function useAdminApp() {
  return getApps()[0] ?? initializeApp({
    projectId: useRuntimeConfig().public.firebase.projectId
  })
}

/** Firestore with admin access (not subject to security rules). */
export const useAdminFirestore = () => getFirestore(useAdminApp())

/** Firebase Auth admin API (verifying ID tokens, custom claims). */
export const useAdminAuth = () => getAuth(useAdminApp())

/** The project's default Cloud Storage bucket. */
export const useAdminBucket = () =>
  getStorage(useAdminApp()).bucket(useRuntimeConfig().public.firebase.storageBucket)
