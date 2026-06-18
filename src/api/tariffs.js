import http from './http.js'

export const tariffsApi = {
  list: () => http.get('/tariffs').then((r) => r.data),
  listAll: () => http.get('/tariffs', { params: { all: 1 } }).then((r) => r.data),
  getOne: (id) => http.get(`/tariffs/${id}`).then((r) => r.data),
  create: (data) => http.post('/tariffs', data).then((r) => r.data),
  createBuilder: (data) => http.post('/tariffs/builder', data).then((r) => r.data),
  update: (id, data) => http.patch(`/tariffs/${id}`, data).then((r) => r.data),
  remove: (id) => http.delete(`/tariffs/${id}`).then((r) => r.data),
  getFeatures: (id) => http.get(`/tariffs/${id}/features`).then((r) => r.data),
}
