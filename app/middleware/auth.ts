/**
 * Guards a page behind a session. Add with `definePageMeta({ middleware: 'auth' })`.
 *
 * Client-side only. The session lives in cookies the browser owns, and running
 * this during SSR bought nothing but trouble: `useCookie` re-reads the request
 * headers on every call, so a token cleared here came back in the next guard and
 * the two bounced the request between them until the render ran out of heap.
 */
export default defineNuxtRouteMiddleware(async (to) => {
  if (import.meta.server) return

  const { isLoggedIn, user, loadUser } = useAuth()

  const toLogin = () => navigateTo({ path: '/login', query: { redirect: to.fullPath } })

  if (!isLoggedIn.value) return toLogin()
  if (user.value) return

  // The cookie only says a token exists, not that it is still good.
  if (!await loadUser()) return toLogin()
})
