import http from './http.js'

export const discoverApi = {
  /** Barcha mavjud source kanallarni qaytaradi */
  listSources: () => http.get('/sources').then(r => r.data),

  /** AI bilan postlarni izlash — manba ko'p bo'lsa skan og'irroq, timeout 3 daqiqa */
  run: (companyId, payload) =>
    http.post(`/companies/${companyId}/discover`, payload, { timeout: 180000 }).then(r => r.data),

  /** Skanerlash animatsiyasi uchun kanallar kesimida candidate post sonlari */
  counts: (companyId, payload) =>
    http.post(`/companies/${companyId}/discover/counts`, payload, { timeout: 180000 }).then(r => r.data),

  /** Oxirgi N ta discover sessiyasi (default: 5) */
  history: (companyId, limit = 5) =>
    http.get(`/companies/${companyId}/discover/history`, { params: { limit } }).then(r => r.data),

  /** Saqlangan discover sessiyasining to'liq snapshot'i */
  historyById: (companyId, historyId) =>
    http.get(`/companies/${companyId}/discover/history/${historyId}`).then(r => r.data),
}
