<script setup lang="ts">
import { computed } from 'vue'

definePageMeta({ pageTitle: 'Settings', middleware: 'auth' })

useHead({ title: 'Settings · Synora-AI' })

const { user } = useAuth()

/** A Telegram-only account has none, since Telegram hands out no address. */
const email = computed(() => user.value?.email ?? 'No email address on this account')

/*
  Worth stating plainly: an account created through a provider has no password,
  which is what makes the last connected provider undetachable.
*/
const passwordStatus = computed(() =>
  user.value?.hasPassword
    ? 'Set — you can sign in with your email and password.'
    : 'Not set — this account signs in through a connected provider.',
)
</script>

<template>
  <div class="mx-auto max-w-[720px] space-y-4">
    <section class="rounded-xl border border-line p-5">
      <h3 class="text-[15px] font-medium text-ink">
        Account
      </h3>

      <dl class="mt-4 space-y-3">
        <div>
          <dt class="text-[15px] text-ink-soft">
            Email
          </dt>
          <dd class="truncate text-[15px] text-ink" :class="{ 'text-ink-muted': !user?.email }">
            {{ email }}
          </dd>
        </div>

        <div>
          <dt class="text-[15px] text-ink-soft">
            Password
          </dt>
          <dd class="text-[15px] text-ink">
            {{ passwordStatus }}
          </dd>
        </div>
      </dl>
    </section>

    <ConnectedAccounts />
  </div>
</template>
