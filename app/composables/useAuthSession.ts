import { computed } from 'vue'

/* ---- Wire types (snake_case, as the API sends them) --------------------- */

export interface ApiUser {
  id: string
  email: string
  is_verified: boolean
  is_active: boolean
  created_at: string
}

export interface TokenResponse {
  access_token: string
  refresh_token: string
  token_type: string
  expires_in: number
  user: ApiUser
}

export interface OtpSentResponse {
  ok: boolean
  message: string
  email: string
  expires_in: number
  resend_available_in: number
  /** Development only — the API omits this once `ENVIRONMENT` is not `development`. */
  dev_code: string | null
}

/* ---- What the app works with -------------------------------------------- */

export interface AuthUser {
  id: string
  email: string
  isVerified: boolean
  isActive: boolean
  createdAt: string
}

const ACCESS_COOKIE = 'synora-access-token'
const REFRESH_COOKIE = 'synora-refresh-token'

/** Matches REFRESH_TOKEN_TTL_DAYS on the API — the token dies first either way. */
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30

/*
  No `default` here on purpose. An absent cookie already reads as `null`, and
  giving one a default that clearing also produces makes Nuxt re-apply it on
  every write — the watcher then re-fires itself until SSR runs out of heap.
*/
function cookieOptions() {
  return {
    path: '/',
    sameSite: 'lax' as const,
    secure: !import.meta.dev,
    maxAge: COOKIE_MAX_AGE,
  }
}

function toAuthUser(user: ApiUser): AuthUser {
  return {
    id: user.id,
    email: user.email,
    isVerified: user.is_verified,
    isActive: user.is_active,
    createdAt: user.created_at,
  }
}

/**
 * Where the session lives.
 *
 * Tokens sit in cookies rather than `localStorage` so they survive a reload and
 * are readable during SSR. They are *not* `httpOnly` — the client has to attach
 * the bearer header itself — so an XSS hole would expose them. Moving token
 * handling behind Nitro routes that set `httpOnly` cookies is the upgrade path
 * if that matters more than the extra hop.
 */
export function useAuthSession() {
  // Read here, not inside `refreshSession`: that runs from a `$api` retry, long
  // after the await that loses the Nuxt instance a composable needs (NUXT_E1001).
  const apiBase = useRuntimeConfig().public.apiBase

  const accessCookie = useCookie<string | null>(ACCESS_COOKIE, cookieOptions())
  const refreshCookie = useCookie<string | null>(REFRESH_COOKIE, cookieOptions())

  /*
    `useState`, not the cookie refs, is what the app reads.

    `useCookie` hands back a fresh ref on each call, re-seeded from the cookie
    it found, so clearing a dead token in one place and reading it in another
    can hand back the token that was just dropped. `useState` is one value for
    the whole app, so a clear sticks; `persist` writes it through to the cookies.
  */
  const accessToken = useState<string | null>('auth:access', () => accessCookie.value ?? null)
  const refreshToken = useState<string | null>('auth:refresh', () => refreshCookie.value ?? null)

  // Never seeded from the client: re-fetched from /auth/me instead.
  const user = useState<AuthUser | null>('auth:user', () => null)

  const isLoggedIn = computed(() => Boolean(accessToken.value))

  function persist() {
    accessCookie.value = accessToken.value
    refreshCookie.value = refreshToken.value
  }

  function setSession(tokens: TokenResponse) {
    accessToken.value = tokens.access_token
    refreshToken.value = tokens.refresh_token
    user.value = toAuthUser(tokens.user)
    persist()
  }

  function clearSession() {
    accessToken.value = null
    refreshToken.value = null
    user.value = null
    persist()
  }

  function setUser(next: ApiUser) {
    user.value = toAuthUser(next)
  }

  /**
   * Swap the refresh token for a new pair.
   *
   * Deliberately uses plain `$fetch` rather than `$api`: `$api` calls *this* on
   * a 401, and routing the refresh through it would loop.
   */
  async function refreshSession(): Promise<boolean> {
    if (!refreshToken.value) return false

    try {
      const tokens = await $fetch<TokenResponse>('/auth/refresh', {
        baseURL: apiBase,
        method: 'POST',
        body: { refresh_token: refreshToken.value },
      })
      setSession(tokens)
      return true
    }
    catch {
      // The refresh token is spent or revoked — the session is over.
      clearSession()
      return false
    }
  }

  return {
    accessToken,
    refreshToken,
    user,
    isLoggedIn,
    setSession,
    setUser,
    clearSession,
    refreshSession,
  }
}
