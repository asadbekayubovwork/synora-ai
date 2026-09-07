import type { MessageResponse, TokenResponse } from './useAuthSession'

/* ---- Wire types (snake_case, as the API sends them) --------------------- */

export type OAuthProviderName = 'google' | 'github' | 'telegram'

export interface OAuthProviderInfo {
  name: OAuthProviderName
  label: string
  /** False for Telegram, which is a widget rather than a redirect. */
  supports_code_flow: boolean
  /** Telegram only — the bot the login widget must be rendered for. */
  bot_username?: string | null
}

interface OAuthProvidersResponse {
  ok: boolean
  providers: OAuthProviderInfo[]
}

interface OAuthAuthorizeResponse {
  ok: boolean
  provider: OAuthProviderName
  authorization_url: string
  state: string
  redirect_uri: string
  expires_in: number
}

export interface OAuthAccount {
  provider: OAuthProviderName
  provider_account_id: string
  email: string | null
  /** The handle to show, e.g. `@ali`. */
  username: string | null
  linked_at: string
}

interface OAuthAccountsResponse {
  ok: boolean
  accounts: OAuthAccount[]
}

/**
 * Exactly what the Telegram Login Widget passes to its callback.
 *
 * The index signature is load-bearing: Telegram's signature covers *every*
 * field it sent, so the payload has to reach the API untouched — dropping one
 * we did not model would leave the hash unverifiable.
 */
export interface TelegramLoginPayload {
  id: number
  auth_date: number
  hash: string
  first_name?: string
  last_name?: string
  username?: string
  photo_url?: string
  [field: string]: unknown
}

/** `link` attaches the provider to the signed-in account instead of opening a session. */
export type OAuthIntent = 'login' | 'link'

/* ---- The redirect handoff ----------------------------------------------- */

/** Where the provider sends the browser back to, and the page that finishes the exchange. */
export const OAUTH_CALLBACK_PATH = '/auth/callback'

const PENDING_KEY = 'synora-oauth-pending'

/**
 * What the callback page needs and the redirect itself cannot carry.
 *
 * `redirect_uri` has to match the API's `OAUTH_REDIRECT_URIS` byte for byte, so
 * nothing of ours can be appended to it, and the provider is free to hand back
 * only `code` and `state`. Everything else is parked here instead.
 *
 * `sessionStorage`, not `localStorage`: the flow leaves and returns in the same
 * tab, and a half-finished sign-in should not outlive it.
 */
interface PendingAuthorization {
  provider: OAuthProviderName
  intent: OAuthIntent
  state: string
  /** Where to land once the exchange succeeds. */
  redirect: string
}

function savePending(pending: PendingAuthorization) {
  try {
    sessionStorage.setItem(PENDING_KEY, JSON.stringify(pending))
  }
  catch {
    // Private-mode browsers throw on write. The exchange then fails on the way
    // back with "start again", which beats refusing to start at all.
  }
}

/**
 * Reads the pending authorization and clears it in one go.
 *
 * Clearing matters: an authorization code is single-use, so a reload of the
 * callback page must not replay a spent one against the API.
 */
function takePending(): PendingAuthorization | null {
  try {
    const raw = sessionStorage.getItem(PENDING_KEY)
    sessionStorage.removeItem(PENDING_KEY)
    return raw ? (JSON.parse(raw) as PendingAuthorization) : null
  }
  catch {
    return null
  }
}

/* ---- Providers ----------------------------------------------------------- */

/**
 * Which providers this server can actually sign in with.
 *
 * The API lists only the ones whose credentials it holds, so the auth pages
 * render exactly the buttons that will work — and none at all on a deployment
 * with no OAuth configured.
 *
 * Fetched through `useAsyncData` so the buttons are in the server-rendered
 * HTML rather than appearing a beat after hydration.
 */
export function useOAuthProviders() {
  const { $api } = useNuxtApp()

  return useAsyncData('oauth:providers', async () => {
    try {
      const { providers } = await $api<OAuthProvidersResponse>('/auth/oauth/providers')
      return providers
    }
    catch {
      // A providers endpoint that is down must not take the password form with
      // it: no list means no buttons, and email sign-in carries on regardless.
      return []
    }
  }, { default: (): OAuthProviderInfo[] => [] })
}

/* ---- The flows ----------------------------------------------------------- */

export function useOAuth() {
  const { $api } = useNuxtApp()
  const session = useAuthSession()
  const config = useRuntimeConfig()

  /** Providers linked to the signed-in account, as `/auth/oauth/accounts` last reported them. */
  const accounts = useState<OAuthAccount[]>('oauth:accounts', () => [])

  /**
   * The URI handed to `/authorize`.
   *
   * It must appear in the API's `OAUTH_REDIRECT_URIS` verbatim *and* be
   * registered with the provider, so every origin this app is served from needs
   * its own entry. Deriving it from the current origin covers dev and
   * production without a rebuild; `NUXT_PUBLIC_OAUTH_REDIRECT_URI` overrides it
   * where the registered URI is something else.
   */
  function redirectUri(): string {
    const configured = config.public.oauthRedirectUri
    return configured || `${window.location.origin}${OAUTH_CALLBACK_PATH}`
  }

  /**
   * Step 1 — ask the API where to send the browser, then send it.
   *
   * Does not return: the next thing to run in this tab is the provider's
   * consent screen, and after that the callback page.
   */
  async function startAuthorize(
    provider: OAuthProviderName,
    options: { intent?: OAuthIntent, redirect?: string } = {},
  ): Promise<void> {
    const intent = options.intent ?? 'login'

    const authorization = await $api<OAuthAuthorizeResponse>(`/auth/oauth/${provider}/authorize`, {
      query: { redirect_uri: redirectUri(), intent },
    })

    savePending({
      provider,
      intent,
      state: authorization.state,
      redirect: options.redirect ?? (intent === 'link' ? '/settings' : '/'),
    })

    // A full page load, not `navigateTo`: the consent screen is the provider's
    // own site, not a route of this app.
    window.location.assign(authorization.authorization_url)
  }

  /** Step 2, `intent=login` — trades the code for a session. */
  async function completeLogin(provider: OAuthProviderName, code: string, state: string) {
    const tokens = await $api<TokenResponse>(`/auth/oauth/${provider}/callback`, {
      method: 'POST',
      body: { code, state },
    })
    session.setSession(tokens)
    return tokens
  }

  /** Step 2, `intent=link` — attaches the provider to the account already signed in. */
  async function completeLink(provider: OAuthProviderName, code: string, state: string) {
    const { accounts: linked } = await $api<OAuthAccountsResponse>(`/auth/oauth/${provider}/link`, {
      method: 'POST',
      body: { code, state },
    })
    accounts.value = linked
    return linked
  }

  /* ---- Telegram ---------------------------------------------------------- */

  /*
    Telegram runs no OAuth server, so there is no redirect and nothing to
    exchange: the widget's signed payload *is* the credential, and posting it
    through unchanged is the whole flow.
  */

  async function loginWithTelegram(payload: TelegramLoginPayload) {
    const tokens = await $api<TokenResponse>('/auth/oauth/telegram/callback', {
      method: 'POST',
      body: payload,
    })
    session.setSession(tokens)
    return tokens
  }

  async function linkTelegram(payload: TelegramLoginPayload) {
    const { accounts: linked } = await $api<OAuthAccountsResponse>('/auth/oauth/telegram/link', {
      method: 'POST',
      body: payload,
    })
    accounts.value = linked
    return linked
  }

  /* ---- Linked accounts --------------------------------------------------- */

  async function loadAccounts() {
    const { accounts: linked } = await $api<OAuthAccountsResponse>('/auth/oauth/accounts')
    accounts.value = linked
    return linked
  }

  /**
   * Detach a provider.
   *
   * The API refuses with `oauth_last_login_method` when this would leave the
   * account with no way back in, so the caller surfaces that message rather
   * than trying to work out which one is the last itself.
   */
  async function unlink(provider: OAuthProviderName) {
    const result = await $api<MessageResponse>(`/auth/oauth/${provider}/link`, { method: 'DELETE' })
    accounts.value = accounts.value.filter(account => account.provider !== provider)
    return result
  }

  return {
    accounts,
    takePending,
    startAuthorize,
    completeLogin,
    completeLink,
    loginWithTelegram,
    linkTelegram,
    loadAccounts,
    unlink,
  }
}
