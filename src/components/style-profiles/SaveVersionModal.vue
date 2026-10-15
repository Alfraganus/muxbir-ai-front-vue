<template>
  <AppModal :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)"
            :title="tt('sp.saveTitle')" :subtitle="tt('sp.saveSubtitle', { n: nextVersion })" width="520px">
    <div class="svm">
      <label class="svm-field">
        <span>{{ tt('sp.noteLabel') }}</span>
        <textarea v-model="note" rows="3" class="svm-area" :placeholder="tt('sp.notePh')"/>
      </label>
      <label class="svm-check"><input v-model="activate" type="checkbox"/> {{ tt('sp.activateNow') }}</label>
      <div v-if="error" class="svm-error">{{ error }}</div>
    </div>
    <template #footer>
      <AppButton variant="secondary" size="md" :disabled="busy" @click="$emit('update:modelValue', false)">{{ tt('sp.cancel') }}</AppButton>
      <AppButton variant="primary" size="md" :loading="busy" @click="submit">
        <template #icon><AppIcon name="Save" :size="12"/></template>{{ tt('sp.save') }}
      </AppButton>
    </template>
  </AppModal>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import AppModal from '@/components/ui/AppModal.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import { apiErrorMessage } from '@/utils/apiError.js'
import { useAppStore } from '@/stores/app.js'

const props = defineProps({
  modelValue: Boolean,
  nextVersion: { type: Number, default: 1 },
  /** (payload: { note, activate }) => Promise */
  onSave: { type: Function, required: true },
})
const emit = defineEmits(['update:modelValue', 'saved'])

const store = useAppStore()
const t = computed(() => store.t)
function tt(key, params) { return t.value(key, params) }

const note = ref('')
const activate = ref(true)
const busy = ref(false)
const error = ref('')

watch(() => props.modelValue, (open) => { if (open) { note.value = ''; activate.value = true; error.value = '' } })

async function submit() {
  busy.value = true
  error.value = ''
  try {
    await props.onSave({ note: note.value.trim(), activate: activate.value })
    emit('saved')
    emit('update:modelValue', false)
  } catch (e) {
    error.value = apiErrorMessage(e, tt('sp.saveError'))
  } finally {
    busy.value = false
  }
}
</script>

<style scoped>
.svm { display: flex; flex-direction: column; gap: 12px; }
.svm-field { display: flex; flex-direction: column; gap: 6px; font-size: 12px; font-weight: 600; color: var(--text); }
.svm-area { width: 100%; box-sizing: border-box; padding: 10px 12px; border: 1px solid var(--border); border-radius: var(--r-sm); background: var(--panel); color: var(--text); font: inherit; font-weight: 400; font-size: 13px; resize: vertical; outline: none; }
.svm-area:focus { border-color: var(--accent); }
.svm-check { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--text); cursor: pointer; }
.svm-check input { accent-color: var(--accent); width: 15px; height: 15px; }
.svm-error { padding: 10px 12px; border-radius: 7px; background: var(--danger-bg); color: var(--danger); font-size: 12.5px; }
</style>
