<template>
  <div class="dp-backdrop" @click="$emit('close')">
    <div class="dp-modal" @click.stop>
      <header class="dp-head">
        <span class="dp-src-avatar" :style="{ background: source.color }">{{ source.name.charAt(0) }}</span>
        <div style="display:flex;flex-direction:column;">
          <span style="font-size:13px;font-weight:600;">{{ source.name }}</span>
          <span class="mono" style="font-size:11px;color:var(--muted);">{{ source.handle }}<template v-if="post.dateLabel || post.time"> · {{ post.dateLabel || post.time }}</template></span>
        </div>
        <div style="flex:1"/>
        <span class="dp-pill">AI: {{ post.ai.total }}/100</span>
        <button class="dp-x" @click="$emit('close')">
          <AppIcon name="Close" :size="12"/>
        </button>
      </header>

      <div class="dp-body">
        <div class="dp-cover" :style="{ background: `linear-gradient(135deg, ${source.color}, color-mix(in oklab, ${source.color} 50%, black))` }">
          <div aria-hidden class="dp-stripes"/>
          <span class="dp-cover-label">cover · 1280×720</span>
        </div>

        <h2 class="dp-title">{{ post.title }}</h2>
        <p class="dp-text">
          {{ post.snippet }} Tafsilotlar manba kanalda ko'rsatilgan, AI shunga asoslanib mazmunni qayta yozadi va
          sizning kanalingiz tilida moslashtiradi. Hashtag va emojilarni avtomatik moslashtiradi.
        </p>

        <div class="dp-tags">
          <span v-for="t in post.tags" :key="t" class="mono dp-tag">{{ t }}</span>
        </div>

        <div class="dp-metrics">
          <div v-for="m in metrics" :key="m.label" class="dp-metric">
            <span class="dp-metric-label">
              <AppIcon :name="m.icon" :size="12"/>
              {{ m.label }}
            </span>
            <span class="tabular dp-metric-val">{{ m.val }}</span>
          </div>
        </div>

        <div>
          <div class="dp-ai-head">
            <AppIcon name="Sparkle" :size="13" :style="{ color: 'var(--accent)' }"/>
            <span style="font-size:12px;font-weight:600;">AI baholash tafsiloti</span>
            <div style="flex:1"/>
            <span class="tabular" :style="{ fontSize:'18px', fontWeight:700, color: post.ai.total >= 85 ? 'var(--success)' : 'var(--accent)' }">
              {{ post.ai.total }}<span style="font-size:12px;color:var(--muted);font-weight:500;">/100</span>
            </span>
          </div>
          <div style="display:flex;flex-direction:column;gap:8px;">
            <div v-for="m in aiBreakdown" :key="m.k" class="dp-ai-row">
              <div style="display:flex;flex-direction:column;">
                <span style="font-size:12px;font-weight:500;">{{ m.l }}</span>
                <span style="font-size:11px;color:var(--muted);">{{ m.desc }}</span>
              </div>
              <div class="dp-prog">
                <div class="dp-prog-fill"
                  :style="{ width: post.ai[m.k] + '%', background: barColor(post.ai[m.k]) }"/>
              </div>
              <span class="tabular" style="font-size:12px;font-weight:600;text-align:right;">
                {{ post.ai[m.k] }}<span style="color:var(--muted);font-weight:400;">/100</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      <footer class="dp-foot">
        <AppButton variant="secondary" size="md">
          <template #icon><AppIcon name="Telegram" :size="12" :style="{ color: '#229ED9' }"/></template>
          Manbada ochish
        </AppButton>
        <div style="flex:1"/>
        <AppButton variant="secondary" size="md" @click="$emit('close')">Yopish</AppButton>
        <AppButton variant="primary" size="md" @click="$emit('toggle')">
          <template #icon><AppIcon :name="isSelected ? 'Close' : 'Plus'" :size="12"/></template>
          {{ isSelected ? "Tanlovdan olib tashlash" : "Tanlash va tahrirlash" }}
        </AppButton>
      </footer>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppIcon from '@/components/ui/AppIcon.vue'

const props = defineProps({
  post: { type: Object, required: true },
  source: { type: Object, required: true },
  isSelected: { type: Boolean, default: false },
})
defineEmits(['close', 'toggle'])

const metrics = computed(() => [
  { label: "Ko'rishlar",    val: fmt(props.post.views),     icon: 'Eye' },
  { label: 'Reaksiyalar',   val: fmt(props.post.reactions), icon: 'Sparkle' },
  { label: 'Ulashishlar',   val: fmt(props.post.shares),    icon: 'Send' },
])

const aiBreakdown = [
  { k: 'relevance', l: 'Dolzarblik',          desc: "Mavzu hozir qanchalik muhokama qilinmoqda" },
  { k: 'virality',  l: 'Virallik salohiyati', desc: "Auditoriya ulashish ehtimoli" },
  { k: 'freshness', l: 'Yangilik darajasi',   desc: "Vaqt jihatidan dolzarbligi" },
  { k: 'audience',  l: 'Auditoriyaga moslik', desc: "Sizning kanalingiz tomonchasiga mos" },
]

function fmt(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M'
  if (n >= 1_000)     return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'K'
  return String(n)
}
function barColor(v) {
  if (v >= 85) return 'var(--success)'
  if (v >= 70) return 'var(--accent)'
  return '#F59E0B'
}
</script>

<style scoped>
.dp-backdrop {
  position: fixed; inset: 0;
  z-index: 100;
  background: rgba(15,23,42,0.45);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center;
  padding: 24px;
}
.dp-modal {
  width: 100%; max-width: 720px;
  max-height: calc(100vh - 48px);
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: 14px;
  box-shadow: var(--shadow-lg);
  display: flex; flex-direction: column;
  overflow: hidden;
  animation: dpIn 0.2s ease both;
}
@keyframes dpIn {
  from { opacity: 0; transform: translateY(8px) scale(0.98); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}

.dp-head {
  padding: 14px 18px;
  border-bottom: 1px solid var(--border);
  display: flex; align-items: center; gap: 10px;
}
.dp-src-avatar {
  width: 30px; height: 30px; border-radius: 8px;
  color: white;
  display: inline-flex; align-items: center; justify-content: center;
  font-weight: 700; font-size: 12px;
  flex-shrink: 0;
}
.dp-pill {
  display: inline-flex; align-items: center;
  height: 22px; padding: 0 10px;
  border-radius: 999px;
  background: var(--accent-bg);
  color: var(--accent);
  font-size: 11px; font-weight: 600;
}
.dp-x {
  width: 28px; height: 28px; border-radius: 6px;
  background: var(--panel-2);
  border: 1px solid var(--border);
  color: var(--muted);
  cursor: pointer;
  display: inline-flex; align-items: center; justify-content: center;
}
.dp-x:hover { color: var(--text); }

.dp-body {
  flex: 1;
  overflow-y: auto;
  padding: 18px;
  display: flex; flex-direction: column;
  gap: 14px;
}
.dp-cover {
  height: 220px;
  border-radius: 10px;
  position: relative;
  overflow: hidden;
}
.dp-stripes {
  position: absolute; inset: 0;
  background-image: repeating-linear-gradient(45deg, rgba(255,255,255,0.06) 0 8px, transparent 8px 16px);
}
.dp-cover-label {
  position: absolute;
  left: 14px; bottom: 14px;
  padding: 4px 10px;
  border-radius: 999px;
  background: rgba(0,0,0,0.45);
  color: white;
  font-size: 11px; font-weight: 500;
  backdrop-filter: blur(8px);
}

.dp-title {
  margin: 0;
  font-size: 18px; font-weight: 600;
  letter-spacing: -0.015em;
  line-height: 1.3;
}
.dp-text { margin: 0; font-size: 13px; color: var(--text-2); line-height: 1.6; }

.dp-tags { display: flex; gap: 6px; flex-wrap: wrap; }
.dp-tag {
  font-size: 11px;
  padding: 3px 8px;
  border-radius: 4px;
  background: var(--accent-bg);
  color: var(--accent);
}

.dp-metrics {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  padding: 10px 0;
  border-top: 1px solid var(--border-2);
  border-bottom: 1px solid var(--border-2);
}
.dp-metric { display: flex; flex-direction: column; gap: 2px; }
.dp-metric-label {
  display: inline-flex; align-items: center; gap: 5px;
  font-size: 11px; color: var(--muted);
}
.dp-metric-val { font-size: 16px; font-weight: 600; }

.dp-ai-head {
  display: flex; align-items: center; gap: 8px;
  margin-bottom: 10px;
}
.dp-ai-row {
  display: grid;
  grid-template-columns: 1fr 1fr 50px;
  align-items: center;
  gap: 12px;
}
.dp-prog {
  height: 6px;
  background: var(--panel-2);
  border-radius: 999px;
  overflow: hidden;
}
.dp-prog-fill { height: 100%; border-radius: 999px; }

.dp-foot {
  padding: 12px 18px;
  background: var(--panel-2);
  border-top: 1px solid var(--border);
  display: flex; align-items: center; gap: 8px;
}
</style>
