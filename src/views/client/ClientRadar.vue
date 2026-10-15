<template>
  <div class="crd">
    <PageHeader :title="tt('radar.title')" :subtitle="subtitle">
      <template #right>
        <AppButton variant="secondary" size="md" :loading="feed.loading.value" @click="feed.load">
          <template #icon><AppIcon name="Sort" :size="13"/></template>
          {{ tt('radar.refresh') }}
        </AppButton>
      </template>
    </PageHeader>

    <div class="crd-bar">
      <RadarToolbar v-model:date="feed.filters.date" v-model:q="feed.filters.q" :today="today" class="crd-toolbar"/>
      <RadarSourceFilter v-model="feed.filters.source_ids" :sources="feed.sources.value"/>
    </div>
    <div class="crd-bar">
      <RadarCategoryTabs v-model="feed.filters.category_id" :categories="feed.categories.value" class="crd-tabs"/>
      <label class="crd-expand">
        <input v-model="feed.expandAll.value" type="checkbox"/>
        {{ tt('radar.expandAll') }}
      </label>
    </div>

    <AppPanel :padding="0">
      <div v-if="feed.error.value" class="crd-error"><AppIcon name="Close" :size="12"/> {{ feed.error.value }}</div>
      <div v-else-if="feed.loading.value && !feed.items.value.length" class="crd-empty">{{ tt('radar.loading') }}</div>
      <div v-else-if="!feed.items.value.length" class="crd-empty">
        <AppIcon name="Radar" :size="32" style="color:var(--muted-2)"/>
        <div class="crd-empty-title">{{ tt('radar.emptyTitle') }}</div>
        <div>{{ tt('radar.emptyText') }}</div>
      </div>
      <template v-else>
        <section v-for="group in days" :key="group.day">
          <div class="crd-day">
            <span>{{ dayLabel(group.day, store.companyOffsetMin, tt) }}</span>
            <span class="crd-day-n">{{ group.items.length }}</span>
          </div>
          <RadarItem
            v-for="item in group.items" :key="item.id" :item="item"
            :open="isOpen(item.id)" :detail="feed.details[item.id]" :loading="!!feed.detailLoading[item.id]"
            :offset-min="store.companyOffsetMin" @toggle="toggle(item.id)"
          />
        </section>
      </template>
      <AppPagination :page="feed.pager.page.value" :total-pages="feed.pager.totalPages.value" :total="feed.total.value"
                     :range-start="feed.pager.rangeStart.value" :range-end="feed.pager.rangeEnd.value" @change="changePage"/>
    </AppPanel>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import PageHeader from '@/components/layout/PageHeader.vue'
import AppPanel from '@/components/ui/AppPanel.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import AppPagination from '@/components/ui/AppPagination.vue'
import RadarToolbar from '@/components/radar/RadarToolbar.vue'
import RadarCategoryTabs from '@/components/radar/RadarCategoryTabs.vue'
import RadarItem from '@/components/radar/RadarItem.vue'
import RadarSourceFilter from '@/components/radar/RadarSourceFilter.vue'
import { useRadarFeed } from '@/composables/useRadarFeed.js'
import { dayLabel, formatDateTime, groupByWallDay, todayWallDate } from '@/utils/date.js'
import { useAppStore } from '@/stores/app.js'

const store = useAppStore()
const t = computed(() => store.t)
function tt(key, params) { return t.value(key, params) }

const feed = useRadarFeed(computed(() => store.companyId), () => tt('radar.loadError'))
// Qo'lda ochilgan/yopilgan elementlar: "hammasi ochiq" rejimida — yopilganlar, aks holda — ochilganlar
const toggled = ref(new Set())
const today = computed(() => todayWallDate(store.companyOffsetMin))
// Lenta yangidan eskiga keladi — kun sarlavhalari bilan bo'linadi (faqat soat ko'rsatilgani uchun)
const days = computed(() => groupByWallDay(feed.items.value, store.companyOffsetMin))

const subtitle = computed(() => {
  const w = feed.period.value
  if (!w) return tt('radar.subtitle')
  const range = `${formatDateTime(w.from, store.companyOffsetMin)} — ${formatDateTime(w.to, store.companyOffsetMin)}`
  return tt('radar.subtitleWindow', { range, n: feed.total.value })
})

function isOpen(id) {
  return feed.expandAll.value !== toggled.value.has(id)
}

function toggle(id) {
  const next = new Set(toggled.value)
  next.has(id) ? next.delete(id) : next.add(id)
  toggled.value = next
  const item = feed.items.value.find((i) => i.id === id)
  if (isOpen(id) && item?.content === undefined) feed.loadDetail(id)
}

function changePage(n) {
  toggled.value = new Set()
  feed.goTo(n)
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

onMounted(feed.load)
watch(feed.expandAll, () => { toggled.value = new Set() })
// Kategoriya nomlari backend'da Accept-Language bo'yicha tarjima qilinadi — til o'zgarsa qayta yuklaymiz
watch(() => store.lang, feed.load)
</script>

<style scoped>
.crd { padding: 20px 24px 40px; display: flex; flex-direction: column; gap: 14px; }
.crd-empty { padding: 56px 16px; text-align: center; color: var(--muted); font-size: 13px; display: flex; flex-direction: column; align-items: center; gap: 8px; }
.crd-empty-title { font-size: 14px; font-weight: 600; color: var(--text); }
.crd-day {
  position: sticky; top: 0; z-index: 2; display: flex; align-items: center; gap: 8px;
  padding: 8px 16px; background: var(--panel-2); border-bottom: 1px solid var(--border-2);
  font-size: 12px; font-weight: 600; color: var(--text-2); text-transform: capitalize;
}
.crd-day-n { font-weight: 500; color: var(--muted); font-variant-numeric: tabular-nums; }
.crd-bar { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.crd-toolbar { flex: 1 1 520px; }
.crd-tabs { flex: 1 1 auto; min-width: 0; }
.crd-expand { display: inline-flex; align-items: center; gap: 7px; font-size: 12.5px; color: var(--text-2); cursor: pointer; white-space: nowrap; user-select: none; }
.crd-expand input { width: 15px; height: 15px; accent-color: var(--accent); cursor: pointer; }
.crd-error { padding: 14px 16px; background: var(--danger-bg); color: var(--danger); font-size: 13px; }
@media (max-width: 640px) {
  .crd { padding: 14px 12px 32px; }
}
</style>
