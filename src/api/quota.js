import http from './http.js'

export const quotaApi = {
  /** Tarif nomi, kunlik/oylik post limiti va kredit holati */
  get: (companyId) =>
    http.get(`/companies/${companyId}/quota`).then(r => r.data),
}
