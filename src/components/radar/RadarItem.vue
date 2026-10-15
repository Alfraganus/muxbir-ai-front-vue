<template>
  <article class="ri" :class="{ open }">
    <button type="button" class="ri-head" :aria-expanded="open" @click="$emit('toggle')">
      <span class="ri-time">{{ formatTime(item.posted_at, offsetMin) }}</span>
      <span class="ri-body">
        <span class="ri-title">{{ item.title }}</span>
        <span class="ri-meta">
          <span v-if="item.category" class="ri-cat">{{ item.category.name }}</span>
          <span class="ri-srcs">
            <RadarPlatformIcon v-for="s in item.sources.slice(0, 3)" :key="s.name + s.platform" :slug="s.platform" :size="11"/>
            <span>{{ item.sources_count > 1 ? tt('radar.sourcesCount', { n: item.sources_count }) : item.sources[0]?.name }}</span>
          </span>
        </span>
      </span>
      <AppIcon name="Chevron" :size="15" class="ri-chev"/>
    </button>

    <div v-if="open" class="ri-panel">
      <div v-if="loading" class="ri-muted">{{ tt('radar.loadingContent') }}</div>
      <div v-else-if="detail?.error" class="ri-err">{{ detail.error }}</div>
      <template v-else-if="body">
        <p class="ri-content">{{ body.content || tt('radar.noContent') }}</p>
        <a v-if="body.truncated && primaryUrl" :href="primaryUrl" target="_blank" rel="noopener" class="ri-more">
          {{ tt('radar.readMore') }} <AppIcon name="Arrow" :size="12"/>
        </a>
      </template>
      <div v-if="item.links?.length" class="ri-sources">
        <span class="ri-sources-lbl">{{ tt('radar.sources') }}</span>
        <a v-for="(s, i) in item.links" :key="i" :href="s.url || undefined" target="_blank" rel="noopener" class="ri-src">
          <RadarPlatformIcon :slug="s.platform" :size="11"/>
          <span>{{ s.name }}</span>
          <span class="ri-src-time">{{ formatDateTime(s.posted_at, offsetMin) }}</span>
        </a>
      </div>
    </div>
  </article>
</template>

<script setup>
import { computed } from 'vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import RadarPlatformIcon from './RadarPlatformIcon.vue'
import { formatDateTime, formatTime } from '@/utils/date.js'
import { useAppStore } from '@/stores/app.js'

const props = defineProps({
  item: { type: Object, required: true },
  open: { type: Boolean, default: false },
  detail: { type: Object, default: null },
  loading: { type: Boolean, default: false },
  offsetMin: { type: Number, default: null },
})
defineEmits(['toggle'])

const store = useAppStore()
const t = computed(() => store.t)
function tt(key, params) { return t.value(key, params) }

// Matn ro'yxat bilan kelgan bo'lsa (hammasi ochiq rejimi) — o'shandan, aks holda lazy detail'dan
const body = computed(() => (props.item.content !== undefined ? props.item : props.detail))
const primaryUrl = computed(() => props.item.links?.[0]?.url || props.detail?.url || null)
</script>

<style scoped>
.ri { border-bottom: 1px solid var(--border-2); }
.ri:last-child { border-bottom: none; }
.ri-head {
  display: grid; grid-template-columns: 48px 1fr 18px; align-items: start; gap: 12px; width: 100%;
  padding: 12px 16px; border: none; background: transparent; text-align: left; cursor: pointer;
  font-family: inherit; color: inherit;
}
.ri-head:hover { background: var(--panel-2); }
.ri.open .ri-head { background: var(--panel-2); }
.ri-time { font-size: 12px; color: var(--muted); font-variant-numeric: tabular-nums; padding-top: 2px; }
.ri-body { display: flex; flex-direction: column; gap: 5px; min-width: 0; }
.ri-title { font-size: 14px; font-weight: 600; color: var(--text); line-height: 1.4; }
.ri-meta { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; font-size: 11.5px; color: var(--muted); }
.ri-cat { padding: 1px 8px; border-radius: var(--r-full); background: var(--accent-bg); color: var(--accent); font-weight: 500; }
.ri-srcs { display: inline-flex; align-items: center; gap: 4px; }
.ri-chev { color: var(--muted); margin-top: 3px; transition: transform .15s; }
.ri.open .ri-chev { transform: rotate(180deg); }
.ri-panel { padding: 4px 16px 16px 76px; display: flex; flex-direction: column; gap: 10px; }
.ri-content { margin: 0; font-size: 13.5px; line-height: 1.65; color: var(--text-2); white-space: pre-line; }
.ri-more { display: inline-flex; align-items: center; gap: 5px; font-size: 12.5px; color: var(--accent); text-decoration: none; font-weight: 500; }
.ri-sources { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; padding-top: 8px; border-top: 1px dashed var(--border); }
.ri-sources-lbl { font-size: 11.5px; color: var(--muted); margin-right: 2px; }
.ri-src {
  display: inline-flex; align-items: center; gap: 6px; padding: 3px 8px 3px 3px; border: 1px solid var(--border);
  border-radius: var(--r-full); font-size: 12px; color: var(--text); text-decoration: none; background: var(--panel);
}
.ri-src:hover { border-color: var(--accent); }
.ri-src-time { color: var(--muted); font-size: 11px; }
.ri-muted { font-size: 12.5px; color: var(--muted); }
.ri-err { font-size: 12.5px; color: var(--danger); }
@media (max-width: 640px) {
  .ri-head { grid-template-columns: 40px 1fr 16px; gap: 8px; padding: 12px; }
  .ri-panel { padding: 4px 12px 14px; }
  .ri-title { font-size: 13.5px; }
}
</style>
