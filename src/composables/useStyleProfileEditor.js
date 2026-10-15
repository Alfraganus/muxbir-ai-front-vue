import { computed, ref } from 'vue'
import { styleProfilesApi } from '@/api/styleProfiles.js'
import { VERSION_FIELDS } from '@/config/aiProviders.js'
import { apiErrorMessage } from '@/utils/apiError.js'

function pickVersion(v) {
  const out = {}
  for (const k of VERSION_FIELDS) out[k] = v?.[k] ?? null
  out.format_rules = { ...(v?.format_rules || {}) }
  out.temperature = v?.temperature ?? 0.3
  out.writer_provider = v?.writer_provider || 'gemini'
  out.review_provider = v?.review_provider || 'gemini'
  return out
}

/**
 * Uslub profili tahriri: faol versiyadan qoralama (draft) nusxa, o'zgarganini
 * kuzatish va yangi versiya sifatida saqlash.
 */
export function useStyleProfileEditor(profileId, errorFallback) {
  const profile = ref(null)
  const draft = ref(pickVersion(null))
  const baseline = ref('')
  const loading = ref(false)
  const saving = ref(false)
  const error = ref('')

  const dirty = computed(() => JSON.stringify(draft.value) !== baseline.value)

  function resetDraft() {
    draft.value = pickVersion(profile.value?.active_version)
    baseline.value = JSON.stringify(draft.value)
  }

  async function load() {
    loading.value = true
    error.value = ''
    try {
      profile.value = await styleProfilesApi.get(profileId.value)
      resetDraft()
    } catch (e) {
      error.value = apiErrorMessage(e, errorFallback())
    } finally {
      loading.value = false
    }
  }

  /** Joriy qoralamani yangi versiya sifatida saqlaydi. */
  async function saveVersion({ note, activate }) {
    saving.value = true
    try {
      const payload = { ...draft.value, note: note || undefined, activate }
      if (!payload.writer_model) payload.writer_model = null
      if (!payload.review_model) payload.review_model = null
      await styleProfilesApi.createVersion(profileId.value, payload)
      await load()
    } finally {
      saving.value = false
    }
  }

  async function activate(versionId) {
    profile.value = await styleProfilesApi.activateVersion(profileId.value, versionId)
    resetDraft()
  }

  return { profile, draft, dirty, loading, saving, error, load, resetDraft, saveVersion, activate }
}
