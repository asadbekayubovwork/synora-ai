<template>
  <!--
    Auth pages own their full-screen centring, so this layout adds nothing but
    the theme control — which the dashboard puts in its header instead.
  -->
  <div>
    <slot />

    <ClientOnly>
      <ThemeSwitcher class="fixed top-4 right-4 z-50" />
    </ClientOnly>
  </div>
</template>
