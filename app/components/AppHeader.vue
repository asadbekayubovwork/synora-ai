<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

defineProps<{ title: string }>()

const { toggle } = useSidebar()

const search = ref('')
const searchRef = ref<HTMLInputElement | null>(null)

/** The ⌘K badge promises a shortcut, so wire it up rather than just drawing it. */
function onShortcut(event: KeyboardEvent) {
  if (event.key !== 'k' || !(event.metaKey || event.ctrlKey)) return
  event.preventDefault()
  searchRef.value?.focus()
  searchRef.value?.select()
}

onMounted(() => window.addEventListener('keydown', onShortcut))
onBeforeUnmount(() => window.removeEventListener('keydown', onShortcut))
</script>

<template>
  <header class="sticky top-0 z-30 flex h-14 items-center gap-3 bg-surface px-4 sm:px-5">
    <button
      type="button"
      class="grid size-9 shrink-0 place-items-center rounded-lg text-ink-soft transition hover:bg-canvas hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
      aria-label="Toggle sidebar"
      @click="toggle"
    >
      <AppIcon name="panel" class="size-[19px]" />
    </button>

    <h1 class="truncate text-[15px] font-medium text-ink">
      {{ title }}
    </h1>

    <div class="ml-auto flex items-center gap-2">
      <div class="relative hidden sm:block">
        <AppIcon
          name="search"
          class="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-muted"
        />
        <!--
          iOS Safari zooms a focused input under 16px, so touch devices get
          16px while pointer devices keep the designed 15px — same rule the
          auth fields follow.
        -->
        <input
          ref="searchRef"
          v-model="search"
          type="search"
          placeholder="Search agents..."
          aria-label="Search agents"
          class="h-9 w-52 rounded-lg border border-line bg-surface pr-16 pl-9 text-[15px] text-ink outline-none transition placeholder:text-ink-muted hover:border-line-strong focus:border-ink lg:w-64 pointer-coarse:text-[16px]"
        >
        <span
          class="pointer-events-none absolute top-1/2 right-2 flex -translate-y-1/2 gap-1 text-ink-muted"
          aria-hidden="true"
        >
          <kbd class="grid h-5 w-5 place-items-center rounded border border-line text-[11px]">⌘</kbd>
          <kbd class="grid h-5 w-5 place-items-center rounded border border-line text-[11px]">K</kbd>
        </span>
      </div>

      <button
        type="button"
        class="hidden h-9 items-center rounded-lg border border-line px-3 text-[15px] font-medium text-ink transition hover:bg-canvas focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink md:flex"
      >
        Feedback
      </button>

      <NuxtLink
        to="/docs"
        class="hidden h-9 items-center rounded-lg border border-line px-3 text-[15px] font-medium text-ink transition hover:bg-canvas focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink md:flex"
      >
        Docs
      </NuxtLink>

      <ClientOnly>
        <ThemeSwitcher />
      </ClientOnly>

      <button
        type="button"
        class="relative grid size-9 shrink-0 place-items-center rounded-lg border border-line text-ink-soft transition hover:bg-canvas hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        aria-label="Notifications (unread)"
      >
        <AppIcon name="bell" class="size-[19px]" />
        <span class="absolute top-1.5 right-1.5 size-2 rounded-full bg-accent ring-2 ring-surface" />
      </button>

      <button
        type="button"
        class="grid size-9 shrink-0 place-items-center rounded-full bg-linear-to-br from-[#e0407a] to-[#b4235c] text-[15px] font-medium text-white transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        aria-label="Account menu"
      >
        A
      </button>
    </div>
  </header>
</template>
