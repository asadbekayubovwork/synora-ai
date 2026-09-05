<script setup lang="ts">
import { reactive, ref } from 'vue'

useHead({ title: 'Log in · Synora-AI' })

const form = reactive({ email: '', password: '' })
const formError = ref('')
const pending = ref(false)

async function onSubmit() {
  if (pending.value) return

  formError.value = ''
  pending.value = true
  try {
    // TODO: point this at the real Synora-AI auth endpoint.
    await $fetch('/api/auth/login', {
      method: 'POST',
      body: { email: form.email.trim(), password: form.password },
    })
    await navigateTo('/')
  }
  catch {
    formError.value = 'No user is found with these credentials.'
  }
  finally {
    pending.value = false
  }
}
</script>

<template>
  <div class="flex min-h-dvh items-center justify-center bg-white px-5 py-12">
    <div class="w-full max-w-[360px]">
      <div class="flex justify-center">
        <SynoraLogo />
      </div>

      <h1 class="mt-10 text-center text-[32px] leading-tight font-bold tracking-[-0.02em] text-ink">
        Welcome back
      </h1>

      <div class="mt-5 space-y-2">
        <SocialAuthButton provider="google" label="Sign in with Google" />
        <SocialAuthButton provider="github" label="Sign in with GitHub" />
      </div>

      <hr class="my-6 border-t border-line">

      <form class="space-y-4" novalidate @submit.prevent="onSubmit">
        <AuthField
          v-model="form.email"
          label="Email"
          type="email"
          autocomplete="email"
        />

        <AuthField
          v-model="form.password"
          label="Password"
          type="password"
          autocomplete="current-password"
        >
          <template #labelAction>
            <NuxtLink
              to="/forgot-password"
              class="rounded text-[15px] text-ink-muted underline-offset-4 transition hover:text-ink-soft hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
            >
              Forgot your password?
            </NuxtLink>
          </template>
        </AuthField>

        <p
          v-if="formError"
          role="alert"
          class="flex items-center gap-2 text-[15px] font-medium text-danger"
        >
          <svg
            viewBox="0 0 20 20"
            class="size-[19px] shrink-0"
            fill="none"
            stroke="currentColor"
            stroke-width="1.6"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <path d="M8.7 3.2a1.5 1.5 0 0 1 2.6 0l6.1 10.8a1.5 1.5 0 0 1-1.3 2.25H3.9A1.5 1.5 0 0 1 2.6 14L8.7 3.2Z" />
            <path d="M10 7.9v3.3" />
            <path d="M10 13.7h.01" />
          </svg>
          {{ formError }}
        </p>

        <button
          type="submit"
          :disabled="pending"
          class="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand text-[15px] font-medium text-white transition hover:bg-brand-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:cursor-not-allowed disabled:opacity-60"
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
          {{ pending ? 'Signing in…' : 'Sign in' }}
        </button>
      </form>

      <p class="mt-5 text-center text-[15px] text-ink">
        Don't have an account?
        <NuxtLink
          to="/signup"
          class="rounded underline underline-offset-2 transition hover:text-ink-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
          Sign up
        </NuxtLink>
      </p>
    </div>
  </div>
</template>
