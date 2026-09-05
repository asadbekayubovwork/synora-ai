import { computed } from 'vue'

export type ThemePreference = 'system' | 'light' | 'dark'
export type ResolvedTheme = 'light' | 'dark'

export const THEME_STORAGE_KEY = 'synora-theme'

/** How long `data-theme-changing` stays on <html> — matches the CSS duration. */
export const THEME_TRANSITION_MS = 200

/** Browser-chrome colour per theme; mirrors `--color-surface` in main.css. */
export const THEME_COLORS: Record<ResolvedTheme, string> = {
  light: '#ffffff',
  dark: '#0b0b0c',
}

export function isThemePreference(value: unknown): value is ThemePreference {
  return value === 'system' || value === 'light' || value === 'dark'
}

/**
 * The app's colour theme.
 *
 * Until hydration the DOM is the source of truth: the inline script in
 * `nuxt.config.ts` stamps `data-theme` on <html> before first paint so the page
 * never flashes the wrong theme. `plugins/theme.client.ts` then adopts the
 * stored preference into this state and owns the DOM from there on.
 */
export function useTheme() {
  const preference = useState<ThemePreference>('theme', () => 'system')
  const systemDark = useState<boolean>('theme:system-dark', () => false)

  const resolved = computed<ResolvedTheme>(() => {
    if (preference.value === 'system') return systemDark.value ? 'dark' : 'light'
    return preference.value
  })

  function setTheme(next: ThemePreference) {
    preference.value = next
  }

  /** Flip to the opposite of what's on screen, whichever way we got there. */
  function toggleTheme() {
    setTheme(resolved.value === 'dark' ? 'light' : 'dark')
  }

  return { preference, systemDark, resolved, setTheme, toggleTheme }
}
