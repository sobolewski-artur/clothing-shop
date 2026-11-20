import type { H3Event } from 'h3'
import type { DecodedIdToken } from 'firebase-admin/auth'

/**
 * Allows the request only for a signed-in admin.
 *
 * The browser sends its Firebase ID token as "Authorization: Bearer <token>".
 * Admins have the custom claim `admin: true`, set with scripts/set-admin.mjs
 * (users cannot set custom claims themselves).
 */
export async function requireAdmin(event: H3Event): Promise<DecodedIdToken> {
  // Admin data must never be cached by browsers or proxies.
  setResponseHeader(event, 'cache-control', 'no-store')

  const header = getRequestHeader(event, 'authorization') ?? ''
  const token = header.startsWith('Bearer ') ? header.slice('Bearer '.length) : ''
  if (!token) {
    throw createError({ statusCode: 401, statusMessage: 'Sign in required' })
  }

  let user: DecodedIdToken
  try {
    // checkRevoked: a signed-out or disabled account stops working immediately.
    user = await useAdminAuth().verifyIdToken(token, true)
  } catch {
    throw createError({ statusCode: 401, statusMessage: 'Invalid or expired sign-in' })
  }

  if (user.admin !== true) {
    throw createError({ statusCode: 403, statusMessage: 'Admin access required' })
  }
  return user
}
