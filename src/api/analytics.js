import http from './http.js'

export const analyticsApi = {
  /** Kompaniya analitikasi — statistika + chart ma'lumotlari */
  overview: (companyId) =>
    http.get(`/companies/${companyId}/analytics`).then(r => r.data),

  /** Dashboard (overview ekrani) — analitikadan farqli kesimlar */
  dashboard: (companyId) =>
    http.get(`/companies/${companyId}/analytics/dashboard`).then(r => r.data),
}
