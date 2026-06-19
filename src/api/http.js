import axios from 'axios'
import { API_BASE } from './base.js'

const http = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
})

// Request interceptor — JWT token qo'shish
http.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  const lang = localStorage.getItem('lang') || 'uz'
  config.headers['Accept-Language'] = lang
  return config
})

// Response interceptor — 401 bo'lsa refresh
http.interceptors.response.use(
  (r) => r,
  async (err) => {
    if (err.response?.status === 401 && !err.config._retry) {
      err.config._retry = true
      try {
        const rt = localStorage.getItem('refresh_token')
        if (rt) {
          const { data } = await axios.post(`${API_BASE}/auth/refresh`, { refresh_token: rt })
          localStorage.setItem('access_token', data.access_token)
          err.config.headers.Authorization = `Bearer ${data.access_token}`
          return http(err.config)
        }
      } catch {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        window.location.hash = '#/signin'
      }
    }
    // Obuna faol emas (backend guard) — paywall'ga yo'naltiramiz (loop'siz).
    if (err.response?.status === 402 && err.response?.data?.code === 'SUBSCRIPTION_INACTIVE') {
      if (!window.location.hash.startsWith('#/client/activate')) {
        window.location.hash = '#/client/activate'
      }
    }
    return Promise.reject(err)
  },
)

export default http
