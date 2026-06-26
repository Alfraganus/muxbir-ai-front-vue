import { defineStore } from 'pinia'
import { ref } from 'vue'
import { quotaApi } from '@/api/quota.js'
import { useAppStore } from './app.js'

/** Tarif + post limiti + kredit holati (sidebar kartasi uchun) */
export const useQuotaStore = defineStore('quota', () => {
  const tariffName = ref(null)
  const hasTariff = ref(null)
  const monthly = ref({ used: 0, limit: 0 })
  const daily = ref({ used: 0, limit: 0 })
  const credits = ref({ used: 0, balance: 0, total: 0 })
  const loading = ref(false)
  // Birinchi muvaffaqiyatli yuklash bo'ldimi — UI "Free" miltillashining oldini oladi
  const loaded = ref(false)
  // Obuna holati — null = hali noma'lum (yuklanmagan)
  const subscriptionActive = ref(null)
  const subscriptionStatus = ref(null)
  const tariffSlug = ref(null)
  const daysLeft = ref(null)

  async function refresh() {
    const app = useAppStore()
    const cid = app.companyId
    if (!cid || loading.value) return
    loading.value = true
    try {
      const q = await quotaApi.get(cid)
      tariffName.value = q?.tariff_name || null
      tariffSlug.value = q?.tariff_slug || null
      hasTariff.value = !!q?.has_tariff
      monthly.value = q?.monthly || { used: 0, limit: 0 }
      daily.value = q?.daily || { used: 0, limit: 0 }
      credits.value = q?.credits || { used: 0, balance: 0, total: 0 }
      subscriptionActive.value = !!q?.subscription_active
      subscriptionStatus.value = q?.subscription_status || null
      daysLeft.value = q?.days_left ?? null
      loaded.value = true
    } catch { /* jim */ } finally {
      loading.value = false
    }
  }

  return { tariffName, tariffSlug, hasTariff, monthly, daily, credits, loading, loaded, subscriptionActive, subscriptionStatus, daysLeft, refresh }
})
