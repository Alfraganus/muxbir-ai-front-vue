<template>
  <svg :width="width" :height="height" style="display:block;overflow:visible;">
    <defs>
      <linearGradient :id="gradId" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" :stop-color="color" stop-opacity="0.22"/>
        <stop offset="100%" :stop-color="color" stop-opacity="0"/>
      </linearGradient>
    </defs>
    <path v-if="fill" :d="area" :fill="`url(#${gradId})`" />
    <path :d="line" fill="none" :stroke="color" :stroke-width="strokeWidth" stroke-linejoin="round" stroke-linecap="round"/>
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

const gradId = 'sg-' + Math.random().toString(36).slice(2, 7)

const points = computed(() => {
  if (!props.data.length) return []
  const min = Math.min(...props.data), max = Math.max(...props.data)
  const span = max - min || 1
  const stepX = props.width / (props.data.length - 1)
  return props.data.map((v, i) => [i * stepX, props.height - ((v - min) / span) * (props.height - 4) - 2])
})

const line = computed(() => points.value.map(([x, y], i) => (i === 0 ? 'M' : 'L') + x.toFixed(1) + ',' + y.toFixed(1)).join(' '))
const area = computed(() => line.value + ` L ${props.width},${props.height} L 0,${props.height} Z`)
</script>
