<template>
  <div>
    <svg :width="width" :height="rows * cellH + (rows - 1) * cellGap + 18">
      <rect v-for="cell in flatCells" :key="cell.key"
        :x="36 + cell.c * (cellW + cellGap)"
        :y="cell.r * (cellH + cellGap)"
        :width="cellW" :height="cellH" rx="2"
        :fill="`color-mix(in oklab, var(--accent) ${Math.round((cell.v / maxVal) * 80 + 6)}%, var(--bg-2))`"
      />
      <text v-for="(d, i) in dayLabels" :key="'d'+i" x="0" :y="i * (cellH + cellGap) + 12" font-size="10" fill="var(--muted)" :font-family="fontMono">{{ d }}</text>
      <text v-for="(h, i) in hourLabels" :key="'h'+i"
        :x="36 + (i * 4) * (cellW + cellGap) + cellW / 2"
        :y="rows * (cellH + cellGap) + 12"
        font-size="10" fill="var(--muted)" text-anchor="middle" :font-family="fontMono">{{ h }}</text>
    </svg>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  data: { type: Array, required: true },
  width: { type: Number, default: 720 },
  cellGap: { type: Number, default: 2 },
})

const fontMono = 'var(--font-mono)'
const cellH = 16
const dayLabels = ['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya']
const hourLabels = ['00', '04', '08', '12', '16', '20']

const rows = computed(() => props.data.length)
const cols = computed(() => props.data[0]?.length || 0)
const cellW = computed(() => Math.floor((props.width - (cols.value - 1) * props.cellGap - 36) / cols.value))
const maxVal = computed(() => Math.max(...props.data.flat()) || 1)

const flatCells = computed(() =>
  props.data.flatMap((row, r) => row.map((v, c) => ({ r, c, v, key: `${r}-${c}` })))
)
</script>
