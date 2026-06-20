// Workspace (kompaniya) vaqt mintaqasi — toza yordamchi funksiyalar.
//
// Loyiha backend'da har bir kompaniya o'z UTC offset'ini (minutda) saqlaydi
// (`company.utc_offset_minutes`). Bu funksiyalar BROUZER vaqt mintaqasiga
// TAYANMAYDI — barcha hisob faqat berilgan offset orqali bajariladi. Shu bois
// foydalanuvchi brauzeri qaysi zonada bo'lishidan qat'i nazar, "E'lon qilish
// vaqti" va sana ko'rinishi har doim workspace offset'ida chiqadi.
//
// Format kelishuvi:
//   - "wall" (mahalliy) string: 'YYYY-MM-DDTHH:MM' — offset ichidagi devordagi vaqt.
//   - "utc": ISO 8601 string (Z) yoki Date — haqiqiy moment.

export const DEFAULT_UTC_OFFSET_MIN = 300; // UTC+5 (Toshkent)

/** Berilgan qiymatni amaldagi offset minutiga keltiradi (NULL/NaN → default). */
export function resolveOffsetMin(v) {
  const n = Number(v)
  if (v === null || v === undefined || Number.isNaN(n)) return DEFAULT_UTC_OFFSET_MIN
  if (n < -720 || n > 840) return DEFAULT_UTC_OFFSET_MIN
  return Math.trunc(n)
}

function pad(n) { return String(n).padStart(2, '0') }

/** Offset minutni 'UTC+05:00' / 'UTC-04:30' ko'rinishiga aylantiradi. */
export function offsetLabel(offsetMin) {
  const m = resolveOffsetMin(offsetMin)
  const sign = m < 0 ? '-' : '+'
  const abs = Math.abs(m)
  return `UTC${sign}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`
}

/**
 * Settings dropdown uchun standart vaqt mintaqalari ro'yxati.
 * value — offset minutda, label — 'UTC+05:00 · Toshkent' kabi.
 */
const _ZONES = [
  [-720, 'Baker oroli'], [-660, 'Pago-Pago'], [-600, 'Gonolulu'],
  [-540, 'Anchorage'], [-480, 'Los-Anjeles'], [-420, 'Denver'],
  [-360, 'Chikago'], [-300, 'Nyu-York'], [-240, 'Santyago'],
  [-210, 'Sent-Jons'], [-180, 'San-Paulu'], [-60, 'Azor'],
  [0, 'London · UTC'], [60, 'Berlin'], [120, 'Kair'],
  [180, 'Moskva'], [210, 'Tehron'], [240, 'Dubay'],
  [270, 'Kobul'], [300, 'Toshkent'], [330, 'Dehli'],
  [345, 'Katmandu'], [360, 'Dakka'], [390, 'Yangon'],
  [420, 'Bangkok'], [480, 'Pekin'], [540, 'Tokio'],
  [570, 'Adelaida'], [600, 'Sidney'], [660, 'Solomon'],
  [720, 'Oklend'], [780, 'Tonga'], [840, 'Kiritimati'],
]

export const TIMEZONE_OPTIONS = _ZONES.map(([min, city]) => ({
  value: min,
  label: `${offsetLabel(min)} · ${city}`,
}))

/**
 * "wall" (offset ichidagi devordagi vaqt) 'YYYY-MM-DDTHH:MM' ni haqiqiy UTC
 * ISO momentiga aylantiradi. Brauzer zonasiga bog'liq emas.
 */
export function wallToUtcISO(wallStr, offsetMin) {
  if (!wallStr || typeof wallStr !== 'string') return null
  const m = wallStr.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/)
  if (!m) return null
  const off = resolveOffsetMin(offsetMin)
  const wallUtcMs = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], 0, 0)
  return new Date(wallUtcMs - off * 60000).toISOString()
}

/** Date/ISO/wall-string ni offset ichidagi UTC-shifted Date ga aylantiradi. */
function shiftedDate(input, offsetMin) {
  const off = resolveOffsetMin(offsetMin)
  const base = input == null ? new Date() : new Date(input)
  if (Number.isNaN(base.getTime())) return null
  return new Date(base.getTime() + off * 60000)
}

/**
 * Haqiqiy UTC momentni (ISO yoki Date) offset ichidagi "wall" string
 * 'YYYY-MM-DDTHH:MM' ga aylantiradi (DateTimePicker / input uchun).
 */
export function utcToWall(utcInput, offsetMin) {
  const d = shiftedDate(utcInput, offsetMin)
  if (!d) return ''
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`
    + `T${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`
}

/** Hozirgi momentni offset ichidagi devor-komponentlariga ajratadi. */
export function nowWallParts(offsetMin) {
  const d = shiftedDate(null, offsetMin)
  return {
    iso: `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`,
    year: d.getUTCFullYear(),
    month: d.getUTCMonth() + 1,
    date: d.getUTCDate(),
    hour: d.getUTCHours(),
    minute: d.getUTCMinutes(),
    weekday: d.getUTCDay(), // 0=Yak..6=Sha (offset ichidagi hafta kuni)
  }
}
