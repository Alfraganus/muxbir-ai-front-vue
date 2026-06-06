<template>
  <div style="position:relative;">
    <button class="cam-btn" :class="{ open }" @click.stop="open = !open" aria-label="Amallar">
      <AppIcon name="More" :size="15"/>
    </button>
    <template v-if="open">
      <div class="cam-scrim" @click="open = false"/>
      <div class="cam-menu" role="menu">
        <button class="cam-item" @click="pick('posts')"><AppIcon name="Eye" :size="13"/>Postlarni ko'rish</button>
        <button class="cam-item" @click="pick('signature')"><AppIcon name="Edit" :size="13"/>Imzo va shablon</button>
        <button class="cam-item" @click="pick('sources')"><AppIcon name="Layers" :size="13"/>Manbalar</button>
        <button v-if="mode === 'auto' && active" class="cam-item" @click="pick('settings')">
          <AppIcon name="Settings" :size="13"/>Sozlash
        </button>
        <button class="cam-item" @click="pick('toggle-mode')">
          <AppIcon :name="mode === 'auto' ? 'Edit' : 'Bolt'" :size="13"/>
          {{ mode === 'auto' ? "Manualga o'tkazish" : "Avtoga o'tkazish" }}
        </button>
        <div class="cam-div"/>
        <button class="cam-item danger" @click="pick('remove')"><AppIcon name="Trash" :size="13"/>O'chirish</button>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import AppIcon from '@/components/ui/AppIcon.vue'

const props = defineProps({
  channel: { type: Object, required: true },
  active: { type: Boolean, default: true },
})
const emit = defineEmits(['posts', 'signature', 'sources', 'settings', 'toggle-mode', 'remove'])

const open = ref(false)
const mode = computed(() => props.channel?.posting_mode || 'auto')

function pick(ev) {
  open.value = false
  emit(ev)
}
</script>

<style scoped>
.cam-btn {
  width: 28px; height: 28px; border-radius: 6px;
  border: 1px solid transparent; background: transparent;
  color: var(--muted); cursor: pointer;
  display: inline-flex; align-items: center; justify-content: center;
}
.cam-btn:hover, .cam-btn.open { background: var(--panel-2); }
.cam-scrim { position: fixed; inset: 0; z-index: 19; }
.cam-menu {
  position: absolute; top: 100%; right: 0; margin-top: 4px; z-index: 20;
  min-width: 184px; padding: 5px;
  background: var(--panel); border: 1px solid var(--border);
  border-radius: 8px; box-shadow: var(--shadow-lg, 0 12px 40px rgba(15,23,42,.18));
  display: flex; flex-direction: column; gap: 1px;
}
.cam-item {
  display: flex; align-items: center; gap: 9px;
  width: 100%; padding: 7px 9px;
  background: transparent; border: none; border-radius: 6px;
  font-size: 12.5px; color: var(--text-2); cursor: pointer;
  text-align: left; font-family: inherit;
}
.cam-item:hover { background: var(--panel-2); color: var(--text); }
.cam-item.danger { color: var(--danger, #ef4444); }
.cam-div { height: 1px; background: var(--border-2); margin: 3px 0; }
</style>
