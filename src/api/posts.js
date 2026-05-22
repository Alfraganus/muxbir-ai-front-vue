import http from './http.js'

export const postsApi = {
  list: (companyId, status) =>
    http.get(`/companies/${companyId}/posts`, { params: status ? { status } : {} }).then(r => r.data),

  get: (companyId, postId) =>
    http.get(`/companies/${companyId}/posts/${postId}`).then(r => r.data),

  create: (companyId, data) =>
    http.post(`/companies/${companyId}/posts`, data).then(r => r.data),

  update: (companyId, postId, data) =>
    http.patch(`/companies/${companyId}/posts/${postId}`, data).then(r => r.data),

  remove: (companyId, postId) =>
    http.delete(`/companies/${companyId}/posts/${postId}`).then(r => r.data),

  upsertTranslation: (companyId, postId, lang, data) =>
    http.put(`/companies/${companyId}/posts/${postId}/translations/${lang}`, data).then(r => r.data),

  removeTranslation: (companyId, postId, lang) =>
    http.delete(`/companies/${companyId}/posts/${postId}/translations/${lang}`).then(r => r.data),

  adaptTelegram: (companyId, postId) =>
    http.post(`/companies/${companyId}/posts/${postId}/telegram-adapt`).then(r => r.data),

  publish: (companyId, postId) =>
    http.post(`/companies/${companyId}/posts/${postId}/publish`).then(r => r.data),
}
