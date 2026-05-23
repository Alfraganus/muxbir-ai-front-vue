import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { uploadsApi } from '@/api/uploads.js'

const DEFAULT_LIMIT = 100 * 1024 * 1024 // 100 MB

/**
 * Joriy kompaniya storage iste'moli va tarif chegarasi.
 * Komponentlar `refresh()`ni rasm yuklanish/o'chirilishidan keyin chaqirib,
 * sidebar (yoki boshqa joy) darhol yangilangan ko'rsatkichni ko'radi.
 */
export const useStorageStore = defineStore('storage', () => {
  const used = ref(0)
  const limit = ref(DEFAULT_LIMIT)
  const hasTariff = ref(null)
  const loading = ref(false)
  const lastError = ref(null)

  const percent = computed(() => {
    if (!limit.value) return 0
    return Math.min(100, (used.value / limit.value) * 100)
  })

  async function refresh() {
    if (loading.value) return
    loading.value = true
    lastError.value = null
    try {
      const u = await uploadsApi.getUsage()
      used.value = Number(u?.used_bytes || 0)
      limit.value = Number(u?.limit_bytes || DEFAULT_LIMIT)
      hasTariff.value = !!u?.has_tariff
    } catch (e) {
      lastError.value = e?.message || 'usage fetch failed'
    } finally {
      loading.value = false
    }
  }

  return { used, limit, hasTariff, loading, percent, refresh }
})
