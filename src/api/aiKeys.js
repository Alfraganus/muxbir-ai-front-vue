import http from './http.js'

// AI provayder kalitlari — admin (kalitlarning o'zi hech qachon qaytarilmaydi)
export const aiKeysApi = {
  status: () => http.get('/admin/ai-keys').then((r) => r.data),
  set: (provider, apiKey) => http.put(`/admin/ai-keys/${provider}`, { api_key: apiKey }).then((r) => r.data),
  clear: (provider) => http.delete(`/admin/ai-keys/${provider}`).then((r) => r.data),
  test: (provider) => http.post(`/admin/ai-keys/${provider}/test`, null, { timeout: 60000 }).then((r) => r.data),
}
