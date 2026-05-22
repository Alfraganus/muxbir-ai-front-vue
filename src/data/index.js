export const COMPANIES = [
  { id: 'c1',  name: 'Olcha Express',   slug: 'olcha',     owner: 'Sardor Q.',    email: 'billing@olcha.example', plan: 'Scale',      channels: 6,  posts: 1840, mrr: 2_400_000, status: 'active',  joined: '2025-08-12', country: 'UZ', trend: [22,28,31,35,41,49,58,64,70,78,84,91] },
  { id: 'c2',  name: 'Anor Bank',       slug: 'anor',      owner: 'Aziza R.',     email: 'ops@anor.example',      plan: 'Core',       channels: 2,  posts: 940,  mrr: 1_200_000, status: 'active',  joined: '2025-09-03', country: 'UZ', trend: [40,38,41,42,44,46,48,50,52,53,55,58] },
  { id: 'c3',  name: 'Toshkent City',   slug: 'tshkcity',  owner: 'Bekzod E.',    email: 'press@tshkcity.example',plan: 'Enterprise', channels: 14, posts: 4220, mrr: 8_800_000, status: 'active',  joined: '2025-04-19', country: 'UZ', trend: [60,66,70,74,78,81,84,89,92,95,97,99] },
  { id: 'c4',  name: 'UzAuto Press',    slug: 'uzauto',    owner: 'Dilshod K.',   email: 'media@uzauto.example',  plan: 'Scale',      channels: 4,  posts: 1320, mrr: 2_400_000, status: 'trial',   joined: '2026-05-02', country: 'UZ', trend: [10,12,18,24,30,35,40,44,50,56,62,68] },
  { id: 'c5',  name: 'Hududiy 24',      slug: 'hududiy24', owner: 'Madina S.',    email: 'redaksiya@hud24.example',plan: 'Core',      channels: 1,  posts: 420,  mrr: 1_000_000, status: 'active',  joined: '2025-11-21', country: 'UZ', trend: [18,19,20,21,22,23,24,26,28,30,31,33] },
  { id: 'c6',  name: 'Spektr Media',    slug: 'spektr',    owner: 'Nodira G.',    email: 'hello@spektr.example',  plan: 'Scale',      channels: 5,  posts: 1610, mrr: 2_700_000, status: 'overdue', joined: '2025-07-08', country: 'UZ', trend: [55,54,53,50,47,45,42,41,40,38,36,34] },
  { id: 'c7',  name: 'Qishloq Hayoti',  slug: 'qishloq',   owner: 'Otabek H.',    email: 'info@qhayoti.example',  plan: 'Core',       channels: 3,  posts: 760,  mrr: 1_350_000, status: 'active',  joined: '2025-10-14', country: 'UZ', trend: [15,16,18,20,21,22,24,25,27,29,31,33] },
  { id: 'c8',  name: 'Buxoro Today',    slug: 'buxoro',    owner: 'Iroda T.',     email: 'ed@buxoro.example',     plan: 'Starter',    channels: 1,  posts: 180,  mrr: 400_000,   status: 'paused',  joined: '2026-01-30', country: 'UZ', trend: [22,20,19,18,16,15,13,12,11,10,9,8] },
  { id: 'c9',  name: 'Samarqand Voice', slug: 'samarqand', owner: 'Jasur P.',     email: 'press@samvoice.example',plan: 'Scale',      channels: 4,  posts: 1280, mrr: 2_400_000, status: 'active',  joined: '2025-06-15', country: 'UZ', trend: [30,32,35,39,43,47,51,55,58,62,65,69] },
  { id: 'c10', name: 'Toshkent Metro',  slug: 'metro',     owner: 'Komila Y.',    email: 'pr@metro.example',      plan: 'Enterprise', channels: 9,  posts: 2880, mrr: 6_500_000, status: 'active',  joined: '2025-03-04', country: 'UZ', trend: [70,72,74,76,78,80,82,84,86,87,88,90] },
]

export const REVENUE_SERIES = [18.4, 19.1, 20.3, 22.0, 23.6, 25.1, 26.4, 27.9, 29.2, 30.8, 32.1, 34.6]
export const NEW_COMPANIES_SERIES = [3, 5, 4, 6, 5, 8, 7, 9, 7, 11, 10, 13]

export const CHANNELS = [
  { id: 'tg1', name: 'Olcha Daily',        handle: '@olcha_daily',   subs: 184_300, posts7d: 42, errors: 0, status: 'active',   scan: 'Telegram + RSS',     lastPost: '12 daq. oldin', engagement: 6.4, type: 'news' },
  { id: 'tg2', name: 'Olcha Aksiyalar',    handle: '@olcha_promo',   subs: 92_180,  posts7d: 28, errors: 1, status: 'active',   scan: 'Telegram',           lastPost: '1 soat oldin',  engagement: 4.1, type: 'promo' },
  { id: 'tg3', name: 'Bozor Sharhi',       handle: '@bozor_sharhi',  subs: 41_900,  posts7d: 18, errors: 0, status: 'active',   scan: 'Telegram + Facebook',lastPost: '3 soat oldin',  engagement: 8.2, type: 'analytics' },
  { id: 'tg4', name: 'Hududiy Yangiliklar',handle: '@huduud',        subs: 28_200,  posts7d: 22, errors: 0, status: 'scanning', scan: 'Telegram',           lastPost: 'Bugun 09:14',   engagement: 3.6, type: 'news' },
  { id: 'tg5', name: 'Texno Olcha',        handle: '@texno_olcha',   subs: 19_400,  posts7d: 14, errors: 2, status: 'paused',   scan: 'Telegram',           lastPost: '2 kun oldin',   engagement: 5.3, type: 'tech' },
  { id: 'tg6', name: 'Reels & Stories',    handle: '@olcha_reels',   subs: 11_200,  posts7d: 9,  errors: 0, status: 'draft',    scan: '—',                  lastPost: '—',             engagement: 0.0, type: 'social' },
]

export const POSTS = [
  { id: 'p1',  channel: 'Olcha Daily',     handle: '@olcha_daily',  time: '12 daq. oldin', status: 'published', source: 'RIA Uz',    category: 'Yangiliklar',  reach: 18_400, engagement: 6.8, title: 'Yangi xizmat: 90 daqiqada yetkazib berish kengaytirildi', ai: 92 },
  { id: 'p2',  channel: 'Bozor Sharhi',    handle: '@bozor_sharhi', time: '32 daq. oldin', status: 'scheduled', source: 'Reuters',   category: 'Iqtisod',      reach: 0,      engagement: 0,   title: "FED stavkani saqlab qoldi — mahalliy bozorga ta'siri",    ai: 88 },
  { id: 'p3',  channel: 'Olcha Aksiyalar', handle: '@olcha_promo',  time: '1 soat oldin',  status: 'review',    source: 'Manual',   category: 'Aksiya',       reach: 0,      engagement: 0,   title: 'Hafta oxiri — 30% chegirma elektronikaga',                 ai: 76 },
  { id: 'p4',  channel: 'Texno Olcha',     handle: '@texno_olcha',  time: '1 soat oldin',  status: 'failed',    source: 'TheVerge', category: 'Texnologiya',  reach: 0,      engagement: 0,   title: 'Apple WWDC: yangi M5 chipsetlari taqdim etildi',          ai: 81 },
  { id: 'p5',  channel: 'Olcha Daily',     handle: '@olcha_daily',  time: '2 soat oldin',  status: 'published', source: 'Daryo',    category: 'Yangiliklar',  reach: 24_100, engagement: 7.2, title: 'Toshkent metrosida yangi bekat ochildi — fotoreport',    ai: 95 },
  { id: 'p6',  channel: 'Hududiy Yang.',   handle: '@huduud',       time: '3 soat oldin',  status: 'scanning',  source: 'Kun.uz',   category: 'Hudud',        reach: 0,      engagement: 0,   title: "Farg'ona vodiysida ob-havo o'zgarishlari kutilmoqda",    ai: 70 },
  { id: 'p7',  channel: 'Bozor Sharhi',    handle: '@bozor_sharhi', time: '4 soat oldin',  status: 'published', source: 'Bloomberg',category: 'Iqtisod',      reach: 9_840,  engagement: 9.1, title: "So'mning dollarga kursi: oylik tahlil va prognoz",       ai: 90 },
  { id: 'p8',  channel: 'Olcha Aksiyalar', handle: '@olcha_promo',  time: '5 soat oldin',  status: 'draft',     source: 'Manual',   category: 'Aksiya',       reach: 0,      engagement: 0,   title: 'Black Friday — preview kampaniyasi',                      ai: 65 },
  { id: 'p9',  channel: 'Olcha Daily',     handle: '@olcha_daily',  time: '6 soat oldin',  status: 'published', source: 'Gazeta',   category: 'Yangiliklar',  reach: 31_200, engagement: 5.9, title: 'Yangi avtomobil zavodi — birinchi modellar konveyerda', ai: 84 },
  { id: 'p10', channel: 'Texno Olcha',     handle: '@texno_olcha',  time: '8 soat oldin',  status: 'published', source: 'TechCrunch',category:'Texnologiya',  reach: 7_400,  engagement: 6.6, title: "Sun'iy intellekt brauzeri: dastlabki testlar",           ai: 79 },
  { id: 'p11', channel: 'Bozor Sharhi',    handle: '@bozor_sharhi', time: 'Kecha 22:14',   status: 'published', source: 'Reuters',  category: 'Iqtisod',      reach: 11_700, engagement: 7.8, title: "Neft narxi 4-haftada eng yuqori darajaga ko'tarildi",   ai: 87 },
  { id: 'p12', channel: 'Olcha Daily',     handle: '@olcha_daily',  time: 'Kecha 19:02',   status: 'published', source: 'Daryo',    category: 'Yangiliklar',  reach: 22_900, engagement: 6.1, title: 'Toshkent xalqaro kitob ko\'rgazmasi rasman ochildi',    ai: 91 },
]

export const TARIFF_DIMS = [
  { key: 'channels', label: { uz: 'Telegram kanallar', ru: 'Telegram каналов', en: 'Telegram channels' }, unit: { uz: 'kanal', ru: 'канал', en: 'channels' }, min: 1,   max: 50,   step: 1,   baseQty: 1,   pricePerUnit: 250_000 },
  { key: 'posts',    label: { uz: 'Oyiga post miqdori', ru: 'Постов в месяц', en: 'Posts per month' },    unit: { uz: 'post',  ru: 'пост',  en: 'posts' },   min: 100, max: 10000,step: 100, baseQty: 500, pricePerUnit: 800 },
  { key: 'tokens',   label: { uz: 'AI tokenlar', ru: 'AI токенов', en: 'AI tokens' },                    unit: { uz: '1k tok',ru: '1k ток',en: '1k tok' },  min: 50,  max: 2000, step: 50,  baseQty: 200, pricePerUnit: 1_500 },
  { key: 'seats',    label: { uz: 'Komanda joylari', ru: 'Места команды', en: 'Team seats' },           unit: { uz: 'joy',   ru: 'место', en: 'seats' },   min: 1,   max: 50,   step: 1,   baseQty: 2,   pricePerUnit: 90_000 },
  { key: 'storage',  label: { uz: 'Saqlash (GB)', ru: 'Хранилище (GB)', en: 'Storage (GB)' },           unit: { uz: 'GB',    ru: 'GB',    en: 'GB' },      min: 5,   max: 500,  step: 5,   baseQty: 20,  pricePerUnit: 8_000 },
]

export const TARIFF_ADDONS = [
  { key: 'fb',       label: { uz: 'Facebook scan',             ru: 'Facebook сканер',             en: 'Facebook scan' },             price: 350_000, enabled: false },
  { key: 'ig',       label: { uz: 'Instagram posting (soon)',   ru: 'Instagram постинг (soon)',    en: 'Instagram posting (soon)' },  price: 450_000, enabled: false, soon: true },
  { key: 'priority', label: { uz: 'Priority support',           ru: 'Приоритетная поддержка',      en: 'Priority support' },          price: 200_000, enabled: false },
  { key: 'branding', label: { uz: 'Custom branding',            ru: 'Кастомный брендинг',          en: 'Custom branding' },           price: 500_000, enabled: false },
]

export const PLAN_PRESETS = [
  { id: 'starter',    name: 'Starter',    color: 'var(--muted)',   qty: { channels: 1, posts: 200,  tokens: 50,   seats: 1,  storage: 5   }, addons: [] },
  { id: 'core',       name: 'Core',       color: 'var(--accent)',  qty: { channels: 1, posts: 500,  tokens: 150,  seats: 2,  storage: 10  }, addons: [] },
  { id: 'scale',      name: 'Scale',      color: 'var(--violet)',  qty: { channels: 4, posts: 2000, tokens: 600,  seats: 5,  storage: 50  }, addons: ['fb', 'priority'] },
  { id: 'enterprise', name: 'Enterprise', color: 'var(--success)', qty: { channels: 12,posts: 6000, tokens: 1500, seats: 15, storage: 200 }, addons: ['fb', 'priority', 'branding'] },
]

export const AUDIT = [
  { time: '12:14', who: 'Sardor Q.',   action: 'Channel @olcha_daily ulandi',           tag: 'channel' },
  { time: '11:58', who: 'Aziza R.',    action: "Tarif Core → Scale ga ko'tarildi",       tag: 'billing' },
  { time: '11:31', who: 'system',      action: 'Auto-scan @bozor_sharhi: 42 yangi post', tag: 'scan' },
  { time: '10:47', who: 'Bekzod E.',   action: 'Editor Madina S. ga taklif yuborildi',   tag: 'team' },
  { time: '10:12', who: 'Spektr Media',action: "To'lov muddati o'tdi — 2 700 000 so'm", tag: 'overdue' },
  { time: '09:42', who: 'Nodira G.',   action: "Yangi tarif 'Scale +FB' yaratdi",        tag: 'tariff' },
  { time: '08:59', who: 'system',      action: 'Telegram API token yangilandi',           tag: 'system' },
]

export const HEATMAP = Array.from({ length: 7 }, (_, day) =>
  Array.from({ length: 24 }, (_, h) => {
    if (h < 6) return Math.floor(Math.random() * 2)
    if (h >= 6 && h < 9) return 3 + Math.floor(Math.random() * 3)
    if (h >= 9 && h < 12) return 5 + Math.floor(Math.random() * 4)
    if (h >= 12 && h < 18) return 6 + Math.floor(Math.random() * 4)
    if (h >= 18 && h < 22) return 7 + Math.floor(Math.random() * 3)
    return 2 + Math.floor(Math.random() * 3)
  })
)

export const PERMISSION_GROUPS = [
  { key: 'channels', label: 'Kanallar', perms: [
    { key: 'channels.view',    label: "Ko'rish" },
    { key: 'channels.connect', label: 'Yangi kanal ulash' },
    { key: 'channels.edit',    label: 'Sozlash va tahrirlash' },
    { key: 'channels.delete',  label: "O'chirish" },
  ]},
  { key: 'posts', label: 'Postlar', perms: [
    { key: 'posts.view',     label: "Ko'rish" },
    { key: 'posts.create',   label: 'Yaratish va AI generatsiya' },
    { key: 'posts.publish',  label: 'Chop etish' },
    { key: 'posts.schedule', label: "Reja qo'yish" },
    { key: 'posts.delete',   label: "O'chirish" },
  ]},
  { key: 'team', label: 'Komanda va kirish', perms: [
    { key: 'team.invite', label: "A'zolarni taklif qilish" },
    { key: 'team.role',   label: "Rollarni o'zgartirish" },
    { key: 'team.remove', label: 'Komandadan chiqarish' },
  ]},
  { key: 'billing', label: "Tarif va to'lov", perms: [
    { key: 'billing.view',   label: 'Hisob-kitob va fakturalar' },
    { key: 'billing.change', label: "Tarifni o'zgartirish" },
    { key: 'billing.pay',    label: "To'lov usulini boshqarish" },
  ]},
  { key: 'settings', label: 'Sozlamalar', perms: [
    { key: 'settings.brand', label: 'Brending va workspace' },
    { key: 'settings.api',   label: 'API va integratsiyalar' },
    { key: 'settings.audit', label: 'Audit logni ko\'rish' },
  ]},
]

export const ROLES = [
  { id: 'owner',  name: 'Egasi',      tone: 'violet',  desc: "To'liq nazorat — billing va workspace egasi",        grants: '*', builtin: true },
  { id: 'admin',  name: 'Admin',      tone: 'accent',  desc: 'Kompaniyani boshqaradi, billingdan tashqari',         grants: new Set(['channels.view','channels.connect','channels.edit','channels.delete','posts.view','posts.create','posts.publish','posts.schedule','posts.delete','team.invite','team.role','team.remove','billing.view','settings.brand','settings.api','settings.audit']), builtin: true },
  { id: 'editor', name: 'Editor',     tone: 'success', desc: 'Kanal va postlarni boshqaradi',                       grants: new Set(['channels.view','channels.edit','posts.view','posts.create','posts.publish','posts.schedule','posts.delete']), builtin: true },
  { id: 'writer', name: 'Yozuvchi',   tone: 'warn',    desc: 'Faqat post yaratadi, chop etish admin tomonidan',     grants: new Set(['channels.view','posts.view','posts.create']), builtin: true },
  { id: 'viewer', name: 'Kuzatuvchi', tone: 'muted',   desc: "Faqat o'qish — analytics va postlar",                 grants: new Set(['channels.view','posts.view','billing.view','settings.audit']), builtin: true },
]

export const ALL_PERMS = PERMISSION_GROUPS.flatMap(g => g.perms.map(p => p.key))

export function hasGrant(role, permKey) {
  if (role.grants === '*') return true
  return role.grants.has(permKey)
}

export const PLATFORM_USERS = [
  { id: 'u1',  name: 'Sardor Qodirov',    email: 'sardor@olcha.uz',    company: 'Olcha Express',  role: 'owner',  status: 'active',  last: '2 daq. oldin',  mfa: true,  joined: '2025-08-12' },
  { id: 'u2',  name: 'Aziza Rahimova',    email: 'aziza@anor.uz',      company: 'Anor Bank',      role: 'owner',  status: 'active',  last: '12 daq. oldin', mfa: true,  joined: '2025-09-03' },
  { id: 'u3',  name: 'Madina Saidova',    email: 'madina@olcha.uz',    company: 'Olcha Express',  role: 'editor', status: 'active',  last: '27 daq. oldin', mfa: false, joined: '2025-10-04' },
  { id: 'u4',  name: 'Bekzod Eshonov',    email: 'bekzod@tshkcity.uz', company: 'Toshkent City',  role: 'owner',  status: 'active',  last: '1 soat oldin',  mfa: true,  joined: '2025-04-19' },
  { id: 'u5',  name: "Nodira G'aniyeva",  email: 'nodira@spektr.uz',   company: 'Spektr Media',   role: 'admin',  status: 'active',  last: '3 soat oldin',  mfa: true,  joined: '2025-07-08' },
  { id: 'u6',  name: 'Dilshod Karimov',   email: 'dilshod@uzauto.uz',  company: 'UzAuto Press',   role: 'owner',  status: 'active',  last: '5 soat oldin',  mfa: false, joined: '2026-05-02' },
  { id: 'u7',  name: 'Otabek Hamdamov',   email: 'otabek@qhayoti.uz',  company: 'Qishloq Hayoti', role: 'owner',  status: 'invited', last: '—',             mfa: false, joined: '2026-05-15' },
  { id: 'u8',  name: 'Komila Yoldosheva', email: 'komila@metro.uz',    company: 'Toshkent Metro', role: 'admin',  status: 'active',  last: '8 soat oldin',  mfa: true,  joined: '2025-03-04' },
  { id: 'u9',  name: 'Jasur Pirmatov',    email: 'jasur@samvoice.uz',  company: 'Samarqand Voice',role: 'editor', status: 'active',  last: 'Kecha',         mfa: true,  joined: '2025-06-15' },
  { id: 'u10', name: "Iroda To'xtaeva",   email: 'iroda@buxoro.uz',    company: 'Buxoro Today',   role: 'writer', status: 'paused',  last: '5 kun oldin',   mfa: false, joined: '2026-01-30' },
  { id: 's1',  name: 'Alisher Yusupov',   email: 'alisher@muxbir.ai',  company: 'Muxbir AI HQ',   role: 'admin',  status: 'active',  last: '5 daq. oldin',  mfa: true,  joined: '2024-12-01', staff: true, staffRole: 'support' },
  { id: 's2',  name: 'Shahnoza R.',       email: 'shahnoza@muxbir.ai', company: 'Muxbir AI HQ',   role: 'admin',  status: 'active',  last: '16 daq. oldin', mfa: true,  joined: '2025-02-14', staff: true, staffRole: 'billing' },
]

export const TEAM = [
  { id: 't1', name: 'Sardor Qodirov',    email: 'sardor@olcha.uz',   role: 'owner',  status: 'active',  last: 'Hozir online',  joined: '2025-08-12', channels: 'Hammasi' },
  { id: 't2', name: 'Madina Saidova',    email: 'madina@olcha.uz',   role: 'admin',  status: 'active',  last: '12 daq. oldin', joined: '2025-10-04', channels: 'Hammasi' },
  { id: 't3', name: 'Jasur Pirmatov',    email: 'jasur@olcha.uz',    role: 'editor', status: 'active',  last: '1 soat oldin',  joined: '2025-11-21', channels: '@olcha_daily, @olcha_promo' },
  { id: 't4', name: 'Komila Yoldosheva', email: 'komila@olcha.uz',   role: 'editor', status: 'active',  last: '3 soat oldin',  joined: '2026-01-15', channels: '@bozor_sharhi' },
  { id: 't5', name: 'Otabek Hamdamov',   email: 'otabek@olcha.uz',   role: 'writer', status: 'active',  last: 'Kecha 19:32',   joined: '2026-02-10', channels: '@huduud' },
  { id: 't6', name: "Iroda To'xtaeva",   email: 'iroda@olcha.uz',    role: 'writer', status: 'invited', last: '—',             joined: '2026-05-12', channels: '—' },
  { id: 't7', name: 'Bekzod Eshonov',    email: 'bekzod.audit@x.uz', role: 'viewer', status: 'active',  last: '2 kun oldin',   joined: '2026-03-01', channels: "Hammasi (faqat o'qish)" },
]
