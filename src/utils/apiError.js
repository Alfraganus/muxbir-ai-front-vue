/** Axios xatosidan foydalanuvchiga ko'rsatiladigan matn (backend message yoki fallback). */
export function apiErrorMessage(err, fallback) {
  const msg = err?.response?.data?.message
  if (Array.isArray(msg)) return msg.join(', ')
  return typeof msg === 'string' && msg ? msg : fallback
}
