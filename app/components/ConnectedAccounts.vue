<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { OAuthProviderInfo, OAuthProviderName, TelegramLoginPayload } from '~/composables/useOAuth'

/**
 * The providers attached to the signed-in account, and the controls to attach
 * or detach one.
 *
 * Linking reuses the sign-in redirect with `intent=link`, so the browser leaves
 * for the provider and comes back through `/auth/callback` exactly as it does
 * on the login page — only the last call differs.
 */
const { data: providers } = await useOAuthProviders()
const { accounts, loadAccounts, startAuthorize, linkTelegram, unlink } = useOAuth()

/*
  Already populated when we arrive straight from a successful link, and there is
  no reason to blank the rows out again while the re-check runs.
*/
const loading = ref(accounts.value.length === 0)
const busyProvider = ref<OAuthProviderName | null>(null)
const error = ref('')

/** Which providers are linked, by name, so each row can look itself up. */
const linked = computed(() =>
  new Map(accounts.value.map(account => [account.provider, account])),
)

onMounted(async () => {
  try {
    await loadAccounts()
  }
  catch (err) {
    error.value = apiErrorMessage(err, 'We could not load your connected accounts.')
  }
  finally {
    loading.value = false
  }
})

/** What to show under a provider's name: the identity it signed in with. */
function subtitle(provider: OAuthProviderInfo): string {
  const account = linked.value.get(provider.name)
  if (!account) return 'Not connected'

  return account.email ?? account.username ?? 'Connected'
}

async function onConnect(provider: OAuthProviderInfo) {
  if (busyProvider.value) return

  error.value = ''
  busyProvider.value = provider.name

  try {
    await startAuthorize(provider.name, { intent: 'link', redirect: '/settings' })
    // Left busy on purpose — the browser is leaving for the consent screen.
  }
  catch (err) {
    error.value = apiErrorMessage(err, `We could not start connecting ${provider.label}.`)
    busyProvider.value = null
  }
}

async function onTelegram(payload: TelegramLoginPayload) {
  if (busyProvider.value) return

  error.value = ''
  busyProvider.value = 'telegram'

  try {
    await linkTelegram(payload)
  }
  catch (err) {
    error.value = apiErrorMessage(err, 'We could not connect your Telegram account.')
  }
  finally {
    busyProvider.value = null
  }
}

async function onDisconnect(provider: OAuthProviderInfo) {
  if (busyProvider.value) return

  error.value = ''
  busyProvider.value = provider.name

  try {
    await unlink(provider.name)
  }
  catch (err) {
    // `oauth_last_login_method` lands here: the API refuses to leave an account
    // with no way in, and says so better than a guess would.
    error.value = apiErrorMessage(err, `We could not disconnect ${provider.label}.`)
  }
  finally {
    busyProvider.value = null
  }
}
</script>

<template>
  <section class="rounded-xl border border-line p-5">
    <h3 class="text-[15px] font-medium text-ink">
      Connected accounts
    </h3>
    <p class="mt-1 text-[15px] text-ink-soft">
      Sign in to Synora with any of these instead of your password.
    </p>

    <FormError v-if="error" class="mt-4">
      {{ error }}
    </FormError>

    <p v-if="!providers.length" class="mt-5 text-[15px] text-ink-muted">
      No sign-in providers are configured on this server yet.
    </p>

    <ul v-else class="mt-5 divide-y divide-line border-t border-line">
      <li
        v-for="provider in providers"
        :key="provider.name"
        class="flex flex-wrap items-center gap-x-4 gap-y-3 py-4"
      >
        <ProviderMark :provider="provider.name" class="size-5 shrink-0 text-ink" />

        <div class="min-w-0 flex-1">
          <p class="text-[15px] font-medium text-ink">
            {{ provider.label }}
          </p>
          <p class="truncate text-[15px] text-ink-soft">
            {{ loading ? '…' : subtitle(provider) }}
          </p>
        </div>

        <template v-if="!loading">
          <button
            v-if="linked.has(provider.name)"
            type="button"
            :disabled="busyProvider !== null"
            class="h-9 shrink-0 rounded-lg border border-line px-3 text-[15px] font-medium text-ink transition hover:bg-canvas focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-surface"
            @click="onDisconnect(provider)"
          >
            {{ busyProvider === provider.name ? 'Disconnecting…' : 'Disconnect' }}
          </button>

          <!--
            Telegram has no consent redirect: only its own widget can produce a
            payload Telegram has signed, so connecting means rendering that.
          -->
          <TelegramLoginButton
            v-else-if="provider.name === 'telegram' && provider.bot_username"
            :bot-username="provider.bot_username"
            size="medium"
            class="shrink-0"
            @auth="onTelegram"
            @error="error = 'The Telegram login widget could not load. Check your connection and try again.'"
          />

          <button
            v-else-if="provider.supports_code_flow"
            type="button"
            :disabled="busyProvider !== null"
            class="h-9 shrink-0 rounded-lg bg-brand px-3 text-[15px] font-medium text-on-brand transition hover:bg-brand-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-brand"
            @click="onConnect(provider)"
          >
            {{ busyProvider === provider.name ? 'Connecting…' : 'Connect' }}
          </button>
        </template>
      </li>
    </ul>
  </section>
</template>
