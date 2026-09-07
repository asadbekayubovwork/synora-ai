<script setup lang="ts">
import type { OAuthProviderName } from '~/composables/useOAuth'

withDefaults(
  defineProps<{
    provider: OAuthProviderName
    label: string
    /**
     * The click has been accepted and the browser is on its way to the
     * provider. It stays true until the page unloads — there is no "finished"
     * state on this side of the redirect.
     */
    pending?: boolean
    disabled?: boolean
  }>(),
  { pending: false, disabled: false },
)
</script>

<template>
  <button
    type="button"
    :disabled="disabled || pending"
    class="relative flex h-12 w-full items-center justify-center rounded-xl border border-line bg-surface px-12 text-[15px] font-medium text-ink transition hover:bg-canvas focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-surface"
  >
    <!-- The mark sits flush left while the label stays centred in the full button. -->
    <span class="absolute left-4 flex items-center">
      <svg
        v-if="pending"
        viewBox="0 0 16 16"
        class="size-[19px] animate-spin"
        fill="none"
        aria-hidden="true"
      >
        <circle cx="8" cy="8" r="6.5" stroke="currentColor" stroke-opacity="0.3" stroke-width="2" />
        <path d="M14.5 8A6.5 6.5 0 0 0 8 1.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
      </svg>

      <ProviderMark v-else :provider="provider" class="size-[19px]" />
    </span>

    {{ label }}
  </button>
</template>
