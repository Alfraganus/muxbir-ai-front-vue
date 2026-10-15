// Sana/vaqtni ko'rsatish uchun yagona util (publish_at, posted_at va h.k.).
// Vaqt doim kompaniya UTC offset'i bo'yicha ko'rsatiladi (utils/timezone.js).
import { utcToWall, resolveOffsetMin } from './timezone.js'

/** ISO → "12.10.2026 14:05" (kompaniya vaqtida). */
export function formatDateTime(iso, offsetMin) {
  const wall = utcToWall(iso, resolveOffsetMin(offsetMin))
  if (!wall) return ''
  const [d, t] = wall.split('T')
  const [y, m, day] = d.split('-')
  return `${day}.${m}.${y} ${t}`
}

/** ISO → "14:05" (kompaniya vaqtida). */
export function formatTime(iso, offsetMin) {
  const wall = utcToWall(iso, resolveOffsetMin(offsetMin))
  return wall ? wall.split('T')[1] : ''
}

/** Kompaniya vaqtidagi bugungi sana — "YYYY-MM-DD" (date input uchun). */
export function todayWallDate(offsetMin) {
  return utcToWall(new Date(), resolveOffsetMin(offsetMin)).split('T')[0]
}

/**
 * Nisbiy vaqt: "5 daq oldin", "3 soat oldin". 24 soatdan eski — to'liq sana.
 * `tt` — i18n tarjimon: date.justNow / date.minutesAgo / date.hoursAgo kalitlari.
 */
export function formatRelative(iso, offsetMin, tt, now = Date.now()) {
  const ts = new Date(iso).getTime()
  if (Number.isNaN(ts)) return ''
  const diffMin = Math.floor((now - ts) / 60000)
  if (diffMin < 1) return tt('date.justNow')
  if (diffMin < 60) return tt('date.minutesAgo', { n: diffMin })
  if (diffMin < 24 * 60) return tt('date.hoursAgo', { n: Math.floor(diffMin / 60) })
  return formatDateTime(iso, offsetMin)
}

/** ISO → kompaniya vaqtidagi kun "YYYY-MM-DD". */
export function wallDay(iso, offsetMin) {
  const wall = utcToWall(iso, resolveOffsetMin(offsetMin))
  return wall ? wall.split('T')[0] : ''
}

/** "YYYY-MM-DD" → "Bugun" / "Kecha" / "11.10.2026" (date.today / date.yesterday kalitlari). */
export function dayLabel(day, offsetMin, tt) {
  const today = todayWallDate(offsetMin)
  if (day === today) return tt('date.today')
  const [y, m, d] = today.split('-').map(Number)
  const yesterday = new Date(Date.UTC(y, m - 1, d - 1)).toISOString().slice(0, 10)
  if (day === yesterday) return tt('date.yesterday')
  const [dy, dm, dd] = day.split('-')
  return `${dd}.${dm}.${dy}`
}

/** Vaqt bo'yicha tartiblangan ro'yxatni kunlarga bo'ladi (tartib saqlanadi): [{ day, items }]. */
export function groupByWallDay(items, offsetMin, getIso = (i) => i.posted_at) {
  const groups = []
  for (const item of items) {
    const day = wallDay(getIso(item), offsetMin)
    const last = groups[groups.length - 1]
    if (last && last.day === day) last.items.push(item)
    else groups.push({ day, items: [item] })
  }
  return groups
}
