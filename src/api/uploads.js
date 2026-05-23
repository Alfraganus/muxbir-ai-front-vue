import http from './http.js'

export const uploadsApi = {
  /** Bitta rasm. Qaytaradi: { url, key }. scope — papka nomi (default 'posts') */
  uploadImage: async (file, scope) => {
    const fd = new FormData()
    fd.append('file', file)
    const { data } = await http.post('/uploads/image', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
      params: scope ? { scope } : {},
    })
    return data
  },

  /** Bir nechta rasm (gallery). Qaytaradi: { files: [{url, key}, ...] } */
  uploadImages: async (files, scope) => {
    const fd = new FormData()
    for (const f of files) fd.append('files', f)
    const { data } = await http.post('/uploads/images', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
      params: scope ? { scope } : {},
    })
    return data
  },

  /** Folder yaratish */
  createFolder: async (name) => {
    const { data } = await http.post('/uploads/folders', { name })
    return data
  },

  /** Folder + ichidagi barcha fayllarni o'chirish */
  deleteFolder: async (name) => {
    const { data } = await http.delete(`/uploads/folders/${encodeURIComponent(name)}`)
    return data
  },

  /** Joriy kompaniya storage iste'moli + tarif chegarasi (bytes). */
  getUsage: async () => {
    const { data } = await http.get('/uploads/usage')
    return data // { company_id, used_bytes, limit_bytes, has_tariff }
  },

  /** URL ro'yxati bo'yicha bucket'dan o'chiradi va counter'dan ayiradi. */
  deleteByUrls: async (urls) => {
    if (!urls?.length) return { deletedCount: 0, freedBytes: 0 }
    const { data } = await http.delete('/uploads/by-url', { data: { urls } })
    return data
  },

  /**
   * Kompaniya media kutubxonasi.
   * Qaytaradi: { folders: [{name,count,size}], files: [...], total }
   */
  media: async ({ scope, search, limit, offset } = {}) => {
    const params = {}
    if (scope) params.scope = scope
    if (search) params.search = search
    if (limit) params.limit = limit
    if (offset) params.offset = offset
    const { data } = await http.get('/uploads/media', { params })
    return data
  },
}
