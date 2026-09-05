<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, ref } from 'vue'

useHead({ title: 'Reset your password · Synora-AI' })

const RESEND_SECONDS = 60
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

const step = ref<'email' | 'otp' | 'password'>('email')

const email = ref('')
const code = ref('')
const passwords = reactive({ next: '', confirm: '' })
const resetToken = ref('')

const error = ref('')
const pending = ref(false)

const otpRef = ref<{ focus: () => void } | null>(null)

/** Runs once the verification step has finished transitioning in. */
function focusOtp() {
  if (step.value === 'otp') otpRef.value?.focus()
}

const canContinue = computed(() => Boolean(email.value.trim()))
const canVerify = computed(() => code.value.length === 6)
const canReset = computed(() => Boolean(passwords.next && passwords.confirm))

/* ---- Resend cooldown ---------------------------------------------------- */

const secondsLeft = ref(0)
let timer: ReturnType<typeof setInterval> | undefined

function startCooldown() {
  secondsLeft.value = RESEND_SECONDS
  clearInterval(timer)
  timer = setInterval(() => {
    secondsLeft.value -= 1
    if (secondsLeft.value <= 0) clearInterval(timer)
  }, 1000)
}

onBeforeUnmount(() => clearInterval(timer))

/* ---- Step 1: which account ---------------------------------------------- */

async function onRequestCode() {
  if (pending.value || !canContinue.value) return

  error.value = ''
  if (!EMAIL_PATTERN.test(email.value.trim())) {
    error.value = 'Enter a valid email address.'
    return
  }

  pending.value = true
  try {
    // TODO: point this at the real Synora-AI password-reset endpoint.
    await $fetch('/api/auth/forgot-password', {
      method: 'POST',
      body: { email: email.value.trim() },
    })
    step.value = 'otp'
    code.value = ''
    startCooldown()
  }
  catch (err) {
    error.value = messageFrom(err, 'We could not send a code. Please try again.')
  }
  finally {
    pending.value = false
  }
}

/* ---- Step 2: prove the email is yours ------------------------------------ */

async function onVerify() {
  if (pending.value || !canVerify.value) return

  error.value = ''
  pending.value = true
  try {
    const { resetToken: token } = await $fetch<{ resetToken: string }>('/api/auth/verify-reset-otp', {
      method: 'POST',
      body: { email: email.value.trim(), code: code.value },
    })
    resetToken.value = token
    step.value = 'password'
    clearInterval(timer)
  }
  catch (err) {
    error.value = messageFrom(err, 'That code is not correct. Please try again.')
    code.value = ''
    otpRef.value?.focus()
  }
  finally {
    pending.value = false
  }
}

async function onResend() {
  if (secondsLeft.value > 0 || pending.value) return

  error.value = ''
  try {
    await $fetch('/api/auth/resend-otp', {
      method: 'POST',
      body: { email: email.value.trim(), purpose: 'reset' },
    })
    code.value = ''
    startCooldown()
    otpRef.value?.focus()
  }
  catch (err) {
    error.value = messageFrom(err, 'We could not resend the code. Please try again.')
  }
}

/* ---- Step 3: choose a new password --------------------------------------- */

async function onResetPassword() {
  if (pending.value || !canReset.value) return

  error.value = ''
  if (passwords.next.length < 8) {
    error.value = 'Password must be at least 8 characters.'
    return
  }
  if (passwords.next !== passwords.confirm) {
    error.value = 'Those passwords do not match.'
    return
  }

  pending.value = true
  try {
    await $fetch('/api/auth/reset-password', {
      method: 'POST',
      body: {
        email: email.value.trim(),
        resetToken: resetToken.value,
        password: passwords.next,
      },
    })
    await navigateTo('/login')
  }
  catch (err) {
    error.value = messageFrom(err, 'We could not reset your password. Please try again.')
  }
  finally {
    pending.value = false
  }
}

function backToEmail() {
  step.value = 'email'
  code.value = ''
  error.value = ''
  clearInterval(timer)
}

function messageFrom(err: unknown, fallback: string) {
  const status = (err as { data?: { statusMessage?: string } })?.data?.statusMessage
  return status || fallback
}
</script>

<template>
  <div class="flex min-h-dvh items-center justify-center bg-surface px-5 py-12">
    <div class="w-full max-w-[360px]">
      <div class="flex justify-center">
        <SynoraLogo />
      </div>

      <Transition name="step" mode="out-in" @after-enter="focusOtp">
        <div v-if="step === 'email'" key="email">
          <h1 class="mt-10 text-center text-[32px] leading-tight font-bold tracking-[-0.02em] text-ink">
            Reset your password
          </h1>

          <p class="mt-8 text-[15px] leading-relaxed text-ink-muted">
            Enter the email address associated with your account, and we'll send you a code to
            reset your password.
          </p>

          <form class="mt-9 space-y-4" novalidate @submit.prevent="onRequestCode">
            <AuthField
              v-model="email"
              label="Email"
              type="email"
              autocomplete="email"
            />

            <FormError v-if="error">
              {{ error }}
            </FormError>

            <PrimaryButton :pending="pending" :disabled="!canContinue">
              {{ pending ? 'Sending…' : 'Continue' }}
            </PrimaryButton>
          </form>

          <p class="mt-5 text-center text-[15px]">
            <NuxtLink
              to="/login"
              class="tap-target rounded text-ink underline underline-offset-2 transition hover:text-ink-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
            >
              Return to Sign In
            </NuxtLink>
          </p>
        </div>

        <!-- Step 2 — prove the email is yours -->
        <div v-else-if="step === 'otp'" key="otp">
          <h1 class="mt-10 text-center text-[32px] leading-tight font-bold tracking-[-0.02em] text-ink">
            Check your email
          </h1>

          <p class="mt-3 text-center text-[15px] text-ink-soft">
            We sent a 6-digit code to
            <span class="font-medium text-ink">{{ email.trim() }}</span>
          </p>

          <form class="mt-10 space-y-4" novalidate @submit.prevent="onVerify">
            <OtpInput
              ref="otpRef"
              v-model="code"
              :invalid="Boolean(error)"
              :disabled="pending"
              @complete="onVerify"
            />

            <FormError v-if="error">
              {{ error }}
            </FormError>

            <PrimaryButton :pending="pending" :disabled="!canVerify">
              {{ pending ? 'Verifying…' : 'Verify code' }}
            </PrimaryButton>
          </form>

          <p class="mt-5 text-center text-[15px] text-ink-soft">
            <template v-if="secondsLeft > 0">
              Resend code in {{ secondsLeft }}s
            </template>
            <template v-else>
              Didn't get the code?
              <button
                type="button"
                class="tap-target rounded text-ink underline underline-offset-2 transition hover:text-ink-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                @click="onResend"
              >
                Resend
              </button>
            </template>
          </p>

          <p class="mt-2 text-center text-[15px]">
            <button
              type="button"
              class="tap-target rounded text-ink-soft underline-offset-4 transition hover:text-ink hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
              @click="backToEmail"
            >
              Use a different email
            </button>
          </p>
        </div>

        <!-- Step 3 — choose a new password -->
        <div v-else key="password">
          <h1 class="mt-10 text-center text-[32px] leading-tight font-bold tracking-[-0.02em] text-ink">
            Set a new password
          </h1>

          <p class="mt-3 text-center text-[15px] text-ink-soft">
            Choose a password of at least 8 characters.
          </p>

          <form class="mt-10 space-y-4" novalidate @submit.prevent="onResetPassword">
            <AuthField
              v-model="passwords.next"
              label="New password"
              type="password"
              autocomplete="new-password"
            />

            <AuthField
              v-model="passwords.confirm"
              label="Confirm password"
              type="password"
              autocomplete="new-password"
            />

            <FormError v-if="error">
              {{ error }}
            </FormError>

            <PrimaryButton :pending="pending" :disabled="!canReset">
              {{ pending ? 'Resetting…' : 'Reset password' }}
            </PrimaryButton>
          </form>

          <p class="mt-5 text-center text-[15px]">
            <NuxtLink
              to="/login"
              class="tap-target rounded text-ink underline underline-offset-2 transition hover:text-ink-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
            >
              Return to Sign In
            </NuxtLink>
          </p>
        </div>
      </Transition>
    </div>
  </div>
</template>
