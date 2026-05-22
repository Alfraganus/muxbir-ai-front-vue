import http from './http.js'

export const uploadsApi = {
  /** Bitta rasm. Qaytaradi: { url, key } */
  uploadImage: async (file) => {
    const fd = new FormData()
    fd.append('file', file)
    const { data } = await http.post('/uploads/image', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data
  },

  /** Bir nechta rasm (gallery). Qaytaradi: { files: [{url, key}, ...] } */
  uploadImages: async (files) => {
    const fd = new FormData()
    for (const f of files) fd.append('files', f)
    const { data } = await http.post('/uploads/images', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data
  },
}
