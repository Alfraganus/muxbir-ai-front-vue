import http from './http.js'

// Kun radari — mijoz lentasi
export const radarApi = {
  list: (companyId, params = {}) =>
    http.get(`/companies/${companyId}/radar`, { params }).then((r) => r.data),
  getItem: (companyId, itemId) =>
    http.get(`/companies/${companyId}/radar/items/${itemId}`).then((r) => r.data),
}

// Radar manbalari — admin (super_admin)
export const radarAdminApi = {
  list: (params = {}) =>
    http.get('/admin/radar/sources', { params }).then((r) => r.data),
  create: (payload) =>
    http.post('/admin/radar/sources', payload).then((r) => r.data),
  // Ommaviy qo'shish: { platform, values[], category_id?, is_mixed_topic?, company_ids? }
  bulkCreate: (payload) =>
    http.post('/admin/radar/sources/bulk', payload, { timeout: 120000 }).then((r) => r.data),
  update: (id, payload) =>
    http.patch(`/admin/radar/sources/${id}`, payload).then((r) => r.data),
  remove: (id) =>
    http.delete(`/admin/radar/sources/${id}`),
  scan: (id) =>
    http.post(`/admin/radar/sources/${id}/scan`).then((r) => r.data),
  listCompanies: (id) =>
    http.get(`/admin/radar/sources/${id}/companies`).then((r) => r.data),
  replaceCompanies: (id, companyIds) =>
    http.put(`/admin/radar/sources/${id}/companies`, { company_ids: companyIds }).then((r) => r.data),
}
