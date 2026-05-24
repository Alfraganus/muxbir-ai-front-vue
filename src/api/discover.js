import http from './http.js'

export const discoverApi = {
  /** Barcha mavjud source kanallarni qaytaradi */
  listSources: () => http.get('/sources').then(r => r.data),

  /** AI bilan postlarni izlash */
  run: (companyId, payload) =>
    http.post(`/companies/${companyId}/discover`, payload).then(r => r.data),

  /** Skanerlash animatsiyasi uchun kanallar kesimida candidate post sonlari */
  counts: (companyId, payload) =>
    http.post(`/companies/${companyId}/discover/counts`, payload).then(r => r.data),
}
