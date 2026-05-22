import { ref } from 'vue'

const toasts = ref([])
let idCounter = 0

export function useToast() {
  function show(message, tone = 'info', duration = 3500) {
    const id = ++idCounter
    toasts.value.push({ id, message, tone })
    setTimeout(() => {
      const i = toasts.value.findIndex(t => t.id === id)
      if (i > -1) toasts.value.splice(i, 1)
    }, duration)
  }
  return {
    toasts,
    success: (msg) => show(msg, 'success'),
    error: (msg) => show(msg, 'error'),
    info: (msg) => show(msg, 'info'),
  }
}
