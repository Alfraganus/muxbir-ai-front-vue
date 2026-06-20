<template>
  <div style="padding:20px 24px 40px;display:flex;flex-direction:column;gap:16px;max-width:880px;">
    <PageHeader
      :title="tt('adminAiPrompt.headerTitle')"
      :subtitle="tt('adminAiPrompt.headerSubtitle')"
    />

    <AppPanel
      :title="tt('adminAiPrompt.panelTitle')"
      :subtitle="tt('adminAiPrompt.panelSubtitle')"
    >
      <div v-if="loading" style="color:var(--muted);font-size:13px;">{{ tt('adminAiPrompt.loading') }}</div>
      <form v-else @submit.prevent="save" style="display:flex;flex-direction:column;gap:12px;">
        <div style="display:flex;align-items:center;gap:8px;font-size:12px;color:var(--muted);">
          <span
            :style="{
              display:'inline-flex',alignItems:'center',gap:'6px',
              padding:'3px 8px',borderRadius:'999px',
              background: isDefault ? 'rgba(99,102,241,.12)' : 'rgba(34,197,94,.12)',
              color: isDefault ? '#6366f1' : '#16a34a',
              fontSize:'11px',fontWeight:600,
            }"
          >
            <span style="width:6px;height:6px;border-radius:50%;background:currentColor;"></span>
            {{ isDefault ? tt('adminAiPrompt.badgeDefault') : tt('adminAiPrompt.badgeCustom') }}
          </span>
        </div>

        <textarea
          v-model="form.value"
          rows="22"
          spellcheck="false"
          style="width:100%;padding:12px 14px;font-family:'JetBrains Mono',Menlo,Consolas,monospace;
                 font-size:12.5px;line-height:1.55;border:1px solid var(--border-2);border-radius:8px;
                 background:var(--bg);color:var(--text);resize:vertical;min-height:380px;"
        ></textarea>

        <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;">
          <button
            type="submit"
            :disabled="saving"
            style="padding:9px 16px;border-radius:6px;background:var(--accent);color:#fff;border:none;
                   cursor:pointer;font-size:13px;font-weight:500;"
          >
            {{ saving ? tt('adminAiPrompt.saving') : tt('adminAiPrompt.save') }}
          </button>
          <button
            type="button"
            :disabled="saving"
            @click="restoreDefault"
            style="padding:9px 16px;border-radius:6px;background:transparent;color:var(--muted);
                   border:1px solid var(--border-2);cursor:pointer;font-size:13px;"
            :title="tt('adminAiPrompt.restoreTitle')"
          >
            {{ tt('adminAiPrompt.restore') }}
          </button>
          <span v-if="savedAt" style="font-size:12px;color:var(--success);">{{ tt('adminAiPrompt.saved') }}</span>
          <span v-if="error" style="font-size:12px;color:var(--danger);">{{ error }}</span>
        </div>
      </form>
    </AppPanel>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import AppPanel from '@/components/ui/AppPanel.vue'
import PageHeader from '@/components/layout/PageHeader.vue'
import { adminApi } from '@/api/admin.js'
import { useAppStore } from '@/stores/app.js'

const store = useAppStore()
const t = computed(() => store.t)
function tt(key, params) { return t.value(key, params) }

const loading = ref(true)
const saving = ref(false)
const savedAt = ref(null)
const error = ref(null)
const isDefault = ref(true)
const defaultValue = ref('')
const form = reactive({ value: '' })

onMounted(async () => {
  try {
    const r = await adminApi.getAiBasePrompt()
    form.value = r.value
    isDefault.value = !!r.isDefault
    defaultValue.value = r.default
  } catch (e) {
    error.value = e?.response?.data?.message ?? e.message
  } finally {
    loading.value = false
  }
})

async function save() {
  saving.value = true
  error.value = null
  try {
    const r = await adminApi.setAiBasePrompt(form.value)
    form.value = r.value
    isDefault.value = !!r.isDefault
    savedAt.value = Date.now()
    setTimeout(() => { savedAt.value = null }, 3000)
  } catch (e) {
    error.value = e?.response?.data?.message ?? e.message
  } finally {
    saving.value = false
  }
}

async function restoreDefault() {
  saving.value = true
  error.value = null
  try {
    const r = await adminApi.setAiBasePrompt('')
    form.value = r.value
    isDefault.value = !!r.isDefault
    savedAt.value = Date.now()
    setTimeout(() => { savedAt.value = null }, 3000)
  } catch (e) {
    error.value = e?.response?.data?.message ?? e.message
  } finally {
    saving.value = false
  }
}
</script>
