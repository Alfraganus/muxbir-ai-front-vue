<template>
  <div style="padding:20px 24px 40px;display:flex;flex-direction:column;gap:16px;">
    <PageHeader
      :title="tt('adminPrompts.title')"
      :subtitle="tt('adminPrompts.subtitle')"
    >
      <template #right>
        <AppButton variant="secondary" size="md" @click="load" :loading="loading">
          <template #icon><AppIcon name="Sort" :size="13"/></template>
          {{ tt('adminPrompts.refresh') }}
        </AppButton>
        <AppButton variant="primary" size="md" @click="openCreate">
          <template #icon><AppIcon name="Plus" :size="13"/></template>
          {{ tt('adminPrompts.newPrompt') }}
        </AppButton>
      </template>
    </PageHeader>

    <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
      <div class="ap-stat">
        <span class="ap-stat-val">{{ prompts.length }}</span>
        <span class="ap-stat-lbl">{{ tt('adminPrompts.totalLabel') }}</span>
      </div>
      <div style="flex:1;"/>
      <AppInput v-model="query" :placeholder="tt('adminPrompts.searchPlaceholder')" :style="{ width:'320px' }">
        <template #icon><AppIcon name="Search" :size="13" :style="{color:'var(--muted)'}"/></template>
      </AppInput>
    </div>

    <AppPanel :padding="0">
      <div v-if="loading" style="padding:48px;text-align:center;color:var(--muted);font-size:13px;">
        <span class="ap-spinner"/> {{ tt('adminPrompts.loading') }}
      </div>
      <div v-else-if="error"
           style="padding:14px 16px;background:rgba(239,68,68,.08);
                  border-bottom:1px solid rgba(239,68,68,.2);color:#ef4444;font-size:13px;">
        <AppIcon name="Close" :size="12"/> {{ error }}
      </div>
      <div v-else-if="!filtered.length"
           style="padding:48px;text-align:center;display:flex;flex-direction:column;gap:10px;align-items:center;">
        <span style="width:48px;height:48px;border-radius:12px;display:inline-flex;align-items:center;
                     justify-content:center;background:rgba(99,102,241,.08);color:var(--accent);">
          <AppIcon name="Sparkle" :size="24"/>
        </span>
        <div style="font-size:14px;font-weight:600;">
          {{ prompts.length ? tt('adminPrompts.emptyFiltered') : tt('adminPrompts.emptyNone') }}
        </div>
        <div style="font-size:12px;color:var(--muted);max-width:380px;">
          {{ tt('adminPrompts.emptyHint') }}
        </div>
      </div>
      <table v-else style="width:100%;border-collapse:collapse;font-size:12.5px;">
        <thead>
          <tr style="border-bottom:1px solid var(--border);">
            <th v-for="h in headers" :key="h.key"
              :style="{
                textAlign: h.right ? 'right' : 'left',
                padding: '10px 12px', fontWeight: 500, fontSize: '11px',
                textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--muted)',
              }">
              {{ h.label }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(p, i) in filtered" :key="p.id"
            :style="{ borderTop: i===0 ? 'none' : '1px solid var(--border-2)' }">
            <!-- ID (qisqartirilgan) -->
            <td style="padding:10px 12px;vertical-align:middle;" class="mono">
              <span class="ap-id" :title="p.id">{{ shortId(p.id) }}</span>
            </td>
            <!-- Key -->
            <td style="padding:10px 12px;vertical-align:middle;">
              <code class="ap-key">{{ p.prompt_key }}</code>
            </td>
            <!-- Usages (ko'pi mumkin) -->
            <td style="padding:10px 12px;vertical-align:middle;">
              <div v-if="(p.usages || []).length"
                   style="display:flex;flex-wrap:wrap;gap:4px;">
                <span v-for="u in p.usages" :key="u"
                      class="ap-usage" :class="`ap-usage-${u}`">
                  <AppIcon :name="usageIcon(u)" :size="11"/>
                  {{ usageLabel(u) }}
                </span>
              </div>
              <span v-else style="color:var(--muted);font-size:11px;">{{ tt('adminPrompts.unassigned') }}</span>
            </td>
            <!-- Name -->
            <td style="padding:10px 12px;vertical-align:middle;font-weight:500;">
              {{ p.prompt_name }}
            </td>
            <!-- Text preview -->
            <td style="padding:10px 12px;vertical-align:middle;color:var(--muted);max-width:420px;">
              <span class="ap-text-preview">{{ preview(p.prompt_text) }}</span>
            </td>
            <!-- Updated at -->
            <td style="padding:10px 12px;vertical-align:middle;color:var(--muted);font-size:11.5px;">
              {{ formatDate(p.updated_at) }}
            </td>
            <!-- Actions -->
            <td style="padding:8px 12px;vertical-align:middle;text-align:right;white-space:nowrap;">
              <AppButton variant="ghost" size="sm" @click="openEdit(p)" :title="tt('adminPrompts.edit')">
                <template #icon><AppIcon name="Edit" :size="12"/></template>
              </AppButton>
              <AppButton variant="ghost" size="sm" @click="openDelete(p)" :title="tt('adminPrompts.delete')">
                <template #icon><AppIcon name="Trash" :size="12"/></template>
              </AppButton>
            </td>
          </tr>
        </tbody>
      </table>
    </AppPanel>

    <!-- Create / Edit modal -->
    <AppModal v-model="formOpen"
              :title="form.id ? tt('adminPrompts.editTitle') : tt('adminPrompts.createTitle')"
              :subtitle="form.id ? tt('adminPrompts.editSubtitle') : tt('adminPrompts.createSubtitle')"
              width="640px">
      <div style="display:flex;flex-direction:column;gap:14px;">
        <label style="display:flex;flex-direction:column;gap:6px;">
          <span style="font-size:12px;font-weight:600;color:var(--text);">
            prompt_key <span style="color:var(--muted);font-weight:400;">{{ tt('adminPrompts.keyHintInline') }}</span>
          </span>
          <input v-model="form.prompt_key"
            placeholder="rewrite_short"
            :disabled="formBusy"
            autocomplete="off"
            class="ap-input mono"/>
          <span style="font-size:11px;color:var(--muted);">
            {{ tt('adminPrompts.keyHelp') }}
          </span>
        </label>

        <label style="display:flex;flex-direction:column;gap:6px;">
          <span style="font-size:12px;font-weight:600;color:var(--text);">prompt_name</span>
          <input v-model="form.prompt_name"
            :placeholder="tt('adminPrompts.namePlaceholder')"
            :disabled="formBusy"
            autocomplete="off"
            class="ap-input"/>
        </label>

        <div style="display:flex;flex-direction:column;gap:6px;">
          <span style="font-size:12px;font-weight:600;color:var(--text);">
            {{ tt('adminPrompts.usageLabel') }} <span style="color:var(--danger);">*</span>
            <span style="color:var(--muted);font-weight:400;">{{ tt('adminPrompts.usageMulti') }}</span>
          </span>
          <div style="display:flex;flex-direction:column;gap:6px;">
            <label v-for="o in USAGE_OPTIONS" :key="o.value"
                   class="ap-usage-check"
                   :class="{ on: form.usages.includes(o.value) }">
              <input
                type="checkbox"
                :value="o.value"
                :checked="form.usages.includes(o.value)"
                :disabled="formBusy"
                @change="toggleUsage(o.value, $event.target.checked)"
              />
              <span class="ap-usage" :class="`ap-usage-${o.value}`" style="margin-right:2px;">
                <AppIcon :name="o.icon" :size="11"/>
              </span>
              <span style="font-size:13px;font-weight:500;color:var(--text);">{{ o.label }}</span>
            </label>
          </div>
          <span style="font-size:11px;color:var(--muted);">
            {{ tt('adminPrompts.usageHelp') }}
          </span>
        </div>

        <label style="display:flex;flex-direction:column;gap:6px;">
          <span style="font-size:12px;font-weight:600;color:var(--text);">prompt_text</span>
          <textarea v-model="form.prompt_text"
            rows="12"
            spellcheck="false"
            :disabled="formBusy"
            :placeholder="tt('adminPrompts.textPlaceholder')"
            class="ap-textarea mono"/>
          <span style="font-size:11px;color:var(--muted);">
            {{ tt('adminPrompts.charCount', { n: (form.prompt_text || '').length }) }}
          </span>
        </label>

        <div v-if="formError"
             style="padding:10px 12px;border-radius:7px;background:rgba(239,68,68,.08);
                    border:1px solid rgba(239,68,68,.25);color:#ef4444;font-size:12.5px;">
          {{ formError }}
        </div>
      </div>

      <template #footer>
        <AppButton variant="secondary" size="md" @click="formOpen = false" :disabled="formBusy">
          {{ tt('adminPrompts.cancel') }}
        </AppButton>
        <AppButton variant="primary" size="md" :loading="formBusy" @click="formSubmit">
          <template #icon><AppIcon name="Check" :size="12"/></template>
          {{ form.id ? tt('adminPrompts.save') : tt('adminPrompts.create') }}
        </AppButton>
      </template>
    </AppModal>

    <!-- Delete confirm -->
    <AppModal v-model="deleteOpen"
              :title="tt('adminPrompts.deleteTitle')"
              :subtitle="tt('adminPrompts.deleteSubtitle')"
              width="480px">
      <div style="display:flex;flex-direction:column;gap:8px;">
        <div style="display:flex;flex-direction:column;gap:3px;padding:10px 12px;
                    background:var(--panel-2,rgba(99,102,241,.05));border-radius:8px;">
          <span style="font-weight:600;">{{ pending?.prompt_name }}</span>
          <span style="font-size:11px;color:var(--muted);" class="mono">
            {{ pending?.prompt_key }}
          </span>
        </div>
      </div>
      <template #footer>
        <AppButton variant="secondary" size="md" @click="deleteOpen = false" :disabled="deleteBusy">
          {{ tt('adminPrompts.cancel') }}
        </AppButton>
        <AppButton variant="danger" size="md" :loading="deleteBusy" @click="deleteRun">
          <template #icon><AppIcon name="Trash" :size="12"/></template>
          {{ tt('adminPrompts.delete') }}
        </AppButton>
      </template>
    </AppModal>

    <!-- Toast -->
    <Teleport to="body">
      <transition name="ap-toast">
        <div v-if="toast" class="ap-toast" :class="`ap-toast-${toast.kind}`" @click="toast = null">
          <AppIcon :name="toast.kind === 'success' ? 'Check' : 'Close'" :size="14"/>
          <span>{{ toast.text }}</span>
        </div>
      </transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, reactive } from 'vue'
import PageHeader from '@/components/layout/PageHeader.vue'
import AppPanel from '@/components/ui/AppPanel.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppModal from '@/components/ui/AppModal.vue'
import { adminApi } from '@/api/admin.js'
import { useAppStore } from '@/stores/app.js'

const store = useAppStore()
const t = computed(() => store.t)
function tt(key, params) { return t.value(key, params) }

const loading = ref(true)
const error = ref('')
const prompts = ref([])
const query = ref('')

const formOpen = ref(false)
const formBusy = ref(false)
const formError = ref('')
const form = reactive({
  id: null,
  prompt_key: '',
  prompt_name: '',
  prompt_text: '',
  usages: [],
})

function toggleUsage(value, checked) {
  const set = new Set(form.usages)
  if (checked) set.add(value); else set.delete(value)
  form.usages = Array.from(set)
}

const deleteOpen = ref(false)
const deleteBusy = ref(false)
const pending = ref(null)

const toast = ref(null)
function showToast(kind, text, ms = 3500) {
  toast.value = { kind, text }
  setTimeout(() => { if (toast.value?.text === text) toast.value = null }, ms)
}

const headers = computed(() => [
  { key: 'id',       label: 'ID' },
  { key: 'key',      label: 'prompt_key' },
  { key: 'usage',    label: tt('adminPrompts.usageLabel') },
  { key: 'name',     label: 'prompt_name' },
  { key: 'text',     label: 'prompt_text' },
  { key: 'updated',  label: tt('adminPrompts.updatedLabel') },
  { key: 'actions',  label: '', right: true },
])

const USAGE_OPTIONS = computed(() => [
  { value: 'article_from_url', label: tt('adminPrompts.usageArticleFromUrl'), icon: 'Globe2' },
  { value: 'article_shorten',  label: tt('adminPrompts.usageArticleShorten'), icon: 'Sparkle' },
  { value: 'autopost',         label: tt('adminPrompts.usageAutopost'), icon: 'Send' },
  { value: 'article_tags',     label: tt('adminPrompts.usageArticleTags'), icon: 'Tag' },
])
function usageLabel(u) {
  return USAGE_OPTIONS.value.find(o => o.value === u)?.label || u
}
function usageIcon(u) {
  return USAGE_OPTIONS.value.find(o => o.value === u)?.icon || 'Sparkle'
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    prompts.value = await adminApi.listPrompts()
  } catch (e) {
    error.value = e?.response?.data?.message || e.message || tt('adminPrompts.errLoad')
    prompts.value = []
  } finally {
    loading.value = false
  }
}
onMounted(load)

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return prompts.value
  return prompts.value.filter((p) => {
    const h = [p.id, p.prompt_key, p.prompt_name, p.prompt_text].filter(Boolean).join(' ').toLowerCase()
    return h.includes(q)
  })
})

function resetForm() {
  form.id = null
  form.prompt_key = ''
  form.prompt_name = ''
  form.prompt_text = ''
  form.usages = []
  formError.value = ''
}

function openCreate() {
  resetForm()
  formOpen.value = true
}

function openEdit(p) {
  form.id = p.id
  form.prompt_key = p.prompt_key
  form.prompt_name = p.prompt_name
  form.prompt_text = p.prompt_text
  form.usages = Array.isArray(p.usages) ? [...p.usages] : []
  formError.value = ''
  formOpen.value = true
}

async function formSubmit() {
  formError.value = ''
  const key = (form.prompt_key || '').trim()
  const name = (form.prompt_name || '').trim()
  const text = (form.prompt_text || '').trim()
  const usages = Array.isArray(form.usages) ? form.usages.slice() : []
  if (!key) { formError.value = tt('adminPrompts.errKeyRequired'); return }
  if (!name) { formError.value = tt('adminPrompts.errNameRequired'); return }
  if (!text) { formError.value = tt('adminPrompts.errTextRequired'); return }
  if (!usages.length) { formError.value = tt('adminPrompts.errUsageRequired'); return }

  formBusy.value = true
  try {
    if (form.id) {
      await adminApi.updatePrompt(form.id, {
        prompt_key: key, prompt_name: name, prompt_text: text, usages,
      })
      showToast('success', tt('adminPrompts.toastUpdated'))
    } else {
      await adminApi.createPrompt({
        prompt_key: key, prompt_name: name, prompt_text: text, usages,
      })
      showToast('success', tt('adminPrompts.toastCreated'))
    }
    formOpen.value = false
    await load()
  } catch (e) {
    formError.value = e?.response?.data?.message || e.message || tt('adminPrompts.errSave')
  } finally {
    formBusy.value = false
  }
}

function openDelete(p) {
  pending.value = p
  deleteOpen.value = true
}

async function deleteRun() {
  if (!pending.value) return
  deleteBusy.value = true
  try {
    await adminApi.deletePrompt(pending.value.id)
    showToast('success', tt('adminPrompts.toastDeleted'))
    deleteOpen.value = false
    await load()
  } catch (e) {
    showToast('error', e?.response?.data?.message || e.message || tt('adminPrompts.errDelete'), 5000)
  } finally {
    deleteBusy.value = false
  }
}

// ── Helpers ──
function shortId(id) {
  if (!id) return '—'
  return id.slice(0, 8) + '…'
}
function preview(text) {
  if (!text) return '—'
  const s = String(text).replace(/\s+/g, ' ').trim()
  return s.length > 140 ? s.slice(0, 140) + '…' : s
}
function formatDate(d) {
  if (!d) return '—'
  const dt = new Date(d)
  if (isNaN(dt.getTime())) return '—'
  return dt.toLocaleDateString('uz-UZ', { year: 'numeric', month: 'short', day: '2-digit' })
       + ' ' + dt.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })
}
</script>

<style scoped>
.mono { font-family: 'JetBrains Mono', Menlo, Consolas, monospace; }

.ap-stat {
  display: inline-flex; align-items: baseline; gap: 6px;
  padding: 6px 12px;
  background: var(--panel-2, rgba(99, 102, 241, 0.06));
  border: 1px solid var(--border-2);
  border-radius: 7px;
}
.ap-stat-val {
  font-size: 16px; font-weight: 700; color: var(--accent);
  font-variant-numeric: tabular-nums;
}
.ap-stat-lbl { font-size: 12px; color: var(--muted); }

.ap-id {
  color: var(--muted);
  font-size: 11px;
  cursor: help;
}

.ap-key {
  display: inline-block;
  padding: 3px 8px;
  background: rgba(99, 102, 241, 0.10);
  color: var(--accent);
  border-radius: 5px;
  font-family: 'JetBrains Mono', Menlo, Consolas, monospace;
  font-size: 11.5px;
  font-weight: 500;
}

/* Usage badges — har bir oqim uchun alohida rang */
.ap-usage {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 9px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 500;
  white-space: nowrap;
  border: 1px solid transparent;
}
.ap-usage-article_from_url {
  background: rgba(34, 197, 94, 0.10);
  color: #16a34a;
  border-color: rgba(34, 197, 94, 0.25);
}
.ap-usage-article_shorten {
  background: rgba(99, 102, 241, 0.10);
  color: #6366f1;
  border-color: rgba(99, 102, 241, 0.25);
}
.ap-usage-autopost {
  background: rgba(245, 158, 11, 0.12);
  color: #d97706;
  border-color: rgba(245, 158, 11, 0.28);
}
.ap-usage-article_tags {
  background: rgba(236, 72, 153, 0.10);
  color: #db2777;
  border-color: rgba(236, 72, 153, 0.25);
}

/* Form — checkbox row */
.ap-usage-check {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 8px 11px;
  border: 1px solid var(--border-2);
  border-radius: 7px;
  cursor: pointer;
  background: var(--bg);
  transition: border-color .15s, background .15s;
}
.ap-usage-check:hover { border-color: var(--accent); }
.ap-usage-check.on {
  border-color: color-mix(in oklab, var(--accent) 45%, transparent);
  background: color-mix(in oklab, var(--accent) 6%, transparent);
}
.ap-usage-check input[type="checkbox"] {
  width: 16px; height: 16px;
  accent-color: var(--accent);
  cursor: pointer;
}

.ap-text-preview {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.45;
  font-size: 12px;
}

.ap-input, .ap-textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--border-2);
  border-radius: 7px;
  background: var(--bg);
  color: var(--text);
  font-size: 13px;
  outline: none;
}
.ap-input:focus, .ap-textarea:focus { border-color: var(--accent); }
.ap-textarea {
  resize: vertical;
  min-height: 200px;
  font-size: 12.5px;
  line-height: 1.55;
}

.ap-spinner {
  display: inline-block;
  width: 14px; height: 14px;
  border-radius: 999px;
  border: 2px solid var(--border);
  border-top-color: var(--accent);
  animation: ap-spin 0.8s linear infinite;
  margin-right: 8px;
  vertical-align: middle;
}
@keyframes ap-spin { to { transform: rotate(360deg); } }

/* Toast */
.ap-toast {
  position: fixed;
  bottom: 24px; right: 24px;
  z-index: 4000;
  display: inline-flex; align-items: center; gap: 8px;
  padding: 11px 16px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 500;
  max-width: 420px;
  box-shadow: 0 10px 30px -8px rgba(15,23,42,0.35);
  cursor: pointer;
}
.ap-toast-success {
  background: color-mix(in oklab, var(--success) 14%, var(--panel));
  color: var(--success);
  border: 1px solid color-mix(in oklab, var(--success) 30%, transparent);
}
.ap-toast-error {
  background: color-mix(in oklab, var(--danger) 14%, var(--panel));
  color: var(--danger);
  border: 1px solid color-mix(in oklab, var(--danger) 30%, transparent);
}
.ap-toast-enter-active, .ap-toast-leave-active {
  transition: opacity .2s, transform .2s;
}
.ap-toast-enter-from, .ap-toast-leave-to {
  opacity: 0;
  transform: translateY(8px);
}
</style>
