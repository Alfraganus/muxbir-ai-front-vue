import { ref } from 'vue'
import { subscriptionsApi } from '@/api/subscriptions.js'
import { paymentsApi, PAYMENT_METHODS } from '@/api/payments.js'

/**
 * Click orqali to'lovni boshlash mantiqи (qayta ishlatiladigan).
 * Joriy obunani topadi → to'lovni initiate qiladi → my.click.uz ga yo'naltiradi.
 */
export function useClickPayment() {
  const loading = ref(false)
  const error = ref(null)

  // subscriptionId berilmasa — joriy kompaniya obunasidan olinadi
  async function payWithClick(subscriptionId = null) {
    loading.value = true
    error.value = null
    try {
      let subId = subscriptionId
      if (!subId) {
        const sub = await subscriptionsApi.getMine()
        subId = sub?.id
      }
      if (!subId) throw new Error('Obuna topilmadi')

      const { payment_url } = await paymentsApi.initiate({
        subscription_id: subId,
        method: PAYMENT_METHODS.CLICK,
      })
      if (!payment_url) throw new Error("To'lov havolasi olinmadi")

      window.location.href = payment_url
    } catch (e) {
      error.value = e?.response?.data?.message || e.message || "To'lovni boshlashda xatolik"
      throw e
    } finally {
      loading.value = false
    }
  }

  return { loading, error, payWithClick }
}
