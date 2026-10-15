// Kun radari qo'llab-quvvatlaydigan manba platformalari.
// Yangi platforma — shu ro'yxatga bitta yozuv (backend: radar-platforms.config.ts).
export const RADAR_PLATFORMS = [
  { slug: 'telegram', icon: 'Telegram', labelKey: 'radarPlatform.telegram', placeholderKey: 'radarPlatform.telegramPh' },
  { slug: 'website',  icon: 'Globe',    labelKey: 'radarPlatform.website',  placeholderKey: 'radarPlatform.websitePh' },
  { slug: 'twitter',  icon: 'X',        labelKey: 'radarPlatform.twitter',  placeholderKey: 'radarPlatform.twitterPh' },
]

export function radarPlatform(slug) {
  return RADAR_PLATFORMS.find((p) => p.slug === slug) || RADAR_PLATFORMS[1]
}
