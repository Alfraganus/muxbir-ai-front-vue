<template>
  <div :style="{ position: 'relative', width: size + 'px', height: size + 'px' }">
    <svg :width="size" :height="size" :style="{ transform: 'rotate(-90deg)' }">
      <circle :cx="size/2" :cy="size/2" :r="r" fill="none" stroke="var(--border-2)" :stroke-width="thickness" />
      <circle v-for="(seg, i) in computedSegs" :key="i"
        :cx="size/2" :cy="size/2" :r="r"
        fill="none" :stroke="seg.color" :stroke-width="thickness"
        :stroke-dasharray="`${seg.len} ${C - seg.len}`"
        :stroke-dashoffset="-seg.offset"
        stroke-linecap="butt"
      />
    </svg>
    <div v-if="$slots.center" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;flex-direction:column;text-align:center;">
      <slot name="center" />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  segments: { type: Array, required: true },
  size: { type: Number, default: 120 },
  thickness: { type: Number, default: 14 },
})

const r = computed(() => (props.size - props.thickness) / 2)
const C = computed(() => 2 * Math.PI * r.value)
const total = computed(() => props.segments.reduce((s, x) => s + x.value, 0))

const computedSegs = computed(() => {
  let off = 0
  return props.segments.map(seg => {
    const len = (seg.value / total.value) * C.value
    const result = { ...seg, len, offset: off }
    off += len
    return result
  })
})
</script>
