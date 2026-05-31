<template>
  <div style="padding:20px 24px 40px;display:flex;flex-direction:column;gap:16px;">
    <PageHeader
      title="Telegram user API sessionlari"
      subtitle="Barcha kompaniyalarning faol Telegram MTProto sessionlari. Bu yerdan ularni o'chirib, Telegram tomonida ham logout qilishingiz mumkin."
    >
      <template #right>
        <AppButton variant="secondary" size="md" @click="load" :loading="loading">
          <template #icon><AppIcon name="Sort" :size="13"/></template>
          Yangilash
        </AppButton>
        <AppButton
          variant="danger"
          size="md"
          :disabled="!sessions.length || revokingAll"
          :loading="revokingAll"
          @click="onRevokeAll"
        >
          <template #icon><AppIcon name="Trash" :size="13"/></template>
          Barcha sessionlarni o'chirish
        </AppButton>
      </template>
    </PageHeader>

    <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
      <div class="ats-stat">
        <span class="ats-stat-val">{{ sessions.length }}</span>
        <span class="ats-stat-lbl">faol session</span>
      </div>
      <div style="flex:1;"/>
      <AppInput v-model="query" placeholder="Nom, email, fingerprint, telefon..." :style="{ width:'320px' }">
        <template #icon><AppIcon name="Search" :size="13" :style="{color:'var(--muted)'}"/></template>
      </AppInput>
    </div>

    <AppPanel :padding="0">
      <div v-if="loading" style="padding:48px;text-align:center;color:var(--muted);font-size:13px;">
        <span class="ats-spinner"/> Yuklanmoqda…
      </div>
      <div v-else-if="error"
           style="padding:14px 16px;background:rgba(239,68,68,.08);
                  border-bottom:1px solid rgba(239,68,68,.2);color:#ef4444;font-size:13px;">
        <AppIcon name="Close" :size="12"/> {{ error }}
      </div>
      <div v-else-if="!filtered.length"
           style="padding:48px;text-align:center;display:flex;flex-direction:column;gap:10px;align-items:center;">
        <span style="width:48px;height:48px;border-radius:12px;display:inline-flex;align-items:center;
                     justify-content:center;background:rgba(99,102,241,.08);color:var(--accent);">
          <AppIcon name="Telegram" :size="24"/>
        </span>
        <div style="font-size:14px;font-weight:600;">
          {{ sessions.length ? "Filtr bo'yicha topilmadi" : 'Faol Telegram session yo\'q' }}
        </div>
        <div style="font-size:12px;color:var(--muted);max-width:380px;">
          Foydalanuvchilar Telegram API'larini ulagandagina shu yerda ko'rinadi.
        </div>
      </div>
      <table v-else style="width:100%;border-collapse:collapse;font-size:12.5px;">
        <thead>
          <tr style="border-bottom:1px solid var(--border);">
            <th v-for="h in headers" :key="h.key"
              :style="{
                textAlign: h.right ? 'right' : 'left',
                padding: '10px 12px', fontWeight: 500, fontSize: '11px',
                textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted)',
              }">
              {{ h.label }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(s, i) in filtered" :key="s.company_id"
            :style="{ borderTop: i===0 ? 'none' : '1px solid var(--border-2)' }">
            <!-- Kompaniya -->
            <td style="padding:10px 12px;vertical-align:middle;">
              <div style="display:flex;align-items:center;gap:10px;">
                <AppAvatar :name="s.company_name" :size="28"/>
                <div style="display:flex;flex-direction:column;min-width:0;">
                  <span style="font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:240px;">
                    {{ s.company_name }}
                  </span>
                  <span v-if="s.owner_email" style="font-size:11px;color:var(--muted);" class="mono">
                    {{ s.owner_email }}
                  </span>
                </div>
              </div>
            </td>
            <!-- Telefon -->
            <td style="padding:10px 12px;vertical-align:middle;" class="mono">
              <span v-if="s.phone_masked">{{ s.phone_masked }}</span>
              <span v-else style="color:var(--muted);">—</span>
            </td>
            <!-- API ID -->
            <td style="padding:10px 12px;vertical-align:middle;" class="mono">
              <span v-if="s.api_id" style="color:var(--muted);">{{ s.api_id }}</span>
              <span v-else style="color:var(--muted);">—</span>
            </td>
            <!-- Fingerprint -->
            <td style="padding:10px 12px;vertical-align:middle;" class="mono">
              <span v-if="s.fingerprint" class="ats-fp" :title="s.fingerprint">{{ s.fingerprint }}</span>
              <span v-else style="color:var(--muted);">—</span>
            </td>
            <!-- Yaratilgan -->
            <td style="padding:10px 12px;vertical-align:middle;color:var(--muted);font-size:11.5px;">
              {{ formatDate(s.created_at) }}
            </td>
            <!-- Oxirgi ishlatilgan -->
            <td style="padding:10px 12px;vertical-align:middle;color:var(--muted);font-size:11.5px;">
              {{ relativeTime(s.last_used_at) }}
            </td>
            <!-- Action -->
            <td style="padding:8px 12px;vertical-align:middle;text-align:right;white-space:nowrap;">
              <AppButton
                variant="danger"
                size="sm"
                :loading="revokingId === s.company_id"
                :disabled="!!revokingId || revokingAll"
                @click="onRevokeOne(s)"
              >
                <template #icon><AppIcon name="Trash" :size="11"/></template>
                O'chirish
              </AppButton>
            </td>
          </tr>
        </tbody>
      </table>
    </AppPanel>

    <!-- Confirm modal -->
    <AppModal v-model="confirmOpen"
              :title="confirmTitle"
              :subtitle="confirmSubtitle"
              width="480px">
      <div v-if="confirmAll" style="display:flex;flex-direction:column;gap:10px;">
        <div style="padding:12px 14px;border-radius:8px;background:rgba(239,68,68,.08);
                    border:1px solid rgba(239,68,68,.25);color:#ef4444;font-size:12.5px;line-height:1.5;">
          <strong>Diqqat:</strong> {{ sessions.length }} ta session o'chiriladi. Foydalanuvchilar yana
          ulanish uchun kod orqali qayta login qilishlari kerak.
        </div>
      </div>
      <div v-else style="display:flex;flex-direction:column;gap:8px;">
        <div style="display:flex;flex-direction:column;gap:3px;padding:10px 12px;
                    background:var(--panel-2,rgba(99,102,241,.05));border-radius:8px;">
          <span style="font-weight:600;">{{ pendingSession?.company_name }}</span>
          <span style="font-size:11.5px;color:var(--muted);" class="mono">
            {{ pendingSession?.owner_email || '—' }} · {{ pendingSession?.phone_masked || '—' }}
          </span>
          <span v-if="pendingSession?.fingerprint"
                style="font-size:11px;color:var(--muted);" class="mono">
            fingerprint: {{ pendingSession.fingerprint }}
          </span>
        </div>
      </div>
      <template #footer>
        <AppButton variant="secondary" size="md" @click="confirmOpen = false" :disabled="confirmBusy">
          Bekor qilish
        </AppButton>
        <AppButton variant="danger" size="md" :loading="confirmBusy" @click="confirmRun">
          <template #icon><AppIcon name="Trash" :size="12"/></template>
          {{ confirmAll ? "Hammasini o'chirish" : "O'chirish" }}
        </AppButton>
      </template>
    </AppModal>

    <!-- Inline toast banner (pastki o'ngda) -->
    <Teleport to="body">
      <transition name="ats-toast">
        <div v-if="toast" class="ats-toast" :class="`ats-toast-${toast.kind}`" @click="toast = null">
          <AppIcon :name="toast.kind === 'success' ? 'Check' : 'Close'" :size="14"/>
          <span>{{ toast.text }}</span>
        </div>
      </transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import PageHeader from '@/components/layout/PageHeader.vue'
import AppPanel from '@/components/ui/AppPanel.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppAvatar from '@/components/ui/AppAvatar.vue'
import AppModal from '@/components/ui/AppModal.vue'
import { adminApi } from '@/api/admin.js'

const loading = ref(true)
const error = ref('')
const sessions = ref([])
const query = ref('')

const revokingId = ref(null)
const revokingAll = ref(false)

const confirmOpen = ref(false)
const confirmAll = ref(false)
const confirmBusy = ref(false)
const pendingSession = ref(null)
const toast = ref(null)

function showToast(kind, text, ms = 4000) {
  toast.value = { kind, text }
  setTimeout(() => {
    if (toast.value?.text === text) toast.value = null
  }, ms)
}

const confirmTitle = computed(() =>
  confirmAll.value ? "Barcha sessionlarni o'chirish?" : "Sessionni o'chirish?",
)
const confirmSubtitle = computed(() =>
  confirmAll.value
    ? "Ushbu amal qaytarib bo'lmaydi. Barcha foydalanuvchilarning Telegram API ulanishi to'xtatiladi."
    : "Foydalanuvchining Telegram API ulanishi to'xtatiladi. Qaytarib bo'lmaydi.",
)

const headers = [
  { key: 'company',    label: 'Kompaniya / egasi' },
  { key: 'phone',      label: 'Telefon' },
  { key: 'api_id',     label: 'API ID' },
  { key: 'fp',         label: 'Fingerprint' },
  { key: 'created',    label: 'Yaratilgan' },
  { key: 'last_used',  label: 'Oxirgi marta' },
  { key: 'actions',    label: '', right: true },
]

async function load() {
  loading.value = true
  error.value = ''
  try {
    sessions.value = await adminApi.listTelegramSessions()
  } catch (e) {
    error.value = e?.response?.data?.message || e.message || "Yuklashda xato"
    sessions.value = []
  } finally {
    loading.value = false
  }
}
onMounted(load)

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return sessions.value
  return sessions.value.filter((s) => {
    const haystack = [
      s.company_name, s.company_slug, s.owner_email,
      s.phone_masked, s.fingerprint, s.api_id,
    ].filter(Boolean).join(' ').toLowerCase()
    return haystack.includes(q)
  })
})

function onRevokeOne(s) {
  pendingSession.value = s
  confirmAll.value = false
  confirmOpen.value = true
}
function onRevokeAll() {
  pendingSession.value = null
  confirmAll.value = true
  confirmOpen.value = true
}

async function confirmRun() {
  confirmBusy.value = true
  try {
    if (confirmAll.value) {
      revokingAll.value = true
      const r = await adminApi.revokeAllTelegramSessions()
      showToast('success', `${r.total} session o'chirildi (Telegram'dan logged-out: ${r.logged_out}, xato: ${r.failed})`)
    } else if (pendingSession.value) {
      revokingId.value = pendingSession.value.company_id
      const r = await adminApi.revokeTelegramSession(pendingSession.value.company_id)
      showToast('success', r.logged_out
        ? "Session o'chirildi va Telegram tomonida ham logout qilindi"
        : "Session o'chirildi (Telegram'dan logout muvaffaqiyatsiz, lekin DB tozalandi)")
    }
    confirmOpen.value = false
    await load()
  } catch (e) {
    showToast('error', e?.response?.data?.message || e.message || "O'chirishda xato", 6000)
  } finally {
    confirmBusy.value = false
    revokingAll.value = false
    revokingId.value = null
  }
}

// ── Helpers ──
function formatDate(d) {
  if (!d) return '—'
  const dt = new Date(d)
  if (isNaN(dt.getTime())) return '—'
  return dt.toLocaleDateString('uz-UZ', { year: 'numeric', month: 'short', day: '2-digit' })
       + ' ' + dt.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })
}
function relativeTime(d) {
  if (!d) return '—'
  const dt = new Date(d)
  if (isNaN(dt.getTime())) return '—'
  const diff = Math.floor((Date.now() - dt.getTime()) / 1000)
  if (diff < 60) return `${diff}s oldin`
  if (diff < 3600) return `${Math.floor(diff/60)} daq oldin`
  if (diff < 86400) return `${Math.floor(diff/3600)} soat oldin`
  if (diff < 86400 * 30) return `${Math.floor(diff/86400)} kun oldin`
  return formatDate(d)
}
</script>

<style scoped>
.mono { font-family: 'JetBrains Mono', Menlo, Consolas, monospace; }

.ats-stat {
  display: inline-flex; align-items: baseline; gap: 6px;
  padding: 6px 12px;
  background: var(--panel-2, rgba(99, 102, 241, 0.06));
  border: 1px solid var(--border-2);
  border-radius: 7px;
}
.ats-stat-val {
  font-size: 16px; font-weight: 700;
  color: var(--accent);
  font-variant-numeric: tabular-nums;
}
.ats-stat-lbl {
  font-size: 12px; color: var(--muted);
}

.ats-fp {
  display: inline-block;
  padding: 2px 6px;
  background: rgba(99, 102, 241, 0.06);
  border: 1px solid var(--border-2);
  border-radius: 4px;
  font-size: 11px;
}

.ats-spinner {
  display: inline-block;
  width: 14px; height: 14px;
  border-radius: 999px;
  border: 2px solid var(--border);
  border-top-color: var(--accent);
  animation: ats-spin 0.8s linear infinite;
  margin-right: 8px;
  vertical-align: middle;
}
@keyframes ats-spin { to { transform: rotate(360deg); } }

/* Inline toast */
.ats-toast {
  position: fixed;
  bottom: 24px; right: 24px;
  z-index: 4000;
  display: inline-flex; align-items: center; gap: 8px;
  padding: 11px 16px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 500;
  max-width: 420px;
  box-shadow: 0 10px 30px -8px rgba(15,23,42,0.35);
  cursor: pointer;
}
.ats-toast-success {
  background: color-mix(in oklab, var(--success) 14%, var(--panel));
  color: var(--success);
  border: 1px solid color-mix(in oklab, var(--success) 30%, transparent);
}
.ats-toast-error {
  background: color-mix(in oklab, var(--danger) 14%, var(--panel));
  color: var(--danger);
  border: 1px solid color-mix(in oklab, var(--danger) 30%, transparent);
}
.ats-toast-enter-active, .ats-toast-leave-active {
  transition: opacity .2s, transform .2s;
}
.ats-toast-enter-from, .ats-toast-leave-to {
  opacity: 0;
  transform: translateY(8px);
}
</style>
