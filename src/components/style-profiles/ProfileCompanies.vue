<template>
  <div class="pc">
    <p class="pc-hint">{{ tt('sp.companiesHint') }}</p>
    <div v-if="loading" class="pc-muted">{{ tt('sp.loading') }}</div>
    <CompanyPicker v-else v-model="selected" :companies="companies"/>
    <div class="pc-actions">
      <AppButton variant="primary" size="md" :loading="busy" :disabled="loading" @click="save">
        <template #icon><AppIcon name="Check" :size="12"/></template>{{ tt('sp.saveCompanies') }}
      </AppButton>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import CompanyPicker from '@/components/admin/CompanyPicker.vue'
import { styleProfilesApi } from '@/api/styleProfiles.js'
import { adminApi } from '@/api/admin.js'
import { useToast } from '@/composables/useToast.js'
import { apiErrorMessage } from '@/utils/apiError.js'
import { useAppStore } from '@/stores/app.js'

const props = defineProps({ profileId: { type: String, required: true } })
const emit = defineEmits(['saved'])

const store = useAppStore()
const t = computed(() => store.t)
function tt(key, params) { return t.value(key, params) }
const toast = useToast()

const companies = ref([])
const selected = ref([])
const loading = ref(true)
const busy = ref(false)

onMounted(async () => {
  try {
    const [all, assigned] = await Promise.all([adminApi.listCompanies(), styleProfilesApi.listCompanies(props.profileId)])
    companies.value = (all || []).map((c) => ({ id: c.id, name: c.name, email: c.owner?.email }))
    selected.value = assigned.map((c) => c.id)
  } catch (e) {
    toast.error(apiErrorMessage(e, tt('sp.loadError')))
  } finally {
    loading.value = false
  }
})

async function save() {
  busy.value = true
  try {
    await styleProfilesApi.replaceCompanies(props.profileId, selected.value)
    toast.success(tt('sp.companiesSaved', { n: selected.value.length }))
    emit('saved')
  } catch (e) {
    toast.error(apiErrorMessage(e, tt('sp.saveError')))
  } finally {
    busy.value = false
  }
}
</script>

<style scoped>
.pc { display: flex; flex-direction: column; gap: 12px; max-width: 640px; }
.pc-hint { margin: 0; font-size: 12.5px; color: var(--muted); }
.pc-muted { padding: 24px; text-align: center; color: var(--muted); font-size: 13px; }
.pc-actions { display: flex; justify-content: flex-end; }
</style>
