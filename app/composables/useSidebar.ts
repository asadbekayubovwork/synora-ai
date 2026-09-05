import { computed, onBeforeUnmount, onMounted } from 'vue'

const DESKTOP = '(min-width: 1024px)'

/**
 * Sidebar open/closed state, shared between the header's toggle and the
 * sidebar itself.
 *
 * The sidebar means different things either side of `lg`: docked on desktop,
 * where the flag narrows it to an icon rail, and an overlay drawer below it,
 * where the flag opens it. Both start closed/expanded so the server and
 * client agree on the same first render.
 */
export function useSidebar() {
  const collapsed = useState('sidebar:collapsed', () => false)
  const mobileOpen = useState('sidebar:mobile-open', () => false)

  // Desktop-first, matching the docked sidebar the server renders; the real
  // value lands in `trackViewport`'s onMounted, after hydration has settled.
  const isDesktop = useState('sidebar:desktop', () => true)

  /**
   * Whether the sidebar is on screen at all. On desktop it always is —
   * collapsing narrows it to an icon rail rather than hiding it — so only the
   * mobile drawer can take it off screen.
   */
  const visible = computed(() => isDesktop.value || mobileOpen.value)

  function toggle() {
    if (isDesktop.value) collapsed.value = !collapsed.value
    else mobileOpen.value = !mobileOpen.value
  }

  function closeMobile() {
    mobileOpen.value = false
  }

  /** Call once, from the sidebar, to keep `isDesktop` honest as the page resizes. */
  function trackViewport() {
    let media: MediaQueryList | undefined

    const sync = (event: MediaQueryList | MediaQueryListEvent) => {
      isDesktop.value = event.matches
      // Leaving mobile with the drawer open would otherwise strand the backdrop.
      if (event.matches) mobileOpen.value = false
    }

    onMounted(() => {
      media = window.matchMedia(DESKTOP)
      sync(media)
      media.addEventListener('change', sync)
    })

    onBeforeUnmount(() => media?.removeEventListener('change', sync))
  }

  return { collapsed, mobileOpen, isDesktop, visible, toggle, closeMobile, trackViewport }
}
