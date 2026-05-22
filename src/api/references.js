import http from './http.js'

export const referencesApi = {
  // Business Types
  getBusinessTypes: () => http.get('/references/business-types').then(r => r.data),
  getBusinessType: (id) => http.get(`/references/business-types/${id}`).then(r => r.data),
  createBusinessType: (data) => http.post('/admin/references/business-types', data).then(r => r.data),
  updateBusinessType: (id, data) => http.patch(`/admin/references/business-types/${id}`, data).then(r => r.data),
  deleteBusinessType: (id) => http.delete(`/admin/references/business-types/${id}`),

  // Platforms
  getPlatforms: () => http.get('/references/platforms').then(r => r.data),
  createPlatform: (data) => http.post('/admin/references/platforms', data).then(r => r.data),
  updatePlatform: (id, data) => http.patch(`/admin/references/platforms/${id}`, data).then(r => r.data),
  deletePlatform: (id) => http.delete(`/admin/references/platforms/${id}`),

  // Source Categories
  getSourceCategories: () => http.get('/references/source-categories').then(r => r.data),
  createSourceCategory: (data) => http.post('/admin/references/source-categories', data).then(r => r.data),
  updateSourceCategory: (id, data) => http.patch(`/admin/references/source-categories/${id}`, data).then(r => r.data),
  deleteSourceCategory: (id) => http.delete(`/admin/references/source-categories/${id}`),
}
