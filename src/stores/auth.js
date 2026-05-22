import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '@/api/auth.js'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const accessToken = ref(localStorage.getItem('access_token') || null)
  const refreshToken = ref(localStorage.getItem('refresh_token') || null)
  const loading = ref(false)
  const error = ref(null)

  const isLoggedIn = computed(() => !!accessToken.value)

  function setTokens(data) {
    accessToken.value = data.access_token
    refreshToken.value = data.refresh_token
    user.value = data.user
    localStorage.setItem('access_token', data.access_token)
    localStorage.setItem('refresh_token', data.refresh_token)
  }

  function clearTokens() {
    accessToken.value = null
    refreshToken.value = null
    user.value = null
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
  }

  async function register(dto) {
    loading.value = true
    error.value = null
    try {
      const data = await authApi.register(dto)
      setTokens(data)
      return data
    } catch (e) {
      error.value = e.response?.data?.message || "Xatolik yuz berdi"
      throw e
    } finally {
      loading.value = false
    }
  }

  async function login(dto) {
    loading.value = true
    error.value = null
    try {
      const data = await authApi.login(dto)
      setTokens(data)
      return data
    } catch (e) {
      error.value = e.response?.data?.message || "Login yoki parol noto'g'ri"
      throw e
    } finally {
      loading.value = false
    }
  }

  async function logout() {
    try { await authApi.logout() } catch {}
    clearTokens()
  }

  async function fetchMe() {
    if (!accessToken.value) return null
    try {
      const me = await authApi.me()
      user.value = me
      return me
    } catch { return null }
  }

  return { user, accessToken, refreshToken, loading, error, isLoggedIn, register, login, logout, fetchMe, setTokens, clearTokens }
})
