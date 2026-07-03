<template>
  <div style="padding:20px 24px 40px;display:flex;flex-direction:column;gap:16px;max-width:880px;">
    <PageHeader
      :title="tt('clientTelegramApi.pageTitle')"
      :subtitle="tt('clientTelegramApi.pageSubtitle')"
    />

    <!-- ─── Joriy holat banner (har doim ko'rinadi, agar biror narsa saqlangan bo'lsa) ─── -->
    <div v-if="state.is_saved || session.has_session"
         style="padding:12px 14px;border-radius:8px;border:1px solid var(--border-2);
                background:var(--bg-2,rgba(0,0,0,.02));display:flex;flex-direction:column;gap:10px;">
      <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
        <span style="font-size:11px;font-weight:600;color:var(--muted);text-transform:uppercase;letter-spacing:0.04em;">
          {{ tt('clientTelegramApi.currentStatus') }}
        </span>
        <span v-if="state.is_saved"
              style="display:inline-flex;align-items:center;gap:5px;padding:3px 8px;border-radius:999px;
                     background:rgba(34,197,94,.1);color:#16a34a;font-size:11px;font-weight:600;">
          <span style="width:5px;height:5px;border-radius:50%;background:currentColor;"></span>
          {{ tt('clientTelegramApi.apiSaved') }}
        </span>
        <span v-if="session.has_session"
              style="display:inline-flex;align-items:center;gap:5px;padding:3px 8px;border-radius:999px;
                     background:rgba(34,197,94,.1);color:#16a34a;font-size:11px;font-weight:600;">
          <span style="width:5px;height:5px;border-radius:50%;background:currentColor;"></span>
          {{ tt('clientTelegramApi.sessionActive') }}
        </span>
        <span v-else-if="state.is_saved"
              style="display:inline-flex;align-items:center;gap:5px;padding:3px 8px;border-radius:999px;
                     background:rgba(234,179,8,.1);color:#ca8a04;font-size:11px;font-weight:600;">
          <span style="width:5px;height:5px;border-radius:50%;background:currentColor;"></span>
          {{ tt('clientTelegramApi.sessionNone') }}
        </span>
      </div>

      <div v-if="state.is_saved" style="display:grid;grid-template-columns:120px 1fr;gap:4px 12px;font-size:12px;">
        <span style="color:var(--muted);">api_id:</span>
        <span style="font-family:'JetBrains Mono',monospace;">{{ apiIdDisplay }}</span>
        <span style="color:var(--muted);">api_hash:</span>
        <span style="font-family:'JetBrains Mono',monospace;">{{ apiHashDisplay }}</span>
        <template v-if="state.phone || session.phone_masked">
          <span style="color:var(--muted);">{{ tt('clientTelegramApi.phoneLabel') }}</span>
          <span style="font-family:'JetBrains Mono',monospace;">{{ session.phone_masked || state.phone }}</span>
        </template>
        <template v-if="session.fingerprint">
          <span style="color:var(--muted);">{{ tt('clientTelegramApi.sessionIdLabel') }}</span>
          <span style="font-family:'JetBrains Mono',monospace;">🔐 {{ session.fingerprint }}</span>
        </template>
      </div>

      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        <button v-if="session.has_session" @click="revokeSession" type="button"
                style="padding:6px 12px;border-radius:5px;border:1px solid #f97316;background:transparent;
                       color:#f97316;cursor:pointer;font-size:11.5px;">
          {{ tt('clientTelegramApi.deleteSession') }}
        </button>
        <button v-if="state.is_saved" @click="clearApiOnly" type="button"
                style="padding:6px 12px;border-radius:5px;border:1px solid #ef4444;background:transparent;
                       color:#ef4444;cursor:pointer;font-size:11.5px;">
          {{ tt('clientTelegramApi.deleteApi') }}
        </button>
        <button v-if="state.is_saved || session.has_session" @click="clearAll" type="button"
                style="padding:6px 12px;border-radius:5px;border:1px solid #ef4444;background:#ef4444;
                       color:#fff;cursor:pointer;font-size:11.5px;font-weight:500;">
          {{ tt('clientTelegramApi.deleteAll') }}
        </button>
      </div>
    </div>

    <!-- ─── To'liq saqlangan holat ─── -->
    <div v-if="state.is_saved && session.has_session && !editing"
         style="border:1px solid rgba(34,197,94,.3);background:rgba(34,197,94,.06);
                border-radius:10px;padding:18px;display:flex;flex-direction:column;gap:16px;">
      <div style="display:flex;align-items:center;gap:10px;">
        <span style="width:10px;height:10px;border-radius:50%;background:#16a34a;"></span>
        <strong style="font-size:14px;color:#16a34a;">{{ tt('clientTelegramApi.fullyConnected') }}</strong>
        <span style="margin-left:auto;font-size:11px;color:var(--muted);font-family:'JetBrains Mono',monospace;">
          🔐 {{ session.fingerprint }}
        </span>
      </div>

      <div style="display:grid;grid-template-columns:160px 1fr;gap:8px 14px;font-size:12.5px;">
        <span style="color:var(--muted);">api_id:</span>
        <span style="font-family:'JetBrains Mono',monospace;">{{ apiIdDisplay }}</span>
        <span style="color:var(--muted);">api_hash:</span>
        <span style="font-family:'JetBrains Mono',monospace;">{{ apiHashDisplay }}</span>
        <span style="color:var(--muted);">{{ tt('clientTelegramApi.phoneLabel') }}</span>
        <span style="font-family:'JetBrains Mono',monospace;">{{ session.phone_masked || state.phone }}</span>
        <span style="color:var(--muted);">{{ tt('clientTelegramApi.sessionCreatedLabel') }}</span>
        <span>{{ formatDate(session.created_at) }}</span>
        <span style="color:var(--muted);">{{ tt('clientTelegramApi.lastUsedLabel') }}</span>
        <span>{{ session.last_used_at ? formatDate(session.last_used_at) : tt('clientTelegramApi.neverUsed') }}</span>
      </div>

      <div style="display:flex;gap:10px;flex-wrap:wrap;">
        <button @click="startEdit"
                style="padding:7px 14px;border-radius:6px;border:1px solid var(--border-2);
                       background:transparent;color:var(--text);cursor:pointer;font-size:12.5px;">
          {{ tt('clientTelegramApi.editApi') }}
        </button>
        <button @click="revokeSession"
                style="padding:7px 14px;border-radius:6px;border:1px solid #f97316;
                       background:transparent;color:#f97316;cursor:pointer;font-size:12.5px;">
          {{ tt('clientTelegramApi.revokeSession') }}
        </button>
        <button @click="clearAll"
                style="padding:7px 14px;border-radius:6px;border:1px solid #ef4444;
                       background:transparent;color:#ef4444;cursor:pointer;font-size:12.5px;">
          {{ tt('clientTelegramApi.deleteAll') }}
        </button>
      </div>
    </div>

    <!-- ─── Wizard ─── -->
    <AppPanel v-else>
      <div style="display:flex;flex-direction:column;gap:18px;">
        <!-- Step indicator -->
        <div style="display:flex;align-items:center;gap:4px;flex-wrap:wrap;">
          <template v-for="(s, i) in visibleSteps" :key="i">
            <div :style="{
              minWidth:'24px',height:'24px',padding:'0 6px',borderRadius:'12px',
              display:'flex',alignItems:'center',justifyContent:'center',
              fontSize:'11px',fontWeight:600,
              background: step === s.idx ? 'var(--accent)' : (step > s.idx ? '#16a34a' : 'var(--bg-2,rgba(0,0,0,.05))'),
              color: step >= s.idx ? '#fff' : 'var(--muted)',
              border: step === s.idx ? 'none' : '1px solid var(--border-2)',
            }">{{ step > s.idx ? '✓' : i + 1 }}</div>
            <div v-if="i < visibleSteps.length - 1" :style="{
              flex:'0 1 20px',height:'2px',
              background: step > s.idx ? '#16a34a' : 'var(--border-2)',
            }"></div>
          </template>
        </div>
        <div style="font-size:12.5px;color:var(--muted);">
          <strong style="color:var(--text);">{{ steps[step] }}</strong>
        </div>

        <!-- Step 0: Intro -->
        <div v-if="step === 0" style="display:flex;flex-direction:column;gap:14px;">
          <h3 style="margin:0;font-size:15px;">{{ tt('clientTelegramApi.step0Title') }}</h3>
          <p style="margin:0;font-size:13.5px;line-height:1.6;color:var(--text);">
            <span v-html="tt('clientTelegramApi.step0Intro')"></span>
          </p>
          <ol style="margin:0;padding-left:22px;font-size:13px;line-height:1.7;color:var(--text);">
            <li v-html="tt('clientTelegramApi.step0Li1')"></li>
            <li v-html="tt('clientTelegramApi.step0Li2')"></li>
          </ol>
          <div style="padding:10px 12px;border-radius:6px;background:rgba(234,179,8,.08);
                       border:1px solid rgba(234,179,8,.25);font-size:11.5px;line-height:1.5;">
            <span v-html="tt('clientTelegramApi.step0Warn')"></span>
          </div>
          <ul style="margin:0;padding-left:20px;font-size:12.5px;line-height:1.6;color:var(--muted);">
            <li>{{ tt('clientTelegramApi.step0Bullet1') }}</li>
            <li>{{ tt('clientTelegramApi.step0Bullet2') }}</li>
            <li>{{ tt('clientTelegramApi.step0Bullet3') }}</li>
          </ul>
        </div>

        <!-- Step 1: my.telegram.org -->
        <div v-else-if="step === 1" style="display:flex;flex-direction:column;gap:14px;">
          <h3 style="margin:0;font-size:15px;">{{ tt('clientTelegramApi.step1Title') }}</h3>
          <ol style="margin:0;padding-left:22px;font-size:13.5px;line-height:1.8;color:var(--text);">
            <li>
              {{ tt('clientTelegramApi.step1Li1') }}
              <a href="https://my.telegram.org" target="_blank" style="color:var(--accent);font-weight:600;">https://my.telegram.org</a>
            </li>
            <li v-html="tt('clientTelegramApi.step1Li2')"></li>
            <li>{{ tt('clientTelegramApi.step1Li3') }}</li>
            <li v-html="tt('clientTelegramApi.step1Li4')"></li>
          </ol>
          <div style="padding:10px 12px;border-radius:6px;background:rgba(234,179,8,.08);
                       border:1px solid rgba(234,179,8,.25);font-size:12px;">
            {{ tt('clientTelegramApi.step1Warn') }}
          </div>
        </div>

        <!-- Step 2: Create app -->
        <div v-else-if="step === 2" style="display:flex;flex-direction:column;gap:14px;">
          <h3 style="margin:0;font-size:15px;">{{ tt('clientTelegramApi.step2Title') }}</h3>
          <ol style="margin:0;padding-left:22px;font-size:13.5px;line-height:1.8;color:var(--text);">
            <li v-html="tt('clientTelegramApi.step2Li1')"></li>
            <li v-html="tt('clientTelegramApi.step2Li2')"></li>
            <li v-html="tt('clientTelegramApi.step2Li3')"></li>
            <li v-html="tt('clientTelegramApi.step2Li4')"></li>
            <li v-html="tt('clientTelegramApi.step2Li5')"></li>
          </ol>
          <div style="padding:10px 12px;border-radius:6px;background:rgba(99,102,241,.08);
                       border:1px solid rgba(99,102,241,.2);font-size:12px;">
            <span v-html="tt('clientTelegramApi.step2Info')"></span>
          </div>
        </div>

        <!-- Step 3: Paste credentials -->
        <div v-else-if="step === 3" style="display:flex;flex-direction:column;gap:14px;">
          <h3 style="margin:0;font-size:15px;">{{ tt('clientTelegramApi.step3Title') }}</h3>
          <p style="margin:0;font-size:12.5px;color:var(--muted);">
            <span v-html="tt('clientTelegramApi.step3Desc')"></span>
          </p>

          <div style="padding:10px 12px;border-radius:6px;background:rgba(99,102,241,.08);
                       border:1px solid rgba(99,102,241,.2);font-size:12px;">
            {{ tt('clientTelegramApi.apiOptionalInfo') }}
          </div>

          <label style="display:flex;flex-direction:column;gap:5px;">
            <span style="font-size:12px;font-weight:600;">api_id <span style="color:var(--muted);font-weight:400;">{{ tt('clientTelegramApi.apiIdHint') }}</span></span>
            <input v-model="form.api_id" type="text" placeholder="12345678" autocomplete="off"
                   style="padding:9px 12px;border:1px solid var(--border-2);border-radius:6px;
                          background:var(--bg);color:var(--text);font-family:'JetBrains Mono',monospace;font-size:13px;"/>
          </label>

          <label style="display:flex;flex-direction:column;gap:5px;">
            <span style="font-size:12px;font-weight:600;">api_hash <span style="color:var(--muted);font-weight:400;">{{ tt('clientTelegramApi.apiHashHint') }}</span></span>
            <input v-model="form.api_hash" type="text" placeholder="0123456789abcdef0123456789abcdef" autocomplete="off"
                   style="padding:9px 12px;border:1px solid var(--border-2);border-radius:6px;
                          background:var(--bg);color:var(--text);font-family:'JetBrains Mono',monospace;font-size:13px;"/>
          </label>

          <label style="display:flex;flex-direction:column;gap:5px;">
            <span style="font-size:12px;font-weight:600;">{{ tt('clientTelegramApi.phoneFieldLabel') }} <span style="color:var(--accent);font-weight:400;">*</span> <span style="color:var(--muted);font-weight:400;">{{ tt('clientTelegramApi.phoneFieldHint') }}</span></span>
            <input v-model="form.phone" type="text" placeholder="+998901234567" autocomplete="off"
                   style="padding:9px 12px;border:1px solid var(--border-2);border-radius:6px;
                          background:var(--bg);color:var(--text);font-family:'JetBrains Mono',monospace;font-size:13px;"/>
          </label>
        </div>

        <!-- Step 4: Confirm code -->
        <div v-else-if="step === 4" style="display:flex;flex-direction:column;gap:12px;">
          <h3 style="margin:0;font-size:15px;">{{ tt('clientTelegramApi.step4Title') }}</h3>
          <p style="margin:0;font-size:12.5px;color:var(--text);line-height:1.6;">
            <span v-html="tt('clientTelegramApi.step4CodeSent', { phone: maskPhoneFront(form.phone) })"></span>
            <span v-if="deliveryHint">{{ deliveryHint }}</span>
          </p>
          <label style="display:flex;flex-direction:column;gap:5px;">
            <span style="font-size:12px;font-weight:600;">{{ tt('clientTelegramApi.confirmCodeLabel') }}</span>
            <input v-model="form.code" type="text" placeholder="12345"
                   autocomplete="one-time-code" inputmode="numeric" maxlength="8"
                   style="padding:10px 12px;border:1px solid var(--border-2);border-radius:6px;
                          background:var(--bg);color:var(--text);font-family:'JetBrains Mono',monospace;
                          font-size:20px;letter-spacing:6px;text-align:center;"/>
          </label>
          <div style="display:flex;gap:14px;flex-wrap:wrap;align-items:center;">
            <button type="button" @click="resendCode" :disabled="saving"
                    style="background:none;border:none;color:var(--accent);
                           font-size:11.5px;cursor:pointer;padding:0;text-decoration:underline;">
              {{ tt('clientTelegramApi.resendCode') }}
            </button>
            <button type="button" @click="resendCodeSms" :disabled="saving"
                    style="background:none;border:none;color:var(--accent);
                           font-size:11.5px;cursor:pointer;padding:0;text-decoration:underline;">
              {{ tt('clientTelegramApi.resendSms') }}
            </button>
          </div>
        </div>

        <!-- Step 5: 2FA (conditional) -->
        <div v-else-if="step === 5" style="display:flex;flex-direction:column;gap:12px;">
          <h3 style="margin:0;font-size:15px;">{{ tt('clientTelegramApi.step5Title') }}</h3>
          <div style="padding:10px 12px;border-radius:6px;background:rgba(234,179,8,.08);
                       border:1px solid rgba(234,179,8,.25);font-size:12px;line-height:1.5;">
            <span v-html="tt('clientTelegramApi.step5Info')"></span>
          </div>
          <label style="display:flex;flex-direction:column;gap:5px;">
            <span style="font-size:12px;font-weight:600;">{{ tt('clientTelegramApi.cloudPasswordLabel') }}</span>
            <input v-model="form.password" type="password" placeholder="••••••••" autocomplete="current-password"
                   style="padding:10px 12px;border:1px solid var(--border-2);border-radius:6px;
                          background:var(--bg);color:var(--text);font-size:14px;"/>
          </label>
        </div>

        <!-- Step 6: Success -->
        <div v-else-if="step === 6" style="display:flex;flex-direction:column;gap:14px;
                     align-items:center;text-align:center;padding:24px 0;">
          <div style="width:60px;height:60px;border-radius:50%;background:rgba(34,197,94,.15);
                       display:flex;align-items:center;justify-content:center;font-size:30px;">
            🔐
          </div>
          <h3 style="margin:0;font-size:16px;">{{ tt('clientTelegramApi.step6Title') }}</h3>
          <p style="margin:0;font-size:13px;color:var(--muted);max-width:480px;line-height:1.55;">
            {{ tt('clientTelegramApi.step6Desc') }}
          </p>
        </div>

        <div v-if="error" style="padding:8px 12px;border-radius:6px;background:rgba(239,68,68,.08);
                     border:1px solid rgba(239,68,68,.25);color:#ef4444;font-size:12.5px;">
          {{ error }}
        </div>

        <!-- Navigation -->
        <div style="display:flex;gap:10px;align-items:center;border-top:1px solid var(--border);padding-top:14px;">
          <button v-if="canGoBack" type="button" @click="prev"
                  style="padding:9px 16px;border-radius:6px;background:transparent;color:var(--muted);
                         border:1px solid var(--border-2);cursor:pointer;font-size:13px;">
            {{ tt('clientTelegramApi.back') }}
          </button>
          <div style="flex:1"></div>

          <!-- step 0..2: just Next -->
          <button v-if="step < 3" type="button" @click="next"
                  style="padding:9px 18px;border-radius:6px;background:var(--accent);color:#fff;
                         border:none;cursor:pointer;font-size:13px;font-weight:500;">
            {{ tt('clientTelegramApi.next') }}
          </button>
          <!-- step 3: Save creds + Send code -->
          <button v-else-if="step === 3" type="button" :disabled="saving" @click="saveCredsAndSendCode"
                  style="padding:9px 18px;border-radius:6px;background:var(--accent);color:#fff;
                         border:none;cursor:pointer;font-size:13px;font-weight:500;">
            {{ saving ? tt('clientTelegramApi.sending') : tt('clientTelegramApi.saveAndSendCode') }}
          </button>
          <!-- step 4: Submit code -->
          <button v-else-if="step === 4" type="button" :disabled="saving" @click="submitCode"
                  style="padding:9px 18px;border-radius:6px;background:var(--accent);color:#fff;
                         border:none;cursor:pointer;font-size:13px;font-weight:500;">
            {{ saving ? tt('clientTelegramApi.checking') : tt('clientTelegramApi.confirm') }}
          </button>
          <!-- step 5: Submit 2FA -->
          <button v-else-if="step === 5" type="button" :disabled="saving" @click="submit2FA"
                  style="padding:9px 18px;border-radius:6px;background:var(--accent);color:#fff;
                         border:none;cursor:pointer;font-size:13px;font-weight:500;">
            {{ saving ? tt('clientTelegramApi.checking') : tt('clientTelegramApi.signIn') }}
          </button>
          <!-- step 6: Finish -->
          <button v-else-if="step === 6" type="button" @click="finish"
                  style="padding:9px 18px;border-radius:6px;background:var(--accent);color:#fff;
                         border:none;cursor:pointer;font-size:13px;font-weight:500;">
            {{ tt('clientTelegramApi.finish') }}
          </button>
        </div>
      </div>
    </AppPanel>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref, computed } from 'vue'
import AppPanel from '@/components/ui/AppPanel.vue'
import PageHeader from '@/components/layout/PageHeader.vue'
import { companiesApi } from '@/api/companies.js'
import { useAppStore } from '@/stores/app.js'

const store = useAppStore()
const t = computed(() => store.t)
function tt(key, params) { return t.value(key, params) }

// Step ro'yxati. 2FA shartli — agar kerak bo'lmasa o't qilib o'tiladi.
const steps = computed(() => [
  tt('clientTelegramApi.stepName0'),
  tt('clientTelegramApi.stepName1'),
  tt('clientTelegramApi.stepName2'),
  tt('clientTelegramApi.stepName3'),
  tt('clientTelegramApi.stepName4'),
  tt('clientTelegramApi.stepName5'),
  tt('clientTelegramApi.stepName6'),
])
const step = ref(0)
const editing = ref(false)
const saving = ref(false)
const error = ref(null)
const company = ref(null)
const needs2FA = ref(false)
const delivery = ref(null)
const deliveryHint = computed(() => {
  const d = (delivery.value || '').toLowerCase()
  if (d.includes('app')) return tt('clientTelegramApi.deliveryApp')
  if (d.includes('sms')) return tt('clientTelegramApi.deliverySms')
  if (d.includes('call')) return tt('clientTelegramApi.deliveryCall')
  if (d.includes('missedcall')) return tt('clientTelegramApi.deliveryMissedCall')
  return ''
})

const state = reactive({
  is_saved: false,
  api_id: null,
  api_hash_masked: null,
  phone: null,
  saved_at: null,
})

const session = reactive({
  has_session: false,
  phone_masked: null,
  fingerprint: null,
  created_at: null,
  last_used_at: null,
  login_in_progress: false,
})

const form = reactive({
  api_id: '',
  api_hash: '',
  phone: '',
  code: '',
  password: '',
})

// 2FA step ko'rsatkichda ko'rinishi shart bo'lmasa, indikator ham yo'q bo'lsin
const visibleSteps = computed(() => {
  const arr = [0, 1, 2, 3, 4]
  if (needs2FA.value) arr.push(5)
  arr.push(6)
  return arr.map((idx, i) => ({ idx, label: steps.value[idx] }))
})

const canGoBack = computed(() => {
  // Sessiya login'i ichida orqaga qaytish mumkin emas (state Telegram tomonida)
  // Faqat 1, 2 step'larida
  return step.value > 0 && step.value < 3
})

const apiIdDisplay = computed(() => state.api_id || tt('clientTelegramApi.defaultApp'))
const apiHashDisplay = computed(() => state.api_hash_masked || tt('clientTelegramApi.defaultApp'))

function formatDate(d) {
  if (!d) return ''
  try { return new Date(d).toLocaleString('uz-UZ', { dateStyle: 'medium', timeStyle: 'short' }) }
  catch { return String(d) }
}

function maskPhoneFront(p) {
  if (!p) return ''
  return p.slice(0, 4) + ' ••• ••' + p.slice(-2)
}

async function loadState() {
  if (!company.value) return
  const r = await companiesApi.getTelegramApi(company.value.id)
  state.is_saved = !!r.is_saved
  state.api_id = r.api_id
  state.api_hash_masked = r.api_hash_masked
  state.phone = r.phone
  state.saved_at = r.saved_at
  if (r.is_saved) {
    try {
      const s = await companiesApi.getTelegramSessionStatus(company.value.id)
      session.has_session = !!s.has_session
      session.phone_masked = s.phone_masked
      session.fingerprint = s.fingerprint
      session.created_at = s.created_at
      session.last_used_at = s.last_used_at
      session.login_in_progress = !!s.login_in_progress
    } catch (e) { /* ignore */ }
  }
}

onMounted(async () => {
  try {
    const list = await companiesApi.getMy().catch(() => [])
    const arr = Array.isArray(list) ? list : [list].filter(Boolean)
    company.value = arr[0] || null
    if (company.value) await loadState()
  } catch (e) {
    error.value = e?.response?.data?.message ?? e.message
  }
})

function next() {
  error.value = null
  if (step.value < steps.value.length - 1) step.value++
}
function prev() {
  error.value = null
  if (step.value > 0) step.value--
}

function startEdit() {
  editing.value = true
  step.value = 3
  form.api_id = ''
  form.api_hash = ''
  form.phone = state.phone || ''
  form.code = ''
  form.password = ''
  needs2FA.value = false
}

/**
 * Step 3 → 4: API credentials saqlanadi va shu zahoti telefon raqamiga kod yuboriladi.
 */
async function saveCredsAndSendCode() {
  if (!company.value) return
  error.value = null
  const apiId = form.api_id.trim()
  const apiHash = form.api_hash.trim()
  const phone = form.phone.trim().replace(/\s+/g, '')
  // api_id/api_hash ixtiyoriy — bo'sh qoldirilsa serverdagi standart (fallback)
  // ilova credentials'i ishlatiladi. Kiritilgan bo'lsa, formati tekshiriladi.
  if (apiId || apiHash) {
    if (!/^\d{4,12}$/.test(apiId)) {
      error.value = tt('clientTelegramApi.errApiId')
      return
    }
    if (!/^[a-f0-9]{32}$/i.test(apiHash)) {
      error.value = tt('clientTelegramApi.errApiHash')
      return
    }
  }
  if (!/^\+\d{8,15}$/.test(phone)) {
    error.value = tt('clientTelegramApi.errPhone')
    return
  }
  saving.value = true
  try {
    // API'ni saqlaymiz
    await companiesApi.setTelegramApi(company.value.id, {
      api_id: apiId,
      api_hash: apiHash,
      phone,
    })
    await loadState()
    // Shu zahoti kod yuboramiz
    const r = await companiesApi.sendTelegramCode(company.value.id, phone)
    delivery.value = r?.delivery || null
    form.phone = phone
    step.value = 4
  } catch (e) {
    error.value = e?.response?.data?.message ?? e.message
  } finally {
    saving.value = false
  }
}

/**
 * Step 4 → 5 yoki 6: kod yuboramiz. 2FA kerak bo'lsa step 5, aks holda step 6.
 */
async function submitCode() {
  if (!company.value) return
  error.value = null
  const code = form.code.trim()
  if (!/^\d{4,8}$/.test(code)) {
    error.value = tt('clientTelegramApi.errCode')
    return
  }
  saving.value = true
  try {
    const r = await companiesApi.signInTelegramCode(company.value.id, code)
    if (r.needs_2fa) {
      needs2FA.value = true
      step.value = 5
    } else if (r.ok) {
      needs2FA.value = false
      await loadState()
      step.value = 6
    }
  } catch (e) {
    error.value = e?.response?.data?.message ?? e.message
  } finally {
    saving.value = false
  }
}

/**
 * Step 5 → 6: 2FA parolini yuboramiz.
 */
async function submit2FA() {
  if (!company.value) return
  error.value = null
  if (!form.password) {
    error.value = tt('clientTelegramApi.errPassword')
    return
  }
  saving.value = true
  try {
    await companiesApi.signInTelegram2FA(company.value.id, form.password)
    form.password = ''
    await loadState()
    step.value = 6
  } catch (e) {
    error.value = e?.response?.data?.message ?? e.message
  } finally {
    saving.value = false
  }
}

async function resendCode() {
  if (!company.value || !form.phone) return
  error.value = null
  saving.value = true
  try {
    const r = await companiesApi.sendTelegramCode(company.value.id, form.phone)
    delivery.value = r?.delivery || null
    form.code = ''
  } catch (e) {
    error.value = e?.response?.data?.message ?? e.message
  } finally {
    saving.value = false
  }
}

async function resendCodeSms() {
  if (!company.value) return
  error.value = null
  saving.value = true
  try {
    const r = await companiesApi.resendTelegramCodeSms(company.value.id)
    delivery.value = r?.delivery || null
    form.code = ''
  } catch (e) {
    error.value = e?.response?.data?.message ?? e.message
  } finally {
    saving.value = false
  }
}

function finish() {
  editing.value = false
  step.value = 0
  needs2FA.value = false
  form.api_id = ''
  form.api_hash = ''
  form.phone = ''
  form.code = ''
  form.password = ''
}

async function revokeSession() {
  if (!company.value) return
  if (!confirm(tt('clientTelegramApi.confirmRevokeSession'))) return
  try {
    await companiesApi.revokeTelegramSession(company.value.id)
    await loadState()
    step.value = 3
    editing.value = true
    form.api_id = ''
    form.api_hash = ''
    form.phone = state.phone || ''
  } catch (e) {
    error.value = e?.response?.data?.message ?? e.message
  }
}

async function clearApiOnly() {
  if (!company.value) return
  if (session.has_session) {
    if (!confirm(tt('clientTelegramApi.confirmClearApiWithSession'))) return
  } else {
    if (!confirm(tt('clientTelegramApi.confirmClearApi'))) return
  }
  try {
    if (session.has_session) {
      await companiesApi.revokeTelegramSession(company.value.id).catch(() => {})
    }
    await companiesApi.clearTelegramApi(company.value.id)
    await loadState()
    editing.value = false
    step.value = 0
  } catch (e) {
    error.value = e?.response?.data?.message ?? e.message
  }
}

async function clearAll() {
  if (!company.value) return
  if (!confirm(tt('clientTelegramApi.confirmClearAll'))) return
  try {
    await companiesApi.revokeTelegramSession(company.value.id).catch(() => {})
    await companiesApi.clearTelegramApi(company.value.id)
    await loadState()
    editing.value = false
    step.value = 0
  } catch (e) {
    error.value = e?.response?.data?.message ?? e.message
  }
}
</script>
