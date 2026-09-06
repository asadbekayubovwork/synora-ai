/**
 * Reading errors from the Synora API.
 *
 * Every non-2xx body has the same shape — `detail`, `statusMessage` (the same
 * text) and a stable `code` such as `otp_expired`. Branch on `code`; show
 * `statusMessage`.
 */

interface ApiErrorBody {
  detail?: string
  statusMessage?: string
  code?: string
}

interface FetchLikeError {
  statusCode?: number
  status?: number
  response?: { status?: number }
  data?: ApiErrorBody
}

function asFetchError(error: unknown): FetchLikeError {
  return (error ?? {}) as FetchLikeError
}

export function apiErrorStatus(error: unknown): number | undefined {
  const err = asFetchError(error)
  return err.statusCode ?? err.status ?? err.response?.status
}

/** The stable machine-readable code, e.g. `email_not_verified`. */
export function apiErrorCode(error: unknown): string | undefined {
  return asFetchError(error).data?.code
}

export function apiErrorMessage(error: unknown, fallback: string): string {
  const body = asFetchError(error).data
  return body?.statusMessage || body?.detail || fallback
}
