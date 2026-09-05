<script setup lang="ts">
import { computed, ref, useId } from 'vue'

const props = withDefaults(
  defineProps<{
    label: string
    type?: 'text' | 'email' | 'password'
    placeholder?: string
    autocomplete?: string
    invalid?: boolean
  }>(),
  { type: 'text', placeholder: '', autocomplete: undefined, invalid: false },
)

const model = defineModel<string>({ required: true })

const id = useId()

const revealed = ref(false)
const isPassword = computed(() => props.type === 'password')
const resolvedType = computed(() =>
  isPassword.value && revealed.value ? 'text' : props.type,
)
</script>

<template>
  <div>
    <div class="mb-2 flex items-baseline justify-between gap-3">
      <label :for="id" class="text-[15px] text-ink">{{ label }}</label>
      <slot name="labelAction" />
    </div>

    <div class="relative">
      <!--
        iOS Safari zooms the page when a focused input's text is under 16px, so
        touch devices get 16px while pointer devices keep the designed 15px.
      -->
      <input
        :id="id"
        v-model="model"
        :type="resolvedType"
        :placeholder="placeholder"
        :autocomplete="autocomplete"
        :aria-invalid="invalid || undefined"
        class="h-12 w-full rounded-xl border bg-surface px-4 text-[15px] text-ink outline-none transition placeholder:text-ink-muted pointer-coarse:text-[16px]"
        :class="[
          invalid
            ? 'border-danger focus:border-danger'
            : 'border-line hover:border-line-strong focus:border-ink',
          isPassword ? 'pr-12' : '',
        ]"
      >

      <button
        v-if="isPassword"
        type="button"
        class="absolute inset-y-0 right-0 grid w-12 place-items-center rounded-r-xl text-ink-soft transition hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        :aria-label="revealed ? 'Hide password' : 'Show password'"
        :aria-pressed="revealed"
        @click="revealed = !revealed"
      >
        <svg
          viewBox="0 0 20 20"
          class="size-[19px]"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M1.5 10S4.75 4.6 10 4.6 18.5 10 18.5 10 15.25 15.4 10 15.4 1.5 10 1.5 10Z" />
          <circle cx="10" cy="10" r="2.4" />
          <path v-if="revealed" d="M3.6 16.4 16.4 3.6" />
        </svg>
      </button>
    </div>
  </div>
</template>
