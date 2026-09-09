<template>
  <div style="padding:20px 24px 40px;display:flex;flex-direction:column;gap:16px;">
    <PageHeader :title="tt('cu.title')" :subtitle="tt('cu.subtitle')">
      <template #right>
        <AppButton variant="primary" size="md" @click="openCreate">
          <template #icon><AppIcon name="Plus" :size="13"/></template>
          {{ tt('cu.addButton') }}
        </AppButton>
      </template>
    </PageHeader>

    <!-- Empty state -->
    <AppPanel v-if="!loading && !users.length" :padding="40">
      <div style="text-align:center;color:var(--muted);">
        <AppIcon name="Users" :size="32" :style="{ color: 'var(--muted-2)', marginBottom: '8px' }"/>
        <div style="font-size:13.5px;font-weight:500;color:var(--text-2);">{{ tt('cu.empty') }}</div>
      </div>
    </AppPanel>

    <!-- Loading -->
    <div v-else-if="loading" style="text-align:center;padding:40px;color:var(--muted);font-size:13px;">…</div>

    <!-- List -->
    <AppPanel v-else :padding="0">
      <div style="overflow-x:auto;">
        <table style="width:100%;border-collapse:collapse;font-size:13px;min-width:640px;">
          <thead>
            <tr style="border-bottom:1px solid var(--border);">
              <th style="text-align:left;padding:10px 16px;font-weight:500;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:var(--muted);">{{ tt('cu.col.name') }}</th>
              <th style="text-align:left;padding:10px 12px;font-weight:500;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:var(--muted);">{{ tt('cu.col.username') }}</th>
              <th style="text-align:left;padding:10px 12px;font-weight:500;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:var(--muted);">{{ tt('cu.col.role') }}</th>
              <th style="text-align:left;padding:10px 12px;font-weight:500;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:var(--muted);">{{ tt('cu.col.status') }}</th>
              <th style="text-align:left;padding:10px 12px;font-weight:500;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:var(--muted);">{{ tt('cu.col.channels') }}</th>
              <th style="text-align:right;padding:10px 16px;width:110px;"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(u, i) in users" :key="u.id" :style="{ borderTop: i === 0 ? 'none' : '1px solid var(--border-2)' }">
              <td style="padding:12px 16px;vertical-align:middle;">
                <div style="display:flex;align-items:center;gap:10px;">
                  <AppAvatar :name="u.full_name" :size="28"/>
                  <span style="font-weight:500;color:var(--text);">{{ u.full_name }}</span>
                </div>
              </td>
              <td style="padding:12px;vertical-align:middle;" class="mono" >{{ u.username }}</td>
              <td style="padding:12px;vertical-align:middle;">
                <AppBadge :tone="roleTone(u.role)">{{ roleLabel(u.role) }}</AppBadge>
              </td>
              <td style="padding:12px;vertical-align:middle;">
                <AppBadge :tone="u.status === 'active' ? 'success' : 'muted'" :dot="true">
                  {{ u.status === 'active' ? tt('cu.status.active') : tt('cu.status.inactive') }}
                </AppBadge>
              </td>
              <td style="padding:12px;vertical-align:middle;font-size:12px;color:var(--text-2);">
                {{ u.role === 'admin' ? tt('cu.channelsAll') : (u.channel_ids.length ? tt('cu.channelsCount', { n: u.channel_ids.length }) : tt('cu.channelsNone')) }}
              </td>
              <td style="padding:12px 16px;vertical-align:middle;text-align:right;">
                <button class="cu-act" @click="openEdit(u)" :title="tt('cu.edit')">
                  <AppIcon name="Edit" :size="12"/>
                </button>
                <button class="cu-act cu-act-danger" @click="onDelete(u)" :title="tt('cu.delete')">
                  <AppIcon name="Trash" :size="12"/>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </AppPanel>

    <!-- Create/Edit modal -->
    <AppModal v-model="modalOpen" :title="form.id ? tt('cu.modal.editTitle') : tt('cu.modal.createTitle')">
      <div style="display:flex;flex-direction:column;gap:12px;">
        <div style="display:flex;flex-direction:column;gap:5px;">
          <label class="cu-label">{{ tt('cu.modal.fullName') }}</label>
          <input v-model="form.full_name" :placeholder="tt('cu.modal.fullNamePh')" class="cu-input"/>
        </div>
        <div style="display:flex;flex-direction:column;gap:5px;">
          <label class="cu-label">{{ tt('cu.modal.username') }}</label>
          <input v-model="form.username" :placeholder="tt('cu.modal.usernamePh')" class="cu-input mono" :disabled="!!form.id"/>
        </div>
        <div style="display:flex;flex-direction:column;gap:5px;">
          <label class="cu-label">{{ tt('cu.modal.password') }}</label>
          <input v-model="form.password" type="password" class="cu-input"
            :placeholder="form.id ? tt('cu.modal.passwordPhEdit') : tt('cu.modal.passwordPhCreate')"/>
        </div>
        <div style="display:flex;flex-direction:column;gap:5px;">
          <label class="cu-label">{{ tt('cu.modal.roleLabel') }}</label>
          <select v-model="form.role" class="cu-input">
            <option value="admin">{{ tt('cu.role.admin') }}</option>
            <option value="editor">{{ tt('cu.role.editor') }}</option>
            <option value="writer">{{ tt('cu.role.writer') }}</option>
            <option value="viewer">{{ tt('cu.role.viewer') }}</option>
          </select>
          <span style="font-size:11.5px;color:var(--muted);">
            {{ form.role === 'admin' ? tt('cu.role.adminHint') : tt('cu.role.restrictedHint') }}
          </span>
        </div>
        <div v-if="form.id" style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;">
          <label class="cu-label" style="text-transform:none;letter-spacing:0;font-size:12.5px;">{{ tt('cu.modal.activeLabel') }}</label>
          <AppToggle v-model="form.is_active"/>
        </div>
        <div v-if="form.role !== 'admin'" style="display:flex;flex-direction:column;gap:5px;">
          <label class="cu-label">{{ tt('cu.modal.channelsLabel') }}</label>
          <div v-if="!channels.length" style="font-size:12px;color:var(--muted);padding:8px 0;">{{ tt('cu.modal.noChannels') }}</div>
          <div v-else style="display:flex;flex-direction:column;gap:6px;max-height:220px;overflow-y:auto;border:1px solid var(--border-2);border-radius:8px;padding:8px 10px;">
            <label v-for="c in channels" :key="c.id" style="display:flex;align-items:center;gap:8px;font-size:12.5px;cursor:pointer;padding:3px 0;">
              <input type="checkbox" :value="c.id" v-model="form.channel_ids"/>
              <span>{{ c.display_name || c.username || c.telegram_chat_id }}</span>
            </label>
          </div>
        </div>
        <div v-if="error" style="padding:9px 12px;background:var(--danger-bg);border:1px solid color-mix(in oklab,var(--danger) 25%,transparent);border-radius:8px;font-size:12px;color:var(--danger);display:flex;align-items:center;gap:6px;">
          <AppIcon name="Close" :size="12"/> {{ error }}
        </div>
      </div>
      <template #footer>
        <AppButton variant="secondary" size="md" @click="modalOpen = false">{{ tt('cu.modal.cancel') }}</AppButton>
        <AppButton variant="primary" size="md" :loading="saving" @click="save">
          {{ form.id ? tt('cu.modal.save') : tt('cu.modal.create') }}
        </AppButton>
      </template>
    </AppModal>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useAppStore } from '@/stores/app.js'
import { companiesApi } from '@/api/companies.js'
import { channelsApi } from '@/api/channels.js'
import { companyUsersApi } from '@/api/companyUsers.js'
import PageHeader from '@/components/layout/PageHeader.vue'
import AppPanel from '@/components/ui/AppPanel.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import AppModal from '@/components/ui/AppModal.vue'
import AppAvatar from '@/components/ui/AppAvatar.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppToggle from '@/components/ui/AppToggle.vue'

const store = useAppStore()
const t = computed(() => store.t)
function tt(key, params) { return t.value(key, params) }

const company = ref(null)
const users = ref([])
const channels = ref([])
const loading = ref(true)

const modalOpen = ref(false)
const saving = ref(false)
const error = ref('')
const form = reactive({ id: null, full_name: '', username: '', password: '', role: 'editor', is_active: true, channel_ids: [] })

function roleLabel(role) {
  return tt(`cu.role.${role}`) || role
}
function roleTone(role) {
  return role === 'admin' ? 'accent' : 'muted'
}

async function loadAll() {
  loading.value = true
  try {
    if (!company.value) {
      const cs = await companiesApi.getMy().catch(() => [])
      const list = Array.isArray(cs) ? cs : [cs].filter(Boolean)
      company.value = list[0] || null
    }
    if (!company.value) return
    const [u, c] = await Promise.all([
      companyUsersApi.list(company.value.id),
      channelsApi.list(company.value.id).catch(() => []),
    ])
    users.value = u
    channels.value = c
  } catch {
    error.value = tt('cu.error.loadFailed')
  } finally {
    loading.value = false
  }
}

function resetForm() {
  form.id = null
  form.full_name = ''
  form.username = ''
  form.password = ''
  form.role = 'editor'
  form.is_active = true
  form.channel_ids = []
  error.value = ''
}

function openCreate() {
  resetForm()
  modalOpen.value = true
}

function openEdit(u) {
  form.id = u.id
  form.full_name = u.full_name
  form.username = u.username || ''
  form.password = ''
  form.role = u.role || 'editor'
  form.is_active = u.status === 'active'
  form.channel_ids = [...u.channel_ids]
  error.value = ''
  modalOpen.value = true
}

async function save() {
  error.value = ''
  const full_name = form.full_name.trim()
  if (!full_name) { error.value = tt('cu.error.fullNameRequired'); return }
  if (!form.id && form.username.trim().length < 3) { error.value = tt('cu.error.minUsername'); return }
  if (!form.id && form.password.length < 6) { error.value = tt('cu.error.minPassword'); return }
  if (form.password && form.password.length < 6) { error.value = tt('cu.error.minPassword'); return }
  if (!company.value) return

  saving.value = true
  try {
    if (form.id) {
      const payload = { full_name, role: form.role, channel_ids: form.channel_ids, is_active: form.is_active }
      if (form.password) payload.password = form.password
      const updated = await companyUsersApi.update(company.value.id, form.id, payload)
      const i = users.value.findIndex(x => x.id === form.id)
      if (i >= 0) users.value[i] = updated
    } else {
      const created = await companyUsersApi.create(company.value.id, {
        full_name,
        username: form.username.trim(),
        password: form.password,
        role: form.role,
        channel_ids: form.channel_ids,
      })
      users.value = [...users.value, created]
    }
    modalOpen.value = false
  } catch (e) {
    const status = e?.response?.status
    const msg = e?.response?.data?.message
    if (status === 409) error.value = tt('cu.error.usernameTaken')
    else error.value = Array.isArray(msg) ? msg.join('. ') : (msg || tt('cu.error.generic'))
  } finally {
    saving.value = false
  }
}

async function onDelete(u) {
  if (!confirm(tt('cu.delete.message', { name: u.full_name }))) return
  try {
    await companyUsersApi.remove(company.value.id, u.id)
    users.value = users.value.filter(x => x.id !== u.id)
  } catch (e) {
    alert(e?.response?.data?.message || tt('cu.error.generic'))
  }
}

onMounted(loadAll)
</script>

<style scoped>
.cu-label {
  font-size: 10.5px;
  color: var(--muted);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.cu-input {
  width: 100%;
  height: 36px;
  padding: 0 11px;
  background: var(--panel-2);
  border: 1px solid var(--border-2);
  border-radius: 8px;
  font-size: 13px;
  color: var(--text);
  outline: none;
  font-family: inherit;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.cu-input:focus {
  background: var(--panel);
  border-color: var(--accent);
  box-shadow: 0 0 0 3px color-mix(in oklab, var(--accent) 18%, transparent);
}
.cu-input:disabled { opacity: 0.6; cursor: not-allowed; }
.cu-input.mono { font-family: var(--font-mono, ui-monospace, monospace); }

.cu-act {
  width: 28px;
  height: 28px;
  margin-left: 4px;
  background: transparent;
  border: 1px solid var(--border);
  border-radius: 7px;
  color: var(--text-2);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}
.cu-act:hover {
  background: var(--panel-2);
  color: var(--text);
  border-color: var(--accent);
}
.cu-act-danger:hover {
  background: var(--danger-bg);
  color: var(--danger);
  border-color: var(--danger);
}
</style>
