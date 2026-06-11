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
}
