<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

const { user, logout } = useAuth()

const open = ref(false)
const root = ref<HTMLElement | null>(null)
const trigger = ref<HTMLButtonElement | null>(null)

const initial = computed(() => (user.value?.email[0] ?? '?').toUpperCase())

function close(refocus = false) {
  if (!open.value) return
  open.value = false
  if (refocus) trigger.value?.focus()
}

/** A menu that only closed on its own button would strand the panel open. */
function onPointerDown(event: PointerEvent) {
  if (!root.value?.contains(event.target as Node)) close()
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') close(true)
}

onMounted(() => {
  window.addEventListener('pointerdown', onPointerDown)
  window.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('pointerdown', onPointerDown)
  window.removeEventListener('keydown', onKeydown)
})

async function onSignOut() {
  close()
  await logout()
}
</script>

<template>
  <div ref="root" class="relative">
    <button
      ref="trigger"
      type="button"
      class="grid size-9 shrink-0 place-items-center rounded-full bg-linear-to-br from-[#e0407a] to-[#b4235c] text-[15px] font-medium text-white transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
      aria-label="Account menu"
      aria-haspopup="menu"
      :aria-expanded="open"
      @click="open = !open"
    >
      {{ initial }}
    </button>

    <div
      v-if="open"
      role="menu"
      class="absolute top-full right-0 z-40 mt-2 w-56 overflow-hidden rounded-xl border border-line bg-surface py-1 shadow-lg"
    >
      <p class="truncate px-3 py-2 text-[13px] text-ink-muted" :title="user?.email">
        {{ user?.email }}
      </p>

      <hr class="my-1 border-t border-line">

      <button
        type="button"
        role="menuitem"
        class="tap-target block w-full px-3 py-2 text-left text-[15px] text-ink transition hover:bg-canvas focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ink"
        @click="onSignOut"
      >
        Sign out
      </button>
    </div>
  </div>
</template>
