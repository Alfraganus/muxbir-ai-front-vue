// API manzili: production build'da same-origin '/api' (nginx 127.0.0.1:4001 ga proxy qiladi),
// development'da to'g'ridan-to'g'ri local backend.
export const API_BASE = import.meta.env.PROD ? '/api' : 'http://localhost:4001'
