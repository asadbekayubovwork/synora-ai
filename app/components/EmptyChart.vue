<template>
  <!--
    The "no data yet" mark: a tilted chart card floating over a soft shadow.
    Drawn at `line` weight so it reads as an absence rather than as content,
    and it re-tints with the theme like every other token-driven surface.
  -->
  <svg
    viewBox="0 0 96 80"
    class="h-20 w-24 text-line-strong"
    fill="none"
    aria-hidden="true"
  >
    <ellipse cx="48" cy="70" rx="26" ry="4" class="fill-line" />

    <g transform="rotate(-6 48 34)">
      <rect
        x="26" y="10" width="44" height="48" rx="5"
        stroke="currentColor" stroke-width="2.5"
      />
      <path
        d="M38 44V32M48 44V24M58 44V36"
        stroke="currentColor"
        stroke-width="2.5"
        stroke-linecap="round"
      />
    </g>
  </svg>
</template>
