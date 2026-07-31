<template>
  <div style="padding:20px 24px 40px;display:flex;flex-direction:column;gap:16px;max-width:640px;">
    <PageHeader
      :title="tt('clientTelegramApi.pageTitle')"
      :subtitle="tt('clientTelegramApi.pageSubtitle')"
    />

    <AppPanel>
      <div style="display:flex;flex-direction:column;gap:16px;">
        <button @click="testConnection" :disabled="testing" type="button"
                style="align-self:flex-start;padding:9px 18px;border-radius:6px;background:var(--accent);
                       color:#fff;border:none;cursor:pointer;font-size:13px;font-weight:500;">
          {{ testing ? tt('clientTelegramApi.testing') : tt('clientTelegramApi.testConnection') }}
        </button>

        <div v-if="error" style="padding:8px 12px;border-radius:6px;background:rgba(239,68,68,.08);
                     border:1px solid rgba(239,68,68,.25);color:#ef4444;font-size:12.5px;">
          {{ error }}
        </div>

        <div v-if="testResult" style="padding:12px 14px;border-radius:8px;background:rgba(99,102,241,.08);
                     border:1px solid rgba(99,102,241,.2);display:flex;flex-direction:column;gap:6px;">
          <strong style="font-size:12px;">{{ tt('clientTelegramApi.testResultTitle') }}</strong>
          <div style="display:grid;grid-template-columns:100px 1fr;gap:4px 12px;font-size:12.5px;">
            <span style="color:var(--muted);">{{ tt('clientTelegramApi.testMeId') }}</span>
            <span style="font-family:'JetBrains Mono',monospace;">{{ testResult.id }}</span>
            <span style="color:var(--muted);">{{ tt('clientTelegramApi.testMeUsername') }}</span>
            <span style="font-family:'JetBrains Mono',monospace;">{{ testResult.username || tt('clientTelegramApi.testNoUsername') }}</span>
            <span style="color:var(--muted);">{{ tt('clientTelegramApi.testMeName') }}</span>
            <span>{{ [testResult.first_name, testResult.last_name].filter(Boolean).join(' ') || '—' }}</span>
            <span style="color:var(--muted);">{{ tt('clientTelegramApi.testMePhone') }}</span>
            <span style="font-family:'JetBrains Mono',monospace;">{{ testResult.phone || '—' }}</span>
          </div>
        </div>
      </div>
    </AppPanel>
  </div>
</template>

<script setup>
import { onMounted, ref, computed } from 'vue'
import AppPanel from '@/components/ui/AppPanel.vue'
import PageHeader from '@/components/layout/PageHeader.vue'
import { companiesApi } from '@/api/companies.js'
import { useAppStore } from '@/stores/app.js'

const store = useAppStore()
const t = computed(() => store.t)
function tt(key, params) { return t.value(key, params) }

const company = ref(null)
const testing = ref(false)
const error = ref(null)
const testResult = ref(null)

onMounted(async () => {
  try {
    const list = await companiesApi.getMy().catch(() => [])
    const arr = Array.isArray(list) ? list : [list].filter(Boolean)
    company.value = arr[0] || null
  } catch (e) {
    error.value = e?.response?.data?.message ?? e.message
  }
})

async function testConnection() {
  if (!company.value) return
  error.value = null
  testResult.value = null
  testing.value = true
  try {
    testResult.value = await companiesApi.getTelegramMe(company.value.id)
  } catch (e) {
    error.value = e?.response?.data?.message ?? e.message
  } finally {
    testing.value = false
  }
}
</script>
