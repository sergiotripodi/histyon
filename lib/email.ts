import { Resend } from 'resend'
import { accountDeletedEmail, passwordChangedEmail, emailChangedEmail } from './emails/auth'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null
const FROM   = process.env.RESEND_FROM_EMAIL ?? 'Histyon <no-reply@histyon.com>'

async function send(to: string, { subject, html }: { subject: string; html: string }) {
  if (!resend) return
  await resend.emails.send({ from: FROM, to, subject, html })
}

export async function sendAccountDeletedEmail(to: string, name?: string) {
  await send(to, accountDeletedEmail(name))
}

export async function sendPasswordChangedEmail(to: string, name?: string) {
  await send(to, passwordChangedEmail(name))
}

export async function sendEmailChangedEmail(to: string, oldEmail: string, name?: string) {
  await send(to, emailChangedEmail(oldEmail, name))
}
