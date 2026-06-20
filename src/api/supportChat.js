import http from './http.js'

/** Sayt jonli-chat (customer support) — public endpoint'lar (auth shart emas). */
export const supportChatApi = {
  send: (payload) => http.post('/support-chat/send', payload).then((r) => r.data),
  replies: (visitorId, after) =>
    http
      .get('/support-chat/replies', { params: { visitor_id: visitorId, after } })
      .then((r) => r.data),
}
