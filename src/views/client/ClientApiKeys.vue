<template>
  <div style="padding:20px 24px 40px;display:flex;flex-direction:column;gap:16px;max-width:880px;">
    <PageHeader :title="tt('apiKeys.pageTitle')" :subtitle="tt('apiKeys.pageSubtitle')" />

    <div v-if="error" style="padding:10px 14px;border-radius:8px;background:var(--danger-bg);color:var(--danger);font-size:13px;">
      {{ error }}
    </div>

    <!-- Ro'yxat + yaratish. Kalit plaintext — istalgan vaqt ko'rinadi/nusxalanadi. -->
    <AppPanel :title="tt('apiKeys.listTitle')" :subtitle="tt('apiKeys.listHint')">
      <template #action>
        <AppButton variant="primary" size="md" @click="openCreate">
          {{ tt('apiKeys.createBtn') }}
        </AppButton>
      </template>

      <div v-if="loading" style="padding:20px;color:var(--muted);">{{ tt('apiKeys.loading') }}</div>
      <div v-else-if="!keys.length" style="padding:20px;color:var(--muted);">{{ tt('apiKeys.empty') }}</div>

      <div v-else style="overflow-x:auto;">
        <table style="width:100%;border-collapse:collapse;font-size:13px;min-width:640px;">
          <thead>
            <tr style="text-align:left;color:var(--muted);">
              <th style="padding:8px 6px;">{{ tt('apiKeys.colName') }}</th>
              <th style="padding:8px 6px;">{{ tt('apiKeys.colKey') }}</th>
              <th style="padding:8px 6px;">{{ tt('apiKeys.colStatus') }}</th>
              <th style="padding:8px 6px;">{{ tt('apiKeys.colUsed') }}</th>
              <th style="padding:8px 6px;"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="k in keys" :key="k.id" style="border-top:1px solid var(--border);">
              <td style="padding:10px 6px;">{{ k.name }}</td>
              <td style="padding:10px 6px;">
                <div style="display:flex;gap:6px;align-items:center;">
                  <code style="font-family:var(--font-mono);word-break:break-all;">{{ revealed[k.id] ? k.key : maskKey(k.key) }}</code>
                  <AppButton variant="ghost" size="sm" @click="revealed[k.id] = !revealed[k.id]">
                    {{ tt(revealed[k.id] ? 'apiKeys.hide' : 'apiKeys.show') }}
                  </AppButton>
                  <AppButton variant="ghost" size="sm" @click="copyKey(k)">
                    {{ tt(copiedId === k.id ? 'apiKeys.copied' : 'apiKeys.copy') }}
                  </AppButton>
                </div>
              </td>
              <td style="padding:10px 6px;">
                <AppBadge :tone="k.is_active ? 'success' : 'muted'" dot>
                  {{ tt(k.is_active ? 'apiKeys.active' : 'apiKeys.revoked') }}
                </AppBadge>
              </td>
              <td style="padding:10px 6px;color:var(--muted);">{{ k.last_used_at ? fmtDate(k.last_used_at) : '—' }}</td>
              <td style="padding:10px 6px;text-align:right;">
                <AppButton v-if="k.is_active" variant="danger" size="sm" @click="revoke(k)">
                  {{ tt('apiKeys.revokeBtn') }}
                </AppButton>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </AppPanel>

    <!-- Hujjat: qanday ishlatish -->
    <AppPanel :title="tt('apiKeys.docsTitle')" :subtitle="tt('apiKeys.docsHint')">
      <div style="overflow-x:auto;">
        <pre style="margin:0;padding:12px;border-radius:8px;background:var(--panel-2);font-size:12px;line-height:1.6;">GET  {{ baseUrl }}/external/v1/news?limit=20&offset=0
Header: X-Api-Key: mxb_xxxxxxxx

POST {{ baseUrl }}/external/v1/news/consume
Header: X-Api-Key: mxb_xxxxxxxx
Body: { "news_ids": ["id1","id2"] }</pre>
      </div>
    </AppPanel>

    <!-- Yaratish modal (nom) -->
    <AppModal v-model="createOpen" :title="tt('apiKeys.createTitle')" width="480px">
      <div style="display:flex;flex-direction:column;gap:8px;">
        <label style="font-size:12px;color:var(--muted);">{{ tt('apiKeys.nameLabel') }}</label>
        <AppInput v-model="newName" :placeholder="tt('apiKeys.namePlaceholder')" />
      </div>
      <template #footer>
        <AppButton variant="ghost" size="md" @click="createOpen = false">{{ tt('common.cancel') }}</AppButton>
        <AppButton variant="primary" size="md" :loading="creating" @click="doCreate">{{ tt('apiKeys.createBtn') }}</AppButton>
      </template>
    </AppModal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAppStore } from '@/stores/app.js'
import { companiesApi } from '@/api/companies.js'
import PageHeader from '@/components/layout/PageHeader.vue'
import AppPanel from '@/components/ui/AppPanel.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppModal from '@/components/ui/AppModal.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppBadge from '@/components/ui/AppBadge.vue'

const store = useAppStore()
const t = computed(() => store.t)
function tt(key, params) { return t.value(key, params) }

const company = ref(null)
const keys = ref([])
const loading = ref(true)
const error = ref('')
const creating = ref(false)
const createOpen = ref(false)
const newName = ref('')
const revealed = ref({})
const copiedId = ref('')

const baseUrl = computed(() => window.location.origin.replace(/\/$/, '') + '/api')

function fmtDate(d) { return new Date(d).toLocaleString() }
function maskKey(k) { return k ? k.slice(0, 8) + '…' + k.slice(-4) : '' }

onMounted(async () => {
  try {
    const list = await companiesApi.getMy().catch(() => [])
    const arr = Array.isArray(list) ? list : [list].filter(Boolean)
    company.value = arr[0] || null
    if (company.value) await load()
  } catch (e) {
    error.value = e?.response?.data?.message ?? e.message
  } finally {
    loading.value = false
  }
})

async function load() {
  keys.value = await companiesApi.listApiKeys(company.value.id)
}

function openCreate() { newName.value = ''; createOpen.value = true }

async function doCreate() {
  if (!company.value) return
  try {
    creating.value = true
    error.value = ''
    const res = await companiesApi.createApiKey(company.value.id, { name: newName.value })
    createOpen.value = false
    revealed.value[res.id] = true
    await load()
  } catch (e) {
    error.value = e?.response?.data?.message ?? e.message
  } finally {
    creating.value = false
  }
}

async function revoke(k) {
  if (!confirm(tt('apiKeys.revokeConfirm'))) return
  try {
    await companiesApi.revokeApiKey(company.value.id, k.id)
    await load()
  } catch (e) {
    error.value = e?.response?.data?.message ?? e.message
  }
}

async function copyKey(k) {
  try { await navigator.clipboard.writeText(k.key); copiedId.value = k.id } catch { /* ignore */ }
}
</script>
