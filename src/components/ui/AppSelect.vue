<template>
  <select
    :value="modelValue"
    @change="$emit('update:modelValue', $event.target.value)"
    :style="{
      height:'32px',
      padding:'0 10px',
      border:'1px solid var(--border)',
      borderRadius:'var(--r-sm)',
      background:'var(--panel)',
      fontSize:'13px',
      color:'var(--text)',
      cursor:'pointer',
      outline:'none',
      width: '100%',
    }">
    <option v-if="placeholder" value="" disabled>{{ placeholder }}</option>
    <option v-for="opt in options" :key="opt.value ?? opt" :value="opt.value ?? opt">
      {{ opt.label ?? opt }}
    </option>
  </select>
</template>

<script setup>
defineProps({
  modelValue: [String, Number, Boolean],
  options: Array,
  placeholder: String,
})
defineEmits(['update:modelValue'])
</script>
