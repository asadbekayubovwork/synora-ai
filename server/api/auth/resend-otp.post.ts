// Development stub — see server/utils/otpStore.ts
export default defineEventHandler(async (event) => {
  const { email, purpose = 'signup' } = await readBody<{ email?: string, purpose?: OtpPurpose }>(event)

  if (!email) {
    throw createError({ statusCode: 400, statusMessage: 'Email is required.' })
  }

  const code = reissueOtp(purpose, email)
  if (!code) {
    throw createError({ statusCode: 400, statusMessage: 'No pending verification for this email.' })
  }

  // Handy while there is no real mail delivery; never exposed in production.
  return { ok: true, ...(import.meta.dev ? { devCode: code } : {}) }
})
