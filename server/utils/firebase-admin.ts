import { getApps, initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

/**
 * Firestore with admin access, for server routes only.
 *
 * Credentials come from Application Default Credentials: automatic on Firebase
 * App Hosting; locally, set GOOGLE_APPLICATION_CREDENTIALS in .env to the path
 * of a service account key file.
 */
export function useAdminFirestore() {
  const app = getApps()[0] ?? initializeApp({
    projectId: useRuntimeConfig().public.firebase.projectId
  })
  return getFirestore(app)
}
