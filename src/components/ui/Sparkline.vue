<template>
  <svg :viewBox="`0 0 ${width} ${height}`" preserveAspectRatio="none"
       :height="height" style="display:block;width:100%;overflow:visible;">
    <defs>
      <linearGradient :id="gradId" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" :stop-color="color" stop-opacity="0.22"/>
        <stop offset="100%" :stop-color="color" stop-opacity="0"/>
      </linearGradient>
    </defs>
    <path v-if="fill && points.length > 1" :d="areaPath" :fill="`url(#${gradId})`"/>
    <path v-if="points.length > 1" :d="linePath" fill="none" :stroke="color"
          :stroke-width="strokeWidth" stroke-linejoin="round" stroke-linecap="round"/>
    <!-- bo'sh / yagona nuqta holatida tekis chiziq -->
    <line v-else x1="0" :y1="height/2" :x2="width" :y2="height/2"
          :stroke="color" stroke-opacity="0.25" :stroke-width="strokeWidth"/>
  </svg>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  data: { type: Array, default: () => [] },
  width: { type: Number, default: 100 },
  height: { type: Number, default: 28 },
  color: { type: String, default: 'var(--accent)' },
  fill: { type: Boolean, default: true },
  strokeWidth: { type: Number, default: 1.5 },
})

const gradId = 'sg-' + Math.random().toString(36).slice(2, 8)

const points = computed(() => {
  const d = props.data || []
  if (!d.length) return []
  const min = Math.min(...d)
  const max = Math.max(...d)
  const span = (max - min) || 1
  const stepX = d.length > 1 ? props.width / (d.length - 1) : props.width
  return d.map((v, i) => [i * stepX, props.height - ((v - min) / span) * (props.height - 4) - 2])
})

const linePath = computed(() =>
  points.value.map(([x, y], i) => (i === 0 ? 'M' : 'L') + x.toFixed(1) + ',' + y.toFixed(1)).join(' '))

const areaPath = computed(() =>
  `${linePath.value} L ${props.width},${props.height} L 0,${props.height} Z`)
</script>
