<template>
  <div class="csm-overlay" @click.self="$emit('close')">
    <div class="csm-modal">
      <!-- Header -->
      <div class="csm-head">
        <div style="min-width:0;">
          <div class="csm-title">Manbalar</div>
          <div class="csm-sub">
            <strong>{{ channel.display_name || channel.username || 'Kanal' }}</strong>
            uchun postlar ovlanadigan Telegram kanallari
          </div>
        </div>
        <button class="csm-x" @click="$emit('close')" aria-label="Yopish">✕</button>
      </div>

      <div class="csm-body">
        <!-- Manba turi -->
        <div class="csm-types">
          <button type="button" class="csm-type" :class="{ active: newType === 'telegram' }" @click="newType = 'telegram'">
            <AppIcon name="Telegram" :size="15"/>
            <span>Telegram kanal</span>
          </button>
          <button type="button" class="csm-type" :class="{ active: newType === 'website' }" @click="newType = 'website'">
            <AppIcon name="Globe" :size="15"/>
            <span>Website</span>
          </button>
          <button type="button" class="csm-type csm-type-soon" disabled title="Tez orada">
            <AppIcon name="Facebook" :size="15"/>
            <span>Facebook</span>
            <span class="csm-soon">tez orada</span>
          </button>
          <button type="button" class="csm-type csm-type-soon" disabled title="Tez orada">
            <AppIcon name="Instagram" :size="15"/>
            <span>Instagram</span>
            <span class="csm-soon">tez orada</span>
          </button>
        </div>

        <!-- TG API holati (faqat telegram tur uchun) -->
        <div v-if="newType === 'telegram' && tgApi.loaded && !tgApi.is_saved" class="csm-warn">
          <span style="font-size:16px;">⚠️</span>
          <span style="flex:1;">
            Telegram manba uchun avval <strong>Telegram API</strong> credentials'ingizni kiriting.
          </span>
          <button class="csm-btn-accent" @click="goToTgApi">Telegram API →</button>
        </div>

        <!-- Yangi manba qo'shish -->
        <form class="csm-add" @submit.prevent="addOne">
          <input
            v-model="newValue"
            type="text"
            :placeholder="newType === 'website' ? 'https://kun.uz (news portal manzili)' : '@kunuz yoki t.me/kunuz'"
            :disabled="adding"
            class="csm-input"
          />
          <button type="submit" :disabled="adding || !newValue.trim() || telegramLocked" class="csm-btn-accent">
            {{ adding ? 'Qo\'shilmoqda…' : '+ Qo\'shish' }}
          </button>
        </form>
        <div class="csm-hint">
          {{ newType === 'website'
            ? 'Sayt URL’ini kiriting — RSS feed avtomatik topiladi, bo‘lmasa sahifadan o‘qiladi.'
            : 'Public Telegram kanal @username yoki t.me linki.' }}
        </div>
        <div v-if="addError" class="csm-err">{{ addError }}</div>

        <!-- Ro'yxat -->
        <div v-if="loading" class="csm-muted">Yuklanmoqda…</div>
        <div v-else-if="!sources.length" class="csm-empty">
          Bu kanal uchun hali manba yo'q. Yuqorida birinchi Telegram kanalini qo'shing.
        </div>
        <div v-else class="csm-list">
          <div v-for="s in sources" :key="s.id" class="csm-row">
            <label class="csm-toggle">
              <input type="checkbox" :checked="s.is_active" @change="toggleActive(s)" />
              <span :style="{ color: s.is_active ? '#16a34a' : 'var(--muted)' }">
                {{ s.is_active ? 'Yoqilgan' : 'O\'chirilgan' }}
              </span>
            </label>

            <div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:3px;">
              <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
                <span class="csm-type-badge" :class="s.source_type === 'website' ? 'web' : 'tg'">
                  <AppIcon :name="s.source_type === 'website' ? 'Globe' : 'Telegram'" :size="10"/>
                  {{ s.source_type === 'website' ? 'Website' : 'Telegram' }}
                </span>
                <a v-if="s.source_type === 'website'" :href="s.username_raw || ('https://' + s.username_normalized)" target="_blank" class="csm-handle">
                  {{ s.username_normalized }}
                </a>
                <a v-else :href="`https://t.me/${s.username_normalized}`" target="_blank" class="csm-handle">
                  @{{ s.username_normalized }}
                </a>
                <span v-if="s.title && s.title !== s.username_normalized" style="font-size:12px;color:var(--text);">— {{ s.title }}</span>
                <span v-if="s.subscriber_count > 0" class="csm-badge">
                  {{ formatNumber(s.subscriber_count) }} obunachi
                </span>
              </div>
              <div style="font-size:11px;color:var(--muted);">
                <span v-if="s.last_scanned_at">Oxirgi scan: {{ formatDate(s.last_scanned_at) }}</span>
                <span v-else>Hali scan qilinmagan</span>
                <span v-if="s.last_error" style="color:#ef4444;margin-left:6px;">· ⚠ {{ s.last_error }}</span>
              </div>
            </div>

            <button @click="scanOne(s)" :disabled="scanningId === s.id" class="csm-btn-ghost" title="Hozir scan qil">
              {{ scanningId === s.id ? '…' : 'Scan' }}
            </button>
            <button @click="remove(s)" class="csm-btn-danger" title="O'chirish">O'chirish</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import AppIcon from '@/components/ui/AppIcon.vue'
import { channelsApi } from '@/api/channels.js'
import { companiesApi } from '@/api/companies.js'

const props = defineProps({
  companyId: { type: [String, Number], required: true },
  channel: { type: Object, required: true },
})
defineEmits(['close'])

const router = useRouter()
const loading = ref(true)
const adding = ref(false)
const addError = ref(null)
const newType = ref('telegram')   // 'telegram' | 'website'
const newValue = ref('')
const sources = ref([])
const scanningId = ref(null)
const tgApi = reactive({ loaded: false, is_saved: false })

// Telegram manba uchun TG API saqlanmagan bo'lsa — qo'shishni bloklash
const telegramLocked = computed(() => newType.value === 'telegram' && tgApi.loaded && !tgApi.is_saved)

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
  sources.value = await channelsApi.listSources(props.companyId, props.channel.id)
}

onMounted(async () => {
  try {
    const [api] = await Promise.all([
      companiesApi.getTelegramApi(props.companyId).catch(() => ({ is_saved: false })),
      reload(),
    ])
    tgApi.loaded = true
    tgApi.is_saved = !!api.is_saved
  } catch (e) {
    addError.value = e?.response?.data?.message ?? e.message
  } finally {
    loading.value = false
  }
})

async function addOne() {
  const val = newValue.value.trim()
  if (!val || telegramLocked.value) return
  adding.value = true
  addError.value = null
  try {
    const payload = newType.value === 'website'
      ? { source_type: 'website', url: val }
      : { source_type: 'telegram', username: val }
    await channelsApi.addSource(props.companyId, props.channel.id, payload)
    newValue.value = ''
    await reload()
  } catch (e) {
    addError.value = e?.response?.data?.message ?? e.message
  } finally {
    adding.value = false
  }
}

async function toggleActive(s) {
  try {
    await channelsApi.updateSource(props.companyId, props.channel.id, s.id, { is_active: !s.is_active })
    await reload()
  } catch (e) {
    alert(e?.response?.data?.message ?? e.message)
  }
}

async function scanOne(s) {
  scanningId.value = s.id
  try {
    await channelsApi.scanSource(props.companyId, props.channel.id, s.id)
    alert('Scan navbatga qo\'shildi. Bir necha soniyadan keyin postlar paydo bo\'ladi.')
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
    await channelsApi.removeSource(props.companyId, props.channel.id, s.id)
    await reload()
  } catch (e) {
    alert(e?.response?.data?.message ?? e.message)
  }
}
</script>

<style scoped>
.csm-overlay {
  position: fixed; inset: 0; z-index: 1000;
  background: rgba(0,0,0,.45);
  display: flex; align-items: flex-start; justify-content: center;
  padding: 40px 16px; overflow-y: auto;
}
.csm-modal {
  width: 100%; max-width: 640px;
  background: var(--bg); color: var(--text);
  border: 1px solid var(--border-2); border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0,0,0,.3);
  display: flex; flex-direction: column;
}
.csm-head {
  display: flex; align-items: flex-start; gap: 12px;
  padding: 16px 18px; border-bottom: 1px solid var(--border-2);
}
.csm-title { font-size: 15px; font-weight: 700; }
.csm-sub { font-size: 12px; color: var(--muted); margin-top: 3px; }
.csm-x {
  margin-left: auto; background: transparent; border: none; cursor: pointer;
  color: var(--muted); font-size: 16px; line-height: 1; padding: 4px;
}
.csm-body { padding: 16px 18px; display: flex; flex-direction: column; gap: 12px; }
.csm-warn {
  padding: 10px 12px; border-radius: 8px; font-size: 12.5px;
  background: rgba(234,179,8,.08); border: 1px solid rgba(234,179,8,.3);
  display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
}
.csm-add { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
.csm-input {
  flex: 1; min-width: 200px; padding: 9px 11px;
  border: 1px solid var(--border-2); border-radius: 6px;
  background: var(--bg); color: var(--text);
  font-family: 'JetBrains Mono', Menlo, Consolas, monospace; font-size: 13px;
}
.csm-btn-accent {
  padding: 9px 16px; border-radius: 6px; background: var(--accent); color: #fff;
  border: none; cursor: pointer; font-size: 12.5px; font-weight: 500; white-space: nowrap;
}
.csm-btn-accent:disabled { opacity: .6; cursor: default; }
.csm-err {
  padding: 8px 12px; border-radius: 6px; font-size: 12.5px; color: #ef4444;
  background: rgba(239,68,68,.08); border: 1px solid rgba(239,68,68,.25);
}
.csm-types { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
.csm-type {
  display: flex; align-items: center; gap: 7px; position: relative;
  padding: 9px 11px; border: 1.5px solid var(--border-2); border-radius: 8px;
  background: var(--bg); color: var(--text); cursor: pointer;
  font-size: 12.5px; font-weight: 500; font-family: inherit;
}
.csm-type.active { border-color: var(--accent); background: color-mix(in oklab, var(--accent) 8%, var(--bg)); color: var(--accent); }
.csm-type-soon { opacity: .55; cursor: not-allowed; }
.csm-soon {
  margin-left: auto; font-size: 9px; text-transform: uppercase; letter-spacing: .04em;
  color: var(--muted); background: var(--bg-2, rgba(0,0,0,.05)); padding: 1px 5px; border-radius: 999px;
}
.csm-hint { font-size: 11px; color: var(--muted); line-height: 1.5; }
.csm-type-badge {
  display: inline-flex; align-items: center; gap: 3px; flex-shrink: 0;
  font-size: 9.5px; font-weight: 600; letter-spacing: .03em; text-transform: uppercase;
  padding: 2px 6px; border-radius: 4px;
}
.csm-type-badge.tg { color: #2AABEE; background: rgba(42,171,238,.12); }
.csm-type-badge.web { color: #16a34a; background: rgba(34,197,94,.12); }
.csm-muted { color: var(--muted); font-size: 13px; }
.csm-empty {
  padding: 26px; text-align: center; color: var(--muted); font-size: 13px;
  border: 1px dashed var(--border-2); border-radius: 8px;
}
.csm-list { display: flex; flex-direction: column; gap: 8px; }
.csm-row {
  display: flex; align-items: center; gap: 10px; padding: 11px;
  border: 1px solid var(--border-2); border-radius: 8px; background: var(--bg);
}
.csm-toggle {
  display: inline-flex; align-items: center; gap: 5px; cursor: pointer;
  user-select: none; font-size: 11px; color: var(--muted); white-space: nowrap;
}
.csm-handle {
  font-family: 'JetBrains Mono', monospace; font-size: 13px; font-weight: 600;
  color: var(--accent); text-decoration: none;
}
.csm-badge {
  font-size: 11px; color: var(--muted); padding: 2px 7px;
  background: var(--bg-2, rgba(0,0,0,.04)); border-radius: 999px;
}
.csm-btn-ghost {
  padding: 6px 10px; border: 1px solid var(--accent); background: transparent;
  color: var(--accent); border-radius: 5px; cursor: pointer; font-size: 11.5px;
}
.csm-btn-danger {
  padding: 6px 10px; border: 1px solid #ef4444; background: transparent;
  color: #ef4444; border-radius: 5px; cursor: pointer; font-size: 11.5px;
}
</style>
