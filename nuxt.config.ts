import tailwindcss from '@tailwindcss/vite'

/*
  Applies the stored theme before the browser paints, so a dark-mode visitor
  never sees a white flash on the way in. It has to be inline and blocking —
  the bundle arrives far too late for that.

  It also writes the `theme-color` meta itself rather than rewriting a declared
  one: Unhead orders the head by capo, which puts loose meta tags *after*
  blocking scripts, so a declared tag isn't in the DOM yet when this runs.

  Keep the key and colours in step with `app/composables/useTheme.ts`, which
  owns them once Vue has hydrated.
*/
const THEME_BOOT_SCRIPT = `!function(){try{var s=localStorage.getItem("synora-theme"),t="light"===s||"dark"===s?s:matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light",m=document.createElement("meta");document.documentElement.dataset.theme=t;m.name="theme-color";m.content="dark"===t?"#0b0b0c":"#ffffff";document.head.appendChild(m)}catch(e){}}()`

/*
  The default API base, chosen by build rather than hardcoded to one of them.

  A single default would be wrong in one direction or the other: pointing at
  localhost breaks the deployed site (127.0.0.1:8000 on that host is an entirely
  different project's API), while pointing at production means a `pnpm dev` with
  no .env quietly registers real users and mails real codes. `nuxt build` sets
  NODE_ENV=production and `nuxt dev` does not, so each gets the safe answer.

  NUXT_PUBLIC_API_BASE overrides both.
*/
const API_BASE = process.env.NODE_ENV === 'production'
  ? 'https://back.synora-ai.uz/api/v1'
  : 'http://127.0.0.1:8000/api/v1'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    /*
      Where the Synora API lives.

      `public.apiBase` is the URL the *browser* calls, so it has to be publicly
      reachable — and the API's CORS_ORIGINS must list this app's origin.
      `apiBase` (NUXT_API_BASE) overrides it during SSR only, for deployments
      where the server reaches the API on an internal address the browser cannot.

      Both are overridable at runtime, so a rebuild is not needed to repoint them.
    */
    apiBase: '',
    public: {
      apiBase: API_BASE,
    },
  },
  routeRules: {
    /*
      The signed-in app renders in the browser. Its guard (`middleware/auth.ts`)
      is client-only because the session lives in cookies the browser owns, so
      server-rendering these pages would only paint a signed-out shell first.
      The auth pages keep SSR — they have nothing to wait for.
    */
    '/': { ssr: false },
  },
  vite: {
    plugins: [tailwindcss()],
  },
  app: {
    // Transition CSS lives in ~/assets/css/main.css
    pageTransition: { name: 'page', mode: 'out-in' },
    head: {
      htmlAttrs: { lang: 'en' },
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
        },
      ],
      script: [{ innerHTML: THEME_BOOT_SCRIPT, tagPosition: 'head' }],
    },
  },
})
