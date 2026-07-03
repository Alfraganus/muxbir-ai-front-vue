<template>
  <div style="padding:20px 24px 8px;display:flex;flex-direction:column;gap:14px;">
    <PageHeader :title="tt('settings.title')" :subtitle="tt('settings.subtitle')"/>
    <AppTabs v-model="tab" :items="tabs"/>
  </div>

  <ClientTelegramApi  v-if="tab === 'telegram-api'"/>
  <ClientAiPrompt     v-else-if="tab === 'ai-prompt'"/>
  <ClientTimezone     v-else-if="tab === 'timezone'"/>
  <ClientApiKeys      v-else-if="tab === 'api-keys'"/>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAppStore } from '@/stores/app.js'
import AppTabs from '@/components/ui/AppTabs.vue'
import PageHeader from '@/components/layout/PageHeader.vue'
import ClientTelegramApi from './ClientTelegramApi.vue'
import ClientAiPrompt from './ClientAiPrompt.vue'
import ClientTimezone from './ClientTimezone.vue'
import ClientApiKeys from './ClientApiKeys.vue'

const store = useAppStore()
const route = useRoute()
const t = computed(() => store.t)
function tt(key, params) { return t.value(key, params) }

const tabs = computed(() => [
  { value: 'telegram-api', label: tt('settings.tab.telegram') },
  { value: 'ai-prompt',    label: tt('settings.tab.ai') },
  { value: 'timezone',     label: tt('settings.tab.timezone') },
  { value: 'api-keys',     label: tt('settings.tab.apiKeys') },
])

const validTabs = ['telegram-api', 'ai-prompt', 'timezone', 'api-keys']
const tab = ref(validTabs.includes(route.query.tab) ? route.query.tab : 'telegram-api')
</script>
