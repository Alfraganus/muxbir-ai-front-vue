<template>
  <svg :width="size" :height="size" viewBox="0 0 24 24" fill="none" stroke="currentColor"
       :stroke-width="strokeWidth" stroke-linecap="round" stroke-linejoin="round"
       :class="className" :style="style">
    <template v-if="name === 'Search'"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></template>
    <template v-else-if="name === 'Bell'"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.7 21a2 2 0 0 1-3.4 0"/></template>
    <template v-else-if="name === 'Plus'"><path d="M12 5v14M5 12h14"/></template>
    <template v-else-if="name === 'Minus'"><path d="M5 12h14"/></template>
    <template v-else-if="name === 'Chevron'"><path d="m6 9 6 6 6-6"/></template>
    <template v-else-if="name === 'ChevronR'"><path d="m9 6 6 6-6 6"/></template>
    <template v-else-if="name === 'ChevronL'"><path d="m15 6-6 6 6 6"/></template>
    <template v-else-if="name === 'Filter'"><path d="M3 5h18l-7 8.5V20l-4-2v-4.5z"/></template>
    <template v-else-if="name === 'Sort'"><path d="M7 4v16M3 8l4-4 4 4"/><path d="M17 20V4m-4 12 4 4 4-4"/></template>
    <template v-else-if="name === 'Check'"><path d="M5 12.5 9.5 17 19 7"/></template>
    <template v-else-if="name === 'Close'"><path d="M6 6l12 12M18 6 6 18"/></template>
    <template v-else-if="name === 'Home'"><path d="m3 9.5 9-7 9 7V20a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V13h6v9"/></template>
    <template v-else-if="name === 'Building'"><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M9 8h2M9 12h2M9 16h2M13 8h2M13 12h2M13 16h2"/></template>
    <template v-else-if="name === 'Tag'"><path d="M3.5 12.5 11 5h8v8l-7.5 7.5a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8z"/><circle cx="15.5" cy="8.5" r="1.3"/></template>
    <template v-else-if="name === 'Coin'"><circle cx="12" cy="12" r="9"/><path d="M14.5 9.5c0-1.4-1.1-2.2-2.5-2.2s-2.5.9-2.5 2.3 1.1 2.1 2.5 2.1 2.5.8 2.5 2.2-1.1 2.3-2.5 2.3-2.5-.8-2.5-2.2"/><path d="M12 5.5V7M12 17v1.5"/></template>
    <template v-else-if="name === 'Users'"><circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5"/><path d="M16.5 5.4a3 3 0 0 1 0 5.6M18.5 19.5c0-2.4-1.2-4-3.2-4.7"/></template>
    <template v-else-if="name === 'Shield'"><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/></template>
    <template v-else-if="name === 'Server'"><rect x="3" y="4" width="18" height="7" rx="2"/><rect x="3" y="13" width="18" height="7" rx="2"/><path d="M7 7.5h.01M7 16.5h.01"/></template>
    <template v-else-if="name === 'Life'"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3.6"/><path d="m5.5 5.5 3.4 3.4M15.1 15.1l3.4 3.4M5.5 18.5l3.4-3.4M15.1 8.9l3.4-3.4"/></template>
    <template v-else-if="name === 'Layers'"><path d="m12 3 9 5-9 5-9-5z"/><path d="m3 13 9 5 9-5M3 17.5l9 5 9-5"/></template>
    <template v-else-if="name === 'Send'"><path d="M21.5 3 2 11l7 2.5L11.5 21l3-7z"/><path d="m9 13.5 12.5-10.5"/></template>
    <template v-else-if="name === 'Calendar'"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9.5h18M8 3v4M16 3v4"/></template>
    <template v-else-if="name === 'Globe'"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/></template>
    <template v-else-if="name === 'Globe2'"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></template>
    <template v-else-if="name === 'Chart'"><path d="M4 20V10M10 20V4M16 20v-7"/><path d="M3 20.5h18"/></template>
    <template v-else-if="name === 'Settings'"><circle cx="12" cy="12" r="3"/><path d="M12 2v2.5M12 19.5V22M4.2 4.2l1.8 1.8M18 18l1.8 1.8M2 12h2.5M19.5 12H22M4.2 19.8 6 18M18 6l1.8-1.8"/></template>
    <template v-else-if="name === 'Bolt'"><path d="M13 2 4 13h6l-1 9 9-11h-6z"/></template>
    <template v-else-if="name === 'Eye'"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></template>
    <template v-else-if="name === 'Edit'"><path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13.5 6.5 4 4"/></template>
    <template v-else-if="name === 'Trash'"><path d="M3.5 6.5h17M9 6.5V4.5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 6.5l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13M10 11v6M14 11v6"/></template>
    <template v-else-if="name === 'Copy'"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M4 16V6a2 2 0 0 1 2-2h10"/></template>
    <template v-else-if="name === 'Arrow'"><path d="M4 12h15m-6-6 6 6-6 6"/></template>
    <template v-else-if="name === 'ArrowUp'"><path d="M12 20V5m-7 7 7-7 7 7"/></template>
    <template v-else-if="name === 'ArrowDown'"><path d="M12 4v15m-7-7 7 7 7-7"/></template>
    <template v-else-if="name === 'Sparkle'"><path d="M12 3l1.7 4.8L18.5 9.5l-4.8 1.7L12 16l-1.7-4.8L5.5 9.5l4.8-1.7z"/><path d="M18.5 14.5l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z"/></template>
    <template v-else-if="name === 'Telegram'"><path d="M21.5 4.3 2.9 11.5c-1.1.4-1.1 1 0 1.3l4.6 1.5 1.8 5.6c.2.6.5.8.9.5l2.6-2 4.9 3.6c.7.5 1.5.2 1.7-.7l3.2-15c.3-1.2-.4-1.8-1.1-1.5z"/><path d="m7.5 14.3 10.3-7.3-8 7.7"/></template>
    <template v-else-if="name === 'Facebook'"><path d="M13 22v-8h2.7l.4-3.2H13V8.7c0-.9.3-1.6 1.6-1.6h1.7V4.2c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3v2.4H6.8V14h2.8v8z"/></template>
    <template v-else-if="name === 'Instagram'"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="3.8"/><path d="M17.2 6.8h.01"/></template>
    <template v-else-if="name === 'Robot'"><rect x="4" y="8" width="16" height="11" rx="3"/><path d="M12 4v4M9 13v1.5M15 13v1.5"/><path d="M2 12v3M22 12v3"/><circle cx="12" cy="4" r="1.2"/></template>
    <template v-else-if="name === 'Database'"><ellipse cx="12" cy="5.5" rx="8" ry="2.8"/><path d="M4 5.5v6c0 1.5 3.6 2.8 8 2.8s8-1.3 8-2.8v-6M4 11.5v6c0 1.5 3.6 2.8 8 2.8s8-1.3 8-2.8v-6"/></template>
    <template v-else-if="name === 'List'"><path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01"/></template>
    <template v-else-if="name === 'Dot'"><circle cx="12" cy="12" r="3.5" fill="currentColor" stroke="none"/></template>
    <template v-else-if="name === 'More'"><circle cx="5" cy="12" r="1.5" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1.5" fill="currentColor" stroke="none"/></template>
  </svg>
</template>

<script setup>
defineProps({
  name: { type: String, required: true },
  size: { type: Number, default: 16 },
  strokeWidth: { type: Number, default: 1.75 },
  className: { type: String, default: '' },
  style: { type: Object, default: () => ({}) },
})
</script>
