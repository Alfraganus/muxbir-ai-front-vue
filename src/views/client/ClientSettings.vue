<template>
  <div style="padding:20px 24px 8px;display:flex;flex-direction:column;gap:14px;">
    <PageHeader
      title="Sozlamalar"
      subtitle="Telegram ulanish va AI prompt sozlamalarini shu yerda boshqaring. Manbalar endi har kanalda alohida — Kanallar sahifasidagi “Manbalar” tugmasi orqali."
    />
    <AppTabs v-model="tab" :items="tabs"/>
  </div>

  <!-- Eng oddiy v-if: faqat tanlangan tab mount qilinadi.
       Tab almashtirilganda eski unmount, yangi mount. -->
  <ClientTelegramApi  v-if="tab === 'telegram-api'"/>
  <ClientAiPrompt     v-else-if="tab === 'ai-prompt'"/>
</template>

<script setup>
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import AppTabs from '@/components/ui/AppTabs.vue'
import PageHeader from '@/components/layout/PageHeader.vue'
import ClientTelegramApi from './ClientTelegramApi.vue'
import ClientAiPrompt from './ClientAiPrompt.vue'

const route = useRoute()

const tabs = [
  { value: 'telegram-api',  label: 'Telegram API' },
  { value: 'ai-prompt',     label: 'AI prompt' },
]

const validTabs = tabs.map(t => t.value)
// URL'dan o'qiymiz, lekin sinx watchers'ni qo'ymaymiz — soddalashtirish uchun.
const tab = ref(validTabs.includes(route.query.tab) ? route.query.tab : 'telegram-api')
</script>
