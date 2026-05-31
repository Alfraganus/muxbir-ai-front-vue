<template>
  <transition name="afl-fade">
    <div v-if="modelValue" class="afl-overlay" role="status" aria-live="polite">
      <div aria-hidden class="afl-bg-orb afl-bg-orb-1"/>
      <div aria-hidden class="afl-bg-orb afl-bg-orb-2"/>
      <div aria-hidden class="afl-bg-orb afl-bg-orb-3"/>
      <div aria-hidden class="afl-bg-grid"/>

      <div class="afl-card">
        <div class="afl-avatar">
          <span class="afl-ring afl-ring-1"/>
          <span class="afl-ring afl-ring-2"/>
          <span class="afl-ring afl-ring-3"/>
          <span class="afl-core">
            <AppIcon name="Sparkle" :size="34"/>
          </span>
        </div>

        <h2 class="afl-title">{{ title }}</h2>
        <p class="afl-sub">{{ subtitle }}</p>

        <ul class="afl-steps">
          <li v-for="(s, i) in steps" :key="i"
              :class="['afl-step', stepStateClass(i)]">
            <span class="afl-step-ic">
              <template v-if="i < activeStep">
                <AppIcon name="Check" :size="12"/>
              </template>
              <template v-else-if="i === activeStep">
                <span class="afl-step-spinner"/>
              </template>
              <template v-else>
                <span class="afl-step-dot"/>
              </template>
            </span>
            <span class="afl-step-text">{{ s }}</span>
          </li>
        </ul>

        <div class="afl-progress">
          <div class="afl-progress-bar"/>
        </div>

        <p class="afl-hint">{{ hint }}</p>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import AppIcon from '@/components/ui/AppIcon.vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  title: { type: String, default: 'AI maqola yozmoqda' },
  subtitle: { type: String, default: 'Bir necha soniya kuting — sahifani yopmang' },
  steps: {
    type: Array,
    default: () => [
      'Havola yuklanmoqda',
      'Matn tahlil qilinmoqda',
      'AI yangi maqola yozmoqda',
      'Editor tayyorlanmoqda',
    ],
  },
  hint: {
    type: String,
    default: 'Bu jarayon odatda 10–40 soniya davom etadi. Sahifani yopmang.',
  },
  stepIntervalMs: { type: Number, default: 4000 },
})

const activeStep = ref(0)
let timer = null

function startTimer() {
  stopTimer()
  activeStep.value = 0
  timer = setInterval(() => {
    if (activeStep.value < props.steps.length - 1) {
      activeStep.value++
    }
  }, props.stepIntervalMs)
}
function stopTimer() {
  if (timer) { clearInterval(timer); timer = null }
}

watch(() => props.modelValue, (v) => {
  if (v) startTimer()
  else stopTimer()
}, { immediate: true })

onBeforeUnmount(stopTimer)

function stepStateClass(i) {
  if (i < activeStep.value) return 'done'
  if (i === activeStep.value) return 'active'
  return 'pending'
}
</script>

<style scoped>
.afl-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: radial-gradient(circle at 30% 20%, rgba(99, 102, 241, 0.18), transparent 55%),
              radial-gradient(circle at 75% 80%, rgba(236, 72, 153, 0.16), transparent 55%),
              rgba(15, 23, 42, 0.72);
  backdrop-filter: blur(14px) saturate(140%);
  -webkit-backdrop-filter: blur(14px) saturate(140%);
  overflow: hidden;
}

/* Decorative background */
.afl-bg-orb {
  position: absolute;
  border-radius: 999px;
  filter: blur(60px);
  opacity: 0.55;
  pointer-events: none;
}
.afl-bg-orb-1 { width: 360px; height: 360px; top: -80px; left: -80px;
  background: radial-gradient(circle, #6366f1, transparent 70%);
  animation: afl-float 9s ease-in-out infinite; }
.afl-bg-orb-2 { width: 420px; height: 420px; bottom: -120px; right: -100px;
  background: radial-gradient(circle, #ec4899, transparent 70%);
  animation: afl-float 11s ease-in-out infinite reverse; }
.afl-bg-orb-3 { width: 300px; height: 300px; top: 40%; left: 50%; transform: translate(-50%,-50%);
  background: radial-gradient(circle, #22d3ee, transparent 70%);
  opacity: 0.35;
  animation: afl-float 13s ease-in-out infinite; }
.afl-bg-grid {
  position: absolute; inset: 0;
  background-image: linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px);
  background-size: 36px 36px;
  mask-image: radial-gradient(circle at center, black 40%, transparent 80%);
  pointer-events: none;
}

@keyframes afl-float {
  0%, 100% { transform: translate(0,0); }
  50% { transform: translate(30px, -20px); }
}

/* Card */
.afl-card {
  position: relative;
  width: min(440px, 100%);
  padding: 36px 32px 28px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.97);
  box-shadow: 0 30px 80px -20px rgba(15, 23, 42, 0.55),
              0 0 0 1px rgba(255, 255, 255, 0.6) inset;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 14px;
}
@media (prefers-color-scheme: dark) {
  .afl-card {
    background: rgba(20, 24, 38, 0.97);
    box-shadow: 0 30px 80px -20px rgba(0, 0, 0, 0.7),
                0 0 0 1px rgba(255, 255, 255, 0.06) inset;
  }
}

/* Animated avatar */
.afl-avatar {
  position: relative;
  width: 96px;
  height: 96px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 4px;
}
.afl-ring {
  position: absolute;
  inset: 0;
  border-radius: 999px;
  border: 2px solid transparent;
  border-top-color: #6366f1;
  border-right-color: #ec4899;
}
.afl-ring-1 { animation: afl-spin 1.8s linear infinite; }
.afl-ring-2 { inset: 10px; border-top-color: #ec4899; border-right-color: transparent;
              border-bottom-color: #22d3ee; animation: afl-spin 2.6s linear infinite reverse; }
.afl-ring-3 { inset: 22px; border-top-color: transparent; border-right-color: #22d3ee;
              border-left-color: #6366f1; animation: afl-spin 1.4s linear infinite; }
.afl-core {
  position: relative;
  width: 52px; height: 52px;
  border-radius: 999px;
  display: inline-flex; align-items: center; justify-content: center;
  background: linear-gradient(135deg, #6366f1, #ec4899);
  color: #fff;
  box-shadow: 0 0 30px rgba(99, 102, 241, 0.55);
  animation: afl-pulse 1.6s ease-in-out infinite;
}
@keyframes afl-spin { to { transform: rotate(360deg); } }
@keyframes afl-pulse {
  0%, 100% { transform: scale(1); box-shadow: 0 0 30px rgba(99,102,241,0.55); }
  50% { transform: scale(1.08); box-shadow: 0 0 40px rgba(236,72,153,0.7); }
}

/* Typography */
.afl-title {
  margin: 0;
  font-size: 19px;
  font-weight: 700;
  letter-spacing: -0.01em;
  color: var(--text, #0f172a);
  background: linear-gradient(135deg, #6366f1, #ec4899);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}
.afl-sub {
  margin: 0;
  font-size: 13px;
  color: var(--muted, #64748b);
  line-height: 1.5;
  max-width: 320px;
}

/* Steps */
.afl-steps {
  list-style: none;
  margin: 8px 0 4px;
  padding: 0;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
  text-align: left;
}
.afl-step {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 12px;
  border-radius: 9px;
  font-size: 12.5px;
  font-weight: 500;
  border: 1px solid transparent;
  transition: all .25s;
}
.afl-step.done {
  color: var(--text, #0f172a);
  background: rgba(34, 197, 94, 0.08);
  border-color: rgba(34, 197, 94, 0.18);
}
.afl-step.active {
  color: var(--text, #0f172a);
  background: rgba(99, 102, 241, 0.10);
  border-color: rgba(99, 102, 241, 0.28);
  font-weight: 600;
}
.afl-step.pending {
  color: var(--muted, #94a3b8);
  background: transparent;
}

.afl-step-ic {
  flex-shrink: 0;
  width: 18px;
  height: 18px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
}
.afl-step.done .afl-step-ic { background: #22c55e; color: #fff; }
.afl-step.active .afl-step-ic { background: transparent; }
.afl-step-spinner {
  width: 14px; height: 14px;
  border-radius: 999px;
  border: 2px solid rgba(99,102,241,0.25);
  border-top-color: #6366f1;
  animation: afl-spin 0.8s linear infinite;
}
.afl-step-dot {
  width: 6px; height: 6px; border-radius: 999px;
  background: currentColor;
  opacity: 0.4;
}
.afl-step-text { flex: 1; }

/* Indeterminate progress shimmer */
.afl-progress {
  width: 100%;
  height: 4px;
  border-radius: 999px;
  background: rgba(99, 102, 241, 0.10);
  overflow: hidden;
  margin-top: 4px;
}
.afl-progress-bar {
  width: 40%;
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, #6366f1, #ec4899, #22d3ee, #6366f1);
  background-size: 300% 100%;
  animation: afl-bar 1.6s ease-in-out infinite, afl-bar-bg 3s linear infinite;
}
@keyframes afl-bar {
  0% { transform: translateX(-110%); }
  100% { transform: translateX(310%); }
}
@keyframes afl-bar-bg {
  to { background-position: 300% 0; }
}

.afl-hint {
  margin: 4px 0 0;
  font-size: 11.5px;
  color: var(--muted, #94a3b8);
  line-height: 1.5;
}

/* Transition */
.afl-fade-enter-active, .afl-fade-leave-active {
  transition: opacity .25s ease;
}
.afl-fade-enter-active .afl-card, .afl-fade-leave-active .afl-card {
  transition: transform .3s cubic-bezier(.2,.9,.3,1.2), opacity .25s;
}
.afl-fade-enter-from, .afl-fade-leave-to { opacity: 0; }
.afl-fade-enter-from .afl-card { transform: scale(0.92) translateY(8px); opacity: 0; }
.afl-fade-leave-to .afl-card   { transform: scale(0.96); opacity: 0; }
</style>
