<template>
  <header style="height:56px;border-bottom:1px solid var(--border);display:flex;align-items:center;padding:0 24px;gap:12px;background:var(--bg);position:sticky;top:0;z-index:30;backdrop-filter:blur(8px);">
    <!-- Breadcrumb -->
    <div style="display:flex;align-items:center;gap:10px;min-width:0;">
      <template v-for="(b, i) in breadcrumb" :key="i">
        <span :style="{ fontSize:'13px', color: i === breadcrumb.length-1 ? 'var(--text)' : 'var(--muted)', fontWeight: i === breadcrumb.length-1 ? '600' : '500' }">{{ b }}</span>
        <AppIcon v-if="i < breadcrumb.length-1" name="ChevronR" :size="12" :style="{ color:'var(--muted-2)' }" />
      </template>
    </div>

    <div style="flex:1;" />

    <!-- Search -->
    <div style="display:flex;align-items:center;gap:8px;width:280px;height:30px;padding:0 10px;background:var(--panel);border:1px solid var(--border);border-radius:6px;">
      <AppIcon name="Search" :size="14" :style="{ color:'var(--muted)' }" />
      <input :placeholder="store.t('common.search')" style="flex:1;border:none;outline:none;background:transparent;font-size:12.5px;color:var(--text);" />
      <span class="mono" style="font-size:10px;padding:1px 4px;border-radius:3px;background:var(--panel-2);color:var(--muted);border:1px solid var(--border);">⌘K</span>
    </div>

    <!-- Lang switcher -->
    <LangSwitcher />

    <!-- Notifications -->
    <button style="width:30px;height:30px;border-radius:6px;background:transparent;border:1px solid var(--border);color:var(--text-2);position:relative;display:inline-flex;align-items:center;justify-content:center;cursor:pointer;">
      <AppIcon name="Bell" :size="14" />
      <span style="position:absolute;top:6px;right:6px;width:6px;height:6px;border-radius:999px;background:var(--danger);border:1.5px solid var(--bg);" />
    </button>

    <!-- Action slot -->
    <slot name="action" />

    <!-- Avatar with dropdown -->
    <div class="topbar-user" v-click-outside="() => (menuOpen = false)">
      <button class="topbar-user-btn" @click="menuOpen = !menuOpen">
        <AppAvatar :name="displayName" :size="26" />
        <AppIcon name="ChevronR" :size="11" :style="{ color:'var(--muted)', transform: menuOpen ? 'rotate(90deg)' : 'rotate(90deg)', transition: 'transform 0.2s' }" />
      </button>

      <Transition name="menu">
        <div v-if="menuOpen" class="topbar-menu">
          <div class="topbar-menu-head">
            <AppAvatar :name="displayName" :size="34" />
            <div style="display:flex;flex-direction:column;min-width:0;">
              <span class="topbar-menu-name">{{ displayName }}</span>
              <span class="topbar-menu-email">{{ displayEmail }}</span>
            </div>
          </div>
          <div class="topbar-menu-sep" />
          <button class="topbar-menu-item" @click="onLogout">
            <AppIcon name="Close" :size="13" />
            <span>{{ store.t('topbar.logout') }}</span>
          </button>
        </div>
      </Transition>
    </div>
  </header>

  <!-- Logout splash overlay -->
  <Transition name="logout-fade">
    <div v-if="showLogoutSplash" class="logout-overlay">
      <div aria-hidden class="logout-dots"/>
      <div class="logout-inner">
        <div class="logout-logo">
          <AppIcon name="Sparkle" :size="22" />
        </div>
        <div class="logout-text">{{ store.t('topbar.logoutSplash') }}</div>
        <div class="logout-bar"><span class="logout-bar-fill"/></div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import AppIcon from '@/components/ui/AppIcon.vue'
import AppAvatar from '@/components/ui/AppAvatar.vue'
import LangSwitcher from './LangSwitcher.vue'
import { useAppStore } from '@/stores/app.js'
import { useAuthStore } from '@/stores/auth.js'

defineProps({ breadcrumb: Array })
const store = useAppStore()
const authStore = useAuthStore()
const router = useRouter()

const menuOpen = ref(false)
const showLogoutSplash = ref(false)

const displayName = computed(() => {
  const u = authStore.user
  return u?.full_name || u?.fullName || u?.name || u?.email || 'Foydalanuvchi'
})
const displayEmail = computed(() => authStore.user?.email || '')

async function onLogout() {
  menuOpen.value = false
  showLogoutSplash.value = true
  try { await authStore.logout() } catch {}
  await new Promise((r) => setTimeout(r, 1200))
  router.push('/signin')
}

const vClickOutside = {
  mounted(el, binding) {
    el._handler = (e) => { if (!el.contains(e.target)) binding.value() }
    document.addEventListener('mousedown', el._handler)
  },
  unmounted(el) {
    document.removeEventListener('mousedown', el._handler)
  },
}
</script>

<style scoped>
.topbar-user { position: relative; }
.topbar-user-btn {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 2px 6px 2px 2px;
  background: transparent; border: 1px solid transparent;
  border-radius: 999px; cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
}
.topbar-user-btn:hover {
  background: var(--panel);
  border-color: var(--border);
}

.topbar-menu {
  position: absolute; top: calc(100% + 8px); right: 0;
  min-width: 240px;
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: 10px;
  box-shadow: 0 20px 60px -20px rgba(15,23,42,0.25), 0 4px 12px -4px rgba(15,23,42,0.1);
  padding: 8px;
  z-index: 50;
}
.topbar-menu-head {
  display: flex; align-items: center; gap: 10px;
  padding: 8px 10px 10px;
}
.topbar-menu-name {
  font-size: 13px; font-weight: 600; color: var(--text);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.topbar-menu-email {
  font-size: 11.5px; color: var(--muted);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.topbar-menu-sep {
  height: 1px; background: var(--border);
  margin: 4px -8px 6px;
}
.topbar-menu-item {
  display: flex; align-items: center; gap: 10px;
  width: 100%; padding: 8px 10px;
  background: transparent; border: none;
  border-radius: 6px;
  font-size: 12.5px; color: var(--text);
  cursor: pointer; text-align: left;
}
.topbar-menu-item:hover {
  background: var(--danger-bg);
  color: var(--danger);
}

.menu-enter-active, .menu-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}
.menu-enter-from, .menu-leave-to {
  opacity: 0; transform: translateY(-4px) scale(0.98);
}

/* Logout overlay */
.logout-overlay {
  position: fixed; inset: 0; z-index: 9999;
  display: flex; align-items: center; justify-content: center;
  background: linear-gradient(155deg, #0b1430 0%, #1a1f3a 100%);
  color: white;
  overflow: hidden;
}
.logout-dots {
  position: absolute; inset: 0;
  background-image: radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px);
  background-size: 22px 22px;
  mask-image: radial-gradient(ellipse 60% 60% at 50% 50%, black 30%, transparent 80%);
  -webkit-mask-image: radial-gradient(ellipse 60% 60% at 50% 50%, black 30%, transparent 80%);
}
.logout-inner {
  position: relative;
  display: flex; flex-direction: column; align-items: center; gap: 18px;
  animation: logoutFloat 0.6s ease-out;
}
@keyframes logoutFloat {
  0%   { opacity: 0; transform: translateY(8px) scale(0.96); }
  100% { opacity: 1; transform: translateY(0) scale(1); }
}
.logout-logo {
  width: 56px; height: 56px; border-radius: 16px;
  background: rgba(255,255,255,0.10);
  border: 1px solid rgba(255,255,255,0.20);
  display: inline-flex; align-items: center; justify-content: center;
  backdrop-filter: blur(10px);
  animation: logoutLogoSpin 1.5s linear infinite;
}
@keyframes logoutLogoSpin {
  0%   { transform: rotate(0); opacity: 0.9; }
  50%  { opacity: 1; }
  100% { transform: rotate(360deg); opacity: 0.9; }
}
.logout-text {
  font-size: 15px; font-weight: 500;
  color: rgba(255,255,255,0.92);
}
.logout-bar {
  width: 140px; height: 2.5px; border-radius: 999px;
  background: rgba(255,255,255,0.12); overflow: hidden;
}
.logout-bar-fill {
  display: block; height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.85), transparent);
  animation: logoutBar 1s ease-in-out infinite;
}
@keyframes logoutBar {
  0%   { transform: translateX(-100%); }
  100% { transform: translateX(280%); }
}
.logout-fade-enter-active, .logout-fade-leave-active {
  transition: opacity 0.3s ease;
}
.logout-fade-enter-from, .logout-fade-leave-to { opacity: 0; }
</style>
