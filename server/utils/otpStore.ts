import { randomUUID } from 'node:crypto'

/**
 * Development stand-in for the password-reset endpoints.
 *
 * Signup and sign-in now go to the real Synora API — see `composables/useAuth.ts`.
 * Only the reset flow is still stubbed, because the API does not implement it yet.
 *
 * Codes and reset tickets live in memory: they are lost on restart and are not
 * shared between server instances. Replace this once the API grows the flow.
 */

interface PendingCode {
  code: string
  expiresAt: number
}

const CODE_TTL_MS = 10 * 60 * 1000
const TICKET_TTL_MS = 15 * 60 * 1000

const pending = new Map<string, PendingCode>()
const tickets = new Map<string, number>()

const keyFor = (email: string) => email.toLowerCase()

export function issueOtp(email: string) {
  const code = String(Math.floor(100000 + Math.random() * 900000))
  pending.set(keyFor(email), { code, expiresAt: Date.now() + CODE_TTL_MS })

  // Stands in for the email delivery.
  console.info(`[dev] reset OTP for ${email}: ${code}`)
  return code
}

export function reissueOtp(email: string) {
  if (!pending.has(keyFor(email))) return null
  return issueOtp(email)
}

export function consumeOtp(email: string, code: string) {
  const key = keyFor(email)
  const entry = pending.get(key)

  if (!entry) return { ok: false, reason: 'No pending verification for this email.' } as const
  if (Date.now() > entry.expiresAt) {
    pending.delete(key)
    return { ok: false, reason: 'That code has expired. Request a new one.' } as const
  }
  if (entry.code !== code) return { ok: false, reason: 'That code is not correct. Please try again.' } as const

  pending.delete(key)
  return { ok: true } as const
}

/** Proof the reset code was verified, so the final step cannot be called on its own. */
export function issueResetTicket(email: string) {
  const ticket = randomUUID()
  tickets.set(`${email.toLowerCase()}:${ticket}`, Date.now() + TICKET_TTL_MS)
  return ticket
}

export function consumeResetTicket(email: string, ticket: string) {
  const key = `${email.toLowerCase()}:${ticket}`
  const expiresAt = tickets.get(key)
  if (!expiresAt) return false

  tickets.delete(key)
  return Date.now() <= expiresAt
}
