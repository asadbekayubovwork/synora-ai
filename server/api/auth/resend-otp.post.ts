// Development stub for the password-reset flow — see server/utils/otpStore.ts
// Signup resends go to the real API via `useAuth().resendOtp`.
export default defineEventHandler(async (event) => {
  const { email } = await readBody<{ email?: string }>(event)

  if (!email) {
    throw createError({ statusCode: 400, statusMessage: 'Email is required.' })
  }

  const code = reissueOtp(email)
  if (!code) {
    throw createError({ statusCode: 400, statusMessage: 'No pending verification for this email.' })
  }

  // Handy while there is no real mail delivery; never exposed in production.
  return { ok: true, ...(import.meta.dev ? { devCode: code } : {}) }
})
