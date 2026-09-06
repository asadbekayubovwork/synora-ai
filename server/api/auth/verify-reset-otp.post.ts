// Development stub — see server/utils/otpStore.ts
export default defineEventHandler(async (event) => {
  const { email, code } = await readBody<{ email?: string, code?: string }>(event)

  if (!email || !code) {
    throw createError({ statusCode: 400, statusMessage: 'Email and code are required.' })
  }

  const result = consumeOtp(email, code)
  if (!result.ok) {
    throw createError({ statusCode: 400, statusMessage: result.reason })
  }

  // The ticket is what authorises the final step.
  return { ok: true, resetToken: issueResetTicket(email) }
})
