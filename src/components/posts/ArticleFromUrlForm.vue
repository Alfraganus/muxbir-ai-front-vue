<template>
  <div style="display:flex;flex-direction:column;gap:14px;">
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
    <div style="display:flex;flex-direction:column;gap:6px;">
      <span style="font-size:12px;font-weight:600;color:var(--text);">4. Prompt</span>
      <div v-if="loadingGroups" style="font-size:12.5px;color:var(--muted);">Yuklanmoqda…</div>
      <div v-else-if="!groups.length"
           style="padding:14px;text-align:center;border:1px dashed var(--border-2);border-radius:8px;
                  display:flex;flex-direction:column;gap:8px;align-items:center;font-size:12.5px;">
        <span style="color:var(--text);">Hali prompt yo'q. Avval AI prompt sahifasida yarating.</span>
        <button type="button" @click="$emit('goto', '/client/ai-prompt')"
                style="padding:7px 14px;border-radius:6px;background:var(--accent);color:#fff;
                       border:none;cursor:pointer;font-size:12px;font-weight:500;">
          AI prompt →
        </button>
      </div>
      <select v-else v-model="form.groupId" :disabled="busy"
              style="padding:9px 12px;border:1px solid var(--border-2);border-radius:6px;
                     background:var(--bg);color:var(--text);font-size:13px;">
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
        :disabled="busy || !form.url || !form.groupId"
        :style="{
          padding: '10px 20px', borderRadius: '7px',
          background: (busy || !form.url || !form.groupId) ? 'var(--bg-2,rgba(0,0,0,.05))' : 'var(--accent)',
          color: (busy || !form.url || !form.groupId) ? 'var(--muted)' : '#fff',
          border: 'none', cursor: (busy || !form.url || !form.groupId) ? 'default' : 'pointer',
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

const emit = defineEmits(['created', 'goto'])

const busy = ref(false)
const error = ref(null)
const loadingGroups = ref(true)
const groups = ref([])
const company = ref(null)

const providers = [
  { id: 'openai', label: 'OpenAI', note: 'GPT-4o, mini' },
  { id: 'gemini', label: 'Gemini', note: '2.5 Pro/Flash' },
]
const modelsByProvider = {
  openai: [
    { id: 'gpt-4o-mini',   label: 'gpt-4o-mini',   note: 'tezkor (default)' },
    { id: 'gpt-4o',        label: 'gpt-4o',        note: 'eng kuchli' },
    { id: 'gpt-4-turbo',   label: 'gpt-4-turbo',   note: 'oldingi avlod' },
    { id: 'gpt-3.5-turbo', label: 'gpt-3.5-turbo', note: 'eng arzon' },
  ],
  gemini: [
    { id: 'gemini-2.5-flash',      label: 'gemini-2.5-flash',      note: 'default' },
    { id: 'gemini-2.5-pro',        label: 'gemini-2.5-pro',        note: 'eng kuchli' },
    { id: 'gemini-2.5-flash-lite', label: 'gemini-2.5-flash-lite', note: 'eng arzon' },
    { id: 'gemini-2.0-flash',      label: 'gemini-2.0-flash',      note: 'barqaror' },
    { id: 'gemini-flash-latest',   label: 'gemini-flash-latest',   note: 'eng yangi Flash' },
    { id: 'gemini-pro-latest',     label: 'gemini-pro-latest',     note: 'eng yangi Pro' },
  ],
}

const form = reactive({
  url: '',
  groupId: '',
  provider: 'openai',
  model: 'gpt-4o-mini',
})

const availableModels = computed(() => modelsByProvider[form.provider] || [])

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
    if (groups.value.length === 1) form.groupId = groups.value[0].id
  } catch (e) {
    error.value = e?.response?.data?.message ?? e.message
  } finally {
    loadingGroups.value = false
  }
})

async function generate() {
  if (!company.value || !form.url.trim() || !form.groupId) return
  error.value = null
  busy.value = true
  try {
    const r = await companiesApi.createPostFromUrl(company.value.id, {
      url: form.url.trim(),
      prompt_group_id: form.groupId,
      provider: form.provider,
      model: form.model,
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
