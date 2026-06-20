<template>
  <div style="padding:20px 24px 48px;display:flex;flex-direction:column;gap:18px;">
    <PageHeader :title="tt('an.title')" :subtitle="tt('an.subtitle')">
      <template #right>
        <AppButton variant="secondary" size="md" @click="load" :loading="loading">{{ tt('an.refresh') }}</AppButton>
      </template>
    </PageHeader>

    <div v-if="loading" class="an-state"><span class="an-spin"/> {{ tt('an.loading') }}</div>
    <div v-else-if="error" class="an-state" style="color:var(--danger);">{{ error }}</div>

    <template v-else-if="data">
      <!-- ── KPI kartalar ── -->
      <div class="an-kpis">
        <div class="an-kpi" v-for="k in kpis" :key="k.label" :style="{ '--kc': k.color }">
          <span class="an-kpi-ico"><AppIcon :name="k.icon" :size="16"/></span>
          <div>
            <div class="an-kpi-val">{{ k.value }}</div>
            <div class="an-kpi-lbl">{{ k.label }}</div>
          </div>
        </div>
      </div>

      <!-- ── Featured: eng ko'p / eng kam / eng qiziqarli ── -->
      <div class="an-feat">
        <div class="an-feat-card hl">
          <div class="an-feat-cap"><AppIcon name="Eye" :size="12"/> {{ tt('an.mostViewed') }}</div>
          <div class="an-feat-title">{{ data.most_viewed?.title || '—' }}</div>
          <div class="an-feat-meta">
            <span class="an-feat-big">{{ fmt(data.most_viewed?.view_count) }}</span> {{ tt('an.views') }}
            <span v-if="data.most_viewed?.channel" class="an-feat-ch">· {{ data.most_viewed.channel }}</span>
          </div>
        </div>
        <div class="an-feat-card">
          <div class="an-feat-cap"><AppIcon name="ArrowDown" :size="12"/> {{ tt('an.leastViewed') }}</div>
          <div class="an-feat-title">{{ data.least_viewed?.title || '—' }}</div>
          <div class="an-feat-meta"><span class="an-feat-big">{{ fmt(data.least_viewed?.view_count) }}</span> {{ tt('an.views') }}</div>
        </div>
        <div class="an-feat-card">
          <div class="an-feat-cap"><AppIcon name="Sparkle" :size="12"/> {{ tt('an.mostInteresting') }}</div>
          <div class="an-feat-title">{{ data.most_interesting?.title || '—' }}</div>
          <div class="an-feat-meta"><span class="an-feat-big">{{ (data.most_interesting?.score ?? 0).toFixed(2) }}</span> {{ tt('an.score') }}</div>
        </div>
      </div>

      <!-- ── Donutlar qatori ── -->
      <div class="an-grid3">
        <AppPanel :padding="18">
          <div class="an-card-title">{{ tt('an.byStatus') }}</div>
          <div class="an-donut-row">
            <DonutChart :segments="statusSegs" :size="148" :thickness="20">
              <template #center><div class="an-dn-c">{{ data.summary.total }}</div><div class="an-dn-cap">{{ tt('an.post') }}</div></template>
            </DonutChart>
            <ul class="an-legend">
              <li v-for="s in statusSegs" :key="s.label"><span class="an-dot" :style="{background:s.color}"/>{{ s.label }}<b>{{ s.value }}</b></li>
            </ul>
          </div>
        </AppPanel>

        <AppPanel :padding="18">
          <div class="an-card-title">{{ tt('an.autoVsManual') }}</div>
          <div class="an-donut-row">
            <DonutChart :segments="autoSegs" :size="148" :thickness="20">
              <template #center><div class="an-dn-c">{{ autoPct }}%</div><div class="an-dn-cap">{{ tt('an.auto') }}</div></template>
            </DonutChart>
            <ul class="an-legend">
              <li v-for="s in autoSegs" :key="s.label"><span class="an-dot" :style="{background:s.color}"/>{{ s.label }}<b>{{ s.value }}</b></li>
            </ul>
          </div>
        </AppPanel>

        <AppPanel :padding="18">
          <div class="an-card-title">{{ tt('an.byPlatform') }}</div>
          <div class="an-donut-row">
            <DonutChart :segments="platformSegs" :size="148" :thickness="20">
              <template #center><div class="an-dn-c">{{ platformSegs.length }}</div><div class="an-dn-cap">{{ tt('an.type') }}</div></template>
            </DonutChart>
            <ul class="an-legend">
              <li v-for="s in platformSegs" :key="s.label"><span class="an-dot" :style="{background:s.color}"/>{{ s.label }}<b>{{ s.value }}</b></li>
            </ul>
          </div>
        </AppPanel>
      </div>

      <!-- ── Vaqt qatori (14 kun) ── -->
      <div class="an-grid2">
        <AppPanel :padding="18">
          <div class="an-card-title">{{ tt('an.dailyPosts') }}</div>
          <BarChart v-if="hasDays" :data="dayPosts" :labels="dayLabels" :width="540" :height="180" color="var(--accent)"/>
          <div v-else class="an-empty">{{ tt('an.noData') }}</div>
        </AppPanel>
        <AppPanel :padding="18">
          <div class="an-card-title">{{ tt('an.dailyViews') }}</div>
          <AreaChart v-if="hasDays && dayViewsMax > 0" :series="[{ data: dayViews }]" :labels="dayLabels" :width="540" :height="180" color="var(--success)" :format="fmt"/>
          <div v-else class="an-empty">{{ tt('an.noViewsYet') }}</div>
        </AppPanel>
      </div>

      <!-- ── Gorizontal barlar ── -->
      <div class="an-grid3">
        <AppPanel :padding="18">
          <div class="an-card-title">{{ tt('an.bySource') }}</div>
          <BarList :items="sourceBars" :empty="tt('an.noSource')"/>
        </AppPanel>
        <AppPanel :padding="18">
          <div class="an-card-title">{{ tt('an.channelViews') }}</div>
          <BarList :items="channelBars" :format="fmt" color="var(--success)" :empty="tt('an.noViews')"/>
        </AppPanel>
        <AppPanel :padding="18">
          <div class="an-card-title">{{ tt('an.aiTokens') }}</div>
          <BarList :items="modelBars" :format="fmt" color="var(--violet)" :empty="tt('an.noTokens')"/>
        </AppPanel>
      </div>

      <!-- ── Top postlar + teglar ── -->
      <div class="an-grid2b">
        <AppPanel :padding="0">
          <div class="an-card-title" style="padding:16px 18px 6px;">{{ tt('an.topPosts') }}</div>
          <table class="an-table">
            <thead><tr><th>{{ tt('an.col.post') }}</th><th>{{ tt('an.col.channel') }}</th><th style="text-align:right;">{{ tt('an.col.views') }}</th></tr></thead>
            <tbody>
              <tr v-for="p in data.top_posts" :key="p.id">
                <td class="an-td-title">{{ p.title || tt('an.noText') }}</td>
                <td class="an-td-ch">{{ p.channel }}</td>
                <td style="text-align:right;"><span class="an-views">{{ fmt(p.view_count) }}</span></td>
              </tr>
              <tr v-if="!data.top_posts.length"><td colspan="3" class="an-empty" style="padding:24px;">{{ tt('an.noTopPosts') }}</td></tr>
            </tbody>
          </table>
        </AppPanel>

        <AppPanel :padding="18">
          <div class="an-card-title">{{ tt('an.topTags') }}</div>
          <div v-if="data.top_tags.length" class="an-tags">
            <span v-for="tag in data.top_tags" :key="tag.tag" class="an-tag" :style="{ fontSize: tagSize(tag.count) }">
              {{ tag.tag }}<b>{{ tag.count }}</b>
            </span>
          </div>
          <div v-else class="an-empty">{{ tt('an.noTags') }}</div>
        </AppPanel>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAppStore } from '@/stores/app.js'
import PageHeader from '@/components/layout/PageHeader.vue'
import AppPanel from '@/components/ui/AppPanel.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import DonutChart from '@/components/charts/DonutChart.vue'
import BarChart from '@/components/charts/BarChart.vue'
import AreaChart from '@/components/charts/AreaChart.vue'
import BarList from '@/components/charts/BarList.vue'
import { companiesApi } from '@/api/companies.js'
import { analyticsApi } from '@/api/analytics.js'

const store = useAppStore()
const t = computed(() => store.t)
function tt(key, params) { return t.value(key, params) }

const loading = ref(true)
const error = ref('')
const company = ref(null)
const data = ref(null)

const PALETTE = ['#6366F1', '#22C55E', '#F59E0B', '#EF4444', '#06B6D4', '#A855F7', '#EC4899', '#14B8A6']
const STATUS_COLORS = { published: '#22C55E', scheduled: '#6366F1', draft: '#94A3B8', failed: '#EF4444' }

const statusLabels = computed(() => ({
  published: tt('an.status.published'),
  scheduled: tt('an.status.scheduled'),
  draft: tt('an.status.draft'),
  failed: tt('an.status.failed'),
}))

function fmt(n) {
  const v = Number(n) || 0
  if (v < 1000) return String(v)
  if (v < 1e6) return (v / 1e3).toFixed(v < 1e4 ? 1 : 0).replace(/\.0$/, '') + 'K'
  return (v / 1e6).toFixed(1).replace(/\.0$/, '') + 'M'
}

const kpis = computed(() => {
  const s = data.value?.summary || {}
  return [
    { label: tt('an.kpi.total'), value: fmt(s.total), icon: 'Layers', color: '#6366F1' },
    { label: tt('an.kpi.published'), value: fmt(s.published), icon: 'Send', color: '#22C55E' },
    { label: tt('an.kpi.totalViews'), value: fmt(s.total_views), icon: 'Eye', color: '#06B6D4' },
    { label: tt('an.kpi.avgViews'), value: fmt(s.avg_views), icon: 'Chart', color: '#F59E0B' },
    { label: tt('an.kpi.aiPosts'), value: fmt(s.ai_posts), icon: 'Sparkle', color: '#A855F7' },
    { label: tt('an.kpi.aiTokens'), value: fmt(s.total_tokens), icon: 'Bolt', color: '#EC4899' },
  ]
})

const statusSegs = computed(() =>
  (data.value?.by_status || []).map(r => ({
    label: statusLabels.value[r.status] || r.status, value: Number(r.count), color: STATUS_COLORS[r.status] || '#94A3B8',
  })))

const autoSegs = computed(() => {
  const s = data.value?.summary || {}
  return [
    { label: tt('an.seg.auto'), value: Number(s.ai_posts || 0), color: '#A855F7' },
    { label: tt('an.seg.manual'), value: Number(s.manual_posts || 0), color: '#6366F1' },
  ]
})
const autoPct = computed(() => {
  const s = data.value?.summary || {}
  const total = (s.ai_posts || 0) + (s.manual_posts || 0)
  return total ? Math.round((s.ai_posts / total) * 100) : 0
})

const platformSegs = computed(() =>
  (data.value?.by_platform || []).map((r, i) => ({ label: r.platform, value: Number(r.count), color: PALETTE[i % PALETTE.length] })))

const hasDays = computed(() => (data.value?.by_day || []).length > 0)
const dayLabels = computed(() => (data.value?.by_day || []).map(d => d.day.slice(5)))
const dayPosts = computed(() => (data.value?.by_day || []).map(d => Number(d.count)))
const dayViews = computed(() => (data.value?.by_day || []).map(d => Number(d.views)))
const dayViewsMax = computed(() => Math.max(0, ...dayViews.value))

const sourceBars = computed(() => (data.value?.by_source || []).map(r => ({ label: r.source, value: Number(r.count) })))
const channelBars = computed(() => (data.value?.views_by_channel || []).map(r => ({ label: r.channel, value: Number(r.views) })))
const modelBars = computed(() => (data.value?.by_model || []).map(r => ({ label: r.model, value: Number(r.tokens) })))

function tagSize(count) {
  const max = Math.max(1, ...(data.value?.top_tags || []).map(tag => tag.count))
  return (12 + (count / max) * 8).toFixed(0) + 'px'
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
    if (!company.value) { error.value = tt('an.err.noCompany'); return }
    data.value = await analyticsApi.overview(company.value.id)
  } catch (e) {
    error.value = e?.response?.data?.message || tt('an.err.load')
  } finally {
    loading.value = false
  }
}
onMounted(load)
</script>

<style scoped>
.an-state { display:flex;align-items:center;justify-content:center;gap:10px;padding:60px 0;color:var(--muted);font-size:13px; }
.an-spin { width:16px;height:16px;border:2px solid var(--border);border-top-color:var(--accent);border-radius:50%;animation:anspin .7s linear infinite; }
@keyframes anspin { to { transform:rotate(360deg);} }

.an-kpis { display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px; }
.an-kpi { display:flex;align-items:center;gap:12px;padding:14px 16px;border:1px solid var(--border);border-radius:14px;background:var(--panel); }
.an-kpi-ico { width:34px;height:34px;border-radius:10px;display:inline-flex;align-items:center;justify-content:center;
  background:color-mix(in srgb, var(--kc) 14%, transparent);color:var(--kc);flex-shrink:0; }
.an-kpi-val { font-size:20px;font-weight:700;color:var(--text);line-height:1.1;font-variant-numeric:tabular-nums; }
.an-kpi-lbl { font-size:11.5px;color:var(--muted);margin-top:2px; }

.an-feat { display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:12px; }
.an-feat-card { padding:14px 16px;border:1px solid var(--border);border-radius:14px;background:var(--panel); }
.an-feat-card.hl { border-color:color-mix(in srgb,var(--success) 40%,var(--border)); background:color-mix(in srgb,var(--success) 5%,var(--panel)); }
.an-feat-cap { display:flex;align-items:center;gap:5px;font-size:11px;font-weight:600;color:var(--muted);text-transform:uppercase;letter-spacing:.04em; }
.an-feat-title { font-size:13.5px;font-weight:600;color:var(--text);margin:8px 0 6px;line-height:1.35;
  display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden; }
.an-feat-meta { font-size:12px;color:var(--muted); }
.an-feat-big { font-size:16px;font-weight:700;color:var(--text); }
.an-feat-ch { color:var(--muted); }

.an-grid3 { display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:14px; }
.an-grid2 { display:grid;grid-template-columns:repeat(auto-fit,minmax(360px,1fr));gap:14px; }
.an-grid2b { display:grid;grid-template-columns:1.4fr 1fr;gap:14px; }
@media (max-width: 860px){ .an-grid2b { grid-template-columns:1fr; } }

.an-card-title { font-size:13px;font-weight:700;color:var(--text);margin-bottom:14px;letter-spacing:-.01em; }
.an-donut-row { display:flex;align-items:center;gap:18px;flex-wrap:wrap; }
.an-dn-c { font-size:22px;font-weight:700;color:var(--text); }
.an-dn-cap { font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:.05em; }
.an-legend { list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:7px;min-width:120px;flex:1; }
.an-legend li { display:flex;align-items:center;gap:8px;font-size:12px;color:var(--text-2,var(--text));text-transform:capitalize; }
.an-legend b { margin-left:auto;color:var(--text);font-variant-numeric:tabular-nums; }
.an-dot { width:9px;height:9px;border-radius:3px;flex-shrink:0; }
.an-empty { color:var(--muted);font-size:12.5px;text-align:center;padding:28px 0; }

.an-table { width:100%;border-collapse:collapse;font-size:12.5px; }
.an-table th { text-align:left;padding:8px 18px;font-size:10.5px;text-transform:uppercase;letter-spacing:.05em;color:var(--muted);font-weight:600;border-bottom:1px solid var(--border); }
.an-table td { padding:10px 18px;border-top:1px solid var(--border-2); vertical-align:middle; }
.an-td-title { font-weight:500;color:var(--text);max-width:280px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap; }
.an-td-ch { color:var(--muted); }
.an-views { display:inline-flex;align-items:center;gap:4px;padding:3px 9px;border-radius:999px;background:color-mix(in srgb,var(--success) 12%,transparent);color:var(--success);font-weight:600; }

.an-tags { display:flex;flex-wrap:wrap;gap:8px;align-items:center; }
.an-tag { display:inline-flex;align-items:center;gap:5px;padding:4px 10px;border-radius:999px;background:var(--panel-2,rgba(148,163,184,.1));border:1px solid var(--border-2);color:var(--text-2,var(--text)); }
.an-tag b { color:var(--accent);font-size:11px; }
</style>
