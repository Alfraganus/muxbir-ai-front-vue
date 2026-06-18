<template>
  <!-- ── Step transition veil ──────────────────────────────────── -->
  <Transition name="veil-fade">
    <div v-if="transitioning" class="oz-veil">
      <div class="oz-veil-card">
        <!-- Animated SVG arc ring -->
        <div class="oz-veil-ring">
          <svg width="88" height="88" viewBox="0 0 88 88" fill="none">
            <circle cx="44" cy="44" r="37" stroke="var(--border)" stroke-width="3.5"/>
            <circle cx="44" cy="44" r="37" stroke="var(--accent)" stroke-width="3.5"
              stroke-linecap="round" stroke-dasharray="232.5" stroke-dashoffset="232.5"
              class="oz-arc"/>
          </svg>
          <div class="oz-veil-icon-wrap">
            <AppIcon :name="stepIconMap[nextStep] || 'Sparkle'" :size="28" :stroke-width="1.6" style="color:var(--accent)"/>
          </div>
        </div>
        <!-- Step label -->
        <div class="oz-veil-label">{{ veilLabel }}</div>
        <!-- Bouncing dots -->
        <div class="oz-veil-dots">
          <span/><span style="animation-delay:.18s"/><span style="animation-delay:.36s"/>
        </div>
      </div>
    </div>
  </Transition>

  <!-- ── Main shell ─────────────────────────────────────────────── -->
  <div class="oz-root">

    <!-- 3px progress stripe at very top -->
    <div class="oz-progress-stripe">
      <div class="oz-progress-fill" :style="{ width: progressPct + '%' }"/>
    </div>

    <!-- Header -->
    <header class="oz-header">
      <BrandLogo/>
      <div style="flex:1"/>
      <span style="font-size:12px;color:var(--muted)">Allaqachon hisobingiz bormi?</span>
      <AppButton variant="secondary" size="md" @click="$router.push('/admin/overview')">Kirish</AppButton>
      <LangSwitcher/>
    </header>

    <!-- Stepper -->
    <div class="oz-stepper-wrap">
      <div class="oz-stepper">
        <template v-for="(s, i) in visibleSteps" :key="s.id">
          <div class="oz-step-item" :class="{ done: step > s.id, active: step === s.id }">
            <div class="oz-step-bubble">
              <svg v-if="step > s.id" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.8">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              <span v-else style="font-size:11px;font-weight:600">{{ i + 1 }}</span>
            </div>
            <span class="oz-step-label">{{ s.label }}</span>
          </div>
          <div v-if="i < visibleSteps.length - 1" class="oz-step-bridge" :class="{ done: step > s.id }"/>
        </template>
      </div>
    </div>

    <!-- Step content with enter animation -->
    <div class="oz-body">
      <Transition name="oz-step">
        <div :key="step" class="oz-page">

          <!-- ────────── STEP 1: Hisob ────────── -->
          <div v-if="step === 1" class="oz-narrow" style="max-width:460px">
            <div class="oz-step-head">
              <div class="oz-step-head-icon" style="background:color-mix(in oklab,var(--accent) 10%,transparent)">
                <AppIcon name="Shield" :size="22" :stroke-width="1.7" style="color:var(--accent)"/>
              </div>
              <div>
                <h1 class="oz-h1">Hisob yarating</h1>
                <p class="oz-sub">3 kunlik bepul sinash — karta talab qilinmaydi</p>
              </div>
            </div>

            <AppPanel :padding="28">
              <div class="oz-form">
                <VField label="To'liq ism" :error="e.full_name" required>
                  <VInput v-model="f1.full_name" placeholder="Sardor Qodirov" :error="!!e.full_name" @input="clearErr('full_name')"/>
                </VField>
                <VField label="Ish elektron pochtasi" :error="e.email" required>
                  <VInput v-model="f1.email" type="email" placeholder="sardor@kompaniya.uz" :error="!!e.email" @input="clearErr('email')"/>
                </VField>
                <VField label="Parol" :error="e.password" required>
                  <VInput v-model="f1.password" :type="showPass ? 'text' : 'password'" placeholder="••••••••••" :error="!!e.password" @input="clearErr('password')">
                    <template #suffix>
                      <button @click="showPass=!showPass" type="button" class="oz-eye-btn">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                          <path v-if="!showPass" d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/>
                          <circle v-if="!showPass" cx="12" cy="12" r="3"/>
                          <path v-if="showPass" d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-10-7-10-7a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 10 7 10 7a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                          <line v-if="showPass" x1="1" y1="1" x2="23" y2="23"/>
                        </svg>
                      </button>
                    </template>
                  </VInput>
                  <StrengthBar :password="f1.password"/>
                </VField>
                <label class="oz-terms">
                  <input type="checkbox" v-model="f1.accept_terms" style="accent-color:var(--accent);margin-top:2px;flex-shrink:0"/>
                  <span>
                    <span style="color:var(--accent);font-weight:500">Foydalanish shartlari</span>
                    va
                    <span style="color:var(--accent);font-weight:500">maxfiylik siyosati</span>ni
                    qabul qilaman
                  </span>
                </label>
                <p v-if="e.accept_terms" style="margin:0;font-size:11.5px;color:var(--danger)">{{ e.accept_terms }}</p>
                <ApiError :msg="apiError"/>
                <AppButton variant="primary" size="lg" :loading="submitting" @click="submitStep1" style="width:100%">
                  Davom etish
                </AppButton>
              </div>
            </AppPanel>
          </div>

          <!-- ────────── STEP 2: Kompaniya ────────── -->
          <div v-else-if="step === 2" class="oz-narrow" style="max-width:560px">
            <div class="oz-step-head">
              <div class="oz-step-head-icon" style="background:color-mix(in oklab,#3b82f6 10%,transparent)">
                <AppIcon name="Building" :size="22" :stroke-width="1.7" style="color:#3b82f6"/>
              </div>
              <div>
                <h1 class="oz-h1">Kompaniyangizni tanishtiring</h1>
                <p class="oz-sub">Bu ma'lumot dashboard va fakturalar uchun ishlatiladi</p>
              </div>
            </div>

            <AppPanel :padding="28">
              <div class="oz-form">
                <VField label="Kompaniya nomi" :error="e.company_name" required>
                  <VInput v-model="f2.name" placeholder="OOO Olcha Express" :error="!!e.company_name" @input="clearErr('company_name')"/>
                </VField>
                <VField label="Joylashuv">
                  <VInput v-model="f2.location" placeholder="Toshkent, O'zbekiston"/>
                </VField>
                <VField label="Faoliyat turi">
                  <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:2px">
                    <button v-for="bt in businessTypes" :key="bt.id"
                      :style="{
                        height:'30px',padding:'0 13px',fontSize:'12px',fontWeight:500,
                        background: f2.business_type_id===bt.id ? 'var(--accent-bg)' : 'var(--panel)',
                        border: `1px solid ${f2.business_type_id===bt.id ? 'color-mix(in oklab,var(--accent) 35%,transparent)' : 'var(--border)'}`,
                        color: f2.business_type_id===bt.id ? 'var(--accent)' : 'var(--text-2)',
                        borderRadius:'999px',cursor:'pointer',transition:'all .15s',
                      }" @click="f2.business_type_id = bt.id">
                      {{ bt.name_i18n?.uz || bt.name }}
                    </button>
                  </div>
                </VField>
                <VField label="Kompaniya telefon raqamlari">
                  <div style="display:flex;flex-direction:column;gap:8px">
                    <div v-for="(_, i) in f2.phones" :key="i" style="display:flex;gap:8px;align-items:center">
                      <VInput v-model="f2.phones[i]" :mono="true" placeholder="+998 __ ___ __ __" style="flex:1"/>
                      <button v-if="i > 0" @click="f2.phones.splice(i,1)" class="oz-rm-btn">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M18 6 6 18M6 6l12 12"/></svg>
                      </button>
                    </div>
                    <button @click="f2.phones.push('')" class="oz-add-btn">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M12 5v14M5 12h14"/></svg>
                      Yana raqam qo'shish
                    </button>
                  </div>
                </VField>
                <ApiError :msg="apiError"/>
                <div class="oz-nav">
                  <AppButton variant="secondary" size="lg" @click="step=1">
                    <template #icon><AppIcon name="ChevronL" :size="14"/></template>Orqaga
                  </AppButton>
                  <AppButton variant="primary" size="lg" :loading="submitting" @click="submitStep2">
                    Davom etish<template #icon-right><AppIcon name="ChevronR" :size="14"/></template>
                  </AppButton>
                </div>
              </div>
            </AppPanel>
          </div>

          <!-- ────────── STEP 3: Kanallar ────────── -->
          <div v-else-if="step === 3" class="oz-narrow" style="max-width:560px">
            <div class="oz-step-head">
              <div class="oz-step-head-icon" style="background:color-mix(in oklab,#2AABEE 10%,transparent)">
                <AppIcon name="Telegram" :size="22" :stroke-width="1.7" style="color:#2AABEE"/>
              </div>
              <div>
                <h1 class="oz-h1">Ijtimoiy tarmoqlarni ulang</h1>
                <p class="oz-sub">Kanallaringizni ulang — tizim kontentni avtomatik tahlil qiladi</p>
              </div>
            </div>

            <AppPanel :padding="28">
              <div class="oz-form">
                <div style="display:flex;flex-direction:column;gap:8px">
                  <label style="font-size:11px;color:var(--muted);font-weight:600;text-transform:uppercase;letter-spacing:.04em">Platforma tanlang</label>
                  <div v-for="pl in platformsForStep" :key="pl.slug"
                    @click="pl.is_available && togglePlatform(pl.slug)"
                    class="oz-platform-row"
                    :class="{ selected: selectedPlatforms.includes(pl.slug), unavailable: !pl.is_available }">
                    <div class="oz-platform-icon"
                      :style="{
                        background: pl.slug==='telegram' ? '#2AABEE'
                          : pl.slug==='instagram' ? 'linear-gradient(135deg,#f9ce34,#ee2a7b,#6228d7)'
                          : 'var(--panel)',
                        border: pl.slug==='website' ? '1px solid var(--border)' : 'none',
                      }">
                      <AppIcon
                        :name="pl.slug==='telegram' ? 'Telegram' : pl.slug==='instagram' ? 'Instagram' : 'Globe'"
                        :size="18" :stroke-width="1.8"
                        :style="{ color: pl.slug==='website' ? 'var(--text-2)' : 'white' }"/>
                    </div>
                    <div style="flex:1">
                      <div style="font-size:13px;font-weight:600;color:var(--text)">{{ pl.name_i18n?.uz || pl.name }}</div>
                      <div style="font-size:11px;color:var(--muted);margin-top:1px">
                        {{ pl.slug==='telegram' ? 'Kanal va guruhlarni ulash'
                          : pl.slug==='instagram' ? 'Profil va postlarni kuzatish'
                          : 'Sayt kontentini kuzatish' }}
                      </div>
                    </div>
                    <span v-if="!pl.is_available" class="oz-soon-badge">Tez kunda</span>
                    <span v-else class="oz-check-circle" :class="{ on: selectedPlatforms.includes(pl.slug) }">
                      <svg v-if="selectedPlatforms.includes(pl.slug)" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.8"><polyline points="20 6 9 17 4 12"/></svg>
                    </span>
                  </div>
                </div>

                <!-- Telegram channels — URL → bot admin → auto-detect via webhook -->
                <div v-if="selectedPlatforms.includes('telegram')" class="oz-tg-box">
                  <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
                    <div style="width:22px;height:22px;border-radius:6px;background:#2AABEE;display:inline-flex;align-items:center;justify-content:center">
                      <AppIcon name="Telegram" :size="12" :stroke-width="1.8" style="color:white"/>
                    </div>
                    <span style="font-size:12.5px;font-weight:600">Telegram kanal ulash</span>
                  </div>
                  <p style="margin:0 0 12px;font-size:11px;color:var(--muted);line-height:1.5">
                    Kanal URL'ini kiriting (masalan, <span style="font-family:var(--font-mono)">https://t.me/my_channel</span>).
                    Keyin bizning botni kanalingizga admin qilib qo'shing — ID avtomatik olinadi.
                  </p>

                  <!-- Mavjud (ulangan/pending) kanallar ro'yxati -->
                  <div v-if="tgChannels.length" style="display:flex;flex-direction:column;gap:8px;margin-bottom:10px">
                    <div v-for="ch in tgChannels" :key="ch.id" class="oz-tg-channel-row" :class="ch.status">
                      <div style="display:flex;align-items:center;gap:8px;flex:1;min-width:0">
                        <span class="oz-tg-status-dot" :class="ch.status"></span>
                        <div style="flex:1;min-width:0">
                          <div style="font-size:12.5px;font-weight:600;color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;display:flex;align-items:center;gap:6px">
                            <span style="overflow:hidden;text-overflow:ellipsis">{{ ch.display_name || ch.username }}</span>
                            <span class="oz-tg-mode-pill" :class="ch.posting_mode || 'auto'">
                              {{ (ch.posting_mode || 'auto') === 'auto' ? 'Avtomatik' : 'Manual' }}
                            </span>
                          </div>
                          <div style="font-size:10.5px;color:var(--muted);margin-top:1px">
                            <template v-if="ch.status === 'connected'">Ulandi · {{ ch.username }}</template>
                            <template v-else-if="ch.status === 'pending_admin'">Botni admin qilishingizni kutmoqda…</template>
                            <template v-else>{{ ch.username }}</template>
                          </div>
                        </div>
                      </div>
                      <button @click="toggleChannelMode(ch)" class="oz-tg-mode-btn" :title="(ch.posting_mode||'auto')==='auto' ? 'Manual rejimga o\'tkazish' : 'Avtomatik rejimga o\'tkazish'">
                        <AppIcon :name="(ch.posting_mode||'auto')==='auto' ? 'Sparkle' : 'Edit'" :size="11" :stroke-width="1.8"/>
                      </button>
                      <a v-if="ch.status === 'pending_admin' && tgDeepLink" :href="tgDeepLink" target="_blank" class="oz-tg-admin-btn">
                        <AppIcon name="Telegram" :size="11" :stroke-width="1.8"/>
                        Botni admin qilish
                      </a>
                      <button @click="removeTgChannel(ch.id)" class="oz-rm-btn" title="O'chirish">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M18 6 6 18M6 6l12 12"/></svg>
                      </button>
                    </div>
                  </div>

                  <!-- Posting mode tanlash -->
                  <div class="oz-pm-group" style="margin-bottom:10px">
                    <label class="oz-pm-label">Post yuborish rejimi</label>
                    <div class="oz-pm-options">
                      <button type="button" class="oz-pm-opt" :class="{ active: tgNewMode === 'auto' }" @click="tgNewMode = 'auto'">
                        <div class="oz-pm-opt-head">
                          <span class="oz-pm-opt-icon"><AppIcon name="Sparkle" :size="13" :stroke-width="1.7"/></span>
                          <span class="oz-pm-opt-title">Avtomatik</span>
                          <span v-if="tgNewMode==='auto'" class="oz-pm-opt-check"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3.2"><polyline points="20 6 9 17 4 12"/></svg></span>
                        </div>
                        <div class="oz-pm-opt-sub">Tizim har bir interval'da o'zi post tanlab yuboradi</div>
                      </button>
                      <button type="button" class="oz-pm-opt" :class="{ active: tgNewMode === 'manual' }" @click="tgNewMode = 'manual'">
                        <div class="oz-pm-opt-head">
                          <span class="oz-pm-opt-icon"><AppIcon name="Edit" :size="13" :stroke-width="1.7"/></span>
                          <span class="oz-pm-opt-title">Manual</span>
                          <span v-if="tgNewMode==='manual'" class="oz-pm-opt-check"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3.2"><polyline points="20 6 9 17 4 12"/></svg></span>
                        </div>
                        <div class="oz-pm-opt-sub">Faqat siz yuborganda chiqadi, avtomatik yuborilmaydi</div>
                      </button>
                    </div>
                  </div>

                  <!-- ─── AI Assistant config (faqat AVTOMATIK rejimda) ─── -->
                  <Transition name="ai-fade">
                    <div v-if="tgNewMode === 'auto'" class="oz-ai-box">
                      <div class="oz-ai-head">
                        <span class="oz-ai-icon">
                          <AppIcon name="Sparkle" :size="13" :stroke-width="1.8"/>
                        </span>
                        <div style="flex:1">
                          <div class="oz-ai-title">AI assistent sozlamalari</div>
                          <div class="oz-ai-sub">Avtomatik rejimda postlar shu qoidalar bilan qayta yoziladi</div>
                        </div>
                      </div>

                      <!-- 0. Topic selector -->
                      <div class="oz-ai-group">
                        <div class="oz-ai-group-label">
                          <AppIcon name="Globe2" :size="11" :stroke-width="1.9"/>
                          Mavzu
                          <span style="color:var(--muted);font-weight:500;text-transform:none;letter-spacing:0;margin-left:4px">(faqat tanlangan mavzudagi postlar qabul qilinadi)</span>
                        </div>
                        <div class="oz-topic-chips">
                          <button v-for="t in TOPIC_PRESETS" :key="t.id"
                            type="button" class="oz-topic-chip"
                            :class="{ active: ai.topics.includes(t.id) }"
                            @click="toggleTopic(t.id)">
                            <span class="oz-topic-chip-label">{{ t.label }}</span>
                            <span class="oz-topic-chip-desc">{{ t.desc }}</span>
                          </button>
                        </div>
                      </div>

                      <!-- 1. Content type filter -->
                      <div class="oz-ai-group">
                        <div class="oz-ai-group-label">
                          <AppIcon name="Globe2" :size="11" :stroke-width="1.9"/>
                          Kontent turi
                        </div>
                        <label class="oz-ai-toggle" :class="{ on: ai.onlyNews }">
                          <input type="checkbox" v-model="ai.onlyNews"/>
                          <span class="oz-ai-toggle-box">
                            <svg v-if="ai.onlyNews" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
                          </span>
                          <span style="flex:1">
                            <span class="oz-ai-toggle-title">Faqat "xabar / yangilik" turidagi postlar</span>
                            <span class="oz-ai-toggle-sub">Reklama, e'lon, intervyu, lichniy gap tashlab yuboriladi</span>
                          </span>
                        </label>
                      </div>

                      <!-- 2. Rewrite rules -->
                      <div class="oz-ai-group">
                        <div class="oz-ai-group-label">
                          <AppIcon name="Edit" :size="11" :stroke-width="1.9"/>
                          Qayta yozish qoidalari
                        </div>
                        <label class="oz-ai-toggle" :class="{ on: ai.stripSource }">
                          <input type="checkbox" v-model="ai.stripSource"/>
                          <span class="oz-ai-toggle-box">
                            <svg v-if="ai.stripSource" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
                          </span>
                          <span style="flex:1">
                            <span class="oz-ai-toggle-title">Manba nomini va havolalarini olib tashlash</span>
                            <span class="oz-ai-toggle-sub">Masalan: "Kun.uz rasmiy kanali", "Manba: @kunuzofficial" — o'chiriladi</span>
                          </span>
                        </label>
                        <label class="oz-ai-toggle" :class="{ on: ai.paraphrase }">
                          <input type="checkbox" v-model="ai.paraphrase"/>
                          <span class="oz-ai-toggle-box">
                            <svg v-if="ai.paraphrase" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
                          </span>
                          <span style="flex:1">
                            <span class="oz-ai-toggle-title">Matnni paraphrase qilish</span>
                            <span class="oz-ai-toggle-sub">Asl ma'no saqlanib, so'z va jumlalar qayta yoziladi</span>
                          </span>
                        </label>
                        <label class="oz-ai-toggle" :class="{ on: ai.prefixSource }">
                          <input type="checkbox" v-model="ai.prefixSource"/>
                          <span class="oz-ai-toggle-box">
                            <svg v-if="ai.prefixSource" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
                          </span>
                          <span style="flex:1">
                            <span class="oz-ai-toggle-title">Boshiga "&lt;Manba&gt; xabar berishicha" qo'shish</span>
                            <span class="oz-ai-toggle-sub">Masalan: "Kun.uz xabar berishicha, …"</span>
                          </span>
                        </label>
                      </div>

                      <!-- 3. Hard restrictions (locked) -->
                      <div class="oz-ai-group">
                        <div class="oz-ai-group-label danger">
                          <AppIcon name="Shield" :size="11" :stroke-width="1.9"/>
                          Majburiy cheklovlar
                          <span class="oz-ai-lock">
                            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>
                            Doim yoqilgan
                          </span>
                        </div>
                        <div class="oz-ai-locked-item">
                          <span class="oz-ai-locked-dot"/>
                          Islomiy / diniy kontent — aslo o'tkazilmaydi
                        </div>
                        <div class="oz-ai-locked-item">
                          <span class="oz-ai-locked-dot"/>
                          O'zbekiston Respublikasi nomiga tanqid — aslo o'tkazilmaydi
                        </div>
                        <div class="oz-ai-locked-item">
                          <span class="oz-ai-locked-dot"/>
                          Prezident va oila a'zolari haqida salbiy kontent — aslo o'tkazilmaydi
                        </div>
                      </div>

                      <!-- 4. Custom extra instruction -->
                      <div class="oz-ai-group">
                        <div class="oz-ai-group-label">
                          <AppIcon name="Sparkle" :size="11" :stroke-width="1.9"/>
                          Qo'shimcha ko'rsatma <span style="color:var(--muted);font-weight:500;text-transform:none;letter-spacing:0">(ixtiyoriy)</span>
                        </div>
                        <textarea v-model="ai.extra" class="oz-ai-textarea"
                          placeholder="Masalan: postlar oxiriga emoji qo'shma, sarlavhani qalin yozma, qisqaroq qil…"/>
                      </div>

                      <!-- 5. Avtomatik nashr qoidalari (info) -->
                      <div class="oz-ai-group">
                        <div class="oz-ai-group-label">
                          <AppIcon name="Bolt" :size="11" :stroke-width="1.9"/>
                          AI yuborgan post bilan nima bo'ladi
                        </div>
                        <div class="oz-ai-info-row">
                          <span class="oz-ai-info-num">1</span>
                          <div class="oz-ai-info-body">
                            <div class="oz-ai-info-title">Postlar oqimiga qo'shiladi</div>
                            <div class="oz-ai-info-sub">Har bir avtomatik yuborilgan xabar <strong>"Nashr qilinganlar"</strong> ro'yxatida ko'rinadi — sarlavha, vaqt, manba va kanal bilan</div>
                          </div>
                        </div>
                        <div class="oz-ai-info-row">
                          <span class="oz-ai-info-num">2</span>
                          <div class="oz-ai-info-body">
                            <div class="oz-ai-info-title">Tokenlar ro'yxatga olinadi</div>
                            <div class="oz-ai-info-sub">Har AI chaqiruvi uchun ishlatilgan token soni post bilan birga saqlanadi (audit va analitika uchun)</div>
                          </div>
                        </div>
                        <div class="oz-ai-info-row">
                          <span class="oz-ai-info-num">3</span>
                          <div class="oz-ai-info-body">
                            <div class="oz-ai-info-title">Oylik tarif limitidan yechiladi</div>
                            <div class="oz-ai-info-sub">Ishlatilgan tokenlar tarifingizdagi <strong>oylik AI token limiti</strong>dan kamayadi. Limit tugasa avtomatik yuborish vaqtincha to'xtatiladi</div>
                          </div>
                        </div>
                      </div>

                      <!-- AI-bypass yo'q — qattiq kontract -->
                      <div class="oz-ai-strict">
                        <AppIcon name="Shield" :size="13" :stroke-width="1.9" style="flex-shrink:0;color:var(--danger);margin-top:1px"/>
                        <div>
                          <div class="oz-ai-strict-title">AI ni chetlab o'tib bo'lmaydi</div>
                          <div class="oz-ai-strict-sub">
                            Avtomatik rejimda kanalga keladigan <strong>har bir post majburan AI dan o'tadi</strong>.
                            AI bo'sh javob qaytarsa (post xabar emas yoki cheklov buzgan), <strong>post tashlanadi</strong> — manba matni o'z holicha hech qachon nashr qilinmaydi.
                            Rejim almashtirilgan paytda allaqachon kelgan eski postlar avtomatik yuborilmaydi.
                          </div>
                        </div>
                      </div>

                      <!-- 6. Preview compiled prompt -->
                      <button class="oz-ai-preview-toggle" @click="ai.showPrompt = !ai.showPrompt">
                        <AppIcon :name="ai.showPrompt ? 'ChevronL' : 'ChevronR'" :size="11" :stroke-width="2"
                          :style="{ transform: ai.showPrompt ? 'rotate(90deg)' : 'rotate(0)', transition: 'transform .2s' }"/>
                        Tizim promptini ko'rish
                      </button>
                      <pre v-if="ai.showPrompt" class="oz-ai-prompt">{{ compiledPrompt }}</pre>
                    </div>
                  </Transition>

                  <!-- Yangi kanal qo'shish input -->
                  <div style="display:flex;gap:8px;align-items:center">
                    <div class="oz-tg-input">
                      <AppIcon name="Telegram" :size="13" :stroke-width="1.6" style="color:#2AABEE;flex-shrink:0"/>
                      <input v-model="tgNewUrl" @keyup.enter="addTgChannel" placeholder="https://t.me/my_channel"
                        style="flex:1;border:none;outline:none;background:transparent;font-size:13px;color:var(--text);font-family:var(--font-mono)"/>
                    </div>
                    <AppButton variant="secondary" size="md" :loading="tgAdding" @click="addTgChannel">
                      Qo'shish
                    </AppButton>
                  </div>
                  <p v-if="tgError" style="margin:8px 0 0;font-size:11.5px;color:var(--danger)">{{ tgError }}</p>
                  <p v-if="e.channels" style="margin:8px 0 0;font-size:11.5px;color:var(--danger)">{{ e.channels }}</p>
                </div>

                <ApiError :msg="apiError"/>
                <div class="oz-nav">
                  <AppButton variant="secondary" size="lg" @click="step=2">
                    <template #icon><AppIcon name="ChevronL" :size="14"/></template>Orqaga
                  </AppButton>
                  <AppButton variant="primary" size="lg" :loading="submitting" @click="submitStep3">
                    Davom etish<template #icon-right><AppIcon name="ChevronR" :size="14"/></template>
                  </AppButton>
                </div>
              </div>
            </AppPanel>
          </div>

          <!-- ────────── STEP 4: Manbalar ────────── -->
          <div v-else-if="step === 4" style="max-width:780px;margin:0 auto;width:100%">
            <div class="oz-step-head">
              <div class="oz-step-head-icon" style="background:color-mix(in oklab,var(--success) 10%,transparent)">
                <AppIcon name="Globe2" :size="22" :stroke-width="1.7" style="color:var(--success)"/>
              </div>
              <div>
                <h1 class="oz-h1">Manba kanallarni tanlang</h1>
                <p class="oz-sub">Qaysi kanallardan kontentni kuzatmoqchisiz? Istalgan vaqtda o'zgartirish mumkin.</p>
              </div>
            </div>

            <AppPanel :padding="0">
              <!-- Toolbar -->
              <div style="padding:14px 18px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:10px;border-radius:12px 12px 0 0">
                <div style="flex:1;display:flex;align-items:center;gap:6px;height:34px;padding:0 10px;background:var(--bg-2);border:1px solid var(--border);border-radius:var(--r-sm)">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>
                  <input v-model="sourceSearch" placeholder="Kanal nomi bo'yicha qidirish..."
                    style="flex:1;border:none;outline:none;background:transparent;font-size:13px;color:var(--text)"/>
                </div>
                <button @click="toggleAllSources"
                  :style="{
                    height:'34px',padding:'0 12px',fontSize:'12px',fontWeight:500,cursor:'pointer',
                    background: allSelected ? 'var(--panel-2)' : 'var(--accent-bg)',
                    border: `1px solid ${allSelected ? 'var(--border)' : 'color-mix(in oklab,var(--accent) 30%,transparent)'}`,
                    color: allSelected ? 'var(--muted)' : 'var(--accent)',
                    borderRadius:'6px',whiteSpace:'nowrap',display:'inline-flex',alignItems:'center',gap:'6px',flexShrink:0,
                  }">
                  <svg v-if="!allSelected" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><polyline points="20 6 9 17 4 12"/></svg>
                  <svg v-else width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M18 6 6 18M6 6l12 12"/></svg>
                  {{ allSelected ? 'Barchasini bekor qilish' : 'Barchasini tanlash' }}
                </button>
                <span style="font-size:11.5px;color:var(--muted);white-space:nowrap;flex-shrink:0">
                  <span style="font-weight:600;color:var(--text)">{{ selectedSources.length }}</span> / {{ sourceChannels.length }}
                </span>
              </div>

              <!-- Channel grid -->
              <div style="max-height:460px;overflow-y:auto;padding:8px">
                <template v-for="group in groupedChannels" :key="group.cat">
                  <div style="padding:10px 8px 6px;display:flex;align-items:center;gap:8px">
                    <span style="font-size:10px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.08em">{{ group.cat }}</span>
                    <span style="font-size:10.5px;color:var(--muted)">· {{ group.channels.length }}</span>
                    <div style="flex:1;height:1px;background:var(--border-2)"/>
                  </div>
                  <div style="display:grid;grid-template-columns:1fr 1fr;gap:2px;margin-bottom:4px">
                    <div v-for="ch in group.channels" :key="ch.id"
                      @click="toggleSource(ch.id)"
                      :style="{
                        display:'flex',alignItems:'center',gap:'10px',padding:'8px 10px',
                        borderRadius:'8px',cursor:'pointer',transition:'background .1s',
                        background: selectedSources.includes(ch.id) ? 'var(--accent-bg)' : 'transparent',
                      }">
                      <div :style="{ width:'32px',height:'32px',borderRadius:'9px',background:ch.color,flexShrink:0,display:'inline-flex',alignItems:'center',justifyContent:'center' }">
                        <span style="color:white;font-size:12px;font-weight:700;line-height:1">{{ ch.name[0] }}</span>
                      </div>
                      <div style="flex:1;min-width:0">
                        <div style="font-size:12.5px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">{{ ch.name }}</div>
                        <div style="font-size:10.5px;color:var(--muted);font-family:var(--font-mono)">{{ ch.username }}</div>
                      </div>
                      <span :style="{
                        width:'17px',height:'17px',borderRadius:'5px',flexShrink:0,
                        background: selectedSources.includes(ch.id) ? 'var(--accent)' : 'transparent',
                        border: `1.5px solid ${selectedSources.includes(ch.id) ? 'var(--accent)' : 'var(--border)'}`,
                        display:'inline-flex',alignItems:'center',justifyContent:'center',transition:'all .12s',
                      }">
                        <svg v-if="selectedSources.includes(ch.id)" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
                      </span>
                    </div>
                  </div>
                </template>
                <div v-if="groupedChannels.length===0" style="text-align:center;padding:40px;color:var(--muted);font-size:13px">
                  "{{ sourceSearch }}" bo'yicha hech narsa topilmadi
                </div>
              </div>

              <!-- Footer nav -->
              <div style="padding:14px 18px;border-top:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;border-radius:0 0 12px 12px">
                <AppButton variant="secondary" size="lg" @click="step=3">
                  <template #icon><AppIcon name="ChevronL" :size="14"/></template>Orqaga
                </AppButton>
                <AppButton variant="primary" size="lg" :loading="submitting" @click="submitStep4">
                  Davom etish — tarif tanlash<template #icon-right><AppIcon name="ChevronR" :size="14"/></template>
                </AppButton>
              </div>
            </AppPanel>
          </div>

          <!-- ────────── STEP 5: Tarif ────────── -->
          <div v-else-if="step === 5" style="width:100%">
            <div style="text-align:center;margin-bottom:28px">
              <h1 class="oz-h1" style="margin:0 0 6px">Sizga mos tarifni tanlang</h1>
              <p style="margin:0;color:var(--muted);font-size:13.5px">
                Barcha tariflarda <strong style="color:var(--text)">3 kun bepul sinab ko'rish</strong> · istalgan vaqtda o'zgartirish mumkin
              </p>
              <!-- Billing toggle -->
              <div style="display:inline-flex;margin-top:18px;padding:3px;background:var(--panel);border:1px solid var(--border);border-radius:999px;box-shadow:var(--shadow-sm)">
                <button v-for="o in [{id:'monthly',label:'Oylik'},{id:'yearly',label:'Yillik — 15% chegirma'}]" :key="o.id"
                  @click="billingCycle=o.id"
                  :style="{
                    height:'30px',padding:'0 16px',fontSize:'12px',fontWeight:500,
                    background: billingCycle===o.id ? 'var(--accent)' : 'transparent',
                    color: billingCycle===o.id ? 'white' : 'var(--muted)',
                    border:'none',borderRadius:'999px',cursor:'pointer',transition:'all .18s',
                  }">{{ o.label }}</button>
              </div>
            </div>

            <div style="max-width:520px;margin:0 auto 16px"><ApiError :msg="apiError"/></div>

            <!-- Empty state -->
            <div v-if="!plans.length" style="text-align:center;padding:40px;color:var(--muted);font-size:13px">
              Tariflar yuklanmadi. Sahifani yangilang yoki birozdan keyin urinib ko'ring.
            </div>

            <!-- Plan cards -->
            <div v-else style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;margin-bottom:24px">
              <div v-for="p in plans" :key="p.id" @click="chosen=p.id"
                :style="{
                  background:'var(--panel)',
                  border: `2px solid ${chosen===p.id ? 'var(--accent)' : 'var(--border)'}`,
                  borderRadius:'14px',padding:'20px 16px',cursor:'pointer',position:'relative',
                  boxShadow: chosen===p.id ? '0 0 0 5px var(--accent-bg),var(--shadow-sm)' : 'var(--shadow-sm)',
                  display:'flex',flexDirection:'column',gap:'10px',transition:'all .18s',
                }">
                <div v-if="p.tag" style="position:absolute;top:-11px;left:16px;padding:2px 10px;font-size:10px;font-weight:700;background:var(--accent);color:white;border-radius:999px;text-transform:uppercase;letter-spacing:.06em">{{ p.tag }}</div>
                <div style="display:flex;align-items:center;justify-content:space-between">
                  <span style="font-size:14px;font-weight:700">{{ p.name }}</span>
                  <span :style="{
                    width:'18px',height:'18px',borderRadius:'999px',
                    background: chosen===p.id ? 'var(--accent)' : 'transparent',
                    border: `2px solid ${chosen===p.id ? 'var(--accent)' : 'var(--border)'}`,
                    display:'inline-flex',alignItems:'center',justifyContent:'center',transition:'all .15s',
                  }">
                    <svg v-if="chosen===p.id" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
                  </span>
                </div>
                <p style="margin:0;font-size:11.5px;color:var(--muted);min-height:30px;line-height:1.4">{{ p.desc }}</p>
                <div style="display:flex;align-items:baseline;gap:4px">
                  <span v-if="p.free" style="font-size:24px;font-weight:700;color:var(--success)">Bepul</span>
                  <template v-else>
                    <span class="tabular" style="font-size:20px;font-weight:700">{{ fmtSom(billingCycle==='yearly' ? Math.round(p.price*12*0.85) : p.price) }}</span>
                    <span style="font-size:10.5px;color:var(--muted)">so'm/{{ billingCycle==='monthly' ? 'oy' : 'yil' }}</span>
                  </template>
                </div>
                <div v-if="!p.free" style="display:inline-flex;align-items:center;gap:5px;padding:3px 8px;background:color-mix(in oklab,var(--success) 10%,transparent);border:1px solid color-mix(in oklab,var(--success) 22%,transparent);border-radius:999px;width:fit-content">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--success)" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  <span style="font-size:10px;font-weight:600;color:var(--success)">3 kun bepul sinash</span>
                </div>
                <div style="height:1px;background:var(--border-2)"/>
                <ul style="margin:0;padding:0;list-style:none;display:flex;flex-direction:column;gap:5px">
                  <li v-for="item in p.includes" :key="item" style="display:flex;align-items:flex-start;gap:6px;font-size:11px;color:var(--text-2)">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--success)" stroke-width="2.5" style="margin-top:1px;flex-shrink:0"><polyline points="20 6 9 17 4 12"/></svg>
                    <span>{{ item }}</span>
                  </li>
                </ul>
              </div>
            </div>

            <!-- Sticky summary bar -->
            <div style="position:sticky;bottom:0;background:var(--panel);border:1px solid var(--border);border-radius:14px;padding:14px 20px;display:flex;align-items:center;gap:16px;box-shadow:var(--shadow-md)">
              <div style="display:flex;flex-direction:column">
                <span style="font-size:10.5px;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;font-weight:600">Jami {{ billingCycle==='monthly' ? 'oyiga' : 'yiliga' }}</span>
                <div style="display:flex;align-items:baseline;gap:6px">
                  <span v-if="currentPlan.free" style="font-size:22px;font-weight:700;color:var(--success)">Bepul</span>
                  <template v-else>
                    <span class="tabular" style="font-size:22px;font-weight:700">{{ fmtSom(finalPrice) }}</span>
                    <span style="font-size:12px;color:var(--muted)">so'm</span>
                    <AppBadge v-if="billingCycle==='yearly'" tone="success">−15%</AppBadge>
                  </template>
                </div>
              </div>
              <div style="flex:1;font-size:11.5px;color:var(--muted)">
                <template v-if="!currentPlan.free">3 kun bepul sinash · sinash tugagandan keyin to'lov olinadi</template>
              </div>
              <AppButton variant="secondary" size="lg" @click="goToStep(2)">
                <template #icon><AppIcon name="ChevronL" :size="14"/></template>Orqaga
              </AppButton>
              <AppButton v-if="currentPlan.free" variant="primary" size="lg" :loading="submitting" @click="submitStep5">
                <template #icon><AppIcon name="Bolt" :size="14"/></template>Ishni boshlash
              </AppButton>
              <AppButton v-else variant="primary" size="lg" :loading="submitting" @click="submitStep5">
                To'lovga o'tish<template #icon-right><AppIcon name="ChevronR" :size="14"/></template>
              </AppButton>
            </div>
          </div>

          <!-- ────────── STEP 6: To'lov ────────── -->
          <div v-else-if="step === 6" style="max-width:900px;margin:0 auto;width:100%;display:grid;grid-template-columns:1.4fr 1fr;gap:20px">
            <div>
              <div class="oz-step-head">
                <div class="oz-step-head-icon" style="background:color-mix(in oklab,var(--accent) 10%,transparent)">
                  <AppIcon name="Coin" :size="22" :stroke-width="1.7" style="color:var(--accent)"/>
                </div>
                <div>
                  <h1 class="oz-h1" style="font-size:20px">Qanday boshlaysiz?</h1>
                  <p class="oz-sub">Bepul sinab ko'ring yoki to'lov usulini biriktiring</p>
                </div>
              </div>

              <AppPanel :padding="20">
                <div style="display:flex;flex-direction:column;gap:6px">
                  <!-- Trial -->
                  <div @click="payMethod='trial'"
                    :style="{
                      display:'flex',alignItems:'center',gap:'12px',padding:'12px 14px',borderRadius:'10px',cursor:'pointer',
                      background: payMethod==='trial' ? 'color-mix(in oklab,var(--success) 8%,transparent)' : 'var(--panel-2)',
                      border: `1.5px solid ${payMethod==='trial' ? 'color-mix(in oklab,var(--success) 35%,transparent)' : 'var(--border)'}`,
                      transition:'all .15s',
                    }">
                    <div style="width:36px;height:36px;border-radius:10px;background:color-mix(in oklab,var(--success) 12%,transparent);border:1px solid color-mix(in oklab,var(--success) 22%,transparent);display:inline-flex;align-items:center;justify-content:center;flex-shrink:0">
                      <AppIcon name="Bolt" :size="16" :stroke-width="1.8" style="color:var(--success)"/>
                    </div>
                    <div style="flex:1">
                      <div style="font-size:13px;font-weight:600">3 kun bepul sinash</div>
                      <div style="font-size:11px;color:var(--muted);margin-top:1px">Hech qanday to'lov talab qilinmaydi</div>
                    </div>
                    <span :style="{
                      width:'20px',height:'20px',borderRadius:'999px',flexShrink:0,
                      background: payMethod==='trial' ? 'var(--success)' : 'transparent',
                      border: `1.5px solid ${payMethod==='trial' ? 'var(--success)' : 'var(--border)'}`,
                      display:'inline-flex',alignItems:'center',justifyContent:'center',transition:'all .15s',
                    }">
                      <svg v-if="payMethod==='trial'" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.6"><polyline points="20 6 9 17 4 12"/></svg>
                    </span>
                  </div>

                  <div style="display:flex;align-items:center;gap:10px;margin:4px 0">
                    <div style="flex:1;height:1px;background:var(--border)"/>
                    <span style="font-size:11px;color:var(--muted)">yoki to'lov usulini biriktiring</span>
                    <div style="flex:1;height:1px;background:var(--border)"/>
                  </div>

                  <label v-for="m in payMethods" :key="m.id"
                    :style="{
                      display:'flex',alignItems:'center',gap:'10px',padding:'10px 12px',borderRadius:'8px',cursor:'pointer',
                      background: payMethod===m.id ? 'var(--accent-bg)' : 'var(--panel-2)',
                      border: `1.5px solid ${payMethod===m.id ? 'color-mix(in oklab,var(--accent) 35%,transparent)' : 'var(--border)'}`,
                      transition:'all .15s',
                    }">
                    <input type="radio" :checked="payMethod===m.id" @change="payMethod=m.id" style="accent-color:var(--accent)"/>
                    <div style="flex:1">
                      <div style="font-size:12.5px;font-weight:600">{{ m.name }}</div>
                      <div style="font-size:11px;color:var(--muted)">{{ m.hint }}</div>
                    </div>
                  </label>

                  <div v-if="payMethod!=='trial'"
                    style="margin-top:6px;padding:10px 12px;background:var(--bg-2);border:1px solid var(--border);border-radius:8px;display:flex;align-items:flex-start;gap:8px">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" stroke-width="1.8" style="flex-shrink:0;margin-top:1px"><circle cx="12" cy="12" r="9"/><path d="M12 8v4M12 16h.01"/></svg>
                    <span style="font-size:11.5px;color:var(--muted);line-height:1.5">
                      Bugun hech qanday to'lov olinmaydi. 3 kun sinashdan keyin
                      <strong style="color:var(--text)">{{ fmtSom(finalPrice) }} so'm</strong>
                      to'lov olinadi.
                    </span>
                  </div>
                </div>

                <div style="display:flex;justify-content:space-between;margin-top:18px">
                  <AppButton variant="secondary" size="lg" @click="step=5">
                    <template #icon><AppIcon name="ChevronL" :size="14"/></template>Orqaga
                  </AppButton>
                  <AppButton variant="primary" size="lg" :loading="submitting" @click="submitStep6">
                    <template #icon><AppIcon :name="payMethod==='trial' ? 'Bolt' : 'Check'" :size="14"/></template>
                    {{ payMethod==='trial' ? "Bepul sinashni boshlash" : "To'lovga o'tish" }}
                  </AppButton>
                </div>
              </AppPanel>
            </div>

            <!-- Order summary -->
            <AppPanel title="Buyurtma" :dense="true">
              <div style="display:flex;flex-direction:column;gap:6px">
                <div v-for="r in orderRows" :key="r.label"
                  style="display:flex;align-items:center;justify-content:space-between;padding:5px 0;font-size:12.5px">
                  <span style="color:var(--text-2)">{{ r.label }}</span>
                  <span :style="{ fontWeight:500,color: r.tone==='success' ? 'var(--success)' : 'var(--text)' }">{{ r.value }}</span>
                </div>
                <div style="height:1px;background:var(--border-2);margin:4px 0"/>
                <div style="display:flex;align-items:center;justify-content:space-between;padding:5px 0">
                  <span style="font-size:12.5px;color:var(--text-2)">Bugun</span>
                  <span style="font-size:18px;font-weight:700;color:var(--success)">0 so'm</span>
                </div>
                <p style="font-size:11px;color:var(--muted);margin:4px 0 0;line-height:1.5">
                  <template v-if="currentPlan.free">Hech qanday to'lov olinmaydi.</template>
                  <template v-else>3 kun sinashdan keyin {{ fmtSom(finalPrice) }} so'm yechib olinadi.</template>
                </p>
              </div>
            </AppPanel>
          </div>

        </div><!-- /oz-page -->
      </Transition>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, defineComponent, h, watch } from 'vue'
import { useRouter } from 'vue-router'
import AppButton from '@/components/ui/AppButton.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import AppPanel from '@/components/ui/AppPanel.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import BrandLogo from '@/components/layout/BrandLogo.vue'
import LangSwitcher from '@/components/layout/LangSwitcher.vue'
import { fmtSom } from '@/i18n/index.js'
import { useAuthStore } from '@/stores/auth.js'
import { referencesApi } from '@/api/references.js'
import { companiesApi } from '@/api/companies.js'
import { onboardingApi } from '@/api/onboarding.js'
import { channelsApi } from '@/api/channels.js'
import { tariffsApi } from '@/api/tariffs.js'
import { subscriptionsApi } from '@/api/subscriptions.js'
import { paymentsApi } from '@/api/payments.js'
import { useClickPayment } from '@/composables/useClickPayment.js'

// ── Inline UI helpers ─────────────────────────────────────────
const VField = defineComponent({
  props: { label: String, error: String, required: Boolean },
  setup(props, { slots }) {
    return () => h('div', { style: 'display:flex;flex-direction:column;gap:5px;' }, [
      h('label', { style: 'font-size:11px;color:var(--muted);font-weight:600;text-transform:uppercase;letter-spacing:.04em;display:flex;align-items:center;gap:3px;' }, [
        props.label,
        props.required ? h('span', { style: 'color:var(--danger);' }, '*') : null,
      ]),
      slots.default?.(),
      props.error ? h('span', { style: 'font-size:11px;color:var(--danger);' }, props.error) : null,
    ])
  }
})

const VInput = defineComponent({
  props: { modelValue: [String, Number], type: { default: 'text' }, placeholder: String, error: Boolean, mono: Boolean },
  emits: ['update:modelValue', 'input'],
  setup(props, { emit, slots }) {
    return () => h('div', {
      style: `display:flex;align-items:center;height:36px;padding:0 11px;gap:7px;
        background:var(--panel);
        border:1px solid ${props.error ? 'var(--danger)' : 'var(--border)'};
        border-radius:var(--r-sm);
        transition:border-color .15s,box-shadow .15s;
        ${props.error ? 'box-shadow:0 0 0 3px color-mix(in oklab,var(--danger) 12%,transparent);' : ''}`,
    }, [
      h('input', {
        type: props.type,
        value: props.modelValue,
        placeholder: props.placeholder,
        onInput: ev => { emit('update:modelValue', ev.target.value); emit('input', ev) },
        style: `flex:1;border:none;outline:none;background:transparent;font-size:13px;color:var(--text);
          font-family:${props.mono ? 'var(--font-mono)' : 'inherit'};`,
      }),
      slots.suffix?.(),
    ])
  }
})

const StrengthBar = defineComponent({
  props: { password: String },
  setup(props) {
    const score = computed(() => {
      const p = props.password || ''
      if (!p) return 0
      let s = 0
      if (p.length >= 8) s++
      if (/[A-Z]/.test(p)) s++
      if (/[0-9]/.test(p)) s++
      if (/[^A-Za-z0-9]/.test(p)) s++
      return s
    })
    const labels = ['', 'Juda zaif', 'Zaif', 'Yaxshi', 'Kuchli']
    const colors = ['', '#ef4444', '#f59e0b', '#3b82f6', '#22c55e']
    return () => props.password ? h('div', { style: 'margin-top:7px;' }, [
      h('div', { style: 'display:flex;gap:4px;margin-bottom:5px;' },
        [1, 2, 3, 4].map(i => h('div', {
          style: `flex:1;height:3.5px;border-radius:3px;transition:background .3s;
            background:${i <= score.value ? colors[score.value] : 'var(--border)'};`,
        }))
      ),
      score.value > 0 ? h('span', { style: `font-size:10.5px;color:${colors[score.value]};font-weight:600;` }, labels[score.value]) : null,
    ]) : null
  }
})

const ApiError = defineComponent({
  props: { msg: String },
  setup(props) {
    return () => props.msg ? h('div', {
      style: 'padding:10px 12px;background:color-mix(in oklab,var(--danger) 8%,transparent);border:1px solid color-mix(in oklab,var(--danger) 20%,transparent);border-radius:8px;font-size:12.5px;color:var(--danger);display:flex;align-items:flex-start;gap:8px;',
    }, [
      h('svg', { width: 14, height: 14, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '1.8', style: 'flex-shrink:0;margin-top:1px;' }, [
        h('circle', { cx: 12, cy: 12, r: 9 }),
        h('path', { d: 'M12 8v4M12 16h.01' }),
      ]),
      h('span', props.msg),
    ]) : null
  }
})

// ── Router & stores ───────────────────────────────────────────
const router = useRouter()
const authStore = useAuthStore()

// ── Transition state ──────────────────────────────────────────
const transitioning = ref(false)
const nextStep = ref(1)

const stepIconMap = { 1: 'Shield', 2: 'Building', 3: 'Telegram', 4: 'Globe2', 5: 'Tag', 6: 'Coin' }
const stepFullLabels = { 1: 'Hisob ma\'lumotlari', 2: 'Kompaniya ma\'lumotlari', 3: 'Ijtimoiy tarmoqlar', 4: 'Manba kanallar', 5: 'Tarif tanlash', 6: 'To\'lov usuli' }
const veilLabel = computed(() => stepFullLabels[nextStep.value] || '')

const sleep = ms => new Promise(r => setTimeout(r, ms))

async function goToStep(n) {
  nextStep.value = n
  transitioning.value = true
  await sleep(640)        // arc animation plays (600ms) + buffer
  step.value = n
  e.value = {}
  apiError.value = ''
  await nextTick()
  await sleep(60)
  transitioning.value = false
  if (n === 3) {
    await loadTgChannels()
    if (tgChannels.value.some(c => c.status === 'pending_admin')) startTgPolling()
  } else {
    stopTgPolling()
  }
}

// ── Step state ────────────────────────────────────────────────
const step = ref(1)
const submitting = ref(false)
const apiError = ref('')
const e = ref({})

function clearErr(key) { delete e.value[key]; apiError.value = '' }

// Progress % for the top stripe
const progressPct = computed(() => ((step.value - 1) / (visibleSteps.value.length - 1)) * 100)

// ── Step 1 ────────────────────────────────────────────────────
const showPass = ref(false)
const f1 = ref({ full_name: '', email: '', password: '', accept_terms: false })

function validateStep1() {
  const errs = {}
  if (!f1.value.full_name.trim()) errs.full_name = "To'liq ism kiritilishi shart"
  if (!f1.value.email.trim()) errs.email = 'Email kiritilishi shart'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f1.value.email)) errs.email = "Email formati noto'g'ri"
  if (!f1.value.password) errs.password = 'Parol kiritilishi shart'
  else if (f1.value.password.length < 6) errs.password = "Parol kamida 6 ta belgidan iborat bo'lishi kerak"
  if (!f1.value.accept_terms) errs.accept_terms = "Shartlarni qabul qilishingiz shart"
  e.value = errs
  return Object.keys(errs).length === 0
}

async function submitStep1() {
  if (!validateStep1()) return
  submitting.value = true
  apiError.value = ''
  try {
    const res = await authStore.register({
      full_name: f1.value.full_name,
      email: f1.value.email,
      password: f1.value.password,
      accept_terms: f1.value.accept_terms,
    })
    submitting.value = false
    let resumeStep = Math.min(Math.max(res?.onboarding?.current_step ?? 2, 2), 6)
    // 3,4 olib tashlangan — bularda qolib ketgan user'larni 5 (Tarif)ga ko'taramiz
    if (resumeStep === 3 || resumeStep === 4) resumeStep = 5
    await goToStep(resumeStep)
    loadReferences()
    if (resumeStep > 2) await loadOnboardingState()
  } catch (err) {
    apiError.value = authStore.error || "Xatolik yuz berdi. Qayta urinib ko'ring."
    submitting.value = false
  }
}

async function loadOnboardingState() {
  try {
    const s = await onboardingApi.getSession()
    const stepData = s?.step_data || {}
    if (stepData.step_2?.company_id) companyId.value = stepData.step_2.company_id
  } catch { /* ignore */ }
}

// ── Step 2 ────────────────────────────────────────────────────
const f2 = ref({ name: '', location: '', business_type_id: null, phones: [''] })
const businessTypes = ref([])
const companyId = ref(null)

function validateStep2() {
  const errs = {}
  if (!f2.value.name.trim()) errs.company_name = "Kompaniya nomi kiritilishi shart"
  e.value = errs
  return Object.keys(errs).length === 0
}

async function submitStep2() {
  if (!validateStep2()) return
  submitting.value = true
  apiError.value = ''
  try {
    const phones = f2.value.phones.filter(p => p.trim())
    const company = await companiesApi.create({
      name: f2.value.name,
      location: f2.value.location || undefined,
      business_type_id: f2.value.business_type_id || undefined,
      phones,
    })
    companyId.value = company.id
    await onboardingApi.updateStep(2, { company_id: company.id })
    submitting.value = false
    // Step 3 (Tarmoqlar) va 4 (Manbalar) olib tashlandi — to'g'ridan-to'g'ri tarifga
    await goToStep(5)
  } catch (err) {
    const msg = err.response?.data?.message
    apiError.value = Array.isArray(msg) ? msg.join('. ') : (msg || 'Xatolik yuz berdi')
    submitting.value = false
  }
}

// ── Step 3 ────────────────────────────────────────────────────
const platformsForStep = ref([])
const selectedPlatforms = ref(['telegram'])

// Telegram URL-based connect flow
const tgChannels = ref([])        // [{id, username, display_name, status, posting_mode, ...}]
const tgNewUrl = ref('')
const tgNewMode = ref('auto')     // 'auto' | 'manual' — yangi kanal uchun rejim
const tgAdding = ref(false)
const tgError = ref('')
const tgDeepLink = ref('')         // bot deep_link, init javobidan keladi
let tgPollTimer = null

// ── AI assistent sozlamalari (Avtomatik rejim uchun) ──────────
const TOPIC_PRESETS = [
  { id: 'jahon', label: 'Jahon', desc: 'Faqat xalqaro voqealar' },
  { id: 'siyosat', label: 'Siyosat', desc: 'Davlat, diplomatiya, qarorlar' },
  { id: 'iqtisod', label: 'Iqtisodiyot', desc: 'Bozor, narx, biznes' },
  { id: 'sport', label: 'Sport', desc: 'Futbol, boks, olimpiada' },
  { id: 'texnologiya', label: 'Texnologiya', desc: 'IT, AI, gadjet' },
  { id: 'madaniyat', label: 'Madaniyat', desc: 'Kino, musiqa, san\'at' },
  { id: 'jamiyat', label: 'Jamiyat', desc: 'Mahalliy voqealar, O\'zbekiston' },
  { id: 'all', label: 'Barchasi', desc: 'Mavzu cheklovi yo\'q' },
]
const ai = ref({
  topics: ['all'],     // tanlangan mavzu(lar)
  onlyNews: true,
  stripSource: true,
  paraphrase: true,
  prefixSource: true,
  extra: '',
  showPrompt: false,
})
function toggleTopic(id) {
  if (id === 'all') {
    ai.value.topics = ['all']
    return
  }
  const list = ai.value.topics.filter(t => t !== 'all')
  const i = list.indexOf(id)
  if (i >= 0) list.splice(i, 1)
  else list.push(id)
  ai.value.topics = list.length ? list : ['all']
}

const compiledPrompt = computed(() => {
  const lines = []
  lines.push("Siz O'zbek tilidagi yangiliklar uchun AI muharrirsiz.")
  lines.push("Sizning vazifangiz HAR DOIM kiritilgan postni qayta yozish.")
  lines.push("HECH QACHON bo'sh javob qaytarmang — bo'sh javob XATO.")
  lines.push('')
  lines.push("Faqat HARD cheklov buzilsa: '#SKIP' so'zini qaytaring (bo'sh string emas).")
  lines.push('')

  // ─── KLASSIFIKATOR ───────────────────────────────────────
  if (ai.value.onlyNews) {
    lines.push('━━━ 1-BOSQICH: KLASSIFIKATSIYA ━━━')
    lines.push('ASOSIY QOIDA: agar matnda kim/qachon/qaerda nima QILDI yoki nima BO\'LDI — bu XABAR.')
    lines.push('Hatto matn 1-2 jumla bo\'lsa ham (havola/promo qatorlar bilan) — agar FAKT bo\'lsa — bu XABAR.')
    lines.push('')
    lines.push('XABAR deb hisoblang (qabul qiling):')
    lines.push('  ✓ "X Y bilan uchrashdi" / "X bayonot berdi" / "X ga tashrif buyurdi"')
    lines.push('  ✓ "X bo\'lib o\'tdi" / "X yakunlandi" / "X boshlandi"')
    lines.push('  ✓ Rasmiy qaror, farmon, qonun, statistika, hisobot')
    lines.push('  ✓ Sport natijasi, jang/o\'yin yakuni, hisob, mukofot')
    lines.push('  ✓ Iqtisodiy ko\'rsatkich, narx, valyuta kursi')
    lines.push('  ✓ Tabiiy hodisa, ofat, baxtsiz hodisa')
    lines.push('  ✓ Texnologiya/ilm-fan, kompaniya e\'loni')
    lines.push('  ✓ Siyosiy yangilik (uchrashuv, kelishuv, tayinlanish)')
    lines.push('')
    lines.push('  → Matn qisqa bo\'lsa ham, havola bor bo\'lsa ham — fakt bo\'lsa kifoya, QABUL QILING')
    lines.push('')
    lines.push('XABAR EMAS deb hisoblang (BO\'SH JAVOB qaytaring) — aniq turlar:')
    lines.push('  ✗ Podcast, ko\'rsatuv, video-blog ANONSI ("Yangi son chiqdi", "Eshiting")')
    lines.push('  ✗ Kitob/qissa/hikoya TAHLILI ("X asarida nima haqida gap ketadi")')
    lines.push('  ✗ Falsafiy/motivatsion/shaxsiy fikr / esse / kolumka')
    lines.push('  ✗ Viktorina / test')
    lines.push('  ✗ Reklama / vakansiya / kurs taklifi')
    lines.push('  ✗ Intervyu transkripti ("Mehmonimiz X")')
    lines.push('  ✗ Tabriklash / hayrlashuv / tahririyat lichniy gapi')
    lines.push('  ✗ KLIKBEYT-ogohlantirish (⚠️ + BOSH HARFLAR + "JARIMA"/"DIQQAT" + maslahat/qo\'llanma)')
    lines.push('  ✗ Yuridik MASLAHAT-qo\'llanma ("Qanday saqlanish", "Nima qilish lozim")')
    lines.push('  ✗ Viral zanjir ("Yaqinlarga yuboring") — agar BUTUN POST shu chaqiriq atrofida bo\'lsa')
    lines.push('  ✗ Folbinlik / horoskop')
    lines.push('')
    lines.push('MUHIM: havola, "Batafsil 👇", "👉 link", obuna qatori ("RASMIY|LIVE|SPORT")')
    lines.push('XABAR EMASLIGINI BILDIRMAYDI. Bular shunchaki kanal stilistikasi — siz ularni TASHLAB qo\'yasiz,')
    lines.push('lekin post mazmuni XABAR bo\'lsa qabul qilasiz.')
    lines.push('')
    lines.push('SHUBHA BO\'LSA — qabul qiling. Faqat yuqorida sanab o\'tilgan turlarni rad eting.')
    lines.push('')
    lines.push('━━━ 2-BOSQICH: faqat 1-bosqich "XABAR" bo\'lsa bajariladi ━━━')
  }

  lines.push('QAYTA YOZISH QOIDALARI:')
  if (ai.value.stripSource) {
    lines.push('• Manba nomi va havolalarini matn ichidan TO\'LIQ OLIB TASHLANG:')
    lines.push('    - "Kun.uz rasmiy kanali", "Kun.uz расмий канали" — o\'chirilsin')
    lines.push('    - "Manba: @kunuzofficial", "Manba: @@kunuzofficial" — o\'chirilsin')
    lines.push('    - Har qanday t.me/* yoki kun.uz/* yoki boshqa sayt havolalari — o\'chirilsin')
    lines.push('    - "👉 link", "Batafsil:", "To\'liq:" kabi havola-qo\'shimchalari — o\'chirilsin')
    lines.push('    - @username, #hashtag, emoji-strelkalar (👉, ➡️) — o\'chirilsin')
  }
  if (ai.value.paraphrase) {
    lines.push('• Telegram posti sifatida KENGAYTIRIB yozing (shunchaki paraphrase emas):')
    lines.push('  - Boshida e\'tibor tortuvchi sarlavha + emoji (📢 🌙 🚌 🎫 ⚡️)')
    lines.push('  - 3-5 paragraf: sarlavha → asosiy xabar → kontekst/tafsilot → praktik xulosa')
    lines.push('  - Kontekst qo\'shing: nima uchun, kim uchun, qachondan, foydasi nimada')
    lines.push('  - Tilda murojaat: "yurtdoshlar", "vatandoshlar"')
    lines.push('  - Oxirida foydali maslahat/tavsiya bo\'lishi mumkin')
    lines.push('  - O\'rtacha uzunlik: 80-200 so\'z (asl matn qisqa bo\'lsa ham — kontekst bilan kengaytiring)')
    lines.push('  - Cyrillic kelgan bo\'lsa — javobni LOTIN da bering')
  }
  if (ai.value.prefixSource) {
    lines.push('• Tayyor matn BIRINCHI jumlasi MAJBURAN "<Manba nomi> xabar berishicha, …" formatida boshlansin.')
    lines.push('  Misol: "Kun.uz xabar berishicha, …"')
    lines.push('  Bu qoida buzilmaydi — har qanday qayta yozilgan post shu prefiks bilan boshlanadi.')
  }
  lines.push('')

  lines.push('MAJBURIY CHEKLOVLAR (BUZILMAYDI):')
  lines.push('• ISLOMIY / diniy mavzudagi har qanday kontent — ASLO o\'tkazilmaydi. BO\'SH JAVOB.')
  lines.push('  (oddiy diniy bayram xabarlari, rasmiy tabriklar mustasno — ular qabul qilinadi)')
  lines.push('• O\'ZBEKISTON RESPUBLIKASIga TANQID yoki salbiy fikr — ASLO o\'tkazilmaydi.')
  lines.push('  (lekin O\'zbekiston haqida oddiy yangiliklar — iqtisod, sport, voqealar — QABUL QILINADI)')
  lines.push('• PREZIDENT va OILA A\'ZOLARI haqidagi TANQID/SALBIY/YOMON kontent — ASLO o\'tkazilmaydi.')
  lines.push('  MUHIM AYIRMA:')
  lines.push('    ✓ QABUL — rasmiy uchrashuv, tashrif, bayonot, tayinlanish, mukofot, neytral/musbat xabar')
  lines.push('      Misol: "Saida Mirziyoyeva Marko Rubio bilan uchrashdi" — QABUL')
  lines.push('      Misol: "Prezident Janubiy Koreyaga tashrif buyurdi" — QABUL')
  lines.push('    ✗ RAD — tanqid, qoralash, ayblash, fosh qilish, mish-mish')
  lines.push('      Misol: "Prezident oilasi korrupsiyada ayblanmoqda" — RAD')
  lines.push('  Demak: HAR QANDAY post emas, balki faqat SALBIY/TANQIDIY mazmunli post rad etiladi.')

  if (ai.value.extra && ai.value.extra.trim()) {
    lines.push('')
    lines.push('QO\'SHIMCHA KO\'RSATMA:')
    lines.push(ai.value.extra.trim())
  }

  lines.push('')
  lines.push('━━━ JAVOB FORMATI ━━━')
  lines.push('Agar 1-bosqichdan o\'tmagan bo\'lsa yoki birorta cheklov buzilsa: BO\'SH STRING ("") qaytaring, hech narsa yozmang, izoh bermang.')
  lines.push('Agar o\'tgan bo\'lsa: faqat qayta yozilgan post matnini qaytaring (sarlavhalar, izohlar, "Mana:" kabi qo\'shimchalarsiz).')
  return lines.join('\n')
})

function togglePlatform(slug) {
  const i = selectedPlatforms.value.indexOf(slug)
  if (i >= 0) selectedPlatforms.value.splice(i, 1)
  else selectedPlatforms.value.push(slug)
}

async function loadTgChannels() {
  if (!companyId.value) return
  try {
    const list = await channelsApi.list(companyId.value)
    // faqat telegram (platform.slug)
    tgChannels.value = (list || []).filter(c => c.platform?.slug === 'telegram' || c.telegram_chat_id || c.username)
  } catch {}
}

async function addTgChannel() {
  tgError.value = ''
  const url = tgNewUrl.value.trim()
  if (!url) { tgError.value = 'URL kiriting'; return }
  if (!companyId.value) { tgError.value = 'Avval kompaniya yaratilishi kerak'; return }

  // dublikat oldini olish
  const norm = url.replace(/^https?:\/\//,'').replace(/^t\.me\//,'').replace(/^@/,'').toLowerCase()
  if (tgChannels.value.some(c => (c.username || '').toLowerCase() === '@' + norm)) {
    tgError.value = 'Bu kanal allaqachon ro\'yxatda bor'
    return
  }

  tgAdding.value = true
  try {
    const res = await channelsApi.initTelegram(companyId.value, url, tgNewMode.value)
    tgDeepLink.value = res.deep_link
    // mavjudni almashtirish yoki qo'shish
    const idx = tgChannels.value.findIndex(c => c.id === res.channel.id)
    if (idx >= 0) tgChannels.value.splice(idx, 1, res.channel)
    else tgChannels.value.push(res.channel)
    tgNewUrl.value = ''
    startTgPolling()
  } catch (err) {
    const msg = err.response?.data?.message
    tgError.value = Array.isArray(msg) ? msg.join('. ') : (msg || 'Kanal qo\'shilmadi')
  } finally {
    tgAdding.value = false
  }
}

async function removeTgChannel(id) {
  try {
    await channelsApi.remove(companyId.value, id)
    tgChannels.value = tgChannels.value.filter(c => c.id !== id)
  } catch {}
}

async function toggleChannelMode(ch) {
  const next = (ch.posting_mode || 'auto') === 'auto' ? 'manual' : 'auto'
  try {
    const updated = await channelsApi.setPostingMode(companyId.value, ch.id, next)
    const idx = tgChannels.value.findIndex(c => c.id === ch.id)
    if (idx >= 0) tgChannels.value.splice(idx, 1, updated)
  } catch {}
}

function startTgPolling() {
  stopTgPolling()
  tgPollTimer = setInterval(async () => {
    const pending = tgChannels.value.filter(c => c.status === 'pending_admin')
    if (!pending.length) { stopTgPolling(); return }
    for (const ch of pending) {
      try {
        const fresh = await channelsApi.getStatus(companyId.value, ch.id)
        const idx = tgChannels.value.findIndex(c => c.id === fresh.id)
        if (idx >= 0) tgChannels.value.splice(idx, 1, fresh)
      } catch {}
    }
  }, 2500)
}
function stopTgPolling() {
  if (tgPollTimer) { clearInterval(tgPollTimer); tgPollTimer = null }
}

onUnmounted(() => stopTgPolling())

function validateStep3() {
  const errs = {}
  if (selectedPlatforms.value.includes('telegram')) {
    const connected = tgChannels.value.filter(c => c.status === 'connected')
    if (!connected.length) {
      errs.channels = "Kamida 1 ta Telegram kanal ulanishi kerak. Botni kanalingizga admin qiling."
    }
  }
  e.value = errs
  return Object.keys(errs).length === 0
}

async function submitStep3() {
  if (!validateStep3()) return
  submitting.value = true
  apiError.value = ''
  try {
    await onboardingApi.updateStep(3, {
      ai_config: {
        mode: tgNewMode.value,
        topics: ai.value.topics.includes('all') ? [] : ai.value.topics
          .map(id => TOPIC_PRESETS.find(t => t.id === id)?.label)
          .filter(Boolean),
        only_news: ai.value.onlyNews,
        strip_source: ai.value.stripSource,
        paraphrase: ai.value.paraphrase,
        prefix_source: ai.value.prefixSource,
        extra: ai.value.extra || null,
        system_prompt: compiledPrompt.value,
        hard_rules: {
          no_islamic_content: true,
          no_uzbekistan_criticism: true,
          no_president_family_criticism: true,
        },
        publishing: {
          record_to_published_posts: true,   // har post posts ro'yxatiga qo'shiladi
          track_tokens_per_post: true,       // har post bilan ishlatilgan token saqlanadi
          count_against_monthly_quota: true, // tokenlar oylik tarif limitidan yechiladi
          pause_when_quota_exceeded: true,   // limit tugasa avtomatik yuborish to'xtatiladi
          no_ai_bypass: true,                // AI'ni chetlab o'tib post yuborib bo'lmaydi
          drop_when_ai_returns_empty: true,  // AI bo'sh javob qaytarsa post tashlanadi
          ignore_backlog_on_mode_switch: true, // rejim almashtirilganda eski postlar tashlanadi
        },
      },
    }).catch(() => {})
    submitting.value = false
    stopTgPolling()
    await goToStep(4)
  } catch {
    apiError.value = 'Xatolik yuz berdi'
    submitting.value = false
  }
}

// ── Step 4 ────────────────────────────────────────────────────
const sourceSearch = ref('')
const sourceChannels = [
  { id: 'kunuz', name: 'Kun.uz', username: '@kunuzofficial', url: 'https://t.me/kunuzofficial', cat: 'Milliy yangiliklar', color: '#E53935' },
  { id: 'daryo', name: 'Daryo.uz', username: '@daryouz_dunyo_yangilillar_uz', url: 'https://t.me/daryouz_dunyo_yangilillar_uz', cat: 'Milliy yangiliklar', color: '#1E88E5' },
  { id: 'dxx', name: 'DXX', username: '@dxx_uzbekiston_rasmiy_official', url: 'https://t.me/dxx_uzbekiston_rasmiy_official', cat: 'Milliy yangiliklar', color: '#0277BD' },
  { id: 'qalampir', name: 'Qalampir.uz', username: '@qalampir', url: 'https://t.me/qalampir', cat: 'Milliy yangiliklar', color: '#F4511E' },
]
const selectedSources = ref(sourceChannels.map(c => c.id))
const allSelected = computed(() => selectedSources.value.length === sourceChannels.length)
const groupedChannels = computed(() => {
  const q = sourceSearch.value.trim().toLowerCase()
  const filtered = q ? sourceChannels.filter(c => c.name.toLowerCase().includes(q) || c.username.toLowerCase().includes(q)) : sourceChannels
  const map = {}
  filtered.forEach(c => { if (!map[c.cat]) map[c.cat] = []; map[c.cat].push(c) })
  return Object.entries(map).map(([cat, channels]) => ({ cat, channels }))
})
function toggleSource(id) {
  const i = selectedSources.value.indexOf(id)
  if (i >= 0) selectedSources.value.splice(i, 1)
  else selectedSources.value.push(id)
}
function toggleAllSources() {
  selectedSources.value = allSelected.value ? [] : sourceChannels.map(c => c.id)
}
async function submitStep4() {
  submitting.value = true
  await onboardingApi.updateStep(4, {}).catch(() => {})
  submitting.value = false
  await goToStep(5)
}

// ── Step 5 ────────────────────────────────────────────────────
const chosen = ref('') // tanlangan tarif id (UUID)
const billingCycle = ref('monthly')
// Backend tariflari (arxivlanmagan, faol) — ro'yxat
const loadedTariffs = ref([])
// Step 5 da yaratilgan obuna id'si — Step 6 (to'lov) uchun kerak
const subscriptionId = ref(null)
const { payWithClick } = useClickPayment()

function i18nName(obj) {
  const lang = localStorage.getItem('lang') || 'uz'
  return obj?.[lang] || obj?.uz || ''
}
function tariffIncludes(t) {
  return [
    `Kuniga ${t.posts_daily_limit > 0 ? t.posts_daily_limit + ' ta xabar' : 'cheksiz'}`,
    `Oyiga ${Number(t.posts_monthly_limit) || 0} ta xabar`,
    `${Number(t.free_credits_monthly) || 0} bepul kredit/oy`,
    Number(t.credit_price_per_message) > 0
      ? `Qo'shimcha: ${fmtSom(t.credit_price_per_message)} so'm/xabar`
      : null,
  ].filter(Boolean)
}
// Plan kartalari to'g'ridan-to'g'ri backend tariflaridan quriladi (id = tarif UUID).
const plans = computed(() => loadedTariffs.value.map((t) => {
  const price = Number(t.price_monthly) || 0
  return {
    id: t.id,
    slug: t.slug,
    name: i18nName(t.name_i18n) || t.slug,
    tag: i18nName(t.category?.name_i18n) || null,
    desc: '',
    price,
    free: price === 0,
    includes: tariffIncludes(t),
  }
}))
const currentPlan = computed(() => plans.value.find(p => p.id === chosen.value) || plans.value[0] || { free: true, price: 0, includes: [] })
const finalPrice = computed(() => {
  const p = currentPlan.value
  if (p.free) return 0
  return billingCycle.value === 'yearly' ? Math.round(p.price * 12 * 0.85) : p.price
})
async function submitStep5() {
  submitting.value = true
  apiError.value = ''
  try {
    const tariffId = chosen.value
    if (!tariffId) throw new Error('Tarif yuklanmadi. Sahifani yangilab qayta urinib ko\'ring.')
    if (!companyId.value) throw new Error('Kompaniya topilmadi. 2-qadamni qayta bajaring.')

    // Tanlangan tarif obunaga yoziladi — limit va featurelar shu obuna orqali userga o'tadi
    const sub = await subscriptionsApi.create({
      company_id: companyId.value,
      tariff_id: tariffId,
      billing_cycle: billingCycle.value,
    })
    subscriptionId.value = sub.id

    const isFree = currentPlan.value.free
    await onboardingApi
      .updateStep(5, { tariff_id: tariffId, billing_cycle: billingCycle.value, completed: isFree })
      .catch(() => {})

    if (isFree) {
      // Bepul tarif — sinov rejimini faollashtirib, ish maydoniga o'tamiz
      await paymentsApi.freeTrial(sub.id).catch(() => {})
      router.push('/client/overview')
    } else {
      await goToStep(6)
    }
  } catch (err) {
    apiError.value = err?.response?.data?.message || err.message || 'Xatolik yuz berdi'
  } finally {
    submitting.value = false
  }
}

async function ensureSubscriptionId() {
  if (subscriptionId.value) return subscriptionId.value
  const sub = await subscriptionsApi.getMine().catch(() => null)
  if (sub?.id) subscriptionId.value = sub.id
  return subscriptionId.value
}

// ── Step 6 ────────────────────────────────────────────────────
const payMethod = ref('trial')
const payMethods = [
  { id: 'click', name: 'Click', hint: 'Onlayn karta orqali' },
  { id: 'payme', name: 'Payme', hint: 'QR yoki ilova orqali' },
  { id: 'uzcard', name: 'Humo / Uzcard', hint: 'Bank kartasi' },
  { id: 'bank', name: "Bank o'tkazma", hint: 'Yuridik shaxs hisobi' },
]
const orderRows = computed(() => {
  const p = currentPlan.value
  if (p.free) return [{ label: 'Tarif', value: 'Free' }, { label: 'Narx', value: 'Bepul', tone: 'success' }]
  return [
    { label: 'Tarif', value: p.name },
    { label: 'Davr', value: billingCycle.value === 'monthly' ? 'Oylik' : 'Yillik' },
    { label: 'Asosiy narx', value: fmtSom(p.price) + " so'm/oy" },
    { label: 'Bepul sinash', value: '3 kun', tone: 'success' },
  ]
})
async function submitStep6() {
  submitting.value = true
  apiError.value = ''
  try {
    const subId = await ensureSubscriptionId()
    if (!subId) throw new Error('Obuna topilmadi. Tarifni qayta tanlang.')

    // Bepul sinov — to'lovsiz faollashtirib, ish maydoniga o'tamiz
    if (payMethod.value === 'trial') {
      await paymentsApi.freeTrial(subId)
      await onboardingApi.updateStep(6, { method: 'trial', completed: true }).catch(() => {})
      router.push('/client/overview')
      return
    }

    // Click — my.click.uz to'lov sahifasiga yo'naltiramiz.
    // To'lov tugagach, click/complete obunani faollashtiradi.
    if (payMethod.value === 'click') {
      await onboardingApi.updateStep(6, { method: 'click' }).catch(() => {})
      await payWithClick(subId) // redirect qiladi
      return
    }

    // payme / uzcard / bank — hali ulanmagan
    apiError.value = "Bu to'lov usuli tez orada ulanadi. Hozircha Click yoki bepul sinovni tanlang."
  } catch (err) {
    apiError.value = err?.response?.data?.message || err.message || "To'lovni boshlashda xatolik"
  } finally {
    submitting.value = false
  }
}

// ── Steps meta ────────────────────────────────────────────────
// Step ID'lar saqlanadi (1,2,5,6) — bu submitStepN funksiyalar va backend
// step tracking bilan mos. Lekin "Tarmoqlar" (3) va "Manbalar" (4) qadamlari
// olib tashlandi — endi user step 2 dan to'g'ridan-to'g'ri 5 (Tarif)ga o'tadi.
const steps = [
  { id: 1, label: 'Hisob' },
  { id: 2, label: 'Kompaniya' },
  { id: 5, label: 'Tarif' },
  { id: 6, label: "To'lov" },
]
const visibleSteps = computed(() => currentPlan.value?.free ? steps.filter(s => s.id !== 6) : steps)

// ── Load references ───────────────────────────────────────────
async function loadReferences() {
  try {
    const [bt, pl, tariffs] = await Promise.all([
      referencesApi.getBusinessTypes().catch(() => []),
      referencesApi.getPlatforms().catch(() => []),
      tariffsApi.list().catch(() => []),
    ])
    // Backend tariflari (arxivlanmagan, faol) — kartalar shulardan quriladi.
    loadedTariffs.value = Array.isArray(tariffs) ? tariffs : []
    if (!chosen.value && loadedTariffs.value.length) chosen.value = loadedTariffs.value[0].id
    businessTypes.value = bt
    platformsForStep.value = pl.length ? pl : [
      { slug: 'telegram', name_i18n: { uz: 'Telegram' }, is_available: true },
      { slug: 'instagram', name_i18n: { uz: 'Instagram' }, is_available: false },
      { slug: 'website', name_i18n: { uz: 'Veb-sayt' }, is_available: false },
    ]
  } catch { /* fallback already set */ }
}

onMounted(async () => {
  await loadReferences()
  if (authStore.isLoggedIn) {
    try {
      const s = await onboardingApi.getSession()
      if (s?.completed_at) return
      let resumeStep = Math.min(Math.max(s?.current_step ?? 2, 2), 6)
      if (resumeStep === 3 || resumeStep === 4) resumeStep = 5
      if (s?.step_data?.step_2?.company_id) companyId.value = s.step_data.step_2.company_id
      await goToStep(resumeStep)
    } catch { /* not started — stay on step 1 */ }
  }
})
</script>

<style scoped>
/* ── Root ─────────────────────────────────── */
.oz-root {
  min-height: 100vh;
  background: var(--bg);
  display: flex;
  flex-direction: column;
}

/* ── Progress stripe ──────────────────────── */
.oz-progress-stripe {
  position: fixed;
  top: 0; left: 0; right: 0;
  height: 3px;
  background: var(--border);
  z-index: 100;
}
.oz-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--accent), color-mix(in oklab, var(--accent) 70%, #818cf8));
  transition: width .5s cubic-bezier(.4,0,.2,1);
  border-radius: 0 3px 3px 0;
}

/* ── Header ───────────────────────────────── */
.oz-header {
  height: 56px;
  padding: 0 32px;
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  gap: 14px;
  flex-shrink: 0;
  margin-top: 3px;
}

/* ── Stepper ──────────────────────────────── */
.oz-stepper-wrap {
  padding: 14px 32px;
  background: var(--bg-2);
  border-bottom: 1px solid var(--border);
  display: flex;
  justify-content: center;
  flex-shrink: 0;
}
.oz-stepper {
  display: flex;
  align-items: center;
  gap: 0;
}
.oz-step-item {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.oz-step-bubble {
  width: 24px; height: 24px;
  border-radius: 999px;
  background: var(--panel);
  border: 1.5px solid var(--border);
  color: var(--muted);
  display: inline-flex; align-items: center; justify-content: center;
  transition: all .25s;
  flex-shrink: 0;
}
.oz-step-item.active .oz-step-bubble {
  background: var(--accent);
  border-color: var(--accent);
  color: white;
  box-shadow: 0 0 0 4px color-mix(in oklab, var(--accent) 18%, transparent);
}
.oz-step-item.done .oz-step-bubble {
  background: var(--success);
  border-color: var(--success);
}
.oz-step-label {
  font-size: 12.5px;
  font-weight: 500;
  color: var(--muted);
  transition: color .25s;
  white-space: nowrap;
}
.oz-step-item.active .oz-step-label { color: var(--text); font-weight: 600; }
.oz-step-item.done .oz-step-label   { color: var(--text-2); }
.oz-step-bridge {
  width: 32px; height: 2px;
  background: var(--border);
  margin: 0 8px;
  border-radius: 2px;
  transition: background .3s;
  flex-shrink: 0;
}
.oz-step-bridge.done { background: var(--success); }

/* ── Body ─────────────────────────────────── */
.oz-body {
  flex: 1;
  padding: 36px 32px;
  display: flex;
  justify-content: center;
  overflow-y: auto;
}
.oz-page {
  width: 100%;
  max-width: 1160px;
}
.oz-narrow {
  margin: 0 auto;
  width: 100%;
}

/* ── Step head ────────────────────────────── */
.oz-step-head {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 22px;
}
.oz-step-head-icon {
  width: 48px; height: 48px;
  border-radius: 14px;
  display: inline-flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.oz-h1 {
  font-size: 22px;
  font-weight: 700;
  letter-spacing: -.02em;
  margin: 0;
  color: var(--text);
}
.oz-sub {
  margin: 3px 0 0;
  color: var(--muted);
  font-size: 13px;
}

/* ── Form helpers ─────────────────────────── */
.oz-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.oz-nav {
  display: flex;
  justify-content: space-between;
  margin-top: 6px;
}
.oz-terms {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  font-size: 12px;
  color: var(--text-2);
  cursor: pointer;
}
.oz-or {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--muted);
  font-size: 11px;
}
.oz-or::before, .oz-or::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--border);
}
.oz-eye-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--muted);
  padding: 0;
  display: inline-flex;
  align-items: center;
  transition: color .15s;
}
.oz-eye-btn:hover { color: var(--text); }

/* ── Remove / Add buttons ─────────────────── */
.oz-rm-btn {
  width: 32px; height: 32px;
  border-radius: 6px;
  border: 1px solid var(--border);
  background: var(--panel);
  color: var(--muted);
  cursor: pointer;
  display: inline-flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  transition: all .15s;
}
.oz-rm-btn:hover { color: var(--danger); border-color: color-mix(in oklab, var(--danger) 35%, transparent); }
.oz-add-btn {
  align-self: flex-start;
  height: 30px;
  padding: 0 12px;
  background: transparent;
  border: 1px dashed var(--border);
  border-radius: 6px;
  color: var(--accent);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: all .15s;
}
.oz-add-btn:hover { border-color: var(--accent); background: var(--accent-bg); }

/* ── Platform rows ────────────────────────── */
.oz-platform-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 10px;
  border: 1.5px solid var(--border);
  background: var(--panel-2);
  cursor: pointer;
  transition: all .18s;
}
.oz-platform-row.selected {
  background: var(--accent-bg);
  border-color: color-mix(in oklab, var(--accent) 35%, transparent);
}
.oz-platform-row.unavailable { opacity: .5; cursor: not-allowed; }
.oz-platform-icon {
  width: 38px; height: 38px;
  border-radius: 11px;
  flex-shrink: 0;
  display: inline-flex; align-items: center; justify-content: center;
}
.oz-soon-badge {
  padding: 2px 8px;
  font-size: 10px;
  font-weight: 700;
  background: var(--panel);
  border: 1px solid var(--border);
  color: var(--muted);
  border-radius: 999px;
}
.oz-check-circle {
  width: 22px; height: 22px;
  border-radius: 999px;
  border: 1.5px solid var(--border);
  background: transparent;
  display: inline-flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  transition: all .18s;
}
.oz-check-circle.on {
  background: var(--accent);
  border-color: var(--accent);
}

/* ── Telegram input box ───────────────────── */
.oz-tg-box {
  background: var(--bg-2);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 14px;
}
.oz-tg-input {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 7px;
  height: 34px;
  padding: 0 10px;
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: var(--r-sm);
}
.oz-tg-channel-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: var(--r-sm);
  transition: border-color .2s, background .2s;
}
.oz-tg-channel-row.connected {
  border-color: color-mix(in oklab, var(--success) 40%, transparent);
  background: color-mix(in oklab, var(--success) 4%, var(--panel));
}
.oz-tg-channel-row.removed {
  opacity: 0.55;
}
.oz-tg-status-dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  flex-shrink: 0;
  background: var(--muted);
}
.oz-tg-status-dot.connected {
  background: var(--success);
  box-shadow: 0 0 0 3px color-mix(in oklab, var(--success) 22%, transparent);
}
.oz-tg-status-dot.pending_admin {
  background: #F59E0B;
  box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.22);
  animation: tgPulse 1.4s ease-in-out infinite;
}
.oz-tg-status-dot.removed { background: var(--danger); }
@keyframes tgPulse {
  0%, 100% { box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.22); }
  50%      { box-shadow: 0 0 0 6px rgba(245, 158, 11, 0.05); }
}
.oz-tg-admin-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 28px;
  padding: 0 10px;
  background: #2AABEE;
  color: white;
  border-radius: 6px;
  font-size: 11.5px;
  font-weight: 600;
  text-decoration: none;
  white-space: nowrap;
  transition: background .15s;
}
.oz-tg-admin-btn:hover { background: #1E97D6; }

/* Posting mode (avtomatik / qo'lda) — yangi kanal qo'shish bloki */
.oz-pm-label {
  display: block;
  font-size: 11px;
  color: var(--muted);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: .04em;
  margin-bottom: 6px;
}
.oz-pm-options {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}
.oz-pm-opt {
  text-align: left;
  padding: 10px 12px;
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: var(--r-sm);
  cursor: pointer;
  transition: border-color .15s, background .15s;
}
.oz-pm-opt:hover { border-color: var(--accent); }
.oz-pm-opt.active {
  border-color: var(--accent);
  background: color-mix(in oklab, var(--accent) 6%, var(--panel));
}
.oz-pm-opt-head {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 3px;
}
.oz-pm-opt-icon {
  width: 20px; height: 20px;
  display: inline-flex; align-items: center; justify-content: center;
  border-radius: 5px;
  background: var(--accent-bg);
  color: var(--accent);
}
.oz-pm-opt-title { font-size: 12.5px; font-weight: 600; color: var(--text); flex: 1; }
.oz-pm-opt-check {
  width: 16px; height: 16px;
  border-radius: 999px;
  background: var(--accent);
  display: inline-flex; align-items: center; justify-content: center;
}
.oz-pm-opt-sub { font-size: 10.5px; color: var(--muted); line-height: 1.4; }

/* Mavjud kanal qatorida mode pill va toggle button */
.oz-tg-mode-pill {
  display: inline-flex;
  align-items: center;
  height: 16px;
  padding: 0 6px;
  font-size: 9.5px;
  font-weight: 600;
  letter-spacing: .03em;
  border-radius: 4px;
  text-transform: uppercase;
}
.oz-tg-mode-pill.auto {
  background: color-mix(in oklab, var(--accent) 14%, transparent);
  color: var(--accent);
}
.oz-tg-mode-pill.manual {
  background: color-mix(in oklab, var(--muted) 14%, transparent);
  color: var(--text-2);
}
.oz-tg-mode-btn {
  width: 26px; height: 26px;
  display: inline-flex; align-items: center; justify-content: center;
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: 6px;
  color: var(--muted);
  cursor: pointer;
  transition: color .15s, border-color .15s;
}
.oz-tg-mode-btn:hover { color: var(--accent); border-color: var(--accent); }

/* ── AI Assistant config box ──────────────── */
.oz-ai-box {
  margin: 12px 0;
  padding: 14px;
  background: linear-gradient(135deg,
    color-mix(in oklab, var(--accent) 5%, var(--panel)) 0%,
    var(--panel) 100%);
  border: 1px solid color-mix(in oklab, var(--accent) 25%, transparent);
  border-radius: var(--r-md, 10px);
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.oz-ai-head {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}
.oz-ai-icon {
  width: 26px; height: 26px;
  border-radius: 8px;
  background: var(--accent);
  color: white;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 4px 12px -4px color-mix(in oklab, var(--accent) 60%, transparent);
}
.oz-ai-title {
  font-size: 13px;
  font-weight: 700;
  color: var(--text);
  letter-spacing: -.01em;
}
.oz-ai-sub {
  font-size: 11px;
  color: var(--muted);
  margin-top: 1px;
  line-height: 1.4;
}

.oz-ai-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.oz-ai-group-label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 10.5px;
  font-weight: 700;
  color: var(--text-2);
  text-transform: uppercase;
  letter-spacing: .05em;
  margin-bottom: 2px;
}
.oz-ai-group-label.danger { color: var(--danger); }
.oz-ai-lock {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 1px 7px;
  font-size: 9.5px;
  font-weight: 600;
  text-transform: none;
  letter-spacing: 0;
  background: color-mix(in oklab, var(--danger) 10%, transparent);
  border: 1px solid color-mix(in oklab, var(--danger) 25%, transparent);
  color: var(--danger);
  border-radius: 999px;
}

.oz-ai-toggle {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 9px 11px;
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: var(--r-sm);
  cursor: pointer;
  transition: border-color .15s, background .15s;
}
.oz-ai-toggle:hover { border-color: color-mix(in oklab, var(--accent) 40%, var(--border)); }
.oz-ai-toggle.on {
  border-color: color-mix(in oklab, var(--accent) 45%, transparent);
  background: color-mix(in oklab, var(--accent) 5%, var(--panel));
}
.oz-ai-toggle input { display: none; }
.oz-ai-toggle-box {
  width: 16px; height: 16px;
  border-radius: 4px;
  border: 1.5px solid var(--border);
  background: var(--panel);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 1px;
  transition: all .15s;
}
.oz-ai-toggle.on .oz-ai-toggle-box {
  background: var(--accent);
  border-color: var(--accent);
}
.oz-ai-toggle-title {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: var(--text);
  line-height: 1.35;
}
.oz-ai-toggle-sub {
  display: block;
  font-size: 10.5px;
  color: var(--muted);
  line-height: 1.4;
  margin-top: 2px;
}

.oz-ai-locked-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 11px;
  font-size: 11.5px;
  color: var(--text-2);
  background: color-mix(in oklab, var(--danger) 4%, var(--panel));
  border: 1px solid color-mix(in oklab, var(--danger) 18%, transparent);
  border-radius: var(--r-sm);
  line-height: 1.35;
}
.oz-ai-locked-dot {
  width: 6px; height: 6px;
  border-radius: 999px;
  background: var(--danger);
  flex-shrink: 0;
  box-shadow: 0 0 0 3px color-mix(in oklab, var(--danger) 18%, transparent);
}

.oz-ai-textarea {
  width: 100%;
  min-height: 60px;
  padding: 9px 11px;
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: var(--r-sm);
  font-family: inherit;
  font-size: 12.5px;
  color: var(--text);
  resize: vertical;
  outline: none;
  transition: border-color .15s, box-shadow .15s;
  box-sizing: border-box;
}
.oz-ai-textarea:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px color-mix(in oklab, var(--accent) 12%, transparent);
}

.oz-topic-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.oz-topic-chip {
  display: flex;
  flex-direction: column;
  gap: 1px;
  padding: 7px 11px;
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: var(--r-sm);
  cursor: pointer;
  text-align: left;
  transition: all .15s;
  min-width: 110px;
}
.oz-topic-chip:hover { border-color: color-mix(in oklab, var(--accent) 45%, var(--border)); }
.oz-topic-chip.active {
  background: var(--accent-bg);
  border-color: var(--accent);
  box-shadow: 0 0 0 2px color-mix(in oklab, var(--accent) 18%, transparent);
}
.oz-topic-chip-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text);
}
.oz-topic-chip.active .oz-topic-chip-label { color: var(--accent); }
.oz-topic-chip-desc {
  font-size: 10.5px;
  color: var(--muted);
  line-height: 1.3;
}

.oz-ai-info-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 9px 11px;
  background: color-mix(in oklab, var(--success) 5%, var(--panel));
  border: 1px solid color-mix(in oklab, var(--success) 20%, transparent);
  border-radius: var(--r-sm);
}
.oz-ai-info-num {
  width: 20px; height: 20px;
  border-radius: 999px;
  background: var(--success);
  color: white;
  font-size: 10.5px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 1px;
}
.oz-ai-info-body { flex: 1; min-width: 0; }
.oz-ai-info-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--text);
  line-height: 1.35;
}
.oz-ai-info-sub {
  font-size: 10.5px;
  color: var(--muted);
  line-height: 1.45;
  margin-top: 2px;
}
.oz-ai-info-sub strong { color: var(--text-2); font-weight: 600; }

.oz-ai-strict {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 11px 12px;
  background: color-mix(in oklab, var(--danger) 6%, var(--panel));
  border: 1px solid color-mix(in oklab, var(--danger) 30%, transparent);
  border-radius: var(--r-sm);
}
.oz-ai-strict-title {
  font-size: 12px;
  font-weight: 700;
  color: var(--danger);
  letter-spacing: -.005em;
}
.oz-ai-strict-sub {
  font-size: 11px;
  color: var(--text-2);
  line-height: 1.5;
  margin-top: 3px;
}
.oz-ai-strict-sub strong { color: var(--text); font-weight: 600; }

.oz-ai-preview-toggle {
  align-self: flex-start;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 10px;
  background: transparent;
  border: 1px dashed var(--border);
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  color: var(--muted);
  cursor: pointer;
  transition: color .15s, border-color .15s;
}
.oz-ai-preview-toggle:hover { color: var(--accent); border-color: var(--accent); }

.oz-ai-prompt {
  margin: 0;
  padding: 11px 13px;
  background: var(--bg-2);
  border: 1px solid var(--border);
  border-radius: var(--r-sm);
  font-family: var(--font-mono);
  font-size: 10.5px;
  color: var(--text-2);
  line-height: 1.55;
  white-space: pre-wrap;
  word-wrap: break-word;
  max-height: 260px;
  overflow-y: auto;
}

.ai-fade-enter-active, .ai-fade-leave-active {
  transition: opacity .25s ease, transform .25s ease, max-height .3s ease;
  overflow: hidden;
}
.ai-fade-enter-from, .ai-fade-leave-to {
  opacity: 0; transform: translateY(-6px); max-height: 0;
}
.ai-fade-enter-to, .ai-fade-leave-from {
  opacity: 1; max-height: 1200px;
}

/* ── Step content transition ──────────────── */
.oz-step-enter-active {
  animation: stepIn .32s cubic-bezier(.22,.68,0,1.2) both;
}
@keyframes stepIn {
  from { opacity: 0; transform: translateY(14px) scale(.99); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}

/* ── Veil ─────────────────────────────────── */
.oz-veil {
  position: fixed;
  inset: 0;
  z-index: 500;
  background: var(--bg);
  display: flex;
  align-items: center;
  justify-content: center;
}
.oz-veil-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 18px;
}
.oz-veil-ring {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}
.oz-veil-icon-wrap {
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
}
.oz-arc {
  transform-origin: center;
  transform: rotate(-90deg);
  animation: arcFill .6s cubic-bezier(.4,0,.2,1) forwards;
}
@keyframes arcFill {
  from { stroke-dashoffset: 232.5; }
  to   { stroke-dashoffset: 0; }
}
.oz-veil-label {
  font-size: 15px;
  font-weight: 600;
  color: var(--text);
  letter-spacing: -.01em;
}
.oz-veil-dots {
  display: flex;
  gap: 6px;
}
.oz-veil-dots span {
  width: 6px; height: 6px;
  border-radius: 50%;
  background: var(--accent);
  animation: dotBounce .9s ease-in-out infinite;
}
@keyframes dotBounce {
  0%, 100% { opacity: .25; transform: scale(.75); }
  50%       { opacity: 1;   transform: scale(1); }
}

/* ── Veil fade transition ─────────────────── */
.veil-fade-enter-active { transition: opacity .18s ease; }
.veil-fade-leave-active { transition: opacity .28s ease; }
.veil-fade-enter-from,
.veil-fade-leave-to { opacity: 0; }
</style>
