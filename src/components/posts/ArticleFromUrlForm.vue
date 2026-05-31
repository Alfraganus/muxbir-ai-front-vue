<template>
  <div style="display:flex;flex-direction:column;gap:14px;">
    <AiFullPageLoader
      :model-value="busy"
      title="Havoladan maqola yaratilmoqda"
      subtitle="AI sahifani o'qib, sizning uslubingizda maqola yozmoqda"
      :steps="[
        'Havola yuklanmoqda',
        'Sahifa matni tahlil qilinmoqda',
        'AI yangi maqola yozmoqda',
        'Editor tayyorlanmoqda',
      ]"
      hint="Bu jarayon odatda 15–40 soniya davom etadi. Sahifani yopmang yoki boshqa joyga o'tib ketmang."
    />
    <!-- URL -->
    <label style="display:flex;flex-direction:column;gap:6px;">
      <span style="font-size:12px;font-weight:600;color:var(--text);">1. Maqola havolasi</span>
      <input
        v-model="form.url"
        type="url"
        placeholder="https://kun.uz/news/2026/..."
        :disabled="busy"
        style="padding:10px 12px;border:1px solid var(--border-2);border-radius:6px;
               background:var(--bg);color:var(--text);font-size:13px;
               font-family:'JetBrains Mono',Menlo,Consolas,monospace;"
      />
      <span style="font-size:11px;color:var(--muted);">
        AI sahifaga kirib matnni oladi, tanlangan prompt'ga muvofiq qayta yozadi.
      </span>
    </label>

    <!-- Provider -->
    <div style="display:flex;flex-direction:column;gap:6px;">
      <span style="font-size:12px;font-weight:600;color:var(--text);">2. AI provayder</span>
      <div style="display:flex;gap:8px;">
        <label v-for="p in providers" :key="p.id"
               :style="{
                 flex: '1', display: 'flex', alignItems: 'center', gap: '8px',
                 padding: '10px 12px', cursor: 'pointer',
                 border: '1px solid ' + (form.provider === p.id ? 'var(--accent)' : 'var(--border-2)'),
                 borderRadius: '7px',
                 background: form.provider === p.id ? 'rgba(99,102,241,.06)' : 'var(--bg)',
               }">
          <input v-model="form.provider" type="radio" :value="p.id" :disabled="busy" style="margin:0;cursor:pointer;"/>
          <div style="display:flex;flex-direction:column;gap:1px;">
            <span style="font-size:12.5px;font-weight:600;color:var(--text);">{{ p.label }}</span>
            <span style="font-size:10.5px;color:var(--muted);">{{ p.note }}</span>
          </div>
        </label>
      </div>
    </div>

    <!-- Model -->
    <label style="display:flex;flex-direction:column;gap:6px;">
      <span style="font-size:12px;font-weight:600;color:var(--text);">3. Model</span>
      <select v-model="form.model" :disabled="busy"
              style="padding:9px 12px;border:1px solid var(--border-2);border-radius:6px;
                     background:var(--bg);color:var(--text);font-size:13px;
                     font-family:'JetBrains Mono',monospace;">
        <option v-for="m in availableModels" :key="m.id" :value="m.id">
          {{ m.label }} {{ m.note ? '— ' + m.note : '' }}
        </option>
      </select>
    </label>

    <!-- Prompt -->
    <div style="display:flex;flex-direction:column;gap:8px;">
      <span style="font-size:12px;font-weight:600;color:var(--text);">4. Prompt</span>

      <!-- Tavsiya etilgan promptdan foydalanish — faqat admin shu turdagi
           prompt yaratgan bo'lsa ko'rinadi -->
      <label v-if="recommended.exists" class="afu-recommend" :class="{ on: form.useRecommended }">
        <input type="checkbox" v-model="form.useRecommended" :disabled="busy"/>
        <div style="display:flex;flex-direction:column;gap:2px;flex:1;">
          <span style="font-size:13px;font-weight:600;color:var(--text);">
            ✨ Tavsiya etilgan promptdan foydalanish
            <span v-if="recommended.name" style="color:var(--muted);font-weight:400;">
              — {{ recommended.name }}
            </span>
          </span>
          <span style="font-size:11px;color:var(--muted);">
            Admin tomonidan tayyorlangan eng yaxshi prompt avtomatik ishlatiladi.
            Ushbu rejimda quyidagi ro'yxat o'chiriladi.
          </span>
        </div>
      </label>

      <div v-if="loadingGroups" style="font-size:12.5px;color:var(--muted);">Yuklanmoqda…</div>
      <div v-else-if="!groups.length && !form.useRecommended"
           style="padding:14px;text-align:center;border:1px dashed var(--border-2);border-radius:8px;
                  display:flex;flex-direction:column;gap:8px;align-items:center;font-size:12.5px;">
        <span style="color:var(--text);">Hali prompt yo'q. Avval AI prompt sahifasida yarating.</span>
        <button type="button" @click="$emit('goto', '/client/ai-prompt')"
                style="padding:7px 14px;border-radius:6px;background:var(--accent);color:#fff;
                       border:none;cursor:pointer;font-size:12px;font-weight:500;">
          AI prompt →
        </button>
      </div>
      <select v-else v-model="form.groupId" :disabled="busy || form.useRecommended"
              :style="{
                padding: '9px 12px',
                border: '1px solid var(--border-2)',
                borderRadius: '6px',
                background: form.useRecommended ? 'var(--panel-2, rgba(99,102,241,.04))' : 'var(--bg)',
                color: form.useRecommended ? 'var(--muted)' : 'var(--text)',
                fontSize: '13px',
                opacity: form.useRecommended ? 0.5 : 1,
                cursor: form.useRecommended ? 'not-allowed' : 'pointer',
              }">
        <option value="" disabled>Promptni tanlang…</option>
        <option v-for="g in groups" :key="g.id" :value="g.id">
          {{ g.name }} · {{ g.prompts.length }} bo'lim{{ anyApplyBase(g) ? ' · BASE' : '' }}
        </option>
      </select>
    </div>

    <!-- Xato -->
    <div v-if="error"
         style="padding:10px 12px;border-radius:7px;background:rgba(239,68,68,.08);
                border:1px solid rgba(239,68,68,.25);color:#ef4444;font-size:12.5px;">
      {{ error }}
    </div>

    <!-- Submit -->
    <div style="display:flex;gap:10px;align-items:center;padding-top:6px;border-top:1px dashed var(--border-2);margin-top:4px;">
      <button
        type="button"
        @click="generate"
        :disabled="canSubmit === false"
        :style="{
          padding: '10px 20px', borderRadius: '7px',
          background: canSubmit ? 'var(--accent)' : 'var(--bg-2,rgba(0,0,0,.05))',
          color: canSubmit ? '#fff' : 'var(--muted)',
          border: 'none', cursor: canSubmit ? 'pointer' : 'default',
          fontSize: '13px', fontWeight: 600,
        }"
      >
        {{ busy ? 'Yaratilmoqda…' : '✨ AI orqali maqola yaratish' }}
      </button>
      <span v-if="busy" style="font-size:11.5px;color:var(--muted);">
        URL → AI → editor…
      </span>
    </div>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref, computed, watch } from 'vue'
import { companiesApi } from '@/api/companies.js'
import { aiApi } from '@/api/ai.js'
import AiFullPageLoader from '@/components/ui/AiFullPageLoader.vue'

const emit = defineEmits(['created', 'goto'])

const busy = ref(false)
const error = ref(null)
const loadingGroups = ref(true)
const groups = ref([])
const company = ref(null)

const providers = [
  { id: 'openai', label: 'OpenAI', note: 'GPT-4o, mini' },
  { id: 'gemini', label: 'Gemini', note: '2.5 Pro / Flash / Flash-Lite' },
]
const modelsByProvider = {
  openai: [
    { id: 'gpt-4o-mini',   label: 'gpt-4o-mini',   note: 'tezkor (default)' },
    { id: 'gpt-4o',        label: 'gpt-4o',        note: 'eng kuchli' },
    { id: 'gpt-4-turbo',   label: 'gpt-4-turbo',   note: 'oldingi avlod' },
    { id: 'gpt-3.5-turbo', label: 'gpt-3.5-turbo', note: 'eng arzon' },
  ],
  gemini: [
    { id: 'gemini-2.5-flash',      label: 'gemini-2.5-flash',      note: 'tezkor (default)' },
    { id: 'gemini-2.5-pro',        label: 'gemini-2.5-pro',        note: 'eng kuchli' },
    { id: 'gemini-2.5-flash-lite', label: 'gemini-2.5-flash-lite', note: 'eng arzon' },
    { id: 'gemini-flash-latest',   label: 'gemini-flash-latest',   note: 'eng yangi Flash' },
  ],
}

// localStorage'da oxirgi tanlov saqlanadi (URL tashqarida — chunki har gal yangi)
const LS_KEY = 'muxbir.article-from-url.preferences'
const savedPrefs = (() => {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '{}') }
  catch { return {} }
})()

const form = reactive({
  url: '',
  groupId:  savedPrefs.groupId  || '',
  provider: savedPrefs.provider || 'openai',
  model:    savedPrefs.model    || 'gpt-4o-mini',
  // Default: yoqilgan — admin tavsiya etgan prompt ishlatiladi.
  // Lekin admin tavsiya etgan prompt mavjud bo'lmasa, onMounted'da false ga tushiriladi.
  useRecommended: savedPrefs.useRecommended === undefined ? true : !!savedPrefs.useRecommended,
})

// Admin tomonidan tavsiya etilgan prompt mavjudmi? null — hali tekshirilmagan.
const recommended = ref({ exists: false, name: null, loaded: false })

const availableModels = computed(() => modelsByProvider[form.provider] || [])

const canSubmit = computed(() => {
  if (busy.value) return false
  if (!form.url) return false
  // useRecommended yoqilgan bo'lsa — prompt tanlash shart emas
  if (form.useRecommended) return true
  return !!form.groupId
})

// Tanlov o'zgarganda — localStorage'ga avtomatik yozish (url'siz)
watch(
  () => ({
    groupId: form.groupId, provider: form.provider, model: form.model,
    useRecommended: form.useRecommended,
  }),
  (v) => {
    try { localStorage.setItem(LS_KEY, JSON.stringify(v)) } catch {}
  },
  { deep: true },
)

watch(() => form.provider, (p) => {
  const list = modelsByProvider[p] || []
  if (list.length && !list.some(m => m.id === form.model)) {
    form.model = list[0].id
  }
})

function anyApplyBase(g) {
  return (g.prompts || []).some((p) => !!p.apply_base)
}

onMounted(async () => {
  try {
    const list = await companiesApi.getMy().catch(() => [])
    const arr = Array.isArray(list) ? list : [list].filter(Boolean)
    company.value = arr[0] || null
    if (!company.value) return
    const r = await companiesApi.getAiPromptGroups(company.value.id)
    groups.value = r.groups || []
    // Saqlangan groupId DB'da mavjudmi tekshirish, yo'q bo'lsa birinchisini tanlash
    if (form.groupId && !groups.value.some(g => g.id === form.groupId)) {
      form.groupId = groups.value[0]?.id || ''
    } else if (!form.groupId && groups.value.length) {
      form.groupId = groups.value[0].id
    }
  } catch (e) {
    error.value = e?.response?.data?.message ?? e.message
  } finally {
    loadingGroups.value = false
  }

  // Admin tomonidan tavsiya etilgan prompt mavjudligini tekshirish
  try {
    const r = await aiApi.getRecommendedPrompt('article_from_url')
    recommended.value = { exists: !!r?.exists, name: r?.name || null, loaded: true }
  } catch {
    recommended.value = { exists: false, name: null, loaded: true }
  }
  // Tavsiya etilgan prompt yo'q bo'lsa, foydalanuvchining tanlovini majburan
  // o'chiramiz — chunki bu rejim ishlamaydi.
  if (!recommended.value.exists && form.useRecommended) {
    form.useRecommended = false
  }
})

async function generate() {
  if (!company.value || !form.url.trim()) return
  // Tavsiya etilgan promptdan foydalanmasdan, hech qanday prompt tanlanmagan bo'lsa — to'xtatish
  if (!form.useRecommended && !form.groupId) return
  error.value = null
  busy.value = true
  try {
    const r = await companiesApi.createPostFromUrl(company.value.id, {
      url: form.url.trim(),
      prompt_group_id: form.useRecommended ? undefined : form.groupId,
      provider: form.provider,
      model: form.model,
      use_admin_recommended: form.useRecommended,
    })
    if (r?.post_id) {
      emit('created', r.post_id)
    } else {
      error.value = 'Backend post_id qaytarmadi'
    }
  } catch (e) {
    error.value = e?.response?.data?.message ?? e.message
  } finally {
    busy.value = false
  }
}
</script>

<style scoped>
.afu-recommend {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 11px 13px;
  border-radius: 8px;
  border: 1px solid var(--border-2);
  background: var(--bg);
  cursor: pointer;
  transition: border-color .15s, background .15s;
}
.afu-recommend:hover { border-color: var(--accent); }
.afu-recommend.on {
  border-color: color-mix(in oklab, var(--accent) 40%, transparent);
  background: color-mix(in oklab, var(--accent) 6%, transparent);
}
.afu-recommend input[type="checkbox"] {
  margin: 2px 0 0;
  width: 16px;
  height: 16px;
  accent-color: var(--accent);
  cursor: pointer;
  flex-shrink: 0;
}
</style>
