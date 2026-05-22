import http from './http.js'

export const companiesApi = {
  create: (data) => http.post('/companies', data).then(r => r.data),
  getMy: () => http.get('/companies/my').then(r => r.data),
  getOne: (id) => http.get(`/companies/${id}`).then(r => r.data),
  update: (id, data) => http.patch(`/companies/${id}`, data).then(r => r.data),
}
