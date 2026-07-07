<template>
  <div class="dc" :class="{ selected }">
    <!-- Media area -->
    <div class="dc-media" :class="{ 'dc-media-embed': !!post.embedUrl, 'dc-media-img': hasImg }"
      :style="post.embedUrl || hasImg ? {} : { background: `linear-gradient(135deg, ${source.color}, color-mix(in oklab, ${source.color} 60%, black))` }">
      <iframe v-if="post.embedUrl"
        :src="post.embedUrl"
        class="dc-embed"
        loading="lazy"
        scrolling="no"
        frameborder="0"
        referrerpolicy="no-referrer"/>
      <img v-else-if="hasImg"
        :src="post.imageUrl"
        class="dc-img"
        loading="lazy"
        referrerpolicy="no-referrer"
        @error="imgFailed = true"/>
      <template v-else>
        <div aria-hidden class="dc-stripes"/>
        <div aria-hidden class="dc-shade"/>
      </template>

      <span class="dc-media-chip">
        <AppIcon :name="mediaIcon" :size="10"/>
        {{ mediaLabel }}
      </span>

      <span class="dc-rank mono">#{{ rank }} {{ tt('discoverCard.top') }}</span>

      <!-- Score badge (0-100) — faqat telegram postlarida -->
      <div v-if="!isWeb" class="dc-score-wrap" :title="tt('discoverCard.engagementScoreTitle', { score: post.ai.total, raw: fmtScore(post.rawScore) })">
        <svg :width="42" :height="42" viewBox="0 0 42 42" style="position:absolute;inset:0;transform:rotate(-90deg);">
          <circle cx="21" cy="21" r="18" fill="none" stroke="rgba(0,0,0,0.08)" stroke-width="3"/>
          <circle cx="21" cy="21" r="18" fill="none" :stroke="toneColor" stroke-width="3"
            :stroke-dasharray="`${(post.ai.total / 100) * (2 * Math.PI * 18)} ${2 * Math.PI * 18}`"
            stroke-linecap="round"/>
        </svg>
        <div style="display:flex;flex-direction:column;align-items:center;line-height:1;">
          <span class="tabular" :style="{ fontSize: '13px', fontWeight: 700, color: toneColor }">{{ post.ai.total }}</span>
          <span style="font-size:7px;color:var(--muted);text-transform:uppercase;letter-spacing:0.1em;font-weight:600;">SCORE</span>
        </div>
      </div>

      <div class="dc-meta">
        <template v-if="!isWeb">
          <AppIcon name="Eye" :size="10"/>
          <span class="tabular">{{ fmtCompact(post.views) }}</span>
          <span v-if="post.dateLabel">·</span>
        </template>
        <!-- Haqiqiy e'lon sanasi-vaqti; aniqlanmagan bo'lsa umuman ko'rsatilmaydi -->
        <span v-if="post.dateLabel" class="tabular">{{ post.dateLabel }}</span>
        <span v-if="!isWeb && post.trend === 'up'" class="dc-trend">
          <AppIcon name="ArrowUp" :size="9"/> {{ tt('discoverCard.trending') }}
        </span>
      </div>
    </div>

    <!-- Body -->
    <div class="dc-body">
      <span class="dc-cat">{{ post.category }}</span>
      <h3 class="dc-title">{{ post.title }}</h3>
      <p class="dc-snippet">{{ post.snippet }}</p>

      <!-- Engagement stats — website maqolalarida share/like/reaction/score yo'q -->
      <div v-if="!isWeb" class="dc-stats" :title="tt('discoverCard.scoreFormulaTitle', { raw: fmtScore(post.rawScore) })">
        <div class="dc-stat" :title="tt('discoverCard.viewsTitle')">
          <AppIcon name="Eye" :size="11"/>
          <span class="tabular">{{ fmtCompact(post.views) }}</span>
        </div>
        <div class="dc-stat" :title="tt('discoverCard.sharesTitle')">
          <AppIcon name="Send" :size="11"/>
          <span class="tabular">{{ fmtCompact(post.shares) }}</span>
        </div>
        <div class="dc-stat" :title="tt('discoverCard.reactionsTitle')">
          <AppIcon name="Sparkle" :size="11"/>
          <span class="tabular">{{ fmtCompact(post.reactions) }}</span>
        </div>
        <div class="dc-stat dc-stat-score" :title="tt('discoverCard.engagementShortTitle', { raw: fmtScore(post.rawScore) })">
          <AppIcon name="Bolt" :size="11"/>
          <span class="tabular">{{ post.ai.total }}/100</span>
        </div>
      </div>

      <!-- AI bars — website maqolalarida ko'rsatilmaydi -->
      <div v-if="!isWeb" class="dc-ai">
        <div class="dc-ai-head">
          <AppIcon name="Sparkle" :size="11" :style="{ color: 'var(--accent)' }"/>
          <span>{{ tt('discoverCard.aiAnalysis') }} · {{ post.ai.total }}/100</span>
        </div>
        <div class="dc-ai-bars">
          <div v-for="m in metrics" :key="m.k" :title="`${m.l}: ${post.ai[m.k]}/100`" class="dc-ai-bar">
            <div class="dc-ai-track">
              <div class="dc-ai-fill" :style="{ width: post.ai[m.k] + '%', background: barColor(post.ai[m.k]) }"/>
            </div>
            <span>{{ m.l }}</span>
          </div>
        </div>
      </div>

      <!-- Footer actions -->
      <div class="dc-foot">
        <!-- Ko'rish — telegram postlarda ilova ichidagi preview -->
        <button v-if="!isWeb" class="dc-ghost" @click.stop="$emit('preview')">
          <AppIcon name="Eye" :size="11"/>
          {{ tt('discoverCard.view') }}
        </button>
        <!-- Manbadan o'qish — asl manbani (t.me post / maqola) yangi oynada ochadi -->
        <a v-if="sourceUrl" class="dc-ghost" :href="sourceUrl" target="_blank" rel="noopener" @click.stop>
          <AppIcon name="Globe" :size="11"/>
          {{ tt('dvsel.readSource') }}
        </a>
        <div style="flex:1"/>
        <button class="dc-select" :class="{ on: selected }" @click.stop="$emit('toggle')">
          <AppIcon :name="selected ? 'Check' : 'Plus'" :size="11"/>
          {{ selected ? tt('discoverCard.selected') : tt('discoverCard.select') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import { useAppStore } from '@/stores/app.js'

const store = useAppStore()
const t = computed(() => store.t)
function tt(key, params) { return t.value(key, params) }

const props = defineProps({
  post: { type: Object, required: true },
  source: { type: Object, required: true },
  rank: { type: Number, required: true },
  selected: { type: Boolean, default: false },
})
defineEmits(['toggle', 'preview'])

const imgFailed = ref(false)
const isWeb = computed(() => !!props.post.isWebsite)
// "Manbadan o'qish" havolasi: website uchun maqola URL, telegram uchun t.me post URL.
const sourceUrl = computed(() => isWeb.value ? (props.post.articleUrl || null) : (props.post.tmePostUrl || null))
// Website rasmi bor va yuklanmay qolmagan bo'lsa — <img> ko'rsatamiz.
const hasImg = computed(() => isWeb.value && !!props.post.imageUrl && !imgFailed.value)

const metrics = computed(() => [
  { k: 'relevance', l: tt('discoverCard.metricRelevance') },
  { k: 'virality',  l: tt('discoverCard.metricVirality') },
  { k: 'freshness', l: tt('discoverCard.metricFreshness') },
  { k: 'audience',  l: tt('discoverCard.metricAudience') },
])

const toneColor = computed(() => {
  const v = props.post.ai.total
  if (v >= 85) return 'var(--success)'
  if (v >= 70) return 'var(--accent)'
  return '#F59E0B'
})

const mediaIcon = computed(() => isWeb.value ? 'Globe' : props.post.media === 'video' ? 'Eye' : props.post.media === 'chart' ? 'Chart' : 'Layers')
const mediaLabel = computed(() => isWeb.value ? tt('discoverCard.article') : props.post.media === 'video' ? tt('discoverCard.video') : props.post.media === 'chart' ? tt('discoverCard.chart') : tt('discoverCard.image'))

function fmtCompact(n) {
  if (n === null || n === undefined) return '0'
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M'
  if (n >= 1_000)     return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'K'
  return String(n)
}
function fmtScore(n) {
  const v = Number(n) || 0
  if (v >= 10_000) return (v / 1000).toFixed(1).replace(/\.0$/, '') + 'K'
  return v.toFixed(v < 10 ? 2 : v < 100 ? 1 : 0)
}
function barColor(v) {
  if (v >= 85) return 'var(--success)'
  if (v >= 70) return 'var(--accent)'
  return '#F59E0B'
}
</script>

<style scoped>
.dc {
  background: var(--panel);
  border: 1.5px solid var(--border);
  border-radius: 12px;
  display: flex; flex-direction: column;
  overflow: hidden;
  position: relative;
  transition: all 0.15s;
  box-shadow: var(--shadow-sm);
}
.dc.selected {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-bg);
}
.dc:hover:not(.selected) {
  border-color: color-mix(in oklab, var(--accent) 25%, var(--border));
  transform: translateY(-1px);
  box-shadow: 0 8px 18px -10px rgba(15,23,42,0.18);
}

.dc-media {
  position: relative;
  height: 132px;
  overflow: hidden;
}
.dc-media.dc-media-embed {
  height: 320px;
  background: var(--panel-2);
}
.dc-media.dc-media-img {
  height: 170px;
  background: var(--panel-2);
}
.dc-embed {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  border: 0;
  display: block;
}
.dc-img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.dc-stripes {
  position: absolute; inset: 0;
  background-image: repeating-linear-gradient(45deg, rgba(255,255,255,0.06) 0 8px, transparent 8px 16px);
  pointer-events: none;
}
.dc-shade {
  position: absolute; inset: 0;
  background: linear-gradient(180deg, transparent 40%, rgba(0,0,0,0.45) 100%);
  pointer-events: none;
}
.dc-media-chip {
  position: absolute;
  top: 10px; left: 10px;
  padding: 3px 8px;
  border-radius: 999px;
  background: rgba(0,0,0,0.45);
  color: white;
  font-size: 10.5px; font-weight: 500;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: inline-flex; align-items: center; gap: 5px;
}
.dc-rank {
  position: absolute;
  top: 10px; right: 56px;
  padding: 3px 7px;
  border-radius: 6px;
  background: rgba(0,0,0,0.45);
  color: white;
  font-size: 10.5px; font-weight: 600;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}
.dc-score-wrap {
  position: absolute;
  top: 10px; right: 10px;
  width: 42px; height: 42px;
  background: rgba(255,255,255,0.95);
  border-radius: 999px;
  display: inline-flex; align-items: center; justify-content: center;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
}
.dc-meta {
  position: absolute;
  left: 10px; right: 10px; bottom: 8px;
  display: flex; align-items: center; gap: 6px;
  font-size: 10.5px;
  color: rgba(255,255,255,0.9);
}
.dc-trend {
  margin-left: auto;
  display: inline-flex; align-items: center; gap: 3px;
  font-weight: 500;
  color: #a7f3d0;
}

.dc-body {
  padding: 12px 14px;
  display: flex; flex-direction: column;
  gap: 8px;
  flex: 1;
}
.dc-cat {
  display: inline-flex; align-items: center; gap: 5px;
  height: 18px; padding: 0 7px;
  border-radius: 999px;
  background: var(--panel-2);
  color: var(--muted);
  border: 1px solid var(--border-2);
  font-size: 10px; font-weight: 600;
  width: fit-content;
}
.dc-title {
  margin: 0;
  font-size: 13.5px; font-weight: 600;
  letter-spacing: -0.01em;
  line-height: 1.35;
  text-wrap: balance;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.dc-snippet {
  margin: 0;
  font-size: 11.5px;
  color: var(--text-2);
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.dc-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
  padding: 6px 0;
}
.dc-stat {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  height: 26px;
  padding: 0 6px;
  border-radius: 6px;
  background: var(--panel-2);
  border: 1px solid var(--border-2);
  font-size: 11px;
  font-weight: 600;
  color: var(--text-2);
  cursor: help;
}
.dc-stat-score {
  background: color-mix(in oklab, var(--accent) 10%, var(--panel-2));
  border-color: color-mix(in oklab, var(--accent) 25%, var(--border-2));
  color: var(--accent);
}

.dc-ai {
  margin-top: auto;
  padding: 8px 10px;
  background: var(--panel-2);
  border: 1px solid var(--border-2);
  border-radius: 8px;
  display: flex; flex-direction: column; gap: 5px;
}
.dc-ai-head {
  display: flex; align-items: center; gap: 6px;
  font-size: 10.5px; font-weight: 500;
  color: var(--text-2);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.dc-ai-bars {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 4px;
}
.dc-ai-bar { display: flex; flex-direction: column; gap: 3px; }
.dc-ai-track {
  height: 3px;
  background: var(--border-2);
  border-radius: 999px;
  overflow: hidden;
}
.dc-ai-fill { height: 100%; border-radius: 999px; }
.dc-ai-bar > span { font-size: 9.5px; color: var(--muted); }

.dc-foot {
  display: flex; align-items: center; gap: 6px;
  margin-top: auto;
}
.dc-foot a.dc-ghost { text-decoration: none; }
.dc-ghost {
  height: 28px; padding: 0 10px;
  display: inline-flex; align-items: center; gap: 5px;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 6px;
  color: var(--muted);
  font-size: 11.5px; font-weight: 500;
  cursor: pointer;
  font-family: inherit;
}
.dc-ghost:hover { background: var(--panel-2); color: var(--text-2); border-color: var(--border); }

.dc-select {
  height: 28px; padding: 0 10px;
  display: inline-flex; align-items: center; gap: 5px;
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: 6px;
  color: var(--text);
  font-size: 11.5px; font-weight: 500;
  cursor: pointer;
  font-family: inherit;
  box-shadow: var(--shadow-sm);
}
.dc-select.on {
  background: var(--accent);
  color: white;
  border-color: var(--accent);
  box-shadow: none;
}
.dc-select:hover:not(.on) {
  border-color: var(--accent);
  color: var(--accent);
}
</style>
