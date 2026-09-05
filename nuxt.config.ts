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

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  css: ['~/assets/css/main.css'],
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
