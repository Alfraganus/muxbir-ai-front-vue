<template>
  <div class="ds-root">
    <PageHeader
      title="Postlarni topish"
      subtitle="AI Telegram manbalaringizdan eng yaxshi postlarni topib beradi. Avval qidiruv parametrlarini sozlang."
    />

    <div class="ds-grid">
      <!-- LEFT: form -->
      <div class="ds-col">
        <!-- 1. Kanallar -->
        <AppPanel
          title="1. Qaysi kanallardan qidirilsin?"
          :subtitle="`${config.sources.length} ta kanal tanlandi · siz manbalarni ko'paytirishingiz mumkin`">
          <template #action>
            <AppButton variant="secondary" size="sm">
              <template #icon><AppIcon name="Plus" :size="12"/></template>
              Yangi manba qo'shish
            </AppButton>
          </template>

          <div v-if="loading" style="padding:24px;text-align:center;color:var(--muted);font-size:12.5px;">
            Manbalar yuklanmoqda...
          </div>
          <div v-else-if="!sources.length"
               style="padding:24px;text-align:center;color:var(--muted);font-size:12.5px;
                      display:flex;flex-direction:column;gap:10px;align-items:center;">
            <span>Hech qanday manba yo'q. Avval "Mening manbalarim" sahifasida kanal qo'shing.</span>
            <a href="#/client/owned-sources"
               style="padding:7px 14px;border-radius:6px;background:var(--accent);color:#fff;
                      text-decoration:none;font-size:12.5px;font-weight:500;">
              Manba qo'shish →
            </a>
          </div>
          <div v-else style="display:flex;flex-direction:column;gap:6px;">
            <button v-for="s in sources" :key="s.id"
              class="ds-src" :class="{ active: config.sources.includes(s.id) }"
              @click="toggleSrc(s.id)">
              <span class="ds-cb" :class="{ active: config.sources.includes(s.id) }">
                <AppIcon v-if="config.sources.includes(s.id)" name="Check" :size="11"/>
              </span>
              <span class="ds-src-avatar" :style="{ background: s.color }">{{ s.name.charAt(0) }}</span>
              <div style="display:flex;flex-direction:column;flex:1;min-width:0;text-align:left;">
                <div style="display:flex;align-items:center;gap:8px;">
                  <span style="font-size:13px;font-weight:600;">{{ s.name }}</span>
                  <span class="mono" style="font-size:11px;color:var(--muted);">{{ s.handle }}</span>
                </div>
                <span style="font-size:11px;color:var(--muted);">
                  {{ fmtCompact(s.subs) }} obunachi · {{ s.category }}
                </span>
              </div>
              <AppBadge :tone="config.sources.includes(s.id) ? 'accent' : 'muted'" dot>Faol</AppBadge>
            </button>
          </div>

          <div class="ds-add-src">
            <AppIcon name="Telegram" :size="14" :style="{ color: '#229ED9', flexShrink: 0 }"/>
            <input v-model="config.customSource"
              placeholder="@kanal_nomi yoki t.me/kanal — qo'shish uchun"
              class="ds-add-input"/>
            <AppButton variant="secondary" size="md" :disabled="!config.customSource">Tekshirish</AppButton>
          </div>
        </AppPanel>

        <!-- 3. Per channel -->
        <AppPanel title="2. Har kanaldan nechta post taklif qilinsin?"
          subtitle="AI har bir kanaldan eng yuqori balli postlarni tanlaydi">
          <div class="ds-n-grid">
            <button v-for="n in [3,5,10,15,20]" :key="n"
              class="ds-n-btn" :class="{ active: config.perChannel === n }"
              @click="config.perChannel = n">
              <span class="tabular ds-n-val" :class="{ active: config.perChannel === n }">{{ n }}</span>
              <span class="ds-n-lbl" :class="{ active: config.perChannel === n }">post</span>
            </button>
          </div>
          <div style="display:flex;align-items:center;gap:12px;">
            <span style="font-size:11.5px;color:var(--muted);">Yoki maxsus son:</span>
            <input type="range" min="1" max="30" step="1" v-model.number="config.perChannel"
              style="flex:1;accent-color:var(--accent);"/>
            <span class="mono tabular ds-n-pill">{{ config.perChannel }}</span>
          </div>
        </AppPanel>

        <!-- 4. Time range -->
        <AppPanel title="3. Qaysi davrdagi postlar?" subtitle="Kanalda chop etilgan vaqt bo'yicha">
          <div class="ds-time-grid">
            <button v-for="t in timeRanges" :key="t.id"
              class="ds-time" :class="{ active: config.timeRange === t.id }"
              @click="config.timeRange = t.id">
              <span v-if="t.recommended" class="ds-time-rec">Tavsiya</span>
              <span class="ds-time-lbl" :class="{ active: config.timeRange === t.id }">{{ t.label }}</span>
              <span class="ds-time-hint">{{ t.hint }}</span>
            </button>
          </div>
        </AppPanel>

        <!-- 5. Video filter -->
        <AppPanel title="4. Video bilan postlar"
          subtitle="Telegram'da video yoki katta fayl bo'lgan postlarni qo'shamizmi?">
          <div class="ds-yn-grid">
            <button class="ds-yn" :class="{ active: config.includeVideos }"
              @click="config.includeVideos = true">
              <AppIcon v-if="config.includeVideos" name="Check" :size="12"/>
              <span class="ds-yn-lbl">Ha, qo'shilsin</span>
              <span class="ds-yn-hint">Video va hujjatli postlar ham natijada chiqadi</span>
            </button>
            <button class="ds-yn" :class="{ active: !config.includeVideos }"
              @click="config.includeVideos = false">
              <AppIcon v-if="!config.includeVideos" name="Check" :size="12"/>
              <span class="ds-yn-lbl">Yo'q, faqat matn/rasm</span>
              <span class="ds-yn-hint">Video va katta hujjat bo'lgan postlar chiqarib tashlanadi</span>
            </button>
          </div>
        </AppPanel>

        <!-- 6. Sort mode -->
        <AppPanel title="5. Qanday postlarni chiqaramiz?"
          subtitle="Saralash usulini tanlang">
          <div class="ds-yn-grid">
            <button class="ds-yn" :class="{ active: config.sortMode === 'best' }"
              @click="config.sortMode = 'best'">
              <AppIcon v-if="config.sortMode === 'best'" name="Check" :size="12"/>
              <span class="ds-yn-lbl">⭐ Eng yaxshi postlar</span>
              <span class="ds-yn-hint">AI eng ko'p share, reaktsiya va ko'rishlar olganlarini birinchi chiqaradi</span>
            </button>
            <button class="ds-yn" :class="{ active: config.sortMode === 'latest' }"
              @click="config.sortMode = 'latest'">
              <AppIcon v-if="config.sortMode === 'latest'" name="Check" :size="12"/>
              <span class="ds-yn-lbl">🕒 Eng oxirgi postlar</span>
              <span class="ds-yn-hint">Eng yangi chop etilgan postlar sana bo'yicha birinchi chiqadi</span>
            </button>
          </div>
        </AppPanel>

      </div>

      <!-- RIGHT: sticky summary -->
      <div class="ds-side">
        <AppPanel :padding="0">
          <div class="ds-side-head">
            <span class="ds-side-ic">
              <AppIcon name="Sparkle" :size="16"/>
            </span>
            <div>
              <div style="font-size:12.5px;font-weight:600;">Qidiruv xulosasi</div>
              <div style="font-size:11px;color:var(--muted);">AI tahminan {{ Math.round(totalPosts * 1.5) }} ta postni tahlil qiladi</div>
            </div>
          </div>
          <div style="padding:18px;display:flex;flex-direction:column;gap:10px;">
            <SummaryRow label="Kanallar" :value="`${config.sources.length} ta`"
              :detail="config.sources.length ? selectedSourceNames : 'Tanlanmagan'">
              <template #icon><AppIcon name="Telegram" :size="12" :style="{ color:'#229ED9' }"/></template>
            </SummaryRow>
            <SummaryRow label="Postlar"
              :value="`${config.perChannel} × ${config.sources.length} = ${totalPosts}`"
              :detail="config.sortMode === 'latest' ? 'Eng oxirgi postlar sana bo\'yicha' : 'Eng yuqori balli postlar ko\'rsatiladi'">
              <template #icon><AppIcon name="Layers" :size="12"/></template>
            </SummaryRow>
            <SummaryRow label="Davr"
              :value="currentRange?.label"
              :detail="currentRange?.hint">
              <template #icon><AppIcon name="Calendar" :size="12"/></template>
            </SummaryRow>
            <SummaryRow label="Saralash"
              :value="config.sortMode === 'latest' ? 'Eng oxirgi' : 'Eng yaxshi'"
              :detail="config.sortMode === 'latest' ? 'Sana bo\'yicha (yangi → eski)' : 'AI bal bo\'yicha (yuqori → past)'">
              <template #icon><AppIcon :name="config.sortMode === 'latest' ? 'Calendar' : 'Sparkle'" :size="12"/></template>
            </SummaryRow>
            <div style="height:1px;background:var(--border-2);margin:4px 0;"/>

            <AppButton variant="primary" size="lg"
              :disabled="config.sources.length === 0"
              @click="$emit('run')"
              :style="{ width: '100%', justifyContent: 'center', height: '40px' }">
              <template #icon><AppIcon name="Sparkle" :size="14"/></template>
              AI qidiruvni boshlash
            </AppButton>
            <p style="margin:0;font-size:10.5px;color:var(--muted);text-align:center;line-height:1.5;">
              Qidiruv tahminan 30-60 soniya davom etadi. Token sarflanadi: ~{{ Math.round(totalPosts * 120) }}.
            </p>
          </div>
        </AppPanel>

        <AppPanel :padding="14">
          <div style="display:flex;align-items:flex-start;gap:10px;">
            <AppIcon name="Bolt" :size="14" :style="{ color:'var(--accent)', marginTop:'1px' }"/>
            <div style="display:flex;flex-direction:column;gap:2px;">
              <span style="font-size:11.5px;font-weight:600;">Maslahat</span>
              <span style="font-size:11px;color:var(--muted);line-height:1.5;">
                Birinchi qidiruv uchun "So'nggi 7 kun" va kanaldan 3-5 ta postni tanlang. Keyin filtrni kengaytirishingiz mumkin.
              </span>
            </div>
          </div>
        </AppPanel>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import AppPanel from '@/components/ui/AppPanel.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import PageHeader from '@/components/layout/PageHeader.vue'
import SummaryRow from '@/components/discover/SummaryRow.vue'

const props = defineProps({
  config: { type: Object, required: true },
  sources: { type: Array, required: true },
  categories: { type: Array, required: true },
  timeRanges: { type: Array, required: true },
  loading: { type: Boolean, default: false },
})
defineEmits(['run'])

const totalPosts = computed(() => props.config.sources.length * props.config.perChannel)
const currentRange = computed(() => props.timeRanges.find(t => t.id === props.config.timeRange))
const selectedSourceNames = computed(() =>
  props.sources.filter(s => props.config.sources.includes(s.id)).map(s => s.name).join(', '))
const selectedCategoryNames = computed(() =>
  props.categories.filter(c => props.config.categories.includes(c.id)).map(c => c.label).join(', '))
const categoryDetail = computed(() =>
  props.config.categories.includes('all') ? "Hech qanday filtr yo'q" : selectedCategoryNames.value)

function toggleSrc(id) {
  const has = props.config.sources.includes(id)
  props.config.sources = has
    ? props.config.sources.filter(x => x !== id)
    : [...props.config.sources, id]
}
function toggleCat(id) {
  if (id === 'all') { props.config.categories = ['all']; return }
  const has = props.config.categories.includes(id)
  let next = has
    ? props.config.categories.filter(x => x !== id)
    : [...props.config.categories.filter(x => x !== 'all'), id]
  if (!next.length) next = ['all']
  props.config.categories = next
}
function fmtCompact(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M'
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'K'
  return String(n)
}
function scoreColor(v) {
  if (v >= 85) return 'var(--success)'
  if (v >= 70) return 'var(--accent)'
  return '#F59E0B'
}
</script>

<style scoped>
.ds-root { padding: 24px 24px 60px; display: flex; flex-direction: column; gap: 18px; }
.ds-grid { display: grid; grid-template-columns: 1.5fr 1fr; gap: 18px; align-items: flex-start; }
@media (max-width: 1100px) { .ds-grid { grid-template-columns: 1fr; } }
.ds-col { display: flex; flex-direction: column; gap: 14px; }
.ds-side { position: sticky; top: 16px; display: flex; flex-direction: column; gap: 12px; }

.ds-src {
  display: flex; align-items: center; gap: 12px;
  padding: 12px 14px;
  background: var(--panel); border: 1.5px solid var(--border);
  border-radius: 10px; cursor: pointer; text-align: left;
  transition: all .12s; font-family: inherit;
}
.ds-src.active { background: var(--accent-bg); border-color: var(--accent); }
.ds-cb {
  width: 18px; height: 18px; border-radius: 5px;
  background: var(--panel); border: 1.5px solid var(--border);
  display: inline-flex; align-items: center; justify-content: center;
  color: white; flex-shrink: 0;
}
.ds-cb.active { background: var(--accent); border-color: var(--accent); }
.ds-src-avatar {
  width: 32px; height: 32px; border-radius: 8px;
  color: white;
  display: inline-flex; align-items: center; justify-content: center;
  font-weight: 700; font-size: 13px; flex-shrink: 0;
}
.ds-add-src {
  margin-top: 10px; padding: 10px 12px;
  background: var(--panel-2); border: 1px dashed var(--border);
  border-radius: 8px;
  display: flex; gap: 8px; align-items: center;
}
.ds-add-input {
  flex: 1; height: 30px; padding: 0 10px;
  background: var(--panel); border: 1px solid var(--border);
  border-radius: 6px; font-size: 12px; font-family: inherit;
  color: var(--text); outline: none;
}
.ds-add-input:focus { border-color: var(--accent); }

.ds-cat {
  height: 30px; padding: 0 12px; font-size: 12px; font-weight: 500;
  background: var(--panel); border: 1px solid var(--border);
  color: var(--text-2);
  border-radius: 999px; cursor: pointer;
  display: inline-flex; align-items: center; gap: 5px;
  font-family: inherit;
}
.ds-cat.active {
  background: var(--accent-bg);
  border-color: color-mix(in oklab, var(--accent) 30%, transparent);
  color: var(--accent);
}

.ds-n-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; margin-bottom: 14px; }
.ds-n-btn {
  padding: 14px 0;
  background: var(--panel); border: 1.5px solid var(--border);
  border-radius: 10px; cursor: pointer;
  display: flex; flex-direction: column; align-items: center; gap: 2px;
  font-family: inherit;
}
.ds-n-btn.active { background: var(--accent-bg); border-color: var(--accent); }
.ds-n-val { font-size: 22px; font-weight: 700; color: var(--text); letter-spacing: -0.02em; }
.ds-n-val.active { color: var(--accent); }
.ds-n-lbl { font-size: 10.5px; color: var(--muted); font-weight: 500; text-transform: uppercase; letter-spacing: 0.06em; }
.ds-n-lbl.active { color: var(--accent); }
.ds-n-pill {
  font-size: 13px; font-weight: 600;
  background: var(--panel-2); border: 1px solid var(--border);
  padding: 4px 10px; border-radius: 6px; min-width: 40px; text-align: center;
}

.ds-time-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 6px; }
@media (max-width: 900px) { .ds-time-grid { grid-template-columns: repeat(2, 1fr); } }
.ds-time {
  position: relative;
  padding: 10px 8px;
  background: var(--panel); border: 1.5px solid var(--border);
  border-radius: 10px; cursor: pointer;
  display: flex; flex-direction: column; gap: 3px; align-items: flex-start; text-align: left;
  font-family: inherit;
}
.ds-time.active { background: var(--accent-bg); border-color: var(--accent); }
.ds-time-rec {
  position: absolute; top: -8px; right: 8px;
  padding: 2px 6px; border-radius: 999px;
  background: var(--accent); color: white;
  font-size: 9px; font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase;
}
.ds-time-lbl { font-size: 12px; font-weight: 600; color: var(--text); }
.ds-time-lbl.active { color: var(--accent); }
.ds-time-hint { font-size: 10.5px; color: var(--muted); }

.ds-score-box {
  display: flex; flex-direction: column; align-items: center;
  width: 80px; padding: 8px 0;
  background: var(--panel-2); border: 1px solid var(--border);
  border-radius: 8px;
}
.ds-score-val { font-size: 22px; font-weight: 700; letter-spacing: -0.02em; }
.ds-score-of { font-size: 9.5px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.08em; font-weight: 500; }

.ds-yn-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.ds-yn {
  position: relative;
  padding: 14px 14px 12px;
  background: var(--panel); border: 1.5px solid var(--border);
  border-radius: 10px; cursor: pointer;
  display: flex; flex-direction: column; gap: 4px; align-items: flex-start; text-align: left;
  font-family: inherit;
}
.ds-yn.active { background: var(--accent-bg); border-color: var(--accent); }
.ds-yn-lbl { font-size: 12.5px; font-weight: 600; color: var(--text); }
.ds-yn.active .ds-yn-lbl { color: var(--accent); }
.ds-yn-hint { font-size: 11px; color: var(--muted); line-height: 1.4; }

.ds-side-head {
  padding: 16px 18px;
  background: linear-gradient(135deg, var(--accent-bg) 0%, color-mix(in oklab, #6E56CF 12%, var(--panel)) 100%);
  border-bottom: 1px solid var(--border);
  display: flex; align-items: center; gap: 10px;
}
.ds-side-ic {
  width: 32px; height: 32px; border-radius: 8px;
  background: var(--accent); color: white;
  display: inline-flex; align-items: center; justify-content: center;
}
</style>
