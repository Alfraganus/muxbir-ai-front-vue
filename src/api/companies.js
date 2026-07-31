import http from './http.js'

export const companiesApi = {
  create: (data) => http.post('/companies', data).then(r => r.data),
  getMy: () => http.get('/companies/my').then(r => r.data),
  getOne: (id) => http.get(`/companies/${id}`).then(r => r.data),
  update: (id, data) => http.patch(`/companies/${id}`, data).then(r => r.data),

  // Kompaniya darajasidagi AI prompt (qayta yozish uslubi va misol)
  getAiPrompt: (id) =>
    http.get(`/companies/${id}/ai-prompt`).then(r => r.data),
  setAiPrompt: (id, value) =>
    http.put(`/companies/${id}/ai-prompt`, { value }).then(r => r.data),

  // Multi-block prompt
  getAiPromptBlocks: (id) =>
    http.get(`/companies/${id}/ai-prompt-blocks`).then(r => r.data),
  setAiPromptBlocks: (id, blocks) =>
    http.put(`/companies/${id}/ai-prompt-blocks`, { blocks }).then(r => r.data),

  // Nomli prompt to'plamlari (yangi tizim)
  getAiPromptGroups: (id) =>
    http.get(`/companies/${id}/ai-prompt-groups`).then(r => r.data),
  setAiPromptGroups: (id, groups) =>
    http.put(`/companies/${id}/ai-prompt-groups`, { groups }).then(r => r.data),

  // Telegram API credentials (my.telegram.org)
  getTelegramApi: (id) =>
    http.get(`/companies/${id}/telegram-api`).then(r => r.data),
  setTelegramApi: (id, payload) =>
    http.put(`/companies/${id}/telegram-api`, payload).then(r => r.data),
  clearTelegramApi: (id) =>
    http.delete(`/companies/${id}/telegram-api`).then(r => r.data),

  // Eslatma: Telegram chat ID'lari endi HAR KANALDA alohida boshqariladi —
  // channelsApi.listChats / addChat / updateChat / removeChat (2-bosqichli oqim).

  // Ilova ishlashi uchun zarur sozlamalar holati (dashboard checklist)
  getSetupStatus: (id) =>
    http.get(`/companies/${id}/setup-status`).then(r => r.data),

  // Telegram MTProto session — mavjud (saqlangan) sessiya orqali getMe()
  getTelegramMe: (id) =>
    http.get(`/companies/${id}/telegram-session/me`).then(r => r.data),
  getTelegramDialogs: (id, limit) =>
    http.get(`/companies/${id}/telegram-session/dialogs`, { params: { limit } }).then(r => r.data),
  getTelegramMessages: (id, peerId, beforeId) =>
    http.get(`/companies/${id}/telegram-session/messages`, {
      params: { peer_id: peerId, before_id: beforeId },
    }).then(r => r.data),
  downloadTelegramMedia: (id, peerId, messageId) =>
    http.get(`/companies/${id}/telegram-session/media`, {
      params: { peer_id: peerId, message_id: messageId },
      responseType: 'blob',
    }).then(r => r.data),
  verifyTelegramTestPassword: (id, password) =>
    http.post(`/companies/${id}/telegram-session/verify-password`, { password }).then(r => r.data),

  // Telegram MTProto session login (telefon + kod + 2FA)
  getTelegramSessionStatus: (id) =>
    http.get(`/companies/${id}/telegram-session/status`).then(r => r.data),
  sendTelegramCode: (id, phone) =>
    http.post(`/companies/${id}/telegram-session/send-code`, { phone }).then(r => r.data),
  resendTelegramCodeSms: (id) =>
    http.post(`/companies/${id}/telegram-session/resend-code`).then(r => r.data),
  signInTelegramCode: (id, code) =>
    http.post(`/companies/${id}/telegram-session/sign-in`, { code }).then(r => r.data),
  signInTelegram2FA: (id, password) =>
    http.post(`/companies/${id}/telegram-session/2fa`, { password }).then(r => r.data),
  revokeTelegramSession: (id) =>
    http.delete(`/companies/${id}/telegram-session`).then(r => r.data),

  // Eslatma: manbalar endi har kanalda alohida boshqariladi — channelsApi.listSources / addSource / ...

  // Havoladan AI maqola yaratish — URL fetch + AI complete uzoq vaqt olishi mumkin
  createPostFromUrl: (id, payload) =>
    http.post(`/companies/${id}/posts/from-url`, payload, { timeout: 120000 })
      .then(r => r.data),

  // AI prompt namunalari (foydalanuvchining .pdf/.docx fayli — eng ustun)
  getAiPromptAttachment: (id) =>
    http.get(`/companies/${id}/ai-prompt-attachment`).then(r => r.data),
  uploadAiPromptAttachment: (id, file) => {
    const fd = new FormData()
    fd.append('file', file)
    return http
      .post(`/companies/${id}/ai-prompt-attachment`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then(r => r.data)
  },
  removeAiPromptAttachment: (id) =>
    http.delete(`/companies/${id}/ai-prompt-attachment`).then(r => r.data),

  // API kalitlar (tashqi tizimlar uchun)
  listApiKeys: (id) =>
    http.get(`/companies/${id}/api-keys`).then(r => r.data),
  createApiKey: (id, payload) =>
    http.post(`/companies/${id}/api-keys`, payload).then(r => r.data),
  revokeApiKey: (id, keyId) =>
    http.delete(`/companies/${id}/api-keys/${keyId}`).then(r => r.data),
}
