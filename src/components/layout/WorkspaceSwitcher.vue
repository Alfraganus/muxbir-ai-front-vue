<template>
  <div style="padding:0 8px;">
    <div :style="boxStyle">
      <span :style="{
        width: '26px', height: '26px', borderRadius: '7px',
        background: current.color,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--text)', flexShrink: 0
      }">
        <AppIcon :name="current.iconName" :size="14"/>
      </span>
      <div style="display:flex;flex-direction:column;flex:1;min-width:0;">
        <span style="font-size:12.5px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
          {{ current.sub }}
        </span>
        <span style="font-size:10.5px;color:var(--muted);">{{ current.label }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import { useAppStore } from '@/stores/app.js'

const props = defineProps({ workspace: String })
const store = useAppStore()

const current = computed(() => {
  if (props.workspace === 'super') {
    return {
      label: store.t('nav.workspace.super'),
      sub: 'Muxbir AI HQ',
      iconName: 'Shield',
      color: 'oklch(0.92 0.08 280)',
    }
  }
  return {
    label: store.t('nav.workspace.client'),
    sub: store.companyName || 'Kompaniya',
    iconName: 'Building',
    color: 'oklch(0.94 0.06 250)',
  }
})

const boxStyle = {
  width: '100%',
  height: '40px',
  padding: '0 8px',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  background: 'transparent',
  border: '1px solid transparent',
  borderRadius: '8px',
  color: 'var(--text)',
}
</script>
