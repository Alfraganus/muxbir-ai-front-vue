<template>
  <div style="padding:20px 24px 40px;display:flex;flex-direction:column;gap:16px;">
    <PageHeader :title="headerTitle" :subtitle="headerSub">
      <template #right>
        <AppButton variant="secondary" size="md" @click="load" :loading="loading">
          <template #icon><AppIcon name="Chart" :size="13"/></template>Yangilash
        </AppButton>
        <AppButton variant="primary" size="md" @click="$router.push('/client/analytics')">
          <template #icon><AppIcon name="Chart" :size="13"/></template>To'liq analitika
        </AppButton>
      </template>
    </PageHeader>

    <div v-if="loading" class="ov-state"><span class="ov-spin"/> Yuklanmoqda…</div>
    <div v-else-if="error" class="ov-state" style="color:var(--danger);">{{ error }}</div>

    <template v-else-if="d">
      <!-- Momentum KPIs (analitikada yo'q kesim) -->
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;">
        <AppKPI label="So'nggi 24 soat" :value="String(d.momentum.d1)" sub="chop etilgan post">
          <template #icon><AppIcon name="Bolt" :size="14" :style="{color:'var(--muted)'}"/></template>
        </AppKPI>
        <AppKPI label="So'nggi 7 kun" :value="String(d.momentum.d7)"
          :delta="`${d.momentum.wow_delta >= 0 ? '+' : ''}${d.momentum.wow_delta}%`"
          :delta-tone="d.momentum.wow_delta >= 0 ? 'success' : 'danger'"
          :sub="`o'tgan hafta: ${d.momentum.prev7}`">
          <template #icon><AppIcon name="Send" :size="14" :style="{color:'var(--muted)'}"/></template>
        </AppKPI>
        <AppKPI label="So'nggi 30 kun" :value="String(d.momentum.d30)" sub="oylik hajm">
          <template #icon><AppIcon name="Calendar" :size="14" :style="{color:'var(--muted)'}"/></template>
        </AppKPI>
        <AppKPI label="Faollik seriyasi" :value="`${d.momentum.streak} kun`"
          :sub="d.momentum.streak > 0 ? 'ketma-ket post' : 'bugun post yo\'q'">
          <template #icon><AppIcon name="Sparkle" :size="14" :style="{color:'var(--muted)'}"/></template>
        </AppKPI>
      </div>

      <!-- Heatmap (hafta kuni × soat) -->
      <AppPanel title="Eng faol vaqtlar" subtitle="Postlar qaysi kun/soatda chiqgan (Toshkent vaqti)">
        <HeatmapChart v-if="heatHasData" :data="d.heatmap" :width="720"/>
        <div v-else class="ov-empty">Hali post chiqmagan</div>
        <div v-if="d.peak_hour !== null" class="ov-peak">
          <AppIcon name="Sparkle" :size="12"/>
          Eng faol vaqt: <strong>{{ d.peak_weekday }}, {{ String(d.peak_hour).padStart(2,'0') }}:00</strong> atrofida
        </div>
      </AppPanel>

      <!-- Hafta kuni bar + Til donut -->
      <div style="display:grid;grid-template-columns:2fr 1fr;gap:16px;">
        <AppPanel title="Hafta kunlari bo'yicha" subtitle="Qaysi kunlar faolroq">
          <BarChart v-if="weekdayHasData" :data="d.by_weekday" :labels="WEEKDAY_LABELS" :width="680" :height="180" color="var(--violet)"/>
          <div v-else class="ov-empty">Ma'lumot yo'q</div>
        </AppPanel>
        <AppPanel title="Til taqsimoti" subtitle="Postlar tili">
          <div v-if="langSegs.length" style="display:flex;align-items:center;gap:16px;flex-wrap:wrap;">
            <DonutChart :segments="langSegs" :size="132" :thickness="18">
              <template #center><div class="ov-dn-c">{{ langSegs.length }}</div><div class="ov-dn-cap">til</div></template>
            </DonutChart>
            <ul class="ov-legend">
              <li v-for="s in langSegs" :key="s.label"><span class="ov-dot" :style="{background:s.color}"/>{{ s.label }}<b>{{ s.value }}</b></li>
            </ul>
          </div>
          <div v-else class="ov-empty">Ma'lumot yo'q</div>
        </AppPanel>
      </div>

      <!-- Auto-post funnel + Manba samaradorligi -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
        <AppPanel title="Auto-post natijalari" subtitle="Dispatcher har urinish holati">
          <div v-if="funnelRows.length" class="ov-funnel">
            <div v-for="f in funnelRows" :key="f.status" class="ov-funnel-row">
              <span class="ov-funnel-ic" :style="{ '--c': f.color }"><AppIcon :name="f.icon" :size="13"/></span>
              <span class="ov-funnel-lbl">{{ f.label }}</span>
              <div class="ov-funnel-track"><div class="ov-funnel-fill" :style="{ width: f.pct+'%', background: f.color }"/></div>
              <span class="ov-funnel-val">{{ f.count }}</span>
            </div>
          </div>
          <div v-else class="ov-empty">Hali auto-post yuborilmagan</div>
        </AppPanel>
        <AppPanel title="Manba samaradorligi" subtitle="1 postga o'rtacha ko'rish">
          <table v-if="d.source_efficiency.length" class="ov-table">
            <thead><tr><th>Manba</th><th style="text-align:right;">Post</th><th style="text-align:right;">O'rt. ko'rish</th></tr></thead>
            <tbody>
              <tr v-for="r in d.source_efficiency" :key="r.source">
                <td class="ov-td-src">{{ r.source }}</td>
                <td style="text-align:right;color:var(--muted);">{{ r.posts }}</td>
                <td style="text-align:right;"><span class="ov-eff">{{ fmt(r.avg_views) }}</span></td>
              </tr>
            </tbody>
          </table>
          <div v-else class="ov-empty">Ma'lumot yo'q</div>
        </AppPanel>
      </div>

      <!-- Kategoriya + Best this week + coverage -->
      <div style="display:grid;grid-template-columns:1.3fr 1fr;gap:16px;">
        <AppPanel title="Kategoriyalar" subtitle="Post mavzulari taqsimoti">
          <BarList :items="categoryBars" empty="Kategoriya yo'q"/>
        </AppPanel>
        <div style="display:flex;flex-direction:column;gap:16px;">
          <AppPanel title="Shu haftaning posti" subtitle="Oxirgi 7 kun · eng ko'p ko'rilgan">
            <div v-if="d.best_this_week" class="ov-best">
              <div class="ov-best-title">{{ d.best_this_week.title || '(matnsiz)' }}</div>
              <div class="ov-best-meta">
                <span class="ov-views"><AppIcon name="Eye" :size="11"/>{{ fmt(d.best_this_week.view_count) }}</span>
                <span style="color:var(--muted);">· {{ d.best_this_week.channel }}</span>
              </div>
            </div>
            <div v-else class="ov-empty">Bu hafta ko'rilgan post yo'q</div>
          </AppPanel>
          <AppPanel title="Qamrov" subtitle="Kontent sifati">
            <div class="ov-cov">
              <div class="ov-cov-item">
                <div class="ov-cov-ring" :style="ringStyle(d.coverage.cover_pct, '#22C55E')"><span>{{ d.coverage.cover_pct }}%</span></div>
                <span class="ov-cov-lbl">Muqovali post</span>
              </div>
              <div class="ov-cov-stats">
                <div><b>{{ d.coverage.distinct_sources }}</b><small>aktiv manba</small></div>
                <div><b>{{ d.coverage.used_channels }}</b><small>kanal</small></div>
                <div><b>{{ fmt(d.coverage.published) }}</b><small>chop etilgan</small></div>
              </div>
            </div>
          </AppPanel>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import AppPanel from '@/components/ui/AppPanel.vue'
import AppKPI from '@/components/ui/AppKPI.vue'
import BarChart from '@/components/charts/BarChart.vue'
import DonutChart from '@/components/charts/DonutChart.vue'
import HeatmapChart from '@/components/charts/HeatmapChart.vue'
import BarList from '@/components/charts/BarList.vue'
import PageHeader from '@/components/layout/PageHeader.vue'
import { companiesApi } from '@/api/companies.js'
import { analyticsApi } from '@/api/analytics.js'

const loading = ref(true)
const error = ref('')
const company = ref(null)
const d = ref(null)

const WEEKDAY_LABELS = ['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya']
const LANG_LABELS = { uz: "O'zbek (lotin)", uz_cyr: "O'zbek (kirill)", ru: 'Rus', en: 'Ingliz' }
const LANG_COLORS = { uz: '#6366F1', uz_cyr: '#8B5CF6', ru: '#F59E0B', en: '#06B6D4' }
const FUNNEL_META = {
  sent:        { label: 'Yuborilgan',   color: '#22C55E', icon: 'Send' },
  skipped:     { label: 'O\'tkazilgan', color: '#94A3B8', icon: 'ChevronR' },
  ai_rejected: { label: 'AI rad etgan', color: '#F59E0B', icon: 'Sparkle' },
  failed:      { label: 'Xato',         color: '#EF4444', icon: 'Close' },
}

function fmt(n) {
  const v = Number(n) || 0
  if (v < 1000) return String(v)
  if (v < 1e6) return (v / 1e3).toFixed(v < 1e4 ? 1 : 0).replace(/\.0$/, '') + 'K'
  return (v / 1e6).toFixed(1).replace(/\.0$/, '') + 'M'
}

const headerTitle = computed(() => `Salom${company.value?.name ? ', ' + company.value.name : ''} 👋`)
const headerSub = computed(() => {
  if (!d.value) return ''
  return `So'nggi 7 kunda ${d.value.momentum.d7} post · ${d.value.momentum.streak} kunlik faollik seriyasi`
})

const heatHasData = computed(() => (d.value?.heatmap || []).some(row => row.some(v => v > 0)))
const weekdayHasData = computed(() => (d.value?.by_weekday || []).some(v => v > 0))

const langSegs = computed(() => (d.value?.by_language || []).map(r => ({
  label: LANG_LABELS[r.lang] || r.lang, value: Number(r.count), color: LANG_COLORS[r.lang] || '#94A3B8',
})))
const categoryBars = computed(() => (d.value?.by_category || []).map(r => ({ label: r.category, value: Number(r.count) })))

const funnelRows = computed(() => {
  const rows = d.value?.autopost_funnel || []
  const max = Math.max(1, ...rows.map(r => Number(r.count)))
  return rows.map(r => {
    const m = FUNNEL_META[r.status] || { label: r.status, color: '#94A3B8', icon: 'ChevronR' }
    return { status: r.status, count: Number(r.count), pct: Math.max(3, Math.round(Number(r.count) / max * 100)), ...m }
  })
})

function ringStyle(pct, color) {
  return { background: `conic-gradient(${color} ${pct * 3.6}deg, var(--border-2, #e2e8f0) 0deg)` }
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    if (!company.value) {
      const cs = await companiesApi.getMy().catch(() => [])
      const list = Array.isArray(cs) ? cs : [cs].filter(Boolean)
      company.value = list[0] || null
    }
    if (!company.value) { error.value = 'Kompaniya topilmadi'; return }
    d.value = await analyticsApi.dashboard(company.value.id)
  } catch (e) {
    error.value = e?.response?.data?.message || 'Ma\'lumotni yuklab bo\'lmadi'
  } finally {
    loading.value = false
  }
}
onMounted(load)
</script>

<style scoped>
.ov-state { display:flex;align-items:center;justify-content:center;gap:10px;padding:60px 0;color:var(--muted);font-size:13px; }
.ov-spin { width:16px;height:16px;border:2px solid var(--border);border-top-color:var(--accent);border-radius:50%;animation:ovspin .7s linear infinite; }
@keyframes ovspin { to { transform:rotate(360deg);} }
.ov-empty { color:var(--muted);font-size:12.5px;text-align:center;padding:28px 0;line-height:1.6; }
.ov-peak { margin-top:12px;display:flex;align-items:center;gap:6px;font-size:12px;color:var(--muted); }
.ov-peak strong { color:var(--text); }

.ov-dn-c { font-size:20px;font-weight:700;color:var(--text); }
.ov-dn-cap { font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:.05em; }
.ov-legend { list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:7px;min-width:110px;flex:1; }
.ov-legend li { display:flex;align-items:center;gap:8px;font-size:12px;color:var(--text-2,var(--text)); }
.ov-legend b { margin-left:auto;color:var(--text);font-variant-numeric:tabular-nums; }
.ov-dot { width:9px;height:9px;border-radius:3px;flex-shrink:0; }

.ov-funnel { display:flex;flex-direction:column;gap:11px; }
.ov-funnel-row { display:grid;grid-template-columns:30px 92px 1fr auto;align-items:center;gap:9px; }
.ov-funnel-ic { width:28px;height:28px;border-radius:8px;display:inline-flex;align-items:center;justify-content:center;background:color-mix(in srgb,var(--c) 15%,transparent);color:var(--c); }
.ov-funnel-lbl { font-size:12px;color:var(--text-2,var(--text)); }
.ov-funnel-track { height:8px;border-radius:999px;background:var(--border-2,rgba(148,163,184,.15));overflow:hidden; }
.ov-funnel-fill { height:100%;border-radius:999px;transition:width .6s; }
.ov-funnel-val { font-size:13px;font-weight:700;color:var(--text);font-variant-numeric:tabular-nums;min-width:30px;text-align:right; }

.ov-table { width:100%;border-collapse:collapse;font-size:12.5px; }
.ov-table th { text-align:left;padding:6px 4px;font-size:10.5px;text-transform:uppercase;letter-spacing:.04em;color:var(--muted);font-weight:600;border-bottom:1px solid var(--border); }
.ov-table td { padding:9px 4px;border-top:1px solid var(--border-2); }
.ov-td-src { font-weight:500;color:var(--text);text-transform:capitalize; }
.ov-eff { display:inline-block;padding:2px 8px;border-radius:6px;background:rgba(99,102,241,.12);color:var(--accent);font-weight:600; }

.ov-best-title { font-size:14px;font-weight:600;color:var(--text);line-height:1.4;margin-bottom:8px;
  display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden; }
.ov-best-meta { display:flex;align-items:center;gap:6px;font-size:12px; }
.ov-views { display:inline-flex;align-items:center;gap:4px;padding:3px 9px;border-radius:999px;background:rgba(34,197,94,.12);color:var(--success);font-weight:600; }

.ov-cov { display:flex;align-items:center;gap:18px; }
.ov-cov-item { display:flex;flex-direction:column;align-items:center;gap:8px; }
.ov-cov-ring { width:78px;height:78px;border-radius:50%;display:flex;align-items:center;justify-content:center;position:relative; }
.ov-cov-ring::before { content:'';position:absolute;inset:8px;border-radius:50%;background:var(--panel); }
.ov-cov-ring span { position:relative;font-size:16px;font-weight:700;color:var(--text); }
.ov-cov-lbl { font-size:11.5px;color:var(--muted); }
.ov-cov-stats { display:flex;flex-direction:column;gap:10px;flex:1; }
.ov-cov-stats > div { display:flex;align-items:baseline;gap:8px; }
.ov-cov-stats b { font-size:18px;font-weight:700;color:var(--text);font-variant-numeric:tabular-nums; }
.ov-cov-stats small { font-size:11.5px;color:var(--muted); }
</style>
