<template>
  <AppModal :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)"
            :title="tt('adminRadar.assignTitle')" :subtitle="source?.name" width="560px">
    <div v-if="loading" class="ram-muted">{{ tt('adminRadar.loading') }}</div>
    <CompanyPicker v-else v-model="selectedIds" :companies="companies"/>
    <div v-if="error" class="ram-error">{{ error }}</div>
    <template #footer>
      <AppButton variant="secondary" size="md" :disabled="busy" @click="$emit('update:modelValue', false)">
        {{ tt('adminRadar.cancel') }}
      </AppButton>
      <AppButton variant="primary" size="md" :loading="busy" :disabled="loading" @click="save">
        <template #icon><AppIcon name="Check" :size="12"/></template>
        {{ tt('adminRadar.save') }}
      </AppButton>
    </template>
  </AppModal>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import AppModal from '@/components/ui/AppModal.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import CompanyPicker from '@/components/admin/CompanyPicker.vue'
import { radarAdminApi } from '@/api/radar.js'
import { apiErrorMessage } from '@/utils/apiError.js'
import { useAppStore } from '@/stores/app.js'

const props = defineProps({
  modelValue: Boolean,
  source: { type: Object, default: null },
  companies: { type: Array, required: true },
})
const emit = defineEmits(['update:modelValue', 'saved'])

const store = useAppStore()
const t = computed(() => store.t)
function tt(key, params) { return t.value(key, params) }

const selectedIds = ref([])
const loading = ref(false)
const busy = ref(false)
const error = ref('')

watch(() => props.modelValue, async (open) => {
  if (!open || !props.source) return
  error.value = ''
  loading.value = true
  try {
    const rows = await radarAdminApi.listCompanies(props.source.id)
    selectedIds.value = rows.map((r) => r.id)
  } catch (e) {
    error.value = apiErrorMessage(e, tt('adminRadar.loadError'))
  } finally {
    loading.value = false
  }
})

async function save() {
  busy.value = true
  error.value = ''
  try {
    await radarAdminApi.replaceCompanies(props.source.id, selectedIds.value)
    emit('saved', selectedIds.value.length)
    emit('update:modelValue', false)
  } catch (e) {
    error.value = apiErrorMessage(e, tt('adminRadar.saveError'))
  } finally {
    busy.value = false
  }
}
</script>

<style scoped>
.ram-muted { padding: 24px; text-align: center; color: var(--muted); font-size: 13px; }
.ram-error { margin-top: 10px; padding: 10px 12px; border-radius: 7px; background: var(--danger-bg); color: var(--danger); font-size: 12.5px; }
</style>
