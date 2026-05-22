<template>
  <svg :width="width" :height="height">
    <g v-for="(p, i) in gridLines" :key="i">
      <line :x1="pad.l" :y1="p.y" :x2="pad.l + W" :y2="p.y" stroke="var(--border-2)" :stroke-dasharray="p.dash ? '2,3' : '0'" />
      <text :x="pad.l - 6" :y="p.y + 3" font-size="10" fill="var(--muted)" text-anchor="end" :font-family="fontMono">{{ format(p.v) }}</text>
    </g>
    <g v-for="(v, i) in data" :key="i">
      <rect :x="barX(i)" :y="barY(v)" :width="barW" :height="barH(v)" rx="2" :fill="color" :opacity="i === data.length - 1 ? 1 : 0.62"/>
      <text v-if="labels" :x="barX(i) + barW / 2" :y="height - 6" font-size="10" fill="var(--muted)" text-anchor="middle" :font-family="fontMono">{{ labels[i] }}</text>
    </g>
  </svg>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  data: { type: Array, required: true },
  labels: Array,
  width: { type: Number, default: 720 },
  height: { type: Number, default: 180 },
  color: { type: String, default: 'var(--accent)' },
  format: { type: Function, default: v => v },
})

const fontMono = 'var(--font-mono)'
const pad = { l: 36, r: 12, t: 10, b: 22 }
const W = computed(() => props.width - pad.l - pad.r)
const H = computed(() => props.height - pad.t - pad.b)
const max = computed(() => Math.max(...props.data))
const N = computed(() => props.data.length)
const barW = computed(() => (W.value / N.value) * 0.62)
const gap = computed(() => (W.value / N.value) * 0.38)

const gridLines = computed(() => [0, 0.5, 1].map(p => ({
  y: pad.t + H.value * (1 - p), v: max.value * p, dash: p !== 0,
})))

function barX(i) { return pad.l + i * (W.value / N.value) + gap.value / 2 }
function barH(v) { return (v / max.value) * H.value }
function barY(v) { return pad.t + H.value - barH(v) }
</script>
