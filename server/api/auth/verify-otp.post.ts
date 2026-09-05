// Development stub — see server/utils/otpStore.ts
export default defineEventHandler(async (event) => {
  const { email, code } = await readBody<{ email?: string, code?: string }>(event)

  if (!email || !code) {
    throw createError({ statusCode: 400, statusMessage: 'Email and code are required.' })
  }

  const result = consumeOtp('signup', email, code)
  if (!result.ok) {
    throw createError({ statusCode: 400, statusMessage: result.reason })
  }

  return { ok: true }
})
