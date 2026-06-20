<template>
  <div style="padding:20px 24px 40px;display:flex;flex-direction:column;gap:16px;max-width:880px;">
    <AiFullPageLoader
      :model-value="busy"
      :title="tt('clientArticleFromUrl.loaderTitle')"
      :subtitle="tt('clientArticleFromUrl.loaderSubtitle')"
      :steps="[
        tt('clientArticleFromUrl.step1'),
        tt('clientArticleFromUrl.step2'),
        tt('clientArticleFromUrl.step3'),
        tt('clientArticleFromUrl.step4'),
      ]"
      :hint="tt('clientArticleFromUrl.loaderHint')"
    />
    <PageHeader
      :title="tt('clientArticleFromUrl.pageTitle')"
      :subtitle="tt('clientArticleFromUrl.pageSubtitle')"
    />

    <AppPanel :title="tt('clientArticleFromUrl.panel1Title')">
      <form @submit.prevent="generate" style="display:flex;flex-direction:column;gap:12px;">
        <label style="display:flex;flex-direction:column;gap:6px;">
          <span style="font-size:12px;font-weight:600;color:var(--text);">{{ tt('clientArticleFromUrl.urlLabel') }}</span>
          <input
            v-model="form.url"
            type="url"
            placeholder="https://muxbir.ai/news/2026/..."
            :disabled="busy"
            required
            style="padding:10px 12px;border:1px solid var(--border-2);border-radius:6px;
                   background:var(--bg);color:var(--text);font-size:13px;
                   font-family:'JetBrains Mono',Menlo,Consolas,monospace;"
          />
        </label>
        <span style="font-size:11.5px;color:var(--muted);">
          {{ tt('clientArticleFromUrl.urlHint') }}
        </span>
      </form>
    </AppPanel>

    <AppPanel :title="tt('clientArticleFromUrl.panel2Title')"
              :subtitle="tt('clientArticleFromUrl.panel2Subtitle')">
      <div style="display:flex;flex-direction:column;gap:14px;">
        <!-- Provider radio -->
        <div style="display:flex;gap:10px;">
          <label v-for="p in providers" :key="p.id"
                 :style="{
                   flex: '1', display: 'flex', alignItems: 'center', gap: '10px',
                   padding: '12px 14px', cursor: 'pointer',
                   border: '1px solid ' + (form.provider === p.id ? 'var(--accent)' : 'var(--border-2)'),
                   borderRadius: '8px',
                   background: form.provider === p.id ? 'rgba(99,102,241,.06)' : 'var(--bg)',
                 }">
            <input v-model="form.provider" type="radio" :value="p.id" :disabled="busy" style="margin:0;cursor:pointer;"/>
            <div style="display:flex;flex-direction:column;gap:2px;">
              <span style="font-size:13px;font-weight:600;color:var(--text);">{{ p.label }}</span>
              <span style="font-size:11px;color:var(--muted);">{{ p.note }}</span>
            </div>
          </label>
        </div>

        <!-- Model dropdown — provider'ga qarab -->
        <label style="display:flex;flex-direction:column;gap:6px;">
          <span style="font-size:12px;font-weight:600;color:var(--text);">{{ tt('clientArticleFromUrl.modelLabel') }}</span>
          <select v-model="form.model" :disabled="busy"
                  style="padding:10px 12px;border:1px solid var(--border-2);border-radius:6px;
                         background:var(--bg);color:var(--text);font-size:13px;
                         font-family:'JetBrains Mono',monospace;">
            <option v-for="m in availableModels" :key="m.id" :value="m.id">
              {{ m.label }} {{ m.note ? '— ' + m.note : '' }}
            </option>
          </select>
        </label>
      </div>
    </AppPanel>

    <AppPanel :title="tt('clientArticleFromUrl.panel3Title')" :subtitle="promptPanelSubtitle">
      <!-- Tavsiya etilgan promptdan foydalanish — faqat admin shu turdagi
           prompt yaratgan bo'lsa ko'rinadi -->
      <label v-if="recommended.exists" class="cafu-recommend" :class="{ on: form.useRecommended }">
        <input type="checkbox" v-model="form.useRecommended" :disabled="busy"/>
        <div style="display:flex;flex-direction:column;gap:3px;flex:1;">
          <span style="font-size:13.5px;font-weight:600;color:var(--text);">
            ✨ {{ tt('clientArticleFromUrl.useRecommended') }}
            <span v-if="recommended.name" style="color:var(--muted);font-weight:400;">
              — {{ recommended.name }}
            </span>
          </span>
          <span style="font-size:12px;color:var(--muted);line-height:1.5;">
            {{ tt('clientArticleFromUrl.useRecommendedHint') }}
          </span>
        </div>
      </label>

      <div v-if="loadingGroups" style="font-size:12.5px;color:var(--muted);margin-top:10px;">{{ tt('clientArticleFromUrl.loading') }}</div>
      <div v-else-if="!groups.length && !form.useRecommended"
           style="margin-top:10px;padding:18px;text-align:center;border:1px dashed var(--border-2);border-radius:8px;
                  display:flex;flex-direction:column;gap:8px;align-items:center;">
        <span style="font-size:13px;color:var(--text);">
          {{ tt('clientArticleFromUrl.noGroups') }}
        </span>
        <button type="button" @click="$router.push('/client/ai-prompt')"
                style="padding:8px 16px;border-radius:6px;background:var(--accent);color:#fff;
                       border:none;cursor:pointer;font-size:12.5px;font-weight:500;">
          {{ tt('clientArticleFromUrl.aiPromptBtn') }} →
        </button>
      </div>
      <div v-else :class="{ 'cafu-disabled': form.useRecommended }"
           style="display:flex;flex-direction:column;gap:8px;margin-top:10px;">
        <label v-for="g in groups" :key="g.id"
               :style="{
                 display: 'flex',
                 alignItems: 'center',
                 gap: '10px',
                 padding: '10px 12px',
                 border: '1px solid ' + (form.groupId === g.id && !form.useRecommended ? 'var(--accent)' : 'var(--border-2)'),
                 borderRadius: '8px',
                 cursor: form.useRecommended ? 'not-allowed' : 'pointer',
                 background: form.groupId === g.id && !form.useRecommended ? 'rgba(99,102,241,.06)' : 'var(--bg)',
               }">
          <input
            v-model="form.groupId"
            type="radio"
            :value="g.id"
            :disabled="busy || form.useRecommended"
            style="margin:0;cursor:inherit;"
          />
          <div style="flex:1;display:flex;flex-direction:column;gap:2px;">
            <span style="font-size:13px;font-weight:600;color:var(--text);">{{ g.name }}</span>
            <span style="font-size:11px;color:var(--muted);">
              {{ tt('clientArticleFromUrl.promptCount', { n: g.prompts.length }) }}
              <template v-if="anyApplyBase(g)">· {{ tt('clientArticleFromUrl.baseMerge') }}</template>
            </span>
          </div>
        </label>
      </div>
    </AppPanel>

    <div v-if="error"
         style="padding:12px 14px;border-radius:8px;background:rgba(239,68,68,.08);
                border:1px solid rgba(239,68,68,.25);color:#ef4444;font-size:13px;">
      {{ error }}
    </div>

    <div style="display:flex;gap:12px;align-items:center;">
      <button
        type="button"
        @click="generate"
        :disabled="!canSubmit"
        :style="{
          padding: '11px 22px',
          borderRadius: '7px',
          background: canSubmit ? 'var(--accent)' : 'var(--bg-2,rgba(0,0,0,.05))',
          color: canSubmit ? '#fff' : 'var(--muted)',
          border: 'none',
          cursor: canSubmit ? 'pointer' : 'not-allowed',
          fontSize: '13.5px', fontWeight: 500,
        }"
      >
        {{ busy ? tt('clientArticleFromUrl.generating') : '✨ ' + tt('clientArticleFromUrl.generateBtn') }}
      </button>
      <span v-if="busy" style="font-size:12px;color:var(--muted);">
        {{ tt('clientArticleFromUrl.busyStatus') }}
      </span>
    </div>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import AppPanel from '@/components/ui/AppPanel.vue'
import PageHeader from '@/components/layout/PageHeader.vue'
import AiFullPageLoader from '@/components/ui/AiFullPageLoader.vue'
import { companiesApi } from '@/api/companies.js'
import { aiApi } from '@/api/ai.js'
import { useAppStore } from '@/stores/app.js'

const store = useAppStore()
const t = computed(() => store.t)
function tt(key, params) { return t.value(key, params) }

const router = useRouter()
const busy = ref(false)
const error = ref(null)
const loadingGroups = ref(true)
const groups = ref([])
const company = ref(null)

const providers = computed(() => [
  { id: 'openai',    label: 'OpenAI',           note: 'GPT-4o, GPT-4o-mini' },
  { id: 'gemini',    label: 'Google Gemini',    note: '2.5 Pro / Flash / Flash-Lite' },
  { id: 'anthropic', label: 'Anthropic Claude', note: 'Sonnet, Haiku, Opus' },
])
const modelsByProvider = computed(() => ({
  openai: [
    { id: 'gpt-4o-mini',     label: 'gpt-4o-mini',     note: tt('clientArticleFromUrl.modelFastCheapDefault') },
    { id: 'gpt-4o',          label: 'gpt-4o',          note: tt('clientArticleFromUrl.modelStrongestOpenai') },
    { id: 'gpt-4-turbo',     label: 'gpt-4-turbo',     note: tt('clientArticleFromUrl.modelPrevGenStrong') },
    { id: 'gpt-3.5-turbo',   label: 'gpt-3.5-turbo',   note: tt('clientArticleFromUrl.modelCheapest') },
  ],
  gemini: [
    { id: 'gemini-2.5-flash',      label: 'gemini-2.5-flash',      note: tt('clientArticleFromUrl.modelFastDefault') },
    { id: 'gemini-2.5-pro',        label: 'gemini-2.5-pro',        note: tt('clientArticleFromUrl.modelStrong') },
    { id: 'gemini-3.1-pro',        label: 'gemini-3.1-pro',        note: tt('clientArticleFromUrl.modelStrongestGemini') },
    { id: 'gemini-2.5-flash-lite', label: 'gemini-2.5-flash-lite', note: tt('clientArticleFromUrl.modelCheapestVeryFast') },
    { id: 'gemini-flash-latest',   label: 'gemini-flash-latest',   note: tt('clientArticleFromUrl.modelAlwaysLatestFlash') },
  ],
  anthropic: [
    { id: 'claude-sonnet-4-6',         label: 'claude-sonnet-4-6',         note: tt('clientArticleFromUrl.modelFastDefault') },
    { id: 'claude-opus-4-8',           label: 'claude-opus-4-8',           note: tt('clientArticleFromUrl.modelStrongest') },
    { id: 'claude-haiku-4-5-20251001', label: 'claude-haiku-4-5-20251001', note: tt('clientArticleFromUrl.modelCheapestFast') },
  ],
}))

const form = reactive({
  url: '',
  groupId: '',
  provider: 'openai',
  model: 'gpt-4o-mini',
  useRecommended: true, // default: yoqilgan (lekin onMounted'da prompt yo'q bo'lsa false ga tushadi)
})

const recommended = ref({ exists: false, name: null, loaded: false })

const availableModels = computed(() => modelsByProvider.value[form.provider] || [])

const canSubmit = computed(() => {
  if (busy.value) return false
  if (!form.url) return false
  if (form.useRecommended) return true
  return !!form.groupId
})

const promptPanelSubtitle = computed(() => {
  if (form.useRecommended) {
    return tt('clientArticleFromUrl.subtitleRecommendedOn')
  }
  return groups.value.length
    ? tt('clientArticleFromUrl.subtitleGroupsCount', { n: groups.value.length })
    : null
})

// Provider o'zgarsa default modelni tanlash
watch(() => form.provider, (p) => {
  const list = modelsByProvider.value[p] || []
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

  // Admin tomonidan tavsiya etilgan prompt mavjudmi?
  try {
    const r = await aiApi.getRecommendedPrompt('article_from_url')
    recommended.value = { exists: !!r?.exists, name: r?.name || null, loaded: true }
  } catch {
    recommended.value = { exists: false, name: null, loaded: true }
  }
  if (!recommended.value.exists && form.useRecommended) {
    form.useRecommended = false
  }
})

async function generate() {
  if (!company.value || !form.url.trim()) return
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
      router.push(`/client/posts/${r.post_id}/edit`)
    } else {
      error.value = tt('clientArticleFromUrl.errNoPostId')
    }
  } catch (e) {
    error.value = e?.response?.data?.message ?? e.message
  } finally {
    busy.value = false
  }
}
</script>

<style scoped>
.cafu-recommend {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 10px;
  border: 1px solid var(--border-2);
  background: var(--bg);
  cursor: pointer;
  transition: border-color .15s, background .15s, box-shadow .15s;
}
.cafu-recommend:hover { border-color: var(--accent); }
.cafu-recommend.on {
  border-color: color-mix(in oklab, var(--accent) 45%, transparent);
  background: color-mix(in oklab, var(--accent) 7%, transparent);
  box-shadow: 0 0 0 4px color-mix(in oklab, var(--accent) 10%, transparent);
}
.cafu-recommend input[type="checkbox"] {
  margin: 3px 0 0;
  width: 18px;
  height: 18px;
  accent-color: var(--accent);
  cursor: pointer;
  flex-shrink: 0;
}
.cafu-disabled {
  opacity: 0.45;
  pointer-events: none;
  filter: grayscale(0.4);
}
</style>
