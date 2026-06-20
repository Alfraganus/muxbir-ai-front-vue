# Muxbir AI — Frontend (Vue) Claude Instructions

Vue 3 (`<script setup>`) + Vite. Bundan keyin **barcha kod SOLID prinsiplariga asoslanib** yozilsin.

> ⚠️ **MAJBURIY:** Har qanday o'zgarishda yangi yoki o'zgargan **barcha UI matni 3 tilda** bo'lishi shart — `uz` (o'zbek lotin), `ru` (rus), `en` (ingliz). Matn hech qachon qattiq (hardcode) yozilmaydi — `tt('kalit')` orqali olinadi va kalit `src/i18n/index.js` dagi **uchala til** bo'limiga qo'shiladi. To'liq qoida pastda — *Internatsionalizatsiya (i18n)* bo'limiga qara.

> **Backend path:** lokal — `D:\personal projects\backend-ai-muxbir`, server — `/var/www/backend-ai-muxbir/`. Backend kerak bo'lganda shu yo'llardan foydalan, har safar foydalanuvchidan so'rama.

---

## Kod yozish prinsiplari — SOLID (Vue uchun)

### S — Single Responsibility (bitta mas'uliyat)
- Har bir komponent **bitta** ishni qilsin. Katta "hamma narsa" komponent (God component) yaratmasin.
- **Komponent ~300 qatordan oshmasin** (`<template>` + `<script>`). Oshsa — kichik child komponentlarga yoki composable'larga ajrat.
- Qayta ishlatiladigan mantiqni (`ref`/`computed`/`watch` bilan) **composable** ga chiqar: `src/composables/useXxx.js`.
- Toza yordamchi funksiyalarni (formatlash, transliteratsiya, validatsiya) **`src/utils/*.js`** ga chiqar — komponent ichida emas.
- API chaqiruvlari faqat `src/api/*.js` da; komponent to'g'ridan-to'g'ri `axios` chaqirmasin.

### O — Open/Closed
- Yangi variant qo'shilganda komponentni har safar o'zgartirma — config/map/prop orqali kengaytir.
- Ro'yxat/dropdown qiymatlarini (modellar, tillar, statuslar) **konstanta/config** sifatida ajrat, JSX/template ichiga qotirma.

### L — Liskov Substitution
- Bir xil rol o'ynaydigan komponentlar bir xil prop/event shartnomasiga rioya qilsin (almashtirsa bo'ladigan bo'lsin).

### I — Interface Segregation
- Komponentga keraksiz ulkan obyekt prop sifatida uzatma — faqat kerakli maydonlarni ber.
- Katta props o'rniga aniq, kichik prop'lar.

### D — Dependency Inversion
- Bolalar komponent global store/parir'ga emas, **prop/emit** orqali bog'lansin (yuqoridan pastga ma'lumot, pastdan yuqoriga event).
- Umumiy holatni Pinia/store yoki composable orqali bering, komponent ichida qotirib qo'ymang.

---

## Tashkillashtirish qoidalari

- `src/views/` — sahifalar (route komponentlari)
- `src/components/` — qayta ishlatiladigan UI komponentlar (mavzu bo'yicha papkalar)
- `src/composables/` — qayta ishlatiladigan reaktiv mantiq (`useXxx`)
- `src/utils/` — toza yordamchi funksiyalar (yon-ta'sirsiz)
- `src/api/` — backend chaqiruvlari
- Takrorlanmaslik (DRY): bir xil mantiq 2+ joyda bo'lsa — composable yoki util ga chiqar.

---

## Umumiy qoidalar

- Til/matnlar o'zbekcha (lotin) — UI bo'yicha mavjud uslubga mos.
- Yangi funksiya yozishdan oldin: "bu qaysi qatlamga tegishli — view, component, composable, util yoki api?" deb o'yla; eng oson yo'l (mavjud katta komponentga yopishtirish) emas.
- `publish_at` kabi sana/vaqt formatlash yagona util'da bo'lsin (har komponentda qayta yozilmasin).

---

## Internatsionalizatsiya (i18n) — MAJBURIY QOIDA

**Barcha UI matni 3 tilda bo'lishi shart: `uz` (o'zbek lotin), `ru` (rus), `en` (ingliz).**

### Qanday ishlaydi
- Barcha tarjimalar `src/i18n/index.js` dagi `DICT` obyektida, nuqtali kalit (`'an.title'`) ko'rinishida.
- Har bir kalit uchun **uchala til** (`uz`, `ru`, `en`) bo'limida yozilishi shart.
- Komponent ichida: `const store = useAppStore()` → `const t = computed(() => store.t)` → `function tt(key, params) { return t.value(key, params) }`.
- Shablonda: `{{ tt('my.key') }}` yoki `:prop="tt('my.key')"`.
- Parametrli matn: `tt('key', { n: 5 })` — DICT da `{n}` yoziladi.

### Har bir o'zgarishda:
1. Yangi UI matn qo'shsang — uni avval `src/i18n/index.js` dagi **uchala til** bo'limiga qo'sh.
2. Template yoki script da hech qachon matnni qattiq (hardcode) yozma — `tt()` orqali ol.
3. Mavjud komponentga i18n qo'shayotganda `computed` import va `tt()` funksiyasi allaqachon borligini tekshir, takrorlamaslik (DRY).

### Kalit nomlash
- Sahifa prefiksi: `an.*` (analytics), `ov.*` (overview), `billing.*`, `queue.*`, `cats.*`, `tz.*`, `settings.*`, `nav.*`, `teb.*` (TariffExpiryBanner), `tsm.*` (TariffSwitchModal), `qpc.*` (QueuePostCard) va hokazo.
- Yangi sahifa/komponent uchun yangi qisqa prefiks tanla va uchala tilda yoz.
