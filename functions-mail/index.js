// Cloud Functions for Example Shop (codebase "mail").
//
// sendQueuedMail: the shop (App Hosting) writes customer emails to the
// Firestore "mail" collection; this function sends each one over SMTP,
// retries failures (up to MAX_ATTEMPTS) and records "sent"/"failed" on the
// order's status history, which the admin area shows.
//
// Configuration (functions-mail/.env, not committed; see .env.example):
//   SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, MAIL_FROM
// Secret (Cloud Secret Manager): SMTP_PASSWORD
//   pnpm dlx firebase-tools@latest functions:secrets:set SMTP_PASSWORD
import { onDocumentCreated } from 'firebase-functions/v2/firestore'
import { defineBoolean, defineInt, defineSecret, defineString } from 'firebase-functions/params'
import { logger } from 'firebase-functions'
import { initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import nodemailer from 'nodemailer'
import { deliverMail } from './deliver.js'

initializeApp()

const smtpHost = defineString('SMTP_HOST', { description: 'SMTP server, e.g. smtp-relay.brevo.com' })
const smtpPort = defineInt('SMTP_PORT', { default: 587, description: '587 (STARTTLS) or 465 (TLS)' })
const smtpSecure = defineBoolean('SMTP_SECURE', { default: false, description: 'true for port 465' })
const smtpUser = defineString('SMTP_USER', { default: '', description: 'SMTP username' })
const mailFrom = defineString('MAIL_FROM', { description: 'Sender, e.g. Example Shop <shop@your-domain.com>' })
const smtpPassword = defineSecret('SMTP_PASSWORD')

let transport
function smtp() {
  transport ??= nodemailer.createTransport({
    host: smtpHost.value(),
    port: smtpPort.value(),
    secure: smtpSecure.value(),
    auth: smtpUser.value() ? { user: smtpUser.value(), pass: smtpPassword.value() } : undefined,
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000
  })
  return transport
}

export const sendQueuedMail = onDocumentCreated(
  {
    document: 'mail/{mailId}',
    region: 'europe-west4', // same location as the Firestore database
    secrets: [smtpPassword],
    retry: true,
    timeoutSeconds: 60,
    memory: '256MiB',
    maxInstances: 2
  },
  async (event) => {
    const mailId = event.params.mailId
    const db = getFirestore()
    const outcome = await deliverMail({
      db,
      mailRef: db.collection('mail').doc(mailId),
      send: mail => smtp().sendMail({
        from: mailFrom.value(),
        to: mail.to,
        subject: mail.subject,
        text: mail.text,
        html: mail.html
      })
    }).catch((error) => {
      // Logged without the message body (personal data); rethrown so it's retried.
      logger.warn('Sending failed, will retry', { mailId, error: error.message })
      throw error
    })
    logger.info('Mail processed', { mailId, outcome })
  }
)
