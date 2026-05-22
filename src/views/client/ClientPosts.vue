<template>
  <div style="padding:20px 24px 40px;display:flex;flex-direction:column;gap:16px;">
    <PageHeader title="Postlar oqimi" subtitle="Scan natijalari, AI tomonidan tahrirlangan va navbatdagi postlar">
      <template #right>
        <AppButton variant="secondary" size="md"><template #icon><AppIcon name="Sparkle" :size="13"/></template>AI generatsiya</AppButton>
        <AppButton variant="primary" size="md"><template #icon><AppIcon name="Plus" :size="13"/></template>Yangi post</AppButton>
      </template>
    </PageHeader>

    <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
      <AppTabs v-model="filter" :items="filterTabs"/>
      <div style="flex:1;"/>
      <AppInput v-model="query" placeholder="Sarlavha, kanal..." :style="{width:'220px'}">
        <template #icon><AppIcon name="Search" :size="13" :style="{color:'var(--muted)'}" /></template>
      </AppInput>
      <AppButton variant="secondary" size="md"><template #icon><AppIcon name="Filter" :size="13"/></template>Filtrlar</AppButton>
    </div>

    <div style="display:grid;grid-template-columns:1fr 380px;gap:16px;align-items:start;">
      <AppPanel :padding="0">
        <table style="width:100%;border-collapse:collapse;font-size:12.5px;">
          <thead>
            <tr style="border-bottom:1px solid var(--border);">
              <th style="padding-left:14px;padding:8px 10px;width:32px;"><input type="checkbox" style="accent-color:var(--accent);"/></th>
              <th v-for="h in [{l:'Sarlavha'},{l:'Kanal'},{l:'Manba'},{l:'AI baho',r:true},{l:'Reach',r:true},{l:'Vaqt'},{l:'Status'}]" :key="h.l"
                :style="{ textAlign:h.r?'right':'left',padding:'8px 10px',fontWeight:500,fontSize:'11px',textTransform:'uppercase',letterSpacing:'0.05em',color:'var(--muted)' }">{{ h.l }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(p, i) in list" :key="p.id" :style="{ borderTop: i===0?'none':'1px solid var(--border-2)',cursor:'pointer' }">
              <td style="padding-left:14px;padding:10px;vertical-align:middle;"><input type="checkbox" style="accent-color:var(--accent);"/></td>
              <td style="padding:10px;vertical-align:middle;">
                <div style="display:flex;flex-direction:column;gap:1px;max-width:320px;">
                  <span style="font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">{{ p.title }}</span>
                  <span style="font-size:11px;color:var(--muted);">{{ p.category }}</span>
                </div>
              </td>
              <td style="padding:10px;vertical-align:middle;">
                <div style="display:flex;align-items:center;gap:6px;">
                  <AppIcon name="Telegram" :size="12" :style="{color:'var(--accent)'}"/>
                  <span class="mono" style="font-size:11.5px;color:var(--text-2);">{{ p.handle }}</span>
                </div>
              </td>
              <td style="padding:10px;vertical-align:middle;"><span style="font-size:11.5px;color:var(--muted);">{{ p.source }}</span></td>
              <td style="padding:10px;vertical-align:middle;text-align:right;">
                <div style="display:inline-flex;align-items:center;gap:6px;">
                  <span style="position:relative;width:26px;height:26px;">
                    <svg width="26" height="26" viewBox="0 0 26 26" :style="{ transform:'rotate(-90deg)' }">
                      <circle cx="13" cy="13" r="10" fill="none" stroke="var(--border-2)" stroke-width="2.5"/>
                      <circle cx="13" cy="13" r="10" fill="none" :stroke="aiColor(p.ai)" stroke-width="2.5"
                        :stroke-dasharray="`${(p.ai/100)*62.8} 62.8`" stroke-linecap="round"/>
                    </svg>
                  </span>
                  <span class="tabular" style="font-size:11.5px;font-weight:500;" :style="{ color: aiColor(p.ai) }">{{ p.ai }}</span>
                </div>
              </td>
              <td style="padding:10px;vertical-align:middle;text-align:right;" class="tabular">
                <span v-if="p.reach > 0">{{ fmtCompact(p.reach) }}</span>
                <span v-else style="color:var(--muted-2);">—</span>
              </td>
              <td style="padding:10px;vertical-align:middle;"><span class="mono" style="font-size:11.5px;color:var(--muted);">{{ p.time }}</span></td>
              <td style="padding:10px;vertical-align:middle;"><AppStatus :kind="p.status"/></td>
            </tr>
          </tbody>
        </table>
      </AppPanel>

      <!-- Post preview pane -->
      <AppPanel :padding="0">
        <header style="display:flex;align-items:center;justify-content:space-between;padding:12px 14px;border-bottom:1px solid var(--border-2);">
          <div style="display:flex;align-items:center;gap:8px;">
            <AppIcon name="Eye" :size="14" :style="{color:'var(--muted)'}"/>
            <span style="font-size:12.5px;font-weight:600;">Ko'rinish</span>
            <AppStatus :kind="POSTS[0].status"/>
          </div>
          <div style="display:flex;gap:4px;">
            <AppButton variant="ghost" size="sm"><template #icon><AppIcon name="Edit" :size="12"/></template>Tahrirlash</AppButton>
            <AppButton variant="ghost" size="sm"><template #icon><AppIcon name="Copy" :size="12"/></template></AppButton>
          </div>
        </header>
        <div style="padding:14px;">
          <div style="background:var(--panel-2);border:1px solid var(--border);border-radius:10px;padding:14px;display:flex;flex-direction:column;gap:10px;">
            <div style="display:flex;align-items:center;gap:8px;">
              <span style="width:28px;height:28px;border-radius:999px;background:var(--accent-bg);color:var(--accent);display:inline-flex;align-items:center;justify-content:center;">
                <AppIcon name="Telegram" :size="14"/>
              </span>
              <div style="display:flex;flex-direction:column;flex:1;">
                <span style="font-size:12.5px;font-weight:600;">{{ POSTS[0].channel }}</span>
                <span class="mono" style="font-size:10.5px;color:var(--muted);">{{ POSTS[0].handle }} · {{ POSTS[0].time }}</span>
              </div>
              <AppBadge tone="accent">{{ POSTS[0].category }}</AppBadge>
            </div>
            <div style="height:140px;background:repeating-linear-gradient(45deg,var(--border-2) 0 8px,var(--panel) 8px 16px);border-radius:8px;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:11px;color:var(--muted);">
              cover image · 1280×720
            </div>
            <div style="font-size:13.5px;font-weight:600;line-height:1.35;color:var(--text);">{{ POSTS[0].title }}</div>
            <div style="font-size:12.5px;color:var(--text-2);line-height:1.55;">
              Olcha Express bugun bir nechta yangi shaharlarda 90 daqiqada yetkazib berish xizmatini kengaytirdi.
              Endi Toshkent, Samarqand va Buxoroda yangi marshrutlar ishlamoqda.
            </div>
            <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:2px;">
              <span v-for="tag in ['#olcha','#tezkor','#yetkazib_berish']" :key="tag" class="mono"
                style="font-size:11px;color:var(--accent);padding:2px 6px;border-radius:4px;background:var(--accent-bg);">{{ tag }}</span>
            </div>
          </div>

          <div style="margin-top:14px;display:flex;flex-direction:column;gap:8px;">
            <span style="font-size:10.5px;color:var(--muted);text-transform:uppercase;letter-spacing:0.07em;font-weight:500;">AI tahlil</span>
            <div v-for="m in aiMetrics" :key="m.label">
              <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
                <span style="font-size:11.5px;color:var(--text-2);">{{ m.label }}</span>
                <span class="tabular" style="font-size:11.5px;font-weight:500;">{{ m.value }}/100</span>
              </div>
              <AppProgress :value="m.value" :tone="m.value >= 85 ? 'success' : m.value >= 70 ? 'accent' : 'warn'"/>
            </div>
          </div>
        </div>
        <div style="padding:12px;background:var(--panel-2);border-top:1px solid var(--border-2);display:flex;gap:8px;border-radius:0 0 var(--r-lg) var(--r-lg);">
          <AppButton variant="secondary" size="md" style="flex:1;">Reja</AppButton>
          <AppButton variant="primary" size="md" style="flex:1;"><template #icon><AppIcon name="Send" :size="13"/></template>Hozir chop etish</AppButton>
        </div>
      </AppPanel>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import AppPanel from '@/components/ui/AppPanel.vue'
import AppTabs from '@/components/ui/AppTabs.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppStatus from '@/components/ui/AppStatus.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppProgress from '@/components/ui/AppProgress.vue'
import PageHeader from '@/components/layout/PageHeader.vue'
import { POSTS } from '@/data/index.js'
import { fmtCompact } from '@/i18n/index.js'

const filter = ref('all')
const query = ref('')

const filterTabs = computed(() => [
  { value: 'all',       label: 'Hammasi',      count: POSTS.length },
  { value: 'published', label: 'Chop etilgan', count: POSTS.filter(p => p.status === 'published').length },
  { value: 'scheduled', label: 'Rejada',       count: POSTS.filter(p => p.status === 'scheduled').length },
  { value: 'review',    label: 'Ko\'rish',     count: POSTS.filter(p => p.status === 'review').length },
  { value: 'scanning',  label: 'Skanyatda',    count: POSTS.filter(p => p.status === 'scanning').length },
  { value: 'draft',     label: 'Draft',        count: POSTS.filter(p => p.status === 'draft').length },
  { value: 'failed',    label: 'Xato',         count: POSTS.filter(p => p.status === 'failed').length },
])

const list = computed(() => POSTS.filter(p =>
  (filter.value === 'all' || p.status === filter.value) &&
  (!query.value || p.title.toLowerCase().includes(query.value.toLowerCase()) || p.handle.toLowerCase().includes(query.value.toLowerCase()))
))

function aiColor(score) {
  return score >= 85 ? 'var(--success)' : score >= 70 ? 'var(--accent)' : 'var(--warn)'
}

const aiMetrics = [
  { label: 'O\'qilish ravonligi', value: 92 },
  { label: 'Hissiy ohang', value: 78 },
  { label: 'Auditoriya mosligi', value: 88 },
  { label: 'SEO baholash', value: 71 },
]
</script>
