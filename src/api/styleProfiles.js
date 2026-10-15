import http from './http.js'

// Uslub profillari (AI qoralama promptlari) — admin
export const styleProfilesApi = {
  list: () => http.get('/admin/style-profiles').then((r) => r.data),
  get: (id) => http.get(`/admin/style-profiles/${id}`).then((r) => r.data),
  create: (payload) => http.post('/admin/style-profiles', payload).then((r) => r.data),
  update: (id, payload) => http.patch(`/admin/style-profiles/${id}`, payload).then((r) => r.data),
  remove: (id) => http.delete(`/admin/style-profiles/${id}`),
  getVersion: (id, versionId) => http.get(`/admin/style-profiles/${id}/versions/${versionId}`).then((r) => r.data),
  createVersion: (id, payload) => http.post(`/admin/style-profiles/${id}/versions`, payload).then((r) => r.data),
  activateVersion: (id, versionId) => http.post(`/admin/style-profiles/${id}/versions/${versionId}/activate`).then((r) => r.data),
  listCompanies: (id) => http.get(`/admin/style-profiles/${id}/companies`).then((r) => r.data),
  replaceCompanies: (id, companyIds) => http.put(`/admin/style-profiles/${id}/companies`, { company_ids: companyIds }).then((r) => r.data),
}

// Maqola janrlari (spravochnik)
export const articleGenresApi = {
  list: () => http.get('/references/article-genres').then((r) => r.data),
}
