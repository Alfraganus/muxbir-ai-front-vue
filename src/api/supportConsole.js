import axios from 'axios'
import { API_BASE } from './base.js'

/** Operator console (Mini App) — alohida token (asosiy user JWT'дан mustaqil). */
export const SC_TOKEN_KEY = 'support_console_token'

const client = axios.create({ baseURL: API_BASE, timeout: 15000 })
client.interceptors.request.use((c) => {
  const t = localStorage.getItem(SC_TOKEN_KEY)
  if (t) c.headers.Authorization = `Bearer ${t}`
  return c
})

export const supportConsoleApi = {
  login: (username, password) =>
    axios.post(`${API_BASE}/support-console/login`, { username, password }).then((r) => r.data),
  conversations: () => client.get('/support-console/conversations').then((r) => r.data),
  messages: (visitorId) =>
    client.get('/support-console/messages', { params: { visitor_id: visitorId } }).then((r) => r.data),
  reply: (visitorId, text) =>
    client.post('/support-console/reply', { visitor_id: visitorId, text }).then((r) => r.data),
}
