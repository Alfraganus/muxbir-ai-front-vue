<template>
  <div style="padding:20px 24px 40px;display:flex;flex-direction:column;gap:16px;">
    <PageHeader :title="tt('adminReferences.title')" :subtitle="tt('adminReferences.subtitle')">
      <template #right>
        <AppButton variant="primary" size="md" @click="openCreate">
          <template #icon><AppIcon name="Plus" :size="13"/></template>
          {{ tt('adminReferences.addNew') }}
        </AppButton>
      </template>
    </PageHeader>

    <!-- Tabs -->
    <div style="display:flex;gap:4px;border-bottom:1px solid var(--border);padding-bottom:0;">
      <button v-for="tab in tabs" :key="tab.id" @click="activeTab = tab.id"
        :style="{
          padding:'8px 16px',
          fontSize:'13px',fontWeight:500,
          background:'transparent',border:'none',cursor:'pointer',
          color: activeTab===tab.id ? 'var(--accent)' : 'var(--muted)',
          borderBottom: activeTab===tab.id ? '2px solid var(--accent)' : '2px solid transparent',
          marginBottom:'-1px',transition:'all .15s',
        }">
        <span style="display:inline-flex;align-items:center;gap:6px;">
          {{ tab.label }}
          <span :style="{
            display:'inline-flex',alignItems:'center',justifyContent:'center',
            minWidth:'18px',height:'18px',padding:'0 5px',
            background:'var(--panel-2)',border:'1px solid var(--border)',
            borderRadius:'999px',fontSize:'10.5px',color:'var(--muted)',
          }">{{ counts[tab.id] }}</span>
        </span>
      </button>
    </div>

    <!-- Search bar -->
    <div style="display:flex;gap:8px;align-items:center;">
      <div style="flex:1;display:flex;align-items:center;gap:6px;height:32px;padding:0 10px;background:var(--panel);border:1px solid var(--border);border-radius:var(--r-sm);">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>
        <input v-model="search" :placeholder="tt('adminReferences.searchPlaceholder')" style="flex:1;border:none;outline:none;background:transparent;font-size:13px;color:var(--text);" />
        <button v-if="search" @click="search=''" style="background:transparent;border:none;cursor:pointer;color:var(--muted);padding:0;display:inline-flex;">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M18 6 6 18M6 6l12 12"/></svg>
        </button>
      </div>
      <AppButton variant="secondary" size="md" @click="loadData">
        <template #icon><AppIcon name="Sort" :size="13"/></template>
        {{ tt('adminReferences.refresh') }}
      </AppButton>
    </div>

    <!-- Table -->
    <AppPanel :padding="0">
      <!-- Loading -->
      <div v-if="loading" style="padding:48px;text-align:center;color:var(--muted);font-size:13px;">
        <div style="width:20px;height:20px;border:2px solid var(--border);border-top-color:var(--accent);border-radius:50%;animation:spin 0.7s linear infinite;margin:0 auto 8px;"></div>
        {{ tt('adminReferences.loading') }}
      </div>

      <!-- Error -->
      <div v-else-if="error" style="padding:48px;text-align:center;color:var(--danger);font-size:13px;">
        <div style="margin-bottom:8px;">{{ error }}</div>
        <AppButton variant="secondary" size="md" @click="loadData">{{ tt('adminReferences.retry') }}</AppButton>
      </div>

      <!-- Business Types table -->
      <template v-else-if="activeTab==='business-types'">
        <table style="width:100%;border-collapse:collapse;font-size:12.5px;">
          <thead>
            <tr>
              <th v-for="h in [tt('adminReferences.colSlug'),tt('adminReferences.colNameUz'),tt('adminReferences.colNameRu'),tt('adminReferences.colNameEn'),tt('adminReferences.colOrder'),tt('adminReferences.colStatus'),'']" :key="h"
                style="text-align:left;padding:10px 14px;font-size:11px;font-weight:500;text-transform:uppercase;letter-spacing:0.05em;color:var(--muted);border-bottom:1px solid var(--border-2);">
                {{ h }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="filteredItems.length===0">
              <td colspan="7" style="padding:32px;text-align:center;color:var(--muted);">{{ tt('adminReferences.noData') }}</td>
            </tr>
            <tr v-for="item in filteredItems" :key="item.id"
              style="border-top:1px solid var(--border-2);transition:background .1s;"
              @mouseenter="e => e.currentTarget.style.background='var(--panel-2)'"
              @mouseleave="e => e.currentTarget.style.background='transparent'">
              <td style="padding:10px 14px;">
                <code style="font-size:11.5px;font-family:var(--font-mono);background:var(--panel-2);padding:2px 6px;border-radius:4px;color:var(--text-2);">{{ item.slug }}</code>
              </td>
              <td style="padding:10px 14px;font-weight:500;">{{ item.name_i18n?.uz || item.name }}</td>
              <td style="padding:10px 14px;color:var(--text-2);">{{ item.name_i18n?.ru }}</td>
              <td style="padding:10px 14px;color:var(--text-2);">{{ item.name_i18n?.en }}</td>
              <td style="padding:10px 14px;" class="tabular">{{ item.sort_order }}</td>
              <td style="padding:10px 14px;">
                <span :style="{
                  display:'inline-flex',alignItems:'center',gap:'4px',
                  padding:'2px 8px',borderRadius:'999px',fontSize:'11.5px',fontWeight:500,
                  background: item.is_active ? 'color-mix(in oklab,var(--success) 12%,transparent)' : 'color-mix(in oklab,var(--muted) 12%,transparent)',
                  color: item.is_active ? 'var(--success)' : 'var(--muted)',
                }">
                  <span :style="{ width:'5px',height:'5px',borderRadius:'50%',background:'currentColor',display:'inline-block' }"></span>
                  {{ item.is_active ? tt('adminReferences.statusActive') : tt('adminReferences.statusInactive') }}
                </span>
              </td>
              <td style="padding:10px 14px;text-align:right;">
                <div style="display:inline-flex;gap:4px;">
                  <button @click="openEdit(item)"
                    style="height:28px;padding:0 10px;border-radius:6px;border:1px solid var(--border);background:var(--panel);cursor:pointer;font-size:12px;color:var(--text-2);">
                    {{ tt('adminReferences.edit') }}
                  </button>
                  <button @click="confirmDelete(item)"
                    style="height:28px;padding:0 10px;border-radius:6px;border:1px solid color-mix(in oklab,var(--danger) 30%,transparent);background:color-mix(in oklab,var(--danger) 8%,transparent);cursor:pointer;font-size:12px;color:var(--danger);">
                    {{ tt('adminReferences.delete') }}
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </template>

      <!-- Platforms table -->
      <template v-else-if="activeTab==='platforms'">
        <table style="width:100%;border-collapse:collapse;font-size:12.5px;">
          <thead>
            <tr>
              <th v-for="h in [tt('adminReferences.colSlug'),tt('adminReferences.colNameUz'),tt('adminReferences.colNameRu'),tt('adminReferences.colAvailable'),tt('adminReferences.colStatus'),'']" :key="h"
                style="text-align:left;padding:10px 14px;font-size:11px;font-weight:500;text-transform:uppercase;letter-spacing:0.05em;color:var(--muted);border-bottom:1px solid var(--border-2);">
                {{ h }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="filteredItems.length===0">
              <td colspan="6" style="padding:32px;text-align:center;color:var(--muted);">{{ tt('adminReferences.noData') }}</td>
            </tr>
            <tr v-for="item in filteredItems" :key="item.id"
              style="border-top:1px solid var(--border-2);transition:background .1s;"
              @mouseenter="e => e.currentTarget.style.background='var(--panel-2)'"
              @mouseleave="e => e.currentTarget.style.background='transparent'">
              <td style="padding:10px 14px;">
                <div style="display:flex;align-items:center;gap:8px;">
                  <div :style="{
                    width:'28px',height:'28px',borderRadius:'8px',flexShrink:0,
                    background: item.slug==='telegram' ? '#2AABEE' : item.slug==='instagram' ? 'linear-gradient(135deg,#f9ce34,#ee2a7b,#6228d7)' : 'var(--panel-2)',
                    display:'inline-flex',alignItems:'center',justifyContent:'center',
                    border:'1px solid var(--border)',
                    fontSize:'11px',fontWeight:700,color:'white',
                  }">
                    {{ item.slug[0].toUpperCase() }}
                  </div>
                  <code style="font-size:11.5px;font-family:var(--font-mono);background:var(--panel-2);padding:2px 6px;border-radius:4px;color:var(--text-2);">{{ item.slug }}</code>
                </div>
              </td>
              <td style="padding:10px 14px;font-weight:500;">{{ item.name_i18n?.uz || item.name }}</td>
              <td style="padding:10px 14px;color:var(--text-2);">{{ item.name_i18n?.ru }}</td>
              <td style="padding:10px 14px;">
                <span :style="{
                  display:'inline-flex',alignItems:'center',gap:'4px',
                  padding:'2px 8px',borderRadius:'999px',fontSize:'11.5px',fontWeight:500,
                  background: item.is_available ? 'color-mix(in oklab,var(--success) 12%,transparent)' : 'color-mix(in oklab,var(--muted) 12%,transparent)',
                  color: item.is_available ? 'var(--success)' : 'var(--muted)',
                }">{{ item.is_available ? tt('adminReferences.statusActive') : tt('adminReferences.comingSoon') }}</span>
              </td>
              <td style="padding:10px 14px;">
                <span :style="{
                  padding:'2px 8px',borderRadius:'999px',fontSize:'11.5px',fontWeight:500,
                  background: item.is_active ? 'color-mix(in oklab,var(--success) 12%,transparent)' : 'color-mix(in oklab,var(--muted) 12%,transparent)',
                  color: item.is_active ? 'var(--success)' : 'var(--muted)',
                }">{{ item.is_active ? tt('adminReferences.enabled') : tt('adminReferences.disabled') }}</span>
              </td>
              <td style="padding:10px 14px;text-align:right;">
                <div style="display:inline-flex;gap:4px;">
                  <button @click="openEdit(item)"
                    style="height:28px;padding:0 10px;border-radius:6px;border:1px solid var(--border);background:var(--panel);cursor:pointer;font-size:12px;color:var(--text-2);">
                    {{ tt('adminReferences.edit') }}
                  </button>
                  <button @click="confirmDelete(item)"
                    style="height:28px;padding:0 10px;border-radius:6px;border:1px solid color-mix(in oklab,var(--danger) 30%,transparent);background:color-mix(in oklab,var(--danger) 8%,transparent);cursor:pointer;font-size:12px;color:var(--danger);">
                    {{ tt('adminReferences.delete') }}
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </template>

      <!-- Source Categories table -->
      <template v-else-if="activeTab==='source-categories'">
        <table style="width:100%;border-collapse:collapse;font-size:12.5px;">
          <thead>
            <tr>
              <th v-for="h in [tt('adminReferences.colSlug'),tt('adminReferences.colNameUz'),tt('adminReferences.colNameRu'),tt('adminReferences.colNameEn'),tt('adminReferences.colOrder'),tt('adminReferences.colStatus'),'']" :key="h"
                style="text-align:left;padding:10px 14px;font-size:11px;font-weight:500;text-transform:uppercase;letter-spacing:0.05em;color:var(--muted);border-bottom:1px solid var(--border-2);">
                {{ h }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="filteredItems.length===0">
              <td colspan="7" style="padding:32px;text-align:center;color:var(--muted);">{{ tt('adminReferences.noData') }}</td>
            </tr>
            <tr v-for="item in filteredItems" :key="item.id"
              style="border-top:1px solid var(--border-2);transition:background .1s;"
              @mouseenter="e => e.currentTarget.style.background='var(--panel-2)'"
              @mouseleave="e => e.currentTarget.style.background='transparent'">
              <td style="padding:10px 14px;">
                <code style="font-size:11.5px;font-family:var(--font-mono);background:var(--panel-2);padding:2px 6px;border-radius:4px;color:var(--text-2);">{{ item.slug }}</code>
              </td>
              <td style="padding:10px 14px;font-weight:500;">{{ item.name_i18n?.uz || item.name }}</td>
              <td style="padding:10px 14px;color:var(--text-2);">{{ item.name_i18n?.ru }}</td>
              <td style="padding:10px 14px;color:var(--text-2);">{{ item.name_i18n?.en }}</td>
              <td style="padding:10px 14px;" class="tabular">{{ item.sort_order }}</td>
              <td style="padding:10px 14px;">
                <span :style="{
                  padding:'2px 8px',borderRadius:'999px',fontSize:'11.5px',fontWeight:500,
                  background: item.is_active ? 'color-mix(in oklab,var(--success) 12%,transparent)' : 'color-mix(in oklab,var(--muted) 12%,transparent)',
                  color: item.is_active ? 'var(--success)' : 'var(--muted)',
                }">{{ item.is_active ? tt('adminReferences.statusActive') : tt('adminReferences.statusInactive') }}</span>
              </td>
              <td style="padding:10px 14px;text-align:right;">
                <div style="display:inline-flex;gap:4px;">
                  <button @click="openEdit(item)"
                    style="height:28px;padding:0 10px;border-radius:6px;border:1px solid var(--border);background:var(--panel);cursor:pointer;font-size:12px;color:var(--text-2);">
                    {{ tt('adminReferences.edit') }}
                  </button>
                  <button @click="confirmDelete(item)"
                    style="height:28px;padding:0 10px;border-radius:6px;border:1px solid color-mix(in oklab,var(--danger) 30%,transparent);background:color-mix(in oklab,var(--danger) 8%,transparent);cursor:pointer;font-size:12px;color:var(--danger);">
                    {{ tt('adminReferences.delete') }}
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </template>
    </AppPanel>

    <!-- ─── CREATE / EDIT MODAL ─────────────────────────── -->
    <AppModal v-model="showModal" :title="editingItem ? tt('adminReferences.edit') : tt('adminReferences.addNew')" :subtitle="currentTabLabel">
      <div style="display:flex;flex-direction:column;gap:14px;">
        <!-- Slug -->
        <FormField label="Slug" :error="formErrors.slug" required>
          <div style="display:flex;align-items:center;height:32px;padding:0 10px;gap:6px;background:var(--panel);border:1px solid var(--border);border-radius:var(--r-sm);">
            <input v-model="form.slug" placeholder="ecommerce" :disabled="!!editingItem"
              style="flex:1;border:none;outline:none;background:transparent;font-size:13px;color:var(--text);font-family:var(--font-mono);" />
          </div>
        </FormField>

        <!-- i18n names -->
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;">
          <FormField :label="tt('adminReferences.colNameUz')" :error="formErrors['name_i18n.uz']" required>
            <FieldInput v-model="form.name_i18n.uz" placeholder="E-tijorat" />
          </FormField>
          <FormField :label="tt('adminReferences.colNameRu')" :error="formErrors['name_i18n.ru']">
            <FieldInput v-model="form.name_i18n.ru" placeholder="Э-коммерция" />
          </FormField>
          <FormField :label="tt('adminReferences.colNameEn')" :error="formErrors['name_i18n.en']">
            <FieldInput v-model="form.name_i18n.en" placeholder="E-commerce" />
          </FormField>
        </div>

        <!-- Platform-specific: is_available -->
        <template v-if="activeTab==='platforms'">
          <FormField :label="tt('adminReferences.iconName')">
            <FieldInput v-model="form.icon" placeholder="telegram-icon" />
          </FormField>
          <div style="display:flex;gap:24px;">
            <label style="display:inline-flex;align-items:center;gap:8px;cursor:pointer;font-size:13px;">
              <input type="checkbox" v-model="form.is_available" style="accent-color:var(--accent);width:14px;height:14px;" />
              {{ tt('adminReferences.availableField') }}
            </label>
            <label style="display:inline-flex;align-items:center;gap:8px;cursor:pointer;font-size:13px;">
              <input type="checkbox" v-model="form.is_active" style="accent-color:var(--accent);width:14px;height:14px;" />
              {{ tt('adminReferences.activeField') }}
            </label>
          </div>
        </template>

        <!-- sort_order + is_active for others -->
        <template v-else>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;align-items:end;">
            <FormField :label="tt('adminReferences.sortOrder')">
              <div style="display:flex;align-items:center;height:32px;padding:0 10px;background:var(--panel);border:1px solid var(--border);border-radius:var(--r-sm);">
                <input v-model.number="form.sort_order" type="number" min="0"
                  style="flex:1;border:none;outline:none;background:transparent;font-size:13px;color:var(--text);font-family:var(--font-mono);" />
              </div>
            </FormField>
            <FormField label="&nbsp;">
              <label style="display:inline-flex;align-items:center;gap:8px;cursor:pointer;font-size:13px;height:32px;">
                <input type="checkbox" v-model="form.is_active" style="accent-color:var(--accent);width:14px;height:14px;" />
                {{ tt('adminReferences.activeStatus') }}
              </label>
            </FormField>
          </div>
        </template>

        <!-- Error message -->
        <div v-if="saveError" style="padding:10px 12px;background:color-mix(in oklab,var(--danger) 10%,transparent);border:1px solid color-mix(in oklab,var(--danger) 25%,transparent);border-radius:8px;color:var(--danger);font-size:12.5px;">
          {{ saveError }}
        </div>
      </div>

      <template #footer>
        <AppButton variant="secondary" size="md" @click="showModal=false">{{ tt('adminReferences.cancel') }}</AppButton>
        <AppButton variant="primary" size="md" :loading="saving" @click="saveItem">
          {{ editingItem ? tt('adminReferences.save') : tt('adminReferences.add') }}
        </AppButton>
      </template>
    </AppModal>

    <!-- ─── DELETE CONFIRM MODAL ───────────────────────── -->
    <AppModal v-model="showDeleteModal" :title="tt('adminReferences.deleteConfirmTitle')" width="400px">
      <p style="font-size:13px;color:var(--text-2);margin:0 0 4px;">
        <strong style="color:var(--text);">{{ deletingItem?.name_i18n?.uz || deletingItem?.slug }}</strong> {{ tt('adminReferences.deleteConfirmQuestion') }}
      </p>
      <p style="font-size:12px;color:var(--muted);margin:0;">{{ tt('adminReferences.deleteIrreversible') }}</p>
      <template #footer>
        <AppButton variant="secondary" size="md" @click="showDeleteModal=false">{{ tt('adminReferences.cancel') }}</AppButton>
        <AppButton variant="danger" size="md" :loading="deleting" @click="deleteItem">{{ tt('adminReferences.delete') }}</AppButton>
      </template>
    </AppModal>

    <!-- Toast notifications -->
    <ToastContainer />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, defineComponent, h } from 'vue'
import { referencesApi } from '@/api/references.js'
import { useToast } from '@/composables/useToast.js'
import { useAppStore } from '@/stores/app.js'
import PageHeader from '@/components/layout/PageHeader.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import AppPanel from '@/components/ui/AppPanel.vue'
import AppModal from '@/components/ui/AppModal.vue'

const toast = useToast()
const store = useAppStore()
const t = computed(() => store.t)
function tt(key, params) { return t.value(key, params) }

// ── Inline mini components ────────────────────────────────
const FormField = defineComponent({
  props: { label: String, error: String, required: Boolean },
  setup(props, { slots }) {
    return () => h('div', { style: 'display:flex;flex-direction:column;gap:4px;' }, [
      h('label', { style: 'font-size:11px;color:var(--muted);font-weight:500;display:flex;align-items:center;gap:4px;' }, [
        props.label,
        props.required ? h('span', { style: 'color:var(--danger);' }, '*') : null,
      ]),
      slots.default?.(),
      props.error ? h('span', { style: 'font-size:11px;color:var(--danger);' }, props.error) : null,
    ])
  }
})

const FieldInput = defineComponent({
  props: { modelValue: String, placeholder: String },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    return () => h('div', {
      style: 'display:flex;align-items:center;height:32px;padding:0 10px;background:var(--panel);border:1px solid var(--border);border-radius:var(--r-sm);'
    }, [
      h('input', {
        value: props.modelValue,
        placeholder: props.placeholder,
        onInput: e => emit('update:modelValue', e.target.value),
        style: 'flex:1;border:none;outline:none;background:transparent;font-size:13px;color:var(--text);'
      })
    ])
  }
})

const ToastContainer = defineComponent({
  setup() {
    const { toasts } = useToast()
    return () => h('div', {
      style: 'position:fixed;bottom:24px;right:24px;z-index:2000;display:flex;flex-direction:column;gap:8px;pointer-events:none;'
    }, toasts.value.map(t => h('div', {
      key: t.id,
      style: `pointer-events:all;display:flex;align-items:center;gap:10px;padding:10px 14px;
        background:${t.tone==='success'?'color-mix(in oklab,var(--success) 12%,var(--panel))':'color-mix(in oklab,var(--danger) 12%,var(--panel))'};
        border:1px solid ${t.tone==='success'?'color-mix(in oklab,var(--success) 30%,transparent)':'color-mix(in oklab,var(--danger) 30%,transparent)'};
        border-radius:10px;box-shadow:0 4px 20px rgba(0,0,0,0.15);min-width:240px;max-width:360px;font-size:13px;`
    }, t.message)))
  }
})

// ── State ─────────────────────────────────────────────────
const activeTab = ref('business-types')
const search = ref('')
const loading = ref(false)
const error = ref(null)

const businessTypes = ref([])
const platforms = ref([])
const sourceCategories = ref([])

const showModal = ref(false)
const showDeleteModal = ref(false)
const editingItem = ref(null)
const deletingItem = ref(null)
const saving = ref(false)
const deleting = ref(false)
const saveError = ref('')
const formErrors = ref({})

const defaultForm = () => ({
  slug: '',
  name_i18n: { uz: '', ru: '', en: '' },
  is_active: true,
  is_available: false,
  sort_order: 0,
  icon: '',
})
const form = ref(defaultForm())

// ── Computed ──────────────────────────────────────────────
const tabs = computed(() => [
  { id: 'business-types',    label: tt('adminReferences.tabBusinessTypes') },
  { id: 'platforms',         label: tt('adminReferences.tabPlatforms') },
  { id: 'source-categories', label: tt('adminReferences.tabSourceCategories') },
])

const currentTabLabel = computed(() => tabs.value.find(tab => tab.id === activeTab.value)?.label || '')

const currentItems = computed(() => {
  if (activeTab.value === 'business-types') return businessTypes.value
  if (activeTab.value === 'platforms') return platforms.value
  return sourceCategories.value
})

const counts = computed(() => ({
  'business-types': businessTypes.value.length,
  'platforms': platforms.value.length,
  'source-categories': sourceCategories.value.length,
}))

const filteredItems = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return currentItems.value
  return currentItems.value.filter(item =>
    item.slug?.toLowerCase().includes(q) ||
    item.name_i18n?.uz?.toLowerCase().includes(q) ||
    item.name_i18n?.ru?.toLowerCase().includes(q)
  )
})

// ── API calls ─────────────────────────────────────────────
async function loadData() {
  loading.value = true
  error.value = null
  try {
    const [bt, pl, sc] = await Promise.all([
      referencesApi.getBusinessTypes().catch(() => []),
      referencesApi.getPlatforms().catch(() => []),
      referencesApi.getSourceCategories().catch(() => []),
    ])
    businessTypes.value = bt
    platforms.value = pl
    sourceCategories.value = sc
  } catch (e) {
    error.value = tt('adminReferences.loadError')
  } finally {
    loading.value = false
  }
}

// ── CRUD ──────────────────────────────────────────────────
function openCreate() {
  editingItem.value = null
  form.value = defaultForm()
  formErrors.value = {}
  saveError.value = ''
  showModal.value = true
}

function openEdit(item) {
  editingItem.value = item
  form.value = {
    slug: item.slug,
    name_i18n: { uz: item.name_i18n?.uz || '', ru: item.name_i18n?.ru || '', en: item.name_i18n?.en || '' },
    is_active: item.is_active ?? true,
    is_available: item.is_available ?? false,
    sort_order: item.sort_order ?? 0,
    icon: item.icon || '',
  }
  formErrors.value = {}
  saveError.value = ''
  showModal.value = true
}

function validateForm() {
  const errs = {}
  if (!form.value.slug.trim()) errs.slug = tt('adminReferences.errSlugRequired')
  if (!/^[a-z0-9_-]+$/.test(form.value.slug)) errs.slug = tt('adminReferences.errSlugFormat')
  if (!form.value.name_i18n.uz.trim()) errs['name_i18n.uz'] = tt('adminReferences.errNameUzRequired')
  formErrors.value = errs
  return Object.keys(errs).length === 0
}

async function saveItem() {
  if (!validateForm()) return
  saving.value = true
  saveError.value = ''
  try {
    const payload = {
      slug: form.value.slug,
      name_i18n: form.value.name_i18n,
      is_active: form.value.is_active,
      sort_order: form.value.sort_order,
      ...(activeTab.value === 'platforms' ? { is_available: form.value.is_available, icon: form.value.icon || undefined } : {}),
    }

    if (editingItem.value) {
      if (activeTab.value === 'business-types') {
        const updated = await referencesApi.updateBusinessType(editingItem.value.id, payload)
        const idx = businessTypes.value.findIndex(i => i.id === editingItem.value.id)
        if (idx > -1) businessTypes.value[idx] = updated
      } else if (activeTab.value === 'platforms') {
        const updated = await referencesApi.updatePlatform(editingItem.value.id, payload)
        const idx = platforms.value.findIndex(i => i.id === editingItem.value.id)
        if (idx > -1) platforms.value[idx] = updated
      } else {
        const updated = await referencesApi.updateSourceCategory(editingItem.value.id, payload)
        const idx = sourceCategories.value.findIndex(i => i.id === editingItem.value.id)
        if (idx > -1) sourceCategories.value[idx] = updated
      }
      toast.success(tt('adminReferences.toastUpdated'))
    } else {
      if (activeTab.value === 'business-types') {
        const created = await referencesApi.createBusinessType(payload)
        businessTypes.value.push(created)
      } else if (activeTab.value === 'platforms') {
        const created = await referencesApi.createPlatform(payload)
        platforms.value.push(created)
      } else {
        const created = await referencesApi.createSourceCategory(payload)
        sourceCategories.value.push(created)
      }
      toast.success(tt('adminReferences.toastAdded'))
    }
    showModal.value = false
  } catch (e) {
    const msg = e.response?.data?.message
    saveError.value = Array.isArray(msg) ? msg.join('. ') : (msg || tt('adminReferences.saveError'))
  } finally {
    saving.value = false
  }
}

function confirmDelete(item) {
  deletingItem.value = item
  showDeleteModal.value = true
}

async function deleteItem() {
  if (!deletingItem.value) return
  deleting.value = true
  try {
    if (activeTab.value === 'business-types') {
      await referencesApi.deleteBusinessType(deletingItem.value.id)
      businessTypes.value = businessTypes.value.filter(i => i.id !== deletingItem.value.id)
    } else if (activeTab.value === 'platforms') {
      await referencesApi.deletePlatform(deletingItem.value.id)
      platforms.value = platforms.value.filter(i => i.id !== deletingItem.value.id)
    } else {
      await referencesApi.deleteSourceCategory(deletingItem.value.id)
      sourceCategories.value = sourceCategories.value.filter(i => i.id !== deletingItem.value.id)
    }
    toast.success(tt('adminReferences.toastDeleted'))
    showDeleteModal.value = false
  } catch (e) {
    toast.error(e.response?.data?.message || tt('adminReferences.deleteError'))
  } finally {
    deleting.value = false
  }
}

// ── Lifecycle ─────────────────────────────────────────────
onMounted(loadData)
watch(activeTab, () => { search.value = '' })
</script>

<style>
@keyframes spin { to { transform: rotate(360deg); } }
</style>
