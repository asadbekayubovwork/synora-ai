<script setup lang="ts">
import { ref } from 'vue'

const { preference, setTheme } = useTheme()

const OPTIONS = [
  { value: 'system', label: 'Match system theme' },
  { value: 'light', label: 'Light theme' },
  { value: 'dark', label: 'Dark theme' },
] as const

const buttons = ref<HTMLButtonElement[]>([])

/**
 * Roving tabindex: a radiogroup is a single tab stop, and the arrow keys move
 * between the options — selecting as they go, as native radios do.
 */
function onKeydown(index: number, event: KeyboardEvent) {
  const step = event.key === 'ArrowRight' || event.key === 'ArrowDown'
    ? 1
    : event.key === 'ArrowLeft' || event.key === 'ArrowUp'
      ? -1
      : 0

  if (!step) return

  event.preventDefault()
  const next = (index + step + OPTIONS.length) % OPTIONS.length
  setTheme(OPTIONS[next]!.value)
  buttons.value[next]?.focus()
}
</script>

<template>
  <div
    role="radiogroup"
    aria-label="Theme"
    class="flex items-center gap-0.5 rounded-full border border-line bg-surface p-0.5"
  >
    <button
      v-for="(option, index) in OPTIONS"
      :key="option.value"
      :ref="el => { if (el) buttons[index] = el as HTMLButtonElement }"
      type="button"
      role="radio"
      :aria-checked="preference === option.value"
      :aria-label="option.label"
      :title="option.label"
      :tabindex="preference === option.value ? 0 : -1"
      class="grid size-7 place-items-center rounded-full transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
      :class="preference === option.value
        ? 'bg-canvas text-ink'
        : 'text-ink-muted hover:text-ink-soft'"
      @click="setTheme(option.value)"
      @keydown="onKeydown(index, $event)"
    >
      <svg
        viewBox="0 0 20 20"
        class="size-4"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <template v-if="option.value === 'system'">
          <rect x="2.6" y="4" width="14.8" height="9.6" rx="1.7" />
          <path d="M7.5 17h5M10 13.6V17" />
        </template>

        <template v-else-if="option.value === 'light'">
          <circle cx="10" cy="10" r="3.3" />
          <path d="M10 2.3v1.5M10 16.2v1.5M17.7 10h-1.5M3.8 10H2.3M15.45 4.55l-1.06 1.06M5.61 14.39l-1.06 1.06M15.45 15.45l-1.06-1.06M5.61 5.61 4.55 4.55" />
        </template>

        <template v-else>
          <path d="M16.4 12.3A6.9 6.9 0 0 1 7.7 3.6a6.9 6.9 0 1 0 8.7 8.7Z" />
        </template>
      </svg>
    </button>
  </div>
</template>
