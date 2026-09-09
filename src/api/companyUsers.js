import http from './http.js'

export const companyUsersApi = {
  list: (companyId) =>
    http.get(`/companies/${companyId}/users`).then(r => r.data),

  create: (companyId, payload) =>
    http.post(`/companies/${companyId}/users`, payload).then(r => r.data),

  update: (companyId, memberId, payload) =>
    http.patch(`/companies/${companyId}/users/${memberId}`, payload).then(r => r.data),

  remove: (companyId, memberId) =>
    http.delete(`/companies/${companyId}/users/${memberId}`).then(r => r.data),
}
