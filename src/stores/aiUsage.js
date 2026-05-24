import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { aiApi } from '@/api/ai.js'

const DEFAULT_LIMIT = 2000

export const useAiUsageStore = defineStore('aiUsage', () => {
  const used = ref(0)
  const limit = ref(DEFAULT_LIMIT)
  const calls = ref(0)
  const hasTariff = ref(null)
  const loading = ref(false)

  const percent = computed(() => limit.value ? Math.min(100, (used.value / limit.value) * 100) : 0)

  async function refresh() {
    if (loading.value) return
    loading.value = true
    try {
      const u = await aiApi.getUsage()
      used.value = Number(u?.used_tokens || 0)
      limit.value = Number(u?.limit_tokens || DEFAULT_LIMIT)
      calls.value = Number(u?.calls || 0)
      hasTariff.value = !!u?.has_tariff
    } catch {
      /* jim */
    } finally {
      loading.value = false
    }
  }

  return { used, limit, calls, hasTariff, loading, percent, refresh }
})
