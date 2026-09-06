/** Keeps a signed-in user off the auth pages. Client-side only, like `auth`. */
export default defineNuxtRouteMiddleware(() => {
  if (import.meta.server) return

  const { isLoggedIn } = useAuthSession()

  if (isLoggedIn.value) return navigateTo('/')
})
