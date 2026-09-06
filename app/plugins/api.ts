import type { FetchOptions } from 'ofetch'

export type ApiOptions = Omit<FetchOptions, 'headers'> & { headers?: Record<string, string> }

/**
 * `$api` — `$fetch` pointed at the Synora API, with the bearer token attached
 * and one transparent retry when the access token has expired.
 */
export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  const session = useAuthSession()

  // During SSR the API is reached over the internal network, where the public
  // URL may not resolve; NUXT_API_BASE overrides it for the server only.
  const baseURL = import.meta.server
    ? config.apiBase || config.public.apiBase
    : config.public.apiBase

  const request = $fetch.create({ baseURL })

  // One refresh at a time. Without this, three requests failing together would
  // fire three refreshes and two of them would race onto a stale token.
  let refreshing: Promise<boolean> | null = null

  function refreshOnce(): Promise<boolean> {
    refreshing ??= session.refreshSession().finally(() => {
      refreshing = null
    })
    return refreshing
  }

  async function api<T>(url: string, options: ApiOptions = {}): Promise<T> {
    const send = () => request<T>(url, {
      ...options,
      headers: {
        ...options.headers,
        ...(session.accessToken.value
          ? { Authorization: `Bearer ${session.accessToken.value}` }
          : {}),
      },
    } as FetchOptions)

    try {
      return await send()
    }
    catch (error) {
      // A 401 with no refresh token is a real rejection — bad credentials, say —
      // not an expired session, so only retry when there is something to renew.
      if (apiErrorStatus(error) !== 401 || !session.refreshToken.value) throw error
      if (!await refreshOnce()) throw error

      return await send()
    }
  }

  return { provide: { api } }
})
