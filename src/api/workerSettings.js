import http from './http.js'

export const workerSettingsApi = {
  get: () => http.get('/admin/worker-settings').then(r => r.data),
  update: (data) => http.patch('/admin/worker-settings', data).then(r => r.data),
}
