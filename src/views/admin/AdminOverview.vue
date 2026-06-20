<template>
  <div style="padding:20px 24px 40px;display:flex;flex-direction:column;gap:16px;">
    <PageHeader :title="tt('adminOverview.title')" :subtitle="tt('adminOverview.subtitle')">
      <template #right>
        <AppButton variant="secondary" size="md"><template #icon><AppIcon name="Calendar" :size="13"/></template>{{ tt('adminOverview.days30') }}<template #icon-right><AppIcon name="Chevron" :size="12"/></template></AppButton>
        <AppButton variant="secondary" size="md"><template #icon><AppIcon name="Sort" :size="13"/></template>{{ tt('adminOverview.export') }}</AppButton>
        <AppButton variant="primary" size="md"><template #icon><AppIcon name="Plus" :size="13"/></template>{{ tt('adminOverview.newCompany') }}</AppButton>
      </template>
    </PageHeader>

    <!-- KPI row -->
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;">
      <AppKPI :label="tt('adminOverview.kpiMrr')" :value="`${fmtSom(totalMrr)} ${tt('adminOverview.som')}`" delta="+12.4%" delta-tone="success" :sub="tt('adminOverview.vsLastMonth')">
        <template #icon><AppIcon name="Coin" :size="14" :style="{color:'var(--muted)'}" /></template>
        <template #spark><Sparkline :data="REVENUE_SERIES" :width="88" :height="28"/></template>
      </AppKPI>
      <AppKPI :label="tt('adminOverview.kpiActiveCompanies')" :value="String(activeCo)" :delta="`+${trial} ${tt('adminOverview.trial')}`" delta-tone="muted" :sub="tt('adminOverview.companiesSub', { overdue, total: COMPANIES.length })">
        <template #icon><AppIcon name="Building" :size="14" :style="{color:'var(--muted)'}" /></template>
        <template #spark><Sparkline :data="NEW_COMPANIES_SERIES" :width="88" :height="28" color="var(--violet)"/></template>
      </AppKPI>
      <AppKPI :label="tt('adminOverview.kpiChannels')" :value="String(totalChannels)" :delta="tt('adminOverview.delta18Month')" delta-tone="success" :sub="tt('adminOverview.newThisWeek')">
        <template #icon><AppIcon name="Telegram" :size="14" :style="{color:'var(--muted)'}" /></template>
        <template #spark><Sparkline :data="[12,14,15,18,20,24,28,31,35,39,44,49]" :width="88" :height="28" color="var(--success)"/></template>
      </AppKPI>
      <AppKPI :label="tt('adminOverview.kpiTokens')" value="4.82M" :delta="tt('adminOverview.delta58Lim')" delta-tone="warn" :sub="tt('adminOverview.quotaSub')">
        <template #icon><AppIcon name="Sparkle" :size="14" :style="{color:'var(--muted)'}" /></template>
        <template #spark><Sparkline :data="[2,3,3,4,4,5,5,6,6,7,7,8]" :width="88" :height="28" color="var(--warn)"/></template>
      </AppKPI>
    </div>

    <!-- Revenue chart + plan mix -->
    <div style="display:grid;grid-template-columns:2fr 1fr;gap:16px;">
      <AppPanel :title="tt('adminOverview.revenueTitle')" :subtitle="tt('adminOverview.revenueSubtitle')">
        <template #action><AppTabs :items="[tt('adminOverview.tabWeek'),tt('adminOverview.tabMonth'),tt('adminOverview.tabQuarter')]" v-model="chartTab" /></template>
        <div style="display:flex;align-items:center;gap:24px;margin-bottom:8px;">
          <Legend color="var(--accent)" :label="tt('adminOverview.legendMrr')"/>
          <Legend color="var(--violet)" :label="tt('adminOverview.legendNewCompanies')"/>
        </div>
        <AreaChart :series="[{name:tt('adminOverview.legendMrr'),data:REVENUE_SERIES},{name:tt('adminOverview.seriesNew'),data:NEW_COMPANIES_SERIES.map(v=>v*3)}]"
          :labels="['H1','H2','H3','H4','H5','H6','H7','H8','H9','H10','H11','H12']"
          :width="680" :height="240" :format="v=>v.toFixed(0)"/>
      </AppPanel>
      <AppPanel :title="tt('adminOverview.planMixTitle')" :subtitle="tt('adminOverview.currentMonth')">
        <div style="display:flex;align-items:center;gap:20px;">
          <DonutChart :size="140" :thickness="18" :segments="donutSegments">
            <template #center>
              <div class="tabular" style="font-size:22px;font-weight:600;">10</div>
              <div style="font-size:11px;color:var(--muted);">{{ tt('adminOverview.companyLabel') }}</div>
            </template>
          </DonutChart>
          <div style="display:flex;flex-direction:column;gap:10px;flex:1;">
            <div v-for="s in planMix" :key="s.label" style="display:flex;align-items:center;gap:8px;font-size:12px;">
              <span :style="{ width:'8px',height:'8px',borderRadius:'999px',background:s.color }" />
              <span style="flex:1;">{{ s.label }}</span>
              <span class="tabular" style="color:var(--muted);">{{ s.v }}</span>
              <span class="tabular" style="width:38px;text-align:right;color:var(--muted);">{{ s.pct }}%</span>
            </div>
          </div>
        </div>
      </AppPanel>
    </div>

    <!-- Top companies + audit log -->
    <div style="display:grid;grid-template-columns:2fr 1fr;gap:16px;">
      <AppPanel :title="tt('adminOverview.topCompaniesTitle')" :subtitle="tt('adminOverview.byMrr')" :padding="0">
        <template #action><AppButton variant="ghost" size="sm"><template #icon-right><AppIcon name="ChevronR" :size="12"/></template>{{ tt('adminOverview.viewAll') }}</AppButton></template>
        <table style="width:100%;border-collapse:collapse;font-size:12.5px;">
          <thead>
            <tr style="color:var(--muted);">
              <th v-for="h in [tt('adminOverview.thCompany'),tt('adminOverview.thPlan'),tt('adminOverview.thChannel'),tt('adminOverview.thPostsMonth'),tt('adminOverview.thMrr'),tt('adminOverview.thTrend'),'']" :key="h" style="text-align:left;padding:8px 10px;font-weight:500;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:var(--muted);">{{ h }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="c in topCompanies" :key="c.id" style="border-top:1px solid var(--border-2);">
              <td style="padding:10px;vertical-align:middle;">
                <div style="display:flex;align-items:center;gap:8px;">
                  <AppAvatar :name="c.name" :size="24"/>
                  <div style="display:flex;flex-direction:column;">
                    <span style="font-weight:500;">{{ c.name }}</span>
                    <span style="font-size:11px;color:var(--muted);">{{ c.owner }}</span>
                  </div>
                </div>
              </td>
              <td style="padding:10px;vertical-align:middle;"><PlanPill :plan="c.plan"/></td>
              <td style="padding:10px;vertical-align:middle;text-align:right;" class="tabular">{{ c.channels }}</td>
              <td style="padding:10px;vertical-align:middle;text-align:right;" class="tabular">{{ c.posts.toLocaleString('uz-UZ').replace(/,/g,' ') }}</td>
              <td style="padding:10px;vertical-align:middle;text-align:right;font-weight:500;" class="tabular">{{ fmtSom(c.mrr) }}</td>
              <td style="padding:10px;vertical-align:middle;"><Sparkline :data="c.trend" :width="70" :height="22"/></td>
              <td style="padding:10px;vertical-align:middle;text-align:right;"><AppStatus :kind="c.status"/></td>
            </tr>
          </tbody>
        </table>
      </AppPanel>

      <AppPanel :title="tt('adminOverview.recentActivityTitle')" :subtitle="tt('adminOverview.auditLog')" :padding="0">
        <template #action><AppButton variant="ghost" size="sm">{{ tt('adminOverview.all') }}</AppButton></template>
        <div style="display:flex;flex-direction:column;padding:18px;">
          <div v-for="(a, i) in AUDIT" :key="i" :style="{ display:'flex',gap:'10px',padding:'10px 0',borderTop: i===0?'none':'1px solid var(--border-2)' }">
            <span class="mono tabular" style="font-size:10.5px;color:var(--muted);width:36px;padding-top:1px;">{{ a.time }}</span>
            <span :style="{ width:'6px',height:'6px',borderRadius:'999px',marginTop:'6px',flexShrink:'0', background: a.tag==='overdue'?'var(--danger)':a.tag==='billing'?'var(--violet)':a.tag==='scan'?'var(--accent)':a.tag==='tariff'?'var(--warn)':'var(--muted)' }"/>
            <div style="display:flex;flex-direction:column;gap:1px;flex:1;min-width:0;">
              <span style="font-size:12px;color:var(--text);">{{ a.action }}</span>
              <span style="font-size:11px;color:var(--muted);">{{ a.who }}</span>
            </div>
          </div>
        </div>
      </AppPanel>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import AppKPI from '@/components/ui/AppKPI.vue'
import AppPanel from '@/components/ui/AppPanel.vue'
import AppTabs from '@/components/ui/AppTabs.vue'
import AppAvatar from '@/components/ui/AppAvatar.vue'
import AppStatus from '@/components/ui/AppStatus.vue'
import PlanPill from '@/components/ui/PlanPill.vue'
import Sparkline from '@/components/charts/Sparkline.vue'
import AreaChart from '@/components/charts/AreaChart.vue'
import DonutChart from '@/components/charts/DonutChart.vue'
import PageHeader from '@/components/layout/PageHeader.vue'
import Legend from '@/components/layout/Legend.vue'
import { COMPANIES, REVENUE_SERIES, NEW_COMPANIES_SERIES, AUDIT } from '@/data/index.js'
import { fmtSom } from '@/i18n/index.js'
import { useAppStore } from '@/stores/app.js'

const store = useAppStore()
const t = computed(() => store.t)
function tt(key, params) { return t.value(key, params) }

const chartTab = ref(tt('adminOverview.tabWeek'))

const totalMrr = computed(() => COMPANIES.reduce((s,c) => s + c.mrr, 0))
const activeCo = computed(() => COMPANIES.filter(c => c.status === 'active').length)
const trial = computed(() => COMPANIES.filter(c => c.status === 'trial').length)
const overdue = computed(() => COMPANIES.filter(c => c.status === 'overdue').length)
const totalChannels = computed(() => COMPANIES.reduce((s,c) => s + c.channels, 0))
const topCompanies = computed(() => [...COMPANIES].sort((a,b) => b.mrr - a.mrr).slice(0,6))

const donutSegments = [
  { value: 4, color: 'var(--violet)',  label: 'Scale' },
  { value: 3, color: 'var(--success)', label: 'Enterprise' },
  { value: 2, color: 'var(--accent)',  label: 'Core' },
  { value: 1, color: 'var(--muted)',   label: 'Starter' },
]
const planMix = [
  { color: 'var(--violet)',  label: 'Scale',      v: 4, pct: 40 },
  { color: 'var(--success)', label: 'Enterprise', v: 3, pct: 30 },
  { color: 'var(--accent)',  label: 'Core',       v: 2, pct: 20 },
  { color: 'var(--muted)',   label: 'Starter',    v: 1, pct: 10 },
]
</script>
