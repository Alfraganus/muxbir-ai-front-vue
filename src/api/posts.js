import http from './http.js'

export const postsApi = {
  list: (companyId, status) =>
    http.get(`/companies/${companyId}/posts`, { params: status ? { status } : {} }).then(r => r.data),

  /** Tag autocomplete: prefiks bo'yicha unikal teglar (eng ko'p ishlatilgani oldinda) */
  listTags: (companyId, q, limit = 20) =>
    http.get(`/companies/${companyId}/posts/tags`, { params: { q: q || undefined, limit } }).then(r => r.data),

  /** Joriy oydagi post sanog'i + tarif chegarasi */
  getUsage: () =>
    http.get('/posts/usage').then(r => r.data), // { used, limit, has_tariff }

  get: (companyId, postId) =>
    http.get(`/companies/${companyId}/posts/${postId}`).then(r => r.data),

  create: (companyId, data) =>
    http.post(`/companies/${companyId}/posts`, data).then(r => r.data),

  /** Discover'dan postni asos qilib draft yaratadi (rasm yuklab olinadi) */
  createFromSource: (companyId, sourcePostId) =>
    http.post(`/companies/${companyId}/posts/from-source`, { source_post_id: sourcePostId })
      .then(r => r.data),

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

  /** AI: post matnini Telegram uchun qisqartiradi va saqlaydi. Qaytaradi: { lang, content_json } */
  aiShorten: (companyId, postId, lang = 'uz') =>
    http.post(`/companies/${companyId}/posts/${postId}/ai/shorten`, { lang }).then(r => r.data),

  /** AI: prompt + provider + model tanlash bilan qayta yozish. payload: {lang, prompt_group_id, provider, model} */
  aiRewrite: (companyId, postId, payload) =>
    http.post(`/companies/${companyId}/posts/${postId}/ai/rewrite`, payload, { timeout: 120000 })
      .then(r => r.data),

  /** AI: post mazmunidan tag'lar generatsiya qiladi. apply=true → DB ga ham yozadi. */
  aiTags: (companyId, postId, lang = 'uz', apply = false) =>
    http.post(`/companies/${companyId}/posts/${postId}/ai/tags`, { lang, apply }).then(r => r.data),

  publish: (companyId, postId) =>
    http.post(`/companies/${companyId}/posts/${postId}/publish`).then(r => r.data),
}
