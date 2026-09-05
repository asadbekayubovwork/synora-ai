// Development stub — see server/utils/otpStore.ts
export default defineEventHandler(async (event) => {
  const { email, password } = await readBody<{ email?: string, password?: string }>(event)

  if (!email || !password) {
    throw createError({ statusCode: 400, statusMessage: 'Email and password are required.' })
  }
  if (password.length < 8) {
    throw createError({ statusCode: 400, statusMessage: 'Password must be at least 8 characters.' })
  }

  const code = issueOtp('signup', email, password)

  // Handy while there is no real mail delivery; never exposed in production.
  return { ok: true, ...(import.meta.dev ? { devCode: code } : {}) }
})
