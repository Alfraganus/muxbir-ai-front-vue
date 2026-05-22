<template>
  <div style="padding:20px 24px 40px;display:flex;flex-direction:column;gap:16px;">
    <PageHeader title="Salom, Sardor 👋" subtitle="Olcha Express · Bugun 6 ta kanaldan 124 ta post chiqdi">
      <template #right>
        <AppButton variant="secondary" size="md"><template #icon><AppIcon name="Calendar" :size="13"/></template>7 kun<template #icon-right><AppIcon name="Chevron" :size="12"/></template></AppButton>
        <AppButton variant="secondary" size="md"><template #icon><AppIcon name="Sparkle" :size="13"/></template>AI yordamchi</AppButton>
        <AppButton variant="primary" size="md"><template #icon><AppIcon name="Plus" :size="13"/></template>Yangi post</AppButton>
      </template>
    </PageHeader>

    <!-- KPIs -->
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;">
      <AppKPI label="Faol kanallar" value="6" delta="+1 yangi" delta-tone="success" sub="1 ta pauza, 1 ta draft">
        <template #icon><AppIcon name="Telegram" :size="14" :style="{color:'var(--muted)'}" /></template>
        <template #spark><Sparkline :data="[3,3,4,4,5,5,5,5,5,6,6,6]" :width="88" :height="28"/></template>
      </AppKPI>
      <AppKPI label="Postlar (7 kun)" value="234" delta="+18%" delta-tone="success" sub="190 avtomatik · 44 qo'l bilan">
        <template #icon><AppIcon name="Send" :size="14" :style="{color:'var(--muted)'}" /></template>
        <template #spark><Sparkline :data="[24,28,30,28,34,38,42,40,44,46,42,48]" :width="88" :height="28" color="var(--violet)"/></template>
      </AppKPI>
      <AppKPI label="O'rtacha erish" value="14.2K" delta="+6.4%" delta-tone="success" sub="Postga">
        <template #icon><AppIcon name="Eye" :size="14" :style="{color:'var(--muted)'}" /></template>
        <template #spark><Sparkline :data="[10,11,11,12,12,13,13,13,14,14,14,14]" :width="88" :height="28" color="var(--success)"/></template>
      </AppKPI>
      <AppKPI label="Tarif qoldig'i" value="36%" delta="14 kun qoldi" delta-tone="warn" sub="1 280 / 2 000 post">
        <template #icon><AppIcon name="Bolt" :size="14" :style="{color:'var(--muted)'}" /></template>
        <template #spark><Sparkline :data="[100,94,88,82,76,70,64,58,52,46,42,36]" :width="88" :height="28" color="var(--warn)"/></template>
      </AppKPI>
    </div>

    <!-- Post activity + sources -->
    <div style="display:grid;grid-template-columns:2fr 1fr;gap:16px;">
      <AppPanel title="Post aktivligi" subtitle="So'nggi 14 kun">
        <template #action><AppTabs :items="['Postlar','Reach','Engagement']" v-model="chartTab"/></template>
        <BarChart :data="[18,22,25,30,28,34,32,28,40,36,44,42,38,46]" :labels="['1','2','3','4','5','6','7','8','9','10','11','12','13','14']" :width="680" :height="200"/>
      </AppPanel>
      <AppPanel title="Manbalar" subtitle="Eng faol scan manbalari">
        <div style="display:flex;flex-direction:column;gap:12px;">
          <div v-for="s in sources" :key="s.name">
            <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
              <span style="font-size:12.5px;font-weight:500;">{{ s.name }}</span>
              <span style="font-size:11px;color:var(--muted);"><span class="mono">{{ s.type }}</span> · {{ s.count }}</span>
            </div>
            <div style="height:4px;background:var(--border-2);border-radius:999px;overflow:hidden;">
              <div :style="{ width: s.pct+'%', height:'100%', background:s.color, borderRadius:'999px' }"/>
            </div>
          </div>
        </div>
      </AppPanel>
    </div>

    <!-- Channels + queue -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
      <AppPanel title="Kanallaringiz" subtitle="Tezkor ko'rinish">
        <template #action><AppButton variant="ghost" size="sm"><template #icon-right><AppIcon name="ChevronR" :size="12"/></template>Hammasi</AppButton></template>
        <div style="display:flex;flex-direction:column;gap:0;">
          <div v-for="(c, i) in CHANNELS.slice(0, 5)" :key="c.id"
            :style="{ display:'flex',alignItems:'center',gap:'12px',padding:'10px 0',borderTop: i===0?'none':'1px solid var(--border-2)' }">
            <span style="width:32px;height:32px;border-radius:8px;background:var(--accent-bg);color:var(--accent);display:inline-flex;align-items:center;justify-content:center;">
              <AppIcon name="Telegram" :size="16"/>
            </span>
            <div style="display:flex;flex-direction:column;flex:1;min-width:0;">
              <div style="display:flex;gap:6px;align-items:center;">
                <span style="font-size:12.5px;font-weight:500;">{{ c.name }}</span>
                <AppStatus :kind="c.status"/>
              </div>
              <span class="mono" style="font-size:11px;color:var(--muted);">{{ c.handle }} · {{ fmtCompact(c.subs) }} obunachilar</span>
            </div>
            <div style="display:flex;flex-direction:column;align-items:flex-end;gap:2px;">
              <span class="tabular" style="font-size:12.5px;font-weight:500;">{{ c.posts7d }}</span>
              <span style="font-size:10.5px;color:var(--muted);">post / 7 kun</span>
            </div>
            <Sparkline :data="[c.engagement*.8,c.engagement*.9,c.engagement,c.engagement*1.1,c.engagement*.95,c.engagement*1.05,c.engagement*1.1,c.engagement*1.15]" :width="56" :height="22"/>
          </div>
        </div>
      </AppPanel>

      <AppPanel title="Bugungi rejada" subtitle="Keyingi avtomatik postlar">
        <template #action><AppButton variant="ghost" size="sm"><template #icon-right><AppIcon name="ChevronR" :size="12"/></template>Jadval</AppButton></template>
        <div style="display:flex;flex-direction:column;">
          <div v-for="(p, i) in schedule" :key="i"
            :style="{ display:'flex',alignItems:'center',gap:'12px',padding:'10px 0',borderTop: i===0?'none':'1px solid var(--border-2)' }">
            <span class="mono tabular" style="font-size:12px;color:var(--text-2);width:40px;font-weight:500;">{{ p.time }}</span>
            <div style="display:flex;flex-direction:column;flex:1;min-width:0;">
              <span style="font-size:12.5px;font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">{{ p.title }}</span>
              <span style="font-size:11px;color:var(--muted);"><span class="mono">{{ p.channel }}</span> · {{ p.source }}</span>
            </div>
            <AppStatus :kind="p.status"/>
          </div>
        </div>
      </AppPanel>
    </div>

    <!-- Heatmap + AI tips -->
    <div style="display:grid;grid-template-columns:2fr 1fr;gap:16px;">
      <AppPanel title="Eng faol vaqtlar" subtitle="Obunachilar aktivligi, oxirgi 30 kun">
        <HeatmapChart :data="HEATMAP" :width="680"/>
        <div style="display:flex;align-items:center;gap:8px;margin-top:12px;font-size:11px;color:var(--muted);">
          <span>kam</span>
          <span v-for="p in [10,30,50,70,90]" :key="p" :style="{ width:'16px',height:'12px',borderRadius:'2px',background:`color-mix(in oklab, var(--accent) ${p}%, var(--bg-2))` }"/>
          <span>ko'p</span>
          <span style="margin-left:12px;">Tavsiya: post chiqarish uchun <strong style="color:var(--text);">17:00–20:00</strong> oralig'i optimal.</span>
        </div>
      </AppPanel>

      <AppPanel title="AI tavsiyalari" subtitle="Bugun uchun">
        <div style="display:flex;flex-direction:column;gap:10px;">
          <div v-for="(tip, i) in tips" :key="i"
            :style="{
              display:'flex',gap:'10px',padding:'10px',
              background: tip.tone==='warn' ? 'var(--warn-bg)' : tip.tone==='success' ? 'var(--success-bg)' : 'var(--accent-bg)',
              border: `1px solid color-mix(in oklab, ${tip.tone==='warn' ? 'var(--warn)' : tip.tone==='success' ? 'var(--success)' : 'var(--accent)'} 25%, transparent)`,
              borderRadius:'8px'
            }">
            <span :style="{ fontSize:'14px',color: tip.tone==='warn' ? 'var(--warn)' : tip.tone==='success' ? 'var(--success)' : 'var(--accent)', fontWeight:700 }">{{ tip.icon }}</span>
            <div style="display:flex;flex-direction:column;gap:2px;">
              <span style="font-size:12.5px;font-weight:500;">{{ tip.title }}</span>
              <span style="font-size:11.5px;color:var(--text-2);">{{ tip.body }}</span>
            </div>
          </div>
        </div>
      </AppPanel>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import AppPanel from '@/components/ui/AppPanel.vue'
import AppKPI from '@/components/ui/AppKPI.vue'
import AppTabs from '@/components/ui/AppTabs.vue'
import AppStatus from '@/components/ui/AppStatus.vue'
import Sparkline from '@/components/charts/Sparkline.vue'
import BarChart from '@/components/charts/BarChart.vue'
import HeatmapChart from '@/components/charts/HeatmapChart.vue'
import PageHeader from '@/components/layout/PageHeader.vue'
import { CHANNELS, HEATMAP } from '@/data/index.js'
import { fmtCompact } from '@/i18n/index.js'

const chartTab = ref('Postlar')

const sources = [
  { name: 'Daryo.uz',    type: 'RSS',      count: 58, pct: 92, color: 'var(--accent)' },
  { name: 'Kun.uz',      type: 'RSS',      count: 42, pct: 71, color: 'var(--violet)' },
  { name: 'Gazeta.uz',   type: 'RSS',      count: 36, pct: 60, color: 'var(--success)' },
  { name: 'Reuters',     type: 'API',      count: 28, pct: 48, color: 'var(--warn)' },
  { name: 'TG @uzdaily', type: 'Telegram', count: 21, pct: 35, color: 'var(--muted)' },
]

const schedule = [
  { time: '14:30', title: 'Bozor sharhi: dollar va so\'m',                channel: '@bozor_sharhi', source: 'Reuters',  status: 'scheduled' },
  { time: '15:15', title: 'Olcha 90\' yetkazib berish kengaytirilmoqda',  channel: '@olcha_daily',  source: 'Manual',   status: 'review' },
  { time: '16:00', title: 'Toshkent metrosida yangi bekat',               channel: '@huduud',       source: 'Daryo',    status: 'scheduled' },
  { time: '17:45', title: 'Black Friday — preview',                       channel: '@olcha_promo',  source: 'Manual',   status: 'draft' },
  { time: '19:00', title: 'Apple WWDC dayjest',                           channel: '@texno_olcha',  source: 'TheVerge', status: 'scheduled' },
]

const tips = [
  { icon: '✦', title: '@texno_olcha kanalida 2 xatolik', body: 'Telegram API token yangilanishi kerak. Sozlamalarga o\'tish →', tone: 'warn' },
  { icon: '↗', title: 'Engagement +6.4% o\'sdi', body: 'Sabab: hudud yangiliklari postlari (5 ta) ortga qaytdi.', tone: 'success' },
  { icon: '✎', title: '5 ta post navbatda kutmoqda', body: 'Review qilish uchun postlarni ko\'rib chiqing.', tone: 'accent' },
]
</script>
