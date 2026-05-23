<template>
  <div style="padding:20px 24px 40px;display:flex;flex-direction:column;gap:16px;">
    <PageHeader title="Kategoriyalar" subtitle="Ushbu kompaniya uchun post kategoriyalari spravochnigi">
      <template #right>
        <AppButton variant="primary" size="md" @click="openCreate">
          <template #icon><AppIcon name="Plus" :size="13"/></template>
          Yangi kategoriya
        </AppButton>
      </template>
    </PageHeader>

    <!-- Empty state -->
    <AppPanel v-if="!loading && !categories.length" :padding="40">
      <div style="text-align:center;color:var(--muted);">
        <AppIcon name="Tag" :size="32" :style="{ color: 'var(--muted-2)', marginBottom: '8px' }"/>
        <div style="font-size:13.5px;font-weight:500;color:var(--text-2);margin-bottom:4px;">Hali kategoriyalar yo'q</div>
        <div style="font-size:12px;">Yuqoridagi "+ Yangi kategoriya" tugmasi orqali qo'shing</div>
      </div>
    </AppPanel>

    <!-- Loading -->
    <div v-else-if="loading" style="text-align:center;padding:40px;color:var(--muted);font-size:13px;">
      Yuklanmoqda...
    </div>

    <!-- List -->
    <AppPanel v-else :padding="0">
      <table style="width:100%;border-collapse:collapse;font-size:13px;">
        <thead>
          <tr style="border-bottom:1px solid var(--border);">
            <th style="text-align:left;padding:10px 16px;font-weight:500;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:var(--muted);">Nom</th>
            <th style="text-align:left;padding:10px 12px;font-weight:500;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:var(--muted);width:120px;">Rang</th>
            <th style="text-align:left;padding:10px 12px;font-weight:500;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:var(--muted);width:90px;">Tartib</th>
            <th style="text-align:right;padding:10px 16px;width:100px;"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(c, i) in categories" :key="c.id" :style="{ borderTop: i === 0 ? 'none' : '1px solid var(--border-2)' }">
            <td style="padding:12px 16px;vertical-align:middle;">
              <div style="display:flex;align-items:center;gap:8px;">
                <span :style="{ width:'10px', height:'10px', borderRadius:'3px', background: c.color || 'var(--border)', flexShrink: 0 }"/>
                <span style="font-weight:500;color:var(--text);">{{ c.name }}</span>
              </div>
            </td>
            <td style="padding:12px;vertical-align:middle;">
              <span v-if="c.color" class="mono" style="font-size:11px;color:var(--muted);">{{ c.color }}</span>
              <span v-else style="font-size:11.5px;color:var(--muted-2);">—</span>
            </td>
            <td style="padding:12px;vertical-align:middle;" class="tabular">
              {{ c.sort_order }}
            </td>
            <td style="padding:12px 16px;vertical-align:middle;text-align:right;">
              <button class="cat-act" @click="openEdit(c)" title="Tahrirlash">
                <AppIcon name="Edit" :size="12"/>
              </button>
              <button class="cat-act cat-act-danger" @click="onDelete(c)" title="O'chirish">
                <AppIcon name="Trash" :size="12"/>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </AppPanel>

    <!-- Modal -->
    <AppModal v-model="modalOpen" :title="form.id ? 'Kategoriyani tahrirlash' : 'Yangi kategoriya'"
      subtitle="Ushbu kompaniya uchun amal qiladi">
      <div style="display:flex;flex-direction:column;gap:12px;">
        <div style="display:flex;flex-direction:column;gap:5px;">
          <label class="cat-label">Nom *</label>
          <input v-model="form.name" placeholder="Masalan: Yangiliklar"
            class="cat-input" @keydown.enter.prevent="save"/>
        </div>
        <div style="display:flex;flex-direction:column;gap:5px;">
          <label class="cat-label">Rang</label>
          <div style="display:flex;align-items:center;gap:8px;">
            <input v-model="form.color" type="color" class="cat-input" style="width:60px;height:36px;padding:2px 4px;cursor:pointer;"/>
            <input v-model="form.color" placeholder="#2F6FED" class="cat-input mono" style="flex:1;"/>
          </div>
        </div>
        <div style="display:flex;flex-direction:column;gap:5px;">
          <label class="cat-label">Tartib raqami</label>
          <input v-model.number="form.sort_order" type="number" min="0" class="cat-input"/>
        </div>
        <div v-if="error" style="padding:9px 12px;background:var(--danger-bg);border:1px solid color-mix(in oklab,var(--danger) 25%,transparent);border-radius:8px;font-size:12px;color:var(--danger);display:flex;align-items:center;gap:6px;">
          <AppIcon name="Close" :size="12"/> {{ error }}
        </div>
        <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:4px;">
          <AppButton variant="secondary" size="md" @click="modalOpen = false">Bekor qilish</AppButton>
          <AppButton variant="primary" size="md" :loading="saving" @click="save">
            {{ form.id ? 'Saqlash' : 'Yaratish' }}
          </AppButton>
        </div>
      </div>
    </AppModal>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useAppStore } from '@/stores/app.js'
import { companiesApi } from '@/api/companies.js'
import { categoriesApi } from '@/api/categories.js'
import PageHeader from '@/components/layout/PageHeader.vue'
import AppPanel from '@/components/ui/AppPanel.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import AppModal from '@/components/ui/AppModal.vue'

const store = useAppStore()
const company = ref(null)
const categories = ref([])
const loading = ref(true)

const modalOpen = ref(false)
const saving = ref(false)
const error = ref('')
const form = reactive({ id: null, name: '', color: '#2F6FED', sort_order: 0 })

async function loadAll() {
  loading.value = true
  try {
    if (!company.value) {
      const cs = await companiesApi.getMy().catch(() => [])
      const list = Array.isArray(cs) ? cs : [cs].filter(Boolean)
      company.value = list[0] || null
    }
    if (!company.value) return
    categories.value = await categoriesApi.list(company.value.id)
  } catch { /* jim */ } finally {
    loading.value = false
  }
}

function resetForm() {
  form.id = null
  form.name = ''
  form.color = '#2F6FED'
  form.sort_order = 0
  error.value = ''
}

function openCreate() {
  resetForm()
  modalOpen.value = true
}

function openEdit(c) {
  form.id = c.id
  form.name = c.name
  form.color = c.color || '#2F6FED'
  form.sort_order = c.sort_order || 0
  error.value = ''
  modalOpen.value = true
}

async function save() {
  error.value = ''
  const name = form.name.trim()
  if (!name) { error.value = 'Nom kiritilishi shart'; return }
  if (!company.value) { error.value = 'Kompaniya topilmadi'; return }
  saving.value = true
  try {
    const payload = { name, color: form.color || undefined, sort_order: Number(form.sort_order) || 0 }
    if (form.id) {
      const updated = await categoriesApi.update(company.value.id, form.id, payload)
      const i = categories.value.findIndex(c => c.id === form.id)
      if (i >= 0) categories.value[i] = updated
    } else {
      const created = await categoriesApi.create(company.value.id, payload)
      categories.value = [...categories.value, created]
    }
    // Sort
    categories.value.sort((a, b) => (a.sort_order - b.sort_order) || a.name.localeCompare(b.name))
    modalOpen.value = false
  } catch (e) {
    const msg = e?.response?.data?.message
    error.value = Array.isArray(msg) ? msg.join('. ') : (msg || 'Saqlashda xato')
  } finally {
    saving.value = false
  }
}

async function onDelete(c) {
  if (!confirm(`"${c.name}" kategoriyasi o'chirilsinmi?`)) return
  try {
    await categoriesApi.remove(company.value.id, c.id)
    categories.value = categories.value.filter(x => x.id !== c.id)
  } catch (e) {
    alert(e?.response?.data?.message || "O'chirishda xato")
  }
}

onMounted(loadAll)
</script>

<style scoped>
.cat-label {
  font-size: 10.5px;
  color: var(--muted);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.cat-input {
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
.cat-input:focus {
  background: var(--panel);
  border-color: var(--accent);
  box-shadow: 0 0 0 3px color-mix(in oklab, var(--accent) 18%, transparent);
}
.cat-input.mono { font-family: var(--font-mono, ui-monospace, monospace); }

.cat-act {
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
.cat-act:hover {
  background: var(--panel-2);
  color: var(--text);
  border-color: var(--accent);
}
.cat-act-danger:hover {
  background: var(--danger-bg);
  color: var(--danger);
  border-color: var(--danger);
}
</style>
