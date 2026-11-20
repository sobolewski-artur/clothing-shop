// Grants or removes admin access to the /admin page for an existing Firebase Auth user.
//
// Usage:
//   pnpm admin:set <email>            give admin access
//   pnpm admin:set <email> --remove   take it away
//
// The user must already exist: sign in once on /admin (with Google), or create an
// email/password user in Firebase console → Authentication → Users.
// Credentials: GOOGLE_APPLICATION_CREDENTIALS from .env (service account key file).
// The user is signed out everywhere, so the change applies on their next sign-in.

import { applicationDefault, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'

const args = process.argv.slice(2)
const email = args.find(arg => !arg.startsWith('--'))
const remove = args.includes('--remove')
if (!email) {
  console.error('Usage: pnpm admin:set <email> [--remove]')
  process.exit(1)
}

initializeApp({ credential: applicationDefault(), projectId: 'clothing-storee' })
const auth = getAuth()

let user
try {
  user = await auth.getUserByEmail(email)
} catch (error) {
  if (error.code === 'auth/user-not-found') {
    console.error(`No user with email ${email}. Sign in once on /admin, or create the user in Firebase console → Authentication.`)
    process.exit(1)
  }
  throw error
}

const claims = { ...user.customClaims }
if (remove) delete claims.admin
else claims.admin = true

await auth.setCustomUserClaims(user.uid, claims)
// Sign the user out everywhere, so the new access level applies right away.
await auth.revokeRefreshTokens(user.uid)

console.log(`${remove ? 'Removed admin access from' : 'Granted admin access to'} ${email} (uid ${user.uid}).`)
