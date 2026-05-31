<template>
  <div class="iph-stage">
    <!-- iPhone 16 frame -->
    <div class="iph">
      <!-- Side buttons -->
      <span class="iph-side iph-side-power"/>
      <span class="iph-side iph-side-vol-up"/>
      <span class="iph-side iph-side-vol-dn"/>
      <span class="iph-side iph-side-action"/>

      <!-- Inner screen -->
      <div class="iph-screen">
        <!-- Dynamic Island -->
        <div class="iph-island">
          <span class="iph-island-cam"/>
        </div>

        <!-- Telegram chat content -->
        <div class="tg-frame">
          <!-- iOS status row inside Telegram -->
          <div class="tg-status">
            <span class="tg-status-time">9:41</span>
            <div class="tg-status-right">
              <svg width="16" height="11" viewBox="0 0 16 11" fill="currentColor"><path d="M1 9h2v2H1zM5 7h2v4H5zM9 4h2v7H9zM13 1h2v10h-2z"/></svg>
              <svg width="14" height="10" viewBox="0 0 14 10" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M0 5a7 7 0 0 1 14 0M2 7a4 4 0 0 1 10 0M5 9a1.5 1.5 0 0 1 4 0"/></svg>
              <span class="tg-status-batt"><span/></span>
            </div>
          </div>

          <!-- Channel header -->
          <div class="tg-head">
            <button class="tg-back">‹</button>
            <div class="tg-head-info">
              <div class="tg-head-name">{{ channelName }}</div>
              <div class="tg-head-sub">{{ subscribersLabel }}</div>
            </div>
            <div class="tg-channel-avatar" :style="{ background: channelColor }">{{ channelInitial }}</div>
          </div>

          <!-- Chat body -->
          <div class="tg-body">
            <div class="tg-date-chip">Bugun</div>

            <div class="tg-bubble">
              <!-- 1) Cover (asosiy rasm) — tepada katta -->
              <div v-if="coverUrl" class="tg-photo single" :style="{ backgroundImage: `url(${coverUrl})` }"/>

              <!-- 2) Gallery — cover ostida kichik grid -->
              <div v-if="galleryPhotos.length" class="tg-album" :class="albumClass">
                <div v-for="(ph, i) in galleryPhotos.slice(0, 4)" :key="`${ph}-${i}`"
                  class="tg-album-item" :style="{ backgroundImage: `url(${ph})` }">
                  <span v-if="i === 3 && galleryPhotos.length > 4" class="tg-album-more">+{{ galleryPhotos.length - 4 }}</span>
                </div>
              </div>

              <!-- 3) Text content — media ostida (caption) -->
              <div v-if="renderedHtml" class="tg-text" v-html="renderedHtml"/>

              <!-- Bubble footer -->
              <div class="tg-bubble-foot">
                <span class="tg-views">
                  <svg width="14" height="10" viewBox="0 0 24 16" fill="currentColor"><path d="M12 0C7 0 2.7 3 1 8c1.7 5 6 8 11 8s9.3-3 11-8c-1.7-5-6-8-11-8zm0 13a5 5 0 1 1 0-10 5 5 0 0 1 0 10zm0-8a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"/></svg>
                  {{ fakeViews }}
                </span>
                <span class="tg-time">{{ nowLabel }}</span>
              </div>
            </div>
          </div>

          <!-- Input bar (visual only) -->
          <div class="tg-input">
            <span class="tg-input-emoji">😀</span>
            <span class="tg-input-paper">Xabar...</span>
            <span class="tg-input-mic">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10a7 7 0 0 0 14 0M12 19v3"/></svg>
            </span>
          </div>

          <!-- Home indicator -->
          <div class="iph-home-indicator"/>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { buildTelegramHtml, telegramHtmlToBrowserHtml } from '@/utils/contentHtml.js'

const props = defineProps({
  channelName: { type: String, default: 'Mening kanalim' },
  subscriberCount: { type: Number, default: null },
  title: { type: String, default: '' },
  shortDescription: { type: String, default: '' },
  contentJson: { type: [Object, String], default: () => ({ html: '' }) },
  coverUrl: { type: String, default: '' },
  gallery: { type: Array, default: () => [] },
  tags: { type: Array, default: () => [] },
})

function formatCount(n) {
  if (n == null || !Number.isFinite(n)) return ''
  if (n < 1000) return String(n)
  if (n < 10_000) return (n / 1000).toFixed(1).replace(/\.0$/, '') + 'K'
  if (n < 1_000_000) return Math.round(n / 1000) + 'K'
  return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M'
}
const subscribersLabel = computed(() => {
  const n = props.subscriberCount
  if (n == null) return 'channel'
  return `channel · ${formatCount(n)} subscribers`
})

const galleryPhotos = computed(() => (props.gallery || []).filter(Boolean).slice(0, 10))
const albumClass = computed(() => {
  const n = Math.min(galleryPhotos.value.length, 4)
  return n === 1 ? 'count-1' : n === 2 ? 'count-2' : n === 3 ? 'count-3' : 'count-4'
})
const hasMedia = computed(() => !!props.coverUrl || galleryPhotos.value.length > 0)

const renderedHtml = computed(() => {
  const html = buildTelegramHtml({
    title: props.title,
    short_description: props.shortDescription,
    content_json: props.contentJson,
    tags: props.tags,
  })
  return telegramHtmlToBrowserHtml(html)
})

const channelInitial = computed(() => (props.channelName || 'K').replace(/^@/, '').charAt(0).toUpperCase())
const channelColor = computed(() => {
  const colors = ['#2AABEE', '#E1306C', '#10B981', '#F59E0B', '#8B5CF6', '#F97316']
  const name = props.channelName || 'x'
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) | 0
  return colors[Math.abs(h) % colors.length]
})

const fakeViews = computed(() => {
  return (hasMedia.value || props.title) ? '1.2K' : '0'
})

const nowLabel = computed(() => {
  const d = new Date()
  const pad = n => String(n).padStart(2, '0')
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
})
</script>

<style scoped>
/* ─────────────────── Stage / centering ─────────────────── */
.iph-stage {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 8px 0;
}

/* ─────────────────── iPhone 16 frame ─────────────────── */
.iph {
  position: relative;
  width: 320px;
  height: 660px;
  border-radius: 52px;
  /* Titanium frame look */
  background:
    linear-gradient(135deg, #f5f5f7 0%, #e0e0e3 30%, #b8b8bc 60%, #8a8a90 100%);
  padding: 11px;
  box-shadow:
    /* Outer ambient */
    0 50px 90px -30px rgba(15, 23, 42, 0.45),
    0 30px 50px -20px rgba(15, 23, 42, 0.25),
    /* Side metal highlight */
    inset 0 0 0 1px rgba(255, 255, 255, 0.45),
    inset 0 1px 0 rgba(255, 255, 255, 0.6),
    inset 0 -1px 0 rgba(0, 0, 0, 0.18);
}
[data-theme="dark"] .iph {
  background: linear-gradient(135deg, #3a3a3d 0%, #2a2a2d 30%, #1c1c1e 60%, #0f0f10 100%);
  box-shadow:
    0 50px 90px -30px rgba(0,0,0,0.7),
    0 30px 50px -20px rgba(0,0,0,0.5),
    inset 0 0 0 1px rgba(255,255,255,0.06),
    inset 0 1px 0 rgba(255,255,255,0.12),
    inset 0 -1px 0 rgba(0,0,0,0.5);
}

/* Side hardware buttons */
.iph-side {
  position: absolute;
  background: linear-gradient(180deg, rgba(0,0,0,0.18), rgba(0,0,0,0.05));
  border-radius: 2px 0 0 2px;
}
.iph-side-power {
  right: -2px; top: 165px;
  width: 4px; height: 80px;
  border-radius: 0 2px 2px 0;
}
.iph-side-vol-up {
  left: -2px; top: 140px;
  width: 4px; height: 44px;
}
.iph-side-vol-dn {
  left: -2px; top: 200px;
  width: 4px; height: 44px;
}
.iph-side-action {
  left: -2px; top: 100px;
  width: 4px; height: 28px;
  background: linear-gradient(180deg, #d97706, #b45309);
}
[data-theme="dark"] .iph-side-power,
[data-theme="dark"] .iph-side-vol-up,
[data-theme="dark"] .iph-side-vol-dn {
  background: linear-gradient(180deg, rgba(255,255,255,0.1), rgba(0,0,0,0.4));
}

/* Inner screen */
.iph-screen {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: 42px;
  overflow: hidden;
  background: #fff;
  box-shadow: inset 0 0 0 1px rgba(0,0,0,0.06);
}
[data-theme="dark"] .iph-screen {
  background: #000;
  box-shadow: inset 0 0 0 1px rgba(255,255,255,0.04);
}

/* Dynamic Island */
.iph-island {
  position: absolute;
  top: 9px;
  left: 50%;
  transform: translateX(-50%);
  width: 110px;
  height: 32px;
  background: #000;
  border-radius: 999px;
  z-index: 30;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 8px;
}
.iph-island-cam {
  width: 8px; height: 8px;
  border-radius: 999px;
  background: radial-gradient(circle, #1c1c1e 35%, #2a2a2d 80%);
  box-shadow: inset 0 0 0 1px rgba(255,255,255,0.06);
}

/* Home indicator */
.iph-home-indicator {
  position: absolute;
  bottom: 8px;
  left: 50%;
  transform: translateX(-50%);
  width: 110px;
  height: 4px;
  border-radius: 999px;
  background: rgba(0,0,0,0.85);
  z-index: 30;
}
[data-theme="dark"] .iph-home-indicator { background: rgba(255,255,255,0.5); }

/* ─────────────────── Telegram inside screen ─────────────────── */
.tg-frame {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #ffffff;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", sans-serif;
}
[data-theme="dark"] .tg-frame { background: #0e1621; }

/* iOS status bar */
.tg-status {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 28px 6px;
  color: #000;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: -0.01em;
  position: relative;
  z-index: 10;
  background: white;
}
[data-theme="dark"] .tg-status { color: white; background: #17212b; }
.tg-status-time { margin-left: 4px; }
.tg-status-right {
  display: flex;
  align-items: center;
  gap: 5px;
}
.tg-status-batt {
  width: 22px; height: 11px;
  border: 1px solid currentColor;
  border-radius: 2px;
  padding: 1px;
  position: relative;
  opacity: 0.85;
}
.tg-status-batt::after {
  content: '';
  position: absolute;
  right: -3px; top: 3px;
  width: 1.5px; height: 3px;
  background: currentColor;
  border-radius: 0 1px 1px 0;
}
.tg-status-batt span {
  display: block;
  width: 75%;
  height: 100%;
  background: currentColor;
  border-radius: 1px;
}

/* Channel header — white bar with subtle shadow (Telegram'ning real ko'rinishi) */
.tg-head {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 14px 10px;
  color: #000;
  background: white;
  border-bottom: 1px solid rgba(0,0,0,0.06);
  position: relative;
  z-index: 10;
}
[data-theme="dark"] .tg-head {
  background: #17212b;
  color: white;
  border-bottom-color: rgba(255,255,255,0.05);
}
.tg-back {
  background: transparent;
  border: none;
  color: #2AABEE;
  font-size: 28px;
  line-height: 0.8;
  font-weight: 300;
  cursor: default;
  padding: 0;
  margin-right: 2px;
}
.tg-head-info { flex: 1; min-width: 0; }
.tg-head-name {
  font-size: 15.5px;
  font-weight: 600;
  letter-spacing: -0.01em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: inherit;
}
.tg-head-sub {
  font-size: 12px;
  color: rgba(0,0,0,0.55);
  margin-top: 1px;
}
[data-theme="dark"] .tg-head-sub { color: rgba(255,255,255,0.55); }
.tg-channel-avatar {
  width: 38px; height: 38px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 700;
  font-size: 17px;
  flex-shrink: 0;
}

/* Chat body — Telegram'ning klassik yashil doodle wallpaperi */
.tg-body {
  flex: 1 1 0;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
  padding: 10px 8px 14px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  /* Base green from real screenshot */
  background-color: #cfe2c4;
  /* Doodle SVG pattern (light) — inline svg, opacity bilan */
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220' viewBox='0 0 220 220' fill='none' stroke='%23a8c79a' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round' opacity='0.55'><path d='M20 30c0-6 5-11 11-11s11 5 11 11c0-6 5-11 11-11s11 5 11 11c0 12-22 24-22 24S20 42 20 30z'/><circle cx='90' cy='38' r='10'/><path d='M82 38l5 5 9-10'/><path d='M150 25l8 14 14 2-10 10 2 14-14-8-14 8 2-14-10-10 14-2z'/><path d='M180 70c4-6 12-6 16 0s4 12 0 16-12 4-16 0-4-10 0-16z'/><path d='M40 80l5 10 10 1-7 7 2 10-10-5-10 5 2-10-7-7 10-1z'/><path d='M105 90c6-3 13 1 14 8s-4 13-11 13-12-6-11-13c0-3 4-6 8-8z'/><circle cx='180' cy='130' r='10'/><path d='M170 130h20M180 120v20'/><path d='M30 150c0-8 6-14 14-14s14 6 14 14-6 14-14 14-14-6-14-14zM44 140v8M40 144h8'/><path d='M88 158l-3 8h6z'/><path d='M85 166c-3 4 0 8 4 8h4c4 0 7-4 4-8'/><path d='M130 165l8-2 8 6-2 9-9 2-7-7z'/><path d='M68 195c0-4 4-8 8-8s8 4 8 8-4 8-8 8-8-4-8-8z'/><path d='M150 195c-4 0-8 4-8 8s4 8 8 8h12c4 0 8-4 8-8s-4-8-8-8z'/></svg>");
  background-size: 200px 200px;
  background-repeat: repeat;
}
[data-theme="dark"] .tg-body {
  background-color: #0e1621;
  background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220' viewBox='0 0 220 220' fill='none' stroke='%23223247' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round' opacity='0.7'><path d='M20 30c0-6 5-11 11-11s11 5 11 11c0-6 5-11 11-11s11 5 11 11c0 12-22 24-22 24S20 42 20 30z'/><circle cx='90' cy='38' r='10'/><path d='M82 38l5 5 9-10'/><path d='M150 25l8 14 14 2-10 10 2 14-14-8-14 8 2-14-10-10 14-2z'/><path d='M180 70c4-6 12-6 16 0s4 12 0 16-12 4-16 0-4-10 0-16z'/><path d='M40 80l5 10 10 1-7 7 2 10-10-5-10 5 2-10-7-7 10-1z'/><path d='M105 90c6-3 13 1 14 8s-4 13-11 13-12-6-11-13c0-3 4-6 8-8z'/><circle cx='180' cy='130' r='10'/><path d='M170 130h20M180 120v20'/><path d='M30 150c0-8 6-14 14-14s14 6 14 14-6 14-14 14-14-6-14-14zM44 140v8M40 144h8'/><path d='M88 158l-3 8h6z'/><path d='M85 166c-3 4 0 8 4 8h4c4 0 7-4 4-8'/><path d='M130 165l8-2 8 6-2 9-9 2-7-7z'/><path d='M68 195c0-4 4-8 8-8s8 4 8 8-4 8-8 8-8-4-8-8z'/><path d='M150 195c-4 0-8 4-8 8s4 8 8 8h12c4 0 8-4 8-8s-4-8-8-8z'/></svg>");
}
.tg-body::-webkit-scrollbar { width: 4px; }
.tg-body::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.18); border-radius: 999px; }
[data-theme="dark"] .tg-body::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.2); }

.tg-date-chip {
  flex-shrink: 0;
  align-self: center;
  background: rgba(255,255,255,0.7);
  color: #1f2937;
  font-size: 11px;
  font-weight: 500;
  padding: 3px 11px;
  border-radius: 999px;
  backdrop-filter: blur(6px);
  margin-bottom: 4px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.08);
}
[data-theme="dark"] .tg-date-chip {
  background: rgba(15,28,45,0.7);
  color: rgba(255,255,255,0.85);
}

/* Message bubble — kanal posti (incoming) oq fonda, real Telegram shaklida */
.tg-bubble {
  flex-shrink: 0;
  align-self: flex-start;
  max-width: 100%;
  width: 100%;
  background: white;
  border-radius: 12px 12px 12px 6px;
  overflow: hidden;
  box-shadow: 0 1px 2px rgba(0,0,0,0.12), 0 0 1px rgba(0,0,0,0.04);
  position: relative;
}
[data-theme="dark"] .tg-bubble {
  background: #182533;
  color: #e6eaef;
  box-shadow: 0 1px 2px rgba(0,0,0,0.35);
}

.tg-photo.single {
  width: 100%;
  aspect-ratio: 4/3;
  background-size: cover;
  background-position: center;
  background-color: rgba(15,23,42,0.05);
}

.tg-album {
  display: grid;
  gap: 2px;
  margin: 6px 8px 4px;
  border-radius: 8px;
  overflow: hidden;
}
.tg-album.count-1 { grid-template-columns: 1fr; }
.tg-album.count-2 { grid-template-columns: 1fr 1fr; }
.tg-album.count-3 { grid-template-columns: 1fr 1fr 1fr; }
.tg-album.count-4 { grid-template-columns: 1fr 1fr; }
.tg-album-item {
  aspect-ratio: 1;
  background-size: cover;
  background-position: center;
  background-color: rgba(15,23,42,0.05);
  position: relative;
}
.tg-album.count-1 .tg-album-item { aspect-ratio: 4/3; }
.tg-album-more {
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,0.5);
  color: white;
  font-size: 22px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(2px);
}

.tg-text {
  padding: 8px 10px 4px;
  font-size: 13.5px;
  line-height: 1.4;
  color: #0f172a;
  word-wrap: break-word;
}
[data-theme="dark"] .tg-text { color: #e6eaef; }
.tg-text :deep(b) { font-weight: 700; }
.tg-text :deep(i) { font-style: italic; color: #64748b; }
[data-theme="dark"] .tg-text :deep(i) { color: #94a3b8; }
.tg-text :deep(a) { color: #2AABEE; text-decoration: none; }
.tg-text :deep(code) {
  background: #f1f5f9;
  padding: 1px 5px;
  border-radius: 3px;
  font-family: ui-monospace, monospace;
  font-size: 11.5px;
}
[data-theme="dark"] .tg-text :deep(code) { background: #243340; }
.tg-text :deep(pre) {
  background: #f1f5f9;
  padding: 8px 10px;
  border-radius: 6px;
  font-family: ui-monospace, monospace;
  font-size: 11.5px;
  white-space: pre-wrap;
  margin: 6px 0;
}
[data-theme="dark"] .tg-text :deep(pre) { background: #243340; }
.tg-text :deep(blockquote) {
  border-left: 3px solid #2AABEE;
  padding: 2px 0 2px 10px;
  margin: 6px 0;
  color: #475569;
}
[data-theme="dark"] .tg-text :deep(blockquote) { color: #94a3b8; }

.tg-bubble-foot {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 6px;
  padding: 4px 10px 6px;
  font-size: 11px;
  color: #94a3b8;
}
.tg-views {
  display: inline-flex;
  align-items: center;
  gap: 3px;
}
.tg-views svg { opacity: 0.75; }

/* Input bar — Telegram'ning real input qatori */
.tg-input {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px 22px;
  background: white;
  border-top: 1px solid rgba(0,0,0,0.06);
}
[data-theme="dark"] .tg-input {
  background: #17212b;
  border-top-color: rgba(255,255,255,0.05);
}
.tg-input-emoji {
  font-size: 22px;
  line-height: 1;
  color: #9ca3af;
}
.tg-input-paper {
  flex: 1;
  background: #f3f4f6;
  border: none;
  border-radius: 20px;
  padding: 9px 14px;
  color: #6b7280;
  font-size: 13px;
}
[data-theme="dark"] .tg-input-paper {
  background: #232e3c;
  color: #6b7d92;
}
.tg-input-mic {
  width: 36px; height: 36px;
  border-radius: 999px;
  background: #2AABEE;
  color: white;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 2px 6px rgba(42,171,238,0.35);
}
</style>
