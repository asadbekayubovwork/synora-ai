import { watch } from 'vue'

/**
 * Owns the theme on the client: adopts the stored preference, tracks the OS
 * setting, and keeps <html> in sync from hydration onwards.
 *
 * The inline boot script in `nuxt.config.ts` has normally applied the theme
 * long before this runs. Re-applying it here is idempotent — it repaints
 * nothing in the common case, and recovers the one case the boot script can't
 * survive, where reading storage throws and it bails before writing anything.
 */
export default defineNuxtPlugin(() => {
  const { preference, systemDark, resolved } = useTheme()

  const root = document.documentElement
  const media = window.matchMedia('(prefers-color-scheme: dark)')

  systemDark.value = media.matches
  media.addEventListener('change', (event) => {
    systemDark.value = event.matches
  })

  const stored = read()
  if (stored) preference.value = stored

  applyTheme(resolved.value)

  // Registered after the state is seeded, so neither watcher fires for the
  // value the page already booted with — no transition on first load.
  let timer: ReturnType<typeof setTimeout> | undefined

  watch(resolved, (theme) => {
    root.dataset.themeChanging = ''
    applyTheme(theme)

    clearTimeout(timer)
    timer = setTimeout(() => {
      delete root.dataset.themeChanging
    }, THEME_TRANSITION_MS)
  })

  watch(preference, write)

  /** Points the page — and the mobile browser chrome behind it — at `theme`. */
  function applyTheme(theme: ResolvedTheme) {
    root.dataset.theme = theme

    let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
    if (!meta) {
      meta = document.createElement('meta')
      meta.name = 'theme-color'
      document.head.appendChild(meta)
    }
    meta.content = THEME_COLORS[theme]
  }

  /** Storage throws in Safari's private mode and when cookies are blocked. */
  function read(): ThemePreference | undefined {
    try {
      const value = localStorage.getItem(THEME_STORAGE_KEY)
      return isThemePreference(value) ? value : undefined
    }
    catch {
      return undefined
    }
  }

  function write(value: ThemePreference) {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, value)
    }
    catch {
      // A preference we can't persist still applies for this session.
    }
  }
})
