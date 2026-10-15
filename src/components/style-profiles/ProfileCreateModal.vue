<template>
  <AppModal :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)"
            :title="tt('sp.createTitle')" :subtitle="tt('sp.createSubtitle')" width="520px">
    <div class="pcm">
      <label class="pcm-field"><span>{{ tt('sp.name') }}</span><AppInput v-model="form.name" :placeholder="tt('sp.namePh')"/></label>
      <label class="pcm-field">
        <span>{{ tt('sp.slug') }}</span><AppInput v-model="form.slug" mono placeholder="gazeta-economy"/>
        <span class="pcm-hint">{{ tt('sp.slugHint') }}</span>
      </label>
      <label class="pcm-field"><span>{{ tt('sp.script') }}</span><AppSelect v-model="form.script" :options="scriptOptions"/></label>
      <label class="pcm-field"><span>{{ tt('sp.copyFrom') }}</span><AppSelect v-model="form.copy_from_profile_id" :options="copyOptions"/></label>
      <div v-if="error" class="pcm-error">{{ error }}</div>
    </div>
    <template #footer>
      <AppButton variant="secondary" size="md" :disabled="busy" @click="$emit('update:modelValue', false)">{{ tt('sp.cancel') }}</AppButton>
      <AppButton variant="primary" size="md" :loading="busy" @click="submit">{{ tt('sp.create') }}</AppButton>
    </template>
  </AppModal>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import AppModal from '@/components/ui/AppModal.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import { styleProfilesApi } from '@/api/styleProfiles.js'
import { apiErrorMessage } from '@/utils/apiError.js'
import { useAppStore } from '@/stores/app.js'

const props = defineProps({ modelValue: Boolean, profiles: { type: Array, default: () => [] } })
const emit = defineEmits(['update:modelValue', 'created'])

const store = useAppStore()
const t = computed(() => store.t)
function tt(key, params) { return t.value(key, params) }

const form = reactive({ name: '', slug: '', script: 'cyrl', copy_from_profile_id: '' })
const busy = ref(false)
const error = ref('')

const scriptOptions = computed(() => [
  { value: 'cyrl', label: tt('sp.scriptCyrl') },
  { value: 'latn', label: tt('sp.scriptLatn') },
])
const copyOptions = computed(() => [
  { value: '', label: tt('sp.copyNone') },
  ...props.profiles.map((p) => ({ value: p.id, label: p.name })),
])

watch(() => props.modelValue, (open) => {
  if (open) { Object.assign(form, { name: '', slug: '', script: 'cyrl', copy_from_profile_id: props.profiles[0]?.id || '' }); error.value = '' }
})

async function submit() {
  busy.value = true
  error.value = ''
  try {
    const created = await styleProfilesApi.create({
      name: form.name.trim(),
      slug: form.slug.trim(),
      script: form.script,
      copy_from_profile_id: form.copy_from_profile_id || undefined,
    })
    emit('created', created)
    emit('update:modelValue', false)
  } catch (e) {
    error.value = apiErrorMessage(e, tt('sp.saveError'))
  } finally {
    busy.value = false
  }
}
</script>

<style scoped>
.pcm { display: flex; flex-direction: column; gap: 12px; }
.pcm-field { display: flex; flex-direction: column; gap: 6px; font-size: 12px; font-weight: 600; color: var(--text); }
.pcm-hint { font-size: 11.5px; font-weight: 400; color: var(--muted); }
.pcm-error { padding: 10px 12px; border-radius: 7px; background: var(--danger-bg); color: var(--danger); font-size: 12.5px; }
</style>
