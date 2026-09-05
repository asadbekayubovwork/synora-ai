<script setup lang="ts">
import { computed } from 'vue'

definePageMeta({ pageTitle: 'Home' })

useHead({ title: 'Home · Synora-AI' })

// TODO: read the signed-in user from the real Synora-AI session.
const user = { name: 'Asadbek', workspace: "Asadbek's Workspace" }

const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
})
</script>

<template>
  <div class="mx-auto max-w-[1400px]">
    <p class="text-[15px] text-ink-soft">
      {{ user.workspace }}
    </p>
    <h2 class="mt-1 text-[32px] leading-tight tracking-[-0.02em] text-ink">
      {{ greeting }}, {{ user.name }}
    </h2>

    <div class="mt-6 grid gap-4 xl:grid-cols-2">
      <StatCard title="Overall Success Rate">
        <template #footer>
          <button
            type="button"
            class="flex h-9 items-center gap-1.5 rounded-lg border border-line px-3 text-[15px] text-ink transition hover:bg-canvas focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          >
            All
            <AppIcon name="chevron-down" class="size-4 text-ink-soft" />
          </button>

          <NuxtLink
            to="/conversations"
            class="flex h-9 items-center gap-1.5 rounded-lg border border-line px-3 text-[15px] text-ink transition hover:bg-canvas focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          >
            Filtered conversation history
            <AppIcon name="arrow-out" class="size-4 text-ink-soft" />
          </NuxtLink>
        </template>
      </StatCard>

      <StatCard title="Average CSAT Rating">
        <template #empty>
          No ratings collected yet. Enable feedback collection in an agent's
          widget to let callers rate conversations from 1 to 5.
        </template>
      </StatCard>

      <StatCard
        title="Agent Response Time"
        hint="Median time the agent takes to begin replying."
      />

      <StatCard
        title="Total Conversation Duration"
        hint="Combined length of every conversation in the selected period."
      />
    </div>
  </div>
</template>
