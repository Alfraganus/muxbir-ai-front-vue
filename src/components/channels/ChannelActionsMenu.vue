<template>
  <div style="position:relative;">
    <button class="cam-btn" :class="{ open }" @click.stop="open = !open" :aria-label="tt('channelActionsMenu.actionsAria')">
      <AppIcon name="More" :size="18"/>
    </button>
    <template v-if="open">
      <div class="cam-scrim" @click="open = false"/>
      <div class="cam-menu" role="menu">
        <button class="cam-item" @click="pick('posts')">
          <span class="cam-ic" style="--c:#0EA5E9"><AppIcon name="Eye" :size="15"/></span>
          <span class="cam-txt"><b>{{ tt('channelActionsMenu.postsTitle') }}</b><small>{{ tt('channelActionsMenu.postsDesc') }}</small></span>
        </button>
        <button class="cam-item" @click="pick('signature')">
          <span class="cam-ic" style="--c:#8B5CF6"><AppIcon name="Edit" :size="15"/></span>
          <span class="cam-txt"><b>{{ tt('channelActionsMenu.signatureTitle') }}</b><small>{{ tt('channelActionsMenu.signatureDesc') }}</small></span>
        </button>
        <button class="cam-item" @click="pick('sources')">
          <span class="cam-ic" style="--c:#22C55E"><AppIcon name="Layers" :size="15"/></span>
          <span class="cam-txt"><b>{{ tt('channelActionsMenu.sourcesTitle') }}</b><small>{{ tt('channelActionsMenu.sourcesDesc') }}</small></span>
        </button>
        <button class="cam-item" @click="pick('chats')">
          <span class="cam-ic" style="--c:#2AABEE"><AppIcon name="Telegram" :size="15"/></span>
          <span class="cam-txt"><b>{{ tt('channelActionsMenu.chatsTitle') }}</b><small>{{ tt('channelActionsMenu.chatsDesc') }}</small></span>
        </button>
        <button v-if="mode === 'auto' && active" class="cam-item" @click="pick('settings')">
          <span class="cam-ic" style="--c:#F59E0B"><AppIcon name="Settings" :size="15"/></span>
          <span class="cam-txt"><b>{{ tt('channelActionsMenu.settingsTitle') }}</b><small>{{ tt('channelActionsMenu.settingsDesc') }}</small></span>
        </button>
        <button class="cam-item" @click="pick('toggle-mode')">
          <span class="cam-ic" style="--c:#6366F1"><AppIcon :name="mode === 'auto' ? 'Edit' : 'Bolt'" :size="15"/></span>
          <span class="cam-txt">
            <b>{{ mode === 'auto' ? tt('channelActionsMenu.toManualTitle') : tt('channelActionsMenu.toAutoTitle') }}</b>
            <small>{{ mode === 'auto' ? tt('channelActionsMenu.toManualDesc') : tt('channelActionsMenu.toAutoDesc') }}</small>
          </span>
        </button>
        <div class="cam-div"/>
        <button class="cam-item danger" @click="pick('remove')">
          <span class="cam-ic" style="--c:#EF4444"><AppIcon name="Trash" :size="15"/></span>
          <span class="cam-txt"><b>{{ tt('channelActionsMenu.removeTitle') }}</b><small>{{ tt('channelActionsMenu.removeDesc') }}</small></span>
        </button>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import { useAppStore } from '@/stores/app.js'

const store = useAppStore()
const t = computed(() => store.t)
function tt(key, params) { return t.value(key, params) }

const props = defineProps({
  channel: { type: Object, required: true },
  active: { type: Boolean, default: true },
})
const emit = defineEmits(['posts', 'signature', 'sources', 'chats', 'settings', 'toggle-mode', 'remove'])

const open = ref(false)
const mode = computed(() => props.channel?.posting_mode || 'auto')

function pick(ev) {
  open.value = false
  emit(ev)
}
</script>

<style scoped>
.cam-btn {
  width: 36px; height: 36px; border-radius: 9px;
  border: 1px solid var(--border); background: var(--panel);
  color: var(--muted); cursor: pointer;
  display: inline-flex; align-items: center; justify-content: center;
  transition: all .15s;
}
.cam-btn:hover, .cam-btn.open { background: var(--panel-2); color: var(--text); border-color: var(--accent); }
.cam-scrim { position: fixed; inset: 0; z-index: 19; }
.cam-menu {
  position: absolute; top: 100%; right: 0; margin-top: 6px; z-index: 20;
  min-width: 268px; padding: 7px;
  background: var(--panel); border: 1px solid var(--border);
  border-radius: 13px; box-shadow: var(--shadow-lg, 0 18px 50px rgba(15,23,42,.22));
  display: flex; flex-direction: column; gap: 2px;
  animation: camIn .16s ease;
}
@keyframes camIn { from { opacity: 0; transform: translateY(-6px) scale(.98); } to { opacity: 1; transform: none; } }
.cam-item {
  display: flex; align-items: center; gap: 11px;
  width: 100%; padding: 9px 10px;
  background: transparent; border: none; border-radius: 10px;
  cursor: pointer; text-align: left; font-family: inherit;
}
.cam-item:hover { background: var(--panel-2); }
.cam-ic {
  width: 32px; height: 32px; border-radius: 9px; flex-shrink: 0;
  display: inline-flex; align-items: center; justify-content: center;
  background: color-mix(in srgb, var(--c) 15%, transparent); color: var(--c);
}
.cam-txt { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
.cam-txt b { font-size: 13px; font-weight: 600; color: var(--text); line-height: 1.2; }
.cam-txt small { font-size: 11px; color: var(--muted); line-height: 1.2; }
.cam-item.danger .cam-txt b { color: var(--danger, #EF4444); }
.cam-div { height: 1px; background: var(--border-2); margin: 4px 6px; }
</style>
