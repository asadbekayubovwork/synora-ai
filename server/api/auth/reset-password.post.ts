// Development stub — see server/utils/otpStore.ts
export default defineEventHandler(async (event) => {
  const { email, resetToken, password } = await readBody<{
    email?: string
    resetToken?: string
    password?: string
  }>(event)

  if (!email || !resetToken || !password) {
    throw createError({ statusCode: 400, statusMessage: 'Email, reset token and password are required.' })
  }
  if (password.length < 8) {
    throw createError({ statusCode: 400, statusMessage: 'Password must be at least 8 characters.' })
  }
  if (!consumeResetTicket(email, resetToken)) {
    throw createError({ statusCode: 400, statusMessage: 'This reset link has expired. Start again.' })
  }

  // TODO: persist the new password once the real backend is wired up.
  return { ok: true }
})
