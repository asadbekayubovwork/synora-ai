<script setup lang="ts">
withDefaults(
  defineProps<{
    title: string
    /** Rendered as the `i` tooltip beside the title when present. */
    hint?: string
    value?: string
    empty?: string
  }>(),
  { hint: undefined, value: '–––', empty: 'No data has been collected' },
)
</script>

<template>
  <section class="flex min-h-[420px] flex-col rounded-xl border border-line p-5">
    <div class="flex items-center gap-1.5">
      <h3 class="text-[15px] font-medium text-ink">
        {{ title }}
      </h3>
      <span v-if="hint" class="text-ink-muted" :title="hint" :aria-label="hint">
        <AppIcon name="info" class="size-4" />
      </span>
    </div>

    <p class="mt-1 text-[19px] tracking-widest text-ink-muted">
      {{ value }}
    </p>

    <div class="flex flex-1 flex-col items-center justify-center gap-4 py-8">
      <EmptyChart />
      <p class="max-w-[380px] text-center text-[15px] leading-relaxed text-ink-soft">
        <slot name="empty">{{ empty }}</slot>
      </p>
    </div>

    <div v-if="$slots.footer" class="flex flex-wrap items-center justify-between gap-2">
      <slot name="footer" />
    </div>
  </section>
</template>
