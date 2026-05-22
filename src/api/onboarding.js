import http from './http.js'

export const onboardingApi = {
  getSession: () => http.get('/onboarding/session').then(r => r.data),
  updateStep: (step, data) => http.patch(`/onboarding/step/${step}`, data).then(r => r.data),
}
