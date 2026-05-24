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
      <span class="dtp-time-mode">24 soat</span>
      <button v-if="modelValue" type="button" class="dtp-clear" @click="clear" :title="'Tozalash'">
        ×
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'

const props = defineProps({
  modelValue: { type: String, default: '' }, // 'YYYY-MM-DDTHH:MM'
})
const emit = defineEmits(['update:modelValue'])

function pad(n) { return String(n).padStart(2, '0') }
function toIsoDate(d) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` }

// 7 kunlik massiv (bugun + 6 keyingi)
const DAY_NAMES = ["Yak", "Du", "Se", "Chor", "Pay", "Ju", "Sha"] // Yak=0..Sha=6
const days = computed(() => {
  const out = []
  const base = new Date()
  base.setHours(0, 0, 0, 0)
  for (let i = 0; i < 7; i++) {
    const d = new Date(base)
    d.setDate(base.getDate() + i)
    const iso = toIsoDate(d)
    const label = i === 0 ? 'Bugun' : i === 1 ? 'Ertaga' : DAY_NAMES[d.getDay()]
    const short = `${pad(d.getDate())}.${pad(d.getMonth() + 1)}`
    out.push({ iso, label, short })
  }
  return out
})

// Parse v-model
function parse(v) {
  // Bo'sh model — default sifatida hozirgi soat:daqiqani ko'rsatamiz
  // (foydalanuvchi hozirgi paytdan oldinroq vaqt qo'ya olmaydi)
  if (!v || typeof v !== 'string') {
    const now = new Date()
    return { date: '', hh: pad(now.getHours()), mm: pad(now.getMinutes()) }
  }
  const m = v.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})/)
  if (!m) {
    const now = new Date()
    return { date: '', hh: pad(now.getHours()), mm: pad(now.getMinutes()) }
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
  const todayIso = toIsoDate(new Date())
  if (iso !== todayIso) return { h: 0, m: 0 }
  const now = new Date()
  return { h: now.getHours(), m: now.getMinutes() }
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
  const now = new Date()
  let h = parseInt(hh.value || pad(now.getHours()), 10)
  let m = parseInt(mm.value || pad(now.getMinutes()), 10)
  if (isNaN(h)) h = now.getHours()
  if (isNaN(m)) m = now.getMinutes()
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
  const c = clampToMin(selectedDate.value || toIsoDate(new Date()), n, m)
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
  const c = clampToMin(selectedDate.value || toIsoDate(new Date()), h, n)
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
