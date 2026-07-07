import http from './http.js'

export const postsApi = {
  /**
   * Postlar ro'yxati — paginatsiya bilan.
   * opts: { status, q, limit, offset }
   * Javob: { items, total, counts }
   */
  list: (companyId, opts = {}) => {
    const { status, q, limit, offset } = opts
    return http.get(`/companies/${companyId}/posts`, {
      params: {
        status: status || undefined,
        q: q || undefined,
        limit: limit != null ? limit : undefined,
        offset: offset != null ? offset : undefined,
      },
    }).then(r => r.data)
  },

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

  /** Discover'dan postni asos qilib draft yaratadi (rasm yuklab olinadi).
   *  Backend t.me sahifasini scrape qiladi + rasm/video yuklaydi —
   *  bu 30+ soniya ketishi mumkin, shuning uchun default 10s timeout'ni oshiramiz. */
  createFromSource: (companyId, sourcePostId) =>
    http.post(`/companies/${companyId}/posts/from-source`, { source_post_id: sourcePostId },
              { timeout: 120000 })
      .then(r => r.data),

  /** Discover manbadan tanlangan til + platformada AI post yaratadi (telegram 140 / website 200 kredit).
   *  Import + AI qayta yozish sekin bo'lishi mumkin → uzun timeout.
   *  Xatolar: 402 (INSUFFICIENT_CREDITS), 400 { code:'INSUFFICIENT_MATERIAL' }. */
  createFromSourceVersion: (companyId, sourcePostId, lang = 'uz', platform = 'telegram') =>
    http.post(`/companies/${companyId}/posts/from-source-version`,
              { source_post_id: sourcePostId, lang, platform },
              { timeout: 180000 })
      .then(r => r.data),

  /** TEST: t.me post URL media'sini (rasm/video) muxbirAI bot orqali test kanalga yuboradi.
   *  MTProto yuklab olish + Telegram yuborish sekin bo'lishi mumkin → uzun timeout. */
  testMediaRelay: (companyId, url) =>
    http.post(`/companies/${companyId}/posts/test-media-relay`, { url }, { timeout: 180000 })
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

  /** AI: post matnini QISQARTIRADI — qayta yozish bilan bir xil (prompt + provider + model). */
  aiShorten: (companyId, postId, payload) =>
    http.post(`/companies/${companyId}/posts/${postId}/ai/shorten`, payload, { timeout: 120000 })
      .then(r => r.data),

  /** AI: prompt + provider + model tanlash bilan qayta yozish. payload: {lang, prompt_group_id, provider, model} */
  aiRewrite: (companyId, postId, payload) =>
    http.post(`/companies/${companyId}/posts/${postId}/ai/rewrite`, payload, { timeout: 120000 })
      .then(r => r.data),

  /** AI: post mazmunidan tag'lar generatsiya qiladi. apply=true → DB ga ham yozadi. */
  aiTags: (companyId, postId, lang = 'uz', apply = false) =>
    http.post(`/companies/${companyId}/posts/${postId}/ai/tags`, { lang, apply },
              { timeout: 60000 }).then(r => r.data),

  /** AI: post uchun WEBSITE (to'liq maqola) versiyasini yaratadi — 200 kredit.
   *  Manba yetarli bo'lmasa 400 + code:'INSUFFICIENT_MATERIAL'; kredit yetmasa 402. */
  generateWebsiteVersion: (companyId, postId, lang = 'uz') =>
    http.post(`/companies/${companyId}/posts/${postId}/website-version`, { lang },
              { timeout: 120000 }).then(r => r.data),

  publish: (companyId, postId, lang) =>
    http.post(`/companies/${companyId}/posts/${postId}/publish`,
              lang ? { lang } : null,
              { timeout: 60000 }).then(r => r.data),
}
