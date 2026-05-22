<template>
  <svg :width="width" :height="height" style="display:block;">
    <defs>
      <linearGradient v-for="(s, idx) in series" :key="idx" :id="`area-grad-${uid}-${idx}`" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" :stop-color="colors[idx]" :stop-opacity="idx === 0 ? '0.18' : '0.10'"/>
        <stop offset="100%" :stop-color="colors[idx]" stop-opacity="0"/>
      </linearGradient>
    </defs>
    <!-- y grid -->
    <g v-for="i in yTicks + 1" :key="i">
      <line :x1="pad.l" :y1="pad.t + (H / yTicks) * (i-1)" :x2="pad.l + W" :y2="pad.t + (H / yTicks) * (i-1)" stroke="var(--border-2)" stroke-width="1" :stroke-dasharray="i-1 === yTicks ? '0' : '2,3'"/>
      <text :x="pad.l - 6" :y="pad.t + (H / yTicks) * (i-1) + 3" font-size="10" fill="var(--muted)" text-anchor="end" :font-family="fontMono">{{ format(max - (span / yTicks) * (i-1)) }}</text>
    </g>
    <!-- x labels -->
    <template v-if="labels">
      <text v-for="(lab, i) in labels" v-show="i % xStep === 0" :key="i" :x="pad.l + i * stepX" :y="height - 6" font-size="10" fill="var(--muted)" text-anchor="middle" :font-family="fontMono">{{ lab }}</text>
    </template>
    <!-- series -->
    <g v-for="(s, idx) in series" :key="idx">
      <path :d="areaPath(s.data, idx)" :fill="`url(#area-grad-${uid}-${idx})`" />
      <path :d="linePath(s.data)" fill="none" :stroke="colors[idx]" stroke-width="1.8" stroke-linejoin="round"/>
      <circle v-if="getPoints(s.data).length" :cx="getPoints(s.data)[getPoints(s.data).length-1][0]" :cy="getPoints(s.data)[getPoints(s.data).length-1][1]" r="1.8" :fill="colors[idx]"/>
    </g>
  </svg>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  series: { type: Array, required: true },
  labels: Array,
  width: { type: Number, default: 720 },
  height: { type: Number, default: 220 },
  color: { type: String, default: 'var(--accent)' },
  color2: { type: String, default: 'var(--violet)' },
  format: { type: Function, default: v => v },
})

const uid = Math.random().toString(36).slice(2, 7)
const fontMono = 'var(--font-mono)'
const pad = { l: 36, r: 12, t: 12, b: 22 }
const yTicks = 4

const W = computed(() => props.width - pad.l - pad.r)
const H = computed(() => props.height - pad.t - pad.b)
const all = computed(() => props.series.flatMap(s => s.data))
const max = computed(() => Math.max(...all.value))
const span = computed(() => max.value || 1)
const N = computed(() => props.series[0]?.data.length || 0)
const stepX = computed(() => W.value / (N.value - 1))
const xStep = computed(() => Math.ceil((props.labels?.length || 1) / 12))
const colors = computed(() => [props.color, props.color2])

function getPoints(data) {
  return data.map((v, i) => [pad.l + i * stepX.value, pad.t + H.value - (v / span.value) * H.value])
}
function linePath(data) {
  return getPoints(data).map(([x, y], i) => (i === 0 ? 'M' : 'L') + x.toFixed(1) + ',' + y.toFixed(1)).join(' ')
}
function areaPath(data, idx) {
  const l = linePath(data)
  return l + ` L ${pad.l + W.value},${pad.t + H.value} L ${pad.l},${pad.t + H.value} Z`
}
</script>
