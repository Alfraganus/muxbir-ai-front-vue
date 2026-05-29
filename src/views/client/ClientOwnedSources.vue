<template>
  <div style="padding:20px 24px 40px;display:flex;flex-direction:column;gap:16px;max-width:880px;">
    <PageHeader
      title="Mening manbalarim"
      subtitle="Kuzatmoqchi bo'lgan Telegram kanal username'larini kiriting. Tizim sizning Telegram API'ngiz orqali ularni scan qiladi."
    />

    <!-- TG API holatini ko'rsatish -->
    <div v-if="tgApi.loaded && !tgApi.is_saved"
         style="padding:12px 14px;border-radius:8px;background:rgba(234,179,8,.08);
                border:1px solid rgba(234,179,8,.3);font-size:13px;
                display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
      <span style="font-size:18px;">⚠️</span>
      <span style="flex:1;">
        Avval <strong>Telegram API</strong> sahifasiga o'tib o'z credentials'ingizni kiriting.
        Aks holda manbalarni scan qila olmaymiz.
      </span>
      <button @click="goToTgApi"
              style="padding:7px 14px;border-radius:6px;background:var(--accent);color:#fff;
                     border:none;cursor:pointer;font-size:12.5px;font-weight:500;">
        Telegram API →
      </button>
    </div>

    <div v-else-if="tgApi.loaded && tgApi.is_saved"
         style="padding:10px 14px;border-radius:8px;background:rgba(34,197,94,.06);
                border:1px solid rgba(34,197,94,.25);font-size:12.5px;
                display:flex;align-items:center;gap:10px;">
      <span style="color:#16a34a;font-weight:600;">✓</span>
      <span>Telegram API ulangan — kanallar sizning <code>api_id={{ tgApi.api_id }}</code> orqali o'qiladi.</span>
    </div>

    <!-- Yangi manba qo'shish formasi -->
    <AppPanel title="Yangi manba qo'shish"
              subtitle="Telegram kanal username'i yoki to'liq linki (masalan @kunuz yoki https://t.me/kunuz)">
      <div v-if="tgApi.loaded && !tgApi.is_saved"
           style="padding:14px;border-radius:8px;background:rgba(0,0,0,.03);
                  border:1px dashed var(--border-2);text-align:center;
                  display:flex;flex-direction:column;gap:10px;align-items:center;">
        <span style="font-size:24px;">🔒</span>
        <div style="font-size:13px;color:var(--text);max-width:480px;">
          Manba qo'shish uchun avval <strong>Telegram API</strong> credentials'ingizni saqlang.
          Tizim shu API orqali kanallarni o'qiydi.
        </div>
        <button @click="goToTgApi"
                style="padding:8px 16px;border-radius:6px;background:var(--accent);color:#fff;
                       border:none;cursor:pointer;font-size:12.5px;font-weight:500;">
          Telegram API'ni ulash →
        </button>
      </div>
      <template v-else>
        <form @submit.prevent="addOne" style="display:flex;gap:10px;align-items:flex-start;flex-wrap:wrap;">
          <input
            v-model="newUsername"
            type="text"
            placeholder="@kunuz yoki t.me/kunuz"
            :disabled="adding"
            style="flex:1;min-width:260px;padding:10px 12px;border:1px solid var(--border-2);
                   border-radius:6px;background:var(--bg);color:var(--text);
                   font-family:'JetBrains Mono',Menlo,Consolas,monospace;font-size:13px;"
          />
          <button
            type="submit"
            :disabled="adding || !newUsername.trim()"
            style="padding:10px 18px;border-radius:6px;background:var(--accent);color:#fff;
                   border:none;cursor:pointer;font-size:13px;font-weight:500;"
          >
            {{ adding ? 'Qo\'shilmoqda…' : '+ Qo\'shish' }}
          </button>
        </form>
        <div v-if="addError" style="margin-top:10px;padding:8px 12px;border-radius:6px;
                    background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.25);
                    color:#ef4444;font-size:12.5px;">
          {{ addError }}
        </div>
        <div style="margin-top:8px;font-size:11.5px;color:var(--muted);line-height:1.5;">
          Faqat <strong>public</strong> kanallar qo'llab-quvvatlanadi. Yopiq guruh/kanallar uchun
          sizning hisobingiz a'zo bo'lishi shart.
        </div>
      </template>
    </AppPanel>

    <!-- Ro'yxat -->
    <AppPanel :title="`Manbalar (${sources.length})`"
              :subtitle="sources.length ? 'Yoqilgan manbalar — har scan tsiklida tekshirilib turadi.' : null">
      <div v-if="loading" style="color:var(--muted);font-size:13px;">Yuklanmoqda…</div>
      <div v-else-if="!sources.length" style="padding:30px;text-align:center;color:var(--muted);
                  border:1px dashed var(--border-2);border-radius:8px;font-size:13px;">
        Hozircha manba yo'q. Yuqoridagi forma orqali birinchi kanalingizni qo'shing.
      </div>
      <div v-else style="display:flex;flex-direction:column;gap:8px;">
        <div
          v-for="s in sources"
          :key="s.id"
          style="display:flex;align-items:center;gap:12px;padding:12px;
                 border:1px solid var(--border-2);border-radius:8px;background:var(--bg);"
        >
          <!-- Active toggle -->
          <label style="display:inline-flex;align-items:center;gap:6px;cursor:pointer;
                        user-select:none;font-size:11.5px;color:var(--muted);">
            <input
              type="checkbox"
              :checked="s.is_active"
              @change="toggleActive(s)"
              style="margin:0;cursor:pointer;"
            />
            <span :style="{ color: s.is_active ? '#16a34a' : 'var(--muted)' }">
              {{ s.is_active ? 'Yoqilgan' : 'O\'chirilgan' }}
            </span>
          </label>

          <div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:4px;">
            <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
              <a :href="`https://t.me/${s.username_normalized}`"
                 target="_blank"
                 style="font-family:'JetBrains Mono',monospace;font-size:13.5px;
                        font-weight:600;color:var(--accent);text-decoration:none;">
                @{{ s.username_normalized }}
              </a>
              <span v-if="s.title" style="font-size:12.5px;color:var(--text);">— {{ s.title }}</span>
              <span v-if="s.subscriber_count > 0"
                    style="font-size:11px;color:var(--muted);padding:2px 7px;
                           background:var(--bg-2,rgba(0,0,0,.04));border-radius:999px;">
                {{ formatNumber(s.subscriber_count) }} obunachi
              </span>
            </div>
            <div style="font-size:11px;color:var(--muted);">
              <span v-if="s.last_scanned_at">Oxirgi scan: {{ formatDate(s.last_scanned_at) }}</span>
              <span v-else>Hali scan qilinmagan</span>
              <span v-if="s.last_error" style="color:#ef4444;margin-left:8px;">
                · ⚠ {{ s.last_error }}
              </span>
            </div>
          </div>

          <button
            @click="scanOne(s)"
            :disabled="scanningId === s.id"
            title="Hozir scan qil"
            style="padding:6px 10px;border:1px solid var(--accent);background:transparent;
                   color:var(--accent);border-radius:5px;cursor:pointer;font-size:11.5px;"
          >{{ scanningId === s.id ? '…' : 'Scan' }}</button>
          <button
            @click="remove(s)"
            title="O'chirish"
            style="padding:6px 10px;border:1px solid #ef4444;background:transparent;
                   color:#ef4444;border-radius:5px;cursor:pointer;font-size:11.5px;"
          >O'chirish</button>
        </div>
      </div>
    </AppPanel>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppPanel from '@/components/ui/AppPanel.vue'
import PageHeader from '@/components/layout/PageHeader.vue'
import { companiesApi } from '@/api/companies.js'

const router = useRouter()
const loading = ref(true)
const adding = ref(false)
const addError = ref(null)
const newUsername = ref('')
const sources = ref([])
const scanningId = ref(null)
const company = ref(null)
const tgApi = reactive({ loaded: false, is_saved: false, api_id: null })

function formatDate(d) {
  if (!d) return ''
  try { return new Date(d).toLocaleString('uz-UZ', { dateStyle: 'medium', timeStyle: 'short' }) }
  catch { return String(d) }
}
function formatNumber(n) {
  return (Number(n) || 0).toLocaleString('uz-UZ').replace(/,/g, ' ')
}
function goToTgApi() { router.push('/client/telegram-api') }

async function reload() {
  if (!company.value) return
  sources.value = await companiesApi.listOwnedSources(company.value.id)
}

onMounted(async () => {
  try {
    const list = await companiesApi.getMy().catch(() => [])
    const arr = Array.isArray(list) ? list : [list].filter(Boolean)
    company.value = arr[0] || null
    if (!company.value) return
    const [api] = await Promise.all([
      companiesApi.getTelegramApi(company.value.id),
      reload(),
    ])
    tgApi.loaded = true
    tgApi.is_saved = !!api.is_saved
    tgApi.api_id = api.api_id
  } catch (e) {
    addError.value = e?.response?.data?.message ?? e.message
  } finally {
    loading.value = false
  }
})

async function addOne() {
  if (!company.value || !newUsername.value.trim()) return
  adding.value = true
  addError.value = null
  try {
    await companiesApi.addOwnedSource(company.value.id, newUsername.value.trim())
    newUsername.value = ''
    await reload()
  } catch (e) {
    addError.value = e?.response?.data?.message ?? e.message
  } finally {
    adding.value = false
  }
}

async function toggleActive(s) {
  try {
    await companiesApi.updateOwnedSource(company.value.id, s.id, { is_active: !s.is_active })
    await reload()
  } catch (e) {
    alert(e?.response?.data?.message ?? e.message)
  }
}

async function scanOne(s) {
  if (!company.value) return
  scanningId.value = s.id
  try {
    await companiesApi.scanOwnedSource(company.value.id, s.id)
    alert('Scan navbatga qo\'shildi. Bir necha soniyadan keyin postlar paydo bo\'ladi (worker ishlamayotgan bo\'lsa, biroz vaqt ketishi mumkin).')
    setTimeout(reload, 3000)
  } catch (e) {
    alert(e?.response?.data?.message ?? e.message)
  } finally {
    scanningId.value = null
  }
}

async function remove(s) {
  if (!confirm(`@${s.username_normalized} manbasini o'chirmoqchimisiz?`)) return
  try {
    await companiesApi.removeOwnedSource(company.value.id, s.id)
    await reload()
  } catch (e) {
    alert(e?.response?.data?.message ?? e.message)
  }
}
</script>
