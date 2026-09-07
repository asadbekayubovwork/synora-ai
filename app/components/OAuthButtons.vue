<script setup lang="ts">
import { computed, ref } from 'vue'
import type { OAuthProviderInfo, OAuthProviderName, TelegramLoginPayload } from '~/composables/useOAuth'

/**
 * The provider block above the email form on the auth pages.
 *
 * The list comes from the page rather than from here: `useOAuthProviders`
 * suspends, and the page is the boundary that can wait for it — a suspending
 * component inside signup's step `<Transition>` is a good way to strand a
 * transition mid-flight.
 *
 * Renders nothing at all when the server has no providers configured, hr
 * included, so the email form simply moves up.
 */
const props = withDefaults(
  defineProps<{
    providers: OAuthProviderInfo[]
    /** Verb for the labels — "Sign in with Google", "Sign up with GitHub". */
    action?: string
    /** Where a completed sign-in lands. */
    redirect?: string
    /** Top margin for the block; the two auth pages sit it at different heights. */
    offset?: string
  }>(),
  { action: 'Sign in', redirect: '/', offset: 'mt-5' },
)

const { startAuthorize, loginWithTelegram } = useOAuth()

/** Google and GitHub — the ones with a consent URL to send the browser to. */
const redirectProviders = computed(() => props.providers.filter(provider => provider.supports_code_flow))

/** Telegram is only usable if the API told us which bot to render the widget for. */
const telegram = computed(() =>
  props.providers.find(provider => provider.name === 'telegram' && provider.bot_username) ?? null,
)

const hasProviders = computed(() => redirectProviders.value.length > 0 || telegram.value !== null)

const pendingProvider = ref<OAuthProviderName | null>(null)
const error = ref('')

async function onProvider(provider: OAuthProviderInfo) {
  if (pendingProvider.value) return

  error.value = ''
  pendingProvider.value = provider.name

  try {
    await startAuthorize(provider.name, { redirect: props.redirect })
    // Deliberately not cleared: the browser is on its way to the consent
    // screen, and the button should stay busy until this page goes away.
  }
  catch (err) {
    error.value = apiErrorMessage(err, `We could not start the ${provider.label} sign-in. Please try again.`)
    pendingProvider.value = null
  }
}

async function onTelegram(payload: TelegramLoginPayload) {
  if (pendingProvider.value) return

  error.value = ''
  pendingProvider.value = 'telegram'

  try {
    // No redirect in this flow — the widget already returned a signed payload,
    // so this is the whole exchange and the session exists once it resolves.
    await loginWithTelegram(payload)
    await navigateTo(props.redirect)
  }
  catch (err) {
    error.value = apiErrorMessage(err, 'We could not sign you in with Telegram. Please try again.')
    pendingProvider.value = null
  }
}
</script>

<template>
  <div v-if="hasProviders" :class="offset">
    <div class="space-y-2">
      <SocialAuthButton
        v-for="provider in redirectProviders"
        :key="provider.name"
        :provider="provider.name"
        :label="`${action} with ${provider.label}`"
        :pending="pendingProvider === provider.name"
        :disabled="pendingProvider !== null && pendingProvider !== provider.name"
        @click="onProvider(provider)"
      />

      <TelegramLoginButton
        v-if="telegram?.bot_username"
        :bot-username="telegram.bot_username"
        @auth="onTelegram"
        @error="error = 'The Telegram login widget could not load. Check your connection and try again.'"
      />
    </div>

    <FormError v-if="error" class="mt-3">
      {{ error }}
    </FormError>

    <hr class="my-6 border-t border-line">
  </div>
</template>
