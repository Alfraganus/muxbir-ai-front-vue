import http from './http.js'

/** To'lov usullari (Open/Closed — yangi usul shu yerga qo'shiladi). */
export const PAYMENT_METHODS = {
  CLICK: 'click',
  PAYME: 'payme',
  HUMO_UZCARD: 'humo_uzcard',
  BANK_TRANSFER: 'bank_transfer',
  FREE_TRIAL: 'free_trial',
}

export const paymentsApi = {
  // To'lovni boshlash — { payment_id, payment_url } qaytaradi
  initiate: ({ subscription_id, method, return_url }) =>
    http.post('/payments/initiate', { subscription_id, method, return_url }).then((r) => r.data),
  freeTrial: (subscription_id) =>
    http.post('/payments/free-trial', { subscription_id }).then((r) => r.data),
  myPayments: () => http.get('/payments/my').then((r) => r.data),
  getOne: (id) => http.get(`/payments/${id}`).then((r) => r.data),
  // Click sinovi — har chaqirilganda 1000 so'mlik yangi to'lov yaratadi
  clickTest: () => http.post('/payments/click/test').then((r) => r.data),
  // Kredit sotib olish — { payment_id, credits, amount, pay_url } qaytaradi (1 kredit = 10 so'm)
  initiateCredits: (credits) =>
    http.post('/payments/credits/initiate', { credits }).then((r) => r.data),
  // Tarif almashtirish/uzaytirish — tarif FAQAT to'lovdan keyin o'zgaradi
  // { payment_id, payment_url } qaytaradi
  initiateTariff: (tariff_id, method = 'click') =>
    http.post('/payments/tariff/initiate', { tariff_id, method }).then((r) => r.data),
}

/** 1 kredit narxi (so'm) — backenddagi CREDIT_PRICE_SOM bilan bir xil. */
export const CREDIT_PRICE_SOM = 10
