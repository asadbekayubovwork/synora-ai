<template>
  <div class="app-shell">
    <NuxtRouteAnnouncer />
    <NuxtPage />
  </div>

  <!--
    Outside `.app-shell` so the `overflow: clip` it takes on during route
    transitions can never catch the switcher, and client-only because the
    server can't know which theme this visitor stored.
  -->
  <ClientOnly>
    <ThemeSwitcher class="fixed top-4 right-4 z-50" />
  </ClientOnly>
</template>
