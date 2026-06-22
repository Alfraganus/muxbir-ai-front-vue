<template>
  <div style="padding:20px 24px 40px;display:flex;flex-direction:column;gap:16px;max-width:760px;">
    <PageHeader :title="tt('tmr.title')" :subtitle="tt('tmr.subtitle')" />

    <AppPanel :padding="14">
      <div style="display:flex;align-items:flex-start;gap:8px;font-size:12.5px;color:var(--muted);line-height:1.55;">
        <AppIcon name="Bolt" :size="14" style="margin-top:1px;flex-shrink:0;"/>
        <span>
          {{ tt('tmr.info') }} <code>@mllearnweqdqwdqd</code>.
        </span>
      </div>
    </AppPanel>

    <AppPanel :padding="16">
      <div style="display:flex;flex-direction:column;gap:10px;">
        <label style="font-size:12.5px;font-weight:600;">{{ tt('tmr.inputLabel') }}</label>
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
          <input v-model="url"
            :placeholder="tt('tmr.placeholder')"
            @keydown.enter.prevent="run"
            style="flex:1;min-width:260px;font-size:12.5px;padding:9px 11px;border:1px solid var(--border);border-radius:8px;background:var(--panel-2);"/>
          <AppButton variant="primary" size="md" :loading="loading" :disabled="!url.trim()" @click="run">
            <template #icon><AppIcon name="Send" :size="13"/></template>
            {{ tt('tmr.sendBtn') }}
          </AppButton>
        </div>
        <span style="font-size:11px;color:var(--muted);">{{ tt('tmr.hint') }}</span>
      </div>
    </AppPanel>

    <AppPanel v-if="result" :padding="16">
      <div style="display:flex;flex-direction:column;gap:8px;font-size:12.5px;">
        <div style="display:flex;align-items:center;gap:7px;color:var(--success, #16a34a);font-weight:600;">
          <AppIcon name="Check" :size="14"/> {{ tt('tmr.done') }}
        </div>
        <div>{{ tt('tmr.source') }}: <span class="mono">{{ result.source }}</span></div>
        <div>{{ tt('tmr.target') }}: <span class="mono">{{ result.target }}</span></div>
        <div>{{ tt('tmr.photos') }}: <strong>{{ result.photos }}</strong> · {{ tt('tmr.videos') }}: <strong>{{ result.videos }}</strong></div>
      </div>
    </AppPanel>

    <span v-if="err" style="font-size:12.5px;color:var(--danger);">{{ err }}</span>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import AppPanel from '@/components/ui/AppPanel.vue'
import PageHeader from '@/components/layout/PageHeader.vue'
import { postsApi } from '@/api/posts.js'
import { useAppStore } from '@/stores/app.js'

const store = useAppStore()
const t = computed(() => store.t)
function tt(key, params) { return t.value(key, params) }

const url = ref('')
const loading = ref(false)
const result = ref(null)
const err = ref('')

async function run() {
  if (!url.value.trim() || !store.companyId) return
  loading.value = true
  err.value = ''
  result.value = null
  try {
    result.value = await postsApi.testMediaRelay(store.companyId, url.value.trim())
  } catch (e) {
    err.value = e?.response?.data?.message || e?.message || tt('tmr.errGeneric')
  } finally {
    loading.value = false
  }
}
</script>
