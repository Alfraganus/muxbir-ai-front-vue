// Workspace vaqt mintaqasi composable'i.
//
// Global holatdan (app store) joriy kompaniya UTC offset'ini reaktiv o'qiydi va
// `src/utils/timezone.js` toza funksiyalarini shu offset'ga bog'lab qaytaradi.
// Komponentlar offset minutni qo'lda uzatmasligi uchun qulay o'rama.

import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useAppStore } from '@/stores/app.js'
import {
  offsetLabel as _offsetLabel,
  utcToWall as _utcToWall,
  wallToUtcISO as _wallToUtcISO,
  nowWallParts as _nowWallParts,
} from '@/utils/timezone.js'

export function useTimezone() {
  const store = useAppStore()
  const { companyOffsetMin } = storeToRefs(store)

  const offsetMin = computed(() => companyOffsetMin.value)
  const label = computed(() => _offsetLabel(companyOffsetMin.value))

  return {
    offsetMin,
    label,
    /** Haqiqiy UTC moment → 'YYYY-MM-DDTHH:MM' (offset ichida). */
    utcToWall: (utc) => _utcToWall(utc, companyOffsetMin.value),
    /** 'YYYY-MM-DDTHH:MM' (offset ichida) → UTC ISO. */
    wallToUtcISO: (wall) => _wallToUtcISO(wall, companyOffsetMin.value),
    /** Hozirgi vaqt offset ichidagi devor-komponentlari. */
    nowWallParts: () => _nowWallParts(companyOffsetMin.value),
  }
}
