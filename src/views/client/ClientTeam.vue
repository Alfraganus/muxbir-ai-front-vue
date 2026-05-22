<template>
  <div style="padding:20px 24px 40px;display:flex;flex-direction:column;gap:16px;">
    <PageHeader title="Komanda" :subtitle="`Olcha Express workspace · ${TEAM.length} ta a'zo, 5 ta joy tarifda kiritilgan`">
      <template #right>
        <AppButton variant="secondary" size="md"><template #icon><AppIcon name="Eye" :size="13"/></template>Audit log</AppButton>
        <AppButton variant="primary" size="md" @click="inviteOpen = true"><template #icon><AppIcon name="Plus" :size="13"/></template>A'zo qo'shish</AppButton>
      </template>
    </PageHeader>

    <!-- KPIs -->
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;">
      <AppKPI label="Komanda joylari" :value="`${TEAM.length}`" delta="+2 qo'shimcha" delta-tone="warn" sub="+180 000 so'm/oy">
        <template #icon><AppIcon name="Users" :size="14" :style="{color:'var(--muted)'}" /></template>
      </AppKPI>
      <AppKPI label="Faol bugun" :value="`${activeToday}`" delta="84% komanda" delta-tone="success" sub="So'nggi 24 soat">
        <template #icon><AppIcon name="Bolt" :size="14" :style="{color:'var(--muted)'}" /></template>
      </AppKPI>
      <AppKPI label="Kutilayotgan takliflar" :value="`${invitedCount}`" delta="1 javobsiz" delta-tone="warn" sub="7 kunda muddati tugaydi">
        <template #icon><AppIcon name="Send" :size="14" :style="{color:'var(--muted)'}" /></template>
      </AppKPI>
      <AppKPI label="MFA yoqilgan" value="86%" delta="6/7 a'zo" delta-tone="success" sub="Maqsad: 100%">
        <template #icon><AppIcon name="Shield" :size="14" :style="{color:'var(--muted)'}" /></template>
      </AppKPI>
    </div>

    <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
      <AppTabs v-model="view" :items="viewTabs"/>
      <div style="flex:1;"/>
      <AppInput v-model="query" placeholder="A'zolarni qidirish..." :style="{width:'220px'}">
        <template #icon><AppIcon name="Search" :size="13" :style="{color:'var(--muted)'}" /></template>
      </AppInput>
    </div>

    <!-- Members table -->
    <template v-if="view === 'members'">
      <AppPanel :padding="0">
        <table style="width:100%;border-collapse:collapse;font-size:12.5px;">
          <thead>
            <tr style="border-bottom:1px solid var(--border);">
              <th style="text-align:left;padding:8px 14px;font-weight:500;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:var(--muted);">A'zo</th>
              <th v-for="h in ['Rol','Kanal kirishi','Holat','Oxirgi faollik','Qo\'shilgan','']" :key="h" style="text-align:left;padding:8px 10px;font-weight:500;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:var(--muted);">{{ h }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(u, i) in filtered" :key="u.id" :style="{ borderTop: i===0?'none':'1px solid var(--border-2)' }">
              <td style="padding:10px 14px;vertical-align:middle;">
                <div style="display:flex;align-items:center;gap:10px;">
                  <div style="position:relative;">
                    <AppAvatar :name="u.name" :size="28"/>
                    <span v-if="u.last.includes('Hozir')" style="position:absolute;bottom:-1px;right:-1px;width:9px;height:9px;border-radius:999px;background:var(--success);border:2px solid var(--panel);"/>
                  </div>
                  <div style="display:flex;flex-direction:column;">
                    <span style="font-weight:500;">{{ u.name }}</span>
                    <span class="mono" style="font-size:11px;color:var(--muted);">{{ u.email }}</span>
                  </div>
                </div>
              </td>
              <td style="padding:10px;vertical-align:middle;">
                <div style="position:relative;display:inline-block;">
                  <AppBadge :tone="getRoleTone(u.role)">{{ getRoleName(u.role) }}</AppBadge>
                </div>
              </td>
              <td style="padding:10px;vertical-align:middle;"><span style="font-size:12px;color:var(--text-2);">{{ u.channels }}</span></td>
              <td style="padding:10px;vertical-align:middle;">
                <AppBadge v-if="u.status === 'invited'" tone="warn" :dot="true">Taklif yuborilgan</AppBadge>
                <AppBadge v-else tone="success" :dot="true">Faol</AppBadge>
              </td>
              <td style="padding:10px;vertical-align:middle;">
                <span class="mono" :style="{ fontSize:'11.5px',color: u.last.includes('Hozir') ? 'var(--success)' : 'var(--muted)' }">{{ u.last }}</span>
              </td>
              <td style="padding:10px;vertical-align:middle;" class="mono" style2="font-size:11.5px;color:var(--muted);">{{ u.joined }}</td>
              <td style="padding:10px;vertical-align:middle;">
                <div style="display:flex;gap:4px;justify-content:flex-end;">
                  <AppButton v-if="u.status === 'invited'" variant="ghost" size="sm">Qaytatdan</AppButton>
                  <MoreMenu/>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <div style="display:flex;align-items:center;justify-content:space-between;padding:10px 14px;border-top:1px solid var(--border);font-size:12px;color:var(--muted);background:var(--panel-2);border-radius:0 0 var(--r-lg) var(--r-lg);">
          <span>{{ TEAM.length }} a'zo · {{ TEAM.filter(t => t.status === 'active').length }} faol</span>
          <span><span style="color:var(--warn);font-weight:500;">2 ta qo'shimcha joy</span> · +180 000 so'm/oy</span>
        </div>
      </AppPanel>
    </template>

    <!-- Roles view -->
    <template v-if="view === 'roles'">
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;">
        <AppPanel v-for="r in ROLES" :key="r.id" :padding="0">
          <div style="padding:16px 18px;border-bottom:1px solid var(--border-2);">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
              <AppBadge :tone="r.tone">{{ r.name }}</AppBadge>
              <span v-if="r.builtin" class="mono" style="font-size:10px;color:var(--muted);">BUILT-IN</span>
            </div>
            <p style="margin:0;font-size:12.5px;color:var(--text-2);line-height:1.45;">{{ r.desc }}</p>
          </div>
          <div style="padding:12px 18px;display:flex;flex-direction:column;gap:8px;">
            <div style="display:flex;align-items:center;justify-content:space-between;padding:4px 0;font-size:12.5px;">
              <span style="color:var(--muted);">A'zolar</span>
              <span class="tabular" style="font-weight:500;">{{ TEAM.filter(t => t.role === r.id).length }}</span>
            </div>
            <AppProgress :value="getGrantCount(r)" :max="ALL_PERMS.length" :tone="r.tone === 'muted' ? 'accent' : r.tone"/>
          </div>
          <div style="padding:10px 14px;border-top:1px solid var(--border-2);background:var(--panel-2);display:flex;justify-content:space-between;border-radius:0 0 var(--r-lg) var(--r-lg);">
            <AppButton variant="ghost" size="sm"><template #icon><AppIcon name="Users" :size="12"/></template>A'zolar</AppButton>
            <AppButton variant="ghost" size="sm" @click="editingRole = r.id; view = 'matrix'"><template #icon><AppIcon name="Eye" :size="12"/></template>Matritsa</AppButton>
          </div>
        </AppPanel>
      </div>
    </template>

    <!-- Permission matrix view -->
    <template v-if="view === 'matrix'">
      <AppPanel :padding="0">
        <div style="padding:14px 18px;border-bottom:1px solid var(--border-2);display:flex;align-items:center;justify-content:space-between;">
          <div>
            <div style="font-size:13px;font-weight:600;">Permission matritsa</div>
            <div style="font-size:11.5px;color:var(--muted);">Workspace roli uchun yoqilgan amallar</div>
          </div>
          <AppButton variant="primary" size="md"><template #icon><AppIcon name="Check" :size="13"/></template>Saqlash</AppButton>
        </div>
        <div style="overflow-x:auto;">
          <table style="width:100%;border-collapse:collapse;font-size:12.5px;min-width:880px;">
            <thead>
              <tr style="border-bottom:1px solid var(--border);background:var(--panel-2);">
                <th style="text-align:left;padding:12px 18px;font-size:11px;font-weight:500;text-transform:uppercase;letter-spacing:0.05em;color:var(--muted);position:sticky;left:0;background:var(--panel-2);z-index:2;width:280px;">Permission</th>
                <th v-for="r in ROLES" :key="r.id" :style="{ padding:'10px 8px',fontWeight:500,textAlign:'center',background: r.id===editingRole ? 'var(--accent-bg)' : 'var(--panel-2)' }">
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
                    <div style="font-size:12.5px;">{{ p.label }}</div>
                    <div class="mono" style="font-size:10.5px;color:var(--muted);">{{ p.key }}</div>
                  </td>
                  <td v-for="r in ROLES" :key="r.id" style="padding:8px;text-align:center;">
                    <span v-if="hasGrant(r, p.key)" style="width:22px;height:22px;border-radius:6px;background:var(--success-bg);color:var(--success);display:inline-flex;align-items:center;justify-content:center;border:1px solid color-mix(in oklab, var(--success) 30%, transparent);">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><polyline points="20 6 9 17 4 12"/></svg>
                    </span>
                    <span v-else style="width:22px;height:22px;border-radius:6px;background:var(--panel-2);color:var(--muted-2);display:inline-flex;align-items:center;justify-content:center;border:1px solid var(--border);">
                      <svg width="10" height="2" viewBox="0 0 10 2"><rect width="10" height="2" rx="1" fill="currentColor"/></svg>
                    </span>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
      </AppPanel>
    </template>

    <!-- Channel groups view -->
    <template v-if="view === 'groups'">
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;">
        <AppPanel v-for="g in channelGroups" :key="g.name" :padding="0">
          <div style="padding:16px 18px;display:flex;flex-direction:column;gap:8px;">
            <div style="display:flex;align-items:center;gap:8px;">
              <span :style="{ width:'8px',height:'8px',borderRadius:'999px',background:g.color }"/>
              <span style="font-size:13px;font-weight:600;">{{ g.name }}</span>
            </div>
            <div style="display:flex;flex-wrap:wrap;gap:4px;">
              <span v-for="c in g.channels" :key="c" class="mono" style="font-size:11px;padding:2px 6px;background:var(--panel-2);border:1px solid var(--border);border-radius:4px;color:var(--text-2);">{{ c }}</span>
            </div>
            <div style="display:flex;align-items:center;gap:8px;margin-top:4px;">
              <span style="display:flex;">
                <span v-for="(_, i) in Array(g.members)" :key="i" :style="{ marginLeft: i===0?'0':'-6px',borderRadius:'999px',border:'2px solid var(--panel)' }">
                  <AppAvatar :name="'User '+(i+1)" :size="22"/>
                </span>
              </span>
              <span style="font-size:11.5px;color:var(--muted);">{{ g.members }} a'zo</span>
            </div>
          </div>
          <div style="padding:10px 14px;border-top:1px solid var(--border-2);background:var(--panel-2);display:flex;justify-content:space-between;border-radius:0 0 var(--r-lg) var(--r-lg);">
            <AppButton variant="ghost" size="sm"><template #icon><AppIcon name="Edit" :size="11"/></template>Tahrirlash</AppButton>
            <AppButton variant="ghost" size="sm"><template #icon><AppIcon name="Users" :size="11"/></template>A'zolar</AppButton>
          </div>
        </AppPanel>
        <button style="background:transparent;border:1.5px dashed var(--border);border-radius:var(--r-lg);padding:24px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;color:var(--muted);cursor:pointer;min-height:180px;">
          <span style="width:36px;height:36px;border-radius:999px;background:var(--panel-2);border:1px solid var(--border);display:inline-flex;align-items:center;justify-content:center;"><AppIcon name="Plus" :size="16"/></span>
          <span style="font-size:12.5px;font-weight:500;">Yangi guruh</span>
        </button>
      </div>
    </template>

    <!-- Invite drawer -->
    <div v-if="inviteOpen" style="position:fixed;inset:0;z-index:200;background:color-mix(in oklab, var(--text) 40%, transparent);display:flex;justify-content:flex-end;" @click="inviteOpen = false">
      <div @click.stop style="width:480px;background:var(--panel);border-left:1px solid var(--border);height:100vh;display:flex;flex-direction:column;box-shadow:var(--shadow-lg);">
        <header style="padding:16px 20px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;">
          <div>
            <div style="font-size:14px;font-weight:600;">A'zo qo'shish</div>
            <div style="font-size:12px;color:var(--muted);">Email orqali taklif yuboriladi</div>
          </div>
          <button @click="inviteOpen = false" style="width:28px;height:28px;border:1px solid var(--border);border-radius:6px;background:transparent;color:var(--muted);cursor:pointer;display:inline-flex;align-items:center;justify-content:center;">
            <AppIcon name="Close" :size="14"/>
          </button>
        </header>
        <div style="flex:1;padding:20px;display:flex;flex-direction:column;gap:16px;overflow-y:auto;">
          <div style="display:flex;flex-direction:column;gap:4px;">
            <label style="font-size:11px;color:var(--muted);font-weight:500;">Email manzillari</label>
            <textarea rows="4" placeholder="dilshod@kompaniya.uz" style="padding:8px 10px;font-size:13px;border:1px solid var(--border);border-radius:6px;background:var(--panel);font-family:var(--font-mono);resize:vertical;outline:none;color:var(--text);"/>
          </div>
          <div style="display:flex;flex-direction:column;gap:6px;">
            <label style="font-size:11px;color:var(--muted);font-weight:500;">Rol</label>
            <label v-for="r in ROLES" :key="r.id"
              :style="{ display:'flex',alignItems:'flex-start',gap:'10px',padding:'10px 12px',background: inviteRole===r.id ? 'var(--accent-bg)' : 'var(--panel-2)',border:`1px solid ${inviteRole===r.id?'color-mix(in oklab, var(--accent) 30%, transparent)':'var(--border)'}`,borderRadius:'8px',cursor:'pointer' }">
              <input type="radio" :checked="inviteRole === r.id" @change="inviteRole = r.id" style="accent-color:var(--accent);margin-top:2px;"/>
              <div style="display:flex;flex-direction:column;gap:2px;">
                <AppBadge :tone="r.tone">{{ r.name }}</AppBadge>
                <span style="font-size:11.5px;color:var(--muted);">{{ r.desc }}</span>
              </div>
            </label>
          </div>
        </div>
        <footer style="padding:14px 20px;border-top:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;background:var(--panel-2);">
          <span style="font-size:11.5px;color:var(--muted);">Taklif 7 kun davomida amal qiladi</span>
          <div style="display:flex;gap:8px;">
            <AppButton variant="secondary" size="md" @click="inviteOpen = false">Bekor qilish</AppButton>
            <AppButton variant="primary" size="md"><template #icon><AppIcon name="Send" :size="13"/></template>Taklif yuborish</AppButton>
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
import PageHeader from '@/components/layout/PageHeader.vue'
import MoreMenu from '@/components/layout/MoreMenu.vue'
import { TEAM, ROLES, ALL_PERMS, PERMISSION_GROUPS, hasGrant } from '@/data/index.js'

const view = ref('members')
const query = ref('')
const inviteOpen = ref(false)
const inviteRole = ref('editor')
const editingRole = ref(null)

const viewTabs = [
  { value: 'members', label: 'A\'zolar',        count: TEAM.length },
  { value: 'roles',   label: 'Rollar' },
  { value: 'matrix',  label: 'Permissionlar' },
  { value: 'groups',  label: 'Kanal guruhlari', count: 3 },
]

const activeToday = computed(() => TEAM.filter(t =>
  t.status === 'active' && (t.last.includes('Hozir') || t.last.includes('daq.') || t.last.includes('soat'))
).length)
const invitedCount = computed(() => TEAM.filter(t => t.status === 'invited').length)

const filtered = computed(() => TEAM.filter(u =>
  !query.value || (u.name + u.email).toLowerCase().includes(query.value.toLowerCase())
))

function getRoleName(roleId) {
  return ROLES.find(r => r.id === roleId)?.name || roleId
}
function getRoleTone(roleId) {
  return ROLES.find(r => r.id === roleId)?.tone || 'muted'
}
function getGrantCount(role) {
  return role.grants === '*' ? ALL_PERMS.length : role.grants.size
}

const channelGroups = [
  { name: 'Yangiliklar guruhi',   channels: ['@olcha_daily', '@huduud'],          members: 3, color: 'var(--accent)' },
  { name: 'Bozor va analitika',   channels: ['@bozor_sharhi'],                    members: 2, color: 'var(--violet)' },
  { name: 'Texnika va aksiyalar', channels: ['@olcha_promo', '@texno_olcha'],     members: 2, color: 'var(--success)' },
]
</script>
