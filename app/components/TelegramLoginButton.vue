<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import type { TelegramLoginPayload } from '~/composables/useOAuth'

/**
 * The official Telegram Login Widget.
 *
 * Telegram runs no OAuth server, so there is no consent URL to redirect to and
 * nothing this app could draw in its place: the widget's iframe is the only
 * thing that can produce a payload Telegram has signed. That also means it
 * arrives with Telegram's own styling — `data-radius` is as far as it bends.
 *
 * The bot's domain has to be set in BotFather to the exact origin this renders
 * on, or the iframe shows "Bot domain invalid" instead of a button.
 */
const props = withDefaults(
  defineProps<{
    /** From `/auth/oauth/providers` — `bot_username` on the Telegram entry. */
    botUsername: string
    size?: 'large' | 'medium' | 'small'
  }>(),
  { size: 'large' },
)

const emit = defineEmits<{
  auth: [payload: TelegramLoginPayload]
  error: []
}>()

const container = ref<HTMLElement | null>(null)

/*
  The widget evaluates `data-onauth` as source in global scope, so the handler
  has to be reachable from `window` under a name we can write into an attribute.
  Per-instance rather than fixed, so two widgets on one page cannot overwrite
  each other's callback.
*/
const handlerName = `__synoraTelegramAuth_${Math.random().toString(36).slice(2)}`

type GlobalHandlers = Record<string, ((payload: TelegramLoginPayload) => void) | undefined>

onMounted(() => {
  ;(window as unknown as GlobalHandlers)[handlerName] = payload => emit('auth', payload)

  // The widget replaces its own <script> tag with the iframe, so it has to be
  // appended where the button belongs rather than to <head>.
  const script = document.createElement('script')
  script.async = true
  script.src = 'https://telegram.org/js/telegram-widget.js?22'
  script.setAttribute('data-telegram-login', props.botUsername)
  script.setAttribute('data-size', props.size)
  script.setAttribute('data-radius', '10')
  script.setAttribute('data-onauth', `${handlerName}(user)`)
  script.addEventListener('error', () => emit('error'))

  container.value?.appendChild(script)
})

onBeforeUnmount(() => {
  delete (window as unknown as GlobalHandlers)[handlerName]
})
</script>

<template>
  <!-- Empty on the server; the widget fills it in on mount, so nothing to mismatch. -->
  <div ref="container" class="flex min-h-0 justify-center" />
</template>
