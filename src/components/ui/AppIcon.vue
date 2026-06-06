<template>
  <svg :width="size" :height="size" viewBox="0 0 24 24" fill="none" stroke="currentColor"
       :stroke-width="strokeWidth" stroke-linecap="round" stroke-linejoin="round"
       :class="className" :style="style">
    <template v-if="name === 'Search'"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></template>
    <template v-else-if="name === 'Bell'"><path d="M6 8a6 6 0 0 1 12 0c0 5 2 6 2 7H4c0-1 2-2 2-7"/><path d="M10 19a2 2 0 0 0 4 0"/></template>
    <template v-else-if="name === 'Plus'"><path d="M12 5v14M5 12h14"/></template>
    <template v-else-if="name === 'Minus'"><path d="M5 12h14"/></template>
    <template v-else-if="name === 'Chevron'"><path d="M6 9l6 6 6-6"/></template>
    <template v-else-if="name === 'ChevronR'"><path d="M9 6l6 6-6 6"/></template>
    <template v-else-if="name === 'ChevronL'"><path d="M15 6l-6 6 6 6"/></template>
    <template v-else-if="name === 'Filter'"><path d="M4 5h16l-6 8v6l-4-2v-4z"/></template>
    <template v-else-if="name === 'Sort'"><path d="M7 4v16M3 8l4-4 4 4"/><path d="M17 20V4M13 16l4 4 4-4"/></template>
    <template v-else-if="name === 'Check'"><path d="M4 12l5 5L20 6"/></template>
    <template v-else-if="name === 'Close'"><path d="M6 6l12 12M6 18L18 6"/></template>
    <template v-else-if="name === 'Home'"><path d="M3 11l9-7 9 7v9a2 2 0 0 1-2 2h-4v-6h-6v6H5a2 2 0 0 1-2-2z"/></template>
    <template v-else-if="name === 'Building'"><rect x="4" y="3" width="16" height="18" rx="1.5"/><path d="M9 7h2M9 11h2M9 15h2M13 7h2M13 11h2M13 15h2"/></template>
    <template v-else-if="name === 'Tag'"><path d="M3 12l9-9h7v7l-9 9z"/><circle cx="15.5" cy="8.5" r="1.2"/></template>
    <template v-else-if="name === 'Coin'"><circle cx="12" cy="12" r="9"/><path d="M9 9.5C9 8 10.3 7 12 7s3 1 3 2.5S13.7 12 12 12s-3 1-3 2.5S10.3 17 12 17s3-1 3-2.5"/><path d="M12 5.5V7M12 17v1.5"/></template>
    <template v-else-if="name === 'Users'"><circle cx="9" cy="8" r="3"/><path d="M3 20c0-3 3-5 6-5s6 2 6 5"/><circle cx="17" cy="9" r="2.4"/><path d="M21 19c0-2-1.7-3.5-4-3.8"/></template>
    <template v-else-if="name === 'Shield'"><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/></template>
    <template v-else-if="name === 'Server'"><rect x="3" y="4" width="18" height="7" rx="1.2"/><rect x="3" y="13" width="18" height="7" rx="1.2"/><circle cx="7" cy="7.5" r=".6" fill="currentColor"/><circle cx="7" cy="16.5" r=".6" fill="currentColor"/></template>
    <template v-else-if="name === 'Life'"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3.5"/><path d="M5.4 5.4l3.6 3.6M15 15l3.6 3.6M5.4 18.6L9 15M15 9l3.6-3.6"/></template>
    <template v-else-if="name === 'Layers'"><path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5M3 18l9 5 9-5"/></template>
    <template v-else-if="name === 'Send'"><path d="M3 12l18-9-7 18-2.5-7.5z"/></template>
    <template v-else-if="name === 'Calendar'"><rect x="3" y="5" width="18" height="16" rx="1.5"/><path d="M3 9h18M8 3v4M16 3v4"/></template>
    <template v-else-if="name === 'Globe'"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/></template>
    <template v-else-if="name === 'Globe2'"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a13 13 0 0 1 0 18M12 3a13 13 0 0 0 0 18"/></template>
    <template v-else-if="name === 'Chart'"><path d="M4 20V8M10 20V4M16 20v-8M22 20H2"/></template>
    <template v-else-if="name === 'Settings'"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9A1.7 1.7 0 0 0 10 4.5V4a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V10a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></template>
    <template v-else-if="name === 'Bolt'"><path d="M13 2L4 14h7l-1 8 9-12h-7z"/></template>
    <template v-else-if="name === 'Eye'"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></template>
    <template v-else-if="name === 'Edit'"><path d="M4 20h4l10-10-4-4L4 16z"/><path d="M14 6l4 4"/></template>
    <template v-else-if="name === 'Trash'"><path d="M4 7h16M9 7V4h6v3M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13"/></template>
    <template v-else-if="name === 'Copy'"><rect x="8" y="8" width="12" height="12" rx="1.5"/><path d="M4 16V5a1 1 0 0 1 1-1h11"/></template>
    <template v-else-if="name === 'Arrow'"><path d="M5 12h14M13 6l6 6-6 6"/></template>
    <template v-else-if="name === 'ArrowUp'"><path d="M12 19V5M5 12l7-7 7 7"/></template>
    <template v-else-if="name === 'ArrowDown'"><path d="M12 5v14M5 12l7 7 7-7"/></template>
    <template v-else-if="name === 'Sparkle'"><path d="M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6zM18 14l.9 2.1 2.1.9-2.1.9-.9 2.1-.9-2.1L15 17l2.1-.9z"/></template>
    <template v-else-if="name === 'Telegram'"><path d="M21.5 4.2L2.8 11.4c-1.1.4-1.1 1 0 1.3l4.7 1.5 1.8 5.6c.2.6.4.8.9.8.4 0 .6-.2.9-.5l2.6-2.6 5.3 3.9c1 .5 1.7.2 1.9-.9l3.5-16.4c.3-1.4-.5-2-1.6-1.5z"/></template>
    <template v-else-if="name === 'Facebook'"><path d="M13 22v-8h3l.5-4H13V7.5c0-1.2.4-2 2-2h2V2.1c-.4 0-1.6-.1-3-.1-3 0-5 1.8-5 5.1V10H6v4h3v8z"/></template>
    <template v-else-if="name === 'Instagram'"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17" cy="7" r="1" fill="currentColor"/></template>
    <template v-else-if="name === 'Robot'"><rect x="4" y="7" width="16" height="12" rx="2"/><path d="M9 12v2M15 12v2M12 3v4M8 19v2M16 19v2"/><circle cx="12" cy="7" r="1" fill="currentColor"/></template>
    <template v-else-if="name === 'Database'"><ellipse cx="12" cy="5" rx="8" ry="2.6"/><path d="M4 5v6c0 1.4 3.6 2.6 8 2.6s8-1.2 8-2.6V5M4 11v6c0 1.4 3.6 2.6 8 2.6s8-1.2 8-2.6v-6"/></template>
    <template v-else-if="name === 'List'"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/></template>
    <template v-else-if="name === 'Dot'"><circle cx="12" cy="12" r="4" fill="currentColor"/></template>
    <template v-else-if="name === 'More'"><circle cx="5" cy="12" r="1.4" fill="currentColor"/><circle cx="12" cy="12" r="1.4" fill="currentColor"/><circle cx="19" cy="12" r="1.4" fill="currentColor"/></template>
  </svg>
</template>

<script setup>
defineProps({
  name: { type: String, required: true },
  size: { type: Number, default: 16 },
  strokeWidth: { type: Number, default: 1.6 },
  className: { type: String, default: '' },
  style: { type: Object, default: () => ({}) },
})
</script>
