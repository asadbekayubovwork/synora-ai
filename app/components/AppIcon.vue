<script setup lang="ts">
/**
 * The app's line-icon set.
 *
 * Inline rather than a dependency, matching how every other SVG in this
 * codebase is drawn: one 20×20 grid, 1.5 stroke, round joins — so icons sit
 * evenly next to each other and inherit colour from their container.
 */
export type IconName =
  | 'home' | 'more' | 'knowledge' | 'tools' | 'integrations' | 'voices'
  | 'conversations' | 'users' | 'tests' | 'phone' | 'whatsapp' | 'settings'
  | 'outbound' | 'developers' | 'panel' | 'search' | 'bell' | 'send'
  | 'sparkle' | 'info' | 'chevron-down' | 'arrow-out'

defineProps<{ name: IconName }>()
</script>

<template>
  <svg
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    stroke-width="1.5"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <template v-if="name === 'home'">
      <path d="M3.4 8.3 10 3.2l6.6 5.1v7.3a1.3 1.3 0 0 1-1.3 1.3H4.7a1.3 1.3 0 0 1-1.3-1.3V8.3Z" />
    </template>

    <!-- Three dots read as "more" at any size; drawn as zero-length round caps. -->
    <template v-else-if="name === 'more'">
      <path d="M5 10h.01M10 10h.01M15 10h.01" stroke-width="2.2" />
    </template>

    <template v-else-if="name === 'knowledge'">
      <path d="M4.2 4.6A1.4 1.4 0 0 1 5.6 3.2h9.2a.8.8 0 0 1 .8.8v11.1" />
      <path d="M5.6 13.6h10V16a.8.8 0 0 1-.8.8H5.6a1.6 1.6 0 0 1 0-3.2Z" />
      <path d="M7.4 6.6h5.4" />
    </template>

    <template v-else-if="name === 'tools'">
      <path d="M12.4 3.4a3.9 3.9 0 0 0-4.6 5.1l-4.2 4.2a1.7 1.7 0 0 0 2.4 2.4l4.2-4.2a3.9 3.9 0 0 0 5.1-4.6l-2.2 2.2-2.2-.6-.6-2.2 2.1-2.3Z" />
    </template>

    <template v-else-if="name === 'integrations'">
      <path d="M7.6 3.4h4.8v3.4H7.6zM3.2 13.2h4v3.4h-4zM12.8 13.2h4v3.4h-4z" />
      <path d="M10 6.8v2.6M5.2 13.2v-1.6h9.6v1.6" />
    </template>

    <template v-else-if="name === 'voices'">
      <path d="M4.4 4.4h3.4v3.4H4.4zM12.2 4.4h3.4v3.4h-3.4zM4.4 12.2h3.4v3.4H4.4zM12.2 12.2h3.4v3.4h-3.4z" />
    </template>

    <template v-else-if="name === 'conversations'">
      <path d="M3.6 5.4A1.6 1.6 0 0 1 5.2 3.8h9.6a1.6 1.6 0 0 1 1.6 1.6v5.6a1.6 1.6 0 0 1-1.6 1.6H8l-4.4 3.2v-3.2Z" />
      <path d="M7.2 8.2h.01M10 8.2h.01M12.8 8.2h.01" stroke-width="1.9" />
    </template>

    <template v-else-if="name === 'users'">
      <path d="M2.8 16.4v-1a3.2 3.2 0 0 1 3.2-3.2h1.8a3.2 3.2 0 0 1 3.2 3.2v1" />
      <path d="M9.3 5.9a2.4 2.4 0 1 1-4.8 0 2.4 2.4 0 0 1 4.8 0Z" />
      <path d="M13.2 12.4h.6a3.2 3.2 0 0 1 3.2 3.2v.8M12.6 4.1a2.4 2.4 0 0 1 0 4.6" />
    </template>

    <template v-else-if="name === 'tests'">
      <path d="M8.2 3.2v4.6l-3.9 6.4a1.4 1.4 0 0 0 1.2 2.1h9a1.4 1.4 0 0 0 1.2-2.1l-3.9-6.4V3.2" />
      <path d="M7 3.2h6M6.2 12.4h7.6" />
    </template>

    <template v-else-if="name === 'phone'">
      <path d="M6 2.8h8a1.2 1.2 0 0 1 1.2 1.2v12a1.2 1.2 0 0 1-1.2 1.2H6a1.2 1.2 0 0 1-1.2-1.2V4A1.2 1.2 0 0 1 6 2.8Z" />
      <path d="M8.8 14.6h2.4" />
    </template>

    <template v-else-if="name === 'whatsapp'">
      <path d="M3.4 16.6l1-3.4a6.2 6.2 0 1 1 2.4 2.3l-3.4 1.1Z" />
      <path d="M7.9 7.3c.2 1.6 2.2 3.7 3.9 4l.9-1 1.4.8-.3 1.2c-1.9.7-5.5-2.1-6.4-4.6l1-.7.9 1.2-.6.7" />
    </template>

    <template v-else-if="name === 'settings'">
      <path d="M12.4 10a2.4 2.4 0 1 1-4.8 0 2.4 2.4 0 0 1 4.8 0Z" />
      <path d="M15.9 12a1.3 1.3 0 0 0 .3 1.4l.1.1a1.5 1.5 0 1 1-2.2 2.2l-.1-.1a1.3 1.3 0 0 0-2.2.9v.2a1.5 1.5 0 1 1-3 0v-.1a1.3 1.3 0 0 0-2.3-.9l-.1.1a1.5 1.5 0 1 1-2.2-2.2l.1-.1a1.3 1.3 0 0 0-.9-2.2h-.2a1.5 1.5 0 1 1 0-3h.1a1.3 1.3 0 0 0 .9-2.3l-.1-.1a1.5 1.5 0 1 1 2.2-2.2l.1.1a1.3 1.3 0 0 0 1.4.3h.1a1.3 1.3 0 0 0 .8-1.2v-.2a1.5 1.5 0 1 1 3 0v.1a1.3 1.3 0 0 0 2.2.9l.1-.1a1.5 1.5 0 1 1 2.2 2.2l-.1.1a1.3 1.3 0 0 0-.3 1.4v.1a1.3 1.3 0 0 0 1.2.8h.2a1.5 1.5 0 1 1 0 3h-.1a1.3 1.3 0 0 0-1.2.8Z" />
    </template>

    <template v-else-if="name === 'outbound'">
      <path d="M12.6 12.1v2a1.3 1.3 0 0 1-1.5 1.3 12.6 12.6 0 0 1-5.5-2 12.4 12.4 0 0 1-3.8-3.8 12.6 12.6 0 0 1-2-5.6A1.3 1.3 0 0 1 1.1 2.5h2a1.3 1.3 0 0 1 1.3 1.2c.1.6.2 1.3.5 1.9a1.3 1.3 0 0 1-.3 1.4l-.9.9a10.2 10.2 0 0 0 3.8 3.8l.9-.9a1.3 1.3 0 0 1 1.4-.3c.6.3 1.2.4 1.9.5a1.3 1.3 0 0 1 1.1 1.3Z" />
      <path d="M13.4 7.2 18 2.6M18 2.6h-3.4M18 2.6V6" />
    </template>

    <template v-else-if="name === 'developers'">
      <path d="M2.8 5.4a1.6 1.6 0 0 1 1.6-1.6h11.2a1.6 1.6 0 0 1 1.6 1.6v9.2a1.6 1.6 0 0 1-1.6 1.6H4.4a1.6 1.6 0 0 1-1.6-1.6V5.4Z" />
      <path d="m6.6 8.4-1.6 1.6 1.6 1.6M9.4 12.4l1.4-4.8" />
    </template>

    <template v-else-if="name === 'panel'">
      <path d="M3 5.2a1.6 1.6 0 0 1 1.6-1.6h10.8A1.6 1.6 0 0 1 17 5.2v9.6a1.6 1.6 0 0 1-1.6 1.6H4.6A1.6 1.6 0 0 1 3 14.8V5.2Z" />
      <path d="M8 3.6v12.8" />
    </template>

    <template v-else-if="name === 'search'">
      <path d="M15.2 9a6.2 6.2 0 1 1-12.4 0 6.2 6.2 0 0 1 12.4 0ZM17.2 17.2l-3.8-3.8" />
    </template>

    <template v-else-if="name === 'bell'">
      <path d="M15 7.4a5 5 0 0 0-10 0c0 4.2-1.6 5.4-1.6 5.4h13.2S15 11.6 15 7.4Z" />
      <path d="M11.4 15.6a1.6 1.6 0 0 1-2.8 0" />
    </template>

    <template v-else-if="name === 'send'">
      <path d="M17.2 2.8 9 11M17.2 2.8l-5.2 14.4-3-6.2-6.2-3L17.2 2.8Z" />
    </template>

    <template v-else-if="name === 'sparkle'">
      <path d="m10 2.6 1.9 4.7 4.7 1.9-4.7 1.9L10 15.8l-1.9-4.7-4.7-1.9 4.7-1.9L10 2.6Z" />
    </template>

    <template v-else-if="name === 'info'">
      <path d="M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z" />
      <path d="M10 9.4v3.8M10 6.9h.01" stroke-width="1.7" />
    </template>

    <template v-else-if="name === 'chevron-down'">
      <path d="m5.6 8 4.4 4.4L14.4 8" />
    </template>

    <template v-else-if="name === 'arrow-out'">
      <path d="M7 13 13 7M8.2 7H13v4.8" />
    </template>
  </svg>
</template>
