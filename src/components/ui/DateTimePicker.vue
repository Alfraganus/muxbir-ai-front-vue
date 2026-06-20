<template>
  <div class="dtp">
    <!-- 7 kunlik tezkor tanlov -->
    <div class="dtp-days">
      <button v-for="d in days" :key="d.iso" type="button"
        class="dtp-day"
        :class="{ active: d.iso === selectedDate }"
        @click="setDate(d.iso)">
        <span class="dtp-day-label">{{ d.label }}</span>
        <span class="dtp-day-date">{{ d.short }}</span>
      </button>
    </div>

    <!-- Vaqt (24 soat) -->
    <div class="dtp-time">
      <div class="dtp-time-group">
        <button type="button" class="dtp-time-arrow" @click="bumpHour(1)" aria-label="hour up">▲</button>
        <input class="dtp-time-input" type="text" inputmode="numeric" maxlength="2"
          :value="hh" @input="onHourInput" @blur="normalizeHour"/>
        <button type="button" class="dtp-time-arrow" @click="bumpHour(-1)" aria-label="hour down">▼</button>
      </div>
      <span class="dtp-time-colon">:</span>
      <div class="dtp-time-group">
        <button type="button" class="dtp-time-arrow" @click="bumpMinute(1)" aria-label="minute up">▲</button>
        <input class="dtp-time-input" type="text" inputmode="numeric" maxlength="2"
          :value="mm" @input="onMinuteInput" @blur="normalizeMinute"/>
        <button type="button" class="dtp-time-arrow" @click="bumpMinute(-1)" aria-label="minute down">▼</button>
      </div>
      <span class="dtp-time-mode">{{ tt('dateTimePicker.mode24h') }}</span>
      <button v-if="modelValue" type="button" class="dtp-clear" @click="clear" :title="tt('dateTimePicker.clear')">
        ×
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { DEFAULT_UTC_OFFSET_MIN, nowWallParts } from '@/utils/timezone.js'
import { useAppStore } from '@/stores/app.js'

const store = useAppStore()
const t = computed(() => store.t)
function tt(key, params) { return t.value(key, params) }

const props = defineProps({
  modelValue: { type: String, default: '' }, // 'YYYY-MM-DDTHH:MM' (workspace offset ichidagi devor-vaqti)
  // Workspace UTC offset (minut). "Bugun/hozir" chegaralari shu offset bo'yicha
  // hisoblanadi — brauzer vaqt mintaqasiga tayanmaymiz.
  offsetMinutes: { type: Number, default: DEFAULT_UTC_OFFSET_MIN },
})
const emit = defineEmits(['update:modelValue'])

function pad(n) { return String(n).padStart(2, '0') }
// Hozirgi vaqt — workspace offset ichidagi devor-komponentlari.
function nowParts() { return nowWallParts(props.offsetMinutes) }

// 7 kunlik massiv (bugun + 6 keyingi) — offset ichidagi "bugun"dan boshlab.
const DAY_NAMES = computed(() => [
  tt('dateTimePicker.daySun'),
  tt('dateTimePicker.dayMon'),
  tt('dateTimePicker.dayTue'),
  tt('dateTimePicker.dayWed'),
  tt('dateTimePicker.dayThu'),
  tt('dateTimePicker.dayFri'),
  tt('dateTimePicker.daySat'),
]) // Yak=0..Sha=6
const days = computed(() => {
  const out = []
  const np = nowParts()
  // UTC-asosli sana (faqat kun arifmetikasi uchun — soat/zona ta'sir qilmaydi).
  const base = new Date(Date.UTC(np.year, np.month - 1, np.date))
  for (let i = 0; i < 7; i++) {
    const d = new Date(base)
    d.setUTCDate(base.getUTCDate() + i)
    const iso = `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`
    const label = i === 0 ? tt('dateTimePicker.today') : i === 1 ? tt('dateTimePicker.tomorrow') : DAY_NAMES.value[d.getUTCDay()]
    const short = `${pad(d.getUTCDate())}.${pad(d.getUTCMonth() + 1)}`
    out.push({ iso, label, short })
  }
  return out
})

// Parse v-model
function parse(v) {
  // Bo'sh model — default sifatida hozirgi soat:daqiqani ko'rsatamiz
  // (foydalanuvchi hozirgi paytdan oldinroq vaqt qo'ya olmaydi)
  if (!v || typeof v !== 'string') {
    const np = nowParts()
    return { date: '', hh: pad(np.hour), mm: pad(np.minute) }
  }
  const m = v.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})/)
  if (!m) {
    const np = nowParts()
    return { date: '', hh: pad(np.hour), mm: pad(np.minute) }
  }
  return { date: m[1], hh: m[2], mm: m[3] }
}

// Initial values parse'dan keladi — bo'sh model bo'lsa hozirgi vaqt
const _initial = parse(props.modelValue)
const selectedDate = ref(_initial.date)
const hh = ref(_initial.hh)
const mm = ref(_initial.mm)

// Internal flag — emitValue dan keyin keladigan modelValue watch'ni
// inkor qilish uchun (aks holda input'ga yozayotgan raqamlar yutilib ketadi).
let lastEmitted = ''

/**
 * Tanlangan sana bugun bo'lsa minimal vaqt — hozirgi soat va daqiqa.
 * Boshqa kunlarda — 00:00 (chegara yo'q).
 */
function getMinTime(iso) {
  const np = nowParts()
  if (iso !== np.iso) return { h: 0, m: 0 }
  return { h: np.hour, m: np.minute }
}
/** Berilgan (h, m) ni shu sana uchun ruxsat etilgan minimumga clamp qiladi. */
function clampToMin(iso, h, m) {
  const min = getMinTime(iso)
  if (h < min.h) return { h: min.h, m: min.m }
  if (h === min.h && m < min.m) return { h: min.h, m: min.m }
  return { h, m }
}

function syncFromModel() {
  if (props.modelValue === lastEmitted) return // o'zimiz emit qildik, sync shart emas
  const p = parse(props.modelValue)
  selectedDate.value = p.date
  hh.value = p.hh
  mm.value = p.mm
}
syncFromModel()
watch(() => props.modelValue, syncFromModel)

function emitValue() {
  if (!selectedDate.value) {
    lastEmitted = ''
    emit('update:modelValue', '')
    return
  }
  const v = `${selectedDate.value}T${hh.value}:${mm.value}`
  lastEmitted = v
  emit('update:modelValue', v)
}

function setDate(iso) {
  selectedDate.value = iso
  // Sanani tanlaganda vaqtni clamp qilamiz: bugun bo'lsa hozirdan kechroq
  const np = nowParts()
  let h = parseInt(hh.value || pad(np.hour), 10)
  let m = parseInt(mm.value || pad(np.minute), 10)
  if (isNaN(h)) h = np.hour
  if (isNaN(m)) m = np.minute
  const c = clampToMin(iso, h, m)
  hh.value = pad(c.h)
  mm.value = pad(c.m)
  emitValue()
}

function onHourInput(e) {
  const v = e.target.value.replace(/\D/g, '').slice(0, 2)
  hh.value = v
  if (selectedDate.value) {
    const rawH = Math.max(0, Math.min(23, parseInt(v || '0', 10) || 0))
    const rawM = parseInt(mm.value || '0', 10) || 0
    const c = clampToMin(selectedDate.value, rawH, rawM)
    const v2 = `${selectedDate.value}T${pad(c.h)}:${pad(c.m)}`
    lastEmitted = v2
    emit('update:modelValue', v2)
  }
}
function normalizeHour() {
  let n = parseInt(hh.value || '0', 10)
  if (isNaN(n)) n = 0
  n = Math.max(0, Math.min(23, n))
  const m = parseInt(mm.value || '0', 10) || 0
  const c = clampToMin(selectedDate.value || nowParts().iso, n, m)
  hh.value = pad(c.h)
  mm.value = pad(c.m)
  if (selectedDate.value) emitValue()
}
function bumpHour(delta) {
  let n = parseInt(hh.value || '0', 10)
  if (isNaN(n)) n = 0
  n = (n + delta + 24) % 24
  if (!selectedDate.value) selectedDate.value = days.value[0].iso
  const m = parseInt(mm.value || '0', 10) || 0
  const c = clampToMin(selectedDate.value, n, m)
  hh.value = pad(c.h)
  mm.value = pad(c.m)
  emitValue()
}

function onMinuteInput(e) {
  const v = e.target.value.replace(/\D/g, '').slice(0, 2)
  mm.value = v
  if (selectedDate.value) {
    const rawH = parseInt(hh.value || '0', 10) || 0
    const rawM = Math.max(0, Math.min(59, parseInt(v || '0', 10) || 0))
    const c = clampToMin(selectedDate.value, rawH, rawM)
    const v2 = `${selectedDate.value}T${pad(c.h)}:${pad(c.m)}`
    lastEmitted = v2
    emit('update:modelValue', v2)
  }
}
function normalizeMinute() {
  let n = parseInt(mm.value || '0', 10)
  if (isNaN(n)) n = 0
  n = Math.max(0, Math.min(59, n))
  const h = parseInt(hh.value || '0', 10) || 0
  const c = clampToMin(selectedDate.value || nowParts().iso, h, n)
  hh.value = pad(c.h)
  mm.value = pad(c.m)
  if (selectedDate.value) emitValue()
}
function bumpMinute(delta) {
  let n = parseInt(mm.value || '0', 10)
  if (isNaN(n)) n = 0
  n = (n + delta + 60) % 60
  if (!selectedDate.value) selectedDate.value = days.value[0].iso
  const h = parseInt(hh.value || '0', 10) || 0
  const c = clampToMin(selectedDate.value, h, n)
  hh.value = pad(c.h)
  mm.value = pad(c.m)
  emitValue()
}

function clear() {
  selectedDate.value = ''
  hh.value = '09'
  mm.value = '00'
  emit('update:modelValue', '')
}
</script>

<style scoped>
.dtp {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 10px;
  background: var(--panel-2);
  border: 1px solid var(--border-2);
  border-radius: 10px;
}

/* Day pills */
.dtp-days {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 4px;
}
.dtp-day {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 7px 2px 8px;
  background: var(--panel);
  border: 1px solid var(--border-2);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s;
  font-family: inherit;
}
.dtp-day:hover {
  border-color: color-mix(in oklab, var(--accent) 50%, var(--border));
  background: color-mix(in oklab, var(--accent) 5%, var(--panel));
}
.dtp-day.active {
  background: var(--accent);
  border-color: var(--accent);
  color: white;
  box-shadow: 0 2px 8px -2px color-mix(in oklab, var(--accent) 60%, transparent);
}
.dtp-day-label {
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  opacity: 0.85;
}
.dtp-day-date {
  font-size: 12px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

/* Time */
.dtp-time {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 4px 2px 2px;
  position: relative;
}
.dtp-time-group {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
}
.dtp-time-input {
  width: 38px;
  height: 30px;
  text-align: center;
  font-size: 15px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  background: var(--panel);
  border: 1px solid var(--border-2);
  border-radius: 6px;
  color: var(--text);
  outline: none;
  font-family: inherit;
}
.dtp-time-input:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px color-mix(in oklab, var(--accent) 18%, transparent);
}
.dtp-time-arrow {
  width: 38px;
  height: 16px;
  background: transparent;
  border: none;
  color: var(--muted);
  font-size: 8px;
  cursor: pointer;
  padding: 0;
  line-height: 1;
  border-radius: 4px;
}
.dtp-time-arrow:hover {
  background: var(--panel);
  color: var(--accent);
}
.dtp-time-colon {
  font-size: 18px;
  font-weight: 700;
  color: var(--muted);
  margin: 0 -2px;
}
.dtp-time-mode {
  margin-left: 6px;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--muted);
  padding: 2px 7px;
  background: var(--panel);
  border: 1px solid var(--border-2);
  border-radius: 999px;
}
.dtp-clear {
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 24px;
  height: 24px;
  background: transparent;
  border: 1px solid var(--border-2);
  border-radius: 999px;
  color: var(--muted);
  cursor: pointer;
  font-size: 16px;
  line-height: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.dtp-clear:hover {
  border-color: var(--danger);
  color: var(--danger);
  background: var(--danger-bg);
}
</style>
