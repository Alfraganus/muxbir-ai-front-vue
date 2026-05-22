<template>
  <Transition name="welcome">
    <div v-if="showWelcome || showSignupSplash" class="welcome-overlay">
      <div aria-hidden class="welcome-dots"/>
      <div aria-hidden class="welcome-glow"/>
      <div class="welcome-inner">
        <div class="welcome-logo">
          <AppIcon :name="showSignupSplash ? 'Users' : 'Sparkle'" :size="28"/>
        </div>
        <div class="welcome-rings">
          <span class="welcome-ring r1"/>
          <span class="welcome-ring r2"/>
          <span class="welcome-ring r3"/>
        </div>
        <div class="welcome-text">
          <h1 class="welcome-title">{{ showSignupSplash ? t('signin.signup.title') : t('signin.welcome.title') }}</h1>
          <p class="welcome-sub">{{ showSignupSplash ? t('signin.signup.sub') : t('signin.welcome.sub') }}</p>
        </div>
        <div class="welcome-bar"><span class="welcome-bar-fill"/></div>
      </div>
    </div>
  </Transition>

  <div class="signin-root">
    <!-- Left — brand canvas -->
    <aside class="signin-hero">
      <div aria-hidden class="signin-hero-dots"/>
      <div aria-hidden class="signin-hero-glow"/>

      <div class="signin-hero-brand">
        <div class="signin-hero-logo">
          <AppIcon name="Sparkle" :size="14"/>
        </div>
        <span style="font-size:14px;font-weight:600;letter-spacing:-0.01em;">Muxbir AI</span>
        <span class="signin-hero-pill">Console v2.4</span>
      </div>

      <div style="position:relative;display:flex;flex-direction:column;gap:24px;">
        <h1 class="signin-hero-title">{{ t('signin.hero.title') }}</h1>
        <p class="signin-hero-sub">{{ t('signin.hero.sub') }}</p>

        <!-- Live feed preview -->
        <div class="signin-feed">
          <div class="signin-feed-head">
            <div style="display:flex;align-items:center;gap:6px;font-size:11px;font-weight:500;">
              <span class="signin-feed-pulse"/>
              {{ t('signin.hero.live') }}
            </div>
            <span class="mono" style="font-size:10.5px;color:rgba(255,255,255,0.55);">auto · 12s</span>
          </div>
          <div style="display:flex;flex-direction:column;gap:6px;">
            <div v-for="(it, i) in feedItems" :key="i" class="signin-feed-item">
              <span class="signin-feed-avatar" :style="{ background: `oklch(0.7 0.14 ${i * 80 + 30})` }">{{ it.ch[0] }}</span>
              <div style="flex:1;min-width:0;">
                <div class="signin-feed-meta">
                  <span style="font-weight:500;color:rgba(255,255,255,0.92);">{{ it.ch }}</span>
                  <span>·</span>
                  <span>{{ it.tag }}</span>
                </div>
                <div class="signin-feed-title">{{ it.title }}</div>
              </div>
              <span class="signin-feed-tag" :class="it.ok ? 'ok' : 'warn'">
                {{ it.ok ? 'Joylandi' : 'Tahrirlanmoqda' }}
              </span>
              <span style="font-size:10.5px;color:rgba(255,255,255,0.5);white-space:nowrap;">{{ it.time }}</span>
            </div>
          </div>
        </div>

        <!-- Stats strip -->
        <div class="signin-stats">
          <div v-for="(s, i) in stats" :key="i" class="signin-stat" :class="{ 'with-border': i > 0 }">
            <div class="tabular" style="font-size:22px;font-weight:600;letter-spacing:-0.02em;">{{ t(s.vKey) }}</div>
            <div style="font-size:11.5px;color:rgba(255,255,255,0.7);">{{ t(s.lKey) }}</div>
          </div>
        </div>
      </div>

      <div class="signin-hero-foot">
        <div style="display:flex;">
          <span v-for="(n, i) in avatars" :key="i" class="signin-hero-avatar"
            :style="{ background: `oklch(0.75 0.12 ${i * 60})`, marginLeft: i ? '-6px' : 0 }">{{ n }}</span>
        </div>
        <span>{{ t('signin.hero.clients') }}</span>
      </div>
    </aside>

    <!-- Right — sign-in form -->
    <section class="signin-form-wrap">
      <div aria-hidden class="signin-form-dots"/>
      <div aria-hidden class="signin-form-glow-1"/>
      <div aria-hidden class="signin-form-glow-2"/>

      <header class="signin-header">
        <div class="signin-status">
          <span class="signin-status-dot">
            <span class="signin-status-dot-inner"/>
            <span class="signin-status-dot-pulse"/>
          </span>
          {{ t('signin.status') }}
        </div>
        <div style="display:flex;align-items:center;gap:12px;">
          <span style="font-size:12px;color:var(--muted);">{{ t('signin.newAccount') }}</span>
          <AppButton variant="secondary" size="md" @click="goToSignup">
            {{ t('signin.register') }}
            <template #icon-right><AppIcon name="ChevronR" :size="12"/></template>
          </AppButton>
          <LangSwitcher/>
        </div>
      </header>

      <div class="signin-center">
        <div class="signin-card">
          <div aria-hidden class="signin-card-accent"/>

          <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px;">
            <span class="signin-card-icon">
              <AppIcon name="Shield" :size="15"/>
            </span>
            <div style="display:flex;flex-direction:column;">
              <h2 style="font-size:20px;font-weight:600;letter-spacing:-0.022em;margin:0;">
                {{ t('signin.title') }}
              </h2>
              <span style="font-size:11.5px;color:var(--muted);">
                {{ t('signin.subtitle') }}
              </span>
            </div>
          </div>

          <!-- Method tabs -->
          <div class="signin-tabs">
            <button v-for="m in methods" :key="m.id"
              @click="method = m.id"
              class="signin-tab" :class="{ active: method === m.id }">
              <AppIcon :name="m.icon" :size="12"/>
              {{ t(m.labelKey) }}
            </button>
          </div>

          <!-- Error banner -->
          <div v-if="error" class="signin-error">
            <AppIcon name="Close" :size="12" style="flex-shrink:0;"/>
            {{ error }}
          </div>

          <!-- Password method -->
          <div v-if="method === 'password'" style="display:flex;flex-direction:column;gap:12px;">
            <div class="signin-field">
              <label class="signin-field-label">{{ t('signin.email') }}</label>
              <AppInput v-model="email" :placeholder="t('signin.emailPlaceholder')" type="email">
                <template #icon><AppIcon name="Globe" :size="12" style="color:var(--muted);"/></template>
              </AppInput>
            </div>
            <div class="signin-field">
              <label class="signin-field-label" style="display:flex;justify-content:space-between;">
                <span>{{ t('signin.password') }}</span>
                <a class="signin-link" @click.prevent>{{ t('signin.forgotPassword') }}</a>
              </label>
              <AppInput v-model="password" :type="showPw ? 'text' : 'password'" placeholder="••••••••••••">
                <template #suffix>
                  <button @click="showPw = !showPw" class="signin-eye">
                    <AppIcon name="Eye" :size="13"/>
                  </button>
                </template>
              </AppInput>
            </div>
            <label style="display:flex;align-items:center;gap:8px;font-size:12px;color:var(--text-2);margin-top:2px;">
              <input type="checkbox" v-model="remember" style="accent-color:var(--accent);"/>
              <span>{{ t('signin.rememberMe') }}</span>
            </label>
            <AppButton variant="primary" size="lg" :loading="loading" :style="{ width: '100%', marginTop: '6px', justifyContent: 'center' }" @click="onLogin">
              {{ t('signin.loginBtn') }}
              <template #icon-right><AppIcon name="Arrow" :size="14"/></template>
            </AppButton>
          </div>

          <!-- Magic link method -->
          <div v-else-if="method === 'magic'" style="display:flex;flex-direction:column;gap:12px;">
            <template v-if="!magicSent">
              <div class="signin-field">
                <label class="signin-field-label">{{ t('signin.email') }}</label>
                <AppInput v-model="email" :placeholder="t('signin.emailPlaceholder')" type="email"/>
                <span class="signin-field-hint">{{ t('signin.magicHint') }}</span>
              </div>
              <div class="signin-magic-note">
                <AppIcon name="Sparkle" :size="14" style="color:var(--accent);flex-shrink:0;margin-top:1px;"/>
                <div style="font-size:11.5px;color:var(--text-2);line-height:1.5;">
                  {{ t('signin.magicNote') }}
                </div>
              </div>
              <AppButton variant="primary" size="lg" :loading="loading" :style="{ width: '100%', marginTop: '6px', justifyContent: 'center' }" @click="onSendMagicLink">
                {{ t('signin.sendLink') }}
                <template #icon-right><AppIcon name="Arrow" :size="14"/></template>
              </AppButton>
            </template>
            <div v-else class="signin-magic-sent">
              <AppIcon name="Check" :size="20" style="color:var(--success);"/>
              <div>
                <div style="font-weight:600;font-size:13px;margin-bottom:2px;">{{ t('signin.magicSentTitle') }}</div>
                <div style="font-size:12px;color:var(--muted);">
                  <strong>{{ email }}</strong> {{ t('signin.magicSentBody') }}
                </div>
              </div>
            </div>
          </div>

          <!-- Divider -->
          <div class="signin-divider">
            <div class="signin-divider-line"/>
            <span>{{ t('signin.orQuick') }}</span>
            <div class="signin-divider-line"/>
          </div>

          <!-- OAuth row -->
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
            <AppButton variant="secondary" size="lg" :style="{ justifyContent: 'center' }" @click="onTelegramClick">
              <template #icon><AppIcon name="Telegram" :size="14" style="color:#229ED9;"/></template>
              Telegram
            </AppButton>
            <AppButton variant="secondary" size="lg" :style="{ justifyContent: 'center' }">
              <template #icon>
                <svg width="14" height="14" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.5l6.7-6.7C35.6 2.4 30.2 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.5 13.3 17.7 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.9 24.5c0-1.6-.2-3.2-.5-4.7H24v9h12.9c-.6 3-2.3 5.5-4.9 7.2l7.5 5.8c4.4-4.1 6.9-10.1 6.9-17.3z"/>
                  <path fill="#FBBC05" d="M10.5 28.7c-.5-1.4-.8-2.9-.8-4.7s.3-3.3.8-4.7l-7.9-6.1C1 16.4 0 20.1 0 24c0 3.9 1 7.6 2.6 10.8l7.9-6.1z"/>
                  <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.8 2.3-8.4 2.3-6.3 0-11.5-3.8-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z"/>
                </svg>
              </template>
              Google
            </AppButton>
          </div>
        </div>

        <!-- Trust strip -->
        <div class="signin-trust">
          <span><AppIcon name="Shield" :size="11"/> {{ t('signin.trust.soc2') }}</span>
          <span class="signin-trust-dot"/>
          <span><AppIcon name="Server" :size="11"/> {{ t('signin.trust.dc') }}</span>
          <span class="signin-trust-dot"/>
          <span><AppIcon name="Check" :size="11"/> {{ t('signin.trust.uptime') }}</span>
        </div>

        <p class="signin-terms">
          {{ t('signin.terms') }} <a>{{ t('signin.termsLink') }}</a> {{ t('signin.and') }} <a>{{ t('signin.privacyLink') }}</a>{{ t('signin.termsEnd') }}
        </p>
      </div>

      <footer class="signin-footer">
        <span>{{ t('signin.footer.copyright') }}</span>
        <div style="display:flex;gap:14px;">
          <a>{{ t('signin.footer.help') }}</a>
          <a>{{ t('signin.footer.status') }}</a>
          <a>{{ t('signin.footer.api') }}</a>
        </div>
      </footer>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import AppButton from '@/components/ui/AppButton.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import LangSwitcher from '@/components/layout/LangSwitcher.vue'
import { authApi } from '@/api/auth.js'
import { resolveRole, homePathForRole } from '@/utils/authRole.js'
import { DICT } from '@/i18n/index.js'
import { useAppStore } from '@/stores/app.js'
import { useAuthStore } from '@/stores/auth.js'

const router = useRouter()
const appStore = useAppStore()
const authStore = useAuthStore()
const { lang } = storeToRefs(appStore)
// t is a reactive function — accessing lang.value inside tracks reactivity
const t = (key) => (DICT[lang.value]?.[key]) ?? DICT.uz[key] ?? key

const method = ref('password')
const showPw = ref(false)
const email = ref('')
const password = ref('')
const remember = ref(true)
const loading = ref(false)
const error = ref('')
const magicSent = ref(false)
const showWelcome = ref(false)
const showSignupSplash = ref(false)

async function goToSignup() {
  showSignupSplash.value = true
  await new Promise((r) => setTimeout(r, 1200))
  router.push('/signup')
}

const methods = [
  { id: 'password', labelKey: 'signin.methodPassword', icon: 'Shield' },
  { id: 'magic',    labelKey: 'signin.methodMagic',    icon: 'Sparkle' },
]

const stats = [
  { vKey: 'signin.hero.stat1v', lKey: 'signin.hero.stat1l' },
  { vKey: 'signin.hero.stat2v', lKey: 'signin.hero.stat2l' },
  { vKey: 'signin.hero.stat3v', lKey: 'signin.hero.stat3l' },
]

const avatars = ['AL', 'MK', 'RZ', 'SH']

const feedItems = [
  { ch: 'Daryo.uz',      tag: 'Yangiliklar',   title: "Toshkentda yangi metro stansiyasi ochildi", time: '2 daq', ok: true },
  { ch: 'Olcha Express', tag: 'E-commerce',    title: 'Black Friday — bugun kechki soat 22:00',    time: '5 daq', ok: true },
  { ch: 'Sport.uz',      tag: "Ko'ngil ochar", title: "Pakhtakor — Bunyodkor o'yini natijasi",     time: '8 daq', ok: false },
]

async function onLogin() {
  error.value = ''
  if (!email.value) { error.value = t('signin.err.noEmail'); return }
  if (!password.value) { error.value = t('signin.err.noPassword'); return }
  loading.value = true
  try {
    const data = await authApi.login({ email: email.value, password: password.value })
    authStore.setTokens(data)
    const target = homePathForRole(resolveRole(data.user))
    console.log('[signin] login response:', data, 'target:', target)
    showWelcome.value = true
    await new Promise((r) => setTimeout(r, 1600))
    showWelcome.value = false
    await router.push(target)
  } catch (e) {
    const status = e?.response?.status
    const code = e?.response?.data?.code
    if (status === 403 && code === 'ONBOARDING_INCOMPLETE') {
      error.value = t('signin.err.onboardingIncomplete')
      showSignupSplash.value = true
      await new Promise((r) => setTimeout(r, 1200))
      router.push('/signup')
      return
    }
    error.value = status === 401
      ? t('signin.err.invalid')
      : t('signin.err.generic')
  } finally {
    loading.value = false
  }
}

function onTelegramClick() {
  if (!window.Telegram?.Login) {
    error.value = t('signin.err.telegramNotReady')
    return
  }
  window.Telegram.Login.auth(
    { bot_id: import.meta.env.VITE_TELEGRAM_BOT_ID, request_access: true },
    async (data) => {
      if (!data) return
      error.value = ''
      loading.value = true
      try {
        const res = await authApi.telegramAuth(data)
        authStore.setTokens(res)
        const target = homePathForRole(resolveRole(res.user))
        showWelcome.value = true
        await new Promise((r) => setTimeout(r, 1600))
        showWelcome.value = false
        await router.push(target)
      } catch {
        error.value = t('signin.err.generic')
      } finally {
        loading.value = false
      }
    },
  )
}

onMounted(() => {
  const script = document.createElement('script')
  script.src = 'https://telegram.org/js/telegram-widget.js?22'
  script.async = true
  document.head.appendChild(script)
  onUnmounted(() => script.remove())
})

async function onSendMagicLink() {
  error.value = ''
  if (!email.value) { error.value = t('signin.err.noEmail'); return }
  loading.value = true
  try {
    await authApi.sendMagicLink(email.value)
    magicSent.value = true
  } catch (e) {
    const status = e?.response?.status
    const code = e?.response?.data?.code
    if (status === 403 && code === 'ONBOARDING_INCOMPLETE') {
      error.value = t('signin.err.onboardingIncomplete')
      showSignupSplash.value = true
      await new Promise((r) => setTimeout(r, 1200))
      router.push('/signup')
      return
    }
    error.value = status === 404
      ? t('signin.err.notRegistered')
      : t('signin.err.generic')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.signin-root {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 1.05fr 1fr;
  background: var(--bg);
}

/* ── Hero (left) ─────────────────────────────────────────────── */
.signin-hero {
  position: relative;
  background: linear-gradient(155deg,
    color-mix(in oklab, var(--accent) 92%, black) 0%,
    color-mix(in oklab, var(--accent) 70%, #111) 55%,
    #0b1430 100%);
  color: white;
  padding: 40px 56px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  overflow: hidden;
}
.signin-hero-dots {
  position: absolute; inset: 0;
  background-image: radial-gradient(rgba(255,255,255,0.10) 1px, transparent 1px);
  background-size: 22px 22px;
  mask-image: radial-gradient(ellipse 80% 60% at 30% 30%, black 30%, transparent 75%);
  -webkit-mask-image: radial-gradient(ellipse 80% 60% at 30% 30%, black 30%, transparent 75%);
}
.signin-hero-glow {
  position: absolute; top: -120px; right: -120px;
  width: 480px; height: 480px; border-radius: 999px;
  background: radial-gradient(circle, rgba(255,255,255,0.18) 0%, transparent 60%);
}
.signin-hero-brand {
  position: relative;
  display: flex; align-items: center; gap: 10px;
}
.signin-hero-logo {
  width: 28px; height: 28px; border-radius: 8px;
  background: rgba(255,255,255,0.15);
  border: 1px solid rgba(255,255,255,0.25);
  display: inline-flex; align-items: center; justify-content: center;
  backdrop-filter: blur(8px);
}
.signin-hero-pill {
  margin-left: 6px; font-size: 10px; padding: 2px 7px; border-radius: 999px;
  background: rgba(255,255,255,0.12);
  border: 1px solid rgba(255,255,255,0.2);
  text-transform: uppercase; letter-spacing: 0.08em; font-weight: 500;
}
.signin-hero-title {
  font-size: 38px; font-weight: 600; letter-spacing: -0.025em; line-height: 1.08;
  margin: 0; max-width: 520px; text-wrap: balance;
}
.signin-hero-sub {
  margin: 0; font-size: 14.5px; line-height: 1.55;
  color: rgba(255,255,255,0.78); max-width: 460px;
}

/* Stats */
.signin-stats {
  display: grid; grid-template-columns: repeat(3, 1fr);
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 12px;
  backdrop-filter: blur(10px);
  padding: 14px 0;
}
.signin-stat { padding: 0 18px; }
.signin-stat.with-border { border-left: 1px solid rgba(255,255,255,0.12); }

/* Hero footer */
.signin-hero-foot {
  position: relative; display: flex; align-items: center; gap: 14px;
  font-size: 12px; color: rgba(255,255,255,0.65);
}
.signin-hero-avatar {
  width: 22px; height: 22px; border-radius: 999px;
  font-size: 9.5px; font-weight: 600; color: white;
  display: inline-flex; align-items: center; justify-content: center;
  border: 1.5px solid color-mix(in oklab, var(--accent) 70%, #111);
}

/* Live feed */
.signin-feed {
  background: rgba(255,255,255,0.08);
  border: 1px solid rgba(255,255,255,0.14);
  border-radius: 14px;
  padding: 12px;
  backdrop-filter: blur(14px);
  box-shadow: 0 20px 60px -20px rgba(0,0,0,0.4);
}
.signin-feed-head {
  display: flex; align-items: center; justify-content: space-between;
  padding: 2px 6px 10px;
  border-bottom: 1px solid rgba(255,255,255,0.1);
  margin-bottom: 8px;
}
.signin-feed-pulse {
  width: 7px; height: 7px; border-radius: 999px;
  background: #34d399;
  box-shadow: 0 0 0 3px rgba(52,211,153,0.25);
}
.signin-feed-item {
  display: flex; align-items: center; gap: 10px;
  padding: 8px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 8px;
}
.signin-feed-avatar {
  width: 24px; height: 24px; border-radius: 6px;
  font-size: 10px; font-weight: 600;
  display: inline-flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.signin-feed-meta {
  display: flex; align-items: center; gap: 6px;
  font-size: 10.5px; color: rgba(255,255,255,0.65);
}
.signin-feed-title {
  font-size: 12px; color: white;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  margin-top: 1px;
}
.signin-feed-tag {
  font-size: 10px; padding: 2px 6px; border-radius: 4px;
  font-weight: 500; white-space: nowrap;
}
.signin-feed-tag.ok   { background: rgba(52,211,153,0.18); color: #9af3c5; }
.signin-feed-tag.warn { background: rgba(255,180,80,0.18); color: #ffd58a; }

/* ── Form (right) ────────────────────────────────────────────── */
.signin-form-wrap {
  position: relative;
  display: flex; flex-direction: column;
  padding: 28px 48px 24px;
  background: var(--bg);
  overflow: hidden;
}
.signin-form-dots {
  position: absolute; inset: 0;
  background-image: radial-gradient(color-mix(in oklab, var(--text) 8%, transparent) 1px, transparent 1px);
  background-size: 24px 24px;
  mask-image: radial-gradient(ellipse 80% 90% at 50% 50%, black 20%, transparent 80%);
  -webkit-mask-image: radial-gradient(ellipse 80% 90% at 50% 50%, black 20%, transparent 80%);
  opacity: 0.6;
  pointer-events: none;
}
.signin-form-glow-1 {
  position: absolute; top: -120px; right: -100px;
  width: 360px; height: 360px; border-radius: 999px;
  background: radial-gradient(circle, color-mix(in oklab, var(--accent) 16%, transparent) 0%, transparent 60%);
  filter: blur(20px);
  pointer-events: none;
}
.signin-form-glow-2 {
  position: absolute; bottom: -140px; left: -80px;
  width: 320px; height: 320px; border-radius: 999px;
  background: radial-gradient(circle, color-mix(in oklab, #6E56CF 12%, transparent) 0%, transparent 60%);
  filter: blur(20px);
  pointer-events: none;
}

.signin-header {
  position: relative;
  display: flex; align-items: center; justify-content: space-between;
  gap: 16px;
}
.signin-status {
  display: inline-flex; align-items: center; gap: 6px;
  height: 26px; padding: 0 10px;
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: 999px;
  box-shadow: var(--shadow-sm);
  font-size: 11px; color: var(--text-2); font-weight: 500;
}
.signin-status-dot { position: relative; width: 7px; height: 7px; }
.signin-status-dot-inner {
  position: absolute; inset: 0; border-radius: 999px; background: var(--success);
}
.signin-status-dot-pulse {
  position: absolute; inset: -3px; border-radius: 999px;
  background: var(--success); opacity: 0.25;
  animation: signinPulse 2s ease-out infinite;
}
@keyframes signinPulse {
  0%   { transform: scale(0.8); opacity: 0.5; }
  100% { transform: scale(2.2); opacity: 0; }
}

.signin-center {
  position: relative;
  flex: 1;
  display: flex; flex-direction: column; justify-content: center;
  max-width: 420px; width: 100%; margin: 0 auto;
  padding: 24px 0;
}

.signin-card {
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 28px 28px 26px;
  box-shadow:
    0 30px 80px -28px rgba(15,23,42,0.18),
    0 8px 24px -12px rgba(15,23,42,0.08),
    0 0 0 1px rgba(255,255,255,0.6) inset;
  position: relative;
}
.signin-card-accent {
  position: absolute; top: -1px; left: 24px; right: 24px; height: 1px;
  background: linear-gradient(90deg, transparent, color-mix(in oklab, var(--accent) 50%, transparent), transparent);
}
.signin-card-icon {
  width: 32px; height: 32px; border-radius: 10px;
  background: var(--accent-bg);
  color: var(--accent);
  border: 1px solid color-mix(in oklab, var(--accent) 22%, transparent);
  display: inline-flex; align-items: center; justify-content: center;
}

/* Tabs */
.signin-tabs {
  display: flex; padding: 3px;
  background: var(--panel-2);
  border: 1px solid var(--border);
  border-radius: 8px;
  margin-bottom: 16px;
}
.signin-tab {
  flex: 1; height: 28px;
  display: inline-flex; align-items: center; justify-content: center; gap: 6px;
  font-size: 12px; font-weight: 500;
  background: transparent;
  color: var(--muted);
  border: 1px solid transparent;
  border-radius: 6px; cursor: pointer;
}
.signin-tab.active {
  background: var(--panel);
  color: var(--text);
  border-color: var(--border);
  box-shadow: var(--shadow-sm);
}

/* Field */
.signin-field { display: flex; flex-direction: column; gap: 5px; }
.signin-field-label {
  font-size: 11.5px; color: var(--text-2); font-weight: 500;
  width: 100%;
}
.signin-field-hint {
  font-size: 11px; color: var(--muted); margin-top: 2px;
}
.signin-link {
  color: var(--accent); font-weight: 500; cursor: pointer;
}
.signin-eye {
  background: none; border: none; color: var(--muted);
  cursor: pointer; display: inline-flex;
}

/* Error banner */
.signin-error {
  display: flex; align-items: center; gap: 8px;
  padding: 9px 12px;
  background: var(--danger-bg);
  border: 1px solid color-mix(in oklab, var(--danger) 25%, transparent);
  border-radius: 8px;
  font-size: 12px; color: var(--danger);
  margin-bottom: 4px;
}

/* Magic sent */
.signin-magic-sent {
  display: flex; align-items: flex-start; gap: 12px;
  padding: 16px;
  background: var(--success-bg);
  border: 1px solid color-mix(in oklab, var(--success) 25%, transparent);
  border-radius: 10px;
}

/* Magic note */
.signin-magic-note {
  display: flex; gap: 10px; align-items: flex-start;
  padding: 10px 12px;
  background: var(--accent-bg);
  border: 1px solid color-mix(in oklab, var(--accent) 25%, transparent);
  border-radius: 8px;
}

/* Divider */
.signin-divider {
  display: flex; align-items: center; gap: 10px;
  color: var(--muted); font-size: 11px;
  margin: 16px 0 12px;
}
.signin-divider-line { flex: 1; height: 1px; background: var(--border); }

/* Trust strip */
.signin-trust {
  display: flex; align-items: center; justify-content: center; gap: 14px;
  margin: 16px auto 0;
  font-size: 11px; color: var(--muted);
  flex-wrap: wrap;
}
.signin-trust > span { display: inline-flex; align-items: center; gap: 5px; }
.signin-trust-dot {
  width: 3px; height: 3px; border-radius: 999px;
  background: var(--border);
}

.signin-terms {
  font-size: 11px; color: var(--muted); text-align: center;
  margin: 10px auto 0; line-height: 1.6; max-width: 380px;
}
.signin-terms a {
  color: var(--text-2); text-decoration: underline; cursor: pointer;
}

.signin-footer {
  position: relative;
  display: flex; align-items: center; justify-content: space-between;
  font-size: 11px; color: var(--muted);
}
.signin-footer a { cursor: pointer; }

/* ── Welcome overlay ─────────────────────────────────────────── */
.welcome-overlay {
  position: fixed; inset: 0; z-index: 9999;
  display: flex; align-items: center; justify-content: center;
  background: linear-gradient(155deg,
    color-mix(in oklab, var(--accent) 92%, black) 0%,
    color-mix(in oklab, var(--accent) 70%, #111) 55%,
    #0b1430 100%);
  color: white;
  overflow: hidden;
}
.welcome-dots {
  position: absolute; inset: 0;
  background-image: radial-gradient(rgba(255,255,255,0.10) 1px, transparent 1px);
  background-size: 22px 22px;
  mask-image: radial-gradient(ellipse 70% 60% at 50% 50%, black 20%, transparent 75%);
  -webkit-mask-image: radial-gradient(ellipse 70% 60% at 50% 50%, black 20%, transparent 75%);
}
.welcome-glow {
  position: absolute; top: 50%; left: 50%;
  width: 720px; height: 720px;
  transform: translate(-50%, -50%);
  border-radius: 999px;
  background: radial-gradient(circle, rgba(255,255,255,0.22) 0%, transparent 60%);
  filter: blur(10px);
  animation: welcomeGlow 2s ease-out forwards;
}
@keyframes welcomeGlow {
  0%   { opacity: 0;   transform: translate(-50%, -50%) scale(0.6); }
  60%  { opacity: 1;   transform: translate(-50%, -50%) scale(1.05); }
  100% { opacity: 0.7; transform: translate(-50%, -50%) scale(1); }
}

.welcome-inner {
  position: relative;
  display: flex; flex-direction: column; align-items: center; gap: 22px;
  animation: welcomeFloat 1.4s ease-out;
}
@keyframes welcomeFloat {
  0%   { opacity: 0; transform: translateY(12px); }
  100% { opacity: 1; transform: translateY(0); }
}

.welcome-logo {
  position: relative;
  width: 76px; height: 76px; border-radius: 22px;
  background: rgba(255,255,255,0.14);
  border: 1px solid rgba(255,255,255,0.30);
  backdrop-filter: blur(16px);
  display: inline-flex; align-items: center; justify-content: center;
  box-shadow: 0 30px 80px -20px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.1) inset;
  animation: logoPop 0.9s cubic-bezier(0.34, 1.56, 0.64, 1);
  z-index: 2;
}
@keyframes logoPop {
  0%   { opacity: 0; transform: scale(0.4) rotate(-12deg); }
  60%  { opacity: 1; transform: scale(1.08) rotate(4deg); }
  100% { opacity: 1; transform: scale(1) rotate(0); }
}

.welcome-rings {
  position: absolute; top: 0; left: 50%;
  width: 76px; height: 76px;
  transform: translateX(-50%);
  pointer-events: none;
}
.welcome-ring {
  position: absolute; inset: 0;
  border-radius: 22px;
  border: 1.5px solid rgba(255,255,255,0.4);
  opacity: 0;
}
.welcome-ring.r1 { animation: ringPulse 1.6s ease-out 0.2s infinite; }
.welcome-ring.r2 { animation: ringPulse 1.6s ease-out 0.6s infinite; }
.welcome-ring.r3 { animation: ringPulse 1.6s ease-out 1.0s infinite; }
@keyframes ringPulse {
  0%   { opacity: 0.6; transform: scale(1); border-radius: 22px; }
  100% { opacity: 0;   transform: scale(2.4); border-radius: 50%; }
}

.welcome-text {
  display: flex; flex-direction: column; align-items: center; gap: 6px;
  text-align: center;
  animation: textFade 1s ease-out 0.3s both;
}
@keyframes textFade {
  0%   { opacity: 0; transform: translateY(8px); }
  100% { opacity: 1; transform: translateY(0); }
}
.welcome-title {
  font-size: 28px; font-weight: 600; letter-spacing: -0.024em;
  margin: 0; text-wrap: balance;
}
.welcome-sub {
  font-size: 13.5px; color: rgba(255,255,255,0.75);
  margin: 0;
}

.welcome-bar {
  width: 180px; height: 3px; border-radius: 999px;
  background: rgba(255,255,255,0.14);
  overflow: hidden;
  margin-top: 6px;
}
.welcome-bar-fill {
  display: block; height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.9), transparent);
  animation: barSlide 1.2s ease-in-out infinite;
}
@keyframes barSlide {
  0%   { transform: translateX(-100%); }
  100% { transform: translateX(280%); }
}

.welcome-enter-active { transition: opacity 0.4s ease; }
.welcome-leave-active { transition: opacity 0.5s ease; }
.welcome-enter-from, .welcome-leave-to { opacity: 0; }

/* ── Responsive ──────────────────────────────────────────────── */
@media (max-width: 960px) {
  .signin-root { grid-template-columns: 1fr; }
  .signin-hero { display: none; }
  .signin-form-wrap { padding: 24px; }
}
</style>
