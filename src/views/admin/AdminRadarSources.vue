<template>
  <div class="ars">
    <PageHeader :title="tt('adminRadar.title')" :subtitle="tt('adminRadar.subtitle')">
      <template #right>
        <AppButton variant="secondary" size="md" :loading="loading" @click="load">
          <template #icon><AppIcon name="Sort" :size="13"/></template>
          {{ tt('adminRadar.refresh') }}
        </AppButton>
        <AppButton variant="secondary" size="md" @click="bulkOpen = true">
          <template #icon><AppIcon name="List" :size="13"/></template>
          {{ tt('adminRadar.bulkAdd') }}
        </AppButton>
        <AppButton variant="primary" size="md" @click="openForm(null)">
          <template #icon><AppIcon name="Plus" :size="13"/></template>
          {{ tt('adminRadar.add') }}
        </AppButton>
      </template>
    </PageHeader>

    <div class="ars-filters">
      <AppInput v-model="filters.q" :placeholder="tt('adminRadar.search')" class="ars-search">
        <template #icon><AppIcon name="Search" :size="13" style="color:var(--muted)"/></template>
      </AppInput>
      <AppSelect v-model="filters.platform" :options="platformOptions" class="ars-select"/>
      <AppSelect v-model="filters.category_id" :options="categoryOptions" class="ars-select"/>
    </div>

    <AppPanel :padding="0">
      <div v-if="error" class="ars-error"><AppIcon name="Close" :size="12"/> {{ error }}</div>
      <div v-else-if="loading && !items.length" class="ars-empty">{{ tt('adminRadar.loading') }}</div>
      <div v-else-if="!items.length" class="ars-empty">
        <AppIcon name="Radar" :size="28" style="color:var(--muted-2)"/>
        <div>{{ tt('adminRadar.empty') }}</div>
      </div>
      <template v-else>
        <RadarSourceRow
          v-for="s in items" :key="s.id" :source="s"
          @toggle="toggleActive(s, $event)" @edit="openForm(s)"
          @assign="openAssign(s)" @remove="openDelete(s)" @scan="scanNow(s)"
        />
      </template>
      <AppPagination :page="pager.page.value" :total-pages="pager.totalPages.value" :total="total"
                     :range-start="pager.rangeStart.value" :range-end="pager.rangeEnd.value" @change="goTo"/>
    </AppPanel>

    <RadarSourceFormModal v-model="formOpen" :source="editing" :categories="categories" :companies="companies" @saved="onSaved"/>
    <RadarBulkImportModal v-model="bulkOpen" :categories="categories" :companies="companies" @imported="load"/>
    <RadarAssignModal v-model="assignOpen" :source="editing" :companies="companies" @saved="onAssigned"/>

    <AppModal v-model="deleteOpen" :title="tt('adminRadar.deleteTitle')" :subtitle="editing?.name" width="460px">
      <p class="ars-del-text">{{ tt('adminRadar.deleteText') }}</p>
      <template #footer>
        <AppButton variant="secondary" size="md" :disabled="busy" @click="deleteOpen = false">{{ tt('adminRadar.cancel') }}</AppButton>
        <AppButton variant="danger" size="md" :loading="busy" @click="confirmDelete">
          <template #icon><AppIcon name="Trash" :size="12"/></template>
          {{ tt('adminRadar.delete') }}
        </AppButton>
      </template>
    </AppModal>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import PageHeader from '@/components/layout/PageHeader.vue'
import AppPanel from '@/components/ui/AppPanel.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import AppModal from '@/components/ui/AppModal.vue'
import AppPagination from '@/components/ui/AppPagination.vue'
import RadarSourceRow from '@/components/radar-admin/RadarSourceRow.vue'
import RadarSourceFormModal from '@/components/radar-admin/RadarSourceFormModal.vue'
import RadarAssignModal from '@/components/radar-admin/RadarAssignModal.vue'
import RadarBulkImportModal from '@/components/radar-admin/RadarBulkImportModal.vue'
import { radarAdminApi } from '@/api/radar.js'
import { adminApi } from '@/api/admin.js'
import { referencesApi } from '@/api/references.js'
import { RADAR_PLATFORMS } from '@/config/radarPlatforms.js'
import { usePagination } from '@/composables/usePagination.js'
import { useToast } from '@/composables/useToast.js'
import { apiErrorMessage } from '@/utils/apiError.js'
import { useAppStore } from '@/stores/app.js'

const PAGE_SIZE = 50

const store = useAppStore()
const t = computed(() => store.t)
function tt(key, params) { return t.value(key, params) }
const toast = useToast()

const items = ref([])
const total = ref(0)
const loading = ref(false)
const error = ref('')
const categories = ref([])
const companies = ref([])
const filters = reactive({ q: '', platform: '', category_id: '' })
const pager = usePagination(PAGE_SIZE, total)

const editing = ref(null)
const formOpen = ref(false)
const assignOpen = ref(false)
const bulkOpen = ref(false)
const deleteOpen = ref(false)
const busy = ref(false)

const platformOptions = computed(() => [
  { value: '', label: tt('adminRadar.allPlatforms') },
  ...RADAR_PLATFORMS.map((p) => ({ value: p.slug, label: tt(p.labelKey) })),
])
const categoryOptions = computed(() => [
  { value: '', label: tt('adminRadar.allCategories') },
  ...categories.value.map((c) => ({ value: c.id, label: c.name })),
])

async function load() {
  loading.value = true
  error.value = ''
  try {
    const res = await radarAdminApi.list({
      q: filters.q.trim() || undefined,
      platform: filters.platform || undefined,
      category_id: filters.category_id || undefined,
      limit: PAGE_SIZE,
      offset: pager.offset.value,
    })
    items.value = res.items
    total.value = res.total
  } catch (e) {
    error.value = apiErrorMessage(e, tt('adminRadar.loadError'))
  } finally {
    loading.value = false
  }
}

async function loadRefs() {
  const [cats, comps] = await Promise.all([
    referencesApi.getSourceCategories().catch(() => []),
    adminApi.listCompanies().catch(() => []),
  ])
  categories.value = (cats || []).filter((c) => c.is_active !== false)
  companies.value = (Array.isArray(comps) ? comps : []).map((c) => ({ id: c.id, name: c.name, email: c.owner?.email }))
}

function goTo(n) { pager.goTo(n); load() }

let searchTimer = null
watch(() => [filters.q, filters.platform, filters.category_id], () => {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => { pager.reset(); load() }, 300)
})

function openForm(s) { editing.value = s; formOpen.value = true }
function openAssign(s) { editing.value = s; assignOpen.value = true }
function openDelete(s) { editing.value = s; deleteOpen.value = true }

function onSaved() { toast.success(tt('adminRadar.saved')); load() }
function onAssigned(n) { toast.success(tt('adminRadar.assigned', { n })); load() }

async function toggleActive(s, value) {
  try {
    const updated = await radarAdminApi.update(s.id, { is_active: value })
    Object.assign(s, updated)
  } catch (e) {
    toast.error(apiErrorMessage(e, tt('adminRadar.saveError')))
  }
}

async function scanNow(s) {
  try {
    const { queued } = await radarAdminApi.scan(s.id)
    queued ? toast.success(tt('adminRadar.scanQueued')) : toast.error(tt('adminRadar.scanQueueError'))
  } catch (e) {
    toast.error(apiErrorMessage(e, tt('adminRadar.scanQueueError')))
  }
}

async function confirmDelete() {
  busy.value = true
  try {
    await radarAdminApi.remove(editing.value.id)
    deleteOpen.value = false
    toast.success(tt('adminRadar.deleted'))
    load()
  } catch (e) {
    toast.error(apiErrorMessage(e, tt('adminRadar.saveError')))
  } finally {
    busy.value = false
  }
}

onMounted(() => { load(); loadRefs() })
// Kategoriya nomlari Accept-Language bo'yicha keladi — til o'zgarsa qayta yuklaymiz
watch(() => store.lang, () => { load(); loadRefs() })
</script>

<style scoped>
.ars { padding: 20px 24px 40px; display: flex; flex-direction: column; gap: 16px; }
.ars-filters { display: flex; gap: 10px; flex-wrap: wrap; }
.ars-search { flex: 1 1 260px; }
.ars-select { flex: 0 0 200px; width: 200px; }
.ars-empty { padding: 48px 16px; text-align: center; color: var(--muted); font-size: 13px; display: flex; flex-direction: column; align-items: center; gap: 10px; }
.ars-error { padding: 14px 16px; background: var(--danger-bg); color: var(--danger); font-size: 13px; }
.ars-del-text { margin: 0; font-size: 13px; color: var(--text-2); line-height: 1.5; }
@media (max-width: 640px) {
  .ars { padding: 14px 12px 32px; }
  .ars-select { flex: 1 1 100%; width: 100%; }
}
</style>
