import http from './http.js'

export const adminApi = {
  listCompanies: (params = {}) =>
    http.get('/admin/companies', { params }).then((r) => r.data),
  getCompany: (id) =>
    http.get(`/admin/companies/${id}`).then((r) => r.data),
  setCompanyTariff: (id, payload) =>
    http.patch(`/admin/companies/${id}/tariff`, payload).then((r) => r.data),
  approveTrial: (id) =>
    http.post(`/admin/companies/${id}/approve-trial`).then((r) => r.data),
  updateCompany: (id, payload) =>
    http.patch(`/admin/companies/${id}`, payload).then((r) => r.data),
  resetCompanyPassword: (id, new_password) =>
    http.post(`/admin/companies/${id}/reset-password`, { new_password }).then((r) => r.data),
  deleteCompany: (id) =>
    http.delete(`/admin/companies/${id}`).then((r) => r.data),

  // AI BASE prompt (admin-only, platform-wide, priority N1)
  getAiBasePrompt: () =>
    http.get('/admin/ai-base-prompt').then((r) => r.data),
  setAiBasePrompt: (value) =>
    http.put('/admin/ai-base-prompt', { value }).then((r) => r.data),

  // Telegram user API sessionlari (admin-only)
  listTelegramSessions: () =>
    http.get('/admin/telegram-sessions').then((r) => r.data),
  revokeTelegramSession: (companyId) =>
    http.delete(`/admin/telegram-sessions/${companyId}`).then((r) => r.data),
  revokeAllTelegramSessions: () =>
    http.delete('/admin/telegram-sessions').then((r) => r.data),

  // Admin promptlari kutubxonasi (CRUD)
  listPrompts: () =>
    http.get('/admin/prompts').then((r) => r.data),
  getPrompt: (id) =>
    http.get(`/admin/prompts/${id}`).then((r) => r.data),
  createPrompt: (payload) =>
    http.post('/admin/prompts', payload).then((r) => r.data),
  updatePrompt: (id, payload) =>
    http.patch(`/admin/prompts/${id}`, payload).then((r) => r.data),
  deletePrompt: (id) =>
    http.delete(`/admin/prompts/${id}`).then((r) => r.data),
}
