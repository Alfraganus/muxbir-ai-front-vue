<template>
  <div style="padding:20px 24px 40px;display:flex;flex-direction:column;gap:16px;">
    <PageHeader :title="`Kompaniyalar`" :subtitle="`${COMPANIES.length} ta kompaniya · ${activeCo} ta faol`">
      <template #right>
        <AppButton variant="secondary" size="md"><template #icon><AppIcon name="Sort" :size="13"/></template>Eksport</AppButton>
        <AppButton variant="primary" size="md"><template #icon><AppIcon name="Plus" :size="13"/></template>Yangi kompaniya</AppButton>
      </template>
    </PageHeader>

    <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
      <AppTabs v-model="filter" :items="filterTabs" />
      <div style="flex:1;" />
      <AppInput v-model="query" placeholder="Nom yoki egasi..." :style="{ width:'220px' }">
        <template #icon><AppIcon name="Search" :size="13" :style="{color:'var(--muted)'}" /></template>
      </AppInput>
      <AppButton variant="secondary" size="md"><template #icon><AppIcon name="Filter" :size="13"/></template>Filtrlar</AppButton>
      <AppButton variant="secondary" size="md"><template #icon><AppIcon name="Sort" :size="13"/></template>Tartib</AppButton>
    </div>

    <AppPanel :padding="0">
      <table style="width:100%;border-collapse:collapse;font-size:12.5px;">
        <thead>
          <tr style="border-bottom:1px solid var(--border);">
            <th style="width:32px;padding-left:14px;padding:8px 10px;"><input type="checkbox" style="accent-color:var(--accent);"/></th>
            <th v-for="h in colHeaders" :key="h.label" :style="{ textAlign: h.right ? 'right' : 'left', padding:'8px 10px', fontWeight:500, fontSize:'11px', textTransform:'uppercase', letterSpacing:'0.05em', color:'var(--muted)' }">{{ h.label }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(c, i) in filtered" :key="c.id" :style="{ borderTop: i===0?'none':'1px solid var(--border-2)' }">
            <td style="padding-left:14px;padding:10px;vertical-align:middle;"><input type="checkbox" style="accent-color:var(--accent);"/></td>
            <td style="padding:10px;vertical-align:middle;">
              <div style="display:flex;align-items:center;gap:10px;">
                <AppAvatar :name="c.name" :size="28"/>
                <div style="display:flex;flex-direction:column;">
                  <span style="font-weight:500;">{{ c.name }}</span>
                  <span style="font-size:11px;color:var(--muted);"><span class="mono">{{ c.email }}</span> · {{ c.owner }}</span>
                </div>
              </div>
            </td>
            <td style="padding:10px;vertical-align:middle;"><PlanPill :plan="c.plan"/></td>
            <td style="padding:10px;vertical-align:middle;text-align:right;" class="tabular">{{ c.channels }}</td>
            <td style="padding:10px;vertical-align:middle;text-align:right;" class="tabular">{{ c.posts.toLocaleString('uz-UZ').replace(/,/g,' ') }}</td>
            <td style="padding:10px;vertical-align:middle;text-align:right;font-weight:500;" class="tabular">{{ fmtSom(c.mrr) }}</td>
            <td style="padding:10px;vertical-align:middle;"><AppStatus :kind="c.status"/></td>
            <td style="padding:10px;vertical-align:middle;"><Sparkline :data="c.trend" :width="80" :height="22" :color="c.status==='overdue'?'var(--danger)':'var(--accent)'"/></td>
            <td style="padding:10px;vertical-align:middle;" class="mono" style2="font-size:11.5px;color:var(--muted);">{{ c.joined }}</td>
            <td style="padding:10px;vertical-align:middle;"><MoreMenu/></td>
          </tr>
        </tbody>
      </table>
      <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 14px;border-top:1px solid var(--border);font-size:12px;color:var(--muted);">
        <span>{{ filtered.length }} / {{ COMPANIES.length }} ko'rsatildi</span>
        <div style="display:flex;align-items:center;gap:6px;">
          <AppButton variant="ghost" size="sm"><template #icon><AppIcon name="ChevronL" :size="12"/></template>Oldingi</AppButton>
          <span class="mono" style="padding:0 6px;">1 / 1</span>
          <AppButton variant="ghost" size="sm"><template #icon-right><AppIcon name="ChevronR" :size="12"/></template>Keyingi</AppButton>
        </div>
      </div>
    </AppPanel>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import AppPanel from '@/components/ui/AppPanel.vue'
import AppTabs from '@/components/ui/AppTabs.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppAvatar from '@/components/ui/AppAvatar.vue'
import AppStatus from '@/components/ui/AppStatus.vue'
import PlanPill from '@/components/ui/PlanPill.vue'
import Sparkline from '@/components/charts/Sparkline.vue'
import PageHeader from '@/components/layout/PageHeader.vue'
import MoreMenu from '@/components/layout/MoreMenu.vue'
import { COMPANIES } from '@/data/index.js'
import { fmtSom } from '@/i18n/index.js'

const filter = ref('all')
const query = ref('')

const activeCo = computed(() => COMPANIES.filter(c => c.status === 'active').length)

const filterTabs = computed(() => [
  { value: 'all',     label: 'Hammasi',  count: COMPANIES.length },
  { value: 'active',  label: 'Faol',     count: COMPANIES.filter(c => c.status === 'active').length },
  { value: 'trial',   label: 'Trial',    count: COMPANIES.filter(c => c.status === 'trial').length },
  { value: 'overdue', label: 'Qarz',     count: COMPANIES.filter(c => c.status === 'overdue').length },
  { value: 'paused',  label: 'Pauza',    count: COMPANIES.filter(c => c.status === 'paused').length },
])

const filtered = computed(() => COMPANIES.filter(c =>
  (filter.value === 'all' || c.status === filter.value) &&
  (!query.value || c.name.toLowerCase().includes(query.value.toLowerCase()) || c.owner.toLowerCase().includes(query.value.toLowerCase()))
))

const colHeaders = [
  { label: 'Kompaniya' }, { label: 'Tarif' }, { label: 'Kanal', right: true },
  { label: 'Postlar/oy', right: true }, { label: 'MRR', right: true }, { label: 'Status' },
  { label: "O'sish (12 hafta)" }, { label: "Qo'shilgan" }, { label: '' },
]
</script>
