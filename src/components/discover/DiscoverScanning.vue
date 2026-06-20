<template>
  <div class="dscan-root">
    <div class="dscan-wrap">
      <!-- Spinner with sparkle -->
      <div class="dscan-spinner">
        <svg viewBox="0 0 100 100" class="dscan-ring">
          <circle cx="50" cy="50" r="44" fill="none" stroke="var(--border)" stroke-width="2.5"/>
          <circle cx="50" cy="50" r="44" fill="none" stroke="var(--accent)" stroke-width="2.5"
            stroke-dasharray="60 220" stroke-linecap="round"/>
        </svg>
        <div class="dscan-spinner-ic">
          <AppIcon name="Sparkle" :size="32"/>
        </div>
      </div>

      <div style="text-align:center;display:flex;flex-direction:column;gap:6px;">
        <h2 style="margin:0;font-size:22px;font-weight:600;letter-spacing:-0.022em;">{{ tt('discoverScanning.title') }}</h2>
        <p style="margin:0;font-size:13px;color:var(--muted);">
          {{ tt('discoverScanning.subtitle', { channels: activeSources.length, posts: config.perChannel * activeSources.length }) }}
        </p>
      </div>

      <!-- Progress bar -->
      <div>
        <div style="display:flex;justify-content:space-between;font-size:11px;color:var(--muted);margin-bottom:6px;">
          <span>{{ tt('discoverScanning.progress') }}</span>
          <span class="tabular">{{ Math.round(progress) }}%</span>
        </div>
        <div class="dscan-bar">
          <div class="dscan-bar-fill" :style="{ width: progress + '%' }"/>
        </div>
      </div>

      <!-- Channel list -->
      <div class="dscan-list">
        <div v-for="(s, i) in activeSources" :key="s.id"
          class="dscan-item" :class="statusOf(i)">
          <span class="dscan-avatar" :style="{ background: s.color, opacity: statusOf(i) === 'queued' ? 0.4 : 1 }">
            {{ s.name.charAt(0) }}
          </span>
          <div style="display:flex;flex-direction:column;flex:1;min-width:0;">
            <span class="dscan-name" :style="{ opacity: statusOf(i) === 'queued' ? 0.5 : 1 }">{{ s.name }}</span>
            <span class="dscan-sub">
              <template v-if="statusOf(i) === 'done'">{{ tt('discoverScanning.postsSelected', { n: foundCounts[i] || config.perChannel }) }}</template>
              <template v-else-if="statusOf(i) === 'active'">
                {{ tt('discoverScanning.scanning') }} <span v-if="foundCounts[i]" class="tabular" style="color:var(--accent);font-weight:600;">{{ tt('discoverScanning.foundCount', { n: foundCounts[i] }) }}</span>
              </template>
              <template v-else>{{ tt('discoverScanning.queued') }}</template>
            </span>
          </div>
          <AppIcon v-if="statusOf(i) === 'done'" name="Check" :size="14" :style="{ color:'var(--success)' }"/>
          <span v-else-if="statusOf(i) === 'active'" class="dscan-mini-spin"/>
          <span v-else style="font-size:10px;color:var(--muted);">...</span>
        </div>
      </div>

      <!-- Logs -->
      <div class="mono dscan-logs">
        <div v-for="(l, i) in logs" :key="i" :style="{ opacity: 0.4 + (i / Math.max(logs.length, 1)) * 0.6 }">
          <span style="color:var(--accent);">›</span> {{ l }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import { useAppStore } from '@/stores/app.js'

const store = useAppStore()
const t = computed(() => store.t)
function tt(key, params) { return t.value(key, params) }

const props = defineProps({
  config: { type: Object, required: true },
  sources: { type: Array, required: true },
  liveCounts: { type: Object, default: () => ({}) }, // { source_channel_id: real_count }
})
const emit = defineEmits(['done'])

const activeSources = computed(() => props.sources.filter(s => props.config.sources.includes(s.id)))

const progress = ref(0)
const currentSrc = ref(0)
const logs = ref([])
const foundCounts = ref({})
let timer = null

onMounted(() => {
  const phases = []
  activeSources.value.forEach((s, i) => {
    phases.push({
      label: tt('discoverScanning.logConnecting', { name: s.name }),
      src: i, p: (i / activeSources.value.length) * 100 + 5,
      action: 'connect',
    })
    phases.push({
      label: tt('discoverScanning.logAnalyzing', { name: s.name, n: props.config.perChannel * 4 }),
      src: i, p: (i / activeSources.value.length) * 100 + 10,
      action: 'analyze', target: Math.floor(props.config.perChannel * 1.5),
    })
    phases.push({
      label: tt('discoverScanning.logScoring', { name: s.name }),
      src: i, p: ((i + 1) / activeSources.value.length) * 100 - 2,
      action: 'score', target: props.config.perChannel,
    })
  })
  phases.push({ label: tt('discoverScanning.logFinalizing'), src: activeSources.value.length - 1, p: 99, action: 'finalize' })

  let i = 0
  const tick = () => {
    if (i >= phases.length) {
      progress.value = 100
      timer = setTimeout(() => emit('done'), 400)
      return
    }
    const ph = phases[i]
    progress.value = ph.p
    currentSrc.value = ph.src
    if (ph.target !== undefined) {
      const src = activeSources.value[ph.src]
      const real = src ? props.liveCounts?.[src.id] : undefined
      foundCounts.value = { ...foundCounts.value, [ph.src]: real ?? ph.target }
    }
    logs.value = [...logs.value.slice(-4), ph.label]
    i++
    timer = setTimeout(tick, 280 + Math.random() * 200)
  }
  timer = setTimeout(tick, 200)
})
onUnmounted(() => { if (timer) clearTimeout(timer) })

function statusOf(i) {
  if (i < currentSrc.value) return 'done'
  if (i === currentSrc.value) return 'active'
  return 'queued'
}
</script>

<style scoped>
.dscan-root {
  min-height: calc(100vh - 60px);
  padding: 40px 24px;
  display: flex; align-items: center; justify-content: center;
}
.dscan-wrap {
  width: 100%; max-width: 540px;
  display: flex; flex-direction: column; gap: 22px;
}
.dscan-spinner {
  align-self: center;
  position: relative; width: 96px; height: 96px;
}
.dscan-ring {
  position: absolute; inset: 0;
  animation: dscanSpin 2.6s linear infinite;
}
.dscan-spinner-ic {
  position: absolute; inset: 14px; border-radius: 999px;
  background: var(--accent-bg);
  border: 1px solid color-mix(in oklab, var(--accent) 22%, transparent);
  display: inline-flex; align-items: center; justify-content: center;
  color: var(--accent);
}
@keyframes dscanSpin { to { transform: rotate(360deg); } }

.dscan-bar {
  height: 6px; background: var(--border-2);
  border-radius: 999px; overflow: hidden;
}
.dscan-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--accent), color-mix(in oklab, var(--accent) 70%, #6E56CF));
  transition: width .3s ease-out; border-radius: 999px;
}

.dscan-list {
  background: var(--panel); border: 1px solid var(--border);
  border-radius: 12px; padding: 12px;
  display: flex; flex-direction: column; gap: 6px;
}
.dscan-item {
  display: flex; align-items: center; gap: 10px;
  padding: 8px 10px;
  border: 1px solid transparent;
  border-radius: 8px;
  transition: all .2s;
}
.dscan-item.active {
  background: var(--accent-bg);
  border-color: color-mix(in oklab, var(--accent) 25%, transparent);
}
.dscan-avatar {
  width: 26px; height: 26px; border-radius: 6px;
  color: white;
  display: inline-flex; align-items: center; justify-content: center;
  font-weight: 700; font-size: 11px; flex-shrink: 0;
}
.dscan-name { font-size: 12.5px; font-weight: 500; }
.dscan-sub { font-size: 10.5px; color: var(--muted); }
.dscan-mini-spin {
  width: 12px; height: 12px; border-radius: 999px;
  border: 2px solid color-mix(in oklab, var(--accent) 25%, transparent);
  border-top-color: var(--accent);
  animation: dscanSpin 0.8s linear infinite;
}

.dscan-logs {
  background: var(--panel-2); border: 1px solid var(--border);
  border-radius: 8px; padding: 10px 12px;
  font-size: 11px; color: var(--muted);
  min-height: 90px;
  display: flex; flex-direction: column; gap: 3px;
}
</style>
