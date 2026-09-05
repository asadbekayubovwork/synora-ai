<script setup lang="ts">
/** `compact` drops the wordmark to its initial, for the collapsed icon rail. */
withDefaults(defineProps<{ compact?: boolean }>(), { compact: false })
</script>

<template>
  <span class="inline-flex items-center text-ink">
    <span class="text-[21px] leading-none font-bold tracking-[-0.02em]">
      {{ compact ? 'S' : 'Synora-AI' }}
    </span>
  </span>
</template>
