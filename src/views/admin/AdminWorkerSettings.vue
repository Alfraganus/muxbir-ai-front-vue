<template>
  <div style="padding:20px 24px 40px;display:flex;flex-direction:column;gap:16px;max-width:680px;">
    <PageHeader title="Bot worker sozlamalari" subtitle="Ingest va dispatch intervallarini boshqarish — o'zgarish keyingi tick dan kuchga kiradi" />

    <AppPanel title="Jadval" subtitle="Daqiqalarda">
      <div v-if="loading" style="color:var(--muted);font-size:13px;">Yuklanmoqda…</div>
      <form v-else @submit.prevent="save" style="display:flex;flex-direction:column;gap:14px;">
        <label style="display:flex;flex-direction:column;gap:6px;font-size:12.5px;">
          <span style="color:var(--muted);">Dispatch interval (daqiqada nechta post yuborilsin — har N daqiqada 1 dona)</span>
          <input v-model.number="form.dispatch_interval_minutes" type="number" min="1" max="1440"
                 style="padding:8px 10px;border:1px solid var(--border-2);border-radius:6px;background:var(--bg);color:var(--text);" />
        </label>

        <label style="display:flex;flex-direction:column;gap:6px;font-size:12.5px;">
          <span style="color:var(--muted);">Ingest interval (source kanallar dan post yig'ish chastotasi)</span>
          <input v-model.number="form.ingest_interval_minutes" type="number" min="1" max="1440"
                 style="padding:8px 10px;border:1px solid var(--border-2);border-radius:6px;background:var(--bg);color:var(--text);" />
        </label>

        <label style="display:flex;flex-direction:column;gap:6px;font-size:12.5px;">
          <span style="color:var(--muted);">Post taklifi qancha daqiqa oldin yuborilsin (interval rejimi uchun)</span>
          <input v-model.number="form.collect_before_minutes" type="number" min="0" max="1440"
                 style="padding:8px 10px;border:1px solid var(--border-2);border-radius:6px;background:var(--bg);color:var(--text);" />
          <span style="font-size:11.5px;color:var(--muted);">
            Masalan: interval 60 daqiqa, bu qiymat 10 bo'lsa — taklif 50-daqiqada keladi. 0 = har doim yig'adi.
          </span>
        </label>

        <label style="display:flex;align-items:center;gap:8px;font-size:12.5px;">
          <input v-model="form.dry_run" type="checkbox" />
          <span>Dry run (test rejimi — yubormaydi, faqat log ga yozadi)</span>
        </label>

        <div style="display:flex;gap:8px;align-items:center;">
          <button type="submit" :disabled="saving"
                  style="padding:8px 14px;border-radius:6px;background:var(--accent);color:#fff;border:none;cursor:pointer;font-size:13px;">
            {{ saving ? 'Saqlanmoqda…' : 'Saqlash' }}
          </button>
          <span v-if="savedAt" style="font-size:12px;color:var(--success);">Saqlandi ✓</span>
          <span v-if="error" style="font-size:12px;color:var(--danger);">{{ error }}</span>
        </div>
      </form>
    </AppPanel>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import AppPanel from '@/components/ui/AppPanel.vue'
import PageHeader from '@/components/layout/PageHeader.vue'
import { workerSettingsApi } from '@/api/workerSettings.js'

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
