<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    length?: number
    invalid?: boolean
    disabled?: boolean
  }>(),
  { length: 6, invalid: false, disabled: false },
)

const emit = defineEmits<{ complete: [code: string] }>()

const model = defineModel<string>({ required: true })

const boxes = ref<HTMLInputElement[]>([])
const chars = ref<string[]>(Array.from({ length: props.length }, () => ''))

// Keep the boxes in step when the parent clears or presets the code.
watch(model, (value) => {
  if (value === chars.value.join('')) return
  chars.value = Array.from({ length: props.length }, (_, i) => value[i] ?? '')
})

function sync() {
  model.value = chars.value.join('')
  if (chars.value.every(Boolean)) emit('complete', model.value)
}

async function focusAt(index: number) {
  await nextTick()
  const box = boxes.value[index]
  box?.focus()
  box?.select()
}

/** Writes `text` starting at `from`, returning the index after the last digit written. */
function fill(from: number, text: string) {
  let cursor = from
  for (const char of text) {
    if (cursor >= props.length) break
    chars.value[cursor] = char
    cursor += 1
  }
  return cursor
}

function onInput(index: number, event: Event) {
  const el = event.target as HTMLInputElement
  const digits = el.value.replace(/\D/g, '')

  if (!digits) {
    chars.value[index] = ''
    el.value = ''
    sync()
    return
  }

  // A fast typist or an autofill can land several digits in one box.
  const cursor = fill(index, digits)
  el.value = chars.value[index] ?? ''
  focusAt(Math.min(cursor, props.length - 1))
  sync()
}

function onKeydown(index: number, event: KeyboardEvent) {
  if (event.key === 'Backspace') {
    event.preventDefault()
    if (chars.value[index]) {
      chars.value[index] = ''
    }
    else if (index > 0) {
      chars.value[index - 1] = ''
      focusAt(index - 1)
    }
    sync()
  }
  else if (event.key === 'ArrowLeft' && index > 0) {
    event.preventDefault()
    focusAt(index - 1)
  }
  else if (event.key === 'ArrowRight' && index < props.length - 1) {
    event.preventDefault()
    focusAt(index + 1)
  }
}

function onPaste(index: number, event: ClipboardEvent) {
  const digits = (event.clipboardData?.getData('text') ?? '').replace(/\D/g, '')
  if (!digits) return

  event.preventDefault()
  const cursor = fill(index, digits)
  focusAt(Math.min(cursor, props.length - 1))
  sync()
}

defineExpose({ focus: () => focusAt(0) })
</script>

<template>
  <div class="flex gap-1.5 sm:gap-2">
    <input
      v-for="(char, index) in chars"
      :key="index"
      :ref="el => { if (el) boxes[index] = el as HTMLInputElement }"
      :value="char"
      type="text"
      inputmode="numeric"
      maxlength="1"
      :autocomplete="index === 0 ? 'one-time-code' : 'off'"
      :disabled="disabled"
      :aria-label="`Digit ${index + 1} of ${length}`"
      :aria-invalid="invalid || undefined"
      class="h-12 min-w-0 flex-1 rounded-xl border bg-white text-center text-[19px] font-medium text-ink outline-none transition disabled:cursor-not-allowed disabled:opacity-50"
      :class="invalid
        ? 'border-danger focus:border-danger'
        : 'border-line hover:border-line-strong focus:border-ink'"
      @input="onInput(index, $event)"
      @keydown="onKeydown(index, $event)"
      @paste="onPaste(index, $event)"
      @focus="($event.target as HTMLInputElement).select()"
    >
  </div>
</template>
