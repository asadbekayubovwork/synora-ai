<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, watch } from 'vue'
import type { IconName } from './AppIcon.vue'

const { collapsed, mobileOpen, isDesktop, visible, closeMobile, trackViewport } = useSidebar()
const route = useRoute()

trackViewport()

/*
  Collapsing narrows the sidebar to a 64px icon rail rather than hiding it, and
  that only happens from `lg` up — below it the same flag drives a full-width
  drawer, where the labels must stay. So both helpers scope themselves to `lg`
  and leave the mobile drawer untouched.
*/

/** Hidden once the rail is showing; visible everywhere else. */
const fullOnly = computed(() => (collapsed.value ? 'lg:hidden' : ''))

/** The mirror image: only ever visible in the rail. */
const railOnly = computed(() => (collapsed.value ? 'hidden lg:block' : 'hidden'))

/**
 * Actually showing icons without labels — the only state where a tooltip adds
 * anything. Unlike the class helpers this can't be left to CSS, since a
 * `title` either exists or doesn't.
 */
const isRail = computed(() => collapsed.value && isDesktop.value)

/** `avatar` swaps the icon slot for an agent's colour chip. */
type NavItem = { label: string, to: string, icon?: IconName, avatar?: boolean }
type NavGroup = { title?: string, items: NavItem[] }

const GROUPS: NavGroup[] = [
  { items: [{ label: 'Home', icon: 'home', to: '/' }] },
  {
    title: 'Agents',
    items: [
      { label: 'My Agent', avatar: true, to: '/agents/my-agent' },
      { label: 'More', icon: 'more', to: '/agents' },
    ],
  },
  {
    title: 'Configure',
    items: [
      { label: 'Knowledge Base', icon: 'knowledge', to: '/knowledge-base' },
      { label: 'Tools', icon: 'tools', to: '/tools' },
      { label: 'Integrations', icon: 'integrations', to: '/integrations' },
      { label: 'Voices', icon: 'voices', to: '/voices' },
    ],
  },
  {
    title: 'Monitor',
    items: [
      { label: 'Conversations', icon: 'conversations', to: '/conversations' },
      { label: 'Users', icon: 'users', to: '/users' },
      { label: 'Tests', icon: 'tests', to: '/tests' },
    ],
  },
  {
    title: 'Deploy',
    items: [
      { label: 'Phone Numbers', icon: 'phone', to: '/phone-numbers' },
      { label: 'WhatsApp', icon: 'whatsapp', to: '/whatsapp' },
      { label: 'Settings', icon: 'settings', to: '/settings' },
      { label: 'Outbound', icon: 'outbound', to: '/outbound' },
    ],
  },
]

/** `/` would otherwise prefix-match every route and stay lit. */
function isActive(to: string) {
  return to === '/' ? route.path === '/' : route.path.startsWith(to)
}

// The drawer covers the page on mobile, so navigating away has to dismiss it.
watch(() => route.fullPath, closeMobile)

/** Escape closes the drawer, as it does for any overlay. */
function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape' && mobileOpen.value) closeMobile()
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <!--
    Fixed at both breakpoints: docked beside the content on `lg`, and an
    overlay drawer below it. The layout reserves the gutter with padding, so
    nothing here participates in the page's own scrolling.
  -->
  <aside
    class="fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-line bg-surface transition-[transform,width] duration-200 ease-out"
    :class="[
      mobileOpen ? 'translate-x-0' : '-translate-x-full',
      collapsed ? 'lg:w-16' : 'lg:w-64',
      'lg:translate-x-0',
    ]"
    :inert="!visible"
  >
    <div class="flex h-14 shrink-0 items-center px-5" :class="collapsed && 'lg:justify-center lg:px-0'">
      <NuxtLink
        to="/"
        class="rounded focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink"
        aria-label="Synora-AI home"
      >
        <!--
          The wrappers carry the visibility, not the logos: SynoraLogo's root
          sets `inline-flex`, which would out-order a bare `hidden` on the same
          element and leave both marks on screen.
        -->
        <span :class="fullOnly"><SynoraLogo /></span>
        <span :class="railOnly"><SynoraLogo compact /></span>
      </NuxtLink>
    </div>

    <nav
      class="scroll-subtle flex-1 overflow-y-auto px-3 pb-4"
      :class="collapsed && 'lg:px-2'"
      aria-label="Main"
    >
      <div v-for="(group, index) in GROUPS" :key="group.title ?? index" :class="index > 0 && 'mt-5'">
        <template v-if="group.title">
          <p class="px-3 pb-1.5 text-[13px] font-medium text-ink-muted" :class="fullOnly">
            {{ group.title }}
          </p>
          <!-- The rail has no room for the label, so a rule keeps the grouping. -->
          <hr class="mx-1 mb-2 border-t border-line" :class="railOnly">
        </template>

        <ul class="space-y-0.5">
          <li v-for="item in group.items" :key="item.to">
            <NuxtLink
              :to="item.to"
              class="flex h-9 items-center gap-2.5 rounded-lg px-3 text-[15px] transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
              :class="[
                isActive(item.to)
                  ? 'bg-canvas font-medium text-ink'
                  : 'text-ink-soft hover:bg-canvas hover:text-ink',
                collapsed && 'lg:justify-center lg:px-0',
              ]"
              :aria-current="isActive(item.to) ? 'page' : undefined"
              :aria-label="item.label"
              :title="isRail ? item.label : undefined"
            >
              <span
                v-if="item.avatar"
                class="size-[19px] shrink-0 rounded-full bg-linear-to-br from-[#6ea8ff] via-[#7b7bf0] to-[#2f4bd8]"
              />
              <AppIcon v-else-if="item.icon" :name="item.icon" class="size-[19px] shrink-0" />
              <span :class="fullOnly">{{ item.label }}</span>
            </NuxtLink>
          </li>
        </ul>
      </div>

      <div class="mt-5 border-t border-line pt-3">
        <NuxtLink
          to="/developers"
          class="flex h-9 items-center gap-2.5 rounded-lg px-3 text-[15px] transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          :class="[
            isActive('/developers')
              ? 'bg-canvas font-medium text-ink'
              : 'text-ink-soft hover:bg-canvas hover:text-ink',
            collapsed && 'lg:justify-center lg:px-0',
          ]"
          aria-label="Developers"
          :title="isRail ? 'Developers' : undefined"
        >
          <AppIcon name="developers" class="size-[19px] shrink-0" />
          <span :class="fullOnly">Developers</span>
        </NuxtLink>
      </div>
    </nav>

    <!--
      Both of these keep their icon in the rail and drop only their prose, so
      the affordance survives the collapse instead of vanishing with the text.
    -->
    <div class="shrink-0 space-y-2 p-3" :class="collapsed && 'lg:p-2'">
      <button
        type="button"
        class="block w-full rounded-xl border border-line p-4 text-left transition hover:border-line-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        :class="collapsed && 'lg:p-1.5'"
        aria-label="Invite team members"
        :title="isRail ? 'Invite team members' : undefined"
      >
        <span
          class="mb-3 grid size-9 place-items-center rounded-full bg-canvas text-ink-soft"
          :class="collapsed && 'lg:mx-auto lg:mb-0'"
        >
          <AppIcon name="send" class="size-[19px]" />
        </span>
        <span class="block text-[15px] font-medium text-ink" :class="fullOnly">
          Invite team members
        </span>
        <span class="mt-1 block text-[13px] leading-relaxed text-ink-soft" :class="fullOnly">
          Bring your team in to collaborate and share your creations.
        </span>
      </button>

      <!-- `.upgrade-hatch` paints the diagonal texture; see main.css. -->
      <button
        type="button"
        class="upgrade-hatch flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-line text-[15px] font-medium text-ink transition hover:border-line-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        aria-label="Upgrade"
        :title="isRail ? 'Upgrade' : undefined"
      >
        <AppIcon name="sparkle" class="size-[19px] shrink-0" />
        <span :class="fullOnly">Upgrade</span>
      </button>
    </div>
  </aside>

  <!-- Backdrop for the mobile drawer; desktop keeps the sidebar docked. -->
  <div
    v-if="mobileOpen"
    class="fixed inset-0 z-40 bg-ink/20 lg:hidden"
    @click="closeMobile"
  />
</template>
