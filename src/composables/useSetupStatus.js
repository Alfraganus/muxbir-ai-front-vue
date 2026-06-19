import { ref, computed, onUnmounted } from 'vue'
import { companiesApi } from '@/api/companies.js'
import { SETUP_CHECK_META, SETUP_CHECK_FALLBACK } from '@/config/setupChecklist.js'

/**
 * Ilova ishlashi uchun zarur sozlamalar holatini (Telegram API, session, bot,
 * kanal, manba, chat ID) backend'dan oladi va dashboard checklist uchun
 * tayyor `items` ko'rinishida beradi.
 *
 * Bot ulanishi va boshqa holatlar o'zgarib turishi mumkin — `pollMs` berilsa
 * shu interval bilan qayta tekshiriladi (default: tekshirmaydi, faqat refresh).
 *
 * @param {() => (string|null)} getCompanyId  joriy kompaniya id'sini qaytaruvchi
 * @param {{ pollMs?: number }} opts
 */
export function useSetupStatus(getCompanyId, opts = {}) {
  const { pollMs = 0 } = opts

  const status = ref(null)   // backend javobi: { ok, checks, missing, checked_at }
  const loading = ref(false)
  const error = ref('')
  let timer = null

  async function refresh() {
    const companyId = getCompanyId?.()
    if (!companyId) return
    loading.value = true
    error.value = ''
    try {
      status.value = await companiesApi.getSetupStatus(companyId)
    } catch (e) {
      error.value = e?.response?.data?.message || 'Holatni yuklab bo\'lmadi'
    } finally {
      loading.value = false
    }
  }

  function startPolling() {
    if (timer || pollMs <= 0) return
    timer = setInterval(refresh, pollMs)
  }
  function stopPolling() {
    if (timer) { clearInterval(timer); timer = null }
  }

  // Backend check'larini meta bilan birlashtirib, tartiblangan ro'yxat
  const items = computed(() => {
    const checks = status.value?.checks || []
    return checks
      .map((c) => {
        const meta = SETUP_CHECK_META[c.key] || SETUP_CHECK_FALLBACK
        return {
          key: c.key,
          done: !!c.done,
          count: typeof c.count === 'number' ? c.count : null,
          username: c.meta?.username || null,
          ...meta,
        }
      })
      .sort((a, b) => a.order - b.order)
  })

  const ok = computed(() => !!status.value?.ok)
  const ready = computed(() => status.value !== null)
  const missingCount = computed(() => status.value?.missing?.length || 0)
  const doneCount = computed(() => items.value.filter((i) => i.done).length)
  const totalCount = computed(() => items.value.length)

  onUnmounted(stopPolling)

  return {
    status, loading, error,
    items, ok, ready, missingCount, doneCount, totalCount,
    refresh, startPolling, stopPolling,
  }
}
