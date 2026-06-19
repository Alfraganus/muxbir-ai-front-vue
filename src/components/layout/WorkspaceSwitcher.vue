<template>
  <div class="ws-wrap">
    <div class="ws-card">
      <span class="ws-avatar" :class="workspace === 'super' ? 'ws-avatar--hq' : 'ws-avatar--client'">
        <AppIcon :name="current.iconName" :size="15"/>
      </span>
      <div class="ws-info">
        <span class="ws-name">{{ current.sub }}</span>
        <span class="ws-role">
          <span class="ws-dot"/>{{ current.label }}
        </span>
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
    }
  }
  return {
    label: store.t('nav.workspace.client'),
    sub: store.companyName || 'Kompaniya',
    iconName: 'Building',
  }
})
</script>

<style scoped>
.ws-wrap { padding: 0 8px; }
.ws-card {
  display: flex; align-items: center; gap: 10px;
  padding: 8px 10px;
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: var(--r-md);
  box-shadow: var(--shadow-sm);
}
.ws-avatar {
  width: 34px; height: 34px; border-radius: var(--r-sm); flex-shrink: 0;
  display: inline-flex; align-items: center; justify-content: center;
  color: #fff;
}
.ws-avatar--client { background: var(--accent-grad); }
.ws-avatar--hq { background: linear-gradient(135deg, #8B5CF6, #6366F1); }

.ws-info { display: flex; flex-direction: column; min-width: 0; flex: 1; }
.ws-name {
  font-size: 13px; font-weight: 700; color: var(--text);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.ws-role {
  display: inline-flex; align-items: center; gap: 5px;
  font-size: 10.5px; color: var(--muted); margin-top: 1px;
}
.ws-dot {
  width: 6px; height: 6px; border-radius: 999px;
  background: var(--success); flex-shrink: 0;
}
</style>
