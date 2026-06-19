import http from './http.js'

export const queueApi = {
  list: (companyId, opts = {}) => {
    const { status, channelId } = opts
    return http.get(`/companies/${companyId}/auto-queue`, {
      params: {
        status: status || undefined,
        channelId: channelId || undefined,
      },
    }).then(r => r.data)
  },

  counts: (companyId) =>
    http.get(`/companies/${companyId}/auto-queue/counts`).then(r => r.data),

  approve: (companyId, postId) =>
    http.post(`/companies/${companyId}/auto-queue/${postId}/approve`).then(r => r.data),

  reject: (companyId, postId) =>
    http.post(`/companies/${companyId}/auto-queue/${postId}/reject`).then(r => r.data),

  approveAll: (companyId, channelId) =>
    http.post(`/companies/${companyId}/auto-queue/approve-all`,
      channelId ? { channelId } : null).then(r => r.data),

  rewrite: (companyId, postId, mode) =>
    http.post(`/companies/${companyId}/auto-queue/${postId}/rewrite`,
      { mode }, { timeout: 120000 }).then(r => r.data),

  updateText: (companyId, postId, ai_text) =>
    http.patch(`/companies/${companyId}/auto-queue/${postId}/text`, { ai_text }).then(r => r.data),

  // ── 2-bosqichli (two_stage) oqim — bot bilan bir xil amallar ──
  // 1-bosqich tasdiq: pro yozadi (uzoq bo'lishi mumkin) → 2-bosqichga o'tadi
  approvePreview: (companyId, postId) =>
    http.post(`/companies/${companyId}/auto-queue/${postId}/approve-preview`,
      null, { timeout: 120000 }).then(r => r.data),
  // 1-bosqich bekor: boshqa post topiladi (charge yo'q)
  rejectPreview: (companyId, postId) =>
    http.post(`/companies/${companyId}/auto-queue/${postId}/reject-preview`).then(r => r.data),
  // 2-bosqich tasdiq: kanalga chiqarish (oylik limit −1)
  confirmPublish: (companyId, postId) =>
    http.post(`/companies/${companyId}/auto-queue/${postId}/confirm-publish`).then(r => r.data),
  // 2-bosqich rad: chiqarmaslik (0.5 kredit yechiladi)
  declinePublish: (companyId, postId) =>
    http.post(`/companies/${companyId}/auto-queue/${postId}/decline-publish`).then(r => r.data),
}
