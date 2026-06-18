import http from './http.js'

export const tariffCategoriesApi = {
  list: () => http.get('/tariff-categories').then((r) => r.data),
  create: (data) => http.post('/tariff-categories', data).then((r) => r.data),
  update: (id, data) => http.patch(`/tariff-categories/${id}`, data).then((r) => r.data),
  remove: (id) => http.delete(`/tariff-categories/${id}`).then((r) => r.data),
}
