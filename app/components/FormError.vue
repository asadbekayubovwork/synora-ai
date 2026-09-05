<template>
  <p role="alert" class="flex items-center gap-2 text-[15px] font-medium text-danger">
    <svg
      viewBox="0 0 20 20"
      class="size-[19px] shrink-0"
      fill="none"
      stroke="currentColor"
      stroke-width="1.6"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path d="M8.7 3.2a1.5 1.5 0 0 1 2.6 0l6.1 10.8a1.5 1.5 0 0 1-1.3 2.25H3.9A1.5 1.5 0 0 1 2.6 14L8.7 3.2Z" />
      <path d="M10 7.9v3.3" />
      <path d="M10 13.7h.01" />
    </svg>
    <slot />
  </p>
</template>
