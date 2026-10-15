import { computed, ref } from 'vue'

/**
 * limit/offset sahifalash holati. `page` — 0 dan boshlanadi.
 * total — backend qaytargan umumiy son (ref yoki getter).
 */
export function usePagination(pageSize, total) {
  const page = ref(0)
  const totalValue = computed(() => (typeof total === 'function' ? total() : total.value) || 0)
  const totalPages = computed(() => Math.max(1, Math.ceil(totalValue.value / pageSize)))
  const offset = computed(() => page.value * pageSize)
  const rangeStart = computed(() => (totalValue.value ? offset.value + 1 : 0))
  const rangeEnd = computed(() => Math.min(offset.value + pageSize, totalValue.value))

  function goTo(n) {
    page.value = Math.min(Math.max(0, n), totalPages.value - 1)
  }
  function reset() {
    page.value = 0
  }

  return { page, pageSize, offset, totalPages, rangeStart, rangeEnd, goTo, reset }
}
