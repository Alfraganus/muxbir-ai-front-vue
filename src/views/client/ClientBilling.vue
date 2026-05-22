<template>
  <div style="padding:20px 24px 40px;display:flex;flex-direction:column;gap:16px;">
    <PageHeader title="Tarif va to'lov" subtitle="Joriy tarif, foydalanish va to'lov tarixi">
      <template #right>
        <AppButton variant="secondary" size="md"><template #icon><AppIcon name="Sort" :size="13"/></template>Hisob hujjati</AppButton>
        <AppButton variant="primary" size="md"><template #icon><AppIcon name="Arrow" :size="13"/></template>Tarifni o'zgartirish</AppButton>
      </template>
    </PageHeader>

    <!-- Plan hero -->
    <AppPanel :padding="0">
      <div style="padding:20px 24px;background:linear-gradient(135deg,var(--accent-bg) 0%,var(--panel) 80%);border-radius:var(--r-lg) var(--r-lg) 0 0;display:grid;grid-template-columns:1.6fr 1fr 1fr;gap:24px;align-items:flex-start;">
        <div style="display:flex;flex-direction:column;gap:8px;">
          <div style="display:flex;gap:8px;align-items:center;">
            <span style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:0.07em;font-weight:500;">Joriy tarif</span>
            <AppBadge tone="violet">Scale · oylik</AppBadge>
          </div>
          <div style="display:flex;align-items:baseline;gap:6px;">
            <span class="tabular" style="font-size:28px;font-weight:600;letter-spacing:-0.02em;">2 700 000</span>
            <span style="font-size:14px;color:var(--muted);">so'm / oy</span>
          </div>
          <span style="font-size:12px;color:var(--muted);">Keyingi to'lov: <span style="color:var(--text);font-weight:500;">2026-06-01</span> · 16 kun qoldi</span>
          <div style="display:flex;gap:6px;margin-top:4px;">
            <AppButton variant="secondary" size="md">Yillik to'lovga o'tish (−15%)</AppButton>
            <AppButton variant="ghost" size="md">To'lovni bekor qilish</AppButton>
          </div>
        </div>
        <div style="display:flex;flex-direction:column;gap:6px;">
          <span style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:0.07em;font-weight:500;">Tarkibga kiradi</span>
          <PlanLine v-for="l in included" :key="l.text" :icon="l.icon" :text="l.text"/>
        </div>
        <div style="display:flex;flex-direction:column;gap:6px;">
          <span style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:0.07em;font-weight:500;">Faol modullar</span>
          <PlanLine icon="Facebook" text="Facebook scan" tone="accent"/>
          <PlanLine icon="Bolt" text="Priority support" tone="accent"/>
          <PlanLine icon="Instagram" text="Instagram posting" :muted="true" note="soon"/>
          <PlanLine icon="Sparkle" text="Custom branding" :muted="true" note="o'chirilgan"/>
        </div>
      </div>
    </AppPanel>

    <!-- Usage -->
    <AppPanel title="Bu oyda foydalanish" subtitle="Tarif chegaralarining holati">
      <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:16px;">
        <div v-for="u in usage" :key="u.label" style="display:flex;flex-direction:column;gap:6px;">
          <span style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:0.06em;">{{ u.label }}</span>
          <div style="display:flex;align-items:baseline;gap:4px;">
            <span class="tabular" :style="{ fontSize:'18px',fontWeight:600,color: u.used>u.limit ? 'var(--danger)' : 'var(--text)' }">
              {{ u.used.toLocaleString('uz-UZ').replace(/,/g,' ') }}
            </span>
            <span style="font-size:11px;color:var(--muted);">/ {{ u.limit.toLocaleString('uz-UZ').replace(/,/g,' ') }} {{ u.unit }}</span>
          </div>
          <AppProgress :value="Math.min(100, (u.used/u.limit)*100)" :tone="u.used>u.limit ? 'danger' : (u.used/u.limit)>0.8 ? 'warn' : 'accent'"/>
          <span v-if="u.used > u.limit" style="font-size:11px;color:var(--danger);">Limit oshdi · +{{ u.used - u.limit }} {{ u.unit }}</span>
        </div>
      </div>
    </AppPanel>

    <!-- Invoices + Payment method -->
    <div style="display:grid;grid-template-columns:2fr 1fr;gap:16px;">
      <AppPanel title="To'lov tarixi" subtitle="Oxirgi 6 oy" :padding="0">
        <template #action><AppButton variant="ghost" size="sm">Hammasi</AppButton></template>
        <table style="width:100%;border-collapse:collapse;font-size:12.5px;">
          <thead>
            <tr style="border-bottom:1px solid var(--border-2);">
              <th style="text-align:left;padding:8px 14px;font-weight:500;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:var(--muted);">Faktura</th>
              <th v-for="h in ['Sana','Usul','Summa','Holat','']" :key="h" :style="{ textAlign:h==='Summa'?'right':'left',padding:'8px 10px',fontWeight:500,fontSize:'11px',textTransform:'uppercase',letterSpacing:'0.05em',color:'var(--muted)' }">{{ h }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(inv, i) in invoices" :key="inv.id" :style="{ borderTop: i===0?'none':'1px solid var(--border-2)' }">
              <td style="padding:10px 14px;vertical-align:middle;">
                <span class="mono" style="font-size:12px;font-weight:500;">{{ inv.id }}</span>
              </td>
              <td style="padding:10px;vertical-align:middle;" class="mono" style2="font-size:11.5px;color:var(--muted);">{{ inv.date }}</td>
              <td style="padding:10px;vertical-align:middle;"><AppBadge tone="muted">{{ inv.method }}</AppBadge></td>
              <td style="padding:10px;vertical-align:middle;text-align:right;" class="tabular" style2="font-weight:500;">{{ fmtSom(inv.amount) }} so'm</td>
              <td style="padding:10px;vertical-align:middle;"><AppStatus kind="active"/></td>
              <td style="padding:10px 14px;vertical-align:middle;text-align:right;">
                <AppButton variant="ghost" size="sm"><template #icon><AppIcon name="Sort" :size="11"/></template>PDF</AppButton>
              </td>
            </tr>
          </tbody>
        </table>
      </AppPanel>

      <AppPanel title="To'lov usuli">
        <div style="display:flex;flex-direction:column;gap:10px;">
          <div v-for="(m, i) in methods" :key="i"
            :style="{ display:'flex',alignItems:'center',gap:'10px',padding:'10px 12px',border:'1px solid var(--border)',borderRadius:'8px',background: m.primary ? 'var(--accent-bg)' : 'var(--panel)' }">
            <span :style="{ width:'32px',height:'22px',borderRadius:'4px',background:m.primary?'var(--accent)':'var(--panel-2)',border:'1px solid var(--border)',display:'inline-flex',alignItems:'center',justifyContent:'center',fontFamily:'var(--font-mono)',fontSize:'9px',fontWeight:600,color:m.primary?'white':'var(--muted)' }">
              {{ m.logo.slice(0,4).toUpperCase() }}
            </span>
            <div style="display:flex;flex-direction:column;flex:1;min-width:0;">
              <span style="font-size:12.5px;font-weight:500;">{{ m.name }}</span>
              <span style="font-size:11px;color:var(--muted);">{{ m.primary ? 'Asosiy · muddati ' + m.expires : 'Zaxira' }}</span>
            </div>
            <AppBadge v-if="m.primary" tone="accent">Asosiy</AppBadge>
          </div>
          <AppButton variant="secondary" size="md" style="margin-top:4px;"><template #icon><AppIcon name="Plus" :size="13"/></template>Yangi to'lov usuli</AppButton>
        </div>

        <div style="height:1px;background:var(--border-2);margin:16px 0;"/>
        <div style="display:flex;flex-direction:column;gap:6px;">
          <span style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:0.06em;font-weight:500;">Hisob ma'lumotlari</span>
          <div v-for="r in billingInfo" :key="r.label" style="display:flex;align-items:center;justify-content:space-between;padding:4px 0;font-size:12.5px;">
            <span style="color:var(--muted);">{{ r.label }}</span>
            <span style="font-weight:500;color:var(--text);">{{ r.value }}</span>
          </div>
        </div>
      </AppPanel>
    </div>
  </div>
</template>

<script setup>
import { defineComponent, h } from 'vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import AppPanel from '@/components/ui/AppPanel.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppStatus from '@/components/ui/AppStatus.vue'
import AppProgress from '@/components/ui/AppProgress.vue'
import PageHeader from '@/components/layout/PageHeader.vue'
import { fmtSom } from '@/i18n/index.js'

const usage = [
  { label: 'Telegram kanallar',  used: 6,    limit: 4,    unit: 'kanal' },
  { label: 'Postlar (joriy oy)', used: 1280, limit: 2000, unit: 'post' },
  { label: 'AI tokenlar',        used: 420,  limit: 600,  unit: '1k tok' },
  { label: 'Komanda joylari',    used: 4,    limit: 5,    unit: 'joy' },
  { label: 'Saqlash',            used: 32,   limit: 50,   unit: 'GB' },
]

const invoices = [
  { id: 'INV-2026-05', date: '2026-05-01', amount: 2_700_000, status: 'paid', method: 'Click' },
  { id: 'INV-2026-04', date: '2026-04-01', amount: 2_700_000, status: 'paid', method: 'Payme' },
  { id: 'INV-2026-03', date: '2026-03-01', amount: 2_400_000, status: 'paid', method: 'Bank' },
  { id: 'INV-2026-02', date: '2026-02-01', amount: 2_400_000, status: 'paid', method: 'Payme' },
  { id: 'INV-2026-01', date: '2026-01-01', amount: 2_400_000, status: 'paid', method: 'Click' },
  { id: 'INV-2025-12', date: '2025-12-01', amount: 2_400_000, status: 'paid', method: 'Bank' },
]

const methods = [
  { name: 'Humo · ····7401', primary: true,  expires: '08/28', logo: 'humo' },
  { name: 'Click hisob',     primary: false, expires: '—',     logo: 'click' },
  { name: 'Bank o\'tkazma',  primary: false, expires: '—',     logo: 'bank' },
]

const billingInfo = [
  { label: 'Kompaniya', value: 'OOO Olcha Express' },
  { label: 'STIR',      value: '305 482 901' },
  { label: 'MFO',       value: '00415' },
  { label: 'Manzil',    value: 'Toshkent sh.' },
]

const included = [
  { icon: 'Telegram', text: '4 Telegram kanal (+ qo\'shimcha)' },
  { icon: 'Send',     text: '2 000 post / oy' },
  { icon: 'Sparkle',  text: '600k AI token' },
  { icon: 'Users',    text: '5 ta joy' },
  { icon: 'Database', text: '50 GB saqlash' },
]
</script>

<script>
import { defineComponent } from 'vue'
import AppIcon from '@/components/ui/AppIcon.vue'

const PlanLine = defineComponent({
  name: 'PlanLine',
  props: { icon: String, text: String, tone: String, muted: Boolean, note: String },
  components: { AppIcon },
  template: `
    <div :style="{ display:'flex',alignItems:'center',gap:'8px',fontSize:'12.5px',color: muted ? 'var(--muted)' : 'var(--text-2)' }">
      <span :style="{
        width:'22px',height:'22px',borderRadius:'5px',
        background: tone==='accent' ? 'var(--accent-bg)' : 'var(--panel-2)',
        color: tone==='accent' ? 'var(--accent)' : muted ? 'var(--muted-2)' : 'var(--text-2)',
        border:'1px solid var(--border)',
        display:'inline-flex',alignItems:'center',justifyContent:'center',
      }">
        <AppIcon :name="icon" :size="13"/>
      </span>
      <span>{{ text }}</span>
      <span v-if="note" class="mono" style="font-size:10.5px;color:var(--muted-2);margin-left:4px;">· {{ note }}</span>
    </div>
  `
})

export { PlanLine }
</script>
