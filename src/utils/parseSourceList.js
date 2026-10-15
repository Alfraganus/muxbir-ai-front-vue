/** Ko'chirib qo'yilgan matndan manbalar ro'yxati: har qator / bo'shliq / vergul — alohida qiymat. */
export function parseSourceList(text) {
  return (text || '')
    .split(/[\s,;]+/)
    .map((v) => v.trim())
    .filter(Boolean)
}
