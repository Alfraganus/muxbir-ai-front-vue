import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { createTranslator } from '@/i18n/index.js'

export const useAppStore = defineStore('app', () => {
  const lang = ref('uz')
  const darkMode = ref(false)
  const accentColor = ref('#2F6FED')
  const workspace = ref('client')
  const currentPage = ref('overview')
  const companyName = ref('')
  const companyId = ref(null)
  const langSwitching = ref(false)

  const t = computed(() => createTranslator(lang.value))

  function setLang(l) {
    if (lang.value === l) return
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
    workspace.value = ws
    currentPage.value = 'overview'
  }
  function setPage(page) { currentPage.value = page }
  function setCompany(c) {
    if (!c) { companyName.value = ''; companyId.value = null; return }
    companyName.value = c.name || c.display_name || ''
    companyId.value = c.id || null
  }

  return { lang, langSwitching, darkMode, accentColor, workspace, companyName, companyId, currentPage, t, setLang, setDarkMode, setAccent, setWorkspace, setPage, setCompany }
})
