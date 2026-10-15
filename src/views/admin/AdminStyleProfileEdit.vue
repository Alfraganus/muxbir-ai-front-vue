<template>
  <div class="spe">
    <RouterLink to="/admin/style-profiles" class="spe-back"><AppIcon name="ChevronL" :size="13"/> {{ tt('sp.back') }}</RouterLink>
    <div v-if="ed.error.value" class="spe-error">{{ ed.error.value }}</div>
    <div v-else-if="!profile" class="spe-muted">{{ tt('sp.loading') }}</div>
    <template v-else>
      <PageHeader :title="profile.name" :subtitle="subtitle">
        <template #right>
          <AppBadge v-if="ed.dirty.value" tone="warn">{{ tt('sp.unsaved') }}</AppBadge>
          <AppButton variant="secondary" size="md" :disabled="!ed.dirty.value" @click="ed.resetDraft">{{ tt('sp.discard') }}</AppButton>
          <AppButton variant="primary" size="md" :disabled="!ed.dirty.value" @click="saveOpen = true">
            <template #icon><AppIcon name="Save" :size="13"/></template>{{ tt('sp.saveVersion') }}
          </AppButton>
        </template>
      </PageHeader>

      <div class="spe-tabs"><AppTabs v-model="tab" :items="tabs"/></div>

      <AppPanel>
        <PromptTextEditor v-if="tab === 'writer'" v-model="ed.draft.value.writer_prompt"/>
        <ProfileFormatRules v-else-if="tab === 'rules'" v-model="ed.draft.value.format_rules" :genres="genres"/>
        <PromptTextEditor v-else-if="tab === 'review'" v-model="ed.draft.value.review_prompt"/>
        <div v-else-if="tab === 'model'" class="spe-model">
          <ProfileModelSettings v-model="ed.draft.value"/>
          <AiProviderKeys/>
        </div>
        <ProfileVersions v-else-if="tab === 'versions'" :versions="profile.versions" :active-id="profile.active_version_id"
                         @view="openVersion" @activate="activate"/>
        <ProfileCompanies v-else-if="tab === 'companies'" :profile-id="profile.id"/>
      </AppPanel>
    </template>

    <SaveVersionModal v-model="saveOpen" :next-version="nextVersion" :on-save="ed.saveVersion" @saved="toast.success(tt('sp.saved'))"/>
    <VersionViewModal v-model="viewOpen" :version="viewed" :loading="viewLoading" :genres="genres"
                      :is-active="viewed?.id === profile?.active_version_id" @activate="activate($event); viewOpen = false"/>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { onBeforeRouteLeave, useRoute } from 'vue-router'
import PageHeader from '@/components/layout/PageHeader.vue'
import AppPanel from '@/components/ui/AppPanel.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppTabs from '@/components/ui/AppTabs.vue'
import PromptTextEditor from '@/components/style-profiles/PromptTextEditor.vue'
import ProfileFormatRules from '@/components/style-profiles/ProfileFormatRules.vue'
import ProfileModelSettings from '@/components/style-profiles/ProfileModelSettings.vue'
import ProfileVersions from '@/components/style-profiles/ProfileVersions.vue'
import ProfileCompanies from '@/components/style-profiles/ProfileCompanies.vue'
import AiProviderKeys from '@/components/admin/AiProviderKeys.vue'
import SaveVersionModal from '@/components/style-profiles/SaveVersionModal.vue'
import VersionViewModal from '@/components/style-profiles/VersionViewModal.vue'
import { styleProfilesApi, articleGenresApi } from '@/api/styleProfiles.js'
import { useStyleProfileEditor } from '@/composables/useStyleProfileEditor.js'
import { useToast } from '@/composables/useToast.js'
import { apiErrorMessage } from '@/utils/apiError.js'
import { formatDateTime } from '@/utils/date.js'
import { useAppStore } from '@/stores/app.js'

const store = useAppStore()
const t = computed(() => store.t)
function tt(key, params) { return t.value(key, params) }
const toast = useToast()
const route = useRoute()

const ed = useStyleProfileEditor(computed(() => route.params.id), () => tt('sp.loadError'))
const profile = computed(() => ed.profile.value)
const genres = ref([])
const tab = ref('writer')
const saveOpen = ref(false)
const viewOpen = ref(false)
const viewed = ref(null)
const viewLoading = ref(false)

const tabs = computed(() => [
  { value: 'writer', label: tt('sp.tabWriter') },
  { value: 'rules', label: tt('sp.tabRules') },
  { value: 'review', label: tt('sp.tabReview') },
  { value: 'model', label: tt('sp.tabModel') },
  { value: 'versions', label: tt('sp.tabVersions'), count: profile.value?.versions?.length },
  { value: 'companies', label: tt('sp.tabCompanies') },
])

const nextVersion = computed(() => Math.max(0, ...(profile.value?.versions || []).map((v) => v.version_no)) + 1)
const subtitle = computed(() => {
  const v = profile.value?.active_version
  if (!v) return tt('sp.noVersion')
  return tt('sp.activeVersion', { n: v.version_no, date: formatDateTime(v.created_at, store.companyOffsetMin) })
})

async function openVersion(id) {
  viewOpen.value = true
  viewLoading.value = true
  try {
    viewed.value = await styleProfilesApi.getVersion(profile.value.id, id)
  } catch (e) {
    toast.error(apiErrorMessage(e, tt('sp.loadError')))
  } finally {
    viewLoading.value = false
  }
}

async function activate(id) {
  if (ed.dirty.value && !window.confirm(tt('sp.confirmDiscard'))) return
  try {
    await ed.activate(id)
    toast.success(tt('sp.activated'))
  } catch (e) {
    toast.error(apiErrorMessage(e, tt('sp.saveError')))
  }
}

// Saqlanmagan o'zgarishlar bilan chiqishda ogohlantirish
function beforeUnload(e) { if (ed.dirty.value) { e.preventDefault(); e.returnValue = '' } }
onBeforeRouteLeave(() => !ed.dirty.value || window.confirm(tt('sp.confirmDiscard')))

onMounted(async () => {
  window.addEventListener('beforeunload', beforeUnload)
  genres.value = await articleGenresApi.list().catch(() => [])
  await ed.load()
})
onBeforeUnmount(() => window.removeEventListener('beforeunload', beforeUnload))
</script>

<style scoped>
.spe { padding: 20px 24px 40px; display: flex; flex-direction: column; gap: 14px; }
.spe-back { display: inline-flex; align-items: center; gap: 4px; font-size: 12.5px; color: var(--muted); text-decoration: none; width: fit-content; }
.spe-back:hover { color: var(--accent); }
.spe-model { display: flex; flex-direction: column; gap: 18px; }
.spe-tabs { overflow-x: auto; padding-bottom: 2px; }
.spe-tabs :deep(button) { white-space: nowrap; }
.spe-muted { padding: 48px; text-align: center; color: var(--muted); font-size: 13px; }
.spe-error { padding: 14px 16px; background: var(--danger-bg); color: var(--danger); font-size: 13px; border-radius: var(--r-sm); }
@media (max-width: 640px) { .spe { padding: 14px 12px 32px; } }
</style>
