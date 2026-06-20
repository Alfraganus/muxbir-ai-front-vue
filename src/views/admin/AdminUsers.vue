<template>
  <div style="padding:20px 24px 40px;display:flex;flex-direction:column;gap:16px;">
    <PageHeader
      :title="tt('adminUsers.title')"
      :subtitle="tt('adminUsers.subtitle', { users: PLATFORM_USERS.length, staff: staffCount, invited: invitedCount })"
    >
      <template #right>
        <AppButton variant="secondary" size="md"><template #icon><AppIcon name="Sort" :size="13"/></template>{{ tt('adminUsers.export') }}</AppButton>
        <AppButton variant="primary" size="md" @click="inviteOpen = true"><template #icon><AppIcon name="Plus" :size="13"/></template>{{ tt('adminUsers.inviteUser') }}</AppButton>
      </template>
    </PageHeader>

    <!-- KPIs -->
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;">
      <AppKPI :label="tt('adminUsers.kpiActive')" value="1 284" delta="+8.2%" delta-tone="success" :sub="tt('adminUsers.kpiActiveSub')">
        <template #icon><AppIcon name="Users" :size="14" :style="{color:'var(--muted)'}" /></template>
        <template #spark><Sparkline :data="[940,960,980,1010,1040,1080,1120,1160,1190,1220,1250,1284]" :width="88" :height="28"/></template>
      </AppKPI>
      <AppKPI :label="tt('adminUsers.kpiTotal')" value="3 642" :delta="tt('adminUsers.kpiTotalDelta')" delta-tone="success" :sub="tt('adminUsers.kpiTotalSub')">
        <template #icon><AppIcon name="Building" :size="14" :style="{color:'var(--muted)'}" /></template>
        <template #spark><Sparkline :data="[2800,2900,3000,3100,3200,3300,3400,3450,3500,3550,3600,3642]" :width="88" :height="28" color="var(--violet)"/></template>
      </AppKPI>
      <AppKPI :label="tt('adminUsers.kpiMfa')" value="64%" :delta="tt('adminUsers.kpiMfaDelta')" delta-tone="warn" :sub="tt('adminUsers.kpiMfaSub')">
        <template #icon><AppIcon name="Shield" :size="14" :style="{color:'var(--muted)'}" /></template>
        <template #spark><Sparkline :data="[40,42,45,48,50,52,55,58,60,62,63,64]" :width="88" :height="28" color="var(--warn)"/></template>
      </AppKPI>
      <AppKPI :label="tt('adminUsers.kpiInvites')" value="42" :delta="tt('adminUsers.kpiInvitesDelta')" delta-tone="muted" :sub="tt('adminUsers.kpiInvitesSub')">
        <template #icon><AppIcon name="Send" :size="14" :style="{color:'var(--muted)'}" /></template>
        <template #spark><Sparkline :data="[2,3,5,4,6,8,7,9,7,11,10,14]" :width="88" :height="28" color="var(--success)"/></template>
      </AppKPI>
    </div>

    <!-- Filter row -->
    <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
      <AppTabs v-model="tab" :items="tabItems" />
      <div style="flex:1;" />
      <AppTabs v-model="view" :items="viewItems" />
    </div>

    <!-- List view -->
    <template v-if="view === 'list'">
      <div style="display:flex;align-items:center;gap:10px;">
        <AppInput v-model="query" :placeholder="tt('adminUsers.searchPlaceholder')" :style="{width:'280px'}">
          <template #icon><AppIcon name="Search" :size="13" :style="{color:'var(--muted)'}" /></template>
        </AppInput>
        <AppButton variant="secondary" size="md"><template #icon><AppIcon name="Filter" :size="13"/></template>{{ tt('adminUsers.filterRole') }}</AppButton>
        <AppButton variant="secondary" size="md"><template #icon><AppIcon name="Filter" :size="13"/></template>{{ tt('adminUsers.filterStatus') }}</AppButton>
      </div>
      <AppPanel :padding="0">
        <table style="width:100%;border-collapse:collapse;font-size:12.5px;">
          <thead>
            <tr style="border-bottom:1px solid var(--border);">
              <th style="padding-left:14px;padding:8px 10px;width:32px;"><input type="checkbox" style="accent-color:var(--accent);"/></th>
              <th v-for="h in tableHeaders" :key="h" style="text-align:left;padding:8px 10px;font-weight:500;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:var(--muted);">{{ h }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(u, i) in filtered" :key="u.id" :style="{ borderTop: i===0?'none':'1px solid var(--border-2)' }">
              <td style="padding-left:14px;padding:10px;vertical-align:middle;"><input type="checkbox" style="accent-color:var(--accent);"/></td>
              <td style="padding:10px;vertical-align:middle;">
                <div style="display:flex;align-items:center;gap:10px;">
                  <AppAvatar :name="u.name" :size="28"/>
                  <div style="display:flex;flex-direction:column;">
                    <span style="font-weight:500;display:flex;align-items:center;gap:6px;">
                      {{ u.name }}
                      <AppBadge v-if="u.staff" tone="violet">staff</AppBadge>
                    </span>
                    <span class="mono" style="font-size:11px;color:var(--muted);">{{ u.email }}</span>
                  </div>
                </div>
              </td>
              <td style="padding:10px;vertical-align:middle;"><span style="font-size:12px;color:var(--text-2);">{{ u.company }}</span></td>
              <td style="padding:10px;vertical-align:middle;">
                <AppBadge :tone="getRoleTone(u.role)">{{ getRoleName(u.role) }}</AppBadge>
              </td>
              <td style="padding:10px;vertical-align:middle;">
                <AppBadge v-if="u.mfa" tone="success" :dot="true">{{ tt('adminUsers.mfaOn') }}</AppBadge>
                <AppBadge v-else tone="muted" :dot="true">{{ tt('adminUsers.mfaOff') }}</AppBadge>
              </td>
              <td style="padding:10px;vertical-align:middle;">
                <AppStatus :kind="u.status === 'invited' ? 'review' : u.status === 'paused' ? 'paused' : 'active'"/>
              </td>
              <td style="padding:10px;vertical-align:middle;"><span class="mono" style="font-size:11.5px;color:var(--muted);">{{ u.last }}</span></td>
              <td style="padding:10px;vertical-align:middle;" class="mono" style2="font-size:11.5px;color:var(--muted);">{{ u.joined }}</td>
              <td style="padding:10px;vertical-align:middle;"><MoreMenu/></td>
            </tr>
          </tbody>
        </table>
      </AppPanel>
    </template>

    <!-- Roles view -->
    <template v-if="view === 'roles'">
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;">
        <AppPanel v-for="r in ROLES" :key="r.id" :padding="0">
          <div style="padding:16px 18px;border-bottom:1px solid var(--border-2);">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
              <AppBadge :tone="r.tone" size="md">{{ r.name }}</AppBadge>
              <span v-if="r.builtin" class="mono" style="font-size:10px;color:var(--muted);">BUILT-IN</span>
            </div>
            <p style="margin:0;font-size:12.5px;color:var(--text-2);line-height:1.45;">{{ r.desc }}</p>
          </div>
          <div style="padding:12px 18px;display:flex;flex-direction:column;gap:8px;">
            <div style="display:flex;align-items:center;justify-content:space-between;padding:4px 0;font-size:12.5px;">
              <span style="color:var(--muted);">{{ tt('adminUsers.members') }}</span>
              <span class="tabular" style="font-weight:500;">{{ PLATFORM_USERS.filter(u => u.role === r.id).length }}</span>
            </div>
            <div style="display:flex;align-items:center;justify-content:space-between;padding:4px 0;font-size:12.5px;">
              <span style="color:var(--muted);">{{ tt('adminUsers.permissions') }}</span>
              <span class="tabular" style="font-weight:500;">{{ getGrantCount(r) }} / {{ ALL_PERMS.length }}</span>
            </div>
            <AppProgress :value="getGrantCount(r)" :max="ALL_PERMS.length" :tone="r.tone === 'muted' ? 'accent' : r.tone"/>
          </div>
          <div style="padding:10px 14px;border-top:1px solid var(--border-2);background:var(--panel-2);border-radius:0 0 var(--r-lg) var(--r-lg);display:flex;justify-content:space-between;align-items:center;">
            <AppButton variant="ghost" size="sm"><template #icon><AppIcon name="Users" :size="12"/></template>{{ tt('adminUsers.members') }}</AppButton>
            <AppButton variant="ghost" size="sm" @click="editingRole = r.id; view = 'matrix'"><template #icon><AppIcon name="Eye" :size="12"/></template>{{ tt('adminUsers.matrix') }}</AppButton>
          </div>
        </AppPanel>
        <button :style="addRoleStyle" @mouseenter="e => { e.currentTarget.style.borderColor='var(--accent)'; e.currentTarget.style.color='var(--accent)'; e.currentTarget.style.background='var(--accent-bg)'; }" @mouseleave="e => { e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.color='var(--muted)'; e.currentTarget.style.background='transparent'; }">
          <span style="width:40px;height:40px;border-radius:999px;background:var(--panel-2);border:1px solid var(--border);display:inline-flex;align-items:center;justify-content:center;">
            <AppIcon name="Plus" :size="18"/>
          </span>
          <span style="font-size:13px;font-weight:500;">{{ tt('adminUsers.createCustomRole') }}</span>
          <span style="font-size:11.5px;text-align:center;max-width:200px;">{{ tt('adminUsers.createCustomRoleHint') }}</span>
        </button>
      </div>
    </template>

    <!-- Matrix view -->
    <template v-if="view === 'matrix'">
      <AppPanel :padding="0">
        <div style="padding:14px 18px;border-bottom:1px solid var(--border-2);display:flex;align-items:center;justify-content:space-between;">
          <div>
            <div style="font-size:13px;font-weight:600;">{{ tt('adminUsers.matrixTitle') }}</div>
            <div style="font-size:11.5px;color:var(--muted);">{{ tt('adminUsers.matrixDesc') }}</div>
          </div>
          <div style="display:flex;gap:8px;">
            <AppButton variant="secondary" size="md"><template #icon><AppIcon name="Copy" :size="13"/></template>{{ tt('adminUsers.copyFromRole') }}</AppButton>
            <AppButton variant="primary" size="md"><template #icon><AppIcon name="Check" :size="13"/></template>{{ tt('adminUsers.saveChanges') }}</AppButton>
          </div>
        </div>
        <div style="overflow-x:auto;">
          <table style="width:100%;border-collapse:collapse;font-size:12.5px;min-width:880px;">
            <thead>
              <tr style="border-bottom:1px solid var(--border);background:var(--panel-2);">
                <th style="text-align:left;padding:12px 18px;font-size:11px;font-weight:500;text-transform:uppercase;letter-spacing:0.05em;color:var(--muted);position:sticky;left:0;background:var(--panel-2);z-index:2;width:280px;">{{ tt('adminUsers.permission') }}</th>
                <th v-for="r in ROLES" :key="r.id"
                  :style="{ padding:'10px 8px',fontWeight:500,textAlign:'center',
                    background: r.id===editingRole ? 'var(--accent-bg)' : 'var(--panel-2)',
                    borderLeft: r.id===editingRole ? '1px solid var(--accent)' : 'none',
                    borderRight: r.id===editingRole ? '1px solid var(--accent)' : 'none',
                  }">
                  <AppBadge :tone="r.tone">{{ r.name }}</AppBadge>
                </th>
              </tr>
            </thead>
            <tbody>
              <template v-for="g in PERMISSION_GROUPS" :key="g.key">
                <tr>
                  <td :colspan="1 + ROLES.length" style="padding:10px 18px 6px;font-size:10.5px;font-weight:600;text-transform:uppercase;letter-spacing:0.08em;color:var(--muted);background:var(--bg-2);border-top:1px solid var(--border-2);">{{ g.label }}</td>
                </tr>
                <tr v-for="p in g.perms" :key="p.key" style="border-top:1px solid var(--border-2);">
                  <td style="padding:10px 18px;position:sticky;left:0;background:var(--panel);z-index:1;">
                    <div style="font-size:12.5px;color:var(--text);">{{ p.label }}</div>
                    <div class="mono" style="font-size:10.5px;color:var(--muted);">{{ p.key }}</div>
                  </td>
                  <td v-for="r in ROLES" :key="r.id"
                    :style="{
                      padding:'8px',textAlign:'center',
                      background: r.id===editingRole ? 'color-mix(in oklab, var(--accent) 5%, transparent)' : 'transparent',
                      borderLeft: r.id===editingRole ? '1px solid var(--accent)' : 'none',
                      borderRight: r.id===editingRole ? '1px solid var(--accent)' : 'none',
                    }">
                    <span v-if="hasGrant(r, p.key)" :style="checkOnStyle">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><polyline points="20 6 9 17 4 12"/></svg>
                    </span>
                    <span v-else :style="checkOffStyle">
                      <svg width="10" height="2" viewBox="0 0 10 2"><rect width="10" height="2" rx="1" fill="currentColor"/></svg>
                    </span>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
        <div style="padding:10px 18px;background:var(--panel-2);border-top:1px solid var(--border-2);display:flex;align-items:center;gap:8px;font-size:11.5px;color:var(--muted);">
          <AppIcon name="Shield" :size="12"/>
          <span>{{ tt('adminUsers.builtinNote') }}</span>
        </div>
      </AppPanel>
    </template>

    <!-- Invite drawer -->
    <div v-if="inviteOpen" style="position:fixed;inset:0;z-index:200;background:color-mix(in oklab, var(--text) 40%, transparent);display:flex;justify-content:flex-end;" @click="inviteOpen = false">
      <div @click.stop style="width:480px;background:var(--panel);border-left:1px solid var(--border);height:100vh;display:flex;flex-direction:column;box-shadow:var(--shadow-lg);">
        <header style="padding:16px 20px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;">
          <div>
            <div style="font-size:14px;font-weight:600;">{{ tt('adminUsers.inviteUsers') }}</div>
            <div style="font-size:12px;color:var(--muted);">{{ tt('adminUsers.inviteByEmail') }}</div>
          </div>
          <button @click="inviteOpen = false" style="width:28px;height:28px;border:1px solid var(--border);border-radius:6px;background:transparent;color:var(--muted);cursor:pointer;display:inline-flex;align-items:center;justify-content:center;">
            <AppIcon name="Close" :size="14"/>
          </button>
        </header>
        <div style="flex:1;padding:20px;display:flex;flex-direction:column;gap:16px;overflow-y:auto;">
          <div style="display:flex;flex-direction:column;gap:4px;">
            <label style="font-size:11px;color:var(--muted);font-weight:500;">{{ tt('adminUsers.emailAddresses') }}</label>
            <textarea :placeholder="tt('adminUsers.emailPlaceholder')" rows="4" style="padding:8px 10px;font-size:13px;border:1px solid var(--border);border-radius:6px;background:var(--panel);font-family:var(--font-mono);resize:vertical;outline:none;color:var(--text);"/>
          </div>
          <div style="display:flex;flex-direction:column;gap:4px;">
            <label style="font-size:11px;color:var(--muted);font-weight:500;">{{ tt('adminUsers.workspace') }}</label>
            <select style="height:32px;padding:0 10px;border:1px solid var(--border);border-radius:6px;background:var(--panel);font-size:13px;color:var(--text);">
              <option v-for="c in COMPANIES" :key="c.id">{{ c.name }}</option>
            </select>
          </div>
          <div style="display:flex;flex-direction:column;gap:6px;">
            <label style="font-size:11px;color:var(--muted);font-weight:500;">{{ tt('adminUsers.role') }}</label>
            <label v-for="r in ROLES" :key="r.id"
              :style="{ display:'flex',alignItems:'flex-start',gap:'10px',padding:'10px 12px',background: inviteRole===r.id ? 'var(--accent-bg)' : 'var(--panel-2)',border:`1px solid ${inviteRole===r.id ? 'color-mix(in oklab, var(--accent) 30%, transparent)' : 'var(--border)'}`,borderRadius:'8px',cursor:'pointer' }">
              <input type="radio" name="inv-role" :checked="inviteRole === r.id" @change="inviteRole = r.id" style="accent-color:var(--accent);margin-top:2px;"/>
              <div style="display:flex;flex-direction:column;gap:2px;flex:1;">
                <div style="display:flex;align-items:center;gap:6px;">
                  <AppBadge :tone="r.tone">{{ r.name }}</AppBadge>
                </div>
                <span style="font-size:11.5px;color:var(--muted);">{{ r.desc }}</span>
              </div>
            </label>
          </div>
        </div>
        <footer style="padding:14px 20px;border-top:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;background:var(--panel-2);">
          <span style="font-size:11.5px;color:var(--muted);">{{ tt('adminUsers.inviteValidity') }}</span>
          <div style="display:flex;gap:8px;">
            <AppButton variant="secondary" size="md" @click="inviteOpen = false">{{ tt('adminUsers.cancel') }}</AppButton>
            <AppButton variant="primary" size="md"><template #icon><AppIcon name="Send" :size="13"/></template>{{ tt('adminUsers.sendInvite') }}</AppButton>
          </div>
        </footer>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import AppPanel from '@/components/ui/AppPanel.vue'
import AppKPI from '@/components/ui/AppKPI.vue'
import AppTabs from '@/components/ui/AppTabs.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppAvatar from '@/components/ui/AppAvatar.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppStatus from '@/components/ui/AppStatus.vue'
import AppProgress from '@/components/ui/AppProgress.vue'
import Sparkline from '@/components/charts/Sparkline.vue'
import PageHeader from '@/components/layout/PageHeader.vue'
import MoreMenu from '@/components/layout/MoreMenu.vue'
import { PLATFORM_USERS, ROLES, ALL_PERMS, PERMISSION_GROUPS, hasGrant, COMPANIES } from '@/data/index.js'
import { useAppStore } from '@/stores/app.js'

const store = useAppStore()
const t = computed(() => store.t)
function tt(key, params) { return t.value(key, params) }

const tab = ref('all')
const view = ref('list')
const query = ref('')
const inviteOpen = ref(false)
const inviteRole = ref('editor')
const editingRole = ref(null)

const staffCount = computed(() => PLATFORM_USERS.filter(u => u.staff).length)
const invitedCount = computed(() => PLATFORM_USERS.filter(u => u.status === 'invited').length)

const tabItems = computed(() => [
  { value: 'all',       label: tt('adminUsers.tabAll'),       count: PLATFORM_USERS.length },
  { value: 'customers', label: tt('adminUsers.tabCustomers'), count: PLATFORM_USERS.filter(u => !u.staff).length },
  { value: 'staff',     label: tt('adminUsers.tabStaff'),     count: staffCount.value },
  { value: 'invited',   label: tt('adminUsers.tabInvited'),   count: invitedCount.value },
])

const viewItems = computed(() => [
  { value: 'list',   label: tt('adminUsers.viewList') },
  { value: 'roles',  label: tt('adminUsers.viewRoles') },
  { value: 'matrix', label: tt('adminUsers.viewMatrix') },
])

const tableHeaders = computed(() => [
  tt('adminUsers.colUser'),
  tt('adminUsers.colCompany'),
  tt('adminUsers.colRole'),
  tt('adminUsers.colMfa'),
  tt('adminUsers.colStatus'),
  tt('adminUsers.colLastActive'),
  tt('adminUsers.colJoined'),
  '',
])

const filtered = computed(() => PLATFORM_USERS.filter(u => {
  if (tab.value === 'staff' && !u.staff) return false
  if (tab.value === 'customers' && u.staff) return false
  if (tab.value === 'invited' && u.status !== 'invited') return false
  if (query.value && !(u.name + u.email + u.company).toLowerCase().includes(query.value.toLowerCase())) return false
  return true
}))

function getRoleName(roleId) {
  const r = ROLES.find(r => r.id === roleId)
  return r ? r.name : roleId
}
function getRoleTone(roleId) {
  const r = ROLES.find(r => r.id === roleId)
  return r ? r.tone : 'muted'
}
function getGrantCount(role) {
  return role.grants === '*' ? ALL_PERMS.length : role.grants.size
}

const addRoleStyle = {
  background: 'transparent', border: '1.5px dashed var(--border)', borderRadius: 'var(--r-lg)',
  padding: '24px', display: 'flex', flexDirection: 'column',
  alignItems: 'center', justifyContent: 'center', gap: '8px',
  color: 'var(--muted)', cursor: 'pointer', minHeight: '200px',
  transition: 'all .15s',
}
const checkOnStyle = {
  width: '22px', height: '22px', borderRadius: '6px',
  background: 'var(--success-bg)', color: 'var(--success)',
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  border: '1px solid color-mix(in oklab, var(--success) 30%, transparent)',
}
const checkOffStyle = {
  width: '22px', height: '22px', borderRadius: '6px',
  background: 'var(--panel-2)', color: 'var(--muted-2)',
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  border: '1px solid var(--border)',
}
</script>
