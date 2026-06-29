import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '@/api/auth.js'

// Impersonatsiya (admin → kompaniya) uchun zaxira localStorage kalitlari.
// Admin tokenlari shu yerda saqlanadi, kompaniya tokenlari esa asosiy
// access_token/refresh_token'ni egallaydi — shunda admin keyin qaytib kira oladi.
const IMP_ADMIN_ACCESS = 'imp_admin_access'
const IMP_ADMIN_REFRESH = 'imp_admin_refresh'
const IMP_COMPANY_NAME = 'imp_company_name'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const accessToken = ref(localStorage.getItem('access_token') || null)
  const refreshToken = ref(localStorage.getItem('refresh_token') || null)
  const loading = ref(false)
  const error = ref(null)
  // Impersonatsiya holatida ko'rsatiladigan kompaniya nomi (null = impersonatsiya yo'q)
  const impersonatedName = ref(localStorage.getItem(IMP_COMPANY_NAME) || null)

  const isLoggedIn = computed(() => !!accessToken.value)
  const isImpersonating = computed(() => !!impersonatedName.value)

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
    clearImpersonationBackup()
  }

  function clearImpersonationBackup() {
    impersonatedName.value = null
    localStorage.removeItem(IMP_ADMIN_ACCESS)
    localStorage.removeItem(IMP_ADMIN_REFRESH)
    localStorage.removeItem(IMP_COMPANY_NAME)
  }

  /**
   * Admin → kompaniya impersonatsiyasini boshlaydi: joriy admin tokenlarini
   * zaxiraga oladi va kompaniya tokenlariga o'tadi. App.vue'dagi accessToken
   * kuzatuvchisi workspace'ni, kompaniya va kvotani avtomatik qayta yuklaydi.
   */
  function startImpersonation(data, companyName) {
    localStorage.setItem(IMP_ADMIN_ACCESS, accessToken.value || '')
    localStorage.setItem(IMP_ADMIN_REFRESH, refreshToken.value || '')
    localStorage.setItem(IMP_COMPANY_NAME, companyName || '')
    impersonatedName.value = companyName || ''
    setTokens(data)
  }

  /** Impersonatsiyadan chiqib, zaxiradagi admin tokenlariga qaytadi. */
  function stopImpersonation() {
    const access = localStorage.getItem(IMP_ADMIN_ACCESS)
    const refresh = localStorage.getItem(IMP_ADMIN_REFRESH)
    clearImpersonationBackup()
    if (access && refresh) {
      setTokens({ access_token: access, refresh_token: refresh, user: null })
      return true
    }
    return false
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
      // Backend ba'zan { user: {...} } shaklida qaytaradi
      const u = me?.user && typeof me.user === 'object' ? me.user : me
      user.value = u
      return u
    } catch { return null }
  }

  return { user, accessToken, refreshToken, loading, error, isLoggedIn, isImpersonating, impersonatedName, register, login, logout, fetchMe, setTokens, clearTokens, startImpersonation, stopImpersonation }
})
