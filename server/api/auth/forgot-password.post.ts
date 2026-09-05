// Development stub — see server/utils/otpStore.ts
export default defineEventHandler(async (event) => {
  const { email } = await readBody<{ email?: string }>(event)

  if (!email) {
    throw createError({ statusCode: 400, statusMessage: 'Email is required.' })
  }

  // A real backend answers the same way whether or not the account exists, so
  // this endpoint cannot be used to discover which emails are registered.
  const code = issueOtp('reset', email)

  // Handy while there is no real mail delivery; never exposed in production.
  return { ok: true, ...(import.meta.dev ? { devCode: code } : {}) }
})
