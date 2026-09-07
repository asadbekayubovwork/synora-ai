<script setup lang="ts">
import { onMounted, ref } from 'vue'

/*
  Where a provider drops the browser after consent.

  No `guest` middleware: this page also finishes `intent=link`, which by
  definition runs with a session already open. And no `auth` middleware either,
  since a sign-in has none yet.
*/
definePageMeta({ layout: 'auth' })

useHead({ title: 'Finishing sign-in · Synora-AI' })

const route = useRoute()
const { takePending, completeLogin, completeLink } = useOAuth()

const status = ref<'working' | 'failed'>('working')
const message = ref('Finishing sign-in…')
const backTo = ref('/login')

/** Query values are `string | string[]`; a repeated param is not something to guess at. */
function single(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function fail(text: string, back = backTo.value) {
  status.value = 'failed'
  message.value = text
  backTo.value = back
}

onMounted(async () => {
  // Read-and-clear: an authorization code is single-use, so a reload of this
  // page must not replay a spent one.
  const pending = takePending()

  if (pending?.intent === 'link') backTo.value = '/settings'

  // A refusal comes back in the query string rather than as a failed redirect.
  const denied = single(route.query.error)
  if (denied) {
    return fail(
      denied === 'access_denied'
        ? 'You cancelled the sign-in, so nothing was changed.'
        : single(route.query.error_description) || 'The provider refused the sign-in. Please try again.',
    )
  }

  const code = single(route.query.code)
  const state = single(route.query.state)

  if (!code || !state) {
    return fail('This link is missing what the provider was supposed to send back. Please start again.')
  }

  /*
    The pending record is what names the provider — the redirect carries only
    `code` and `state`, because `redirect_uri` has to match the API's list
    exactly and cannot be given a query of ours. Losing it (a new tab, cleared
    storage) means there is nothing to exchange against.
  */
  if (!pending) {
    return fail('This sign-in was started somewhere else and could not be finished here. Please start again.')
  }

  // The API checks `state` too; this only saves a round-trip on a stale tab.
  if (pending.state !== state) {
    return fail('This sign-in link is out of date. Please start again.')
  }

  try {
    if (pending.intent === 'link') {
      message.value = 'Connecting your account…'
      await completeLink(pending.provider, code, state)
    }
    else {
      await completeLogin(pending.provider, code, state)
    }

    await navigateTo(pending.redirect.startsWith('/') ? pending.redirect : '/')
  }
  catch (err) {
    fail(apiErrorMessage(err, 'We could not finish the sign-in. Please try again.'))
  }
})
</script>

<template>
  <div class="flex min-h-dvh items-center justify-center bg-surface px-5 py-12">
    <div class="w-full max-w-[360px] text-center">
      <div class="flex justify-center">
        <SynoraLogo />
      </div>

      <template v-if="status === 'working'">
        <svg
          viewBox="0 0 16 16"
          class="mx-auto mt-10 size-6 animate-spin text-ink-soft"
          fill="none"
          aria-hidden="true"
        >
          <circle cx="8" cy="8" r="6.5" stroke="currentColor" stroke-opacity="0.3" stroke-width="2" />
          <path d="M14.5 8A6.5 6.5 0 0 0 8 1.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
        </svg>

        <p class="mt-4 text-[15px] text-ink-soft" role="status">
          {{ message }}
        </p>
      </template>

      <template v-else>
        <h1 class="mt-10 text-[32px] leading-tight font-bold tracking-[-0.02em] text-ink">
          That didn't work
        </h1>

        <p class="mt-3 text-[15px] text-ink-soft" role="alert">
          {{ message }}
        </p>

        <NuxtLink
          :to="backTo"
          class="mt-8 flex h-12 w-full items-center justify-center rounded-xl bg-brand text-[15px] font-medium text-on-brand transition hover:bg-brand-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
          {{ backTo === '/settings' ? 'Back to settings' : 'Back to sign in' }}
        </NuxtLink>
      </template>
    </div>
  </div>
</template>
