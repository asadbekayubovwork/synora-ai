<script setup lang="ts">
import { computed } from 'vue'

const { collapsed } = useSidebar()
const route = useRoute()

/**
 * Pages name themselves through `definePageMeta({ pageTitle })`; the path is
 * the fallback so a new page still gets a sensible heading before it does.
 */
const title = computed(() => {
  const meta = route.meta.pageTitle
  if (typeof meta === 'string') return meta

  const segment = route.path.split('/').filter(Boolean).pop()
  if (!segment) return 'Home'

  return segment.replace(/-/g, ' ').replace(/\b\w/g, char => char.toUpperCase())
})
</script>

<template>
  <div class="min-h-dvh bg-surface">
    <AppSidebar />

    <!--
      The sidebar is fixed, so the gutter is padding here rather than a flex
      track — that keeps the sticky header aligned to the content column and
      lets the collapse animate without reflowing the page. Collapsed still
      reserves 4rem, because the sidebar becomes an icon rail rather than
      disappearing.
    -->
    <div
      class="flex min-h-dvh flex-col transition-[padding] duration-200 ease-out"
      :class="collapsed ? 'lg:pl-16' : 'lg:pl-64'"
    >
      <AppHeader :title="title" />

      <main class="flex-1 px-5 pt-8 pb-12 sm:px-8 sm:pt-12">
        <slot />
      </main>
    </div>
  </div>
</template>
