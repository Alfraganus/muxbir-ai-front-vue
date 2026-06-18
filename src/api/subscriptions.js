import http from './http.js'

export const subscriptionsApi = {
  // Joriy kompaniyaning obunasi (null bo'lishi mumkin)
  getMine: () => http.get('/subscriptions/my').then((r) => r.data),
  cancel: (id) => http.post(`/subscriptions/${id}/cancel`).then((r) => r.data),
}
