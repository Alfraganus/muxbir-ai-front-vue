import http from './http.js'

export const adminApi = {
  listCompanies: (params = {}) =>
    http.get('/admin/companies', { params }).then((r) => r.data),
  getCompany: (id) =>
    http.get(`/admin/companies/${id}`).then((r) => r.data),
  setCompanyTariff: (id, payload) =>
    http.patch(`/admin/companies/${id}/tariff`, payload).then((r) => r.data),

  // AI BASE prompt (admin-only, platform-wide, priority N1)
  getAiBasePrompt: () =>
    http.get('/admin/ai-base-prompt').then((r) => r.data),
  setAiBasePrompt: (value) =>
    http.put('/admin/ai-base-prompt', { value }).then((r) => r.data),
}
