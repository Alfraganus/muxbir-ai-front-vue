<template>
  <div class="apk">
    <div class="apk-title">{{ tt('aiKeys.title') }}</div>
    <div class="apk-hint">{{ tt('aiKeys.hint') }}</div>
    <div v-for="p in AI_PROVIDERS" :key="p.value" class="apk-row">
      <div class="apk-head">
        <span class="apk-name">{{ p.label }}</span>
        <AppBadge :tone="badge(p.value).tone">{{ badge(p.value).text }}</AppBadge>
        <span v-if="results[p.value]" class="apk-test" :class="results[p.value].ok ? 'ok' : 'bad'">
          {{ results[p.value].ok ? tt('aiKeys.testOk', { ms: results[p.value].ms }) : results[p.value].message }}
        </span>
      </div>
      <div class="apk-controls">
        <AppInput v-model="inputs[p.value]" type="password" :placeholder="tt('aiKeys.placeholder')" class="apk-input"/>
        <AppButton variant="primary" size="md" :loading="busy[p.value] === 'save'" :disabled="!inputs[p.value]?.trim()" @click="save(p.value)">
          {{ tt('aiKeys.save') }}
        </AppButton>
        <AppButton variant="secondary" size="md" :loading="busy[p.value] === 'test'" :disabled="!statusOf(p.value)?.source" @click="test(p.value)">
          {{ tt('aiKeys.test') }}
        </AppButton>
        <AppButton v-if="statusOf(p.value)?.source === 'db'" variant="ghost" size="md" :title="tt('aiKeys.remove')" @click="clear(p.value)">
          <template #icon><AppIcon name="Trash" :size="13"/></template>
        </AppButton>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import AppInput from '@/components/ui/AppInput.vue'
import { AI_PROVIDERS } from '@/config/aiProviders.js'
import { aiKeysApi } from '@/api/aiKeys.js'
import { useToast } from '@/composables/useToast.js'
import { apiErrorMessage } from '@/utils/apiError.js'
import { useAppStore } from '@/stores/app.js'

const store = useAppStore()
const t = computed(() => store.t)
function tt(key, params) { return t.value(key, params) }
const toast = useToast()

const status = ref([])
const inputs = reactive({})
const busy = reactive({})
const results = reactive({})

function statusOf(provider) { return status.value.find((s) => s.provider === provider) }

function badge(provider) {
  const s = statusOf(provider)
  if (s?.source === 'db') return { tone: 'success', text: tt('aiKeys.fromDb', { last4: s.last4 }) }
  if (s?.source === 'env') return { tone: 'accent', text: tt('aiKeys.fromEnv', { last4: s.last4 }) }
  return { tone: 'muted', text: tt('aiKeys.notSet') }
}

async function run(provider, kind, fn, successKey) {
  busy[provider] = kind
  delete results[provider]
  try {
    await fn()
    if (successKey) toast.success(tt(successKey))
  } catch (e) {
    toast.error(apiErrorMessage(e, tt('aiKeys.error')))
  } finally {
    busy[provider] = null
  }
}

const save = (p) => run(p, 'save', async () => { status.value = await aiKeysApi.set(p, inputs[p].trim()); inputs[p] = '' }, 'aiKeys.saved')
const clear = (p) => run(p, 'clear', async () => { status.value = await aiKeysApi.clear(p) }, 'aiKeys.removed')
const test = (p) => run(p, 'test', async () => { results[p] = await aiKeysApi.test(p) })

onMounted(async () => {
  try { status.value = await aiKeysApi.status() } catch (e) { toast.error(apiErrorMessage(e, tt('aiKeys.error'))) }
})
</script>

<style scoped>
.apk { display: flex; flex-direction: column; gap: 10px; padding: 14px; border: 1px solid var(--border); border-radius: var(--r-md); max-width: 720px; }
.apk-title { font-size: 13.5px; font-weight: 600; color: var(--text); }
.apk-hint { font-size: 12px; color: var(--muted); line-height: 1.5; }
.apk-row { display: flex; flex-direction: column; gap: 8px; padding-top: 10px; border-top: 1px solid var(--border-2); }
.apk-head { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.apk-name { font-size: 13px; font-weight: 600; color: var(--text); }
.apk-test { font-size: 11.5px; }
.apk-test.ok { color: var(--success); }
.apk-test.bad { color: var(--danger); }
.apk-controls { display: flex; gap: 8px; align-items: center; }
.apk-input { flex: 1; min-width: 0; }
@media (max-width: 640px) {
  .apk-controls { flex-wrap: wrap; }
  .apk-input { flex-basis: 100%; }
}
</style>
