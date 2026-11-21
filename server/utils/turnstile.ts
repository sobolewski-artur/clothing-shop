import type { H3Event } from 'h3'

interface SiteverifyResponse {
  'success': boolean
  'action'?: string
  'hostname'?: string
  'error-codes'?: string[]
}

/**
 * Checks a Cloudflare Turnstile token with Cloudflare's siteverify API.
 * Throws 400 { code: 'captcha' } if it isn't valid. Tokens are single-use and
 * expire after 5 minutes, so the browser must get a new one after each attempt.
 *
 * The secret key comes from NUXT_TURNSTILE_SECRET_KEY (.env locally, a Secret
 * Manager secret of the same name on the Cloud Function in production). Without it every check fails: the protection
 * is never silently switched off.
 */
export async function verifyTurnstile(event: H3Event, token: string, expectedAction: string) {
  const secret = useRuntimeConfig(event).turnstile.secretKey
  if (!secret) {
    console.error('Turnstile secret key is not configured (NUXT_TURNSTILE_SECRET_KEY)')
    throw createError({ statusCode: 503, statusMessage: 'Captcha not configured', data: { code: 'captcha_unavailable' } })
  }

  const body = new URLSearchParams({ secret, response: token })
  const ip = getRequestIP(event, { xForwardedFor: true })
  if (ip) body.set('remoteip', ip)

  let result: SiteverifyResponse
  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body,
      signal: AbortSignal.timeout(10_000)
    })
    result = await res.json() as SiteverifyResponse
  } catch (error) {
    console.error('Turnstile siteverify request failed', error)
    throw createError({ statusCode: 503, statusMessage: 'Captcha check unavailable', data: { code: 'captcha_unavailable' } })
  }

  if (!result.success || result.action !== expectedAction) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Captcha failed',
      data: { code: 'captcha', errors: result['error-codes'] ?? [] }
    })
  }
}
