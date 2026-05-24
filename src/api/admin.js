import http from './http.js'

export const adminApi = {
  listCompanies: (params = {}) =>
    http.get('/admin/companies', { params }).then((r) => r.data),
  getCompany: (id) =>
    http.get(`/admin/companies/${id}`).then((r) => r.data),
  setCompanyTariff: (id, payload) =>
    http.patch(`/admin/companies/${id}/tariff`, payload).then((r) => r.data),
}
