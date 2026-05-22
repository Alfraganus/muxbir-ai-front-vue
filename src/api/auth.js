import http from './http.js'

export const authApi = {
  register: (data) => http.post('/auth/register', data).then(r => r.data),
  login: (data) => http.post('/auth/login', data).then(r => r.data),
  googleAuth: (id_token) => http.post('/auth/google', { id_token }).then(r => r.data),
  refresh: (refresh_token) => http.post('/auth/refresh', { refresh_token }).then(r => r.data),
  logout: () => http.post('/auth/logout').then(r => r.data),
  me: () => http.get('/auth/me').then(r => r.data),
  sendMagicLink: (email) => http.post('/auth/magic-link', { email }).then(r => r.data),
  verifyMagicLink: (token) => http.post('/auth/magic-link/verify', { token }).then(r => r.data),
  telegramAuth: (data) => http.post('/auth/telegram', data).then(r => r.data),
}
