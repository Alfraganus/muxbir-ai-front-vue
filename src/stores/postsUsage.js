import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { postsApi } from '@/api/posts.js'

const DEFAULT_LIMIT = 10

/** Joriy oydagi post sanog'i + tarif chegarasi (sidebar uchun) */
export const usePostsUsageStore = defineStore('postsUsage', () => {
  const used = ref(0)
  const limit = ref(DEFAULT_LIMIT)
  const hasTariff = ref(null)
  const loading = ref(false)

  const percent = computed(() => limit.value ? Math.min(100, (used.value / limit.value) * 100) : 0)

  async function refresh() {
    if (loading.value) return
    loading.value = true
    try {
      const u = await postsApi.getUsage()
      used.value = Number(u?.used || 0)
      limit.value = Number(u?.limit || DEFAULT_LIMIT)
      hasTariff.value = !!u?.has_tariff
    } catch { /* jim */ } finally {
      loading.value = false
    }
  }

  return { used, limit, hasTariff, loading, percent, refresh }
})
