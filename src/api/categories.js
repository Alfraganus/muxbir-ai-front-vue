import http from './http.js'

/**
 * Per-company kategoriya spravochnigi CRUD.
 * Backend: /companies/:companyId/categories
 */
export const categoriesApi = {
  list: (companyId) =>
    http.get(`/companies/${companyId}/categories`).then(r => r.data),

  create: (companyId, dto) =>
    http.post(`/companies/${companyId}/categories`, dto).then(r => r.data),

  update: (companyId, id, dto) =>
    http.patch(`/companies/${companyId}/categories/${id}`, dto).then(r => r.data),

  remove: (companyId, id) =>
    http.delete(`/companies/${companyId}/categories/${id}`).then(r => r.data),
}
