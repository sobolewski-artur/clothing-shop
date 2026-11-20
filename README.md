# Clothing Store

Online clothing shop built with Nuxt 4 and Firebase. Polish by default, with an English version under `/en`.

Live site: https://clothing-shop--clothing-storee.europe-west4.hosted.app

## Features

- **Shop:** home and about pages, product listing with category filter and sorting, product pages with size picker.
- **Cart:** kept in the visitor's browser, with free shipping from 200 zł (14.99 zł below that).
- **Checkout:** bank transfer or cash on delivery. The server recalculates every price from Firestore before saving an order.
- **Emails:** order confirmation and status updates (processing, shipped, delivered, cancelled), sent by a Cloud Function over SMTP (Brevo).
- **Admin panel** at `/admin` (not linked from the shop): view and sort orders, change their status, add, edit and delete products, upload product photos.

## Tech stack

| Part | Technology |
|---|---|
| App | [Nuxt 4](https://nuxt.com) (Vue 3, server-side rendering, Nitro server routes) |
| Styling | [Tailwind CSS 4](https://tailwindcss.com) via `@tailwindcss/vite` |
| Translations | [@nuxtjs/i18n](https://i18n.nuxtjs.org), files in `i18n/locales/` |
| Database | Cloud Firestore |
| Sign-in (admin only) | Firebase Authentication (email/password or Google) |
| Photos | Cloud Storage for Firebase |
| Emails | Cloud Function `sendQueuedMail` + Nodemailer + Brevo SMTP |
| Hosting | Firebase App Hosting, connected to this GitHub repository |
| Validation | [Zod](https://zod.dev) on every server route |

Firebase project: `clothing-storee` (Firestore and functions in `europe-west4`).

## Getting started

Requirements: Node.js 22 or newer and [pnpm](https://pnpm.io) 11.

```bash
pnpm install
pnpm dev        # http://localhost:3000
```

The shop pages work right away: the Firebase web config in `nuxt.config.ts` is public by design.

Anything that runs on the server with admin rights (checkout, admin panel, scripts) needs a **service account key**:

1. Firebase console → Project settings → Service accounts → **Generate new private key**.
2. Save the file in the project root. Files named `service-account*.json` or `*-firebase-adminsdk-*.json` are git-ignored. **Never commit it**: it has full admin access to the project.
3. Create `.env` in the project root (git-ignored) pointing to it:

   ```bash
   GOOGLE_APPLICATION_CREDENTIALS=./your-key-file.json
   ```

`pnpm dev` loads `.env` automatically. On App Hosting no key is needed: credentials are provided automatically.

## Scripts

| Command | What it does |
|---|---|
| `pnpm dev` | Development server with hot reload |
| `pnpm build` | Production build into `.output/` |
| `pnpm preview` | Run the production build locally |
| `pnpm seed:products [key.json]` | Add or refresh 10 sample products (defaults to `service-account.json`; safe to re-run) |
| `pnpm admin:set <email>` | Give a user admin access (`--remove` takes it away) |

## Project structure

```
app/                  Nuxt app (runs in the browser and during server rendering)
  pages/              Routes: index, about, products/, cart, checkout/, admin/
  components/         Shop components; admin/ holds the admin panel
  composables/        useCart, useCartLines, useProducts, useAdminSession, …
  plugins/            firebase.ts (Firebase client SDK), cart.client.ts (cart ↔ localStorage)
server/
  api/orders.post.ts  Place an order (public)
  api/admin/          Admin-only routes: orders, products, uploads
  utils/              Admin SDK, admin check, email rendering, mail queue, image storage
shared/               Types and pricing rules used by both app/ and server/
i18n/locales/         pl.json, en.json
scripts/              seed-products.mjs, set-admin.mjs
functions-mail/       Cloud Function that sends queued emails (separate pnpm project)
firestore.rules       Firestore security rules
storage.rules         Cloud Storage security rules
```

## How it works

### Data (Firestore)

| Collection | Contents | Who can access it |
|---|---|---|
| `products` | Catalogue: names and descriptions in `pl`/`en`, price (PLN), category, sizes, image URL | Anyone can read. Only the server writes. |
| `orders` | Orders, keyed by number (`ES-YYMMDD-XXXXXX`), with customer details and status history | Server only (personal data) |
| `mail` | Email queue for the Cloud Function, deleted after 30 days (TTL on `expireAt`) | Server and function only |

The exact fields are documented at the top of [`firestore.rules`](firestore.rules) and in [`shared/types/`](shared/types/).

### Placing an order

1. The cart lives in `localStorage` in the visitor's browser.
2. Checkout sends the cart and form to `POST /api/orders`.
3. The server validates the input, loads current prices and sizes from Firestore, and rejects the order if a product is gone or the total differs from what the customer saw.
4. The order and its confirmation email (a `mail/` document) are written in one batch, so one never exists without the other.

### Emails

The [`functions-mail/`](functions-mail/) Cloud Function (codebase `mail`) runs whenever a `mail/` document is created:

- It sends the email over SMTP and retries up to 5 times.
- It records `sent` or `failed` on the order's status-history entry, which the admin panel shows.

SMTP settings are in `functions-mail/.env` (git-ignored; see [`.env.example`](functions-mail/.env.example)). The SMTP password is stored in Secret Manager as `SMTP_PASSWORD`.

### Product photos

- Admins upload photos through `POST /api/admin/uploads`. The server checks the file's real type (JPG, PNG, WebP or AVIF) and size (max 5 MB).
- Photos are saved under `products/` in Cloud Storage with a download token, and shown through that token URL.
- [`storage.rules`](storage.rules) deny all direct browser access.
- Replacing a product's photo or deleting the product also deletes the old photo.

### Admin access

- `/admin` signs in with Firebase Auth.
- Every `/api/admin/*` route verifies the sign-in token and requires the custom claim `admin: true`. Users can't set it themselves.

To make someone an admin:

1. Create the account:
   - email/password: Firebase console → Authentication → Users → Add user;
   - Google: sign in once on `/admin` (you'll see "no access").
2. Run `pnpm admin:set <email>`.
3. Sign in again. The script signs the user out everywhere so the change takes effect.

Google sign-in only works on domains listed in Firebase console → Authentication → Settings → Authorized domains. Currently: the live site, `localhost` and the default Firebase domains.

## Configuration

In [`nuxt.config.ts`](nuxt.config.ts) → `runtimeConfig.public`:

| Setting | Purpose |
|---|---|
| `firebase.*` | Firebase web config (public) |
| `shop.bankAccount`, `shop.bankRecipient` | Bank details shown to customers who pay by transfer, on the confirmation page and in the email. **Empty for now.** Can also be set with `NUXT_PUBLIC_SHOP_BANK_ACCOUNT` / `NUXT_PUBLIC_SHOP_BANK_RECIPIENT`. |

Shipping cost, free-shipping threshold and maximum quantity are in [`shared/utils/pricing.ts`](shared/utils/pricing.ts).

The site's address is set in `i18n.baseUrl` in `nuxt.config.ts` and used for SEO links (canonical, `hreflang`, `og:url`). Update it when moving to your own domain, and add that domain to Firebase Auth's authorized domains.

## Deployment

| What | How |
|---|---|
| Website | Push to `main`. App Hosting (backend `clothing-shop`) builds and deploys automatically. |
| Email function | `pnpm dlx firebase-tools@latest deploy --only functions:mail` |
| Firestore rules and indexes | `pnpm dlx firebase-tools@latest deploy --only firestore` |
| Storage rules | `pnpm dlx firebase-tools@latest deploy --only storage` |
| Change the SMTP password | `pnpm dlx firebase-tools@latest functions:secrets:set SMTP_PASSWORD`, then redeploy the email function |

`firebase.json` has no `apphosting` section on purpose: the backend deploys from GitHub. A plain `firebase deploy` therefore leaves the website alone.

## Not done yet

- Bank account details for transfer payments (see Configuration).
- Terms and conditions / privacy policy pages, and an acceptance checkbox at checkout.
- Online card payments (e.g. Przelewy24 or Stripe). Only transfer and cash on delivery for now.
- Rate limiting on `POST /api/orders` (only a honeypot field against bots).
- The admin orders list loads the newest 500 orders; beyond that it would need server-side paging.
