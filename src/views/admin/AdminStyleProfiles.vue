<template>
  <div class="asp">
    <PageHeader :title="tt('sp.title')" :subtitle="tt('sp.subtitle')">
      <template #right>
        <AppButton variant="primary" size="md" @click="createOpen = true">
          <template #icon><AppIcon name="Plus" :size="13"/></template>{{ tt('sp.add') }}
        </AppButton>
      </template>
    </PageHeader>

    <div v-if="error" class="asp-error"><AppIcon name="Close" :size="12"/> {{ error }}</div>
    <div v-else-if="loading" class="asp-empty">{{ tt('sp.loading') }}</div>
    <div v-else-if="!profiles.length" class="asp-empty">{{ tt('sp.empty') }}</div>
    <div v-else class="asp-grid">
      <RouterLink v-for="p in profiles" :key="p.id" :to="`/admin/style-profiles/${p.id}`" class="asp-card" :class="{ inactive: !p.is_active }">
        <div class="asp-card-head">
          <AppIcon name="Book" :size="18" style="color:var(--accent)"/>
          <span class="asp-name">{{ p.name }}</span>
          <AppBadge v-if="p.active_version_no" tone="success">v{{ p.active_version_no }}</AppBadge>
        </div>
        <div class="asp-desc">{{ p.description || p.slug }}</div>
        <div class="asp-meta">
          <span><AppIcon name="Layers" :size="12"/> {{ tt('sp.versionsCount', { n: p.versions_count }) }}</span>
          <span><AppIcon name="Building" :size="12"/> {{ tt('sp.companiesCount', { n: p.companies_count }) }}</span>
          <span>{{ p.script === 'latn' ? tt('sp.scriptLatn') : tt('sp.scriptCyrl') }}</span>
        </div>
      </RouterLink>
    </div>

    <ProfileCreateModal v-model="createOpen" :profiles="profiles" @created="onCreated"/>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import PageHeader from '@/components/layout/PageHeader.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import ProfileCreateModal from '@/components/style-profiles/ProfileCreateModal.vue'
import { styleProfilesApi } from '@/api/styleProfiles.js'
import { apiErrorMessage } from '@/utils/apiError.js'
import { useAppStore } from '@/stores/app.js'

const store = useAppStore()
const t = computed(() => store.t)
function tt(key, params) { return t.value(key, params) }
const router = useRouter()

const profiles = ref([])
const loading = ref(true)
const error = ref('')
const createOpen = ref(false)

async function load() {
  loading.value = true
  try {
    profiles.value = await styleProfilesApi.list()
  } catch (e) {
    error.value = apiErrorMessage(e, tt('sp.loadError'))
  } finally {
    loading.value = false
  }
}

function onCreated(p) { router.push(`/admin/style-profiles/${p.id}`) }

onMounted(load)
</script>

<style scoped>
.asp { padding: 20px 24px 40px; display: flex; flex-direction: column; gap: 16px; }
.asp-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 14px; }
.asp-card {
  display: flex; flex-direction: column; gap: 8px; padding: 16px; text-decoration: none; color: inherit;
  background: var(--panel); border: 1px solid var(--border); border-radius: var(--r-lg); transition: border-color .12s, box-shadow .12s;
}
.asp-card:hover { border-color: var(--accent); box-shadow: var(--shadow-md); }
.asp-card.inactive { opacity: .6; }
.asp-card-head { display: flex; align-items: center; gap: 10px; }
.asp-name { flex: 1; font-size: 14.5px; font-weight: 600; color: var(--text); }
.asp-desc { font-size: 12.5px; color: var(--muted); line-height: 1.5; }
.asp-meta { display: flex; gap: 14px; flex-wrap: wrap; font-size: 12px; color: var(--text-2); }
.asp-meta span { display: inline-flex; align-items: center; gap: 5px; }
.asp-empty { padding: 48px 16px; text-align: center; color: var(--muted); font-size: 13px; }
.asp-error { padding: 14px 16px; background: var(--danger-bg); color: var(--danger); font-size: 13px; border-radius: var(--r-sm); }
@media (max-width: 640px) { .asp { padding: 14px 12px 32px; } }
</style>
