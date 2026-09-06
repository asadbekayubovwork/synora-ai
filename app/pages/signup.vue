<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'

definePageMeta({ layout: 'auth', middleware: 'guest' })

useHead({ title: 'Create an account · Synora-AI' })

const RESEND_SECONDS = 60
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

const route = useRoute()
const { register, verifyOtp, resendOtp } = useAuth()

/*
  `?verify=<email>` opens straight on the code step. Login sends unverified
  accounts here: the password was accepted, so all that is left is the code
  already sitting in their inbox.
*/
const pendingEmail = typeof route.query.verify === 'string' ? route.query.verify : ''

const step = ref<'details' | 'otp'>(pendingEmail ? 'otp' : 'details')

const form = reactive({ email: pendingEmail, password: '' })
const code = ref('')

const error = ref('')
const pending = ref(false)

const otpRef = ref<{ focus: () => void } | null>(null)

/** Runs once the verification step has finished transitioning in. */
function focusOtp() {
  if (step.value === 'otp') otpRef.value?.focus()
}

// Arriving on the code step directly means no transition runs, so `@after-enter`
// never fires and the focus above would never happen.
onMounted(() => {
  if (pendingEmail) focusOtp()
})

const canSubmitDetails = computed(() => Boolean(form.email.trim() && form.password))
const canVerify = computed(() => code.value.length === 6)

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

/* ---- Step 1: account details -------------------------------------------- */

async function onSubmitDetails() {
  if (pending.value || !canSubmitDetails.value) return

  error.value = ''

  if (!EMAIL_PATTERN.test(form.email.trim())) {
    error.value = 'Enter a valid email address.'
    return
  }
  if (form.password.length < 8) {
    error.value = 'Password must be at least 8 characters.'
    return
  }

  pending.value = true
  try {
    await register(form.email.trim(), form.password)
    step.value = 'otp'
    code.value = ''
    startCooldown()
    // Focus lands via the step transition's @after-enter — the input isn't mounted yet.
  }
  catch (err) {
    error.value = apiErrorMessage(err, 'We could not create your account. Please try again.')
  }
  finally {
    pending.value = false
  }
}

/* ---- Step 2: email verification ----------------------------------------- */

async function onVerify() {
  if (pending.value || !canVerify.value) return

  error.value = ''
  pending.value = true
  try {
    // Verifying signs the user in, so there is no login round-trip after this.
    await verifyOtp(form.email.trim(), code.value)
    await navigateTo('/')
  }
  catch (err) {
    error.value = apiErrorMessage(err, 'That code is not correct. Please try again.')
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
    await resendOtp(form.email.trim())
    code.value = ''
    startCooldown()
    otpRef.value?.focus()
  }
  catch (err) {
    error.value = apiErrorMessage(err, 'We could not resend the code. Please try again.')
  }
}

function backToDetails() {
  step.value = 'details'
  code.value = ''
  error.value = ''
  clearInterval(timer)
}
</script>

<template>
  <div class="flex min-h-dvh flex-col bg-surface">
    <main class="flex flex-1 items-center justify-center px-5 py-12">
      <div class="w-full max-w-[360px]">
        <div class="flex justify-center">
          <SynoraLogo />
        </div>

        <Transition name="step" mode="out-in" @after-enter="focusOtp">
          <!-- Step 1 — account details -->
          <div v-if="step === 'details'" key="details">
            <h1 class="mt-10 text-center text-[32px] leading-tight font-bold tracking-[-0.02em] text-ink">
              Create an account
            </h1>

            <div class="mt-10 space-y-2">
              <SocialAuthButton provider="google" label="Sign up with Google" />
              <SocialAuthButton provider="github" label="Sign up with GitHub" />
            </div>

            <hr class="my-6 border-t border-line">

            <form class="space-y-4" novalidate @submit.prevent="onSubmitDetails">
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
                autocomplete="new-password"
              />

              <FormError v-if="error">
                {{ error }}
              </FormError>

              <PrimaryButton :pending="pending" :disabled="!canSubmitDetails">
                {{ pending ? 'Signing up…' : 'Sign up' }}
              </PrimaryButton>
            </form>

            <p class="mt-5 text-center text-[15px] text-ink">
              Already registered?
              <NuxtLink
                to="/login"
                class="tap-target rounded underline underline-offset-2 transition hover:text-ink-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
              >
                Sign in
              </NuxtLink>
            </p>
          </div>

          <!-- Step 2 — email verification -->
          <div v-else key="otp">
            <h1 class="mt-10 text-center text-[32px] leading-tight font-bold tracking-[-0.02em] text-ink">
              Check your email
            </h1>

            <p class="mt-3 text-center text-[15px] text-ink-soft">
              We sent a 6-digit code to
              <span class="font-medium text-ink">{{ form.email.trim() }}</span>
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
                {{ pending ? 'Verifying…' : 'Verify email' }}
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
                @click="backToDetails"
              >
                Use a different email
              </button>
            </p>
          </div>
        </Transition>
      </div>
    </main>

    <footer class="border-t border-line bg-canvas px-5 py-5 text-center text-[15px] text-ink-soft">
      By continuing, you agree to our
      <NuxtLink to="/terms" class="tap-target underline underline-offset-2 transition hover:text-ink">Terms of Service</NuxtLink>
      and
      <NuxtLink to="/privacy" class="tap-target underline underline-offset-2 transition hover:text-ink">Privacy Policy</NuxtLink>.
    </footer>
  </div>
</template>
