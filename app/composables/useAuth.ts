import type {
  ApiUser,
  MessageResponse,
  OtpSentResponse,
  ResetTokenResponse,
  TokenResponse,
} from './useAuthSession'

/**
 * The auth flows, as the pages use them.
 *
 * Registration is two calls: `register` mails a code and creates nothing the
 * user can sign in with; `verifyOtp` activates the account and returns the
 * tokens, so a successful verification lands the user signed in.
 */
export function useAuth() {
  const { $api } = useNuxtApp()
  const session = useAuthSession()

  /** Step 1 — mails a 6-digit code. No account exists until it is verified. */
  async function register(email: string, password: string) {
    return await $api<OtpSentResponse>('/auth/register', {
      method: 'POST',
      body: { email, password },
    })
  }

  /** Step 2 — confirms the code, activates the account and signs the user in. */
  async function verifyOtp(email: string, code: string) {
    const tokens = await $api<TokenResponse>('/auth/verify-otp', {
      method: 'POST',
      body: { email, code },
    })
    session.setSession(tokens)
    return tokens
  }

  async function resendOtp(email: string) {
    return await $api<OtpSentResponse>('/auth/resend-otp', {
      method: 'POST',
      body: { email },
    })
  }

  async function login(email: string, password: string) {
    const tokens = await $api<TokenResponse>('/auth/login', {
      method: 'POST',
      body: { email, password },
    })
    session.setSession(tokens)
    return tokens
  }

  /** Refreshes `session.user` from the API. False means the session is gone. */
  async function loadUser(): Promise<boolean> {
    if (!session.accessToken.value) return false

    try {
      session.setUser(await $api<ApiUser>('/auth/me'))
      return true
    }
    catch {
      session.clearSession()
      return false
    }
  }

  /* ---- Password reset ---------------------------------------------------- */

  /**
   * Step 1 — mails a reset code, and doubles as the resend.
   *
   * Succeeds whether or not the address has an account: answering differently
   * would turn this into a way to discover who is registered. So a resolved
   * promise is not a promise that mail was sent.
   */
  async function forgotPassword(email: string) {
    return await $api<OtpSentResponse>('/auth/forgot-password', {
      method: 'POST',
      body: { email },
    })
  }

  /** Step 2 — trades the code for the token that authorises the change. */
  async function verifyResetOtp(email: string, code: string) {
    const { reset_token } = await $api<ResetTokenResponse>('/auth/verify-reset-otp', {
      method: 'POST',
      body: { email, code },
    })
    return reset_token
  }

  /** Step 3 — sets the new password. The token is spent by doing so. */
  async function resetPassword(email: string, resetToken: string, password: string) {
    return await $api<MessageResponse>('/auth/reset-password', {
      method: 'POST',
      body: { email, reset_token: resetToken, password },
    })
  }

  /**
   * Refresh tokens are stateless, so there is nothing to revoke server-side —
   * dropping the cookies ends the session on this device only.
   */
  async function logout(redirectTo = '/login') {
    session.clearSession()
    await navigateTo(redirectTo)
  }

  return {
    user: session.user,
    isLoggedIn: session.isLoggedIn,
    register,
    verifyOtp,
    resendOtp,
    login,
    forgotPassword,
    verifyResetOtp,
    resetPassword,
    loadUser,
    logout,
  }
}
