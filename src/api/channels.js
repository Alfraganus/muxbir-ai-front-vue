import http from './http.js'

export const channelsApi = {
  list: (companyId) =>
    http.get(`/companies/${companyId}/channels`).then(r => r.data),

  initTelegram: (companyId, url, posting_mode = 'auto') =>
    http.post(`/companies/${companyId}/channels/telegram/init`, { url, posting_mode }).then(r => r.data),

  setPostingMode: (companyId, channelId, posting_mode) =>
    http.patch(`/companies/${companyId}/channels/${channelId}/posting-mode`, { posting_mode }).then(r => r.data),

  updateAutoSettings: (companyId, channelId, payload) =>
    http.patch(`/companies/${companyId}/channels/${channelId}/auto-settings`, payload).then(r => r.data),

  /** Kanal imzosini saqlash (har post oxiriga qo'shiladigan HTML matn) */
  setSignature: (companyId, channelId, signature) =>
    http.patch(`/companies/${companyId}/channels/${channelId}/signature`, { signature })
      .then(r => r.data),

  getStatus: (companyId, channelId) =>
    http.get(`/companies/${companyId}/channels/${channelId}/status`).then(r => r.data),

  remove: (companyId, channelId) =>
    http.delete(`/companies/${companyId}/channels/${channelId}`).then(r => r.data),

  // fallback — agar webhook ishlamasa qo'lda tasdiqlash
  verify: (companyId, channelId) =>
    http.post(`/companies/${companyId}/channels/${channelId}/verify`).then(r => r.data),
}
