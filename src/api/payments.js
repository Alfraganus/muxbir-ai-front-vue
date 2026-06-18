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
}
