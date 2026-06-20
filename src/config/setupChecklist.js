/**
 * Setup checklist konfiguratsiyasi — backend `setup-status` qaytaradigan har bir
 * `check.key` uchun ko'rinadigan matn, ikon va tuzatish havolasi.
 *
 * Open/Closed: yangi bosqich qo'shilganda komponentni emas, shu xaritani
 * kengaytir. Tartib `order` bilan boshqariladi. `count` bo'lsa label oxiriga
 * qo'shib ko'rsatiladi (masalan "Manbalar (3)").
 */
export const SETUP_CHECK_META = {
  telegram_api: {
    order: 1,
    icon: 'Telegram',
    title: 'Telegram API ulanish',
    hint: 'my.telegram.org dan api_id va api_hash kiritilsin',
    link: '/client/telegram-api',
  },
  telegram_session: {
    order: 2,
    icon: 'Shield',
    title: 'Telegramga kirish (login)',
    hint: 'Telefon raqam + kod orqali session faollashtirilsin',
    link: '/client/telegram-api',
  },
  bot: {
    order: 3,
    icon: 'Robot',
    title: '@muxbirAiBot ulanishi',
    hint: 'Muxbir AI bot online — ulanishi tekshirib turiladi',
    // Tizim bot health — foydalanuvchi sahifasiga havola yo'q
    link: null,
  },
  channel: {
    order: 4,
    icon: 'Send',
    title: 'Kanal qo\'shish',
    hint: 'Kamida bitta Telegram kanal ulansin',
    link: '/client/channels',
  },
  channel_bot_admin: {
    order: 5,
    icon: 'Layers',
    title: 'Botni kanalga admin qilish',
    hint: 'Kamida bitta kanalda @muxbirAiBot admin bo\'lsin',
    link: '/client/channels',
  },
  sources: {
    order: 6,
    icon: 'Database',
    title: 'Kanalga manba ulash',
    hint: 'Kanalga kamida bitta faol manba qo\'shilsin',
    link: '/client/channels',
  },
  telegram_chats: {
    order: 7,
    icon: 'Users',
    title: 'Telegram chat ID kiritish',
    hint: 'Tasdiq xabarlari boradigan chat ID kiritilsin',
    link: '/client/telegram-chats',
  },
  timezone: {
    order: 8,
    icon: 'Globe',
    title: 'Vaqt mintaqasi tanlash',
    hint: 'Workspace UTC offset tanlansin (publish vaqti va avto-post jadvali shunga bog\'liq)',
    link: '/client/settings?tab=timezone',
  },
}

/** Noma'lum key kelsa ham komponent buzilmasin uchun zaxira meta. */
export const SETUP_CHECK_FALLBACK = {
  order: 99,
  icon: 'Dot',
  title: 'Sozlama',
  hint: '',
  link: null,
}
