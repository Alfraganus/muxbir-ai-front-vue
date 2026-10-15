<template>
  <AppModal :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)"
            :title="version ? `v${version.version_no}` : ''" :subtitle="version?.note || ''" width="900px">
    <div v-if="loading" class="vvm-muted">{{ tt('sp.loading') }}</div>
    <div v-else-if="version" class="vvm">
      <div class="vvm-tabs"><AppTabs v-model="tab" :items="tabs" size="sm"/></div>
      <PromptTextEditor v-if="tab === 'writer'" :model-value="version.writer_prompt" readonly height="55vh"/>
      <ProfileFormatRules v-else-if="tab === 'rules'" :model-value="version.format_rules" :genres="genres" readonly/>
      <PromptTextEditor v-else :model-value="version.review_prompt" readonly height="55vh"/>
    </div>
    <template #footer>
      <AppButton variant="secondary" size="md" @click="$emit('update:modelValue', false)">{{ tt('sp.close') }}</AppButton>
      <AppButton v-if="version && !isActive" variant="primary" size="md" @click="$emit('activate', version.id)">{{ tt('sp.activate') }}</AppButton>
    </template>
  </AppModal>
</template>

<script setup>
import { computed, ref } from 'vue'
import AppModal from '@/components/ui/AppModal.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppTabs from '@/components/ui/AppTabs.vue'
import PromptTextEditor from './PromptTextEditor.vue'
import ProfileFormatRules from './ProfileFormatRules.vue'
import { useAppStore } from '@/stores/app.js'

defineProps({
  modelValue: Boolean,
  version: { type: Object, default: null },
  loading: { type: Boolean, default: false },
  isActive: { type: Boolean, default: false },
  genres: { type: Array, default: () => [] },
})
defineEmits(['update:modelValue', 'activate'])

const store = useAppStore()
const t = computed(() => store.t)
function tt(key, params) { return t.value(key, params) }

const tab = ref('writer')
const tabs = computed(() => [
  { value: 'writer', label: tt('sp.tabWriter') },
  { value: 'rules', label: tt('sp.tabRules') },
  { value: 'review', label: tt('sp.tabReview') },
])
</script>

<style scoped>
.vvm { display: flex; flex-direction: column; gap: 12px; }
.vvm-tabs { overflow-x: auto; }
.vvm-muted { padding: 24px; text-align: center; color: var(--muted); font-size: 13px; }
</style>
