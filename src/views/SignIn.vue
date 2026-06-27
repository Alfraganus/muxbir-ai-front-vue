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
    <!-- ── Left — brand / product canvas ───────────────────────────── -->
    <aside class="signin-hero">
      <div aria-hidden class="signin-hero-aurora a1"/>
      <div aria-hidden class="signin-hero-aurora a2"/>
      <div aria-hidden class="signin-hero-dots"/>

      <!-- brand row -->
      <div class="signin-hero-brand">
        <img :src="logoWordmarkWhite" alt="Muxbir.ai" class="signin-hero-logo-img"/>
      </div>

      <!-- headline + pipeline -->
      <div class="signin-hero-mid">
        <div style="display:flex;flex-direction:column;gap:14px;">
          <span class="signin-hero-badge">
            <AppIcon name="Robot" :size="13" style="color:var(--mx-cyan);"/>
            Sun'iy intellektli muxbir
          </span>
          <h1 class="signin-hero-title">{{ t('signin.hero.title') }}</h1>
          <p class="signin-hero-sub">{{ t('signin.hero.sub') }}</p>
        </div>

        <!-- Live AI pipeline -->
        <div class="pipe">
          <div class="pipe-head">
            <div style="display:flex;align-items:center;gap:7px;font-size:11.5px;font-weight:500;">
              <span class="pipe-pulse"/>
              Avtomatik oqim
            </div>
            <span class="mono" style="font-size:10.5px;color:rgba(255,255,255,0.5);">real-time · auto</span>
          </div>

          <!-- stage rail -->
          <div class="pipe-rail">
            <template v-for="(s, i) in pipeStages" :key="s.id">
              <div class="pipe-stage">
                <span class="pipe-stage-ic"
                  :class="{ done: i < pipeStage }"
                  :style="i === pipeStage ? {
                    background: `linear-gradient(140deg, ${s.tone}, rgba(255,255,255,0.1))`,
                    color: 'var(--mx-navy)', borderColor: s.tone,
                    boxShadow: `0 0 16px -2px ${s.tone}`,
                  } : null">
                  <AppIcon :name="i < pipeStage ? 'Check' : s.icon" :size="13"/>
                </span>
                <span class="pipe-stage-lbl" :class="{ active: i === pipeStage }">{{ s.label }}</span>
              </div>
              <div v-if="i < pipeStages.length - 1" class="pipe-conn">
                <div class="pipe-conn-fill"
                  :style="{ width: i < pipeStage ? '100%' : '0%',
                            background: `linear-gradient(90deg, ${s.tone}, ${pipeStages[i+1].tone})` }"/>
              </div>
            </template>
          </div>

          <!-- live card -->
          <div class="pipe-card" :style="{ borderColor: pipeCard.tint + '40' }">
            <span class="pipe-card-ic" :style="{ background: pipeCard.tint + '22', color: pipeCard.tint }">
              <AppIcon :name="pipeStages[pipeStage].icon" :size="13"/>
            </span>
            <div style="flex:1;min-width:0;">
              <div class="pipe-card-top">
                <span class="pipe-card-tag" :style="{ color: pipeCard.tint }">{{ pipeCard.tag.toUpperCase() }}</span>
                <span v-if="pipeCard.typing" class="pipe-typing">
                  <span class="mx-dot1" :style="{ background: pipeCard.tint }"/>
                  <span class="mx-dot2" :style="{ background: pipeCard.tint }"/>
                  <span class="mx-dot3" :style="{ background: pipeCard.tint }"/>
                </span>
                <AppIcon v-if="pipeCard.posted" name="Check" :size="12" :style="{ color: pipeCard.tint }"/>
              </div>
              <div class="pipe-card-body">{{ pipeCard.body }}</div>
              <span class="mono pipe-card-badge">{{ pipeCard.badge }}</span>
            </div>
          </div>

          <!-- stats footer -->
          <div class="pipe-stats">
            <div v-for="(s, i) in pipeStats" :key="i" class="pipe-stat" :class="{ bl: i > 0 }">
              <div class="tabular pipe-stat-v">{{ s.v }}</div>
              <div class="pipe-stat-l">{{ s.l }}</div>
            </div>
          </div>
        </div>
      </div>

    </aside>

    <!-- ── Right — sign-in form ────────────────────────────────────── -->
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

          <h2 style="font-size:21px;font-weight:600;letter-spacing:-0.025em;margin:0 0 3px;">
            {{ t('signin.title') }}
          </h2>
          <p style="font-size:12.5px;color:var(--muted);margin:0 0 18px;">
            {{ t('signin.subtitle') }}
          </p>

          <!-- Method tabs -->
          <div v-if="methods.length > 1" class="signin-tabs">
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
          <div v-if="method === 'password'" style="display:flex;flex-direction:column;gap:13px;">
            <div class="signin-field">
              <label class="signin-field-label">{{ t('signin.username') }}</label>
              <AppInput v-model="username" :placeholder="t('signin.usernamePlaceholder')" type="text" :style="signinInputStyle">
                <template #icon><AppIcon name="Users" :size="12" style="color:var(--muted);"/></template>
              </AppInput>
            </div>
            <div class="signin-field">
              <label class="signin-field-label" style="display:flex;justify-content:space-between;">
                <span>{{ t('signin.password') }}</span>
                <a class="signin-link" @click.prevent>{{ t('signin.forgotPassword') }}</a>
              </label>
              <AppInput v-model="password" :type="showPw ? 'text' : 'password'" placeholder="••••••••••••" :style="signinInputStyle">
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
            <AppButton class="signin-cta" variant="primary" size="lg" :loading="loading" :style="signinPrimaryStyle" @click="onLogin">
              {{ t('signin.loginBtn') }}
              <template #icon-right><AppIcon name="Arrow" :size="14"/></template>
            </AppButton>
          </div>

          <!-- Magic link method -->
          <div v-else-if="method === 'magic'" style="display:flex;flex-direction:column;gap:13px;">
            <template v-if="!magicSent">
              <div class="signin-field">
                <label class="signin-field-label">{{ t('signin.email') }}</label>
                <AppInput v-model="email" :placeholder="t('signin.emailPlaceholder')" type="email" :style="signinInputStyle"/>
                <span class="signin-field-hint">{{ t('signin.magicHint') }}</span>
              </div>
              <div class="signin-magic-note">
                <AppIcon name="Sparkle" :size="14" style="color:var(--accent);flex-shrink:0;margin-top:1px;"/>
                <div style="font-size:11.5px;color:var(--text-2);line-height:1.5;">
                  {{ t('signin.magicNote') }}
                </div>
              </div>
              <AppButton class="signin-cta" variant="primary" size="lg" :loading="loading" :style="signinPrimaryStyle" @click="onSendMagicLink">
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
          {{ t('signin.terms') }} <a href="/#/terms" target="_blank">{{ t('signin.termsLink') }}</a> {{ t('signin.and') }} <a href="/#/privacy" target="_blank">{{ t('signin.privacyLink') }}</a>{{ t('signin.termsEnd') }}
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
import { ref, computed, onMounted, onUnmounted } from 'vue'
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
import logoWordmarkWhite from '@/assets/muxbir-wordmark-white.png'

const router = useRouter()
const appStore = useAppStore()
const authStore = useAuthStore()
const { lang } = storeToRefs(appStore)
// t is a reactive function — accessing lang.value inside tracks reactivity
const t = (key) => (DICT[lang.value]?.[key]) ?? DICT.uz[key] ?? key

const method = ref('password')
const showPw = ref(false)
const username = ref('')
const email = ref('') // magic link uchun (hozircha yashirilgan)
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
  // Magic link hozircha yashirilgan
  // { id: 'magic', labelKey: 'signin.methodMagic', icon: 'Sparkle' },
]

// Sign-in formasi uchun kattaroq, brendga mos input/CTA uslublari (AppInput/AppButton
// inline style'larini ustidan merge qiladi — global komponentlarga tegmaydi).
const signinInputStyle = {
  height: '44px',
  borderRadius: '11px',
  padding: '0 13px',
  gap: '8px',
}
const signinPrimaryStyle = {
  width: '100%',
  marginTop: '6px',
  justifyContent: 'center',
  height: '46px',
  fontSize: '13.5px',
  fontWeight: '600',
  borderRadius: '12px',
  background: 'linear-gradient(135deg, var(--mx-blue), var(--mx-sky))',
  border: '1px solid color-mix(in oklab, var(--mx-blue) 65%, black)',
  boxShadow: '0 12px 26px -12px var(--mx-glow), 0 1px 0 rgba(255,255,255,0.25) inset',
}

// ── Live AI pipeline (topildi → AI tahrir → tarjima → joylandi) ──────
const pipeStages = [
  { id: 'find',  icon: 'Search',   label: 'Topildi',   tone: '#4AA3FF' },
  { id: 'edit',  icon: 'Sparkle',  label: 'AI tahrir', tone: '#46E0FF' },
  { id: 'trans', icon: 'Globe2',   label: 'Tarjima',   tone: '#9af3c5' },
  { id: 'post',  icon: 'Telegram', label: 'Joylandi',  tone: '#34d399' },
]
const pipeCards = [
  { tag: 'Manba topildi',      badge: 'Daryo.uz · RSS · 2 daq',   body: "Toshkentda yangi metro bekati ochildi — rasmiy ma'lumot", tint: '#4AA3FF' },
  { tag: 'AI qayta yozmoqda',  badge: 'GPT tahrir · ohang: rasmiy', body: 'Poytaxtda yangi metro bekati foydalanishga topshirildi', tint: '#46E0FF', typing: true },
  { tag: 'Tarjima qilinmoqda', badge: 'UZ → RU · EN',             body: 'В столице открыта новая станция метро', tint: '#9af3c5' },
  { tag: 'Kanalga joylandi',   badge: '@Jurnalist24uz · 184K',    body: 'Poytaxtda yangi metro bekati foydalanishga topshirildi', tint: '#34d399', posted: true },
]
const pipeStats = [
  { v: '4.8M', l: 'Oylik post' },
  { v: '240+', l: 'Faol kanal' },
  { v: '92%',  l: 'Vaqt tejaldi' },
]
const pipeStage = ref(0)
const pipeCard = computed(() => pipeCards[pipeStage.value])
let pipeTimer = null

async function onLogin() {
  error.value = ''
  if (!username.value) { error.value = t('signin.err.noUsername'); return }
  if (!password.value) { error.value = t('signin.err.noPassword'); return }
  loading.value = true
  try {
    const data = await authApi.login({ username: username.value.trim(), password: password.value })
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

onMounted(() => {
  pipeTimer = setInterval(() => { pipeStage.value = (pipeStage.value + 1) % 4 }, 2100)
  onUnmounted(() => { if (pipeTimer) clearInterval(pipeTimer) })
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
  /* Muxbir.ai brand palette (yangi ko'k wordmark + glow) */
  --mx-navy: #081834;
  --mx-deep: #0E2A66;
  --mx-blue: #2F6FED;
  --mx-sky:  #4AA3FF;
  --mx-cyan: #46E0FF;
  --mx-glow: rgba(74,163,255,0.55);

  min-height: 100vh;
  display: grid;
  grid-template-columns: 1.04fr 0.96fr;
  background: var(--bg);
}

/* ── Hero (left) ─────────────────────────────────────────────── */
.signin-hero {
  position: relative;
  background: linear-gradient(157deg, var(--mx-navy) 0%, var(--mx-deep) 52%, #061026 100%);
  color: white;
  padding: 40px 52px 38px;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  overflow: hidden;
}
.signin-hero-aurora {
  position: absolute; border-radius: 999px; pointer-events: none;
}
.signin-hero-aurora.a1 {
  top: -18%; right: -12%; width: 520px; height: 520px;
  background: radial-gradient(circle, var(--mx-blue) 0%, transparent 62%);
  opacity: 0.55; filter: blur(8px);
  animation: mxAurora 16s ease-in-out infinite;
}
.signin-hero-aurora.a2 {
  bottom: -22%; left: -10%; width: 460px; height: 460px;
  background: radial-gradient(circle, var(--mx-cyan) 0%, transparent 60%);
  opacity: 0.22; filter: blur(10px);
  animation: mxAurora 20s ease-in-out infinite reverse;
}
@keyframes mxAurora {
  0%   { transform: translate(0,0) rotate(0deg); }
  50%  { transform: translate(4%,-3%) rotate(8deg); }
  100% { transform: translate(0,0) rotate(0deg); }
}
.signin-hero-dots {
  position: absolute; inset: 0;
  background-image: radial-gradient(rgba(255,255,255,0.10) 1px, transparent 1px);
  background-size: 26px 26px;
  mask-image: radial-gradient(ellipse 90% 70% at 35% 25%, black 25%, transparent 78%);
  -webkit-mask-image: radial-gradient(ellipse 90% 70% at 35% 25%, black 25%, transparent 78%);
}
.signin-hero-brand {
  position: relative;
  display: flex; align-items: center; gap: 13px;
}
.signin-hero-logo-img {
  height: 30px; width: auto; display: block; user-select: none;
}
.signin-hero-mid {
  position: relative;
  display: flex; flex-direction: column; gap: 22px;
  max-width: 500px;
  margin-top: clamp(28px, 7vh, 72px);
}
.signin-hero-badge {
  align-self: flex-start;
  display: inline-flex; align-items: center; gap: 7px;
  font-size: 11.5px; font-weight: 500; color: rgba(255,255,255,0.82);
  padding: 5px 11px; border-radius: 999px;
  background: rgba(255,255,255,0.08);
  border: 1px solid rgba(255,255,255,0.16);
  backdrop-filter: blur(8px);
}
.signin-hero-title {
  font-size: 37px; font-weight: 600; letter-spacing: -0.03em; line-height: 1.08;
  margin: 0; text-wrap: balance;
}
.signin-hero-sub {
  margin: 0; font-size: 14.5px; line-height: 1.55;
  color: rgba(255,255,255,0.72);
}

/* ── AI pipeline ─────────────────────────────────────────────── */
.pipe {
  position: relative;
  background: rgba(255,255,255,0.07);
  border: 1px solid rgba(255,255,255,0.14);
  border-radius: 16px; padding: 14px;
  backdrop-filter: blur(16px);
  box-shadow: 0 24px 60px -24px rgba(0,0,0,0.5);
}
.pipe-head {
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 2px 11px;
  border-bottom: 1px solid rgba(255,255,255,0.1);
  margin-bottom: 12px;
}
.pipe-pulse {
  width: 7px; height: 7px; border-radius: 999px;
  background: #34d399;
  box-shadow: 0 0 0 3px rgba(52,211,153,0.25);
}
.pipe-rail {
  display: flex; align-items: center; margin-bottom: 12px;
}
.pipe-stage {
  display: flex; flex-direction: column; align-items: center; gap: 6px;
  flex-shrink: 0;
}
.pipe-stage-ic {
  width: 30px; height: 30px; border-radius: 9px;
  display: inline-flex; align-items: center; justify-content: center;
  background: rgba(255,255,255,0.06);
  color: rgba(255,255,255,0.4);
  border: 1px solid rgba(255,255,255,0.14);
  transition: all .4s ease;
}
.pipe-stage-ic.done {
  background: rgba(255,255,255,0.16);
  color: rgba(255,255,255,0.92);
}
.pipe-stage-lbl {
  font-size: 9.5px; font-weight: 500; color: rgba(255,255,255,0.5);
  transition: color .3s;
}
.pipe-stage-lbl.active { color: white; }
.pipe-conn {
  flex: 1; height: 2px; margin: 0 4px 18px;
  background: rgba(255,255,255,0.12);
  border-radius: 999px; overflow: hidden;
}
.pipe-conn-fill { height: 100%; transition: width .5s ease; }

.pipe-card {
  display: flex; align-items: flex-start; gap: 11px;
  padding: 11px 12px;
  background: rgba(255,255,255,0.05);
  border: 1px solid transparent; border-radius: 11px;
  transition: border-color .4s ease;
}
.pipe-card-ic {
  width: 30px; height: 30px; border-radius: 8px; flex-shrink: 0;
  display: inline-flex; align-items: center; justify-content: center;
}
.pipe-card-top {
  display: flex; align-items: center; gap: 7px; margin-bottom: 3px;
}
.pipe-card-tag {
  font-size: 10px; font-weight: 600; letter-spacing: 0.02em;
}
.pipe-typing { display: inline-flex; gap: 2px; }
.pipe-typing > span { width: 3px; height: 3px; border-radius: 999px; }
.pipe-card-body {
  font-size: 12.5px; color: white; line-height: 1.35; margin-bottom: 5px;
}
.pipe-card-badge { font-size: 10px; color: rgba(255,255,255,0.55); }

.pipe-stats {
  display: grid; grid-template-columns: repeat(3, 1fr);
  margin-top: 12px; padding-top: 11px;
  border-top: 1px solid rgba(255,255,255,0.1);
}
.pipe-stat { padding: 0 14px; }
.pipe-stat.bl { border-left: 1px solid rgba(255,255,255,0.1); }
.pipe-stat-v { font-size: 18px; font-weight: 600; letter-spacing: -0.02em; }
.pipe-stat-l { font-size: 10.5px; color: rgba(255,255,255,0.6); }

.mx-dot1 { animation: mxDots 1.1s infinite; }
.mx-dot2 { animation: mxDots 1.1s infinite .18s; }
.mx-dot3 { animation: mxDots 1.1s infinite .36s; }
@keyframes mxDots {
  0%, 80%, 100% { opacity: .25; transform: translateY(0); }
  40%           { opacity: 1;  transform: translateY(-2px); }
}

/* ── Form (right) ────────────────────────────────────────────── */
.signin-form-wrap {
  position: relative;
  display: flex; flex-direction: column;
  padding: 26px 48px 22px;
  background:
    radial-gradient(1100px 720px at 88% -12%, color-mix(in oklab, var(--mx-sky) 11%, transparent), transparent 58%),
    radial-gradient(820px 560px at -8% 112%, color-mix(in oklab, var(--mx-cyan) 9%, transparent), transparent 55%),
    var(--bg);
  overflow: hidden;
}
.signin-form-dots {
  position: absolute; inset: 0;
  background-image: radial-gradient(color-mix(in oklab, var(--text) 7%, transparent) 1px, transparent 1px);
  background-size: 24px 24px;
  mask-image: radial-gradient(ellipse 80% 90% at 50% 45%, black 15%, transparent 80%);
  -webkit-mask-image: radial-gradient(ellipse 80% 90% at 50% 45%, black 15%, transparent 80%);
  opacity: 0.6;
  pointer-events: none;
}
.signin-form-glow-1 {
  position: absolute; top: -130px; right: -90px;
  width: 360px; height: 360px; border-radius: 999px;
  background: radial-gradient(circle, color-mix(in oklab, var(--mx-blue) 16%, transparent) 0%, transparent 62%);
  filter: blur(18px);
  pointer-events: none;
}
.signin-form-glow-2 {
  position: absolute; bottom: -150px; left: -110px;
  width: 380px; height: 380px; border-radius: 999px;
  background: radial-gradient(circle, color-mix(in oklab, var(--mx-cyan) 14%, transparent) 0%, transparent 60%);
  filter: blur(22px);
  pointer-events: none;
}

.signin-header {
  position: relative;
  display: flex; align-items: center; justify-content: space-between;
  gap: 16px;
}
.signin-status {
  display: inline-flex; align-items: center; gap: 7px;
  height: 27px; padding: 0 11px;
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
  max-width: 416px; width: 100%; margin: 0 auto;
  padding: 20px 0;
}
.signin-card {
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: 18px;
  padding: 28px 28px 26px;
  box-shadow:
    0 40px 90px -30px rgba(8,24,52,0.28),
    0 12px 30px -14px rgba(8,24,52,0.14),
    0 0 0 1px rgba(255,255,255,0.6) inset;
  position: relative;
  animation: signinCardIn .55s cubic-bezier(.34,1.18,.64,1) both;
}
/* Karta ortidagi yumshoq brend nuri (suzuvchi ko'rinish) */
.signin-card::after {
  content: ''; position: absolute; inset: -36px -26px -16px; z-index: -1;
  background: radial-gradient(64% 70% at 50% 0%, color-mix(in oklab, var(--mx-blue) 20%, transparent), transparent 72%);
  filter: blur(26px); pointer-events: none;
}
@keyframes signinCardIn {
  from { opacity: 0; transform: translateY(12px) scale(.99); }
  to   { opacity: 1; transform: none; }
}
.signin-card-accent {
  position: absolute; top: -1px; left: 26px; right: 26px; height: 2px;
  border-radius: 999px;
  background: linear-gradient(90deg, transparent, var(--mx-blue), var(--mx-cyan), transparent);
}

/* Tabs */
.signin-tabs {
  display: flex; padding: 3px;
  background: var(--panel-2);
  border: 1px solid var(--border);
  border-radius: 9px;
  margin-bottom: 16px;
}
.signin-tab {
  flex: 1; height: 32px;
  display: inline-flex; align-items: center; justify-content: center; gap: 6px;
  font-size: 12px; font-weight: 500;
  background: transparent;
  color: var(--muted);
  border: 1px solid transparent;
  border-radius: 7px; cursor: pointer;
  transition: color .18s ease, background .18s ease, box-shadow .18s ease;
}
.signin-tab:hover:not(.active) { color: var(--text-2); }
.signin-tab.active {
  background: var(--panel);
  color: var(--accent);
  border-color: color-mix(in oklab, var(--mx-blue) 28%, var(--border));
  box-shadow: 0 2px 8px -3px color-mix(in oklab, var(--mx-blue) 35%, transparent);
}

/* Field */
.signin-field { display: flex; flex-direction: column; gap: 6px; }
/* AppInput wrapper (root div) — silliq fokus + brend halqa */
.signin-field :deep(div) {
  transition: border-color .18s ease, box-shadow .18s ease, background .18s ease;
}
.signin-field :deep(div:focus-within) {
  border-color: var(--mx-blue) !important;
  box-shadow: 0 0 0 3.5px color-mix(in oklab, var(--mx-blue) 16%, transparent);
}
.signin-field-label {
  font-size: 11.5px; color: var(--text-2); font-weight: 500;
  width: 100%;
}

/* Brend CTA — gradient tugma uchun hover lift / glow */
.signin-card :deep(.signin-cta) {
  transition: transform .15s ease, box-shadow .25s ease, filter .15s ease;
}
.signin-card :deep(.signin-cta:hover) {
  transform: translateY(-1px);
  filter: brightness(1.05);
  box-shadow: 0 16px 32px -12px var(--mx-glow), 0 1px 0 rgba(255,255,255,0.25) inset;
}
.signin-card :deep(.signin-cta:active) { transform: translateY(0); }
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
  margin-bottom: 12px;
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
  border-radius: 9px;
}

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
  margin: 10px auto 0; line-height: 1.6; max-width: 360px;
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
  background: linear-gradient(157deg, #081834 0%, #0E2A66 52%, #061026 100%);
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
  background: radial-gradient(circle, rgba(74,163,255,0.30) 0%, transparent 60%);
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
