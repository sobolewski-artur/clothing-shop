import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  type User
} from 'firebase/auth'

/**
 * Firebase sign-in state for the admin page (client-only).
 * `isAdmin` only decides what the page shows; the server checks the admin
 * claim again on every /api/admin request.
 */
export function useAdminSession() {
  const { $auth } = useNuxtApp()

  const user = shallowRef<User | null>(null)
  const isAdmin = ref(false)
  const ready = ref(false)

  const stop = onAuthStateChanged($auth, async (current) => {
    user.value = current
    isAdmin.value = current ? (await current.getIdTokenResult()).claims.admin === true : false
    ready.value = true
  })
  onScopeDispose(stop)

  const signInWithEmail = (email: string, password: string) => signInWithEmailAndPassword($auth, email, password)
  const signInWithGoogle = () => signInWithPopup($auth, new GoogleAuthProvider())
  const signOut = () => firebaseSignOut($auth)

  /** $fetch with the user's ID token. Signs out when the server rejects the session. */
  async function adminFetch<T>(
    url: string,
    options: {
      method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
      body?: Record<string, unknown> | FormData
      query?: Record<string, string | number>
    } = {}
  ): Promise<T> {
    if (!user.value) throw new Error('Not signed in')
    const token = await user.value.getIdToken()
    try {
      return await $fetch<T>(url, { ...options, headers: { Authorization: `Bearer ${token}` } })
    } catch (error) {
      if ((error as { statusCode?: number }).statusCode === 401) await signOut()
      throw error
    }
  }

  return { user, isAdmin, ready, signInWithEmail, signInWithGoogle, signOut, adminFetch }
}
