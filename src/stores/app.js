import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { createTranslator } from '@/i18n/index.js'
import { getUserRole, isAdminRole } from '@/utils/authRole.js'
import { DEFAULT_UTC_OFFSET_MIN, resolveOffsetMin } from '@/utils/timezone.js'

const SUPPORTED_LANGS = ['uz', 'ru', 'en']
function loadInitialLang() {
  const saved = localStorage.getItem('lang')
  return SUPPORTED_LANGS.includes(saved) ? saved : 'uz'
}

export const useAppStore = defineStore('app', () => {
  const lang = ref(loadInitialLang())
  const darkMode = ref(false)
  const accentColor = ref('#2F6FED')
  const currentPage = ref('overview')
  const companyName = ref('')
  const companyId = ref(null)
  // Workspace UTC offset (minut) — sana/vaqt ko'rsatishda brauzer emas, shu offset
  // ishlatiladi. setCompany orqali yangilanadi; default UTC+5 (Toshkent).
  const companyOffsetMin = ref(DEFAULT_UTC_OFFSET_MIN)
  const langSwitching = ref(false)
  // workspace'ni manual saqlamaymiz — token o'zgargani sayin reactive
  // o'zgarish kerak. Manual override uchun (kelajakda super admin client
  // workspace'iga "impersonate" qilib o'tishi mumkin) opt-in field.
  const _workspaceOverride = ref(null)
  const _authTick = ref(0) // login/logout'da increment qilinadi, computed refresh uchun

  const t = computed(() => createTranslator(lang.value))

  // workspace endi JWT role'dan derive bo'ladi — har render'da JWT
  // o'qiladi, eski sessiyadan "carry-over" bo'lmaydi.
  const workspace = computed(() => {
    if (_workspaceOverride.value) return _workspaceOverride.value
    // eslint-disable-next-line no-unused-vars
    const _ = _authTick.value // reactivity dependency
    return isAdminRole(getUserRole()) ? 'super' : 'client'
  })

  function setLang(l) {
    if (lang.value === l) return
    if (!SUPPORTED_LANGS.includes(l)) return
    // Tanlangan tilni brauzerда saqlaymiz — refresh'dan keyin ham qoladi.
    localStorage.setItem('lang', l)
    // Til almashinish animatsiyasi: veil ko'rinadi → til o'zgaradi → veil yopiladi
    langSwitching.value = true
    setTimeout(() => { lang.value = l }, 180) // veil to'liq paydo bo'lgach til'ni almashtiramiz
    setTimeout(() => { langSwitching.value = false }, 520)
  }
  function setDarkMode(v) {
    darkMode.value = v
    document.documentElement.dataset.theme = v ? 'dark' : 'light'
  }
  function setAccent(color) {
    accentColor.value = color
    document.documentElement.style.setProperty('--accent', color)
  }
  function setWorkspace(ws) {
    // Backward-compat: override sifatida saqlanadi. App.vue ham syncWorkspaceFromRole
    // chaqirishda davom etadi, lekin endi computed JWT'dan kelganda override yo'q bo'lsa.
    _workspaceOverride.value = ws
    currentPage.value = 'overview'
  }
  // Login/logout'da chaqiriladi — workspace computed'ini refresh qiladi.
  function refreshAuthDerivedState() {
    _workspaceOverride.value = null
    _authTick.value++
  }
  function setPage(page) { currentPage.value = page }
  function setCompany(c) {
    if (!c) {
      companyName.value = ''
      companyId.value = null
      companyOffsetMin.value = DEFAULT_UTC_OFFSET_MIN
      return
    }
    companyName.value = c.name || c.display_name || ''
    companyId.value = c.id || null
    companyOffsetMin.value = resolveOffsetMin(c.utc_offset_minutes)
  }
  /** Settings'da offset o'zgartirilganda darhol global holatni yangilash uchun. */
  function setCompanyOffset(min) { companyOffsetMin.value = resolveOffsetMin(min) }

  return { lang, langSwitching, darkMode, accentColor, workspace, companyName, companyId, companyOffsetMin, currentPage, t, setLang, setDarkMode, setAccent, setWorkspace, setPage, setCompany, setCompanyOffset, refreshAuthDerivedState }
})
