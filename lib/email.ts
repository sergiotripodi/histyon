import { Resend } from 'resend'
import {
  accountDeletedEmail,
  passwordChangedEmail,
  emailChangedEmail,
  newDoctorAdminNotifyEmail,
  registrationPendingEmail,
  accountApprovedEmail,
  accountRejectedEmail,
  accountSuspendedEmail,
  accountReactivatedEmail,
} from './emails/auth'

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

// ── Approval-flow emails ──────────────────────────────────────────────────────

const ADMIN_EMAIL = 'admin@histyon.com'
const SITE_URL    = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.histyon.com').replace(/\/$/, '')

export async function sendNewDoctorAdminNotify(doctorName: string, doctorEmail: string) {
  const dashboardUrl = `${SITE_URL}/ops-histyon-console/dashboard`
  await send(ADMIN_EMAIL, newDoctorAdminNotifyEmail(doctorName, doctorEmail, dashboardUrl))
}

export async function sendRegistrationPendingEmail(to: string, doctorName: string) {
  await send(to, registrationPendingEmail(doctorName))
}

export async function sendAccountApprovedEmail(to: string, doctorName: string) {
  const loginUrl = `${SITE_URL}/auth/login`
  await send(to, accountApprovedEmail(doctorName, loginUrl))
}

export async function sendAccountRejectedEmail(to: string, doctorName: string, reason: string, deletionDate: string) {
  await send(to, accountRejectedEmail(doctorName, reason, deletionDate))
}

export async function sendAccountSuspendedEmail(to: string, doctorName: string, reason: string) {
  await send(to, accountSuspendedEmail(doctorName, reason))
}

export async function sendAccountReactivatedEmail(to: string, doctorName: string) {
  const loginUrl = `${SITE_URL}/auth/login`
  await send(to, accountReactivatedEmail(doctorName, loginUrl))
}
