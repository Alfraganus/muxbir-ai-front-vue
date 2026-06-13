<template>
  <div style="padding:20px 24px 40px;display:flex;flex-direction:column;gap:16px;">
    <PageHeader :title="tt('cc.title')" :subtitle="headerSubtitle">
      <template #right>
        <AppButton variant="secondary" size="md" @click="loadAll" :loading="loading">
          {{ tt('cc.refresh') }}
        </AppButton>
        <AppButton variant="primary" size="md" @click="openAddModal()">
          <template #icon><AppIcon name="Plus" :size="13"/></template>
          {{ tt('cc.add') }}
        </AppButton>
      </template>
    </PageHeader>

    <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
      <AppTabs v-model="statusFilter" :items="statusTabs"/>
      <div style="width:1px;height:18px;background:var(--border);"/>
      <AppTabs v-model="platformFilter" :items="platformTabs"/>
      <div style="flex:1;"/>
      <AppTabs v-model="view" :items="[{value:'cards',label:tt('cc.view.cards')},{value:'table',label:tt('cc.view.table')}]"/>
    </div>

    <!-- Loading -->
    <div v-if="loading" style="display:flex;align-items:center;justify-content:center;padding:60px 0;color:var(--muted);font-size:13px;gap:10px;">
      <span class="cc-spinner"/>
      {{ tt('cc.loading') }}
    </div>

    <!-- Hech narsa yo'q -->
    <AppPanel v-else-if="!channels.length" :padding="40">
      <div style="display:flex;flex-direction:column;align-items:center;gap:14px;text-align:center;">
        <div class="cc-empty-icons">
          <span v-for="p in platforms" :key="p.slug" :style="platformIconStyle(p.slug, 'lg')" :class="{ dim: !p.is_available }">
            <AppIcon :name="platformIconName(p.slug)" :size="20"/>
          </span>
        </div>
        <div>
          <div style="font-size:15px;font-weight:600;margin-bottom:4px;">{{ tt('cc.empty.title') }}</div>
          <div style="font-size:12.5px;color:var(--muted);max-width:380px;">
            {{ tt('cc.empty.sub') }}
          </div>
        </div>
        <AppButton variant="primary" size="md" @click="openAddModal('telegram')">
          <template #icon><AppIcon name="Plus" :size="13"/></template>
          {{ tt('cc.firstAdd') }}
        </AppButton>
      </div>
    </AppPanel>

    <AppPanel v-else-if="!filteredList.length" :padding="32">
      <div style="text-align:center;color:var(--muted);font-size:13px;">
        {{ tt('cc.empty.filtered') }}
      </div>
    </AppPanel>

    <!-- Cards view -->
    <div v-else-if="view === 'cards'" class="ccx-grid" :class="gridClass">
      <AppPanel v-for="c in filteredList" :key="c.id" :padding="0">
        <div class="ccx-card" :class="{ 'ccx-card-wide': filteredList.length === 1 }">
          <!-- Header -->
          <div class="ccx-head">
            <span class="ccx-avatar" :style="{ background: avatarBg(c) }">
              <AppIcon :name="platformIconName(platformSlug(c))" :size="20"/>
              <span v-if="isActive(c)" class="ccx-live"/>
            </span>
            <div class="ccx-head-main">
              <div class="ccx-head-row">
                <span class="ccx-name">{{ displayName(c) }}</span>
                <AppBadge :tone="isActive(c) ? 'success' : 'muted'" dot>{{ statusLabel(c) }}</AppBadge>
              </div>
              <div class="ccx-head-sub">
                <span class="mono ccx-handle">{{ identifier(c) }}</span>
                <span class="ccx-dot"/>
                <button type="button" class="ccx-mode ccx-mode-btn" :class="modeOf(c)"
                  @click.stop="togglePostingMode(c)"
                  :title="modeOf(c) === 'auto' ? 'Manual rejimga oʻtkazish uchun bosing' : 'Avto rejimga oʻtkazish uchun bosing'">
                  <AppIcon :name="modeOf(c) === 'auto' ? 'Bolt' : 'Edit'" :size="9"/>
                  {{ modeOf(c) === 'auto' ? tt('cc.mode.auto') : tt('cc.mode.manual') }}
                  <AppIcon name="ArrowDown" :size="8" style="opacity:.6;"/>
                </button>
              </div>
            </div>
            <ChannelActionsMenu
              :channel="c" :active="isActive(c)"
              @posts="gotoPosts(c)" @signature="openSignature(c)" @sources="openSources(c)"
              @settings="openAutoSettings(c)" @toggle-mode="togglePostingMode(c)" @remove="removeChannel(c)"/>
          </div>

          <!-- Meta strip -->
          <div class="ccx-meta">
            <div class="ccx-meta-item">
              <AppIcon name="Shield" :size="11"/>
              <span class="ccx-meta-lbl">{{ tt('cc.col.botStatus') }}</span>
              <span class="ccx-meta-val" :style="{ color: isActive(c) ? 'var(--success)' : 'var(--warn)' }">{{ botStatusLabel(c.bot_status) }}</span>
            </div>
            <div class="ccx-meta-item">
              <AppIcon name="Layers" :size="11"/>
              <span class="ccx-meta-lbl">{{ tt('cc.col.type') }}</span>
              <span class="ccx-meta-val">{{ chatTypeLabel(c.chat_type) }}</span>
            </div>
            <div class="ccx-meta-item">
              <AppIcon name="Calendar" :size="11"/>
              <span class="ccx-meta-lbl">{{ tt('cc.col.connectedAt') }}</span>
              <span class="ccx-meta-val" :title="connectedDateFull(c)">{{ connectedDate(c) }}</span>
            </div>
            <div class="ccx-meta-item">
              <AppIcon name="Database" :size="11"/>
              <span class="ccx-meta-lbl">ID</span>
              <span class="ccx-meta-val mono">{{ c.telegram_chat_id || '—' }}</span>
            </div>
          </div>

          <!-- Stats -->
          <div class="ccx-stats">
            <div class="ccx-stat">
              <span class="ccx-stat-lbl">Obunachilar</span>
              <span class="ccx-stat-val tabular">{{ fmtCompact(c.subscriber_count || 0) }}</span>
            </div>
            <div class="ccx-stat">
              <span class="ccx-stat-lbl">Post (7 kun)</span>
              <span class="ccx-stat-val tabular">{{ c.posts_7d ?? 0 }}</span>
            </div>
            <div class="ccx-stat">
              <span class="ccx-stat-lbl">Manbalar ({{ c.sources_count ?? 0 }})</span>
              <span class="ccx-src-breakdown">
                <span class="ccx-src-chip tg" :title="`${c.sources_telegram ?? 0} ta Telegram manba`">
                  <AppIcon name="Telegram" :size="11"/>{{ c.sources_telegram ?? 0 }}
                </span>
                <span class="ccx-src-chip web" :title="`${c.sources_website ?? 0} ta Website manba`">
                  <AppIcon name="Globe2" :size="11"/>{{ c.sources_website ?? 0 }}
                </span>
              </span>
            </div>
          </div>

          <!-- Sparkline -->
          <div class="ccx-spark">
            <div class="ccx-spark-head">
              <span class="ccx-spark-lbl">Post faolligi · 8 hafta</span>
              <span v-if="hasActivity(c)" class="ccx-trend" :style="{ color: trendDelta(c) >= 0 ? 'var(--success)' : 'var(--danger)' }">
                <AppIcon :name="trendDelta(c) >= 0 ? 'ArrowUp' : 'ArrowDown'" :size="10"/>
                {{ Math.abs(trendDelta(c)).toFixed(0) }}%
              </span>
            </div>
            <Sparkline :data="activitySeries(c)" :width="300" :height="filteredList.length === 1 ? 60 : 36"/>
          </div>

          <!-- Footer -->
          <div class="ccx-foot">
            <span class="ccx-foot-last">
              <AppIcon name="Send" :size="11" style="flex-shrink:0;"/>
              <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">So'nggi: {{ lastPostRelative(c) }}</span>
            </span>
            <template v-if="!isActive(c)">
              <AppButton variant="primary" size="md" @click="openReactivateModal(c)" title="Botni kanalga qayta admin qilish">
                <template #icon><AppIcon name="Sparkle" :size="14"/></template>
                Faollashtirish
              </AppButton>
            </template>
            <template v-else>
              <AppButton variant="ghost" size="md" @click="openRecent(c)" title="Oxirgi 3 kunlik postlar va ko'rishlar">
                <template #icon><AppIcon name="Eye" :size="14"/></template>
                So'nggi postlar
              </AppButton>
              <AppButton variant="secondary" size="md" @click="openSources(c)">
                <template #icon><AppIcon name="Layers" :size="14"/></template>
                Manbalar
              </AppButton>
              <AppButton variant="primary" size="md" @click="openAutoSettings(c)">
                <template #icon><AppIcon name="Settings" :size="14"/></template>
                Sozlash
              </AppButton>
            </template>
          </div>
        </div>
      </AppPanel>
    </div>

    <!-- Table view -->
    <AppPanel v-else :padding="0">
      <table style="width:100%;border-collapse:collapse;font-size:12.5px;">
        <thead>
          <tr style="border-bottom:1px solid var(--border);">
            <th class="ccx-th" style="padding-left:14px;">{{ tt('cc.col.channel') }}</th>
            <th class="ccx-th">Manba</th>
            <th class="ccx-th" style="text-align:right;">Obunachi</th>
            <th class="ccx-th" style="text-align:right;">Post (7k)</th>
            <th class="ccx-th">So'nggi post</th>
            <th class="ccx-th">{{ tt('cc.col.mode') }}</th>
            <th class="ccx-th">{{ tt('cc.col.status') }}</th>
            <th class="ccx-th" style="width:44px;"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(c, i) in filteredList" :key="c.id" :style="{ borderTop: i===0?'none':'1px solid var(--border-2)' }">
            <td style="padding:10px 14px;vertical-align:middle;">
              <div style="display:flex;align-items:center;gap:10px;">
                <span class="ccx-avatar ccx-avatar-sm" :style="{ background: avatarBg(c) }">
                  <AppIcon :name="platformIconName(platformSlug(c))" :size="13"/>
                </span>
                <div style="display:flex;flex-direction:column;min-width:0;">
                  <span style="font-weight:500;">{{ displayName(c) }}</span>
                  <span class="mono" style="font-size:11px;color:var(--muted);">{{ identifier(c) }}</span>
                </div>
              </div>
            </td>
            <td style="padding:10px;vertical-align:middle;">
              <span class="ccx-src-breakdown">
                <span class="ccx-src-chip tg" :title="`${c.sources_telegram ?? 0} ta Telegram manba`"><AppIcon name="Telegram" :size="11"/>{{ c.sources_telegram ?? 0 }}</span>
                <span class="ccx-src-chip web" :title="`${c.sources_website ?? 0} ta Website manba`"><AppIcon name="Globe2" :size="11"/>{{ c.sources_website ?? 0 }}</span>
              </span>
            </td>
            <td style="padding:10px;vertical-align:middle;text-align:right;" class="tabular">{{ fmtCompact(c.subscriber_count || 0) }}</td>
            <td style="padding:10px;vertical-align:middle;text-align:right;" class="tabular">{{ c.posts_7d ?? 0 }}</td>
            <td style="padding:10px;vertical-align:middle;color:var(--muted);">{{ lastPostRelative(c) }}</td>
            <td style="padding:10px;vertical-align:middle;">
              <button type="button" class="cc-mode-pill cc-mode-pill-btn" :class="modeOf(c)"
                @click.stop="togglePostingMode(c)"
                :title="modeOf(c) === 'auto' ? 'Manual rejimga oʻtkazish uchun bosing' : 'Avto rejimga oʻtkazish uchun bosing'">
                {{ modeOf(c) === 'auto' ? tt('cc.mode.auto') : tt('cc.mode.manual') }} ⇅
              </button>
            </td>
            <td style="padding:10px;vertical-align:middle;"><AppBadge :tone="isActive(c) ? 'success' : 'muted'" dot>{{ statusLabel(c) }}</AppBadge></td>
            <td style="padding:10px;vertical-align:middle;text-align:right;">
              <ChannelActionsMenu
                :channel="c" :active="isActive(c)"
                @posts="gotoPosts(c)" @signature="openSignature(c)" @sources="openSources(c)"
                @settings="openAutoSettings(c)" @toggle-mode="togglePostingMode(c)" @remove="removeChannel(c)"/>
            </td>
          </tr>
        </tbody>
      </table>
    </AppPanel>

    <!-- ────── Add Channel Modal ────── -->
    <Teleport to="body">
      <Transition name="cc-modal">
        <div v-if="addModalOpen" class="cc-modal-backdrop" @click.self="closeAddModal">
          <div class="cc-modal" role="dialog" aria-modal="true">
            <button class="cc-modal-close" @click="closeAddModal" aria-label="Yopish">
              <AppIcon name="Close" :size="14"/>
            </button>

            <div class="cc-modal-hero" :style="{ background: heroGradient(addPlatformSlug) }">
              <div aria-hidden class="cc-modal-hero-dots"/>
              <div class="cc-modal-hero-inner">
                <span class="cc-modal-hero-icon">
                  <AppIcon :name="platformIconName(addPlatformSlug)" :size="22"/>
                </span>
                <div>
                  <div class="cc-modal-hero-title">{{ tt('cc.modal.title') }}</div>
                  <div class="cc-modal-hero-sub">{{ heroSubtitle }}</div>
                </div>
              </div>
            </div>

            <div v-if="platforms.length > 1" class="cc-modal-platforms">
              <button v-for="p in platforms" :key="p.slug"
                class="cc-pf-btn"
                :class="{ active: addPlatformSlug === p.slug, disabled: !p.is_available }"
                :disabled="!p.is_available"
                @click="switchPlatform(p)">
                <span class="cc-pf-btn-icon" :style="platformIconStyle(p.slug, 'sm')">
                  <AppIcon :name="platformIconName(p.slug)" :size="13"/>
                </span>
                <span class="cc-pf-btn-name">{{ platformName(p) }}</span>
                <span v-if="!p.is_available" class="cc-pf-btn-soon">{{ tt('cc.platform.soon') }}</span>
              </button>
            </div>

            <div class="cc-modal-body">
              <template v-if="addStage === 'input'">

                <!-- Meta (Facebook / Instagram) platforma tanlanganda — OAuth tugmasi -->
                <template v-if="addPlatformSlug === 'facebook' || addPlatformSlug === 'instagram'">
                  <div style="display:flex;flex-direction:column;align-items:center;gap:16px;padding:12px 0 8px;">
                    <div style="text-align:center;">
                      <div style="font-size:14px;font-weight:600;margin-bottom:6px;">
                        {{ addPlatformSlug === 'facebook' ? 'Facebook sahifangizni ulang' : 'Instagram akkauntingizni ulang' }}
                      </div>
                      <div style="font-size:12.5px;color:var(--muted);max-width:320px;line-height:1.5;">
                        Facebook hisobingizga kirib, qaysi sahifani/akkauntni ulashni tanlaysiz.
                        <br>Instagram ulash uchun akkaunt Facebook sahifasiga bog'langan bo'lishi kerak.
                      </div>
                    </div>
                    <div v-if="addError" class="cc-modal-error">
                      <AppIcon name="Close" :size="12"/>
                      {{ addError }}
                    </div>
                    <div class="cc-modal-actions" style="width:100%;justify-content:center;">
                      <AppButton variant="secondary" size="md" @click="closeAddModal">Bekor qilish</AppButton>
                      <AppButton variant="primary" size="md" @click="startMetaOAuth" style="background:#1877F2;border-color:#1877F2;">
                        <template #icon>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                        </template>
                        Facebook orqali ulash
                        <template #icon-right><AppIcon name="Arrow" :size="13"/></template>
                      </AppButton>
                    </div>
                  </div>
                </template>

                <!-- Telegram URL kiritish (odatiy oqim) -->
                <template v-else>
                <div class="cc-field">
                  <label class="cc-field-label">{{ tt('cc.modal.urlLabel') }}</label>
                  <div class="cc-url-input" :class="{ error: !!addError }">
                    <AppIcon :name="platformIconName(addPlatformSlug)" :size="14" :style="{ color: platformColor(addPlatformSlug), flexShrink: 0 }"/>
                    <input v-model="addUrl" @keyup.enter="submitAdd"
                      :placeholder="urlPlaceholder"
                      class="cc-url-input-field"/>
                  </div>
                  <span class="cc-field-hint" v-html="urlHintHtml"/>
                </div>

                <div class="cc-field">
                  <label class="cc-field-label">{{ tt('cc.modal.modeLabel') }}</label>
                  <div class="cc-mode-grid">
                    <button type="button" class="cc-mode-card" :class="{ active: addMode === 'auto' }" @click="addMode = 'auto'">
                      <span class="cc-mode-card-icon"><AppIcon name="Sparkle" :size="14"/></span>
                      <div style="flex:1;min-width:0">
                        <div class="cc-mode-card-title">{{ tt('cc.modal.mode.auto.title') }}</div>
                        <div class="cc-mode-card-sub">{{ tt('cc.modal.mode.auto.sub') }}</div>
                      </div>
                      <span v-if="addMode === 'auto'" class="cc-mode-card-check">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3.2"><polyline points="20 6 9 17 4 12"/></svg>
                      </span>
                    </button>
                    <button type="button" class="cc-mode-card" :class="{ active: addMode === 'manual' }" @click="addMode = 'manual'">
                      <span class="cc-mode-card-icon"><AppIcon name="Edit" :size="14"/></span>
                      <div style="flex:1;min-width:0">
                        <div class="cc-mode-card-title">{{ tt('cc.modal.mode.manual.title') }}</div>
                        <div class="cc-mode-card-sub">{{ tt('cc.modal.mode.manual.sub') }}</div>
                      </div>
                      <span v-if="addMode === 'manual'" class="cc-mode-card-check">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3.2"><polyline points="20 6 9 17 4 12"/></svg>
                      </span>
                    </button>
                  </div>
                </div>

                <!-- ─── Avto rejim qo'shimcha sozlamalari ─── -->
                <div v-if="addMode === 'auto'" class="cc-auto">
                  <div class="cc-auto-head">
                    <span class="cc-auto-head-icon"><AppIcon name="Sparkle" :size="13"/></span>
                    <div>
                      <div class="cc-auto-head-title">Avto-post sozlamalari</div>
                      <div class="cc-auto-head-sub">Tizim shu kanal uchun postlarni qanday tanlashini sozlang</div>
                    </div>
                  </div>

                  <!-- Tasdiqlash usuli -->
                  <div class="cc-field">
                    <label class="cc-field-label">
                      <AppIcon name="Shield" :size="11" :style="{verticalAlign:'middle',marginRight:'4px'}"/>
                      Tasdiqlash usuli
                    </label>
                    <div class="cc-delivery-grid">
                      <button type="button" class="cc-delivery-card"
                        :class="{ active: autoDeliveryMode === 'approval' }"
                        @click="autoDeliveryMode = 'approval'">
                        <span class="cc-delivery-icon">
                          <AppIcon name="Check" :size="15"/>
                        </span>
                        <div style="flex:1;min-width:0;">
                          <div class="cc-delivery-title">Tasdiqdan keyin</div>
                          <div class="cc-delivery-sub">Mobil ilovada ko'rib, siz tasdiqlagan post yuboriladi</div>
                        </div>
                        <span v-if="autoDeliveryMode === 'approval'" class="cc-mode-card-check">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3.2"><polyline points="20 6 9 17 4 12"/></svg>
                        </span>
                      </button>
                      <button type="button" class="cc-delivery-card"
                        :class="{ active: autoDeliveryMode === 'direct' }"
                        @click="autoDeliveryMode = 'direct'">
                        <span class="cc-delivery-icon direct">
                          <AppIcon name="Bolt" :size="15"/>
                        </span>
                        <div style="flex:1;min-width:0;">
                          <div class="cc-delivery-title">To'g'ridan-to'g'ri</div>
                          <div class="cc-delivery-sub">AI postlar avtomatik Telegramga yuboriladi</div>
                        </div>
                        <span v-if="autoDeliveryMode === 'direct'" class="cc-mode-card-check">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3.2"><polyline points="20 6 9 17 4 12"/></svg>
                        </span>
                      </button>
                    </div>
                    <div v-if="autoDeliveryMode === 'direct'"
                      style="margin-top:8px;padding:9px 11px;border-radius:7px;background:rgba(234,179,8,.08);border:1px solid rgba(234,179,8,.3);color:#854d0e;font-size:11.5px;line-height:1.5;">
                      ⚡ <b>Diqqat:</b> AI xatosi bo'lsa — to'g'ridan-to'g'ri kanalga chiqadi, tasdiq yo'q.
                    </div>
                  </div>

                  <!-- Yuborish rejimi -->
                  <div class="cc-field">
                    <label class="cc-field-label">
                      <AppIcon name="Bolt" :size="11" :style="{verticalAlign:'middle',marginRight:'4px'}"/>
                      Yuborish rejimi
                    </label>
                    <div class="cc-chip-row">
                      <button type="button" class="cc-chip" :class="{ active: autoMode === 'interval' }"
                        @click="autoMode = 'interval'">Interval</button>
                      <button type="button" class="cc-chip" :class="{ active: autoMode === 'scheduled' }"
                        @click="autoMode = 'scheduled'">Belgilangan vaqt</button>
                    </div>
                    <div class="cc-field-hint">
                      {{ autoDeliveryMode === 'approval' ? "Topilgan postlar mobil ilovada tasdiqlangach yuboriladi." : "Postlar avtomatik yuboriladi." }}
                      Interval — har N daqiqada; Belgilangan vaqt — kuniga tanlangan soatlarda to'plam.
                    </div>
                  </div>

                  <!-- Interval -->
                  <div v-if="autoMode === 'interval'" class="cc-field">
                    <label class="cc-field-label">
                      <AppIcon name="Bolt" :size="11" :style="{verticalAlign:'middle',marginRight:'4px'}"/>
                      Yuborish intervali
                    </label>
                    <div class="cc-chip-row">
                      <button v-for="o in INTERVAL_PRESETS" :key="o.value" type="button"
                        class="cc-chip" :class="{ active: autoInterval === o.value }"
                        @click="autoInterval = o.value">{{ o.label }}</button>
                    </div>
                    <div class="cc-field-hint">
                      Boshqa qiymat:
                      <input type="number" min="1" max="10080" v-model.number="autoInterval"
                        class="cc-inline-num"/>
                      daqiqa
                    </div>
                    <div class="cc-field-hint" style="margin-top:6px;">
                      Tayyor turadigan post (buffer):
                      <input type="number" min="1" max="20" v-model.number="autoIntervalBatchCount"
                        class="cc-inline-num"/>
                      ta
                    </div>
                  </div>

                  <!-- Belgilangan vaqtlar (scheduled) -->
                  <div v-if="autoMode === 'scheduled'" class="cc-field">
                    <label class="cc-field-label">
                      <AppIcon name="Calendar" :size="11" :style="{verticalAlign:'middle',marginRight:'4px'}"/>
                      Yuborish vaqtlari
                    </label>
                    <div v-if="autoScheduleTimes.length" class="cc-chip-row">
                      <span v-for="t in autoScheduleTimes" :key="t" class="cc-chip active"
                        style="cursor:default;gap:6px;">
                        {{ t }}
                        <span @click="removeScheduleTime(t)"
                          style="cursor:pointer;font-weight:700;opacity:.75;">×</span>
                      </span>
                    </div>
                    <div class="cc-window-row">
                      <input type="time" v-model="newScheduleTime" class="cc-window-select"/>
                      <button type="button" class="cc-chip" @click="addScheduleTime">+ Qo'shish</button>
                    </div>
                    <div class="cc-auto-row" style="margin-top:8px;">
                      <div class="cc-field" style="flex:1;min-width:140px;">
                        <label class="cc-field-label">Har vaqt uchun nechta post</label>
                        <div class="cc-num-input">
                          <button type="button" @click="autoBatchCount = Math.max(1, autoBatchCount - 1)">−</button>
                          <input type="number" min="1" max="100" v-model.number="autoBatchCount"/>
                          <button type="button" @click="autoBatchCount = Math.min(100, autoBatchCount + 1)">+</button>
                        </div>
                      </div>
                      <div class="cc-field" style="flex:1;min-width:140px;">
                        <label class="cc-field-label">Necha daqiqa oldin yig'ilsin</label>
                        <input type="number" min="0" max="1440" v-model.number="autoCollectLeadMinutes"
                          class="cc-inline-num"/>
                      </div>
                    </div>
                    <div class="cc-field-hint">
                      Tanlangan vaqtlarda (Toshkent) shuncha post tayyorlanadi. Yig'ish belgilangan
                      vaqtdan {{ autoCollectLeadMinutes }} daqiqa oldin boshlanadi.
                    </div>
                  </div>

                  <!-- Faol vaqt oynasi -->
                  <div class="cc-field">
                    <label class="cc-field-label">
                      <AppIcon name="Calendar" :size="11" :style="{verticalAlign:'middle',marginRight:'4px'}"/>
                      Faol vaqt oynasi
                    </label>
                    <label class="cc-window-toggle">
                      <input type="checkbox" v-model="autoWindowEnabled"/>
                      <span>Faqat belgilangan soatlar oralig'ida yuborilsin</span>
                    </label>
                    <div v-if="autoWindowEnabled" class="cc-window-row">
                      <select v-model.number="autoActiveFromHour" class="cc-window-select">
                        <option v-for="h in HOUR_OPTIONS" :key="'f'+h.value" :value="h.value">{{ h.label }}</option>
                      </select>
                      <span class="cc-window-sep">dan</span>
                      <select v-model.number="autoActiveToHour" class="cc-window-select">
                        <option v-for="h in HOUR_OPTIONS" :key="'t'+h.value" :value="h.value">{{ h.label }}</option>
                      </select>
                      <span class="cc-window-sep">gacha</span>
                    </div>
                    <div class="cc-field-hint">
                      Autopost faqat shu soatlar oralig'ida ishlaydi (Toshkent vaqti). Masalan 08:00 dan 22:00 gacha.
                    </div>
                  </div>

                  <!-- Kategoriyalar -->
                  <div class="cc-field">
                    <label class="cc-field-label">
                      <AppIcon name="Hash" :size="11" :style="{verticalAlign:'middle',marginRight:'4px'}"/>
                      Mavzular (kategoriyalar)
                    </label>
                    <div v-if="!categories.length" class="cc-field-hint" style="padding:6px 0;">
                      Hali kategoriya yo'q —
                      <a href="#/client/categories" class="cc-modal-link" style="display:inline;padding:0;">
                        kategoriyalar bo'limidan qo'shing
                      </a>
                    </div>
                    <div v-else class="cc-chip-row">
                      <button v-for="cat in categories" :key="cat.id" type="button"
                        class="cc-chip" :class="{ active: autoCategoryIds.includes(cat.id) }"
                        :style="autoCategoryIds.includes(cat.id) && cat.color
                          ? { borderColor: cat.color, background: cat.color + '1f', color: cat.color }
                          : null"
                        @click="toggleAutoCategory(cat.id)">
                        <span v-if="cat.color" class="cc-chip-dot" :style="{background: cat.color}"/>
                        {{ cat.name }}
                      </button>
                    </div>
                    <div v-if="categories.length" class="cc-field-hint">
                      Bo'sh qoldirilsa — hamma mavzulardan post tanlanadi
                    </div>
                  </div>

                  <!-- Manba turi -->
                  <div class="cc-field">
                    <label class="cc-field-label">Manba turi</label>
                    <div class="cc-chip-row">
                      <button v-for="o in SOURCE_TYPE_OPTIONS" :key="o.value" type="button"
                        class="cc-chip"
                        :class="{ active: autoFilters.source_type === o.value }"
                        @click="autoFilters.source_type = o.value">{{ o.label }}</button>
                    </div>
                    <div class="cc-field-hint">Autopost qaysi turdagi manbalardan post tanlasin</div>
                  </div>

                  <!-- Filtrlar -->
                  <div class="cc-auto-row">
                    <div class="cc-field" style="flex:1;min-width:160px;">
                      <label class="cc-field-label">Qancha vaqt oralig'idagi ma'lumotlar izlansin</label>
                      <div class="cc-chip-row">
                        <button v-for="o in TIME_RANGE_OPTIONS" :key="o.value" type="button"
                          class="cc-chip"
                          :class="{ active: autoFilters.time_range === o.value }"
                          @click="setTimeRange(o.value)">{{ o.label }}</button>
                      </div>
                      <div v-if="autoFilters.time_range === 'unlimited'" class="cc-field-hint">
                        Vaqt cheklanmaydi — eng <strong>qiziqarli</strong> (ballli) postlar tanlanadi, eng oxirgisi emas.
                      </div>
                    </div>
                    <div class="cc-field" style="flex:0 0 150px;">
                      <label class="cc-field-label">Har kanaldan</label>
                      <div class="cc-num-input">
                        <button type="button" @click="autoFilters.per_channel = Math.max(1, autoFilters.per_channel - 1)">−</button>
                        <input type="number" min="1" max="30" v-model.number="autoFilters.per_channel"/>
                        <button type="button" @click="autoFilters.per_channel = Math.min(30, autoFilters.per_channel + 1)">+</button>
                      </div>
                    </div>
                  </div>

                  <div class="cc-field">
                    <label class="cc-field-label">Takrorlanishga sezgirlik</label>
                    <div class="cc-chip-row">
                      <button v-for="th in [{v:0.3,l:'Past (ko\'p tanlash)'},{v:0.5,l:'O\'rta'},{v:0.7,l:'Yuqori (kam tanlash)'}]"
                        :key="th.v" type="button" class="cc-chip"
                        :class="{ active: autoFilters.similarity_threshold === th.v }"
                        @click="autoFilters.similarity_threshold = th.v">{{ th.l }}</button>
                    </div>
                    <div class="cc-field-hint">Yangi post o'zimizning eski post bilan o'xshashlik darajasi</div>
                  </div>

                  <div class="cc-field">
                    <label class="cc-field-label">Saralash usuli</label>
                    <div class="cc-chip-row">
                      <button v-for="o in SORT_MODE_OPTIONS" :key="o.value" type="button"
                        class="cc-chip" :class="{ active: autoFilters.sort_mode === o.value }"
                        @click="autoFilters.sort_mode = o.value">{{ o.label }}</button>
                    </div>
                    <div class="cc-field-hint">
                      "Eng oxirgi" — eng yangi maqolalar (sana bo'yicha) birinchi post qilinadi.
                      "Yuqori ballli" — ko'rish/ulashish/reaksiyaga ko'ra eng yaxshi postlar.
                    </div>
                  </div>

                  <div class="cc-field">
                    <label class="cc-field-label">Til</label>
                    <div class="cc-chip-row">
                      <button v-for="l in LANG_OPTIONS" :key="l.value" type="button"
                        class="cc-chip" :class="{ active: autoOutputLanguage === l.value }"
                        @click="autoOutputLanguage = l.value">{{ l.label }}</button>
                    </div>
                    <div class="cc-field-hint">
                      AI postni shu tilda chiqaradi. Manba qaysi tilda bo'lishidan qat'i nazar — tanlangan tilga tarjima qilinadi.
                    </div>
                  </div>

                  <div class="cc-auto-row">
                    <label class="cc-toggle-row">
                      <input type="checkbox" v-model="autoFilters.include_videos"/>
                      <span>Video postlarni qo'shish</span>
                    </label>
                    <label class="cc-toggle-row">
                      <input type="checkbox" v-model="autoFilters.require_media"/>
                      <span>Faqat media bilan</span>
                    </label>
                  </div>

                  <div class="cc-auto-row">
                    <div class="cc-field" style="flex:0 0 140px;">
                      <label class="cc-field-label">Min. uzunlik</label>
                      <div class="cc-num-input">
                        <input type="number" min="0" v-model.number="autoFilters.min_length"/>
                        <span style="padding:0 8px;font-size:11px;color:var(--muted);">belgi</span>
                      </div>
                    </div>
                    <div class="cc-field" style="flex:1;min-width:200px;">
                      <label class="cc-field-label">Kalit so'zlar</label>
                      <input type="text" class="cc-text-input" v-model="autoFilters.keywords"
                        placeholder="iqtisod, valyuta, banki..."/>
                      <div class="cc-field-hint">Vergul bilan ajrating — kamida bittasi matnda bo'lsa o'tadi</div>
                    </div>
                  </div>
                </div>

                <div v-if="addError" class="cc-modal-error">
                  <AppIcon name="Close" :size="12"/>
                  {{ addError }}
                </div>

                <div class="cc-modal-actions">
                  <AppButton variant="secondary" size="md" @click="closeAddModal">{{ tt('cc.modal.cancel') }}</AppButton>
                  <AppButton variant="primary" size="md" :loading="addSubmitting" @click="submitAdd">
                    {{ tt('cc.modal.continue') }}
                    <template #icon-right><AppIcon name="Arrow" :size="13"/></template>
                  </AppButton>
                </div>
                </template><!-- /v-else Telegram -->
              </template>

              <template v-else-if="addStage === 'pending'">
                <div class="cc-pending">
                  <div class="cc-pending-pulse">
                    <span class="cc-pending-pulse-ring r1"/>
                    <span class="cc-pending-pulse-ring r2"/>
                    <span class="cc-pending-pulse-icon" :style="platformIconStyle(addPlatformSlug)">
                      <AppIcon :name="platformIconName(addPlatformSlug)" :size="18"/>
                    </span>
                  </div>
                  <div style="text-align:center;">
                    <div class="cc-pending-title">{{ tt('cc.pending.title') }}</div>
                    <div class="cc-pending-sub">
                      <span class="mono" style="color:var(--text-2)">{{ addedChannel?.username || addedChannel?.display_name }}</span>
                      {{ tt('cc.pending.sub') }}
                    </div>
                  </div>

                  <a v-if="addDeepLink" :href="addDeepLink" target="_blank" rel="noopener" class="cc-pending-cta">
                    <AppIcon name="Telegram" :size="14"/>
                    {{ tt('cc.pending.cta') }}
                    <AppIcon name="Arrow" :size="13"/>
                  </a>

                  <div class="cc-pending-steps">
                    <div class="cc-step"><span class="cc-step-num">1</span> {{ tt('cc.pending.step1') }}</div>
                    <div class="cc-step"><span class="cc-step-num">2</span> {{ tt('cc.pending.step2') }}</div>
                    <div class="cc-step"><span class="cc-step-num">3</span> {{ tt('cc.pending.step3') }}</div>
                  </div>

                  <div class="cc-pending-status">
                    <span class="cc-spinner"/>
                    {{ tt('cc.pending.waiting') }}
                  </div>

                  <button class="cc-modal-link" @click="resetStage">{{ tt('cc.pending.another') }}</button>
                </div>
              </template>

              <template v-else-if="addStage === 'success'">
                <div class="cc-success">
                  <div class="cc-success-icon">
                    <AppIcon name="Check" :size="28"/>
                  </div>
                  <div style="text-align:center">
                    <div class="cc-success-title">{{ tt('cc.success.title') }}</div>
                    <div class="cc-success-sub">
                      <b>{{ addedChannel?.display_name || addedChannel?.username }}</b>
                      —
                      {{ tt('cc.success.sub', { mode: (addedChannel?.posting_mode || 'auto') === 'auto' ? tt('cc.mode.auto').toLowerCase() : tt('cc.mode.manual').toLowerCase() }) }}
                    </div>
                  </div>
                  <div class="cc-modal-actions">
                    <AppButton variant="secondary" size="md" @click="resetStage">{{ tt('cc.success.again') }}</AppButton>
                    <AppButton variant="primary" size="md" @click="closeAddModal">{{ tt('cc.modal.close') }}</AppButton>
                  </div>
                </div>
              </template>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ────── Meta OAuth xabar (muvaffaqiyatsiz / xato) ────── -->
    <Teleport to="body">
      <Transition name="cc-modal">
        <div v-if="metaNotify" class="cc-modal-backdrop" @click.self="metaNotify = ''">
          <div class="cc-modal" style="max-width:440px;" role="dialog">
            <button class="cc-modal-close" @click="metaNotify = ''" aria-label="Yopish">
              <AppIcon name="Close" :size="14"/>
            </button>
            <div class="cc-modal-hero" style="background:linear-gradient(135deg,#dc2626,#b91c1c)">
              <div aria-hidden class="cc-modal-hero-dots"/>
              <div class="cc-modal-hero-inner">
                <span class="cc-modal-hero-icon"><AppIcon name="Close" :size="22"/></span>
                <div>
                  <div class="cc-modal-hero-title">Meta ulashda xato</div>
                  <div class="cc-modal-hero-sub">{{ metaNotify }}</div>
                </div>
              </div>
            </div>
            <div class="cc-modal-body">
              <div class="cc-modal-actions" style="justify-content:center;">
                <AppButton variant="primary" size="md" @click="metaNotify = ''">OK</AppButton>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ────── Meta sahifalar tanlash modali ────── -->
    <Teleport to="body">
      <Transition name="cc-modal">
        <div v-if="metaModalOpen" class="cc-modal-backdrop" @click.self="metaModalOpen = false">
          <div class="cc-modal" style="max-width:500px;" role="dialog">
            <button class="cc-modal-close" @click="metaModalOpen = false" aria-label="Yopish">
              <AppIcon name="Close" :size="14"/>
            </button>
            <div class="cc-modal-hero" style="background:linear-gradient(135deg,#1877F2,#0C52A3)">
              <div aria-hidden class="cc-modal-hero-dots"/>
              <div class="cc-modal-hero-inner">
                <span class="cc-modal-hero-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="white"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                </span>
                <div>
                  <div class="cc-modal-hero-title">Facebook / Instagram kanallar</div>
                  <div class="cc-modal-hero-sub">Ulashni xohlagan sahifa va akkauntlarni tanlang</div>
                </div>
              </div>
            </div>
            <div class="cc-modal-body">
              <div v-if="metaPages.length" style="display:flex;flex-direction:column;gap:8px;">
                <div v-for="pg in metaPages" :key="pg.page_id" style="border:1px solid var(--border);border-radius:10px;overflow:hidden;">
                  <!-- Facebook sahifa -->
                  <label style="display:flex;align-items:center;gap:10px;padding:12px 14px;cursor:pointer;"
                    :style="isMetaItemSelected('facebook', pg) ? 'background:rgba(24,119,242,0.07)' : ''">
                    <input type="checkbox" :checked="isMetaItemSelected('facebook', pg)"
                      @change="toggleMetaItem('facebook', pg)" style="width:16px;height:16px;"/>
                    <div style="width:32px;height:32px;border-radius:8px;background:#1877F2;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                    </div>
                    <div style="flex:1;min-width:0;">
                      <div style="font-size:13px;font-weight:600;">{{ pg.page_name }}</div>
                      <div style="font-size:11.5px;color:var(--muted);">Facebook sahifasi</div>
                    </div>
                  </label>
                  <!-- IG akkaunt (agar bog'langan bo'lsa) -->
                  <label v-if="pg.ig_user_id" style="display:flex;align-items:center;gap:10px;padding:10px 14px 12px;cursor:pointer;border-top:1px solid var(--border);"
                    :style="isMetaItemSelected('instagram', pg) ? 'background:rgba(214,63,149,0.07)' : ''">
                    <input type="checkbox" :checked="isMetaItemSelected('instagram', pg)"
                      @change="toggleMetaItem('instagram', pg)" style="width:16px;height:16px;"/>
                    <div style="width:32px;height:32px;border-radius:8px;background:linear-gradient(45deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                      <AppIcon name="Instagram" :size="14" style="color:white;"/>
                    </div>
                    <div style="flex:1;min-width:0;">
                      <div style="font-size:13px;font-weight:600;">@{{ pg.ig_username || pg.ig_user_id }}</div>
                      <div style="font-size:11.5px;color:var(--muted);">Instagram Business akkaunt</div>
                    </div>
                  </label>
                </div>
              </div>
              <div v-else style="text-align:center;color:var(--muted);font-size:13px;padding:20px 0;">
                Hech qanday Facebook sahifa topilmadi
              </div>
              <div v-if="metaConnectError" class="cc-modal-error" style="margin-top:10px;">
                <AppIcon name="Close" :size="12"/>
                {{ metaConnectError }}
              </div>
              <div class="cc-modal-actions" style="margin-top:16px;">
                <AppButton variant="secondary" size="md" @click="metaModalOpen = false">Bekor qilish</AppButton>
                <AppButton variant="primary" size="md"
                  :disabled="!metaSelected.length"
                  :loading="metaConnecting"
                  @click="connectMetaPages">
                  Ulash ({{ metaSelected.length }} ta tanlandi)
                </AppButton>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ────── Auto-post Settings Modal (mavjud kanal uchun) ────── -->
    <Teleport to="body">
      <Transition name="cc-modal">
        <div v-if="autoModalOpen" class="cc-modal-backdrop" @click.self="closeAutoModal">
          <div class="cc-modal" role="dialog" aria-modal="true">
            <button class="cc-modal-close" @click="closeAutoModal" aria-label="Yopish">
              <AppIcon name="Close" :size="14"/>
            </button>

            <div class="cc-modal-hero" :style="{ background: heroGradient('telegram') }">
              <div aria-hidden class="cc-modal-hero-dots"/>
              <div class="cc-modal-hero-inner">
                <span class="cc-modal-hero-icon"><AppIcon name="Sparkle" :size="22"/></span>
                <div>
                  <div class="cc-modal-hero-title">Avto-post sozlamalari</div>
                  <div class="cc-modal-hero-sub">
                    <b>{{ autoModalChannel?.display_name || autoModalChannel?.username }}</b>
                    — bot qanday postlarni qachon tanlashini sozlang
                  </div>
                </div>
              </div>
            </div>

            <div class="cc-modal-body">
              <div class="cc-settings-wrap">

                <!-- ═══ 1. YETKAZISH USULI ═══ -->
                <div class="cc-section">
                  <div class="cc-section-head">
                    <span class="cc-section-icon" style="background:color-mix(in oklab,var(--success) 14%,transparent);color:var(--success);">
                      <AppIcon name="Send" :size="14"/>
                    </span>
                    <div>
                      <div class="cc-section-title">Yetkazish usuli</div>
                      <div class="cc-section-sub">Tayyor post Telegramga qanday chiqadi</div>
                    </div>
                  </div>

                  <div class="cc-delivery-grid">
                    <button type="button" class="cc-delivery-card" :class="{ active: autoDeliveryMode === 'approval' }" @click="autoDeliveryMode = 'approval'">
                      <span class="cc-delivery-icon"><AppIcon name="Check" :size="15"/></span>
                      <div style="flex:1;min-width:0;">
                        <div class="cc-delivery-title">Tasdiqdan keyin</div>
                        <div class="cc-delivery-sub">Postlar avval mobil ilovada ko'rinadi — siz OK bergandan keyingina yuboriladi</div>
                      </div>
                      <span v-if="autoDeliveryMode === 'approval'" class="cc-mode-card-check">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3.2"><polyline points="20 6 9 17 4 12"/></svg>
                      </span>
                    </button>
                    <button type="button" class="cc-delivery-card" :class="{ active: autoDeliveryMode === 'direct' }" @click="autoDeliveryMode = 'direct'">
                      <span class="cc-delivery-icon direct"><AppIcon name="Bolt" :size="15"/></span>
                      <div style="flex:1;min-width:0;">
                        <div class="cc-delivery-title">To'g'ridan-to'g'ri</div>
                        <div class="cc-delivery-sub">AI tayyor qilgan post darhol kanalga chiqadi, tasdiq kutmaydi</div>
                      </div>
                      <span v-if="autoDeliveryMode === 'direct'" class="cc-mode-card-check">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3.2"><polyline points="20 6 9 17 4 12"/></svg>
                      </span>
                    </button>
                  </div>
                  <div class="cc-info-box" :class="autoDeliveryMode === 'direct' ? 'warn' : 'info'">
                    <template v-if="autoDeliveryMode === 'approval'">
                      💡 <b>Tavsiya etiladi.</b> AI topgan post mobil ilovada <b>Navbat</b> tabida ko'rinadi.
                      Siz matnni tahrirlash, qisqartirish yoki rad etish imkoniga egasiz.
                      Tasdiqlagan post belgilangan vaqtda kanalga yuboriladi.
                    </template>
                    <template v-else>
                      ⚡ <b>Diqqat:</b> postlar mobil ilovada ko'rinmaydi va tasdiqsiz kanalga chiqadi.
                      AI xatosi yoki noto'g'ri matn bo'lsa ham to'g'ridan-to'g'ri abonentlarga boradi.
                      Faqat ishonchli prompt bo'lganda yoqing.
                    </template>
                  </div>
                </div>

                <!-- ═══ 2. REJALASHTIRISH ═══ -->
                <div class="cc-section">
                  <div class="cc-section-head">
                    <span class="cc-section-icon" style="background:color-mix(in oklab,var(--accent) 14%,transparent);color:var(--accent);">
                      <AppIcon name="Calendar" :size="14"/>
                    </span>
                    <div>
                      <div class="cc-section-title">Rejalashtirish</div>
                      <div class="cc-section-sub">Postlar qachon va qancha chiqadi</div>
                    </div>
                  </div>

                  <!-- Rejim tanlash -->
                  <div class="cc-field">
                    <label class="cc-field-label">Yuborish rejimi</label>
                    <div class="cc-mode-grid">
                      <button type="button" class="cc-mode-card" :class="{ active: autoMode === 'interval' }" @click="autoMode = 'interval'">
                        <span class="cc-mode-card-icon"><AppIcon name="Bolt" :size="14"/></span>
                        <div style="flex:1;min-width:0;">
                          <div class="cc-mode-card-title">Interval</div>
                          <div class="cc-mode-card-sub">Har N soatda bir marta</div>
                        </div>
                        <span v-if="autoMode === 'interval'" class="cc-mode-card-check">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3.2"><polyline points="20 6 9 17 4 12"/></svg>
                        </span>
                      </button>
                      <button type="button" class="cc-mode-card" :class="{ active: autoMode === 'scheduled' }" @click="autoMode = 'scheduled'">
                        <span class="cc-mode-card-icon"><AppIcon name="Calendar" :size="14"/></span>
                        <div style="flex:1;min-width:0;">
                          <div class="cc-mode-card-title">Belgilangan vaqt</div>
                          <div class="cc-mode-card-sub">Kuniga aniq soatlarda to'plam</div>
                        </div>
                        <span v-if="autoMode === 'scheduled'" class="cc-mode-card-check">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3.2"><polyline points="20 6 9 17 4 12"/></svg>
                        </span>
                      </button>
                    </div>
                  </div>

                  <!-- INTERVAL sozlamalari -->
                  <template v-if="autoMode === 'interval'">
                    <div class="cc-field">
                      <label class="cc-field-label">Yuborish intervali</label>
                      <div class="cc-chip-row">
                        <button v-for="o in INTERVAL_PRESETS" :key="o.value" type="button"
                          class="cc-chip" :class="{ active: autoInterval === o.value }"
                          @click="autoInterval = o.value">{{ o.label }}</button>
                      </div>
                      <div class="cc-field-hint">
                        Boshqa qiymat: <input type="number" min="1" max="10080" v-model.number="autoInterval" class="cc-inline-num"/> daqiqa
                      </div>
                      <div class="cc-info-box info" style="margin-top:8px;">
                        💡 Har <b>{{ intervalPreviewText }}</b> bir post Telegramga yuboriladi.
                        <template v-if="autoDeliveryMode === 'approval'"> Foydalanuvchi tasdiqlagan birinchi post ketadi.</template>
                        <template v-else> Post tasdiqsiz avtomatik chiqadi.</template>
                      </div>
                    </div>

                    <div v-if="autoDeliveryMode === 'approval'" class="cc-field">
                      <label class="cc-field-label">Navbatdagi postlar (buffer)</label>
                      <div style="display:flex;align-items:center;gap:12px;">
                        <div class="cc-num-input" style="width:auto;">
                          <button type="button" @click="autoIntervalBatchCount = Math.max(1, autoIntervalBatchCount - 1)">−</button>
                          <input type="number" min="1" max="20" v-model.number="autoIntervalBatchCount" style="width:44px;"/>
                          <button type="button" @click="autoIntervalBatchCount = Math.min(20, autoIntervalBatchCount + 1)">+</button>
                        </div>
                        <span style="font-size:12.5px;color:var(--text-2);">ta post doim tayyor turadi</span>
                      </div>
                      <div class="cc-info-box info" style="margin-top:8px;">
                        💡 <b>Buffer nima?</b> Bot oldindan <b>{{ autoIntervalBatchCount }} ta</b> post yig'ib qo'yadi va mobil ilovaga yuboradi.
                        Siz ularni ko'rib chiqasiz. Har intervalda bitta tasdiqlangan post kanalga ketadi.
                        <br><br>
                        <b>Misol:</b> buffer = 5, interval = 3 soat → ilovada 5 ta post navbatda turadi → har 3 soatda 1 tasi Telegramga chiqadi.
                        Buferni oshirsa — keyin tasdiqlash uchun ko'proq vaqtingiz bo'ladi.
                      </div>
                    </div>
                  </template>

                  <!-- SCHEDULED sozlamalari -->
                  <template v-if="autoMode === 'scheduled'">
                    <div class="cc-field">
                      <label class="cc-field-label">Yuborish vaqtlari <span style="color:var(--muted);font-weight:400;">(Toshkent vaqti)</span></label>
                      <div v-if="autoScheduleTimes.length" class="cc-chip-row" style="margin-bottom:8px;">
                        <span v-for="t in autoScheduleTimes" :key="t" class="cc-chip active" style="cursor:default;gap:6px;">
                          {{ t }}
                          <span @click="removeScheduleTime(t)" style="cursor:pointer;font-weight:700;opacity:.7;font-size:14px;line-height:1;">×</span>
                        </span>
                      </div>
                      <div v-else class="cc-info-box warn" style="margin-bottom:8px;">
                        ⏰ Hali vaqt qo'shilmagan. Quyida vaqt tanlang.
                      </div>
                      <div class="cc-window-row">
                        <input type="time" v-model="newScheduleTime" class="cc-window-select"/>
                        <button type="button" class="cc-chip" style="font-weight:600;" @click="addScheduleTime">+ Qo'shish</button>
                      </div>
                      <div class="cc-field-hint">Bir necha vaqt qo'shsa bo'ladi, masalan 08:00, 13:00, 19:00</div>
                    </div>

                    <div class="cc-auto-row" style="align-items:flex-start;">
                      <div class="cc-field" style="flex:1;min-width:140px;">
                        <label class="cc-field-label">Har vaqtda nechta post</label>
                        <div class="cc-num-input">
                          <button type="button" @click="autoBatchCount = Math.max(1, autoBatchCount - 1)">−</button>
                          <input type="number" min="1" max="100" v-model.number="autoBatchCount"/>
                          <button type="button" @click="autoBatchCount = Math.min(100, autoBatchCount + 1)">+</button>
                        </div>
                        <div class="cc-field-hint">Belgilangan har bir soatda shuncha post chiqadi</div>
                      </div>
                      <div class="cc-field" style="flex:1;min-width:140px;">
                        <label class="cc-field-label">Oldindan yig'ish (daqiqa)</label>
                        <input type="number" min="0" max="1440" v-model.number="autoCollectLeadMinutes" class="cc-inline-num" style="width:80px;"/>
                        <div class="cc-field-hint">Bot bu vaqt oldin postlarni yig'a boshlaydi</div>
                      </div>
                    </div>

                    <div v-if="scheduledPreviewText" class="cc-info-box info">
                      📅 <b>Natija:</b> {{ scheduledPreviewText.timesStr }}. <br>
                      ⏳ Har safar {{ scheduledPreviewText.leadStr }}.
                      <template v-if="autoDeliveryMode === 'approval'"> Postlar mobil ilovada tasdiqlanadi.</template>
                    </div>
                    <div v-else class="cc-info-box info">
                      💡 <b>Misol:</b> vaqtlar = 08:00 va 18:00, har vaqt = 5 ta → 08:00 da 5 ta, 18:00 da 5 ta post chiqadi. Bot 07:00 dan yig'a boshlaydi (60 daqiqa oldin).
                    </div>
                  </template>

                  <!-- Faol soatlar -->
                  <div class="cc-field">
                    <label class="cc-field-label">Faol soatlar oynasi</label>
                    <label class="cc-window-toggle">
                      <input type="checkbox" v-model="autoWindowEnabled"/>
                      <span>Faqat belgilangan soatlar ichida ishlaydi</span>
                    </label>
                    <div v-if="autoWindowEnabled" class="cc-window-row" style="margin-top:8px;">
                      <select v-model.number="autoActiveFromHour" class="cc-window-select">
                        <option v-for="h in HOUR_OPTIONS" :key="'f'+h.value" :value="h.value">{{ h.label }}</option>
                      </select>
                      <span class="cc-window-sep">dan</span>
                      <select v-model.number="autoActiveToHour" class="cc-window-select">
                        <option v-for="h in HOUR_OPTIONS" :key="'t'+h.value" :value="h.value">{{ h.label }}</option>
                      </select>
                      <span class="cc-window-sep">gacha</span>
                    </div>
                    <div class="cc-field-hint">
                      <template v-if="autoWindowEnabled">
                        Bot faqat {{ String(autoActiveFromHour).padStart(2,'0') }}:00 – {{ String(autoActiveToHour).padStart(2,'0') }}:00 orasida post yuboradi (Toshkent vaqti). Bu oraliqdan tashqarida yig'ilsa ham yuborilmaydi.
                      </template>
                      <template v-else>
                        Yoqilmagan — bot kun bo'yi ishlaydi. Kechasi chiqishini xohlamasangiz yoqing.
                      </template>
                    </div>
                  </div>
                </div>

                <!-- ═══ 3. KENGAYTIRILGAN FILTRLAR ═══ -->
                <button type="button" class="cc-advanced-toggle" @click="advancedFiltersOpen = !advancedFiltersOpen">
                  <span class="cc-advanced-toggle-icon" :style="{ transform: advancedFiltersOpen ? 'rotate(90deg)' : 'none' }">›</span>
                  <span class="cc-section-icon sm" style="background:color-mix(in oklab,var(--accent) 10%,transparent);color:var(--accent);">
                    <AppIcon name="Layers" :size="12"/>
                  </span>
                  <span>Qaysi postlar tanlansin</span>
                  <span class="cc-advanced-badge">
                    {{ [
                      autoFilters.source_type !== 'all' ? autoFilters.source_type : null,
                      autoCategoryIds.length ? autoCategoryIds.length + ' mavzu' : null,
                      autoFilters.keywords ? 'kalit so\'z' : null,
                    ].filter(Boolean).join(' · ') || 'barcha postlar' }}
                  </span>
                </button>

                <div v-if="advancedFiltersOpen" class="cc-advanced-body">
                  <!-- Mavzular -->
                  <div class="cc-field">
                    <label class="cc-field-label"><AppIcon name="Hash" :size="11" style="vertical-align:middle;margin-right:4px;"/>Mavzular (kategoriyalar)</label>
                    <div v-if="!categories.length" class="cc-field-hint" style="padding:4px 0;">
                      Hali kategoriya yo'q —
                      <a href="#/client/categories" class="cc-modal-link" style="display:inline;padding:0;">qo'shing</a>
                    </div>
                    <div v-else class="cc-chip-row">
                      <button v-for="cat in categories" :key="cat.id" type="button"
                        class="cc-chip" :class="{ active: autoCategoryIds.includes(cat.id) }"
                        :style="autoCategoryIds.includes(cat.id) && cat.color ? { borderColor: cat.color, background: cat.color + '1f', color: cat.color } : null"
                        @click="toggleAutoCategory(cat.id)">
                        <span v-if="cat.color" class="cc-chip-dot" :style="{background: cat.color}"/>
                        {{ cat.name }}
                      </button>
                    </div>
                    <div class="cc-field-hint">Bo'sh — hamma mavzulardan tanlanadi. Tanlansa — faqat shu kategoriyalarga mos postlar o'tadi.</div>
                  </div>

                  <!-- Vaqt oralig'i + har kanaldan -->
                  <div class="cc-auto-row" style="align-items:flex-start;">
                    <div class="cc-field" style="flex:1;min-width:160px;">
                      <label class="cc-field-label">Qaysi vaqt doirasidagi postlar izlansin</label>
                      <div class="cc-chip-row">
                        <button v-for="o in TIME_RANGE_OPTIONS" :key="o.value" type="button"
                          class="cc-chip" :class="{ active: autoFilters.time_range === o.value }"
                          @click="setTimeRange(o.value)">{{ o.label }}</button>
                      </div>
                      <div class="cc-field-hint">
                        <template v-if="autoFilters.time_range === 'unlimited'">
                          ♾️ Cheklanmagan — barcha saqlangan postlardan eng <b>qiziqarlisi</b> (reyting bo'yicha) tanlanadi.
                        </template>
                        <template v-else>
                          Manbalarda so'nggi <b>{{ {'3h':'3 soat','6h':'6 soat','12h':'12 soat','24h':'24 soat'}[autoFilters.time_range] || autoFilters.time_range }}</b> ichida chiqgan postlar ko'rib chiqiladi.
                        </template>
                      </div>
                    </div>
                    <div class="cc-field" style="flex:0 0 140px;">
                      <label class="cc-field-label">Har bir manbadan</label>
                      <div class="cc-num-input">
                        <button type="button" @click="autoFilters.per_channel = Math.max(1, autoFilters.per_channel - 1)">−</button>
                        <input type="number" min="1" max="30" v-model.number="autoFilters.per_channel"/>
                        <button type="button" @click="autoFilters.per_channel = Math.min(30, autoFilters.per_channel + 1)">+</button>
                      </div>
                      <div class="cc-field-hint">Ko'p manba bo'lsa bitta manbaga e'tibor qilmaydi</div>
                    </div>
                  </div>

                  <!-- Saralash + Takrorlanish -->
                  <div class="cc-auto-row" style="align-items:flex-start;">
                    <div class="cc-field" style="flex:1;">
                      <label class="cc-field-label">Saralash</label>
                      <div class="cc-chip-row">
                        <button v-for="o in SORT_MODE_OPTIONS" :key="o.value" type="button"
                          class="cc-chip" :class="{ active: autoFilters.sort_mode === o.value }"
                          @click="autoFilters.sort_mode = o.value">{{ o.label }}</button>
                      </div>
                      <div class="cc-field-hint">
                        <b>⭐ Yuqori ballli</b> — ko'rish/like/ulashish soni yuqori postlar.
                        <b>🕒 Eng oxirgi</b> — yangi chiqgan postlar (breaking news uchun yaxshi).
                      </div>
                    </div>
                    <div class="cc-field" style="flex:1;">
                      <label class="cc-field-label">Takrorlanishga sezgirlik</label>
                      <div class="cc-chip-row">
                        <button v-for="th in [{v:0.3,l:'Past'},{v:0.5,l:'O\'rta'},{v:0.7,l:'Yuqori'}]"
                          :key="th.v" type="button" class="cc-chip"
                          :class="{ active: autoFilters.similarity_threshold === th.v }"
                          @click="autoFilters.similarity_threshold = th.v">{{ th.l }}</button>
                      </div>
                      <div class="cc-field-hint">
                        <b>Past</b> — o'xshash postlar ham o'tadi (ko'proq tanlash).
                        <b>Yuqori</b> — kanalda mavjud postga o'xshasa rad etadi (kam tanlash).
                      </div>
                    </div>
                  </div>

                  <!-- Manba turi -->
                  <div class="cc-field">
                    <label class="cc-field-label">Manba turi</label>
                    <div class="cc-chip-row">
                      <button v-for="o in SOURCE_TYPE_OPTIONS" :key="o.value" type="button"
                        class="cc-chip" :class="{ active: autoFilters.source_type === o.value }"
                        @click="autoFilters.source_type = o.value">{{ o.label }}</button>
                    </div>
                    <div class="cc-field-hint">Faqat Telegram, faqat website yoki ikkalasidan birdan tanlasin</div>
                  </div>

                  <!-- Til + media -->
                  <div class="cc-auto-row" style="align-items:flex-start;">
                    <div class="cc-field" style="flex:1;">
                      <label class="cc-field-label">AI chiqish tili</label>
                      <div class="cc-chip-row">
                        <button v-for="l in LANG_OPTIONS" :key="l.value" type="button"
                          class="cc-chip" :class="{ active: autoOutputLanguage === l.value }"
                          @click="autoOutputLanguage = l.value">{{ l.label }}</button>
                      </div>
                      <div class="cc-field-hint">Manba qaysi tilda bo'lishidan qat'i nazar — post shu tilda chiqadi</div>
                    </div>
                    <div class="cc-field" style="flex:0 0 160px;">
                      <label class="cc-field-label">Media</label>
                      <label class="cc-toggle-row"><input type="checkbox" v-model="autoFilters.include_videos"/><span>Video postlar</span></label>
                      <label class="cc-toggle-row" style="margin-top:5px;"><input type="checkbox" v-model="autoFilters.require_media"/><span>Faqat media bilan</span></label>
                    </div>
                  </div>

                  <!-- Min uzunlik + kalit so'zlar -->
                  <div class="cc-auto-row" style="align-items:flex-start;">
                    <div class="cc-field" style="flex:0 0 140px;">
                      <label class="cc-field-label">Min. matn uzunligi</label>
                      <div class="cc-num-input">
                        <input type="number" min="0" v-model.number="autoFilters.min_length"/>
                        <span style="padding:0 8px;font-size:11px;color:var(--muted);">belgi</span>
                      </div>
                      <div class="cc-field-hint">Qisqaroq postlar o'tkazilmaydi</div>
                    </div>
                    <div class="cc-field" style="flex:1;min-width:200px;">
                      <label class="cc-field-label">Kalit so'zlar filtri</label>
                      <input type="text" class="cc-text-input" v-model="autoFilters.keywords" placeholder="iqtisod, valyuta, bank..."/>
                      <div class="cc-field-hint">Vergul bilan ajrating. Matnda kamida bitta kalit so'z bo'lsa o'tadi. Bo'sh — filtr yo'q.</div>
                    </div>
                  </div>
                </div>

                <!-- ═══ 4. AI SOZLAMALARI ═══ -->
                <button type="button" class="cc-advanced-toggle" @click="advancedAiOpen = !advancedAiOpen">
                  <span class="cc-advanced-toggle-icon" :style="{ transform: advancedAiOpen ? 'rotate(90deg)' : 'none' }">›</span>
                  <span class="cc-section-icon sm" style="background:color-mix(in oklab,var(--accent) 10%,transparent);color:var(--accent);">
                    <AppIcon name="Sparkle" :size="12"/>
                  </span>
                  <span>AI sozlamalari</span>
                  <span class="cc-advanced-badge">{{ autoProvider }} · {{ autoModel || 'default' }}</span>
                </button>

                <div v-if="advancedAiOpen" class="cc-advanced-body">
                  <!-- Tavsiya etilgan prompt -->
                  <label v-if="autoRecommended.exists" class="cc-recommend" :class="{ on: autoUseRecommended }">
                    <input type="checkbox" v-model="autoUseRecommended"/>
                    <div style="display:flex;flex-direction:column;gap:2px;flex:1;">
                      <span style="font-size:13px;font-weight:600;color:var(--text);">
                        ✨ Tavsiya etilgan promptdan foydalanish
                        <span v-if="autoRecommended.name" style="color:var(--muted);font-weight:400;">— {{ autoRecommended.name }}</span>
                      </span>
                      <span style="font-size:11px;color:var(--muted);">Admin tomonidan tayyorlangan eng yaxshi prompt avtomatik ishlatiladi.</span>
                    </div>
                  </label>
                  <div v-else-if="autoRecommended.loaded" class="cc-info-box warn">
                    ⚠️ Admin hali autopost uchun tavsiya etilgan prompt yaratmagan.
                  </div>

                  <!-- Prompt to'plami -->
                  <div class="cc-field">
                    <label class="cc-field-label">Prompt to'plami</label>
                    <div v-if="!aiPromptGroups.length && !autoUseRecommended" class="cc-info-box info">
                      Hali prompt to'plami yo'q.
                      <a href="#/client/ai-prompt" class="cc-modal-link" style="display:inline;padding:0;margin-left:4px;">AI prompt sahifasida yarating</a>
                    </div>
                    <select v-else v-model="autoPromptGroupId" :disabled="autoUseRecommended" class="cc-select" :style="{ opacity: autoUseRecommended ? 0.5 : 1, cursor: autoUseRecommended ? 'not-allowed' : 'pointer' }">
                      <option value="">— tanlanmagan (default AI) —</option>
                      <option v-for="g in aiPromptGroups" :key="g.id" :value="g.id">
                        {{ g.name }} · {{ g.prompts.length }} bo'lim{{ anyApplyBaseInGroup(g) ? ' · BASE' : '' }}
                      </option>
                    </select>
                    <div class="cc-field-hint">Kanal uchun maxsus uslub/mazmun ko'rsatmasi. Bo'sh — faqat admin prompt ishlatiladi.</div>
                  </div>

                  <!-- Provider + Model -->
                  <div class="cc-auto-row" style="align-items:flex-start;">
                    <div class="cc-field" style="flex:1;">
                      <label class="cc-field-label">AI provayder</label>
                      <div style="display:flex;gap:8px;">
                        <label v-for="p in AI_PROVIDERS" :key="p.id" class="cc-provider-label"
                          :style="{ borderColor: autoProvider === p.id ? 'var(--accent)' : 'var(--border-2)', background: autoProvider === p.id ? 'rgba(99,102,241,.06)' : 'var(--bg)' }">
                          <input type="radio" :value="p.id" v-model="autoProvider" @change="onAutoProviderChange" style="margin:0;"/>
                          <div>
                            <div style="font-size:12.5px;font-weight:600;">{{ p.label }}</div>
                            <div style="font-size:10.5px;color:var(--muted);">{{ p.note }}</div>
                          </div>
                        </label>
                      </div>
                    </div>
                    <div class="cc-field" style="flex:1;">
                      <label class="cc-field-label">AI model</label>
                      <select v-model="autoModel" class="cc-select mono">
                        <option v-for="m in autoAvailableModels" :key="m.id" :value="m.id">{{ m.label }}{{ m.note ? ' — ' + m.note : '' }}</option>
                      </select>
                    </div>
                  </div>

                  <!-- Test rejim -->
                  <div class="cc-field" style="border-top:1px dashed var(--border);padding-top:12px;margin-top:4px;">
                    <label class="cc-toggle-row">
                      <input type="checkbox" v-model="autoTestShowOriginal"/>
                      <span><b>Test rejim</b> — manba (ORIGINAL) postni ham yuborish</span>
                    </label>
                    <div class="cc-info-box info" style="margin-top:8px;">
                      🔬 Yoqilsa: har AI postdan avval manba post ham kanalga chiqadi
                      (<span style="color:#d97706;">🟡 ORIGINAL</span> → <span style="color:#16a34a;">🟢 AI VERSION</span>).
                      AI sifatini asl matn bilan qiyoslash uchun. O'chirilsa — faqat AI versiyasi.
                    </div>
                  </div>
                </div>

              </div>

              <div v-if="autoSaveError" class="cc-modal-error" style="margin:0 16px 0;">
                <AppIcon name="Close" :size="12"/>{{ autoSaveError }}
              </div>

              <div class="cc-modal-actions">
                <AppButton variant="secondary" size="md" @click="closeAutoModal">Bekor qilish</AppButton>
                <AppButton variant="primary" size="md" :loading="autoSaving" @click="saveAutoSettings">
                  <template #icon><AppIcon name="Check" :size="13"/></template>
                  {{ autoModalSwitching ? "Auto'ga o'tkazish va saqlash" : 'Saqlash' }}
                </AppButton>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ────── Reactivate Channel Modal ────── -->
    <Teleport to="body">
      <Transition name="cc-modal">
        <div v-if="reactivateModalOpen" class="cc-modal-backdrop" @click.self="closeReactivateModal">
          <div class="cc-modal" role="dialog" aria-modal="true">
            <button class="cc-modal-close" @click="closeReactivateModal" aria-label="Yopish">
              <AppIcon name="Close" :size="14"/>
            </button>

            <div class="cc-modal-hero" :style="{ background: heroGradient('telegram') }">
              <div aria-hidden class="cc-modal-hero-dots"/>
              <div class="cc-modal-hero-inner">
                <span class="cc-modal-hero-icon"><AppIcon name="Sparkle" :size="22"/></span>
                <div>
                  <div class="cc-modal-hero-title">Kanalni qayta faollashtirish</div>
                  <div class="cc-modal-hero-sub">
                    <b>{{ reactivateChannelData?.display_name || reactivateChannelData?.username }}</b>
                    — botni kanalga admin qilib qayta qo'shing
                  </div>
                </div>
              </div>
            </div>

            <div class="cc-modal-body">
              <div v-if="reactivateLoading" style="display:flex;align-items:center;justify-content:center;padding:40px 0;gap:10px;color:var(--muted);font-size:13px;">
                <span class="cc-spinner"/>
                Tayyorlanmoqda...
              </div>

              <template v-else-if="reactivateChannelData && reactivateChannelData.status === 'connected' && (reactivateChannelData.bot_status === 'administrator' || reactivateChannelData.bot_status === 'creator')">
                <div class="cc-success">
                  <div class="cc-success-icon"><AppIcon name="Check" :size="28"/></div>
                  <div style="text-align:center">
                    <div class="cc-success-title">Kanal qayta faollashtirildi!</div>
                    <div class="cc-success-sub">
                      <b>{{ reactivateChannelData?.display_name || reactivateChannelData?.username }}</b>
                      — bot endi admin sifatida ulangan
                    </div>
                  </div>
                  <div class="cc-modal-actions">
                    <AppButton variant="primary" size="md" @click="closeReactivateModal">Yopish</AppButton>
                  </div>
                </div>
              </template>

              <template v-else>
                <div class="cc-pending">
                  <div class="cc-pending-pulse">
                    <span class="cc-pending-pulse-ring r1"/>
                    <span class="cc-pending-pulse-ring r2"/>
                    <span class="cc-pending-pulse-icon" :style="platformIconStyle('telegram')">
                      <AppIcon name="Telegram" :size="18"/>
                    </span>
                  </div>
                  <div style="text-align:center;">
                    <div class="cc-pending-title">Botni qayta admin qiling</div>
                    <div class="cc-pending-sub">
                      <span class="mono" style="color:var(--text-2)">{{ reactivateChannelData?.username }}</span>
                      kanalida botni admin qilib qaytadan qo'shganingizdan keyin status avtomatik faollashadi.
                    </div>
                  </div>

                  <a v-if="reactivateDeepLink" :href="reactivateDeepLink" target="_blank" rel="noopener" class="cc-pending-cta">
                    <AppIcon name="Telegram" :size="14"/>
                    Telegramda ochish
                    <AppIcon name="Arrow" :size="13"/>
                  </a>

                  <div class="cc-pending-steps">
                    <div class="cc-step"><span class="cc-step-num">1</span> "Telegramda ochish" tugmasini bosing</div>
                    <div class="cc-step"><span class="cc-step-num">2</span> Bot profilidan "Add to Group or Channel" → kanalingizni tanlang</div>
                    <div class="cc-step"><span class="cc-step-num">3</span> Botga admin huquqlari bering — status avtomatik yangilanadi</div>
                  </div>

                  <div class="cc-reactivate-live">
                    <span class="cc-live-dot"/>
                    <span style="flex:1;">Bot kanaliga qo'shilishi avtomatik kuzatilmoqda</span>
                    <button type="button" class="cc-live-check" :disabled="reactivateChecking" @click="checkReactivateNow">
                      <span v-if="reactivateChecking" class="cc-spinner" style="width:11px;height:11px;border-width:1.5px;"/>
                      <AppIcon v-else name="Sparkle" :size="11"/>
                      Hozir tekshirish
                    </button>
                  </div>
                  <div v-if="reactivateAttempts > 0" style="font-size:11px;color:var(--muted);text-align:center;margin-top:-4px;">
                    {{ reactivateAttempts }} marta tekshirildi · bot hali admin emas
                  </div>
                </div>

                <div v-if="reactivateError" class="cc-modal-error">
                  <AppIcon name="Close" :size="12"/>
                  {{ reactivateError }}
                </div>
              </template>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ─── Kanal imzosi modal ─── -->
    <SignatureModal
      v-model="sigModalOpen"
      :channel="sigChannel"
      :initial-signature="sigInitial"
      @save="saveSignature"
    />

    <!-- ─── Kanal manbalari modal ─── -->
    <ChannelSourcesModal
      v-if="sourcesModalChannel && company"
      :company-id="company.id"
      :channel="sourcesModalChannel"
      @close="sourcesModalChannel = null"
    />

    <!-- ─── So'nggi postlar (3 kun) modal ─── -->
    <Teleport to="body">
      <Transition name="cc-modal">
        <div v-if="recentOpen" class="cc-modal-backdrop" @click.self="closeRecent">
          <div class="cc-modal cc-recent" role="dialog" aria-modal="true">
            <button class="cc-modal-close" @click="closeRecent" aria-label="Yopish">
              <AppIcon name="Close" :size="14"/>
            </button>

            <div class="cc-recent-head">
              <span class="cc-recent-head-icon"><AppIcon name="Eye" :size="16"/></span>
              <div style="min-width:0;">
                <div class="cc-recent-title">So'nggi postlar · 3 kun</div>
                <div class="cc-recent-sub">{{ recentChannel ? displayName(recentChannel) : '' }}</div>
              </div>
            </div>

            <div class="cc-recent-body">
              <div v-if="recentLoading" class="cc-recent-state">
                <span class="cc-spinner"/> Yuklanmoqda…
              </div>
              <div v-else-if="recentError" class="cc-recent-state" style="color:var(--danger);">
                {{ recentError }}
              </div>
              <div v-else-if="!recentPosts.length" class="cc-recent-state">
                Oxirgi 3 kunda Telegramga yuborilgan post yo'q.
              </div>
              <ul v-else class="cc-recent-list">
                <li v-for="p in recentPosts" :key="p.id" class="cc-recent-item">
                  <div class="cc-recent-item-main">
                    <a v-if="p.url" :href="p.url" target="_blank" rel="noopener" class="cc-recent-item-title">{{ p.title }}</a>
                    <span v-else class="cc-recent-item-title">{{ p.title }}</span>
                    <div class="cc-recent-item-meta">
                      <span><AppIcon name="Calendar" :size="10"/> {{ fmtPostTime(p.sent_at) }}</span>
                    </div>
                  </div>
                  <div class="cc-recent-views" :title="p.views_label ? 'Hozirgi ko\'rishlar' : 'Ko\'rish soni mavjud emas (private kanal?)'">
                    <AppIcon name="Eye" :size="12"/>
                    <span class="tabular">{{ p.views_label ?? '—' }}</span>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import AppButton from '@/components/ui/AppButton.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import AppPanel from '@/components/ui/AppPanel.vue'
import AppTabs from '@/components/ui/AppTabs.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import PageHeader from '@/components/layout/PageHeader.vue'
import SignatureModal from '@/components/channels/SignatureModal.vue'
import ChannelSourcesModal from '@/components/channels/ChannelSourcesModal.vue'
import ChannelActionsMenu from '@/components/channels/ChannelActionsMenu.vue'
import Sparkline from '@/components/ui/Sparkline.vue'
import { companiesApi } from '@/api/companies.js'
import { channelsApi } from '@/api/channels.js'
import { referencesApi } from '@/api/references.js'
import { categoriesApi } from '@/api/categories.js'
import { aiApi } from '@/api/ai.js'
import { useAppStore } from '@/stores/app.js'

const router = useRouter()
const route = useRoute()
const store = useAppStore()
const t = computed(() => store.t)
function tt(key, params) { return t.value(key, params) }

const view = ref('cards')
const statusFilter = ref('all')        // all | active | inactive
const platformFilter = ref('all')      // all | telegram | instagram | website
const channels = ref([])
const platforms = ref([])
const loading = ref(true)
const company = ref(null)

// ── Add channel modal state ────────────────────────────────────
const addModalOpen = ref(false)
const addPlatformSlug = ref('telegram')
const addUrl = ref('')
const addMode = ref('auto')          // 'auto' | 'manual'
const addSubmitting = ref(false)
const addError = ref('')
const addStage = ref('input')         // input | pending | success
const addedChannel = ref(null)
const addDeepLink = ref('')
let addPollTimer = null

// ── Meta (Facebook / Instagram) ulash ─────────────────────────
const metaModalOpen = ref(false)
const metaPages = ref([])          // { page_id, page_name, page_token, ig_user_id?, ig_username? }[]
const metaSessionToken = ref('')
const metaSelected = ref([])       // { type, name, page_id?, ig_user_id?, page_token }[]
const metaConnecting = ref(false)
const metaConnectError = ref('')
const metaNotify = ref('')         // URL'dagi meta_error yoki success xabari

// ── Avto-post sozlamalari (faqat auto rejimda) ─────────────────
const INTERVAL_PRESETS = [
  { value: 60,   label: '1 soat' },
  { value: 180,  label: '3 soat' },
  { value: 360,  label: '6 soat' },
  { value: 720,  label: '12 soat' },
  { value: 1440, label: '24 soat' },
]
// Faol vaqt oynasi uchun soatlar (0..23) — "08:00" ko'rinishida
const HOUR_OPTIONS = Array.from({ length: 24 }, (_, h) => ({
  value: h,
  label: String(h).padStart(2, '0') + ':00',
}))
const TIME_RANGE_OPTIONS = [
  { value: '3h',  label: '3 soat' },
  { value: '6h',  label: '6 soat' },
  { value: '12h', label: '12 soat' },
  { value: '24h', label: '24 soat' },
  { value: 'unlimited', label: '♾️ Cheklanmagan' },
]

// Vaqt oralig'ini tanlash. "Cheklanmagan" tanlansa — maqsad eng qiziqarli
// (ballli) post bo'ladi, shu sababli saralash majburan "best"ga o'tadi.
function setTimeRange(v) {
  autoFilters.value.time_range = v
  if (v === 'unlimited') autoFilters.value.sort_mode = 'best'
}
const SOURCE_TYPE_OPTIONS = [
  { value: 'all',      label: 'Hammasi' },
  { value: 'telegram', label: 'Telegram' },
  { value: 'website',  label: 'Website' },
]
// Til ro'yxati — ham manba filtri ("Til" chip-row), ham AI chiqish tili
// ("Chiqish alifbosi") uchun bitta umumiy ro'yxat ishlatiladi.
const LANG_OPTIONS = [
  { value: 'uz_lat', label: "O'zbek (lotin)" },
  { value: 'uz_cyr', label: "O'zbek (kirill)" },
  { value: 'ru', label: 'Rus tili' },
  { value: 'en', label: 'Ingliz tili' },
]

const categories = ref([])
const autoInterval = ref(60)
// Faol vaqt oynasi — yoqilsa autopost faqat shu soatlar oralig'ida ishlaydi (Toshkent vaqti)
const autoWindowEnabled = ref(false)
const autoActiveFromHour = ref(8)
const autoActiveToHour = ref(22)
const autoCategoryIds = ref([])         // []
const autoTestShowOriginal = ref(false) // test rejim toggle
// AI chiqish tili: uz_lat | uz_cyr | ru | en (LANG_OPTIONS bilan bir xil set)
const autoOutputLanguage = ref('uz_lat')
const OUTPUT_LANG_OPTIONS = LANG_OPTIONS.map((l) => ({ id: l.value, label: l.label }))
const autoFilters = ref({
  time_range: '24h',
  source_type: 'all',
  per_channel: 3,
  similarity_threshold: 0.5,
  sort_mode: 'best', // 'best' — yuqori ballli postlar; 'latest' — eng oxirgi maqolalar (posted_at)
  include_videos: true,
  require_media: false,
  min_length: 50,
  languages: [],
  keywords: '',
})

// ── Yetkazish usuli: 'approval' — mobil tasdiq kerak; 'direct' — darhol Telegram ──
const autoDeliveryMode = ref('approval')

// ── Yig'ish rejimi (approve oqimi) ──────────────────────────────────────────
// 'interval'  — har auto_interval_minutes'da yetkaziladi; buffer oldindan yig'iladi.
// 'scheduled' — belgilangan vaqtlarda (auto_schedule_times) to'plam yuboriladi.
const autoMode = ref('interval')
const autoScheduleTimes = ref([])       // ['08:00', '18:30']
const autoBatchCount = ref(10)          // scheduled: har vaqt uchun post soni
const autoCollectLeadMinutes = ref(60)  // scheduled: necha daqiqa oldin yig'ish
const autoIntervalBatchCount = ref(1)   // interval: tayyor turadigan buffer
const newScheduleTime = ref('08:00')    // UI: vaqt qo'shish inputi

function addScheduleTime() {
  const t = (newScheduleTime.value || '').trim()
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(t)) return
  if (!autoScheduleTimes.value.includes(t)) {
    autoScheduleTimes.value = [...autoScheduleTimes.value, t].sort()
  }
}
function removeScheduleTime(t) {
  autoScheduleTimes.value = autoScheduleTimes.value.filter(x => x !== t)
}

// ── Sozlamalar UI: kengaytirilgan bo'limlar ──────────────────────
const advancedFiltersOpen = ref(false)
const advancedAiOpen = ref(false)

// Interval rejim uchun insoniy preview matni
const intervalPreviewText = computed(() => {
  const m = autoInterval.value || 60
  let t
  if (m < 60) t = `${m} daqiqada`
  else if (m === 60) t = '1 soatda'
  else if (m % 60 === 0) t = `${m / 60} soatda`
  else t = `${Math.floor(m / 60)} soat ${m % 60} daqiqada`
  return t
})

// Scheduled rejim uchun preview
const scheduledPreviewText = computed(() => {
  const times = autoScheduleTimes.value
  const cnt = autoBatchCount.value
  const lead = autoCollectLeadMinutes.value
  if (!times.length) return null
  const timesStr = times.map(t => `${t} da ${cnt} ta`).join(', ')
  const leadStr = lead ? `${lead} daqiqa oldin yig'ish boshlanadi` : "yuborish vaqtida yig'iladi"
  return { timesStr, leadStr }
})

// Auto-post qaysi postlarni tanlasin: eng oxirgi (sana) yoki eng yuqori ballli
const SORT_MODE_OPTIONS = [
  { value: 'latest', label: '🕒 Eng oxirgi maqolalar' },
  { value: 'best', label: '⭐ Yuqori ballli postlar' },
]

// ── AI sozlamalari (prompt + provider + model + recommended) ──
const AI_PROVIDERS = [
  { id: 'openai', label: 'OpenAI',         note: 'GPT-4o, mini' },
  { id: 'gemini', label: 'Google Gemini',  note: '2.5 Pro / Flash' },
]
const AI_MODELS_BY_PROVIDER = {
  openai: [
    { id: 'gpt-4o-mini',   label: 'gpt-4o-mini',   note: 'tezkor (default)' },
    { id: 'gpt-4o',        label: 'gpt-4o',        note: 'eng kuchli' },
    { id: 'gpt-4-turbo',   label: 'gpt-4-turbo',   note: 'oldingi avlod' },
    { id: 'gpt-3.5-turbo', label: 'gpt-3.5-turbo', note: 'eng arzon' },
  ],
  gemini: [
    { id: 'gemini-2.5-flash',      label: 'gemini-2.5-flash',      note: 'tezkor (default)' },
    { id: 'gemini-2.5-pro',        label: 'gemini-2.5-pro',        note: 'eng kuchli' },
    { id: 'gemini-2.5-flash-lite', label: 'gemini-2.5-flash-lite', note: 'eng arzon' },
    { id: 'gemini-flash-latest',   label: 'gemini-flash-latest',   note: 'eng yangi Flash' },
  ],
}

const aiPromptGroups = ref([])
const autoPromptGroupId = ref('')
const autoProvider = ref('openai')
const autoModel = ref('gpt-4o-mini')
const autoUseRecommended = ref(false)
const autoRecommended = ref({ exists: false, name: null, loaded: false })

const autoAvailableModels = computed(() =>
  AI_MODELS_BY_PROVIDER[autoProvider.value] || [],
)

// Provider o'zgarsa, modelni provayderning birinchi modeliga tushiramiz
function onAutoProviderChange() {
  const list = AI_MODELS_BY_PROVIDER[autoProvider.value] || []
  if (list.length && !list.some(m => m.id === autoModel.value)) {
    autoModel.value = list[0].id
  }
}

async function loadCategories() {
  if (!company.value) return
  try {
    const data = await categoriesApi.list(company.value.id)
    categories.value = Array.isArray(data) ? data : []
  } catch { categories.value = [] }
}

function toggleAutoCategory(id) {
  const i = autoCategoryIds.value.indexOf(id)
  if (i === -1) autoCategoryIds.value.push(id)
  else autoCategoryIds.value.splice(i, 1)
}
function toggleAutoLanguage(code) {
  const i = autoFilters.value.languages.indexOf(code)
  if (i === -1) autoFilters.value.languages.push(code)
  else autoFilters.value.languages.splice(i, 1)
}
function resetAutoSettings() {
  autoInterval.value = 180
  autoDeliveryMode.value = 'approval'
  autoMode.value = 'interval'
  autoScheduleTimes.value = []
  autoBatchCount.value = 10
  autoCollectLeadMinutes.value = 60
  autoIntervalBatchCount.value = 1
  autoWindowEnabled.value = false
  autoActiveFromHour.value = 8
  autoActiveToHour.value = 22
  autoCategoryIds.value = []
  autoFilters.value = {
    time_range: '24h',
    source_type: 'all',
    per_channel: 3,
    similarity_threshold: 0.5,
    sort_mode: 'best',
    include_videos: true,
    require_media: false,
    min_length: 50,
    languages: [],
    keywords: '',
  }
  autoPromptGroupId.value = ''
  autoProvider.value = 'openai'
  autoModel.value = 'gpt-4o-mini'
  autoUseRecommended.value = false
  autoOutputLanguage.value = 'uz_lat'
}

function anyApplyBaseInGroup(g) {
  return (g?.prompts || []).some((p) => !!p.apply_base)
}

// ── Status helperlari ─────────────────────────────────────────────
function isActive(c) {
  return c.status === 'connected' && (c.bot_status === 'administrator' || c.bot_status === 'creator')
}
function statusLabel(c) { return isActive(c) ? tt('cc.status.active') : tt('cc.status.inactive') }

function displayName(c) {
  return c.display_name || c.username || `${tt('cc.col.channel')} #${(c.id || '').slice(0, 6)}`
}

function identifier(c) {
  // Telegram — @username. Boshqa platforma — URL yoki handle.
  return c.username || c.telegram_chat_id || '—'
}

function botStatusLabel(s) {
  if (!s) return '—'
  return tt(`cc.botStatus.${s}`) || s
}

function chatTypeLabel(ct) {
  if (!ct) return '—'
  return tt(`cc.chatType.${ct}`) || '—'
}

const UZ_MONTHS = ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyn', 'Iyl', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek']

function parseDate(value) {
  if (!value) return null
  if (value instanceof Date) return isNaN(value.getTime()) ? null : value
  // Postgres "YYYY-MM-DD HH:mm:ss.sss" format — Safari parsa olmasligi mumkin,
  // shuning uchun bo'shliqni T ga almashtiramiz
  let s = String(value).trim()
  if (/^\d{4}-\d{2}-\d{2}\s\d{2}:\d{2}/.test(s)) s = s.replace(' ', 'T')
  const dt = new Date(s)
  return isNaN(dt.getTime()) ? null : dt
}

function connectedDate(c) {
  // Faol bo'lsa connected_at, aks holda added_at (qo'shilgan sana)
  const dt = parseDate(c.connected_at) || parseDate(c.added_at)
  if (!dt) return '—'
  const d = dt.getDate().toString().padStart(2, '0')
  const m = UZ_MONTHS[dt.getMonth()] || ''
  const y = dt.getFullYear()
  return `${d} ${m} ${y}`
}

function connectedDateFull(c) {
  const dt = parseDate(c.connected_at) || parseDate(c.added_at)
  if (!dt) return ''
  const d = dt.getDate().toString().padStart(2, '0')
  const m = UZ_MONTHS[dt.getMonth()] || ''
  const y = dt.getFullYear()
  const hh = dt.getHours().toString().padStart(2, '0')
  const mm = dt.getMinutes().toString().padStart(2, '0')
  return `${d} ${m} ${y}, ${hh}:${mm}`
}

// ── Platforma helperlari ──────────────────────────────────────────
function platformSlug(c) {
  return c.platform_type || c.platform?.slug || 'telegram'
}

function platformName(p) {
  if (!p) return 'Telegram'
  return p.name_i18n?.uz || p.name_i18n?.en || p.slug
}

function platformIconName(slug) {
  if (slug === 'instagram') return 'Instagram'
  if (slug === 'facebook') return 'Facebook'
  if (slug === 'website') return 'Globe'
  return 'Telegram'
}

function platformColor(c) {
  const slug = typeof c === 'string' ? c : platformSlug(c)
  if (slug === 'instagram') return '#E1306C'
  if (slug === 'facebook') return '#1877F2'
  if (slug === 'website') return '#64748B'
  return '#2AABEE' // telegram
}

function platformIconStyle(slug, size = 'md') {
  const dim = size === 'sm' ? '26px' : size === 'lg' ? '44px' : '36px'
  const radius = size === 'sm' ? '6px' : size === 'lg' ? '12px' : '10px'
  let bg, fg
  if (slug === 'instagram') {
    bg = 'linear-gradient(135deg,#f9ce34,#ee2a7b,#6228d7)'
    fg = '#fff'
  } else if (slug === 'facebook') {
    bg = '#1877F2'
    fg = '#fff'
  } else if (slug === 'website') {
    bg = 'var(--panel-2)'
    fg = 'var(--text-2)'
  } else {
    bg = '#2AABEE'
    fg = '#fff'
  }
  return {
    width: dim,
    height: dim,
    borderRadius: radius,
    background: bg,
    color: fg,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  }
}

// ── Kartali dizayn helperlari (zip prototipiga mos) ───────────────
function fmtCompact(n) {
  const x = Number(n) || 0
  if (x >= 1_000_000) return (x / 1_000_000).toFixed(x >= 10_000_000 ? 0 : 1).replace(/\.0$/, '') + 'M'
  if (x >= 1_000) return (x / 1_000).toFixed(x >= 10_000 ? 0 : 1).replace(/\.0$/, '') + 'K'
  return String(x)
}
function modeOf(c) { return c.posting_mode || 'auto' }
function avatarBg(c) {
  const name = displayName(c)
  const hue = [...name].reduce((a, ch) => a + ch.charCodeAt(0), 0) % 360
  return `linear-gradient(135deg, oklch(0.68 0.15 ${hue}), oklch(0.55 0.16 ${(hue + 40) % 360}))`
}
function activitySeries(c) {
  const s = Array.isArray(c.activity_series) ? c.activity_series : []
  return s.length ? s : [0, 0, 0, 0, 0, 0, 0, 0]
}
function hasActivity(c) {
  return activitySeries(c).some(v => v > 0)
}
function trendDelta(c) {
  const s = activitySeries(c)
  const a = s[0], b = s[s.length - 1]
  if (!a) return b > 0 ? 100 : 0
  return ((b - a) / a) * 100
}
function lastPostRelative(c) {
  const dt = parseDate(c.last_post_at)
  if (!dt) return '—'
  const diff = (Date.now() - dt.getTime()) / 1000
  if (diff < 60) return 'hozirgina'
  if (diff < 3600) return `${Math.floor(diff / 60)} daq. oldin`
  if (diff < 86400) return `${Math.floor(diff / 3600)} soat oldin`
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)} kun oldin`
  return connectedDate({ connected_at: c.last_post_at })
}
function gotoPosts(c) {
  router.push({ path: '/client/posts', query: { channel: c.id } })
}

// ── So'nggi postlar (3 kun) modal ─────────────────────────────────
const recentOpen = ref(false)
const recentLoading = ref(false)
const recentChannel = ref(null)
const recentPosts = ref([])
const recentError = ref('')

async function openRecent(c) {
  recentChannel.value = c
  recentOpen.value = true
  recentLoading.value = true
  recentError.value = ''
  recentPosts.value = []
  try {
    recentPosts.value = await channelsApi.recentPosts(company.value.id, c.id)
  } catch (e) {
    recentError.value = e?.response?.data?.message || 'Postlarni yuklab bo\'lmadi'
  } finally {
    recentLoading.value = false
  }
}
function closeRecent() {
  recentOpen.value = false
  recentChannel.value = null
  recentPosts.value = []
}
function fmtPostTime(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  const now = new Date()
  const sameDay = d.toDateString() === now.toDateString()
  const y = new Date(now); y.setDate(now.getDate() - 1)
  const isYesterday = d.toDateString() === y.toDateString()
  const hm = d.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })
  if (sameDay) return `Bugun ${hm}`
  if (isYesterday) return `Kecha ${hm}`
  return `${d.toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit' })} ${hm}`
}

// ── Tab'lar ───────────────────────────────────────────────────────
const headerSubtitle = computed(() => {
  if (loading.value) return ''
  const total = channels.value.length
  if (!total) return tt('cc.subtitleEmpty')
  const active = channels.value.filter(isActive).length
  return tt('cc.subtitle', { total, active })
})

const statusTabs = computed(() => [
  { value: 'all',      label: tt('cc.filter.all'),      count: channels.value.length },
  { value: 'active',   label: tt('cc.filter.active'),   count: channels.value.filter(isActive).length },
  { value: 'inactive', label: tt('cc.filter.inactive'), count: channels.value.filter(c => !isActive(c)).length },
])

const platformTabs = computed(() => {
  const counts = {}
  for (const c of channels.value) {
    const s = platformSlug(c)
    counts[s] = (counts[s] || 0) + 1
  }
  const tabs = [{ value: 'all', label: tt('cc.filter.allPlatforms') }]
  for (const p of platforms.value) {
    // Telegram'ni doim ko'rsatamiz, qolganlarni faqat is_available bo'lsa yoki kanali bo'lsa
    if (!p.is_available && !counts[p.slug]) continue
    tabs.push({ value: p.slug, label: platformName(p), count: counts[p.slug] || 0 })
  }
  return tabs
})

const tableHeaders = computed(() => [
  tt('cc.col.platform'),
  tt('cc.col.type'),
  tt('cc.col.botStatus'),
  tt('cc.col.mode'),
  tt('cc.col.connectedAt'),
  tt('cc.col.status'),
  '',
])

const filteredList = computed(() => {
  return channels.value.filter(c => {
    // status filter
    if (statusFilter.value === 'active' && !isActive(c)) return false
    if (statusFilter.value === 'inactive' && isActive(c)) return false
    // platform filter
    if (platformFilter.value !== 'all' && platformSlug(c) !== platformFilter.value) return false
    return true
  })
})

// Kanal soniga qarab grid: 1 → butun ekran, 2 → 50%, 3+ → 3 ustun
const gridClass = computed(() => {
  // Kartalar kattaroq ko'rinishi uchun ko'pi bilan 2 ustun.
  const n = filteredList.value.length
  if (n <= 1) return 'ccx-grid-1'
  return 'ccx-grid-2'
})

// ── Data loading ──────────────────────────────────────────────────
async function loadAll() {
  loading.value = true
  try {
    const [companies, plats] = await Promise.all([
      companiesApi.getMy().catch(() => []),
      referencesApi.getPlatforms().catch(() => []),
    ])
    platforms.value = Array.isArray(plats) ? plats : []
    const list = Array.isArray(companies) ? companies : [companies].filter(Boolean)
    company.value = list[0] || null
    if (!company.value) {
      channels.value = []
      return
    }
    const data = await channelsApi.list(company.value.id)
    channels.value = data || []
    loadCategories()
  } catch {
    channels.value = []
  } finally {
    loading.value = false
  }
}

// Bitta-kanal endpointlari (getStatus / setPostingMode / setSignature / saveAuto…)
// backendda attachMetrics chaqirmaydi — sources_count, sources_telegram/website,
// posts_7d, last_post_at, activity_series kabi HISOBLANGAN maydonlar ularda
// bo'lmaydi. Ro'yxatdagi kanalni shunday "yalang'och" obyekt bilan to'g'ridan-to'g'ri
// almashtirsak, UI'da manbalar 0 bo'lib ko'rinadi (refresh bosilganda tiklanadi).
// Shu sabab eski obyektdagi metrikalarni saqlab qolib birlashtiramiz.
const METRIC_KEYS = ['sources_count', 'sources_telegram', 'sources_website', 'posts_7d', 'last_post_at', 'activity_series']
function replaceChannel(fresh) {
  if (!fresh) return
  const idx = channels.value.findIndex(x => x.id === fresh.id)
  if (idx < 0) return false
  const prev = channels.value[idx] || {}
  const merged = { ...prev, ...fresh }
  for (const k of METRIC_KEYS) {
    if (merged[k] == null && prev[k] != null) merged[k] = prev[k]
  }
  channels.value.splice(idx, 1, merged)
  return true
}

async function togglePostingMode(c) {
  const current = c.posting_mode || 'auto'
  const next = current === 'auto' ? 'manual' : 'auto'

  // manual → auto: avval sozlamalar modalini ochib olaylik
  if (next === 'auto') {
    openAutoSettings(c, { switchFromManual: true })
    return
  }

  // auto → manual: darhol saqlaymiz
  try {
    const updated = await channelsApi.setPostingMode(company.value.id, c.id, next)
    replaceChannel(updated)
  } catch {}
}

// ── Kanal manbalari (sources) modal ───────────────────────
const sourcesModalChannel = ref(null)
function openSources(channel) {
  sourcesModalChannel.value = channel
}

// ── Imzo (signature) modal ─────────────────────────────────
const sigModalOpen = ref(false)
const sigChannel = ref(null)
const sigInitial = ref('')

function openSignature(channel) {
  sigChannel.value = channel
  sigInitial.value = channel.signature || ''
  sigModalOpen.value = true
}

async function saveSignature(htmlOrNull) {
  if (!sigChannel.value || !company.value) return
  try {
    const updated = await channelsApi.setSignature(
      company.value.id,
      sigChannel.value.id,
      htmlOrNull,
    )
    // Channels ro'yxatida yangilangan kanalni almashtiramiz
    replaceChannel(updated)
    sigModalOpen.value = false
  } catch (e) {
    const msg = e?.response?.data?.message
    alert(Array.isArray(msg) ? msg.join('. ') : (msg || "Imzoni saqlab bo'lmadi"))
  }
}

// ── Mavjud kanal uchun "Avto-post sozlamalari" modal ─────────
const autoModalOpen = ref(false)
const autoModalChannel = ref(null)
const autoModalSwitching = ref(false)   // manualdan auto'ga o'tish bayrog'i
const autoSaving = ref(false)
const autoSaveError = ref('')

async function openAutoSettings(channel, opts = {}) {
  autoModalChannel.value = channel
  // Modal "auto-post" sozlamalari uchun — kanal hali 'auto' bo'lmasa, saqlashda
  // posting_mode'ni 'auto'ga o'tkazish SHART. Aks holda worker (posting_mode='auto'
  // filtri) kanalni ko'rmaydi va 'direct' tanlangan bo'lsa ham hech narsa yubormaydi.
  autoModalSwitching.value = !!opts.switchFromManual || (channel.posting_mode || 'auto') !== 'auto'
  autoSaveError.value = ''

  // Kanal sozlamalari bilan oldindan to'ldiramiz
  autoInterval.value = channel.auto_interval_minutes || 180
  // Faol vaqt oynasi — ikkala soat ham mavjud bo'lsa yoqilgan hisoblanadi
  const hasWindow = channel.auto_active_from_hour != null && channel.auto_active_to_hour != null
  autoWindowEnabled.value = hasWindow
  autoActiveFromHour.value = hasWindow ? channel.auto_active_from_hour : 8
  autoActiveToHour.value = hasWindow ? channel.auto_active_to_hour : 22
  // Yetkazish usuli
  autoDeliveryMode.value = channel.auto_delivery_mode === 'direct' ? 'direct' : 'approval'
  // Yig'ish rejimi sozlamalari
  autoMode.value = channel.auto_mode === 'scheduled' ? 'scheduled' : 'interval'
  autoScheduleTimes.value = Array.isArray(channel.auto_schedule_times) ? [...channel.auto_schedule_times] : []
  autoBatchCount.value = channel.auto_batch_count || 10
  autoCollectLeadMinutes.value = channel.auto_collect_lead_minutes ?? 60
  autoIntervalBatchCount.value = channel.auto_interval_batch_count || 1
  autoCategoryIds.value = Array.isArray(channel.auto_category_ids) ? [...channel.auto_category_ids] : []
  autoTestShowOriginal.value = !!channel.test_show_original
  const f = channel.auto_filters || {}
  const fTypes = Array.isArray(f.source_types) ? f.source_types : []
  autoFilters.value = {
    time_range: f.time_range || '24h',
    source_type: fTypes.length === 1 ? fTypes[0] : 'all',
    per_channel: f.per_channel ?? 3,
    similarity_threshold: f.similarity_threshold ?? 0.5,
    sort_mode: f.sort_mode === 'latest' ? 'latest' : 'best',
    include_videos: f.include_videos !== false,
    require_media: !!f.require_media,
    min_length: f.min_length ?? 50,
    languages: Array.isArray(f.languages) ? [...f.languages] : [],
    keywords: Array.isArray(f.keywords) ? f.keywords.join(', ') : (f.keywords || ''),
  }

  // AI sozlamalari — kanaldan o'qib qabul qilamiz (NULL bo'lsa default)
  autoPromptGroupId.value = channel.auto_prompt_group_id || ''
  autoProvider.value = channel.auto_provider || 'openai'
  autoModel.value = channel.auto_model || (AI_MODELS_BY_PROVIDER[autoProvider.value]?.[0]?.id || 'gpt-4o-mini')
  autoUseRecommended.value = !!channel.auto_use_admin_recommended
  autoOutputLanguage.value = ['uz_lat', 'uz_cyr', 'ru', 'en'].includes(channel.auto_output_language)
    ? channel.auto_output_language
    : 'uz_lat'

  loadCategories()
  autoModalOpen.value = true

  // Parallel: prompt to'plamlari + admin tavsiya etgan prompt
  try {
    if (company.value) {
      const r = await companiesApi.getAiPromptGroups(company.value.id)
      aiPromptGroups.value = r.groups || []
      // Saqlangan groupId DB'da yo'q bo'lsa — birinchisini tanlash
      if (autoPromptGroupId.value && !aiPromptGroups.value.some(g => g.id === autoPromptGroupId.value)) {
        autoPromptGroupId.value = aiPromptGroups.value[0]?.id || ''
      }
    }
  } catch { aiPromptGroups.value = [] }

  try {
    const r = await aiApi.getRecommendedPrompt('autopost')
    autoRecommended.value = { exists: !!r?.exists, name: r?.name || null, loaded: true }
  } catch (e) {
    autoRecommended.value = { exists: false, name: null, loaded: true }
    console.warn('[Autopost] recommended prompt fetch failed:', e?.response?.data || e?.message)
  }
  // Tavsiya etilgan prompt yo'q bo'lsa — flagni majburan o'chiramiz
  if (!autoRecommended.value.exists && autoUseRecommended.value) {
    autoUseRecommended.value = false
  }
}

function closeAutoModal() {
  autoModalOpen.value = false
  autoModalChannel.value = null
  autoModalSwitching.value = false
  autoSaving.value = false
  autoSaveError.value = ''
}

async function saveAutoSettings() {
  if (!autoModalChannel.value || !company.value) return
  autoSaving.value = true
  autoSaveError.value = ''
  try {
    let updated = autoModalChannel.value

    updated = await channelsApi.updateAutoSettings(company.value.id, updated.id, {
      auto_delivery_mode: autoDeliveryMode.value,
      auto_interval_minutes: autoInterval.value,
      auto_mode: autoMode.value,
      auto_schedule_times: autoMode.value === 'scheduled' ? [...autoScheduleTimes.value] : [],
      auto_batch_count: autoBatchCount.value,
      auto_collect_lead_minutes: autoCollectLeadMinutes.value,
      auto_interval_batch_count: autoIntervalBatchCount.value,
      auto_category_ids: [...autoCategoryIds.value],
      auto_filters: {
        time_range: autoFilters.value.time_range,
        source_types: autoFilters.value.source_type === 'all' ? [] : [autoFilters.value.source_type],
        per_channel: autoFilters.value.per_channel,
        similarity_threshold: autoFilters.value.similarity_threshold,
        sort_mode: autoFilters.value.sort_mode,
        include_videos: autoFilters.value.include_videos,
        require_media: autoFilters.value.require_media,
        min_length: autoFilters.value.min_length,
        languages: [...autoFilters.value.languages],
        keywords: (autoFilters.value.keywords || '')
          .split(',').map(s => s.trim()).filter(Boolean),
      },
      test_show_original: autoTestShowOriginal.value,
      // AI sozlamalari — kanal DB qatorida saqlanadi
      auto_prompt_group_id: autoUseRecommended.value ? null : (autoPromptGroupId.value || null),
      auto_provider: autoProvider.value,
      auto_model: autoModel.value || null,
      auto_use_admin_recommended: autoUseRecommended.value,
      auto_output_language: autoOutputLanguage.value,
      auto_active_from_hour: autoWindowEnabled.value ? autoActiveFromHour.value : null,
      auto_active_to_hour: autoWindowEnabled.value ? autoActiveToHour.value : null,
    })

    // posting_mode ENG OXIRIDA yoqiladi — sozlamalar (jumladan tasdiqlash
    // rejimi) saqlanib bo'lgach kanal dispatcher'ga ko'rinadi. Aks holda
    // collect tick eski sozlamalar bilan post yig'ib yuborishi mumkin edi.
    if (autoModalSwitching.value) {
      updated = await channelsApi.setPostingMode(company.value.id, updated.id, 'auto')
    }

    replaceChannel(updated)
    closeAutoModal()
  } catch (err) {
    const msg = err?.response?.data?.message
    autoSaveError.value = Array.isArray(msg) ? msg.join('. ') : (msg || 'Sozlamalarni saqlab boʻlmadi')
  } finally {
    autoSaving.value = false
  }
}

// ── Kanalni qayta faollashtirish modal ─────────────────────
const reactivateModalOpen = ref(false)
const reactivateChannelData = ref(null)
const reactivateDeepLink = ref('')
const reactivateLoading = ref(false)
const reactivateError = ref('')
const reactivateAttempts = ref(0)
const reactivateChecking = ref(false)
let reactivatePollTimer = null

async function openReactivateModal(c) {
  if (!company.value) return
  reactivateChannelData.value = c
  reactivateDeepLink.value = ''
  reactivateError.value = ''
  reactivateAttempts.value = 0
  reactivateChecking.value = false
  reactivateLoading.value = true
  reactivateModalOpen.value = true
  try {
    const raw = (c.username || '').replace(/^@/, '')
    const url = raw ? `https://t.me/${raw}` : (c.telegram_chat_id || '')
    const res = await channelsApi.initTelegram(company.value.id, url, c.posting_mode || 'auto')
    reactivateChannelData.value = res.channel
    reactivateDeepLink.value = res.deep_link
    replaceChannel(res.channel)
    if (res.channel.status !== 'connected' || (res.channel.bot_status !== 'administrator' && res.channel.bot_status !== 'creator')) {
      startReactivatePolling()
    }
  } catch (err) {
    const msg = err?.response?.data?.message
    reactivateError.value = Array.isArray(msg) ? msg.join('. ') : (msg || tt('cc.modal.err.generic'))
  } finally {
    reactivateLoading.value = false
  }
}

function closeReactivateModal() {
  reactivateModalOpen.value = false
  reactivateChannelData.value = null
  reactivateDeepLink.value = ''
  stopReactivatePolling()
  loadAll()
}

function startReactivatePolling() {
  stopReactivatePolling()
  reactivatePollTimer = setInterval(async () => {
    if (!reactivateChannelData.value) { stopReactivatePolling(); return }
    try {
      const fresh = await channelsApi.getStatus(company.value.id, reactivateChannelData.value.id)
      reactivateChannelData.value = fresh
      reactivateAttempts.value += 1
      replaceChannel(fresh)
      if (fresh.status === 'connected' && (fresh.bot_status === 'administrator' || fresh.bot_status === 'creator')) {
        stopReactivatePolling()
      }
    } catch {}
  }, 4000)
}

async function checkReactivateNow() {
  if (!reactivateChannelData.value || !company.value) return
  reactivateChecking.value = true
  try {
    const fresh = await channelsApi.getStatus(company.value.id, reactivateChannelData.value.id)
    reactivateChannelData.value = fresh
    reactivateAttempts.value += 1
    replaceChannel(fresh)
    if (fresh.status === 'connected' && (fresh.bot_status === 'administrator' || fresh.bot_status === 'creator')) {
      stopReactivatePolling()
    }
  } catch {} finally {
    reactivateChecking.value = false
  }
}

function stopReactivatePolling() {
  if (reactivatePollTimer) { clearInterval(reactivatePollTimer); reactivatePollTimer = null }
}

async function removeChannel(c) {
  if (!confirm(tt('cc.confirmRemove', { name: displayName(c) }))) return
  try {
    await channelsApi.remove(company.value.id, c.id)
    channels.value = channels.value.filter(x => x.id !== c.id)
  } catch (err) {
    const msg = err?.response?.data?.message || tt('cc.modal.err.generic')
    alert(Array.isArray(msg) ? msg.join('. ') : msg)
  }
}

// ── Add channel modal logikasi ─────────────────────────────────
const heroSubtitle = computed(() => {
  if (addPlatformSlug.value === 'telegram') return tt('cc.modal.subtitle.telegram')
  if (addPlatformSlug.value === 'instagram') return tt('cc.modal.subtitle.instagram')
  if (addPlatformSlug.value === 'website') return tt('cc.modal.subtitle.website')
  return tt('cc.add')
})

const urlHintHtml = computed(() => {
  const ex1 = '<span class="mono">https://t.me/my_channel</span>'
  const ex2 = '<span class="mono">@my_channel</span>'
  return tt('cc.modal.urlHint', { ex1, ex2 })
})

const urlPlaceholder = computed(() => {
  if (addPlatformSlug.value === 'telegram') return 'https://t.me/my_channel'
  if (addPlatformSlug.value === 'instagram') return 'https://instagram.com/profile'
  if (addPlatformSlug.value === 'website') return 'https://example.uz'
  return 'URL'
})

function heroGradient(slug) {
  if (slug === 'instagram') {
    return 'linear-gradient(135deg, #FFB840 0%, #ee2a7b 50%, #6228d7 100%)'
  }
  if (slug === 'facebook') {
    return 'linear-gradient(135deg, #4267B2 0%, #1877F2 100%)'
  }
  if (slug === 'website') {
    return 'linear-gradient(135deg, #475569 0%, #1E293B 100%)'
  }
  // telegram default
  return 'linear-gradient(135deg, #4FC0E8 0%, #2AABEE 55%, #1E97D6 100%)'
}

function openAddModal(slug = 'telegram') {
  addPlatformSlug.value = slug
  addUrl.value = ''
  addMode.value = 'auto'
  addError.value = ''
  addStage.value = 'input'
  addedChannel.value = null
  addDeepLink.value = ''
  resetAutoSettings()
  loadCategories()
  addModalOpen.value = true
}

function closeAddModal() {
  addModalOpen.value = false
  stopAddPolling()
  // Agar foydalanuvchi yopgan bo'lsa, ro'yxatni yangilab qo'yamiz
  loadAll()
}

function resetStage() {
  stopAddPolling()
  addStage.value = 'input'
  addUrl.value = ''
  addError.value = ''
  addedChannel.value = null
}

function switchPlatform(p) {
  if (!p.is_available) return
  addPlatformSlug.value = p.slug
  resetStage()
}

/** Facebook yoki Instagram ulash: Meta OAuth sahifasiga yo'naltiradi. */
async function startMetaOAuth() {
  if (!company.value) return
  try {
    const { url } = await channelsApi.getMetaOAuthUrl(company.value.id)
    window.location.href = url
  } catch (e) {
    addError.value = e?.response?.data?.message || 'Meta OAuth URL olib bo\'lmadi'
  }
}

/** Meta callback qaytganidan keyin sessiyani yuklash va modal ochish. */
async function handleMetaSession(sessionToken, companyId) {
  if (!company.value || company.value.id !== companyId) {
    // company hali yuklanmagan bo'lishi mumkin — kutamiz
    await new Promise(r => setTimeout(r, 800))
    if (!company.value) return
  }
  try {
    const data = await channelsApi.getMetaSession(company.value.id, sessionToken)
    if (data.pages?.length) {
      metaPages.value = data.pages
      metaSessionToken.value = sessionToken
      metaSelected.value = []
      metaConnectError.value = ''
      metaModalOpen.value = true
    } else {
      metaNotify.value = data.error || 'Facebook sahifalar topilmadi'
    }
  } catch {
    metaNotify.value = 'Meta sessiyani yuklashda xato'
  }
}

function toggleMetaItem(type, item) {
  const key = type === 'facebook' ? item.page_id : item.ig_user_id
  const idx = metaSelected.value.findIndex(s => (s.page_id || s.ig_user_id) === key)
  if (idx >= 0) {
    metaSelected.value.splice(idx, 1)
  } else {
    metaSelected.value.push({
      type,
      name: type === 'facebook' ? item.page_name : ('@' + (item.ig_username || item.ig_user_id)),
      page_id: type === 'facebook' ? item.page_id : undefined,
      ig_user_id: type === 'instagram' ? item.ig_user_id : undefined,
      page_token: item.page_token,
    })
  }
}

function isMetaItemSelected(type, item) {
  const key = type === 'facebook' ? item.page_id : item.ig_user_id
  return metaSelected.value.some(s => (s.page_id || s.ig_user_id) === key)
}

async function connectMetaPages() {
  if (!metaSelected.value.length || !company.value) return
  metaConnecting.value = true
  metaConnectError.value = ''
  try {
    await channelsApi.connectMeta(company.value.id, metaSessionToken.value, metaSelected.value)
    metaModalOpen.value = false
    await loadAll()
  } catch (e) {
    metaConnectError.value = e?.response?.data?.message || 'Ulashda xato yuz berdi'
  } finally {
    metaConnecting.value = false
  }
}

async function submitAdd() {
  addError.value = ''
  const url = addUrl.value.trim()
  if (!company.value) { addError.value = tt('cc.modal.err.noCompany'); return }
  if (addPlatformSlug.value === 'facebook' || addPlatformSlug.value === 'instagram') {
    await startMetaOAuth()
    return
  }
  if (!url) { addError.value = tt('cc.modal.err.noUrl'); return }
  if (addPlatformSlug.value !== 'telegram') {
    addError.value = tt('cc.modal.err.unsupported')
    return
  }

  addSubmitting.value = true
  try {
    const res = await channelsApi.initTelegram(company.value.id, url, addMode.value)
    addedChannel.value = res.channel
    addDeepLink.value = res.deep_link

    // Auto rejimda qo'shimcha sozlamalarni darhol saqlaymiz
    if (addMode.value === 'auto' && res.channel?.id) {
      try {
        const updated = await channelsApi.updateAutoSettings(company.value.id, res.channel.id, {
          auto_delivery_mode: autoDeliveryMode.value,
          auto_interval_minutes: autoInterval.value,
          auto_mode: autoMode.value,
          auto_schedule_times: autoMode.value === 'scheduled' ? [...autoScheduleTimes.value] : [],
          auto_batch_count: autoBatchCount.value,
          auto_collect_lead_minutes: autoCollectLeadMinutes.value,
          auto_interval_batch_count: autoIntervalBatchCount.value,
          auto_category_ids: [...autoCategoryIds.value],
          auto_filters: {
            time_range: autoFilters.value.time_range,
            source_types: autoFilters.value.source_type === 'all' ? [] : [autoFilters.value.source_type],
            per_channel: autoFilters.value.per_channel,
            similarity_threshold: autoFilters.value.similarity_threshold,
            sort_mode: autoFilters.value.sort_mode,
            include_videos: autoFilters.value.include_videos,
            require_media: autoFilters.value.require_media,
            min_length: autoFilters.value.min_length,
            languages: [...autoFilters.value.languages],
            keywords: (autoFilters.value.keywords || '')
              .split(',').map(s => s.trim()).filter(Boolean),
          },
          auto_active_from_hour: autoWindowEnabled.value ? autoActiveFromHour.value : null,
          auto_active_to_hour: autoWindowEnabled.value ? autoActiveToHour.value : null,
        })
        addedChannel.value = { ...res.channel, ...updated }
      } catch { /* sozlamalar muvaffaqiyatsiz bo'lsa ham kanal yaratildi */ }
    }

    // ro'yxatga ham qo'shamiz (yoki yangilaymiz)
    const finalCh = addedChannel.value
    if (!replaceChannel(finalCh)) channels.value.unshift(finalCh)

    if (res.channel.status === 'connected') {
      addStage.value = 'success'
    } else {
      addStage.value = 'pending'
      startAddPolling()
    }
  } catch (err) {
    const msg = err.response?.data?.message
    addError.value = Array.isArray(msg) ? msg.join('. ') : (msg || tt('cc.modal.err.generic'))
  } finally {
    addSubmitting.value = false
  }
}

function startAddPolling() {
  stopAddPolling()
  addPollTimer = setInterval(async () => {
    if (!addedChannel.value) { stopAddPolling(); return }
    try {
      const fresh = await channelsApi.getStatus(company.value.id, addedChannel.value.id)
      addedChannel.value = fresh
      replaceChannel(fresh)
      if (fresh.status === 'connected') {
        stopAddPolling()
        addStage.value = 'success'
      }
    } catch {}
  }, 2500)
}

function stopAddPolling() {
  if (addPollTimer) { clearInterval(addPollTimer); addPollTimer = null }
}

// ESC bilan yopish
function handleKey(e) {
  if (e.key !== 'Escape') return
  if (recentOpen.value) closeRecent()
  else if (addModalOpen.value) closeAddModal()
  else if (autoModalOpen.value) closeAutoModal()
  else if (reactivateModalOpen.value) closeReactivateModal()
}

onMounted(async () => {
  loadAll()
  document.addEventListener('keydown', handleKey)

  // Meta OAuth callback natijasini URL parametrlardan tekshirish
  const metaSession = route.query.meta_session
  const metaCompany = route.query.meta_company
  const metaError = route.query.meta_error

  if (metaError) {
    metaNotify.value = decodeURIComponent(String(metaError))
    router.replace({ query: {} })
  } else if (metaSession && metaCompany) {
    router.replace({ query: {} })
    await handleMetaSession(String(metaSession), String(metaCompany))
  }
})
onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleKey)
  stopAddPolling()
  stopReactivatePolling()
})
</script>

<style scoped>
/* ─── Kanal kartalari gridi (kanal soniga moslashadi) ─── */
.ccx-grid { display: grid; gap: 14px; align-items: stretch; }
.ccx-grid-1 { grid-template-columns: 1fr; }
.ccx-grid-2 { grid-template-columns: repeat(2, 1fr); }
.ccx-grid-3 { grid-template-columns: repeat(3, 1fr); }
@media (max-width: 1100px) { .ccx-grid-3 { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 720px) {
  .ccx-grid-2, .ccx-grid-3 { grid-template-columns: 1fr; }
}

/* ─── Kartali dizayn (zip prototipi) ─── */
.ccx-card { display: flex; flex-direction: column; height: 100%; }

/* Bitta kanal — butun ekran. Meta strip kengroq, sparkline balandroq */
.ccx-card-wide .ccx-meta { grid-template-columns: repeat(4, 1fr); }
.ccx-card-wide .ccx-stats { grid-template-columns: repeat(3, minmax(0, 220px)); }
.ccx-card-wide .ccx-head,
.ccx-card-wide .ccx-spark,
.ccx-card-wide .ccx-stats { padding-left: 20px; padding-right: 20px; }
.ccx-card-wide .ccx-meta { margin-left: 20px; margin-right: 20px; }
@media (max-width: 720px) {
  .ccx-card-wide .ccx-meta { grid-template-columns: 1fr 1fr; }
  .ccx-card-wide .ccx-stats { grid-template-columns: 1fr 1fr 1fr; }
}
.ccx-head { padding: 14px 16px 12px; display: flex; align-items: center; gap: 11px; }
.ccx-avatar {
  width: 42px; height: 42px; border-radius: 11px; color: #fff;
  display: inline-flex; align-items: center; justify-content: center;
  flex-shrink: 0; position: relative;
  box-shadow: 0 2px 6px -1px rgba(15,23,42,0.18);
}
.ccx-avatar-sm { width: 26px; height: 26px; border-radius: 7px; box-shadow: none; }
.ccx-live {
  position: absolute; right: -2px; bottom: -2px;
  width: 12px; height: 12px; border-radius: 999px;
  background: var(--success); border: 2px solid var(--panel);
}
.ccx-head-main { display: flex; flex-direction: column; flex: 1; min-width: 0; gap: 2px; }
.ccx-head-row { display: flex; gap: 7px; align-items: center; }
.ccx-name { font-size: 14px; font-weight: 600; letter-spacing: -0.01em; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ccx-head-sub { display: flex; align-items: center; gap: 6px; }
.ccx-handle { font-size: 11.5px; color: var(--muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ccx-dot { width: 3px; height: 3px; border-radius: 999px; background: var(--border); flex-shrink: 0; }
.ccx-mode {
  display: inline-flex; align-items: center; gap: 4px; flex-shrink: 0;
  font-size: 10px; font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase;
  color: var(--muted);
}
.ccx-mode.auto { color: var(--accent); }
.ccx-mode-btn {
  border: 1px solid var(--border-2); background: var(--panel-2);
  padding: 2px 7px; border-radius: 999px; cursor: pointer; font-family: inherit;
  transition: background .12s, border-color .12s;
}
.ccx-mode-btn:hover { background: var(--panel); border-color: color-mix(in oklab, var(--accent) 35%, var(--border-2)); }
.ccx-meta {
  margin: 0 16px; padding: 9px 12px;
  background: var(--panel-2); border: 1px solid var(--border-2); border-radius: 8px;
  display: grid; grid-template-columns: 1fr 1fr; gap: 7px 10px;
}
.ccx-meta-item { display: flex; align-items: center; gap: 7px; min-width: 0; color: var(--muted); }
.ccx-meta-lbl { font-size: 10.5px; color: var(--muted); flex-shrink: 0; }
.ccx-meta-val { font-size: 11.5px; font-weight: 500; color: var(--text); margin-left: auto; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ccx-stats { padding: 12px 16px 8px; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; }
.ccx-stat { display: flex; flex-direction: column; gap: 2px; }
.ccx-stat-lbl { font-size: 10.5px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.06em; font-weight: 500; }
.ccx-stat-val { font-size: 15px; font-weight: 600; color: var(--text); }
.ccx-src-breakdown { display: inline-flex; align-items: center; gap: 6px; }
.ccx-src-chip {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 2px 8px; border-radius: 7px; font-size: 12.5px; font-weight: 600;
  font-variant-numeric: tabular-nums;
}
.ccx-src-chip.tg { background: rgba(36,160,225,0.14); color: #1Fa1de; }
.ccx-src-chip.web { background: rgba(34,197,94,0.14); color: #16a34a; }
.ccx-spark { padding: 0 16px 12px; }
.ccx-spark-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
.ccx-spark-lbl { font-size: 10.5px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.06em; }
.ccx-trend { display: inline-flex; align-items: center; gap: 3px; font-size: 11px; font-weight: 500; }
.ccx-foot {
  display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
  padding: 12px 16px; margin-top: auto;
  background: var(--panel-2); border-top: 1px solid var(--border-2);
  border-radius: 0 0 var(--r-lg) var(--r-lg);
}
.ccx-foot-last { font-size: 11px; color: var(--muted); display: flex; align-items: center; gap: 5px; flex: 1; min-width: 0; }
.ccx-th {
  text-align: left; padding: 8px 10px; font-weight: 500; font-size: 11px;
  text-transform: uppercase; letter-spacing: 0.05em; color: var(--muted);
}

.cc-card-accent {
  height: 3px;
  border-radius: var(--r-lg) var(--r-lg) 0 0;
}
.cc-platform-icon {
  /* inline style'da set qilinadi */
}
.cc-platform-pill {
  display: inline-flex;
  align-items: center;
  height: 16px;
  padding: 0 6px;
  font-size: 9.5px;
  font-weight: 600;
  letter-spacing: 0.04em;
  border-radius: 4px;
  text-transform: uppercase;
}
.cc-stat-label {
  font-size: 10.5px;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-weight: 500;
}
.cc-stat-value {
  font-size: 13px;
  font-weight: 500;
  color: var(--text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.cc-mode-pill {
  display: inline-flex;
  align-items: center;
  height: 18px;
  padding: 0 7px;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.03em;
  border-radius: 4px;
  text-transform: uppercase;
  white-space: nowrap;
  flex-shrink: 0;
}
.cc-mode-pill.auto {
  background: color-mix(in oklab, var(--accent) 14%, transparent);
  color: var(--accent);
}
.cc-mode-pill.manual {
  background: color-mix(in oklab, var(--muted) 16%, transparent);
  color: var(--text-2);
}
.cc-mode-pill-btn {
  border: none; cursor: pointer; font-family: inherit; gap: 3px;
  transition: filter .12s;
}
.cc-mode-pill-btn:hover { filter: brightness(1.08); text-decoration: underline; }
.cc-spinner {
  width: 18px;
  height: 18px;
  border-radius: 999px;
  border: 2px solid var(--border);
  border-top-color: var(--accent);
  animation: cc-spin 0.8s linear infinite;
}
@keyframes cc-spin { to { transform: rotate(360deg); } }

/* Empty state platform ikonlari */
.cc-empty-icons {
  display: flex;
  gap: 10px;
}
.cc-empty-icons > span.dim { opacity: 0.4; }

/* ──────────────────── Add Channel Modal ──────────────────── */
.cc-modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 100;
  background: rgba(15, 23, 42, 0.55);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}
.cc-modal {
  position: relative;
  width: 100%;
  max-width: 520px;
  max-height: calc(100vh - 48px);
  overflow-y: auto;
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: 18px;
  box-shadow: 0 40px 100px -20px rgba(15,23,42,0.45),
              0 0 0 1px rgba(255,255,255,0.5) inset;
}
.cc-modal-close {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 2;
  width: 30px; height: 30px;
  border-radius: 999px;
  background: rgba(255,255,255,0.16);
  border: 1px solid rgba(255,255,255,0.24);
  color: white;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.15s;
  backdrop-filter: blur(6px);
}
.cc-modal-close:hover { background: rgba(255,255,255,0.28); }

/* Hero */
.cc-modal-hero {
  position: relative;
  padding: 28px 28px 22px;
  color: white;
  overflow: hidden;
  border-radius: 18px 18px 0 0;
}
.cc-modal-hero-dots {
  position: absolute; inset: 0;
  background-image: radial-gradient(rgba(255,255,255,0.14) 1px, transparent 1px);
  background-size: 20px 20px;
  mask-image: radial-gradient(ellipse 80% 70% at 50% 50%, black 30%, transparent 80%);
  -webkit-mask-image: radial-gradient(ellipse 80% 70% at 50% 50%, black 30%, transparent 80%);
}
.cc-modal-hero-inner {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 14px;
}
.cc-modal-hero-icon {
  width: 44px; height: 44px;
  border-radius: 12px;
  background: rgba(255,255,255,0.18);
  border: 1px solid rgba(255,255,255,0.3);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  backdrop-filter: blur(8px);
}
.cc-modal-hero-title {
  font-size: 17px;
  font-weight: 600;
  letter-spacing: -0.015em;
  line-height: 1.2;
}
.cc-modal-hero-sub {
  font-size: 12.5px;
  color: rgba(255,255,255,0.8);
  margin-top: 4px;
  line-height: 1.45;
  max-width: 380px;
}

/* Platform pickerlar (chip qator) */
.cc-modal-platforms {
  display: flex;
  gap: 6px;
  padding: 12px 20px 0;
  border-bottom: 1px solid var(--border-2);
  margin-bottom: -1px;
  overflow-x: auto;
}
.cc-pf-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 32px;
  padding: 0 12px 0 6px;
  background: transparent;
  border: 1px solid transparent;
  border-bottom: none;
  border-radius: 8px 8px 0 0;
  cursor: pointer;
  font-size: 12.5px;
  color: var(--muted);
  position: relative;
  bottom: -1px;
  white-space: nowrap;
}
.cc-pf-btn:hover:not(:disabled) { color: var(--text); }
.cc-pf-btn.active {
  background: var(--panel);
  border-color: var(--border-2);
  color: var(--text);
  font-weight: 600;
}
.cc-pf-btn.disabled { opacity: 0.55; cursor: not-allowed; }
.cc-pf-btn-icon { width: 22px; height: 22px; border-radius: 5px; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; }
.cc-pf-btn-soon {
  font-size: 9.5px;
  padding: 2px 5px;
  border-radius: 4px;
  background: var(--panel-2);
  color: var(--muted);
  margin-left: 2px;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

/* Body */
.cc-modal-body {
  padding: 22px 24px 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.cc-field { display: flex; flex-direction: column; gap: 6px; }
.cc-field-label {
  font-size: 11.5px;
  color: var(--text-2);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.cc-field-hint {
  font-size: 11px;
  color: var(--muted);
  margin-top: 2px;
}

.cc-url-input {
  display: flex;
  align-items: center;
  gap: 10px;
  height: 42px;
  padding: 0 14px;
  background: var(--panel);
  border: 1.5px solid var(--border);
  border-radius: 10px;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.cc-url-input:focus-within {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px color-mix(in oklab, var(--accent) 18%, transparent);
}
.cc-url-input.error { border-color: var(--danger); }
.cc-url-input-field {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font-size: 13.5px;
  color: var(--text);
  font-family: var(--font-mono);
}
.cc-url-input-field::placeholder { color: var(--muted); }

/* Mode kartalari */
.cc-mode-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
.cc-mode-card {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 14px;
  text-align: left;
  background: var(--panel);
  border: 1.5px solid var(--border);
  border-radius: 10px;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
}
.cc-mode-card:hover { border-color: var(--accent); }
.cc-mode-card.active {
  border-color: var(--accent);
  background: color-mix(in oklab, var(--accent) 7%, var(--panel));
}
.cc-mode-card-icon {
  width: 26px; height: 26px;
  border-radius: 7px;
  background: var(--accent-bg);
  color: var(--accent);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.cc-mode-card-title { font-size: 13px; font-weight: 600; color: var(--text); margin-bottom: 2px; }
.cc-mode-card-sub { font-size: 11px; color: var(--muted); line-height: 1.4; }
.cc-mode-card-check {
  width: 18px; height: 18px;
  border-radius: 999px;
  background: var(--accent);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

/* ── Yetkazish usuli kartalari ─────────────── */
.cc-delivery-grid { display: flex; flex-direction: column; gap: 8px; }
.cc-delivery-card {
  display: flex;
  align-items: flex-start;
  gap: 11px;
  padding: 12px 14px;
  text-align: left;
  background: var(--panel);
  border: 1.5px solid var(--border);
  border-radius: 10px;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
  width: 100%;
}
.cc-delivery-card:hover { border-color: var(--accent); }
.cc-delivery-card.active {
  border-color: var(--accent);
  background: color-mix(in oklab, var(--accent) 7%, var(--panel));
}
.cc-delivery-icon {
  width: 28px; height: 28px;
  border-radius: 8px;
  background: color-mix(in oklab, var(--success) 15%, transparent);
  color: var(--success);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.cc-delivery-icon.direct {
  background: color-mix(in oklab, #f59e0b 15%, transparent);
  color: #d97706;
}
.cc-delivery-title { font-size: 13px; font-weight: 600; color: var(--text); margin-bottom: 2px; }
.cc-delivery-sub { font-size: 11px; color: var(--muted); line-height: 1.4; }

/* ── Avto-post panel ───────────────────────── */
.cc-auto {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 14px;
  background: color-mix(in oklab, var(--accent) 5%, var(--panel-2));
  border: 1px solid color-mix(in oklab, var(--accent) 22%, var(--border));
  border-radius: 12px;
  animation: ccAutoIn .25s ease;
}
@keyframes ccAutoIn {
  from { opacity: 0; transform: translateY(-4px); }
  to   { opacity: 1; transform: translateY(0); }
}
.cc-auto-head {
  display: flex; align-items: flex-start; gap: 10px;
  padding-bottom: 10px;
  border-bottom: 1px dashed color-mix(in oklab, var(--accent) 28%, transparent);
}
.cc-auto-head-icon {
  width: 26px; height: 26px;
  border-radius: 7px;
  background: var(--accent);
  color: white;
  display: inline-flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.cc-auto-head-title {
  font-size: 13px; font-weight: 600; color: var(--text);
}
.cc-auto-head-sub {
  font-size: 11.5px; color: var(--muted); margin-top: 2px; line-height: 1.4;
}
.cc-auto-row {
  display: flex; gap: 12px; flex-wrap: wrap;
}
.cc-chip-row {
  display: flex; flex-wrap: wrap; gap: 6px;
}
.cc-chip {
  display: inline-flex; align-items: center; gap: 6px;
  height: 28px; padding: 0 11px;
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: 999px;
  font-size: 12px;
  color: var(--text-2);
  cursor: pointer;
  transition: border-color .15s, background .15s, color .15s;
  white-space: nowrap;
}
.cc-chip:hover { border-color: var(--accent); }
.cc-chip.active {
  background: var(--accent);
  border-color: var(--accent);
  color: white;
}
.cc-chip-dot {
  width: 8px; height: 8px; border-radius: 999px; display: inline-block;
}
.cc-inline-num {
  width: 64px;
  height: 24px;
  margin: 0 4px;
  padding: 0 6px;
  border: 1px solid var(--border);
  background: var(--panel);
  border-radius: 5px;
  font-size: 12px;
  font-family: var(--font-mono);
  text-align: center;
  outline: none;
}
.cc-inline-num:focus { border-color: var(--accent); }

/* Faol vaqt oynasi */
.cc-window-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 12.5px;
  color: var(--text);
  margin-bottom: 8px;
}
.cc-window-toggle input { cursor: pointer; }
.cc-window-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 6px;
}
.cc-window-select {
  height: 34px;
  padding: 0 10px;
  border: 1px solid var(--border);
  background: var(--panel);
  border-radius: 7px;
  font-size: 13px;
  font-family: var(--font-mono);
  color: var(--text);
  cursor: pointer;
  outline: none;
}
.cc-window-select:focus { border-color: var(--accent); }
.cc-window-sep { font-size: 12.5px; color: var(--muted); }

.cc-num-input {
  display: inline-flex; align-items: center;
  height: 34px;
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 0 4px;
}
.cc-num-input button {
  width: 26px; height: 26px;
  background: transparent;
  border: none;
  border-radius: 5px;
  color: var(--muted);
  font-size: 14px;
  cursor: pointer;
}
.cc-num-input button:hover { color: var(--text); background: var(--panel-2); }
.cc-num-input input {
  flex: 1; min-width: 0;
  height: 26px;
  border: none; outline: none; background: transparent;
  text-align: center;
  font-size: 13px;
  font-family: var(--font-mono);
  font-weight: 500;
}

.cc-text-input {
  width: 100%;
  height: 34px;
  padding: 0 10px;
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: 8px;
  font-size: 12.5px;
  color: var(--text);
  outline: none;
  font-family: var(--font-mono);
}
.cc-text-input:focus { border-color: var(--accent); }

.cc-toggle-row {
  display: inline-flex; align-items: center; gap: 8px;
  font-size: 12.5px;
  color: var(--text-2);
  cursor: pointer;
  padding: 6px 0;
}
.cc-toggle-row input { accent-color: var(--accent); width: 14px; height: 14px; }

/* Tavsiya etilgan promptdan foydalanish — autopost modal'i */
.cc-recommend {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 11px 13px;
  border-radius: 8px;
  border: 1px solid var(--border-2);
  background: var(--bg);
  cursor: pointer;
  transition: border-color .15s, background .15s;
}
.cc-recommend:hover { border-color: var(--accent); }
.cc-recommend.on {
  border-color: color-mix(in oklab, var(--accent) 45%, transparent);
  background: color-mix(in oklab, var(--accent) 6%, transparent);
}
.cc-recommend input[type="checkbox"] {
  margin: 2px 0 0;
  width: 16px;
  height: 16px;
  accent-color: var(--accent);
  cursor: pointer;
  flex-shrink: 0;
}


.cc-modal-error {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 12px;
  background: var(--danger-bg);
  border: 1px solid color-mix(in oklab, var(--danger) 25%, transparent);
  border-radius: 8px;
  font-size: 12px;
  color: var(--danger);
}

.cc-modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding-top: 4px;
}

.cc-modal-link {
  background: none;
  border: none;
  color: var(--accent);
  font-size: 12.5px;
  font-weight: 500;
  cursor: pointer;
  padding: 4px 8px;
  margin: 0 auto;
}
.cc-modal-link:hover { text-decoration: underline; }

/* Pending sahnasi */
.cc-pending {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 8px 0 4px;
}
.cc-pending-pulse {
  position: relative;
  width: 80px;
  height: 80px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.cc-pending-pulse-icon {
  position: relative;
  z-index: 2;
}
.cc-pending-pulse-ring {
  position: absolute;
  inset: 0;
  border-radius: 999px;
  border: 2px solid #2AABEE;
  opacity: 0.4;
  animation: ccPulse 1.8s ease-out infinite;
}
.cc-pending-pulse-ring.r1 { animation-delay: 0s; }
.cc-pending-pulse-ring.r2 { animation-delay: 0.6s; }
@keyframes ccPulse {
  0%   { transform: scale(0.6); opacity: 0.7; }
  100% { transform: scale(1.4); opacity: 0; }
}
.cc-pending-title { font-size: 16px; font-weight: 600; margin-bottom: 4px; }
.cc-pending-sub { font-size: 12.5px; color: var(--muted); line-height: 1.5; max-width: 380px; }

.cc-pending-cta {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 42px;
  padding: 0 18px;
  background: linear-gradient(135deg, #4FC0E8, #2AABEE);
  color: white;
  border-radius: 10px;
  text-decoration: none;
  font-weight: 600;
  font-size: 13px;
  box-shadow: 0 8px 24px -8px rgba(42,171,238,0.4);
  transition: transform 0.15s, box-shadow 0.15s;
}
.cc-pending-cta:hover {
  transform: translateY(-1px);
  box-shadow: 0 12px 28px -8px rgba(42,171,238,0.5);
}

.cc-pending-steps {
  width: 100%;
  background: var(--panel-2);
  border: 1px solid var(--border-2);
  border-radius: 10px;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.cc-step {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
  color: var(--text-2);
}
.cc-step-num {
  width: 20px; height: 20px;
  border-radius: 999px;
  background: var(--accent-bg);
  color: var(--accent);
  font-size: 11px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.cc-pending-status {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--muted);
  padding: 8px 14px;
  background: var(--panel-2);
  border-radius: 999px;
}

/* Reactivate live indicator */
.cc-reactivate-live {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px 12px;
  background: color-mix(in oklab, #10b981 8%, var(--panel-2));
  border: 1px solid color-mix(in oklab, #10b981 28%, var(--border-2));
  border-radius: 10px;
  font-size: 12px;
  color: var(--text-2);
}
.cc-live-dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: #10b981;
  box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.55);
  animation: ccLiveDot 1.6s ease-out infinite;
  flex-shrink: 0;
}
@keyframes ccLiveDot {
  0%   { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.55); }
  70%  { box-shadow: 0 0 0 8px rgba(16, 185, 129, 0); }
  100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
}
.cc-live-check {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 26px;
  padding: 0 10px;
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: 6px;
  font-size: 11.5px;
  font-weight: 500;
  color: var(--text-2);
  cursor: pointer;
  transition: border-color .15s, background .15s, color .15s;
  flex-shrink: 0;
}
.cc-live-check:hover:not(:disabled) {
  border-color: var(--accent);
  color: var(--accent);
}
.cc-live-check:disabled { opacity: 0.55; cursor: not-allowed; }

/* Success */
.cc-success {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 8px 0;
}
.cc-success-icon {
  width: 64px; height: 64px;
  border-radius: 999px;
  background: var(--success-bg);
  color: var(--success);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  animation: ccPop 0.6s cubic-bezier(.34,1.56,.64,1) both;
}
@keyframes ccPop {
  0%   { transform: scale(0.4); opacity: 0; }
  60%  { transform: scale(1.1); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}
.cc-success-title { font-size: 17px; font-weight: 600; }
.cc-success-sub { font-size: 12.5px; color: var(--muted); line-height: 1.5; }

/* Modal transition */
.cc-modal-enter-active { transition: opacity 0.25s ease, backdrop-filter 0.25s ease; }
.cc-modal-leave-active { transition: opacity 0.2s ease, backdrop-filter 0.2s ease; }
.cc-modal-enter-from, .cc-modal-leave-to { opacity: 0; }
.cc-modal-enter-active .cc-modal { animation: ccModalIn 0.32s cubic-bezier(.22,.68,0,1.2); }
@keyframes ccModalIn {
  from { opacity: 0; transform: translateY(20px) scale(0.96); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}

/* ── So'nggi postlar modal ── */
.cc-recent { max-width: 560px; }
.cc-recent-head {
  display: flex; align-items: center; gap: 12px;
  padding: 18px 48px 16px 20px;
  border-bottom: 1px solid var(--border);
}
.cc-recent-head-icon {
  width: 34px; height: 34px; border-radius: 10px; flex-shrink: 0;
  display: inline-flex; align-items: center; justify-content: center;
  background: var(--accent-soft, rgba(99,102,241,0.12)); color: var(--accent);
}
.cc-recent-title { font-size: 14px; font-weight: 700; color: var(--text); letter-spacing: -0.01em; }
.cc-recent-sub { font-size: 12px; color: var(--muted); margin-top: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.cc-recent-body { padding: 12px 16px 18px; }
.cc-recent-state {
  display: flex; align-items: center; justify-content: center; gap: 8px;
  padding: 36px 0; color: var(--muted); font-size: 13px;
}
.cc-recent-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 6px; }
.cc-recent-item {
  display: flex; align-items: center; gap: 12px;
  padding: 10px 12px; border-radius: 10px;
  background: var(--panel-2, rgba(148,163,184,0.06));
  border: 1px solid var(--border-2, transparent);
}
.cc-recent-item-main { flex: 1; min-width: 0; }
.cc-recent-item-title {
  display: block; font-size: 13px; font-weight: 500; color: var(--text);
  text-decoration: none; line-height: 1.35;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
a.cc-recent-item-title:hover { color: var(--accent); text-decoration: underline; }
.cc-recent-item-meta {
  display: flex; align-items: center; gap: 4px; margin-top: 4px;
  font-size: 11px; color: var(--muted);
}
.cc-recent-item-meta :deep(svg) { vertical-align: middle; opacity: 0.7; }
.cc-recent-views {
  display: inline-flex; align-items: center; gap: 5px; flex-shrink: 0;
  padding: 5px 10px; border-radius: 999px;
  background: var(--success-soft, rgba(34,197,94,0.12));
  color: var(--success); font-size: 12px; font-weight: 600;
}

/* ── Redesigned auto settings modal ──────────────────────── */
.cc-settings-wrap {
  display: flex;
  flex-direction: column;
  gap: 0;
  padding: 4px 0 8px;
}

/* Sections */
.cc-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px 18px;
  border-bottom: 1px solid var(--border);
}
.cc-section:last-of-type { border-bottom: none; }

.cc-section-head {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}
.cc-section-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 8px;
  flex-shrink: 0;
}
.cc-section-icon.sm {
  width: 22px;
  height: 22px;
  border-radius: 6px;
}
.cc-section-title {
  font-size: 13px;
  font-weight: 700;
  color: var(--text);
  margin-bottom: 1px;
}
.cc-section-sub {
  font-size: 11.5px;
  color: var(--muted);
  line-height: 1.4;
}

/* Info / warn boxes */
.cc-info-box {
  padding: 9px 12px;
  border-radius: 8px;
  font-size: 11.5px;
  line-height: 1.55;
}
.cc-info-box.info {
  background: color-mix(in oklab, var(--accent) 7%, transparent);
  border: 1px solid color-mix(in oklab, var(--accent) 22%, transparent);
  color: var(--text-2, var(--text));
}
.cc-info-box.warn {
  background: rgba(234,179,8,.08);
  border: 1px solid rgba(234,179,8,.3);
  color: #854d0e;
}

/* Mode cards (interval vs scheduled) */
.cc-mode-grid {
  display: flex;
  flex-direction: column;
  gap: 7px;
}
.cc-mode-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 9px;
  border: 1.5px solid var(--border-2);
  background: var(--bg);
  cursor: pointer;
  text-align: left;
  transition: border-color .15s, background .15s;
  width: 100%;
}
.cc-mode-card:hover { border-color: var(--accent); }
.cc-mode-card.active {
  border-color: var(--accent);
  background: color-mix(in oklab, var(--accent) 6%, var(--panel));
}
.cc-mode-card-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 7px;
  background: color-mix(in oklab, var(--accent) 12%, transparent);
  color: var(--accent);
  flex-shrink: 0;
}
.cc-mode-card-title {
  font-size: 12.5px;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 1px;
}
.cc-mode-card-sub {
  font-size: 11px;
  color: var(--muted);
  line-height: 1.35;
}

/* Advanced collapsible sections */
.cc-advanced-toggle {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 11px 18px;
  background: color-mix(in oklab, var(--accent) 3%, var(--bg));
  border: none;
  border-top: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
  cursor: pointer;
  text-align: left;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--text);
  transition: background .15s;
}
.cc-advanced-toggle:hover { background: color-mix(in oklab, var(--accent) 7%, var(--bg)); }
.cc-advanced-toggle-icon {
  font-size: 18px;
  color: var(--muted);
  line-height: 1;
  display: inline-block;
  transition: transform .18s;
  width: 14px;
  text-align: center;
}
.cc-advanced-badge {
  margin-left: auto;
  font-size: 10.5px;
  font-weight: 500;
  color: var(--muted);
  background: var(--panel-2, rgba(99,102,241,.06));
  padding: 2px 8px;
  border-radius: 999px;
  white-space: nowrap;
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cc-advanced-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 14px 18px;
  border-bottom: 1px solid var(--border);
  background: color-mix(in oklab, var(--accent) 2%, var(--bg));
}

/* Select */
.cc-select {
  width: 100%;
  padding: 9px 12px;
  border: 1px solid var(--border-2);
  border-radius: 7px;
  background: var(--bg);
  color: var(--text);
  font-size: 13px;
}
.cc-select.mono {
  font-family: 'JetBrains Mono', Menlo, Consolas, monospace;
}

/* Provider label */
.cc-provider-label {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 11px;
  cursor: pointer;
  border: 1.5px solid var(--border-2);
  border-radius: 7px;
  transition: border-color .15s, background .15s;
}
.cc-provider-label:hover { border-color: var(--accent); }
</style>
