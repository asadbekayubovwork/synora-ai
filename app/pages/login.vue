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
  <div class="flex min-h-dvh items-center justify-center bg-surface px-5 py-12">
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
              class="tap-target rounded text-[15px] text-ink-muted underline-offset-4 transition hover:text-ink-soft hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
            >
              Forgot your password?
            </NuxtLink>
          </template>
        </AuthField>

        <FormError v-if="formError">
          {{ formError }}
        </FormError>

        <PrimaryButton :pending="pending">
          {{ pending ? 'Signing in…' : 'Sign in' }}
        </PrimaryButton>
      </form>

      <p class="mt-5 text-center text-[15px] text-ink">
        Don't have an account?
        <NuxtLink
          to="/signup"
          class="tap-target rounded underline underline-offset-2 transition hover:text-ink-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
          Sign up
        </NuxtLink>
      </p>
    </div>
  </div>
</template>
