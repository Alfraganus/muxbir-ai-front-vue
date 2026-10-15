import { reactive, ref, watch } from 'vue'
import { radarApi } from '@/api/radar.js'
import { usePagination } from '@/composables/usePagination.js'
import { apiErrorMessage } from '@/utils/apiError.js'

export const RADAR_PAGE_SIZE = 100
const EXPAND_KEY = 'radar.expandAll'

function readExpandAll() {
  try { return localStorage.getItem(EXPAND_KEY) === '1' } catch { return false }
}
function writeExpandAll(v) {
  try { localStorage.setItem(EXPAND_KEY, v ? '1' : '0') } catch { /* private mode */ }
}

/**
 * Kun radari lentasi holati: filtrlar (sana, kategoriya, qidiruv), sahifalash
 * va accordion uchun lazy yuklanadigan material kontenti (kesh bilan).
 */
export function useRadarFeed(companyId, errorFallback) {
  const items = ref([])
  const total = ref(0)
  const categories = ref([])
  const sources = ref([])
  // "Hammasini ochiq ko'rsatish" — matnlar ro'yxat bilan birga keladi (brauzerda eslab qolinadi)
  const expandAll = ref(readExpandAll())
  const period = ref(null)
  const loading = ref(false)
  const error = ref('')
  const filters = reactive({ date: '', category_id: '', q: '', source_ids: [] })
  const pager = usePagination(RADAR_PAGE_SIZE, total)

  const details = reactive({})
  const detailLoading = reactive({})

  async function load() {
    if (!companyId.value) return
    loading.value = true
    error.value = ''
    try {
      const res = await radarApi.list(companyId.value, {
        date: filters.date || undefined,
        category_id: filters.category_id || undefined,
        q: filters.q.trim() || undefined,
        source_ids: filters.source_ids.length ? filters.source_ids.join(',') : undefined,
        with_content: expandAll.value || undefined,
        limit: RADAR_PAGE_SIZE,
        offset: pager.offset.value,
      })
      items.value = res.items
      total.value = res.total
      categories.value = res.categories
      sources.value = res.sources
      period.value = res.window
    } catch (e) {
      error.value = apiErrorMessage(e, errorFallback())
    } finally {
      loading.value = false
    }
  }

  async function loadDetail(itemId) {
    if (details[itemId] || detailLoading[itemId]) return
    detailLoading[itemId] = true
    try {
      details[itemId] = await radarApi.getItem(companyId.value, itemId)
    } catch (e) {
      details[itemId] = { error: apiErrorMessage(e, errorFallback()) }
    } finally {
      detailLoading[itemId] = false
    }
  }

  function goTo(n) {
    pager.goTo(n)
    load()
  }

  // Filtr o'zgarsa — 1-sahifaga qaytib qayta yuklaymiz (qidiruv debounce bilan)
  let timer = null
  watch(() => [filters.date, filters.category_id, filters.source_ids.join(',')], () => { pager.reset(); load() })
  watch(expandAll, (v) => { writeExpandAll(v); load() })
  watch(() => filters.q, () => {
    clearTimeout(timer)
    timer = setTimeout(() => { pager.reset(); load() }, 350)
  })
  watch(companyId, load)

  return { items, total, categories, sources, expandAll, period, loading, error, filters, pager, details, detailLoading, load, loadDetail, goTo }
}
