<script setup lang="ts">
withDefaults(
  defineProps<{
    type?: 'button' | 'submit'
    pending?: boolean
    disabled?: boolean
  }>(),
  { type: 'submit', pending: false, disabled: false },
)
</script>

<template>
  <button
    :type="type"
    :disabled="disabled || pending"
    class="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand text-[15px] font-medium text-white transition hover:bg-brand-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-brand"
  >
    <svg
      v-if="pending"
      viewBox="0 0 16 16"
      class="size-4 animate-spin"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" stroke-opacity="0.3" stroke-width="2" />
      <path d="M14.5 8A6.5 6.5 0 0 0 8 1.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
    </svg>
    <slot />
  </button>
</template>
