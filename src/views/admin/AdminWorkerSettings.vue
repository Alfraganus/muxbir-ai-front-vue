<template>
  <div style="padding:20px 24px 40px;display:flex;flex-direction:column;gap:16px;max-width:680px;">
    <PageHeader :title="tt('adminWorkerSettings.title')" :subtitle="tt('adminWorkerSettings.subtitle')" />

    <AppPanel :title="tt('adminWorkerSettings.panelTitle')" :subtitle="tt('adminWorkerSettings.panelSubtitle')">
      <div v-if="loading" style="color:var(--muted);font-size:13px;">{{ tt('adminWorkerSettings.loading') }}</div>
      <form v-else @submit.prevent="save" style="display:flex;flex-direction:column;gap:14px;">
        <label style="display:flex;flex-direction:column;gap:6px;font-size:12.5px;">
          <span style="color:var(--muted);">{{ tt('adminWorkerSettings.dispatchIntervalLabel') }}</span>
          <input v-model.number="form.dispatch_interval_minutes" type="number" min="1" max="1440"
                 style="padding:8px 10px;border:1px solid var(--border-2);border-radius:6px;background:var(--bg);color:var(--text);" />
        </label>

        <label style="display:flex;flex-direction:column;gap:6px;font-size:12.5px;">
          <span style="color:var(--muted);">{{ tt('adminWorkerSettings.ingestIntervalLabel') }}</span>
          <input v-model.number="form.ingest_interval_minutes" type="number" min="1" max="1440"
                 style="padding:8px 10px;border:1px solid var(--border-2);border-radius:6px;background:var(--bg);color:var(--text);" />
        </label>

        <label style="display:flex;flex-direction:column;gap:6px;font-size:12.5px;">
          <span style="color:var(--muted);">{{ tt('adminWorkerSettings.collectBeforeLabel') }}</span>
          <input v-model.number="form.collect_before_minutes" type="number" min="0" max="1440"
                 style="padding:8px 10px;border:1px solid var(--border-2);border-radius:6px;background:var(--bg);color:var(--text);" />
          <span style="font-size:11.5px;color:var(--muted);">
            {{ tt('adminWorkerSettings.collectBeforeHint') }}
          </span>
        </label>

        <label style="display:flex;align-items:center;gap:8px;font-size:12.5px;">
          <input v-model="form.dry_run" type="checkbox" />
          <span>{{ tt('adminWorkerSettings.dryRunLabel') }}</span>
        </label>

        <div style="display:flex;gap:8px;align-items:center;">
          <button type="submit" :disabled="saving"
                  style="padding:8px 14px;border-radius:6px;background:var(--accent);color:#fff;border:none;cursor:pointer;font-size:13px;">
            {{ saving ? tt('adminWorkerSettings.saving') : tt('adminWorkerSettings.saveBtn') }}
          </button>
          <span v-if="savedAt" style="font-size:12px;color:var(--success);">{{ tt('adminWorkerSettings.saved') }}</span>
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
import { workerSettingsApi } from '@/api/workerSettings.js'
import { useAppStore } from '@/stores/app.js'

const store = useAppStore()
const t = computed(() => store.t)
function tt(key, params) { return t.value(key, params) }

const loading = ref(true)
const saving = ref(false)
const savedAt = ref(null)
const error = ref(null)
const form = reactive({
  dispatch_interval_minutes: 1,
  ingest_interval_minutes: 15,
  collect_before_minutes: 10,
  dry_run: false,
})

onMounted(async () => {
  try {
    const s = await workerSettingsApi.get()
    form.dispatch_interval_minutes = s.dispatch_interval_minutes
    form.ingest_interval_minutes = s.ingest_interval_minutes
    form.collect_before_minutes = s.collect_before_minutes ?? 10
    form.dry_run = s.dry_run
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
    const s = await workerSettingsApi.update({
      dispatch_interval_minutes: form.dispatch_interval_minutes,
      ingest_interval_minutes: form.ingest_interval_minutes,
      collect_before_minutes: form.collect_before_minutes,
      dry_run: form.dry_run,
    })
    form.dispatch_interval_minutes = s.dispatch_interval_minutes
    form.ingest_interval_minutes = s.ingest_interval_minutes
    form.collect_before_minutes = s.collect_before_minutes ?? 10
    form.dry_run = s.dry_run
    savedAt.value = Date.now()
    setTimeout(() => { savedAt.value = null }, 3000)
  } catch (e) {
    error.value = e?.response?.data?.message ?? e.message
  } finally {
    saving.value = false
  }
}
</script>
