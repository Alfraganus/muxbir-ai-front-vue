<script setup>
/**
 * Facebook / Instagram kanal statistikasi (read_insights, 28 kun).
 * Kanal kartasi ichida ko'rsatiladi — brend logosi + asosiy metrikalar.
 * Ma'lumot backend Graph API orqali olinadi (channelsApi.insights).
 */
import { ref, computed, onMounted } from 'vue'
import { useAppStore } from '@/stores/app.js'
import { channelsApi } from '@/api/channels.js'
import AppIcon from '@/components/ui/AppIcon.vue'

const props = defineProps({
  companyId: { type: String, required: true },
  channel: { type: Object, required: true },
})

const store = useAppStore()
const t = computed(() => store.t)
function tt(key, params) { return t.value(key, params) }

const platform = computed(() => props.channel.platform_type || 'facebook')
const isInstagram = computed(() => platform.value === 'instagram')

const loading = ref(true)
const error = ref('')
const data = ref(null)

function fmt(n) {
  if (n === null || n === undefined) return '—'
  const v = Number(n)
  if (!Number.isFinite(v)) return '—'
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M'
  if (v >= 1_000) return (v / 1_000).toFixed(1).replace(/\.0$/, '') + 'K'
  return String(v)
}

/** Platforma bo'yicha ko'rsatiladigan metrikalar (FB va IG farq qiladi). */
const metrics = computed(() => {
  const d = data.value
  if (!d) return []
  if (isInstagram.value) {
    return [
      { key: 'followers', icon: 'Users', label: tt('ci.followers'), value: fmt(d.followers) },
      { key: 'reach', icon: 'Eye', label: tt('ci.reach28'), value: fmt(d.reach28) },
      { key: 'media', icon: 'Layers', label: tt('ci.media'), value: fmt(d.media_count) },
    ]
  }
  return [
    { key: 'followers', icon: 'Users', label: tt('ci.followers'), value: fmt(d.followers) },
    { key: 'reach', icon: 'Eye', label: tt('ci.reach28'), value: fmt(d.reach28) },
    { key: 'impr', icon: 'Chart', label: tt('ci.impressions28'), value: fmt(d.impressions28) },
    { key: 'eng', icon: 'Sparkle', label: tt('ci.engagement28'), value: fmt(d.engagement28) },
  ]
})

async function load() {
  loading.value = true
  error.value = ''
  try {
    data.value = await channelsApi.insights(props.companyId, props.channel.id)
  } catch (e) {
    error.value = e?.response?.data?.message || tt('ci.error')
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<template>
  <div class="ci-root" :class="isInstagram ? 'ci-ig' : 'ci-fb'">
    <!-- Sarlavha: brend logosi -->
    <div class="ci-head">
      <span class="ci-logo" :class="isInstagram ? 'ci-logo-ig' : 'ci-logo-fb'">
        <AppIcon :name="isInstagram ? 'Instagram' : 'Facebook'" :size="15"/>
      </span>
      <div class="ci-head-txt">
        <span class="ci-head-title">{{ isInstagram ? 'Instagram' : 'Facebook' }}</span>
        <span class="ci-head-sub">{{ tt('ci.subtitle') }}</span>
      </div>
      <button type="button" class="ci-refresh" :disabled="loading" @click="load" :title="tt('ci.refresh')">
        <AppIcon name="Arrow" :size="13"/>
      </button>
    </div>

    <!-- Yuklanmoqda -->
    <div v-if="loading" class="ci-state">
      <span class="ci-spinner"/>{{ tt('ci.loading') }}
    </div>

    <!-- Xato -->
    <div v-else-if="error" class="ci-state ci-state-err">
      <AppIcon name="Shield" :size="13"/>{{ error }}
    </div>

    <!-- Metrikalar -->
    <div v-else class="ci-grid">
      <div v-for="m in metrics" :key="m.key" class="ci-card">
        <span class="ci-card-icon"><AppIcon :name="m.icon" :size="14"/></span>
        <span class="ci-card-val tabular">{{ m.value }}</span>
        <span class="ci-card-lbl">{{ m.label }}</span>
      </div>
    </div>

    <div v-if="!loading && !error" class="ci-foot">{{ tt('ci.period') }}</div>
  </div>
</template>

<style scoped>
.ci-root {
  border-radius: 12px;
  padding: 12px;
  border: 1px solid var(--border);
  background: var(--surface, #fff);
}
.ci-fb { background: linear-gradient(180deg, rgba(24,119,242,.06), transparent 60%); }
.ci-ig { background: linear-gradient(180deg, rgba(225,48,108,.06), transparent 60%); }

.ci-head { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
.ci-logo {
  width: 30px; height: 30px; border-radius: 9px;
  display: inline-flex; align-items: center; justify-content: center;
  color: #fff; flex-shrink: 0;
}
.ci-logo-fb { background: #1877F2; }
.ci-logo-ig { background: linear-gradient(45deg, #FEDA75, #FA7E1E, #D62976, #962FBF, #4F5BD5); }
.ci-head-txt { display: flex; flex-direction: column; line-height: 1.25; flex: 1; min-width: 0; }
.ci-head-title { font-size: 13px; font-weight: 700; }
.ci-head-sub { font-size: 11px; color: var(--muted); }
.ci-refresh {
  border: 1px solid var(--border); background: transparent; cursor: pointer;
  width: 28px; height: 28px; border-radius: 8px; color: var(--muted);
  display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.ci-refresh:hover:not(:disabled) { color: var(--text); border-color: var(--muted); }
.ci-refresh:disabled { opacity: .5; cursor: default; }

.ci-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
.ci-card {
  display: flex; flex-direction: column; align-items: center; gap: 3px;
  padding: 12px 6px; border-radius: 10px;
  background: var(--bg, rgba(0,0,0,.02)); border: 1px solid var(--border);
}
.ci-card-icon { color: var(--muted); }
.ci-card-val { font-size: 17px; font-weight: 700; }
.ci-card-lbl { font-size: 10.5px; color: var(--muted); text-align: center; line-height: 1.2; }

.ci-state {
  display: flex; align-items: center; justify-content: center; gap: 8px;
  padding: 18px 0; color: var(--muted); font-size: 12.5px;
}
.ci-state-err { color: var(--warn, #b45309); }
.ci-spinner {
  width: 14px; height: 14px; border-radius: 50%;
  border: 2px solid var(--border); border-top-color: var(--muted);
  animation: ci-spin .7s linear infinite;
}
@keyframes ci-spin { to { transform: rotate(360deg); } }

.ci-foot { margin-top: 8px; font-size: 10.5px; color: var(--muted); text-align: right; }

/* Planshet — 2 ustun */
@media (max-width: 1024px) {
  .ci-grid { grid-template-columns: repeat(2, 1fr); }
}
/* Mobil — 2 ustun saqlanadi, padding kichrayadi */
@media (max-width: 640px) {
  .ci-root { padding: 10px; }
  .ci-card { padding: 10px 4px; }
  .ci-card-val { font-size: 15px; }
}
</style>
