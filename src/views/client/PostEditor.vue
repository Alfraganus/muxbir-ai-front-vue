<template>
  <div class="pe-root">
    <!-- ─── AI rewrite notification banner (sahifa tepasida) ─── -->
    <Teleport to="body">
      <Transition name="pe-aib-slide">
        <div v-if="aiBanner.show" class="pe-aib" :class="aiBanner.tone">
          <span class="pe-aib-icon">
            <AppIcon :name="aiBanner.tone === 'success' ? 'Check' : 'Close'" :size="14"/>
          </span>
          <span class="pe-aib-text">{{ aiBanner.message }}</span>
          <button v-if="aiBanner.tone === 'success' && aiBanner.prev" type="button" class="pe-aib-undo" @click="undoAiRewrite">
            <AppIcon name="Edit" :size="11"/>
            Qaytarish
          </button>
          <button type="button" class="pe-aib-close" @click="dismissAiBanner" aria-label="Yopish">
            <AppIcon name="Close" :size="12"/>
          </button>
        </div>
      </Transition>
    </Teleport>

    <!-- ─────────── Hero header ─────────── -->
    <header class="pe-hero">
      <div aria-hidden class="pe-hero-dots"/>
      <div aria-hidden class="pe-hero-glow"/>

      <div class="pe-hero-inner">
        <button class="pe-back" @click="$router.push('/client/posts')">
          <AppIcon name="ChevronL" :size="13"/>
          {{ tt('pe.back') }}
        </button>
        <div class="pe-hero-text">
          <span class="pe-hero-eyebrow">
            {{ isEdit ? tt('posts.title').toUpperCase() : tt('posts.new').toUpperCase() }}
          </span>
          <h1 class="pe-hero-title">
            {{ isEdit ? (firstNonEmptyTitle() || tt('pe.titleEdit')) : tt('pe.titleNew') }}
          </h1>
          <div v-if="post" class="pe-hero-meta">
            <span class="cp-card-status" :class="post.status">
              <span class="cp-card-status-dot"/>
              {{ tt('posts.status.' + post.status) }}
            </span>
            <span class="pe-hero-divider"/>
            <span class="pe-hero-saved">{{ savedLabel }}</span>
          </div>
        </div>
      </div>
    </header>

    <!-- ─────────── Loading initial ─────────── -->
    <div v-if="initLoading" class="pe-loading">
      <span class="pe-spinner"/>
      <span>{{ tt('cc.loading') }}</span>
    </div>

    <template v-else>
      <!-- ─────────── Main two-column body ─────────── -->
      <div class="pe-body">
        <!-- ╔══════ LEFT (writer) ══════╗ -->
        <main class="pe-writer">
          <!-- Magazine-style cover hero with language switcher overlay -->
          <div class="pe-hero-cover" :class="{ filled: !!form.cover_image_url, empty: !form.cover_image_url }">
            <input ref="coverFileInput" type="file" accept="image/*" @change="onCoverFile" hidden/>

            <!-- Filled state: blurred backdrop + foreground contain -->
            <template v-if="form.cover_image_url">
              <div aria-hidden class="pe-hc-bg" :style="{ backgroundImage: `url(${form.cover_image_url})` }"/>
              <img class="pe-hc-img" :src="form.cover_image_url" alt="Cover"/>
            </template>

            <!-- Decorative orbs (empty state only) -->
            <template v-if="!form.cover_image_url">
              <div aria-hidden class="pe-hc-orb pe-hc-orb-1"/>
              <div aria-hidden class="pe-hc-orb pe-hc-orb-2"/>
              <div aria-hidden class="pe-hc-grid"/>
            </template>

            <!-- Tint for filled state -->
            <div v-if="form.cover_image_url" class="pe-hc-tint"/>

            <!-- Top toolbar (right): upload / library / url / clear -->
            <div class="pe-hc-toolbar">
              <button class="pe-hc-btn" @click="coverGalleryOpen = true" title="Media kutubxonadan tanlash">
                <AppIcon name="Layers" :size="12"/>
                <span>Kutubxona</span>
              </button>
              <button class="pe-hc-btn" @click="coverFileInput?.click()" :disabled="coverUploading" title="Rasm yuklash">
                <AppIcon :name="coverUploading ? 'Sparkle' : 'Plus'" :size="12"/>
                <span>{{ coverUploading ? 'Yuklanmoqda…' : 'Yuklash' }}</span>
              </button>
              <input v-model="form.cover_image_url"
                placeholder="yoki https://..."
                class="pe-hc-url"
                title="Rasm URL'ini kiriting"/>
              <button v-if="form.cover_image_url" class="pe-hc-btn pe-hc-btn-icon" @click="clearCover" title="O'chirish">
                <AppIcon name="Close" :size="11"/>
              </button>
            </div>

            <!-- Empty state prompt (center) -->
            <div v-if="!form.cover_image_url" class="pe-hc-empty">
              <span class="pe-hc-empty-badge">
                <AppIcon name="Layers" :size="20"/>
              </span>
              <span class="pe-hc-empty-title">Postingizga muqova tanlang</span>
              <span class="pe-hc-empty-sub">Chiroyli cover rasm postingizni jonlantiradi</span>
            </div>

            <!-- Floating language switcher (bottom) -->
            <div class="pe-hc-langs">
              <div class="pe-hc-langs-inner">
                <button v-for="l in LANGS" :key="l"
                  class="pe-hcl"
                  :class="[{ active: activeLang === l }, langState(l)]"
                  @click="activeLang = l"
                  :title="tt('pe.lang.' + l)">
                  <span class="pe-hcl-code">{{ langCode(l) }}</span>
                  <span class="pe-hcl-dot"/>
                </button>
              </div>
            </div>
          </div>

          <!-- ─── AI amallar + til holati (sarlavha tepasida) ─── -->
          <div class="pe-toolbar pe-toolbar-ai">
            <div class="pe-toolbar-left">
              <button class="pe-chip pe-chip-ai" :disabled="aiShortening" @click="openAiRewrite('rewrite')" title="AI bilan qayta yozish — prompt va model tanlash">
                <span class="pe-chip-ic pe-chip-ic-ai">
                  <AppIcon name="Sparkle" :size="11"/>
                </span>
                <span class="pe-chip-text">{{ aiShortening && aiMode === 'rewrite' ? 'Yozilmoqda…' : 'AI bilan qayta yozish' }}</span>
                <span class="pe-chip-cost">{{ AI_CREDIT_COST.rewrite }} kr</span>
              </button>
              <button class="pe-chip pe-chip-ai" :disabled="aiShortening" @click="openAiRewrite('shorten')" title="AI bilan qisqartirish — prompt va model tanlash">
                <span class="pe-chip-ic pe-chip-ic-ai">
                  <AppIcon name="Edit" :size="11"/>
                </span>
                <span class="pe-chip-text">{{ aiShortening && aiMode === 'shorten' ? 'Qisqartirilmoqda…' : 'AI bilan qisqartirish' }}</span>
                <span class="pe-chip-cost">{{ AI_CREDIT_COST.shorten }} kr</span>
              </button>
              <button class="pe-chip pe-chip-ai" :disabled="aiTagging" @click="aiGenerateTags" title="Avtomatik teglar">
                <span class="pe-chip-ic pe-chip-ic-ai">
                  <AppIcon :name="aiTagging ? 'Sparkle' : 'Tag'" :size="11"/>
                </span>
                <span class="pe-chip-text">{{ aiTagging ? 'Tahlil qilinmoqda…' : 'AI teglar' }}</span>
                <span class="pe-chip-cost">{{ AI_CREDIT_COST.tags }} kr</span>
              </button>
              <!-- Joriy til avtomatik holati — faqat o'qish uchun (qo'lda toggle yo'q) -->
              <span class="pe-chip pe-chip-auto" :class="{ 'pe-chip-on': isActiveComplete }"
                    :title="isActiveComplete ? `Bu til to'liq to'ldirilgan — avtomatik tayyor` : `Sarlavha va matn to'ldirilsa, til avtomatik tayyor bo'ladi`">
                <AppIcon :name="isActiveComplete ? 'Check' : 'Edit'" :size="11"/>
                <span class="pe-chip-text">{{ isActiveComplete ? 'Tayyor' : 'Qoralama' }}</span>
              </span>
              <button v-if="hasAnyContent(activeLang)" class="pe-chip pe-chip-danger" @click="removeLang" :title="tt('pe.lang.removeTranslation')">
                <span class="pe-chip-ic pe-chip-ic-danger">
                  <AppIcon name="Trash" :size="11"/>
                </span>
                <span class="pe-chip-text">Ushbu postni {{ tt('pe.lang.' + activeLang) }} qismini o'chirish</span>
              </button>
            </div>
          </div>

          <!-- Composition "paper" — title + short desc + editor as one unified surface -->
          <div class="pe-paper">
            <label class="pe-label pe-paper-label">Sarlavha</label>
            <input v-model="activeTr.title"
              :placeholder="tt('pe.field.langTitlePh')"
              class="pe-paper-title"/>

            <!-- Qisqa tavsif — hozircha yashirilgan -->
            <div v-if="false" class="pe-paper-short-wrap">
              <textarea v-model="activeTr.short_description"
                :placeholder="tt('pe.field.langShortDescPh')"
                rows="2" maxlength="500"
                class="pe-paper-short"/>
              <span class="pe-paper-short-counter">{{ (activeTr.short_description || '').length }}/500</span>
            </div>

            <label class="pe-label pe-paper-label pe-paper-label-content">Asosiy matn</label>

            <div class="pe-paper-editor">
              <RichEditor :key="`${activeLang}-${editorReloadKey}`" v-model="activeTr.content_json" :placeholder="tt('pe.field.langContentPh')"/>
            </div>
          </div>

          <!-- AI hint / error -->
          <div v-if="aiError" class="pe-ribbon-hint pe-ribbon-hint-err">
            <AppIcon name="Close" :size="11"/>
            {{ aiError }}
          </div>

          <!-- ─── Amallar paneli (kontent ostida): o'chirish / saqlash / e'lon ─── -->
          <div class="pe-toolbar pe-toolbar-bottom">
            <div class="pe-toolbar-spacer"/>

            <!-- RIGHT: o'chirish / saqlash / e'lon qilish (e'lon eng o'ngda) -->
            <div class="pe-toolbar-right">
              <span v-if="savedLabel" class="pe-ab-saved-pill pe-tb-saved">
                <AppIcon name="Check" :size="10"/>
                {{ savedLabel }}
              </span>
              <button v-if="isEdit" class="pe-tb-btn pe-tb-btn-del" :disabled="deleting" @click="onDelete" type="button" :title="tt('pe.delete')">
                <span v-if="deleting" class="pe-ab-spinner"/>
                <AppIcon v-else name="Trash" :size="14"/>
                <span>{{ tt('pe.delete') }}</span>
              </button>
              <button class="pe-tb-btn pe-tb-btn-save" :disabled="saving" @click="saveAll" type="button">
                <span v-if="saving" class="pe-ab-spinner"/>
                <AppIcon v-else name="Check" :size="15"/>
                <span>{{ isEdit ? tt('pe.savePostEdit') : tt('pe.savePost') }}</span>
              </button>
              <button v-if="isEdit && form.platform === 'telegram'"
                      class="pe-tb-btn pe-tb-btn-publish"
                      :disabled="publishing || activating"
                      @click="onPublishClick" type="button">
                <span v-if="publishing || activating" class="pe-ab-spinner light"/>
                <AppIcon v-else name="Send" :size="15"/>
                <span>{{ tt('pe.publish') }}</span>
              </button>
            </div>
          </div>

        </main>

        <!-- ╔══════ RIGHT (sticky sidebar) ══════╗ -->
        <aside class="pe-sidebar">
          <!-- ─── Telegram kanal tanlash (ko'p kanal, checkbox) ─── -->
          <section v-if="form.platform === 'telegram'"
                   :style="{
                     padding: '14px',
                     borderRadius: '10px',
                     border: '1px solid ' + (!form.telegram_channel_ids.length ? 'rgba(245,158,11,.4)' : 'var(--border-2)'),
                     background: !form.telegram_channel_ids.length ? 'rgba(245,158,11,.05)' : 'var(--panel)',
                     display: 'flex', flexDirection: 'column', gap: '8px',
                   }">
            <div style="display:flex;align-items:center;gap:8px;">
              <AppIcon name="Telegram" :size="13" :style="{ color: '#229ED9' }"/>
              <span style="font-size:11.5px;font-weight:600;color:var(--text);
                           text-transform:uppercase;letter-spacing:0.05em;">
                Telegram kanallar
              </span>
              <span v-if="form.telegram_channel_ids.length"
                    style="font-size:10px;color:#229ED9;font-weight:600;margin-left:auto;
                           padding:2px 7px;background:rgba(34,158,217,.12);border-radius:999px;">
                {{ form.telegram_channel_ids.length }} tanlandi
              </span>
              <span v-else
                    style="font-size:10px;color:#f59e0b;font-weight:600;margin-left:auto;
                           padding:2px 7px;background:rgba(245,158,11,.12);border-radius:999px;">
                Tanlanmagan
              </span>
            </div>

            <div v-if="!connectedTgChannels.length"
                 style="font-size:12px;color:var(--text-2);padding:6px 0;">
              Ulangan Telegram kanal yo'q. Avval «Kanallar» bo'limidan kanal qo'shing.
            </div>

            <label v-for="ch in connectedTgChannels" :key="ch.id"
                   :style="{
                     display: 'flex', alignItems: 'center', gap: '9px',
                     padding: '8px 10px', borderRadius: '7px', cursor: 'pointer',
                     border: '1px solid ' + (form.telegram_channel_ids.includes(ch.id) ? 'rgba(34,158,217,.5)' : 'var(--border-2)'),
                     background: form.telegram_channel_ids.includes(ch.id) ? 'rgba(34,158,217,.06)' : 'var(--bg)',
                   }">
              <input type="checkbox"
                     :value="ch.id"
                     v-model="form.telegram_channel_ids"
                     style="width:15px;height:15px;accent-color:#229ED9;cursor:pointer;flex:none;"/>
              <span style="font-size:13px;color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
                {{ ch.display_name || ch.username }}
              </span>
            </label>

            <span v-if="!form.telegram_channel_ids.length && connectedTgChannels.length"
                  style="font-size:11px;color:#92400e;line-height:1.4;">
              ⚠ Postni e'lon qilish uchun kamida bitta kanal tanlang
            </span>
          </section>

          <!-- ─── Meta (Facebook / Instagram) kanal tanlash ─── -->
          <section v-if="connectedMetaChannels.length"
                   :style="{
                     padding: '14px',
                     borderRadius: '10px',
                     border: '1px solid var(--border-2)',
                     background: 'var(--panel)',
                     display: 'flex', flexDirection: 'column', gap: '8px',
                   }">
            <div style="display:flex;align-items:center;gap:8px;">
              <span style="font-size:11.5px;font-weight:600;color:var(--text);text-transform:uppercase;letter-spacing:0.05em;">
                Facebook / Instagram
              </span>
              <span v-if="selectedMetaChannelIds.length"
                    style="font-size:10px;color:#1877F2;font-weight:600;margin-left:auto;
                           padding:2px 7px;background:rgba(24,119,242,.12);border-radius:999px;">
                {{ selectedMetaChannelIds.length }} tanlandi
              </span>
            </div>
            <label v-for="ch in connectedMetaChannels" :key="ch.id"
                   :style="{
                     display: 'flex', alignItems: 'center', gap: '9px',
                     padding: '8px 10px', borderRadius: '7px', cursor: 'pointer',
                     border: '1px solid ' + (selectedMetaChannelIds.includes(ch.id) ? 'rgba(24,119,242,.5)' : 'var(--border-2)'),
                     background: selectedMetaChannelIds.includes(ch.id) ? 'rgba(24,119,242,.06)' : 'var(--bg)',
                   }">
              <input type="checkbox"
                     :value="ch.id"
                     v-model="selectedMetaChannelIds"
                     style="width:15px;height:15px;accent-color:#1877F2;cursor:pointer;flex:none;"/>
              <span style="font-size:13px;color:var(--text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
                {{ ch.display_name || ch.username }}
              </span>
              <span style="font-size:10px;color:var(--muted);margin-left:auto;flex:none;">
                {{ (ch.platform_type || ch.platform?.slug) === 'instagram' ? 'Instagram' : 'Facebook' }}
              </span>
            </label>
            <!-- IG + rasmsiz ogohlantirish -->
            <div v-if="igChannelsSelected && !hasImage"
                 style="font-size:11.5px;color:#854d0e;background:rgba(234,179,8,.08);border:1px solid rgba(234,179,8,.3);border-radius:7px;padding:8px 10px;line-height:1.5;">
              ⚠ Instagram rasmsiz postni qo'llamaydi. Rasm qo'shmasangiz, IG kanallarga yuborilmaydi.
            </div>
          </section>

          <!-- iPhone 16 Telegram preview — switch bilan yoqiladi -->
          <section class="pe-preview-wrap" :class="{ on: previewShown }">
            <div class="pe-preview-head">
              <span class="pe-preview-head-icon"><AppIcon name="Telegram" :size="12"/></span>
              <span class="pe-preview-head-title">Telegram preview</span>
              <span v-if="previewShown" class="pe-preview-head-lang">{{ activeLang.toUpperCase() }}</span>
              <button
                type="button"
                class="pe-switch"
                :class="{ on: previewShown }"
                @click="previewShown = !previewShown"
                :aria-pressed="previewShown"
                role="switch">
                <span class="pe-switch-thumb"/>
              </button>
            </div>
            <div v-if="previewShown" class="pe-preview-body">
              <TelegramPreview
                :channel-name="previewChannelName"
                :subscriber-count="previewSubscriberCount"
                :title="activeTr.title"
                :short-description="activeTr.short_description"
                :content-json="activeTr.content_json"
                :cover-url="form.cover_image_url"
                :gallery="galleryArr"
                :tags="tagsArr"
                :signature="previewSignature"/>
              <div class="pe-preview-hint">Bu — kanalingizdagi taxminiy ko'rinish. Til almashtirsangiz preview ham yangilanadi.</div>
            </div>
          </section>

          <!-- Settings card -->
          <section class="pe-card">
            <header class="pe-card-head">
              <span class="pe-card-head-icon"><AppIcon name="Settings" :size="13"/></span>
              <h3>{{ tt('pe.section.basics') }}</h3>
            </header>

            <!-- Platform cards -->
            <div class="pe-field">
              <label class="pe-label">{{ tt('pe.field.platform') }}</label>
              <div class="pe-platform-cards">
                <button v-for="p in platforms" :key="p"
                  class="pe-platform-card"
                  :class="{ active: form.platform === p }"
                  @click="form.platform = p"
                  :title="tt('pe.platform.' + p)">
                  <span class="pe-platform-card-icon" :style="iconStyle(p)">
                    <AppIcon :name="platformIcon(p)" :size="14"/>
                  </span>
                  <span class="pe-platform-card-name">{{ tt('pe.platform.' + p) }}</span>
                </button>
              </div>
            </div>

            <div class="pe-field">
              <label class="pe-label">{{ tt('pe.field.category') }}</label>
              <div class="pe-cat-row">
                <select v-model="form.category_id" class="pe-input pe-cat-select">
                  <option :value="null">— tanlang —</option>
                  <option v-for="c in categories" :key="c.id" :value="c.id">{{ c.name }}</option>
                </select>
                <button type="button" class="pe-cat-add" @click="openCategoryModal" :title="'Yangi kategoriya'">
                  <AppIcon name="Plus" :size="12"/>
                </button>
              </div>
            </div>

            <div class="pe-field" style="position:relative;">
              <label class="pe-label">{{ tt('pe.field.tags') }}</label>
              <div class="pe-tags">
                <span v-for="(tg, idx) in tagsArr" :key="`${tg}-${idx}`" class="pe-tag">
                  {{ tg }}
                  <button @click="removeTag(idx)" class="pe-tag-x">
                    <AppIcon name="Close" :size="9"/>
                  </button>
                </span>
                <input v-model="tagInput"
                  @keydown.enter.prevent="onTagEnter"
                  @keydown.,.prevent="addTag"
                  @keydown.down.prevent="moveSuggest(1)"
                  @keydown.up.prevent="moveSuggest(-1)"
                  @keydown.escape="hideSuggest"
                  @input="onTagInput"
                  @focus="onTagInput"
                  @blur="onTagBlur"
                  :placeholder="tagsArr.length ? '+' : tt('pe.field.tagsPh')"
                  class="pe-tag-input"/>
              </div>
              <!-- Autocomplete dropdown -->
              <div v-if="tagSuggestOpen && tagSuggestions.length" class="pe-tag-suggest">
                <button v-for="(s, i) in tagSuggestions" :key="s.name"
                  type="button"
                  class="pe-tag-suggest-item"
                  :class="{ active: i === tagSuggestActive }"
                  @mousedown.prevent="pickSuggestion(s.name)"
                  @mouseenter="tagSuggestActive = i">
                  <span class="pe-tag-suggest-name">{{ s.name }}</span>
                  <span class="pe-tag-suggest-count">{{ s.count }}×</span>
                </button>
              </div>
            </div>

            <div class="pe-field">
              <label class="pe-label">
                <AppIcon name="Calendar" :size="11" :style="{ verticalAlign: 'middle', marginRight: '4px' }"/>
                {{ tt('pe.field.publishAt') }}
              </label>
              <DateTimePicker v-model="form.publish_at"/>
              <span class="pe-hint">{{ tt('pe.field.publishAtHint') }}</span>
            </div>

            <div v-if="isEdit" class="pe-field">
              <label class="pe-label">{{ tt('pe.field.status') }}</label>
              <select v-model="form.status" class="pe-input" @change="onStatusChange">
                <option value="draft">{{ tt('posts.status.draft') }}</option>
                <option value="scheduled">{{ tt('posts.status.scheduled') }}</option>
                <option value="published">{{ tt('posts.status.published') }}</option>
                <option value="failed">{{ tt('posts.status.failed') }}</option>
              </select>
              <span class="pe-hint">{{ tt('pe.field.statusHint') }}</span>
            </div>
          </section>

          <!-- Gallery card -->
          <section class="pe-card">
            <header class="pe-card-head">
              <span class="pe-card-head-icon"><AppIcon name="Layers" :size="13"/></span>
              <h3>{{ tt('pe.field.gallery') }}</h3>
            </header>
            <div class="pe-gallery-grid">
              <div v-for="(url, i) in galleryArr" :key="`${url}-${i}`" class="pe-gallery-item"
                :style="{ backgroundImage: `url(${url})` }">
                <button class="pe-gallery-x" @click="removeGallery(i)">
                  <AppIcon name="Close" :size="10"/>
                </button>
              </div>
            </div>
            <div class="pe-gallery-add">
              <input ref="galleryFileInput" type="file" accept="image/*" multiple @change="onGalleryFiles" hidden/>
              <button class="pe-gallery-upload-btn pe-gallery-library-btn" @click="galleryLibraryOpen = true">
                <AppIcon name="Layers" :size="13"/>
                Media kutubxonadan tanlash
              </button>
              <button class="pe-gallery-upload-btn" @click="galleryFileInput?.click()" :disabled="galleryUploading">
                <AppIcon :name="galleryUploading ? 'Sparkle' : 'Plus'" :size="13"/>
                {{ galleryUploading ? 'Yuklanmoqda...' : 'Yangi yuklash' }}
              </button>
              <input v-model="galleryInput" @keydown.enter.prevent="addGallery"
                placeholder="yoki https://... + Enter" class="pe-input"/>
            </div>
          </section>

        </aside>
      </div>

      <!-- Inline error toast -->
      <div v-if="formError" class="pe-error">
        <AppIcon name="Close" :size="12"/>
        {{ formError }}
      </div>
    </template>

    <!-- Media gallery (cover) -->
    <MediaGallery v-model="coverGalleryOpen" :multiple="false" @pick="onPickCover"/>

    <!-- Media gallery (gallery) -->
    <MediaGallery v-model="galleryLibraryOpen" :multiple="true" @pick="onPickGallery"/>

    <!-- Category create modal -->
    <AppModal v-model="catModalOpen" title="Yangi kategoriya" subtitle="Faqat ushbu kompaniya uchun">
      <div style="display:flex;flex-direction:column;gap:12px;">
        <div style="display:flex;flex-direction:column;gap:5px;">
          <label class="pe-label">Nom</label>
          <input v-model="catForm.name" placeholder="Masalan: Yangiliklar"
            class="pe-input" @keydown.enter.prevent="saveCategory"/>
        </div>
        <div style="display:flex;flex-direction:column;gap:5px;">
          <label class="pe-label">Rang (ixtiyoriy)</label>
          <input v-model="catForm.color" type="color" class="pe-input" style="height:36px;padding:2px 6px;"/>
        </div>
        <div v-if="catError" class="pe-error" style="margin:0;">
          <AppIcon name="Close" :size="12"/> {{ catError }}
        </div>
        <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:4px;">
          <AppButton variant="secondary" size="md" @click="catModalOpen = false">Bekor qilish</AppButton>
          <AppButton variant="primary" size="md" :loading="catSaving" @click="saveCategory">
            Saqlash
          </AppButton>
        </div>
      </div>
    </AppModal>

    <!-- ─── AI rewrite modal — prompt + provider + model ─── -->
    <AppModal v-model="showAiRewrite"
              :title="aiModalTitle"
              :subtitle="aiModalSubtitle"
              width="560px">
      <div style="display:flex;flex-direction:column;gap:14px;">
        <!-- Prompt -->
        <div style="display:flex;flex-direction:column;gap:8px;">
          <span style="font-size:12px;font-weight:600;color:var(--text);">1. Prompt</span>

          <!-- Tavsiya etilgan promptdan foydalanish — faqat admin shu turdagi
               prompt yaratgan bo'lsa ko'rinadi -->
          <label v-if="aiRecommended.exists" class="pe-aire-recommend"
                 :class="{ on: aiRewriteForm.useRecommended }">
            <input type="checkbox" v-model="aiRewriteForm.useRecommended" :disabled="aiShortening"/>
            <div style="display:flex;flex-direction:column;gap:2px;flex:1;">
              <span style="font-size:13px;font-weight:600;color:var(--text);">
                ✨ Tavsiya etilgan promptdan foydalanish
                <span v-if="aiRecommended.name" style="color:var(--muted);font-weight:400;">
                  — {{ aiRecommended.name }}
                </span>
              </span>
              <span style="font-size:11px;color:var(--muted);">
                Admin tomonidan tayyorlangan eng yaxshi prompt avtomatik ishlatiladi.
                Ushbu rejimda quyidagi ro'yxat o'chiriladi.
              </span>
            </div>
          </label>

          <!-- Diagnostika — tavsiya etilgan prompt mavjud emasligi sababi -->
          <div v-else-if="aiRecommended.loaded"
               style="padding:9px 11px;border-radius:7px;background:rgba(245,158,11,.08);
                      border:1px solid rgba(245,158,11,.25);color:#92400e;font-size:11.5px;
                      line-height:1.5;">
            ⚠️ <strong>Tavsiya etilgan prompt mavjud emas.</strong>
            Admin <code>/admin/prompts</code> sahifasida <code>article_shorten</code>
            (Maqola qisqartirish va sayqallash) toifasi belgilangan prompt yaratsin —
            keyin shu yerda "Tavsiya etilgan promptdan foydalanish" checkbox ko'rinadi.
          </div>

          <div v-if="!aiPromptGroups.length && !aiRewriteForm.useRecommended"
               style="padding:14px;text-align:center;border:1px dashed var(--border-2);border-radius:8px;
                      display:flex;flex-direction:column;gap:8px;align-items:center;font-size:12.5px;">
            <span style="color:var(--text);">Hali prompt yo'q. Avval Sozlamalar → AI prompt'da yarating.</span>
            <button type="button" @click="showAiRewrite = false; $router.push('/client/settings?tab=ai-prompt')"
                    style="padding:7px 14px;border-radius:6px;background:var(--accent);color:#fff;
                           border:none;cursor:pointer;font-size:12px;font-weight:500;">
              AI prompt →
            </button>
          </div>
          <select v-else v-model="aiRewriteForm.groupId"
                  :disabled="aiShortening || aiRewriteForm.useRecommended"
                  :style="{
                    padding: '9px 12px',
                    border: '1px solid var(--border-2)',
                    borderRadius: '6px',
                    background: aiRewriteForm.useRecommended ? 'var(--panel-2, rgba(99,102,241,.04))' : 'var(--bg)',
                    color: aiRewriteForm.useRecommended ? 'var(--muted)' : 'var(--text)',
                    fontSize: '13px',
                    opacity: aiRewriteForm.useRecommended ? 0.5 : 1,
                    cursor: aiRewriteForm.useRecommended ? 'not-allowed' : 'pointer',
                  }">
            <option value="" disabled>Promptni tanlang…</option>
            <option v-for="g in aiPromptGroups" :key="g.id" :value="g.id">
              {{ g.name }} · {{ g.prompts.length }} bo'lim{{ anyApplyBaseInGroup(g) ? ' · BASE' : '' }}
            </option>
          </select>
        </div>

        <!-- Provider -->
        <div style="display:flex;flex-direction:column;gap:6px;">
          <span style="font-size:12px;font-weight:600;color:var(--text);">2. AI provayder</span>
          <div style="display:flex;gap:8px;">
            <label v-for="p in aiProviders" :key="p.id"
                   :style="{
                     flex: '1', display: 'flex', alignItems: 'center', gap: '8px',
                     padding: '10px 12px', cursor: 'pointer',
                     border: '1px solid ' + (aiRewriteForm.provider === p.id ? 'var(--accent)' : 'var(--border-2)'),
                     borderRadius: '7px',
                     background: aiRewriteForm.provider === p.id ? 'rgba(99,102,241,.06)' : 'var(--bg)',
                   }">
              <input v-model="aiRewriteForm.provider" type="radio" :value="p.id" :disabled="aiShortening"
                     style="margin:0;cursor:pointer;"/>
              <div style="display:flex;flex-direction:column;gap:1px;">
                <span style="font-size:12.5px;font-weight:600;color:var(--text);">{{ p.label }}</span>
                <span style="font-size:10.5px;color:var(--muted);">{{ p.note }}</span>
              </div>
            </label>
          </div>
        </div>

        <!-- Model -->
        <label style="display:flex;flex-direction:column;gap:6px;">
          <span style="font-size:12px;font-weight:600;color:var(--text);">3. Model</span>
          <select v-model="aiRewriteForm.model" :disabled="aiShortening"
                  style="padding:9px 12px;border:1px solid var(--border-2);border-radius:6px;
                         background:var(--bg);color:var(--text);font-size:13px;
                         font-family:'JetBrains Mono',monospace;">
            <option v-for="m in aiAvailableModels" :key="m.id" :value="m.id">
              {{ m.label }} {{ m.note ? '— ' + m.note : '' }}
            </option>
          </select>
        </label>

        <!-- Chiqish tili -->
        <div style="display:flex;flex-direction:column;gap:6px;">
          <span style="font-size:12px;font-weight:600;color:var(--text);">4. Chiqish tili</span>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
            <label v-for="l in AI_OUTPUT_LANGS" :key="l.id"
                   :style="{
                     display: 'flex', alignItems: 'center', gap: '8px',
                     padding: '9px 12px', cursor: aiShortening ? 'not-allowed' : 'pointer',
                     border: '1px solid ' + (aiRewriteForm.outputLanguage === l.id ? 'var(--accent)' : 'var(--border-2)'),
                     borderRadius: '7px',
                     background: aiRewriteForm.outputLanguage === l.id ? 'rgba(99,102,241,.06)' : 'var(--bg)',
                   }">
              <input v-model="aiRewriteForm.outputLanguage" type="radio" :value="l.id" :disabled="aiShortening"
                     style="margin:0;cursor:pointer;"/>
              <span style="font-size:12.5px;font-weight:600;color:var(--text);">{{ l.label }}</span>
            </label>
          </div>
          <span style="font-size:11px;color:var(--muted);">
            AI matnni shu tilda va yozuvda qaytaradi — manba qaysi tilda bo'lishidan qat'i nazar.
          </span>
        </div>

        <div v-if="aiError" style="padding:10px 12px;border-radius:7px;background:rgba(239,68,68,.08);
                     border:1px solid rgba(239,68,68,.25);color:#ef4444;font-size:12.5px;">
          {{ aiError }}
        </div>
      </div>

      <template #footer>
        <button type="button" @click="showAiRewrite = false" :disabled="aiShortening"
                style="padding:8px 14px;border-radius:6px;background:transparent;color:var(--muted);
                       border:1px solid var(--border-2);cursor:pointer;font-size:12.5px;">
          Bekor qilish
        </button>
        <button type="button" @click="runAiRewrite"
                :disabled="!canRunAiRewrite"
                :style="{
                  padding: '8px 16px', borderRadius: '6px',
                  background: canRunAiRewrite ? 'var(--accent)' : 'var(--bg-2,rgba(0,0,0,.05))',
                  color: canRunAiRewrite ? '#fff' : 'var(--muted)',
                  border: 'none', cursor: canRunAiRewrite ? 'pointer' : 'default',
                  fontSize: '12.5px', fontWeight: 600,
                }">
          {{ aiShortening ? (aiMode === 'shorten' ? 'Qisqartirilmoqda…' : 'Yozilmoqda…') : aiRunLabel }}
        </button>
      </template>
    </AppModal>

    <!-- ─── Telegram publish — til tanlash ─── -->
    <AppModal v-model="showPublishLang"
              title="Qaysi tilda e'lon qilinsin?"
              subtitle="Tanlangan til keyingi postlar uchun ham default bo'ladi"
              width="460px">
      <div style="display:flex;flex-direction:column;gap:10px;">
        <div v-if="!publishableLangs.length"
             style="padding:12px;border-radius:8px;background:rgba(245,158,11,.08);
                    border:1px solid rgba(245,158,11,.25);color:#92400e;font-size:12.5px;">
          ⚠️ Hali birorta til to'ldirilmagan. Avval postni biror tilda yozing.
        </div>
        <label v-for="l in publishableLangs" :key="l"
               :style="{
                 display: 'flex', alignItems: 'center', gap: '10px',
                 padding: '11px 13px', cursor: 'pointer',
                 border: '1px solid ' + (publishLang === l ? 'var(--accent)' : 'var(--border-2)'),
                 borderRadius: '8px',
                 background: publishLang === l ? 'rgba(99,102,241,.06)' : 'var(--bg)',
               }">
          <input type="radio" v-model="publishLang" :value="l" style="margin:0;cursor:pointer;"/>
          <span class="pe-hcl-code" style="font-size:11px;font-weight:700;color:var(--muted);
                       padding:2px 7px;border:1px solid var(--border-2);border-radius:5px;">
            {{ langCode(l) }}
          </span>
          <span style="font-size:13px;font-weight:600;color:var(--text);">{{ tt('pe.lang.' + l) }}</span>
          <span v-if="company?.default_publish_lang === l"
                style="margin-left:auto;font-size:10.5px;color:var(--accent);font-weight:600;">
            default
          </span>
        </label>
      </div>
      <template #footer>
        <button type="button" @click="showPublishLang = false"
                style="padding:8px 14px;border-radius:6px;background:transparent;color:var(--muted);
                       border:1px solid var(--border-2);cursor:pointer;font-size:12.5px;">
          Bekor qilish
        </button>
        <button type="button" @click="confirmPublishLang"
                :disabled="!publishableLangs.length"
                :style="{
                  padding: '8px 16px', borderRadius: '6px',
                  background: publishableLangs.length ? 'var(--accent)' : 'var(--bg-2,rgba(0,0,0,.05))',
                  color: publishableLangs.length ? '#fff' : 'var(--muted)',
                  border: 'none', cursor: publishableLangs.length ? 'pointer' : 'default',
                  fontSize: '12.5px', fontWeight: 600,
                }">
          ➤ E'lon qilish
        </button>
      </template>
    </AppModal>

    <!-- ─── AI rewrite / shorten — sahifa bo'ylab loader ─── -->
    <AiFullPageLoader
      :model-value="aiShortening"
      title="AI maqolani qayta yozmoqda"
      subtitle="Tanlangan prompt va model bo'yicha matn qayta ishlanmoqda"
      :steps="[
        'Mavjud matn tahlil qilinmoqda',
        'AI yangi versiyani yozmoqda',
        'Natija tayyorlanmoqda',
      ]"
      hint="Bu jarayon odatda 10–30 soniya davom etadi. Sahifani yopmang."
    />

    <!-- ─── Video yuklab olinmoqda — sahifani yopmang ─── -->
    <transition name="pe-vp-fade">
      <div v-if="post?.video_processing" class="pe-vp-overlay">
        <div class="pe-vp-card">
          <div class="pe-vp-icon">
            <svg width="48" height="48" viewBox="0 0 48 48">
              <circle cx="24" cy="24" r="20" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="3"/>
              <circle cx="24" cy="24" r="20" fill="none" stroke="white" stroke-width="3"
                stroke-linecap="round" stroke-dasharray="32 126"
                style="transform-origin: 24px 24px; animation: pe-vp-spin 1.1s linear infinite;"/>
            </svg>
            <AppIcon name="Eye" :size="20" style="position:absolute;"/>
          </div>
          <h3 class="pe-vp-title">Ushbu postda video bor — ko'chirilmoqda</h3>
          <p class="pe-vp-sub">
            Iltimos, sahifani yopmang va boshqa joyga o'tib ketmang.
            Video o'lchamiga qarab 10–60 soniya vaqt olishi mumkin.
          </p>
          <div class="pe-vp-bar"><div class="pe-vp-bar-fill"/></div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, reactive, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppButton from '@/components/ui/AppButton.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import RichEditor from '@/components/editor/RichEditor.vue'
import TelegramPreview from '@/components/preview/TelegramPreview.vue'
import DateTimePicker from '@/components/ui/DateTimePicker.vue'
import AppModal from '@/components/ui/AppModal.vue'
import MediaGallery from '@/components/media/MediaGallery.vue'
import AiFullPageLoader from '@/components/ui/AiFullPageLoader.vue'
import { categoriesApi } from '@/api/categories.js'
import { useAppStore } from '@/stores/app.js'
import { useStorageStore } from '@/stores/storage.js'
import { useAiUsageStore } from '@/stores/aiUsage.js'
import { usePostsUsageStore } from '@/stores/postsUsage.js'
import { useQuotaStore } from '@/stores/quota.js'
import { AI_CREDIT_COST } from '@/config/aiCredits.js'
import { companiesApi } from '@/api/companies.js'
import { channelsApi } from '@/api/channels.js'
import { postsApi } from '@/api/posts.js'
import { uploadsApi } from '@/api/uploads.js'
import { aiApi } from '@/api/ai.js'

const route = useRoute()
const router = useRouter()
const store = useAppStore()
const storageStore = useStorageStore()
const aiUsageStore = useAiUsageStore()
const postsUsageStore = usePostsUsageStore()
const quotaStore = useQuotaStore()

/**
 * AI xato xabarini chiqaradi. Kredit yetmasa (402 INSUFFICIENT_CREDITS) —
 * tushunarli alert + billing bo'limiga yo'naltirish maslahati.
 */
function aiErrorMessage(e) {
  const data = e?.response?.data || {}
  if (e?.response?.status === 402 || data.code === 'INSUFFICIENT_CREDITS') {
    const need = data.required != null ? `${data.required} kredit` : 'kredit'
    const have = data.balance != null ? `${data.balance} kredit` : '0'
    return `Kredit yetarli emas (kerak: ${need}, mavjud: ${have}). Billing bo'limidan kredit to'ldiring.`
  }
  const msg = data.message || 'AI amalida xato'
  return Array.isArray(msg) ? msg.join('. ') : msg
}
const t = computed(() => store.t)
function tt(key, params) { return t.value(key, params) }

const LANGS = ['uz', 'uz_cyr', 'ru', 'en']
const platforms = ['telegram', 'website', 'instagram']
// Til switcher chipida ko'rsatiladigan qisqa kod (uz_cyr juda uzun)
const LANG_CODE = { uz: 'UZ', uz_cyr: 'ЎЗ', ru: 'RU', en: 'EN' }
function langCode(l) { return LANG_CODE[l] || (l || '').toUpperCase() }

const isEdit = computed(() => !!route.params.id)
const postId = computed(() => route.params.id)

const initLoading = ref(true)
const saving = ref(false)
const publishing = ref(false)
const deleting = ref(false)
const activating = ref(false)
const previewShown = ref(false)
const formError = ref('')

// AI assistant state
const aiShortening = ref(false)
const aiTagging = ref(false)
const aiError = ref('')
const lastSavedAt = ref(null)

// AI rewrite modal — oxirgi tanlov localStorage'da saqlanadi
const AI_REWRITE_LS_KEY = 'muxbir.ai-rewrite.preferences'
const showAiRewrite = ref(false)
// 'rewrite' (qayta yozish) yoki 'shorten' (qisqartirish) — bitta modal, ikki rejim.
const aiMode = ref('rewrite')
const aiModalTitle = computed(() => aiMode.value === 'shorten' ? 'AI bilan qisqartirish' : 'AI bilan qayta yozish')
const aiModalSubtitle = computed(() => aiMode.value === 'shorten'
  ? 'Matnni qisqartirish uchun prompt, provayder va modelni tanlang'
  : 'Promptni, AI provayderini va modelni tanlang')
const aiRunLabel = computed(() => aiMode.value === 'shorten' ? '✂️ Qisqartirish' : '✨ Qayta yozish')
const aiPromptGroups = ref([])
const aiSavedPrefs = (() => {
  try { return JSON.parse(localStorage.getItem(AI_REWRITE_LS_KEY) || '{}') }
  catch { return {} }
})()
const aiRewriteForm = reactive({
  groupId:  aiSavedPrefs.groupId  || '',
  provider: aiSavedPrefs.provider || 'openai',
  model:    aiSavedPrefs.model    || 'gpt-4o-mini',
  // Chiqish tili — AI matnni shu tilda qaytaradi VA shu til tabiga joylaydi (uz | uz_cyr | ru | en)
  outputLanguage: aiSavedPrefs.outputLanguage || 'uz',
  // Default: yoqilgan — lekin admin tavsiya etgan prompt mavjud bo'lmasa
  // openAiRewrite ichida false ga tushiriladi.
  useRecommended: aiSavedPrefs.useRecommended === undefined ? true : !!aiSavedPrefs.useRecommended,
})

// AI rewrite chiqish tili variantlari
const AI_OUTPUT_LANGS = [
  { id: 'uz',     label: "O'zbek (lotin)" },
  { id: 'uz_cyr', label: "O'zbek (kirill)" },
  { id: 'ru',     label: 'Rus tili' },
  { id: 'en',     label: 'Ingliz tili' },
]

// Admin tavsiya etgan prompt mavjudligi — modal har ochilganda yangilanadi.
const aiRecommended = ref({ exists: false, name: null, loaded: false })

const canRunAiRewrite = computed(() => {
  if (aiShortening.value) return false
  if (aiRewriteForm.useRecommended) return true
  return !!aiRewriteForm.groupId
})
const aiProviders = [
  { id: 'openai',    label: 'OpenAI',           note: 'GPT-4o, mini' },
  { id: 'gemini',    label: 'Google Gemini',    note: '2.5 Pro/Flash' },
  { id: 'anthropic', label: 'Anthropic Claude', note: 'Sonnet, Haiku, Opus' },
]
const aiModelsByProvider = {
  openai: [
    { id: 'gpt-4o-mini',   label: 'gpt-4o-mini',   note: 'tezkor (default)' },
    { id: 'gpt-4o',        label: 'gpt-4o',        note: 'eng kuchli' },
    { id: 'gpt-4-turbo',   label: 'gpt-4-turbo',   note: 'oldingi avlod' },
    { id: 'gpt-3.5-turbo', label: 'gpt-3.5-turbo', note: 'eng arzon' },
  ],
  gemini: [
    { id: 'gemini-2.5-flash',      label: 'gemini-2.5-flash',      note: 'tezkor (default)' },
    { id: 'gemini-2.5-pro',        label: 'gemini-2.5-pro',        note: 'kuchli' },
    { id: 'gemini-3.1-pro',        label: 'gemini-3.1-pro',        note: 'eng kuchli Gemini' },
    { id: 'gemini-2.5-flash-lite', label: 'gemini-2.5-flash-lite', note: 'eng arzon' },
    { id: 'gemini-flash-latest',   label: 'gemini-flash-latest',   note: 'eng yangi Flash' },
  ],
  anthropic: [
    { id: 'claude-sonnet-4-6',         label: 'claude-sonnet-4-6',         note: 'tezkor (default)' },
    { id: 'claude-opus-4-8',           label: 'claude-opus-4-8',           note: 'eng kuchli' },
    { id: 'claude-haiku-4-5-20251001', label: 'claude-haiku-4-5-20251001', note: 'eng arzon, tez' },
  ],
}
const aiAvailableModels = computed(() => aiModelsByProvider[aiRewriteForm.provider] || [])
watch(() => aiRewriteForm.provider, (p) => {
  const list = aiModelsByProvider[p] || []
  if (list.length && !list.some(m => m.id === aiRewriteForm.model)) {
    aiRewriteForm.model = list[0].id
  }
})

const company = ref(null)
const allChannels = ref([])
const post = ref(null)

const form = reactive({
  platform: 'telegram',
  category: '',
  category_id: null,
  publish_at: '',
  cover_image_url: '',
  telegram_channel_id: null,
  telegram_channel_ids: [],
  telegram_raw_long_text: '',
  status: 'scheduled',
})

// ── Media kutubxona modal'lari ─────────────────────────────
const coverGalleryOpen = ref(false)
const galleryLibraryOpen = ref(false)

async function onPickCover(url) {
  if (!url) return
  const oldUrl = form.cover_image_url
  form.cover_image_url = url
  // Edit rejimida DB'ga darhol saqlash
  if (isEdit.value && company.value && post.value) {
    try {
      await postsApi.update(company.value.id, postId.value, { cover_image_url: url })
    } catch { /* save'da saqlanadi */ }
  } else if (oldUrl && oldUrl !== url) {
    // Create rejimida: eski cover tanlangan bo'lsa, lekin u DB'da yo'q —
    // baribir o'chirmaymiz (boshqa postlarda foydalanilayotgan bo'lishi mumkin
    // chunki bu media kutubxonadan tanlangan, alohida uploaded fayl emas)
  }
  storageStore.refresh()
}

async function onPickGallery(urls) {
  if (!urls?.length) return
  // Dublikatlarni chiqarib tashlaymiz
  const existing = new Set(galleryArr.value)
  const toAdd = urls.filter(u => u && !existing.has(u))
  if (!toAdd.length) return
  galleryArr.value.push(...toAdd)
  if (isEdit.value && company.value && post.value) {
    try {
      await postsApi.update(company.value.id, postId.value, { gallery: [...galleryArr.value] })
    } catch { /* save'da saqlanadi */ }
  }
  storageStore.refresh()
}

// ── Kategoriyalar (per-company spravochnik) ─────────────────
const categories = ref([])
const catModalOpen = ref(false)
const catSaving = ref(false)
const catError = ref('')
const catForm = reactive({ name: '', color: '#2F6FED' })

async function loadCategories() {
  if (!company.value) return
  try {
    categories.value = await categoriesApi.list(company.value.id)
  } catch { /* jim */ }
}

function openCategoryModal() {
  catForm.name = ''
  catForm.color = '#2F6FED'
  catError.value = ''
  catModalOpen.value = true
}

async function saveCategory() {
  catError.value = ''
  const name = catForm.name.trim()
  if (!name) { catError.value = 'Nom kiritilishi shart'; return }
  if (!company.value) { catError.value = 'Kompaniya topilmadi'; return }
  catSaving.value = true
  try {
    const created = await categoriesApi.create(company.value.id, {
      name,
      color: catForm.color || undefined,
    })
    categories.value = [...categories.value, created].sort((a, b) =>
      (a.sort_order - b.sort_order) || a.name.localeCompare(b.name)
    )
    form.category_id = created.id
    catModalOpen.value = false
  } catch (e) {
    const msg = e?.response?.data?.message
    catError.value = Array.isArray(msg) ? msg.join('. ') : (msg || 'Saqlashda xato')
  } finally {
    catSaving.value = false
  }
}

const tagsArr = ref([])
const tagInput = ref('')
const galleryArr = ref([])
const galleryInput = ref('')
const coverFileInput = ref(null)
const galleryFileInput = ref(null)
const coverUploading = ref(false)
const galleryUploading = ref(false)

async function clearCover() {
  const url = form.cover_image_url
  form.cover_image_url = ''
  if (!url) return
  // Edit rejimida: post DB'da bor → cover_image_url=null ni darhol saqlab qo'yamiz,
  // shunda refresh'da rasm qaytib chiqmaydi. Backend update() bucket'dan ham o'chiradi.
  if (isEdit.value && company.value && post.value) {
    try {
      await postsApi.update(company.value.id, postId.value, { cover_image_url: null })
      storageStore.refresh()
      return
    } catch {/* fallback: alohida delete */}
  }
  try {
    await uploadsApi.deleteByUrls([url])
    storageStore.refresh()
  } catch { /* save'da diff orqali tozalanadi */ }
}

async function onCoverFile(e) {
  const file = e.target.files?.[0]
  e.target.value = '' // reset
  if (!file) return
  coverUploading.value = true
  const oldUrl = form.cover_image_url
  try {
    const res = await uploadsApi.uploadImage(file)
    if (res?.url) form.cover_image_url = res.url

    // Edit rejimida: yangi cover'ni DB'ga darhol yozamiz — refresh'da yo'qolmasin.
    // Backend update() diff orqali eski cover'ni bucket'dan ham o'chiradi.
    if (isEdit.value && company.value && post.value) {
      try {
        await postsApi.update(company.value.id, postId.value, { cover_image_url: form.cover_image_url || null })
      } catch {/* save bosilganida diff orqali tozalanadi */}
    } else if (oldUrl && oldUrl !== form.cover_image_url) {
      // Create rejimida: eski cover'ni alohida o'chiramiz
      uploadsApi.deleteByUrls([oldUrl]).catch(() => {})
    }
    storageStore.refresh()
  } catch (err) {
    const msg = err?.response?.data?.message || 'Yuklashda xato'
    formError.value = Array.isArray(msg) ? msg.join('. ') : msg
  } finally {
    coverUploading.value = false
  }
}

async function onGalleryFiles(e) {
  const files = Array.from(e.target.files || [])
  e.target.value = ''
  if (!files.length) return
  galleryUploading.value = true
  try {
    const res = await uploadsApi.uploadImages(files)
    const urls = (res?.files || []).map(f => f.url).filter(Boolean)
    galleryArr.value.push(...urls)

    // Edit rejimida: yangi gallery'ni DB'ga darhol yozamiz — refresh'da yo'qolmasin
    if (isEdit.value && company.value && post.value) {
      try {
        await postsApi.update(company.value.id, postId.value, { gallery: [...galleryArr.value] })
      } catch {/* save bosilganida saqlanadi */}
    }
    storageStore.refresh()
  } catch (err) {
    const msg = err?.response?.data?.message
    formError.value = (Array.isArray(msg) ? msg.join('. ') : msg) || 'Yuklashda xato'
  } finally {
    galleryUploading.value = false
  }
}

function addTag(value) {
  const raw = typeof value === 'string' ? value : tagInput.value
  const v = (raw || '').trim().replace(/,/g, '')
  if (!v) return
  if (!tagsArr.value.includes(v)) tagsArr.value.push(v)
  tagInput.value = ''
  hideSuggest()
}
function removeTag(i) { tagsArr.value.splice(i, 1) }

// ── Tag autocomplete ────────────────────────────────────────
const tagSuggestions = ref([])
const tagSuggestOpen = ref(false)
const tagSuggestActive = ref(-1)
let tagSuggestT = null

async function fetchTagSuggestions(q) {
  if (!company.value) return
  try {
    const list = await postsApi.listTags(company.value.id, q || undefined, 10)
    // Allaqachon tanlangan teglarni chiqarib tashlaymiz
    const taken = new Set(tagsArr.value.map(t => t.toLowerCase()))
    tagSuggestions.value = (list || []).filter(s => !taken.has(s.name.toLowerCase()))
    tagSuggestActive.value = tagSuggestions.value.length ? 0 : -1
    tagSuggestOpen.value = tagSuggestions.value.length > 0
  } catch {
    tagSuggestions.value = []
    tagSuggestOpen.value = false
  }
}

function onTagInput() {
  clearTimeout(tagSuggestT)
  const q = tagInput.value.trim()
  tagSuggestT = setTimeout(() => fetchTagSuggestions(q), 180)
}

function onTagBlur() {
  // mousedown.prevent suggestion click'ni saqlab qoldi —
  // bu blur faqat input outsida tugmasi bosilmaganda yopadi
  setTimeout(() => { tagSuggestOpen.value = false }, 120)
}

function hideSuggest() {
  tagSuggestOpen.value = false
  tagSuggestActive.value = -1
}

function moveSuggest(delta) {
  if (!tagSuggestOpen.value || !tagSuggestions.value.length) {
    fetchTagSuggestions(tagInput.value.trim())
    return
  }
  const n = tagSuggestions.value.length
  tagSuggestActive.value = (tagSuggestActive.value + delta + n) % n
}

function pickSuggestion(name) {
  addTag(name)
}

function onTagEnter() {
  // Agar suggestion tanlangan bo'lsa shuni qo'shamiz, aks holda input matnini
  if (tagSuggestOpen.value && tagSuggestActive.value >= 0 && tagSuggestions.value[tagSuggestActive.value]) {
    pickSuggestion(tagSuggestions.value[tagSuggestActive.value].name)
  } else {
    addTag()
  }
}
function addGallery() {
  const v = galleryInput.value.trim()
  if (!v) return
  galleryArr.value.push(v)
  galleryInput.value = ''
}
async function removeGallery(i) {
  const url = galleryArr.value[i]
  galleryArr.value.splice(i, 1)
  if (!url) return
  // Edit rejimida: post DB'da bor → yangilangan gallery'ni darhol saqlaymiz,
  // shunda refresh'da rasm qaytib chiqmaydi. Backend update() diff bo'yicha
  // bucket'dan ham o'chiradi va counter'ni yangilaydi.
  if (isEdit.value && company.value && post.value) {
    try {
      await postsApi.update(company.value.id, postId.value, { gallery: [...galleryArr.value] })
      storageStore.refresh()
      return
    } catch {/* fallback: alohida delete */}
  }
  // Create rejimida (yangi post hali saqlanmagan) yoki backend xatosi — bucket'dan to'g'ridan o'chiramiz
  try {
    await uploadsApi.deleteByUrls([url])
    storageStore.refresh()
  } catch { /* keyingi save'da diff orqali tozalanadi */ }
}

// Editor'ni AI yangilashlar / kontent qayta yuklash bilan majburiy re-mount qilish uchun counter.
// Vue v-model + Tiptap reactivity ba'zan tashqi assignment'larni o'tkazib yuboradi —
// bu key bump qilingan har safar editor instance qayta yaratiladi va yangi modelValue'ni oladi.
const editorReloadKey = ref(0)

const translations = reactive({
  uz:     { title: '', short_description: '', content_json: { html: '' }, is_complete: false },
  uz_cyr: { title: '', short_description: '', content_json: { html: '' }, is_complete: false },
  ru:     { title: '', short_description: '', content_json: { html: '' }, is_complete: false },
  en:     { title: '', short_description: '', content_json: { html: '' }, is_complete: false },
})
const activeLang = ref(
  (typeof route.query.lang === 'string' && route.query.lang in translations)
    ? route.query.lang
    : (store.lang in translations ? store.lang : 'uz')
)
const activeTr = computed(() => translations[activeLang.value])

const connectedTgChannels = computed(() =>
  allChannels.value.filter(c => {
    const pt = c.platform_type || c.platform?.slug
    return (pt === 'telegram' || c.telegram_chat_id) && c.status === 'connected'
  }),
)
const connectedMetaChannels = computed(() =>
  allChannels.value.filter(c => {
    const pt = c.platform_type || c.platform?.slug
    return (pt === 'facebook' || pt === 'instagram') && c.status === 'connected'
  }),
)
const selectedMetaChannelIds = ref([])
const igChannelsSelected = computed(() =>
  selectedMetaChannelIds.value.some(id => {
    const ch = connectedMetaChannels.value.find(c => c.id === id)
    return (ch?.platform_type || ch?.platform?.slug) === 'instagram'
  }),
)
const hasImage = computed(() => !!form.cover_image_url || (Array.isArray(form.gallery) && form.gallery.length > 0))

// Preview ko'p kanaldan BIRINCHISIni ko'rsatadi (taxminiy ko'rinish).
const primaryChannelId = computed(() => form.telegram_channel_ids[0] || null)
const primaryChannel = computed(() =>
  connectedTgChannels.value.find(c => c.id === primaryChannelId.value) || null,
)
const previewChannelName = computed(() =>
  primaryChannel.value?.display_name || primaryChannel.value?.username || store.companyName || 'Mening kanalim',
)
const previewSubscriberCount = computed(() =>
  typeof primaryChannel.value?.subscriber_count === 'number' ? primaryChannel.value.subscriber_count : null,
)
const previewSignature = computed(() => primaryChannel.value?.signature || '')

function platformIcon(p) {
  return p === 'instagram' ? 'Instagram' : p === 'website' ? 'Globe' : 'Telegram'
}
function iconStyle(p) {
  let bg = '#2AABEE', fg = '#fff'
  if (p === 'instagram') { bg = 'linear-gradient(135deg,#f9ce34,#ee2a7b,#6228d7)' }
  else if (p === 'website') { bg = 'var(--panel-2)'; fg = 'var(--text-2)' }
  return { width:'24px', height:'24px', borderRadius:'7px', background: bg, color: fg, display:'inline-flex', alignItems:'center', justifyContent:'center', flexShrink: 0 }
}

/**
 * Til "to'liq tayyor" (is_complete) ekanini AVTOMATIK aniqlaydi:
 * sarlavha va asosiy matn bo'lsa — tayyor. Qo'lda toggle qilish shart emas.
 */
function trComplete(tr) {
  return !!(tr && tr.title && tr.title.trim()) && hasContent(tr?.content_json)
}

function langState(l) {
  const tr = translations[l]
  if (!tr) return 'empty'
  if (trComplete(tr)) return 'complete'
  if (tr.title || tr.short_description || hasContent(tr.content_json)) return 'draft'
  return 'empty'
}
function hasContent(json) {
  if (!json) return false
  const html = typeof json === 'string' ? json : (json.html || '')
  if (!html) return false
  return html.replace(/<[^>]+>/g, '').replace(/&nbsp;/gi, ' ').trim().length > 0
}
function hasAnyContent(l) { return langState(l) !== 'empty' }
function firstNonEmptyTitle() {
  for (const l of [store.lang, 'uz', 'uz_cyr', 'ru', 'en']) {
    if (translations[l]?.title) return translations[l].title
  }
  return ''
}

// Joriy til avtomatik "tayyor"mi — faqat o'qish uchun indikator (qo'lda toggle yo'q)
const isActiveComplete = computed(() => trComplete(activeTr.value))

function removeLang() {
  if (!confirm(tt('pe.lang.removeTranslation') + '?')) return
  const t2 = translations[activeLang.value]
  t2.title = ''; t2.short_description = ''; t2.content_json = { blocks: [] }; t2.is_complete = false
  if (isEdit.value && post.value) {
    postsApi.removeTranslation(company.value.id, postId.value, activeLang.value).catch(() => {})
  }
}

const savedLabel = computed(() => {
  if (!lastSavedAt.value) return ''
  const diff = Math.floor((Date.now() - lastSavedAt.value) / 1000)
  if (diff < 5) return tt('pe.savedDraft') + ' ✓'
  if (diff < 60) return tt('pe.savedDraft') + ` (${diff}s)`
  return tt('pe.savedDraft')
})

async function loadInitial() {
  initLoading.value = true
  try {
    const cs = await companiesApi.getMy().catch(() => [])
    const list = Array.isArray(cs) ? cs : [cs].filter(Boolean)
    company.value = list[0] || null
    if (!company.value) { initLoading.value = false; return }

    const chs = await channelsApi.list(company.value.id).catch(() => [])
    allChannels.value = chs || []

    // Kategoriyalar spravochnigini yuklab olamiz (parallel emas, oddiy)
    await loadCategories()

    if (isEdit.value) {
      const p = await postsApi.get(company.value.id, postId.value)
      post.value = p
      form.platform = p.platform || 'telegram'
      form.category = p.category || ''
      form.category_id = p.category_id || null
      // O'tib ketgan publish_at qiymatlarini ko'rsatish noto'g'ri — picker
       // hozirgi vaqtni default ko'rsatadi. Faqat kelajakdagi qiymatlarni saqlaymiz.
      if (p.publish_at) {
        const dt = new Date(p.publish_at)
        form.publish_at = (!isNaN(dt.getTime()) && dt.getTime() > Date.now())
          ? toLocalDatetime(p.publish_at)
          : ''
      } else {
        form.publish_at = ''
      }
      form.cover_image_url = p.cover_image_url || ''
      form.telegram_channel_id = p.telegram_channel_id || null
      form.telegram_channel_ids = (p.telegram_channel_ids && p.telegram_channel_ids.length)
        ? [...p.telegram_channel_ids]
        : (p.telegram_channel_id ? [p.telegram_channel_id] : [])
      form.telegram_raw_long_text = p.telegram_raw_long_text || ''
      form.status = p.status || 'scheduled'
      tagsArr.value = p.tags || []
      galleryArr.value = p.gallery || []
      for (const l of LANGS) {
        const tr = p.translations?.find(x => x.lang === l)
        if (tr) {
          translations[l].title = tr.title || ''
          translations[l].short_description = tr.short_description || ''
          translations[l].content_json = tr.content_json || { html: '' }
          editorReloadKey.value++ // har yangi tarjima yuklanganda editor'ni yangi kontent bilan qayta yaratamiz
          translations[l].is_complete = !!tr.is_complete
        }
      }
      // Faol til bo'sh-u, boshqa tilda kontent bo'lsa — o'sha tilni ochamiz.
      // Masalan material faqat uz-kirillda bo'lsa, default uz-latin bo'sh form
      // chiqarmasin: store.lang → uz → uz_cyr → ru → en tartibida birinchi
      // kontentli til tanlanadi (URL'da ?lang= aniq berilmagan bo'lsa).
      const langFromQuery = typeof route.query.lang === 'string' && route.query.lang in translations
      if (!langFromQuery && !hasAnyContent(activeLang.value)) {
        const firstFilled = [store.lang, 'uz', 'uz_cyr', 'ru', 'en'].find(l => hasAnyContent(l))
        if (firstFilled && firstFilled !== activeLang.value) {
          activeLang.value = firstFilled
          editorReloadKey.value++ // editor yangi til kontenti bilan qayta yaratilsin
        }
      }
    }
  } finally {
    initLoading.value = false
  }
}

function toLocalDatetime(d) {
  try {
    let s = String(d).trim()
    if (/^\d{4}-\d{2}-\d{2}\s/.test(s)) s = s.replace(' ', 'T')
    const dt = new Date(s)
    if (isNaN(dt.getTime())) return ''
    const pad = n => String(n).padStart(2, '0')
    return `${dt.getFullYear()}-${pad(dt.getMonth()+1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`
  } catch { return '' }
}

onMounted(loadInitial)

// Route ID o'zgarsa qaytadan yuklash — Discover'dan kelganda yangi post
// uchun komponent qayta mount bo'lmasligi mumkin (Vue routerning default behaviour'i).
watch(() => route.params.id, (newId, oldId) => {
  if (newId && newId !== oldId) loadInitial()
})

// ── Video processing polling ──────────────────────────────
// Backend video'ni asinxron yuklab olganda postning video_processing flagi
// true bo'ladi. Frontend uni har 3 soniyada qayta yuklab tekshiradi va
// flag tushgach polling to'xtaydi (UI overlay yopiladi).
let videoPollTimer = null
function startVideoPolling() {
  stopVideoPolling()
  videoPollTimer = setInterval(async () => {
    if (!post.value?.id || !company.value) { stopVideoPolling(); return }
    if (!post.value.video_processing) { stopVideoPolling(); return }
    try {
      const fresh = await postsApi.get(company.value.id, postId.value)
      post.value = fresh
      // Tugagach to'liq qayta yuklash — translations va boshqa state'larni sinxronlash
      if (!fresh?.video_processing) {
        stopVideoPolling()
        await loadInitial()
      }
    } catch {/* keyingi tickda yana sinaymiz */}
  }, 3000)
}
function stopVideoPolling() {
  if (videoPollTimer) { clearInterval(videoPollTimer); videoPollTimer = null }
}
// Post.video_processing o'zgarsa polling boshlanadi
watch(() => post.value?.video_processing, (v) => {
  if (v) startVideoPolling()
  else stopVideoPolling()
})
onBeforeUnmount(stopVideoPolling)

async function saveAll() {
  // Aktiv inputni blur qilamiz — shu orqali DateTimePicker'ning
  // normalizeMinute/normalizeHour ishlaydi va form.publish_at to'liq yangilanadi.
  if (typeof document !== 'undefined' && document.activeElement && typeof (document.activeElement).blur === 'function') {
    (document.activeElement).blur()
    await nextTick()
  }
  formError.value = ''
  const anyTitle = LANGS.some(l => translations[l].title && translations[l].title.trim())
  if (!anyTitle) { formError.value = tt('pe.err.noTitle'); return }
  // Telegram platformasi tanlangan bo'lsa, kanal majburiy — bo'lmasa xato.
  if (form.platform === 'telegram' && !form.telegram_channel_ids.length) {
    formError.value = tt('pe.err.noChannel')
    return
  }
  if (!company.value) return

  saving.value = true
  try {
    // Status'ni publish_at asosida avtomatik aniqlaymiz:
    //   - publish_at belgilangan bo'lsa → 'scheduled' (Nashr kutilayotgan)
    //   - aks holda — joriy form.status, yo'q bo'lsa 'draft'
    //   - 'published' / 'failed' bo'lsa o'zgartirmaymiz (manual transitions)
    const protectedStatus = form.status === 'published' || form.status === 'failed'
    const derivedStatus = protectedStatus
      ? form.status
      : (form.publish_at ? 'scheduled' : (form.status || 'draft'))

    const payload = {
      platform: form.platform,
      category: form.category || null,
      category_id: form.category_id || null,
      tags: tagsArr.value,
      cover_image_url: form.cover_image_url || null,
      gallery: galleryArr.value,
      publish_at: form.publish_at ? new Date(form.publish_at).toISOString() : null,
      telegram_channel_id: form.telegram_channel_ids[0] || null,
      telegram_channel_ids: [...new Set([...form.telegram_channel_ids, ...selectedMetaChannelIds.value])],
      telegram_raw_long_text: form.telegram_raw_long_text || null,
      status: derivedStatus,
    }

    let saved
    if (isEdit.value) {
      saved = await postsApi.update(company.value.id, postId.value, payload)
    } else {
      const trArr = LANGS
        .filter(l => translations[l].title || translations[l].short_description || hasContent(translations[l].content_json))
        .map(l => ({
          lang: l,
          title: translations[l].title || null,
          short_description: translations[l].short_description || null,
          content_json: translations[l].content_json || null,
          is_complete: trComplete(translations[l]),
        }))
      saved = await postsApi.create(company.value.id, { ...payload, translations: trArr })
    }
    post.value = saved
    if (saved?.status) form.status = saved.status

    if (isEdit.value) {
      for (const l of LANGS) {
        const tr = translations[l]
        const hasAny = tr.title || tr.short_description || hasContent(tr.content_json)
        if (hasAny) {
          await postsApi.upsertTranslation(company.value.id, postId.value, l, {
            title: tr.title || null,
            short_description: tr.short_description || null,
            content_json: tr.content_json || null,
            is_complete: trComplete(tr),
          })
        }
      }
    }

    lastSavedAt.value = Date.now()
    // Saqlash paytida olib tashlangan rasmlar bucket'dan o'chiriladi → usage yangilanadi
    storageStore.refresh()
    // Yangi post yaratilgan bo'lsa, oylik post sanog'i ham yangilansin
    if (!isEdit.value) postsUsageStore.refresh()

    // Yangi post yaratilganda — URLni edit rejimiga o'zgartiramiz (sahifa qayta yuklanmaydi).
    // Mavjud post tahrirlanganda — joyimizda qolamiz.
    if (!isEdit.value && saved?.id) {
      router.replace(`/client/posts/${saved.id}/edit`)
    }
    showAiBanner('success', isEdit.value ? 'Post saqlandi' : 'Post yaratildi')
  } catch (e) {
    const msg = e?.response?.data?.message
    formError.value = Array.isArray(msg) ? msg.join('. ') : (msg || tt('pe.err.generic'))
    showAiBanner('error', formError.value)
  } finally {
    saving.value = false
  }
}

async function onDelete() {
  if (!isEdit.value || !post.value) return
  if (!confirm(tt('posts.confirmDelete', { name: firstNonEmptyTitle() }))) return
  deleting.value = true
  try {
    await postsApi.remove(company.value.id, postId.value)
    storageStore.refresh()
    postsUsageStore.refresh()
    router.push('/client/posts')
  } catch (e) {
    const msg = e?.response?.data?.message
    formError.value = Array.isArray(msg) ? msg.join('. ') : (msg || tt('pe.err.generic'))
    deleting.value = false
  }
}

/**
 * Publish tugmasi bosilganda chaqiriladi.
 * - Post draft bo'lsa, foydalanuvchidan tasdiqlash so'raymiz: faollashtirib
 *   Telegramga yuboraylikmi?
 * - Aks holda darhol publish qilamiz.
 */
// ── Telegram publish — til tanlash dialogi ──────────────────────
const showPublishLang = ref(false)
const publishLang = ref('uz')
// Faqat to'ldirilgan tillar e'long taklif qilinadi
const publishableLangs = computed(() => LANGS.filter(l => hasAnyContent(l)))

function onPublishClick() {
  if (!isEdit.value || !post.value) return
  if (!form.telegram_channel_ids.length && !selectedMetaChannelIds.value.length) {
    formError.value = 'Kanal tanlanmagan — o\'ng tomondagi panel orqali kanal(lar)ni tanlang'
    alert('⚠ Kanal tanlanmagan!\n\nO\'ng tomondagi panel orqali kamida bitta kanalni tanlang va qaytadan urinib ko\'ring.')
    return
  }
  // Default til: kompaniya sozlamasi → joriy tab → birinchi to'ldirilgan til
  const avail = publishableLangs.value
  const def = company.value?.default_publish_lang
  publishLang.value =
    (def && avail.includes(def)) ? def
    : (avail.includes(activeLang.value) ? activeLang.value : (avail[0] || 'uz'))
  showPublishLang.value = true
}

async function confirmPublishLang() {
  // Ikki marta bosilsa ham takror publish ketmasin (dublikat oldini olish)
  if (publishing.value || activating.value) return
  showPublishLang.value = false
  // Draft post (masalan "Habar qidirish"dan yaratilgan) — faqat tasdiq so'raymiz.
  // MUHIM: bu yerda activatePost() CHAQIRMAYMIZ. U postni 'scheduled' qilib
  // navbatga (delay=0 BullMQ job) qo'shar va publishNow bilan poyga hosil qilib,
  // Telegramga IKKI marta yuborilishiga sabab bo'lardi. publishNow o'zi saqlaydi
  // va to'g'ridan-to'g'ri 'published' qiladi — navbatga umuman tushmaydi.
  if (post.value?.status === 'draft') {
    if (!confirm(tt('pe.confirmActivatePublish'))) return
  }
  await publishNow(publishLang.value)
}

async function publishNow(lang) {
  if (!isEdit.value || !post.value) return
  if (!form.telegram_channel_ids.length && !selectedMetaChannelIds.value.length) {
    formError.value = tt('pe.tg.noConnected')
    return
  }
  // Avval saqlaymiz — eng so'nggi o'zgarishlar Telegramga borishi uchun
  formError.value = ''
  await saveAll()
  if (formError.value) return

  publishing.value = true
  try {
    const res = await postsApi.publish(company.value.id, postId.value, lang)
    post.value = res
    if (res?.status) form.status = res.status
    // Kompaniya default tilini lokal obyektda ham yangilab qo'yamiz
    if (lang && company.value) company.value.default_publish_lang = lang
    lastSavedAt.value = Date.now()
    const lbl = (AI_OUTPUT_LANGS.find(l => l.id === lang) || {}).label || lang
    // Ko'p kanal natijasi: nechtasiga ketdi / nechtasida xato
    const dels = Array.isArray(res?.deliveries) ? res.deliveries : []
    const sent = dels.filter(d => d.status === 'sent').length
    const failed = dels.filter(d => d.status === 'failed').length
    if (dels.length > 1) {
      if (failed) showAiBanner('success', `${sent} ta kanalga yuborildi, ${failed} tasida xato (${lbl})`)
      else showAiBanner('success', `${sent} ta kanalga e'lon qilindi (${lbl})`)
    } else {
      showAiBanner('success', `Post Telegram'ga e'lon qilindi (${lbl})`)
    }
  } catch (e) {
    const msg = e?.response?.data?.message
    formError.value = Array.isArray(msg) ? msg.join('. ') : (msg || tt('pe.err.generic'))
    showAiBanner('error', formError.value)
  } finally {
    publishing.value = false
  }
}

async function ensurePostSaved() {
  if (post.value && company.value) return true
  await saveAll()
  return !!(post.value && company.value && !formError.value)
}

async function activatePost() {
  if (!isEdit.value || !post.value || !company.value) return
  formError.value = ''
  activating.value = true
  try {
    const updated = await postsApi.update(company.value.id, postId.value, { status: 'scheduled' })
    post.value = updated
    form.status = updated.status || 'scheduled'
    lastSavedAt.value = Date.now()
  } catch (e) {
    const msg = e?.response?.data?.message
    formError.value = Array.isArray(msg) ? msg.join('. ') : (msg || tt('pe.err.generic'))
    showAiBanner('error', formError.value)
  } finally {
    activating.value = false
  }
}

async function onStatusChange() {
  if (!isEdit.value || !post.value || !company.value) return
  try {
    const updated = await postsApi.update(company.value.id, postId.value, { status: form.status })
    post.value = updated
    lastSavedAt.value = Date.now()
  } catch (e) {
    const msg = e?.response?.data?.message
    formError.value = Array.isArray(msg) ? msg.join('. ') : (msg || tt('pe.err.generic'))
    form.status = post.value?.status || 'scheduled'
  }
}

// AI rewrite/shorten modal'ni ochish (mode = 'rewrite' | 'shorten')
async function openAiRewrite(mode = 'rewrite') {
  aiMode.value = mode === 'shorten' ? 'shorten' : 'rewrite'
  aiError.value = ''
  if (!await ensurePostSaved()) {
    aiError.value = formError.value || 'Avval postni saqlash kerak'
    return
  }

  // localStorage'dan oxirgi tanlovni qayta o'qiymiz (ko'p tab/sessiyalar
  // o'rtasida ham ishonchli sinxronizatsiya uchun).
  try {
    const saved = JSON.parse(localStorage.getItem(AI_REWRITE_LS_KEY) || '{}')
    if (saved.provider && aiModelsByProvider[saved.provider]) {
      aiRewriteForm.provider = saved.provider
    }
    if (saved.model && (aiModelsByProvider[aiRewriteForm.provider] || [])
        .some(m => m.id === saved.model)) {
      aiRewriteForm.model = saved.model
    }
    if (saved.groupId) {
      aiRewriteForm.groupId = saved.groupId
    }
    if (saved.useRecommended !== undefined) {
      aiRewriteForm.useRecommended = !!saved.useRecommended
    }
    // Default — joriy til tabi (saqlangan tanlovdan ko'ra dolzarbroq).
    // Foydalanuvchi modaldan boshqa tilni tanlasa, natija o'sha til tabiga tushadi.
    aiRewriteForm.outputLanguage = AI_OUTPUT_LANGS.some(l => l.id === activeLang.value)
      ? activeLang.value
      : (saved.outputLanguage && AI_OUTPUT_LANGS.some(l => l.id === saved.outputLanguage)
          ? saved.outputLanguage
          : 'uz')
  } catch { /* ignore */ }

  // Promptlarni yuklab olamiz (har gal modal ochilganda — eng yangi)
  try {
    const r = await companiesApi.getAiPromptGroups(company.value.id)
    aiPromptGroups.value = r.groups || []
    // Saqlangan groupId hali ham mavjudmi tekshiramiz — yo'q bo'lsa birinchi
    // mavjud promptga tushiramiz (lekin localStorage'ni o'zgartirmaymiz —
    // foydalanuvchi qaytadan promptni yaratsa saqlangan tanlov ishlaydi).
    if (aiRewriteForm.groupId && !aiPromptGroups.value.some(g => g.id === aiRewriteForm.groupId)) {
      aiRewriteForm.groupId = aiPromptGroups.value[0]?.id || ''
    } else if (!aiRewriteForm.groupId && aiPromptGroups.value.length) {
      aiRewriteForm.groupId = aiPromptGroups.value[0].id
    }
  } catch (e) {
    aiError.value = e?.response?.data?.message ?? e.message
  }

  // Admin tavsiya etgan prompt mavjudligini tekshiramiz (article_shorten)
  try {
    const r = await aiApi.getRecommendedPrompt('article_shorten')
    aiRecommended.value = { exists: !!r?.exists, name: r?.name || null, loaded: true }
    if (!r?.exists) {
      console.warn(
        "[AI rewrite] Admin tavsiya etgan prompt topilmadi (usage='article_shorten'). " +
        "Backend javobi:", r,
        " — Admin → Promptlar bo'limida usage='article_shorten' bilan prompt yarating.",
      )
    } else {
      console.log("[AI rewrite] Tavsiya etilgan prompt topildi:", r.name)
    }
  } catch (e) {
    aiRecommended.value = { exists: false, name: null, loaded: true }
    console.error(
      "[AI rewrite] Tavsiya etilgan promptni tekshirish xatosi:",
      e?.response?.status, e?.response?.data || e?.message,
      " — Endpoint /ai-prompts/recommended/article_shorten ishlamayotgan bo'lishi mumkin. " +
      "Backend qayta ishga tushirilganmi?",
    )
  }
  // Tavsiya etilgan prompt yo'q bo'lsa, foydalanuvchining tanlovi qanday bo'lishidan
  // qat'iy nazar — flagni o'chiramiz, chunki bu rejim ishlamaydi.
  if (!aiRecommended.value.exists && aiRewriteForm.useRecommended) {
    aiRewriteForm.useRecommended = false
  }

  showAiRewrite.value = true
}

// Foydalanuvchining tanlovlarini saqlash (har o'zgarishda)
watch(
  () => ({
    groupId: aiRewriteForm.groupId, provider: aiRewriteForm.provider, model: aiRewriteForm.model,
    outputLanguage: aiRewriteForm.outputLanguage,
    useRecommended: aiRewriteForm.useRecommended,
  }),
  (v) => {
    try { localStorage.setItem(AI_REWRITE_LS_KEY, JSON.stringify(v)) } catch {}
  },
  { deep: true },
)

async function runAiRewrite() {
  if (!aiRewriteForm.useRecommended && !aiRewriteForm.groupId) {
    aiError.value = 'Promptni tanlang yoki tavsiya etilgandan foydalaning'
    return
  }
  aiError.value = ''
  aiShortening.value = true
  // Tanlangan chiqish tili — natija SHU til tabiga tushadi.
  const target = aiRewriteForm.outputLanguage // uz | uz_cyr | ru | en
  // Manba — hozir editorda ko'rinayotgan (joriy tab) matn.
  const sourceJson = activeTr.value.content_json && typeof activeTr.value.content_json === 'object'
    ? activeTr.value.content_json
    : { html: '' }
  // "Qaytarish" uchun TARGET tabning hozirgi holatini saqlab qo'yamiz.
  const prevTargetJson = JSON.parse(JSON.stringify(translations[target]?.content_json || { html: '' }))
  try {
    const payload = {
      lang: target,                       // backend natijani shu til tarjimasiga yozadi
      prompt_group_id: aiRewriteForm.useRecommended ? undefined : aiRewriteForm.groupId,
      provider: aiRewriteForm.provider,
      model: aiRewriteForm.model,
      use_admin_recommended: aiRewriteForm.useRecommended,
      source_content_json: sourceJson,
      output_language: target,
      // Sarlavha va teglar ham birga tarjima qilinishi uchun manbani yuboramiz
      source_title: activeTr.value.title || '',
      source_tags: Array.isArray(tagsArr.value) ? [...tagsArr.value] : [],
    }
    // Rejimga qarab — qisqartirish yoki qayta yozish (ikkalasi bir xil logikada).
    const res = aiMode.value === 'shorten'
      ? await postsApi.aiShorten(company.value.id, postId.value, payload)
      : await postsApi.aiRewrite(company.value.id, postId.value, payload)
    // Oxirgi tanlovni eslab qolamiz
    try {
      localStorage.setItem(AI_REWRITE_LS_KEY, JSON.stringify({
        groupId: aiRewriteForm.groupId,
        provider: aiRewriteForm.provider,
        model: aiRewriteForm.model,
        outputLanguage: target,
        useRecommended: aiRewriteForm.useRecommended,
      }))
    } catch { /* localStorage to'la bo'lsa — e'tiborsiz */ }
    if (res?.content_json) {
      if (translations[target]) {
        translations[target].content_json = res.content_json
        // Sarlavha ham tarjima qilingan bo'lsa — target tab sarlavhasini yangilaymiz
        if (res.title) translations[target].title = res.title
      }
      // Teglar post darajasida (umumiy) — tarjima qilingani bilan almashtiramiz
      if (Array.isArray(res.tags)) tagsArr.value = res.tags
      // Natija qaysi tilda bo'lsa — o'sha til tabiga o'tamiz.
      activeLang.value = target
      editorReloadKey.value++ // editor'ni majburiy re-mount qilamiz
      const lbl = (AI_OUTPUT_LANGS.find(l => l.id === target) || {}).label || target
      const verb = aiMode.value === 'shorten' ? 'qisqartirildi' : 'qayta yozildi'
      showAiBanner('success', `Sarlavha, matn va teglar "${lbl}" tilida ${verb}`, prevTargetJson)
    }
    aiUsageStore.refresh()
    quotaStore.refresh() // kredit balansi yangilandi
    showAiRewrite.value = false
  } catch (e) {
    const msg = aiErrorMessage(e)
    aiError.value = msg
    showAiBanner('error', msg)
  } finally {
    aiShortening.value = false
  }
}

// ── AI banner (sahifa tepasida natija notifikatsiyasi) ─────────
const aiBanner = ref({ show: false, tone: 'success', message: '', prev: null })
let aiBannerTimer = null
function showAiBanner(tone, message, prev = null) {
  aiBanner.value = { show: true, tone, message, prev }
  if (aiBannerTimer) clearTimeout(aiBannerTimer)
  if (tone !== 'success' || !prev) {
    aiBannerTimer = setTimeout(() => { aiBanner.value.show = false }, 6000)
  }
}
function dismissAiBanner() {
  aiBanner.value.show = false
  if (aiBannerTimer) { clearTimeout(aiBannerTimer); aiBannerTimer = null }
}
function undoAiRewrite() {
  if (!aiBanner.value.prev) return
  activeTr.value.content_json = aiBanner.value.prev
  editorReloadKey.value++
  dismissAiBanner()
}

function anyApplyBaseInGroup(g) {
  return (g.prompts || []).some((p) => !!p.apply_base)
}

async function aiGenerateTags() {
  aiError.value = ''
  if (!await ensurePostSaved()) {
    aiError.value = formError.value || 'Avval postni saqlash kerak'
    return
  }
  aiTagging.value = true
  try {
    const res = await postsApi.aiTags(company.value.id, postId.value, activeLang.value, true)
    if (Array.isArray(res?.tags)) {
      tagsArr.value = res.tags
    }
    aiUsageStore.refresh()
    quotaStore.refresh() // kredit balansi yangilandi
    showAiBanner('success', `Teglar generatsiya qilindi (${AI_CREDIT_COST.tags} kredit)`)
  } catch (e) {
    const msg = aiErrorMessage(e)
    aiError.value = msg
    // Teglar modalsiz ishlaydi — xatoni sahifa tepasidagi bannerda ko'rsatamiz
    showAiBanner('error', msg)
  } finally {
    aiTagging.value = false
  }
}
</script>

<style scoped>
.pe-root {
  display: flex;
  flex-direction: column;
  gap: 22px;
  padding: 0 0 40px;
  min-height: 100%;
}

/* ─────────── Action bar (editor pastida) ─────────── */
.pe-actionbar {
  margin-top: 16px;
  background: var(--panel);
  border: 1px solid var(--border-2);
  border-radius: 16px;
  box-shadow: 0 2px 6px rgba(15, 23, 42, 0.04), 0 12px 32px -20px rgba(15, 23, 42, 0.18);
  overflow: hidden;
  position: relative;
}
.pe-actionbar::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 56px;
  background:
    radial-gradient(ellipse 60% 100% at 0% 0%, rgba(99,102,241,0.07), transparent 60%),
    radial-gradient(ellipse 50% 100% at 100% 0%, rgba(16,185,129,0.06), transparent 60%);
  pointer-events: none;
}

/* Head */
.pe-ab-head {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 14px 18px 12px;
  border-bottom: 1px dashed var(--border-2);
}
.pe-ab-head-left {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  flex: 1;
  min-width: 0;
}
.pe-ab-head-icon {
  width: 28px; height: 28px;
  border-radius: 8px;
  background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
  color: #fff;
  display: inline-flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 4px 10px -4px rgba(79, 70, 229, 0.5);
}
.pe-ab-head-title {
  font-size: 13.5px;
  font-weight: 700;
  color: var(--text);
  line-height: 1.2;
  letter-spacing: -0.01em;
}
.pe-ab-head-sub {
  font-size: 11.5px;
  color: var(--muted);
  margin-top: 2px;
  line-height: 1.4;
}
.pe-ab-head-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}
.pe-ab-saved-pill {
  display: inline-flex; align-items: center; gap: 4px;
  height: 22px;
  padding: 0 8px;
  border-radius: 999px;
  background: color-mix(in oklab, #10b981 10%, transparent);
  border: 1px solid color-mix(in oklab, #10b981 30%, transparent);
  color: #047857;
  font-size: 10.5px;
  font-weight: 600;
}

/* Primary row */
.pe-ab-primary {
  position: relative;
  display: flex;
  gap: 10px;
  padding: 14px 18px 10px;
}
.pe-ab-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 44px;
  padding: 0 18px;
  border-radius: 11px;
  font-size: 13.5px;
  font-weight: 600;
  cursor: pointer;
  transition: transform .12s ease, box-shadow .15s ease, background .12s, border-color .12s, color .12s, filter .12s;
  white-space: nowrap;
  border: 1px solid transparent;
  background: transparent;
  color: var(--text);
  letter-spacing: -0.005em;
}
.pe-ab-btn:disabled { opacity: 0.55; cursor: not-allowed; }
.pe-ab-btn:not(:disabled):active { transform: translateY(1px); }

.pe-ab-btn-save {
  flex: 1;
  background: var(--panel);
  border-color: color-mix(in oklab, #10b981 45%, var(--border));
  color: #047857;
  box-shadow: inset 0 0 0 1px color-mix(in oklab, #10b981 12%, transparent);
}
.pe-ab-btn-save:hover:not(:disabled) {
  background: color-mix(in oklab, #10b981 8%, var(--panel));
  border-color: #10b981;
  box-shadow: 0 6px 16px -6px rgba(16, 185, 129, 0.4);
}

.pe-ab-btn-publish {
  flex: 1.4;
  position: relative;
  background: linear-gradient(135deg, #6366f1 0%, #4f46e5 60%, #4338ca 100%);
  border-color: #4338ca;
  color: #fff;
  padding-right: 14px;
  box-shadow: 0 8px 22px -8px rgba(79, 70, 229, 0.6), inset 0 1px 0 rgba(255,255,255,0.2);
  overflow: hidden;
}
.pe-ab-btn-publish::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 60%);
  pointer-events: none;
}
.pe-ab-btn-publish:hover:not(:disabled) {
  filter: brightness(1.08);
  transform: translateY(-1px);
  box-shadow: 0 12px 28px -8px rgba(79, 70, 229, 0.7), inset 0 1px 0 rgba(255,255,255,0.25);
}
.pe-ab-btn-arrow {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px; height: 24px;
  margin-left: 4px;
  border-radius: 6px;
  background: rgba(255,255,255,0.18);
  transition: transform .15s ease, background .12s;
}
.pe-ab-btn-publish:hover:not(:disabled) .pe-ab-btn-arrow {
  background: rgba(255,255,255,0.28);
  transform: translateX(2px);
}

/* Secondary row */
.pe-ab-secondary {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 18px 14px;
}
.pe-ab-mini {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 28px;
  padding: 0 10px;
  border-radius: 7px;
  font-size: 11.5px;
  font-weight: 500;
  cursor: pointer;
  background: transparent;
  border: 1px solid transparent;
  color: var(--muted);
  transition: background .12s, color .12s, border-color .12s;
}
.pe-ab-mini:disabled { opacity: 0.55; cursor: not-allowed; }
.pe-ab-mini-ghost:hover:not(:disabled) {
  background: var(--panel-2);
  color: var(--text);
}
.pe-ab-mini-danger {
  color: color-mix(in oklab, var(--danger) 80%, var(--muted));
}
.pe-ab-mini-danger:hover:not(:disabled) {
  background: color-mix(in oklab, var(--danger) 9%, transparent);
  color: var(--danger);
  border-color: color-mix(in oklab, var(--danger) 22%, transparent);
}
.pe-ab-mini-sep {
  width: 1px;
  height: 14px;
  background: var(--border-2);
  margin: 0 2px;
}

.pe-ab-spinner {
  width: 14px; height: 14px;
  border-radius: 999px;
  border: 2px solid color-mix(in oklab, currentColor 30%, transparent);
  border-top-color: currentColor;
  animation: pe-ab-spin 0.8s linear infinite;
  flex-shrink: 0;
}
.pe-ab-spinner.light { border-color: rgba(255,255,255,0.4); border-top-color: #fff; }
@keyframes pe-ab-spin { to { transform: rotate(360deg); } }

@media (max-width: 720px) {
  .pe-ab-head { flex-wrap: wrap; }
  .pe-ab-head-right { width: 100%; }
  .pe-ab-primary { flex-direction: column; }
  .pe-ab-btn-save, .pe-ab-btn-publish { flex: none; width: 100%; }
}

/* AI rewrite top banner */
.pe-aib {
  position: fixed;
  top: 18px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 3000;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 11px 14px 11px 14px;
  min-width: 340px;
  max-width: 560px;
  border-radius: 12px;
  box-shadow: 0 16px 40px -10px rgba(15,23,42,0.35), 0 2px 6px rgba(15,23,42,0.08);
  backdrop-filter: blur(12px);
  font-size: 13px;
  font-weight: 500;
}
.pe-aib.success {
  background: color-mix(in oklab, #10b981 12%, #ffffffee);
  border: 1px solid color-mix(in oklab, #10b981 38%, transparent);
  color: #065f46;
}
.pe-aib.error {
  background: color-mix(in oklab, #ef4444 12%, #ffffffee);
  border: 1px solid color-mix(in oklab, #ef4444 38%, transparent);
  color: #991b1b;
}
.pe-aib-icon {
  width: 24px; height: 24px;
  border-radius: 999px;
  display: inline-flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  background: currentColor;
  color: #ffffff;
}
.pe-aib.success .pe-aib-icon { background: #10b981; }
.pe-aib.error   .pe-aib-icon { background: #ef4444; }
.pe-aib-text { flex: 1; line-height: 1.4; }
.pe-aib-undo {
  display: inline-flex; align-items: center; gap: 5px;
  height: 26px;
  padding: 0 10px;
  background: rgba(255,255,255,0.65);
  border: 1px solid currentColor;
  border-radius: 6px;
  font-size: 11.5px;
  font-weight: 600;
  color: inherit;
  cursor: pointer;
  flex-shrink: 0;
}
.pe-aib-undo:hover { background: rgba(255,255,255,0.95); }
.pe-aib-close {
  width: 22px; height: 22px;
  border-radius: 6px;
  background: transparent;
  border: none;
  color: inherit;
  cursor: pointer;
  opacity: 0.6;
  display: inline-flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.pe-aib-close:hover { opacity: 1; background: rgba(0,0,0,0.06); }
.pe-aib-slide-enter-active, .pe-aib-slide-leave-active {
  transition: transform .28s cubic-bezier(.22,.68,0,1.2), opacity .2s ease;
}
.pe-aib-slide-enter-from, .pe-aib-slide-leave-to {
  opacity: 0;
  transform: translate(-50%, -20px);
}

/* AI rewrite modal — tavsiya etilgan promptdan foydalanish checkbox */
.pe-aire-recommend {
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
.pe-aire-recommend:hover { border-color: var(--accent); }
.pe-aire-recommend.on {
  border-color: color-mix(in oklab, var(--accent) 45%, transparent);
  background: color-mix(in oklab, var(--accent) 6%, transparent);
}
.pe-aire-recommend input[type="checkbox"] {
  margin: 2px 0 0;
  width: 16px;
  height: 16px;
  accent-color: var(--accent);
  cursor: pointer;
  flex-shrink: 0;
}

/* ────────── Hero ────────── */
.pe-hero {
  position: relative;
  overflow: hidden;
  padding: 24px 28px;
  background: linear-gradient(135deg,
    color-mix(in oklab, var(--accent) 18%, var(--bg-2)) 0%,
    var(--bg-2) 100%);
  border-bottom: 1px solid var(--border-2);
}
.pe-hero-dots {
  position: absolute; inset: 0;
  background-image: radial-gradient(color-mix(in oklab, var(--accent) 22%, transparent) 1px, transparent 1px);
  background-size: 22px 22px;
  mask-image: radial-gradient(ellipse 70% 80% at 80% 0%, black 30%, transparent 80%);
  -webkit-mask-image: radial-gradient(ellipse 70% 80% at 80% 0%, black 30%, transparent 80%);
}
.pe-hero-glow {
  position: absolute; top: -100px; right: -80px;
  width: 360px; height: 360px; border-radius: 999px;
  background: radial-gradient(circle, color-mix(in oklab, var(--accent) 22%, transparent), transparent 60%);
  filter: blur(20px);
}
.pe-hero-inner {
  position: relative;
  display: flex;
  align-items: center;
  gap: 18px;
}
.pe-back {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 32px;
  padding: 0 12px 0 8px;
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: 999px;
  font-size: 12px;
  font-weight: 500;
  color: var(--text-2);
  cursor: pointer;
  transition: all 0.15s;
  flex-shrink: 0;
}
.pe-back:hover { border-color: var(--accent); color: var(--text); }
.pe-hero-text { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 6px; }
.pe-hero-eyebrow {
  font-size: 10.5px;
  font-weight: 700;
  letter-spacing: 0.18em;
  color: var(--accent);
  text-transform: uppercase;
}
.pe-hero-title {
  font-size: 22px;
  font-weight: 600;
  letter-spacing: -0.025em;
  line-height: 1.2;
  color: var(--text);
  margin: 0;
  max-width: 700px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.pe-hero-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 2px;
  font-size: 11.5px;
}
.pe-hero-divider { width: 3px; height: 3px; border-radius: 999px; background: var(--border); }
.pe-hero-saved { color: var(--success); font-weight: 500; }
.pe-hero-right { display: flex; align-items: center; gap: 8px; }

/* status pill (shared with cards) */
.cp-card-status {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 22px;
  padding: 0 9px;
  border-radius: 999px;
  background: var(--panel);
  border: 1px solid var(--border-2);
  color: var(--text);
  font-size: 10.5px;
  font-weight: 600;
  letter-spacing: 0.02em;
}
.cp-card-status-dot { width: 6px; height: 6px; border-radius: 999px; background: var(--muted); }
.cp-card-status.draft     .cp-card-status-dot { background: var(--muted); }
.cp-card-status.scheduled .cp-card-status-dot { background: #F59E0B; box-shadow: 0 0 0 3px rgba(245,158,11,0.22); }
.cp-card-status.published .cp-card-status-dot { background: var(--success); box-shadow: 0 0 0 3px color-mix(in oklab, var(--success) 22%, transparent); }
.cp-card-status.failed    .cp-card-status-dot { background: var(--danger); }

/* ────────── Loading ────────── */
.pe-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 80px 0;
  color: var(--muted);
  font-size: 13px;
}
.pe-spinner {
  width: 22px; height: 22px; border-radius: 999px;
  border: 2.5px solid var(--border); border-top-color: var(--accent);
  animation: pe-spin 0.8s linear infinite;
}
@keyframes pe-spin { to { transform: rotate(360deg); } }

/* ────────── Two-column body ────────── */
.pe-body {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 360px;
  gap: 24px;
  padding: 0 28px;
  align-items: start;
}

/* ────────── Writer (left) ────────── */
.pe-writer {
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-width: 0;
}

/* ────────── Magazine-style hero cover ────────── */
.pe-hero-cover {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  max-height: 420px;
  min-height: 280px;
  border-radius: 18px;
  overflow: hidden;
  background-color: var(--panel-2);
  border: 1px solid var(--border);
  isolation: isolate;
  box-shadow: 0 20px 50px -28px rgba(15, 23, 42, 0.32),
              0 8px 18px -12px rgba(15, 23, 42, 0.14);
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}
.pe-hc-bg {
  position: absolute; inset: 0; z-index: 0;
  background-size: cover;
  background-position: center;
  filter: blur(24px) saturate(1.1);
  transform: scale(1.15);
  opacity: 0.55;
}
.pe-hc-img {
  position: absolute; inset: 0; z-index: 1;
  width: 100%; height: 100%;
  object-fit: contain;
  object-position: center;
  display: block;
}
.pe-hero-cover:hover {
  box-shadow: 0 26px 60px -28px rgba(15, 23, 42, 0.4),
              0 10px 22px -12px rgba(15, 23, 42, 0.18);
}
.pe-hero-cover.empty {
  background-image:
    radial-gradient(ellipse 80% 100% at 0% 0%, color-mix(in oklab, var(--accent) 22%, transparent), transparent 60%),
    radial-gradient(ellipse 90% 110% at 100% 100%, color-mix(in oklab, #6E56CF 22%, transparent), transparent 60%),
    linear-gradient(135deg,
      color-mix(in oklab, var(--accent) 8%, var(--panel-2)),
      color-mix(in oklab, #6E56CF 6%, var(--panel-2)));
}
.pe-hero-cover.filled { border-color: transparent; }
.pe-hc-tint {
  position: absolute; inset: 0; z-index: 2;
  background: linear-gradient(180deg, rgba(0,0,0,0.25) 0%, transparent 35%, transparent 60%, rgba(0,0,0,0.45) 100%);
  pointer-events: none;
}
.pe-hc-orb {
  position: absolute;
  border-radius: 999px;
  filter: blur(40px);
  z-index: 0;
  pointer-events: none;
  animation: peOrb 12s ease-in-out infinite;
}
.pe-hc-orb-1 {
  top: -60px; left: -40px;
  width: 220px; height: 220px;
  background: radial-gradient(circle, color-mix(in oklab, var(--accent) 70%, transparent), transparent 70%);
}
.pe-hc-orb-2 {
  bottom: -80px; right: -60px;
  width: 280px; height: 280px;
  background: radial-gradient(circle, color-mix(in oklab, #6E56CF 65%, transparent), transparent 70%);
  animation-delay: -6s;
}
@keyframes peOrb {
  0%, 100% { transform: translate(0,0) scale(1); }
  50%      { transform: translate(20px,-12px) scale(1.08); }
}
.pe-hc-grid {
  position: absolute; inset: 0; z-index: 0;
  background-image: radial-gradient(color-mix(in oklab, var(--text) 18%, transparent) 1px, transparent 1px);
  background-size: 22px 22px;
  mask-image: radial-gradient(ellipse 60% 60% at 50% 50%, black 40%, transparent 85%);
  -webkit-mask-image: radial-gradient(ellipse 60% 60% at 50% 50%, black 40%, transparent 85%);
  opacity: 0.5;
  pointer-events: none;
}
.pe-hc-toolbar {
  position: absolute;
  top: 14px; right: 14px;
  z-index: 3;
  display: flex;
  gap: 6px;
}
.pe-hc-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 30px;
  padding: 0 11px;
  background: rgba(255,255,255,0.16);
  border: 1px solid rgba(255,255,255,0.28);
  color: #fff;
  border-radius: 999px;
  font-size: 11.5px;
  font-weight: 600;
  cursor: pointer;
  backdrop-filter: blur(14px) saturate(140%);
  -webkit-backdrop-filter: blur(14px) saturate(140%);
  white-space: nowrap;
  transition: background 0.15s, transform 0.15s, border-color 0.15s;
  box-shadow: 0 4px 12px -4px rgba(0,0,0,0.25);
}
.pe-hero-cover.empty .pe-hc-btn {
  background: color-mix(in oklab, var(--panel) 70%, transparent);
  border-color: var(--border);
  color: var(--text-2);
}
.pe-hc-btn:hover:not(:disabled) {
  background: rgba(255,255,255,0.28);
  border-color: rgba(255,255,255,0.4);
  transform: translateY(-1px);
}
.pe-hero-cover.empty .pe-hc-btn:hover:not(:disabled) {
  background: var(--panel);
  border-color: var(--accent);
  color: var(--text);
}
.pe-hc-btn:disabled { opacity: 0.65; cursor: wait; }
.pe-hc-btn-icon { padding: 0; width: 30px; justify-content: center; }
.pe-hc-url {
  height: 30px;
  width: 180px;
  padding: 0 11px;
  background: rgba(255,255,255,0.16);
  border: 1px solid rgba(255,255,255,0.28);
  color: #fff;
  border-radius: 999px;
  font-size: 11.5px;
  font-weight: 500;
  outline: none;
  backdrop-filter: blur(14px) saturate(140%);
  -webkit-backdrop-filter: blur(14px) saturate(140%);
  font-family: inherit;
}
.pe-hc-url::placeholder { color: rgba(255,255,255,0.7); }
.pe-hc-url:focus { border-color: rgba(255,255,255,0.55); background: rgba(255,255,255,0.24); }
.pe-hero-cover.empty .pe-hc-url {
  background: color-mix(in oklab, var(--panel) 70%, transparent);
  border-color: var(--border);
  color: var(--text);
}
.pe-hero-cover.empty .pe-hc-url::placeholder { color: var(--muted); }
.pe-hero-cover.empty .pe-hc-url:focus { border-color: var(--accent); }

.pe-hc-empty {
  position: absolute;
  inset: 0;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  text-align: center;
  padding: 16px;
  pointer-events: none;
}
.pe-hc-empty-badge {
  width: 52px; height: 52px;
  border-radius: 16px;
  background: linear-gradient(135deg, var(--accent), #6E56CF);
  color: white;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 12px 28px -8px color-mix(in oklab, var(--accent) 60%, transparent),
              0 4px 10px -4px color-mix(in oklab, #6E56CF 50%, transparent);
  margin-bottom: 4px;
  animation: peBadgeFloat 4s ease-in-out infinite;
}
@keyframes peBadgeFloat {
  0%, 100% { transform: translateY(0); }
  50%      { transform: translateY(-4px); }
}
.pe-hc-empty-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--text);
  letter-spacing: -0.01em;
}
.pe-hc-empty-sub {
  font-size: 12px;
  color: var(--muted);
  max-width: 280px;
  line-height: 1.45;
}

.pe-hc-langs {
  position: absolute;
  left: 14px;
  bottom: 14px;
  z-index: 3;
}
.pe-hc-langs-inner {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px;
  background: rgba(255,255,255,0.18);
  border: 1px solid rgba(255,255,255,0.3);
  border-radius: 999px;
  backdrop-filter: blur(14px) saturate(140%);
  -webkit-backdrop-filter: blur(14px) saturate(140%);
  box-shadow: 0 6px 18px -6px rgba(0,0,0,0.28);
}
.pe-hero-cover.empty .pe-hc-langs-inner {
  background: color-mix(in oklab, var(--panel) 75%, transparent);
  border-color: var(--border);
}
.pe-hcl {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 28px;
  padding: 0 12px;
  background: transparent;
  border: none;
  border-radius: 999px;
  cursor: pointer;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.05em;
  color: rgba(255,255,255,0.85);
  transition: all 0.18s;
  font-family: inherit;
}
.pe-hero-cover.empty .pe-hcl { color: var(--text-2); }
.pe-hcl:hover { background: rgba(255,255,255,0.14); }
.pe-hero-cover.empty .pe-hcl:hover { background: var(--panel-2); color: var(--text); }
.pe-hcl.active {
  background: #fff;
  color: var(--accent);
  box-shadow: 0 3px 8px -2px rgba(0,0,0,0.22);
}
.pe-hcl-code { font-variant-numeric: tabular-nums; }
.pe-hcl-dot {
  width: 6px; height: 6px;
  border-radius: 999px;
  background: rgba(255,255,255,0.5);
}
.pe-hero-cover.empty .pe-hcl-dot { background: var(--border); }
.pe-hcl.active .pe-hcl-dot { background: var(--border); }
.pe-hcl.draft .pe-hcl-dot {
  background: #F59E0B;
  box-shadow: 0 0 0 3px color-mix(in oklab, #F59E0B 30%, transparent);
}
.pe-hcl.complete .pe-hcl-dot {
  background: #22C55E;
  box-shadow: 0 0 0 3px color-mix(in oklab, #22C55E 30%, transparent);
}

/* ────────── Action ribbon ────────── */
.pe-ribbon {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px;
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: 999px;
  flex-wrap: wrap;
}
.pe-ribbon-group {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
}
.pe-ribbon-spacer { flex: 1; min-width: 8px; }
.pe-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 30px;
  padding: 0 12px 0 4px;
  background: var(--panel-2);
  border: 1px solid var(--border-2);
  border-radius: 999px;
  font-size: 11.5px;
  font-weight: 600;
  color: var(--text);
  cursor: pointer;
  transition: all 0.15s;
  font-family: inherit;
  white-space: nowrap;
}
.pe-chip:hover:not(:disabled) {
  background: var(--panel);
  border-color: var(--accent);
  transform: translateY(-1px);
}
.pe-chip:disabled { opacity: 0.55; cursor: not-allowed; }
.pe-chip-ic {
  width: 22px; height: 22px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: var(--panel);
  color: var(--text-2);
}
.pe-chip-ic-ai {
  background: linear-gradient(135deg, #6E56CF, #2F6FED);
  color: white;
  box-shadow: 0 2px 6px -2px color-mix(in oklab, #6E56CF 60%, transparent);
}
.pe-chip-ic-tg {
  background: #2AABEE;
  color: white;
}
.pe-chip-ai:hover:not(:disabled) {
  border-color: #6E56CF;
  background: color-mix(in oklab, #6E56CF 6%, var(--panel));
}
.pe-chip-cost {
  font-size: 10px;
  font-weight: 700;
  line-height: 1;
  padding: 2px 6px;
  border-radius: 999px;
  background: color-mix(in oklab, #6E56CF 12%, transparent);
  color: #6E56CF;
  flex-shrink: 0;
}
.pe-chip-platform { padding-right: 8px; }
.pe-chip-platform.pe-chip-warn {
  border-color: color-mix(in oklab, #F59E0B 50%, var(--border-2));
  background: color-mix(in oklab, #F59E0B 7%, var(--panel-2));
}
.pe-chip-select {
  background: transparent;
  border: none;
  outline: none;
  font-size: 11.5px;
  font-weight: 600;
  color: var(--text);
  font-family: inherit;
  cursor: pointer;
  max-width: 160px;
  appearance: none;
  -webkit-appearance: none;
}
.pe-chip-complete { padding-left: 10px; }
.pe-chip-complete.pe-chip-on {
  background: color-mix(in oklab, #22C55E 12%, var(--panel-2));
  border-color: color-mix(in oklab, #22C55E 35%, var(--border-2));
  color: #16A34A;
}
.pe-chip-danger {
  color: var(--danger);
  border-color: color-mix(in oklab, var(--danger) 28%, var(--border-2));
  background: color-mix(in oklab, var(--danger) 5%, var(--panel));
}
.pe-chip-danger:hover:not(:disabled) {
  color: var(--danger);
  border-color: color-mix(in oklab, var(--danger) 45%, var(--border-2));
  background: var(--danger-bg);
}
.pe-chip-ic-danger {
  background: linear-gradient(135deg, #ef4444, #dc2626);
  color: white;
  box-shadow: 0 2px 6px -2px color-mix(in oklab, #ef4444 60%, transparent);
}

/* Avtomatik tayyorlik indikatori — faqat o'qish uchun, bosib bo'lmaydi */
.pe-chip-auto {
  cursor: default;
  padding-left: 10px;
}
.pe-chip-auto:hover:not(:disabled) {
  transform: none;
  background: var(--panel-2);
  border-color: var(--border-2);
}
.pe-chip-auto.pe-chip-on,
.pe-chip-auto.pe-chip-on:hover:not(:disabled) {
  background: color-mix(in oklab, #22C55E 12%, var(--panel-2));
  border-color: color-mix(in oklab, #22C55E 35%, var(--border-2));
  color: #16A34A;
  transform: none;
}
.pe-ribbon-hint {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: color-mix(in oklab, var(--accent) 6%, var(--panel));
  border: 1px solid color-mix(in oklab, var(--accent) 22%, var(--border));
  border-radius: 10px;
  font-size: 11px;
  color: var(--text-2);
  align-self: flex-start;
}
.pe-ribbon-hint-err {
  background: var(--danger-bg);
  border-color: color-mix(in oklab, var(--danger) 28%, transparent);
  color: var(--danger);
}

/* ────────── Unified action toolbar (bitta row) ────────── */
.pe-toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: 14px;
  box-shadow: 0 2px 6px rgba(15, 23, 42, 0.04), 0 12px 32px -22px rgba(15, 23, 42, 0.18);
  flex-wrap: wrap;
}
/* AI amallar paneli (sarlavha tepasida) — ajralib turishi uchun accent border + nozik fon */
.pe-toolbar-ai {
  justify-content: flex-end;
  border: 1px solid rgba(99, 102, 241, 0.3);
  background: linear-gradient(180deg, rgba(99, 102, 241, 0.07), rgba(99, 102, 241, 0.02));
  box-shadow:
    0 1px 2px rgba(99, 102, 241, 0.06),
    0 10px 26px -18px rgba(99, 102, 241, 0.5);
}
.pe-toolbar-ai .pe-toolbar-left { justify-content: flex-end; }
/* pe-paper ichidagi form label'lar (Sarlavha / Asosiy matn) */
.pe-paper-label {
  display: block;
  margin-bottom: 6px;
}
.pe-paper-label-content { margin-top: 18px; }
.pe-toolbar-left {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}
.pe-toolbar-spacer { flex: 1; min-width: 12px; }
.pe-toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.pe-tb-saved { margin-right: 2px; }
.pe-tb-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  height: 38px;
  padding: 0 16px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: transform .12s ease, box-shadow .15s ease, background .12s, border-color .12s, color .12s, filter .12s;
  white-space: nowrap;
  border: 1px solid transparent;
  background: transparent;
  color: var(--text);
  font-family: inherit;
  letter-spacing: -0.005em;
}
.pe-tb-btn:disabled { opacity: 0.55; cursor: not-allowed; }
.pe-tb-btn:not(:disabled):active { transform: translateY(1px); }

.pe-tb-btn-save {
  background: var(--panel);
  border-color: color-mix(in oklab, #10b981 45%, var(--border));
  color: #047857;
  box-shadow: inset 0 0 0 1px color-mix(in oklab, #10b981 12%, transparent);
}
.pe-tb-btn-save:hover:not(:disabled) {
  background: color-mix(in oklab, #10b981 8%, var(--panel));
  border-color: #10b981;
  box-shadow: 0 6px 16px -6px rgba(16, 185, 129, 0.4);
}

.pe-tb-btn-publish {
  background: linear-gradient(135deg, #6366f1 0%, #4f46e5 60%, #4338ca 100%);
  border-color: #4338ca;
  color: #fff;
  box-shadow: 0 8px 22px -10px rgba(79, 70, 229, 0.6), inset 0 1px 0 rgba(255,255,255,0.2);
}
.pe-tb-btn-publish:hover:not(:disabled) {
  filter: brightness(1.08);
  transform: translateY(-1px);
  box-shadow: 0 12px 28px -10px rgba(79, 70, 229, 0.7), inset 0 1px 0 rgba(255,255,255,0.25);
}

.pe-tb-btn-del {
  color: color-mix(in oklab, var(--danger) 80%, var(--muted));
  border-color: var(--border-2);
}
.pe-tb-btn-del:hover:not(:disabled) {
  background: color-mix(in oklab, var(--danger) 9%, transparent);
  color: var(--danger);
  border-color: color-mix(in oklab, var(--danger) 30%, transparent);
}

@media (max-width: 720px) {
  .pe-toolbar-left, .pe-toolbar-right { width: 100%; }
  .pe-toolbar-spacer { display: none; }
  .pe-tb-btn-save, .pe-tb-btn-publish { flex: 1; }
}

/* ────────── Composition paper ────────── */
.pe-paper {
  position: relative;
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 28px 32px 24px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  box-shadow: 0 12px 32px -20px rgba(15, 23, 42, 0.22),
              0 4px 10px -6px rgba(15, 23, 42, 0.08);
}
.pe-paper::before {
  content: "";
  position: absolute;
  left: 0; top: 26px;
  width: 3px; height: 40px;
  border-radius: 0 3px 3px 0;
  background: linear-gradient(180deg, var(--accent), #6E56CF);
}
.pe-paper-title {
  width: 100%;
  background: transparent;
  border: none;
  outline: none;
  font-size: 30px;
  font-weight: 800;
  letter-spacing: -0.028em;
  color: var(--text);
  font-family: inherit;
  line-height: 1.18;
  padding: 0;
}
.pe-paper-title::placeholder {
  color: color-mix(in oklab, var(--text) 25%, transparent);
  font-weight: 700;
}
.pe-paper-short-wrap { position: relative; margin-top: 2px; }
.pe-paper-short {
  width: 100%;
  background: transparent;
  border: none;
  outline: none;
  font-size: 15px;
  font-weight: 400;
  color: var(--text-2);
  font-family: inherit;
  line-height: 1.55;
  font-style: italic;
  resize: vertical;
  padding: 0 56px 0 0;
  min-height: 44px;
}
.pe-paper-short::placeholder {
  color: var(--muted);
  font-style: italic;
}
.pe-paper-short-counter {
  position: absolute;
  bottom: 4px;
  right: 0;
  font-size: 10px;
  color: var(--muted);
  font-variant-numeric: tabular-nums;
  padding: 2px 7px;
  background: var(--panel-2);
  border-radius: 999px;
  opacity: 0;
  transition: opacity 0.15s;
}
.pe-paper-short-wrap:focus-within .pe-paper-short-counter {
  opacity: 1;
}
.pe-paper-divider {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 14px 0 6px;
  color: var(--muted);
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.14em;
}
.pe-paper-divider span {
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--border), transparent);
}
.pe-paper-divider em {
  font-style: normal;
  padding: 0 4px;
}
.pe-paper-editor { margin-top: 4px; }

.pe-gallery-upload-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 36px;
  padding: 0 12px;
  background: var(--accent);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 12.5px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
  width: 100%;
}
.pe-gallery-upload-btn:hover:not(:disabled) {
  background: color-mix(in oklab, var(--accent) 85%, black);
}
.pe-gallery-upload-btn:disabled { opacity: 0.7; cursor: wait; }

.pe-gallery-library-btn {
  background: var(--panel);
  color: var(--text);
  border: 1px solid var(--border);
  margin-bottom: 6px;
}
.pe-gallery-library-btn:hover {
  background: var(--panel-2);
  border-color: var(--accent);
}

/* Language tabs */
.pe-lang-tabs {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px;
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: 12px;
}
.pe-lang-tab {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 32px;
  padding: 0 12px 0 8px;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 8px;
  cursor: pointer;
  color: var(--muted);
  font-size: 12.5px;
  transition: all 0.15s;
}
.pe-lang-tab:hover { color: var(--text-2); }
.pe-lang-tab.active {
  background: var(--panel-2);
  color: var(--text);
  font-weight: 600;
  box-shadow: var(--shadow-sm);
}
.pe-lang-tab-flag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px; height: 20px;
  background: var(--panel-2);
  border-radius: 4px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.05em;
  color: var(--muted);
}
.pe-lang-tab.active .pe-lang-tab-flag {
  background: var(--accent);
  color: white;
}
.pe-lang-tab-dot {
  width: 7px; height: 7px;
  border-radius: 999px;
  background: var(--border);
}
.pe-lang-tab.draft .pe-lang-tab-dot {
  background: var(--accent);
  box-shadow: 0 0 0 3px color-mix(in oklab, var(--accent) 22%, transparent);
}
.pe-lang-tab.complete .pe-lang-tab-dot {
  background: var(--success);
  box-shadow: 0 0 0 3px color-mix(in oklab, var(--success) 22%, transparent);
}

.pe-lang-spacer { flex: 1; }
.pe-lang-remove,
.pe-lang-complete {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  height: 28px;
  padding: 0 10px;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 7px;
  font-size: 11.5px;
  font-weight: 500;
  color: var(--muted);
  cursor: pointer;
  transition: all 0.15s;
}
.pe-lang-remove:hover { background: var(--danger-bg); color: var(--danger); }
.pe-lang-complete:hover { background: var(--panel-2); color: var(--text-2); }
.pe-lang-complete.on {
  background: color-mix(in oklab, var(--success) 14%, transparent);
  color: var(--success);
}

/* Card-style sarlavha va qisqa tavsif uchun input wrapperlari */
.pe-card-input {
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 12px 16px 14px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.pe-card-input:focus-within {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px color-mix(in oklab, var(--accent) 18%, transparent);
}
.pe-field-label-inline {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 10.5px;
  color: var(--muted);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.pe-card-input-counter {
  margin-left: auto;
  font-size: 10.5px;
  font-weight: 500;
  text-transform: none;
  letter-spacing: normal;
  color: var(--muted);
}

/* Title — katta Medium-style, lekin endi card ichida */
.pe-title-input {
  width: 100%;
  background: transparent;
  border: none;
  outline: none;
  font-size: 26px;
  font-weight: 700;
  letter-spacing: -0.022em;
  color: var(--text);
  font-family: inherit;
  line-height: 1.25;
}
.pe-title-input::placeholder {
  color: color-mix(in oklab, var(--text) 28%, transparent);
}

/* Short description */
.pe-short-input {
  width: 100%;
  background: transparent;
  border: none;
  outline: none;
  font-size: 14.5px;
  font-weight: 400;
  color: var(--text);
  font-family: inherit;
  line-height: 1.55;
  resize: vertical;
}
.pe-short-input::placeholder {
  color: var(--muted);
}

.pe-editor-wrap {
  margin-top: 6px;
}

/* ────────── Sidebar (right) ────────── */
.pe-sidebar {
  position: sticky;
  top: 16px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  align-self: start;
}

.pe-card {
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.pe-card-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 2px;
}
.pe-card-head h3 {
  font-size: 12.5px;
  font-weight: 600;
  letter-spacing: -0.005em;
  margin: 0;
  color: var(--text);
}
.pe-card-head-icon {
  width: 24px; height: 24px;
  border-radius: 7px;
  background: var(--accent-bg);
  color: var(--accent);
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.pe-field { display: flex; flex-direction: column; gap: 5px; }

/* Kategoriya selecti + "+" tugmasi */
.pe-cat-row {
  display: flex;
  gap: 6px;
  align-items: stretch;
}
.pe-cat-select {
  flex: 1;
  cursor: pointer;
}
.pe-cat-add {
  width: 36px;
  height: 36px;
  background: var(--accent);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;
  flex-shrink: 0;
}
.pe-cat-add:hover { background: color-mix(in oklab, var(--accent) 85%, black); }
.pe-label {
  font-size: 10.5px;
  color: var(--muted);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.pe-hint { font-size: 10.5px; color: var(--muted); line-height: 1.5; }
.pe-hint-err { color: var(--danger); }

.pe-input {
  width: 100%;
  height: 36px;
  padding: 0 11px;
  background: var(--panel-2);
  border: 1px solid var(--border-2);
  border-radius: 8px;
  font-size: 13px;
  color: var(--text);
  outline: none;
  font-family: inherit;
  transition: border-color 0.15s, box-shadow 0.15s, background 0.15s;
}
.pe-input:focus {
  background: var(--panel);
  border-color: var(--accent);
  box-shadow: 0 0 0 3px color-mix(in oklab, var(--accent) 18%, transparent);
}
.pe-textarea {
  height: auto;
  min-height: 80px;
  padding: 10px 11px;
  resize: vertical;
  line-height: 1.5;
}

/* Platform cards in sidebar */
.pe-platform-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
}
.pe-platform-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 8px 6px;
  background: var(--panel-2);
  border: 1.5px solid transparent;
  border-radius: 9px;
  cursor: pointer;
  transition: all 0.15s;
}
.pe-platform-card:hover { background: var(--panel); border-color: var(--border); }
.pe-platform-card.active {
  background: color-mix(in oklab, var(--accent) 10%, var(--panel));
  border-color: var(--accent);
}
.pe-platform-card-name {
  font-size: 10.5px;
  font-weight: 600;
  color: var(--text);
}

/* Tags input */
.pe-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  padding: 6px;
  background: var(--panel-2);
  border: 1px solid var(--border-2);
  border-radius: 8px;
  min-height: 36px;
  align-items: center;
}
.pe-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 22px;
  padding: 0 4px 0 8px;
  background: var(--accent-bg);
  color: var(--accent);
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
}
.pe-tag-x {
  width: 16px; height: 16px;
  border-radius: 999px;
  background: color-mix(in oklab, var(--accent) 22%, transparent);
  border: none;
  color: var(--accent);
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.pe-tag-input {
  flex: 1;
  min-width: 80px;
  border: none;
  outline: none;
  background: transparent;
  font-size: 12.5px;
  color: var(--text);
  height: 22px;
}

/* Autocomplete dropdown */
.pe-tag-suggest {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  z-index: 40;
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: 10px;
  box-shadow: 0 18px 50px -18px rgba(15, 23, 42, 0.25), 0 6px 16px -8px rgba(15, 23, 42, 0.12);
  padding: 4px;
  max-height: 220px;
  overflow-y: auto;
  animation: peTagPop 0.12s ease;
}
@keyframes peTagPop {
  from { opacity: 0; transform: translateY(-4px); }
  to   { opacity: 1; transform: translateY(0); }
}
.pe-tag-suggest-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 7px 10px;
  background: transparent;
  border: none;
  border-radius: 7px;
  cursor: pointer;
  font-size: 12.5px;
  color: var(--text);
  text-align: left;
  font-family: inherit;
}
.pe-tag-suggest-item:hover,
.pe-tag-suggest-item.active {
  background: var(--panel-2);
}
.pe-tag-suggest-item.active {
  background: color-mix(in oklab, var(--accent) 12%, var(--panel));
}
.pe-tag-suggest-name {
  flex: 1;
  font-weight: 500;
}
.pe-tag-suggest-count {
  font-size: 10.5px;
  color: var(--muted);
  font-variant-numeric: tabular-nums;
  padding: 1px 7px;
  border-radius: 999px;
  background: var(--panel-2);
}
.pe-tag-suggest-item.active .pe-tag-suggest-count {
  background: var(--accent);
  color: white;
}

/* Gallery */
.pe-gallery-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
}
.pe-gallery-item {
  position: relative;
  aspect-ratio: 1;
  border-radius: 7px;
  background-size: cover;
  background-position: center;
  background-color: var(--panel-2);
  border: 1px solid var(--border-2);
}
.pe-gallery-x {
  position: absolute;
  top: 4px; right: 4px;
  width: 18px; height: 18px;
  border-radius: 999px;
  background: rgba(0,0,0,0.55);
  color: white;
  border: none;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(4px);
}
.pe-gallery-add { display: flex; flex-direction: column; gap: 4px; }

/* Telegram card */
.pe-card-platform {
  border-color: color-mix(in oklab, #2AABEE 30%, var(--border));
  background: linear-gradient(180deg,
    color-mix(in oklab, #2AABEE 4%, var(--panel)) 0%,
    var(--panel) 100%);
}

/* AI assistant card */
.pe-card-ai {
  border-color: color-mix(in oklab, #6E56CF 35%, var(--border));
  background: linear-gradient(180deg,
    color-mix(in oklab, #6E56CF 5%, var(--panel)) 0%,
    var(--panel) 100%);
}
.pe-ai-actions {
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.pe-ai-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 9px;
  background: var(--panel);
  border: 1px solid var(--border-2);
  border-radius: 8px;
  cursor: pointer;
  text-align: left;
  font-family: inherit;
  transition: all 0.15s;
}
.pe-ai-btn:hover:not(:disabled) {
  border-color: #6E56CF;
  background: color-mix(in oklab, #6E56CF 6%, var(--panel));
}
.pe-ai-btn:disabled { opacity: 0.6; cursor: not-allowed; }
.pe-ai-btn-icon {
  width: 26px; height: 26px;
  border-radius: 7px;
  background: linear-gradient(135deg, #6E56CF, #2F6FED);
  color: white;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.pe-ai-btn-text {
  display: flex;
  flex-direction: column;
  gap: 0;
  min-width: 0;
  line-height: 1.25;
}
.pe-ai-btn-title {
  font-size: 11.5px;
  font-weight: 600;
  color: var(--text);
}
.pe-ai-btn-sub {
  font-size: 10.5px;
  color: var(--muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.pe-adapted {
  background: var(--panel-2);
  border: 1px solid var(--border-2);
  border-radius: 9px;
  padding: 10px 12px;
}
.pe-adapted-label {
  font-size: 10px;
  color: var(--muted);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-bottom: 4px;
}
.pe-adapted-body {
  font-size: 12.5px;
  line-height: 1.55;
  white-space: pre-wrap;
  color: var(--text);
  max-height: 200px;
  overflow-y: auto;
}

/* Error toast */
.pe-error {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 28px;
  padding: 10px 13px;
  background: var(--danger-bg);
  border: 1px solid color-mix(in oklab, var(--danger) 25%, transparent);
  border-radius: 9px;
  font-size: 12.5px;
  color: var(--danger);
  animation: errSlide 0.3s ease both;
}
@keyframes errSlide {
  from { opacity: 0; transform: translateY(-8px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* ───── Telegram preview (inline + switch) ───── */
.pe-preview-wrap {
  display: flex;
  flex-direction: column;
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: 12px;
  overflow: hidden;
  transition: background 0.25s, border-color 0.25s, box-shadow 0.25s;
}
.pe-preview-wrap.on {
  background: linear-gradient(180deg,
    color-mix(in oklab, #2AABEE 7%, var(--panel)) 0%,
    var(--panel) 100%);
  border-color: color-mix(in oklab, #2AABEE 25%, var(--border));
  border-radius: 16px;
  box-shadow: 0 10px 30px -10px rgba(42,171,238,0.18);
}
.pe-preview-head {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 11px 14px;
}
.pe-preview-head-icon {
  width: 24px; height: 24px;
  border-radius: 7px;
  background: var(--panel-2);
  color: var(--muted);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: background 0.2s, color 0.2s;
}
.pe-preview-wrap.on .pe-preview-head-icon {
  background: #2AABEE;
  color: white;
}
.pe-preview-head-title {
  flex: 1;
  font-size: 12.5px;
  font-weight: 600;
  letter-spacing: -0.005em;
  color: var(--text);
}
.pe-preview-head-lang {
  display: inline-flex;
  align-items: center;
  height: 20px;
  padding: 0 8px;
  background: var(--accent);
  color: white;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.05em;
}
.pe-preview-body {
  padding: 4px 14px 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  animation: pePreviewIn 0.25s ease both;
}
@keyframes pePreviewIn {
  from { opacity: 0; transform: translateY(-4px); }
  to   { opacity: 1; transform: translateY(0); }
}
.pe-preview-hint {
  font-size: 10.5px;
  color: var(--muted);
  line-height: 1.45;
  text-align: center;
  padding: 0 6px;
}

/* iOS-style switch */
.pe-switch {
  position: relative;
  width: 38px;
  height: 22px;
  border-radius: 999px;
  background: var(--border);
  border: none;
  cursor: pointer;
  padding: 0;
  flex-shrink: 0;
  transition: background 0.25s cubic-bezier(.4,0,.2,1);
}
.pe-switch.on {
  background: #34c759;
}
.pe-switch-thumb {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 18px;
  height: 18px;
  border-radius: 999px;
  background: white;
  box-shadow: 0 2px 4px rgba(0,0,0,0.18), 0 0 0 0.5px rgba(0,0,0,0.04);
  transition: transform 0.25s cubic-bezier(.4,0,.2,1);
}
.pe-switch.on .pe-switch-thumb {
  transform: translateX(16px);
}
.pe-switch:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

/* Responsive */
@media (max-width: 1100px) {
  .pe-body {
    grid-template-columns: 1fr;
  }
  .pe-sidebar { position: static; }
}
@media (max-width: 720px) {
  .pe-hero,
  .pe-body { padding-left: 16px; padding-right: 16px; }
  .pe-hero-inner { flex-wrap: wrap; }
  .pe-title-input { font-size: 20px; }
  .pe-hide-sm { display: none; }
}

/* ─── Video processing overlay ─── */
.pe-vp-overlay {
  position: fixed; inset: 0; z-index: 200;
  display: flex; align-items: center; justify-content: center;
  background: color-mix(in oklab, var(--bg) 70%, transparent);
  backdrop-filter: blur(14px) saturate(150%);
  -webkit-backdrop-filter: blur(14px) saturate(150%);
  padding: 24px;
}
.pe-vp-fade-enter-active, .pe-vp-fade-leave-active { transition: opacity .25s ease; }
.pe-vp-fade-enter-from, .pe-vp-fade-leave-to { opacity: 0; }
.pe-vp-card {
  width: 100%;
  max-width: 460px;
  padding: 36px 30px 28px;
  border-radius: 24px;
  background: linear-gradient(135deg, #F59E0B 0%, #DC2626 100%);
  color: white;
  text-align: center;
  display: flex; flex-direction: column; align-items: center;
  box-shadow: 0 30px 80px -20px rgba(245,158,11,0.55), 0 10px 30px -10px rgba(15,23,42,0.3);
}
.pe-vp-icon {
  position: relative;
  width: 48px; height: 48px;
  margin-bottom: 18px;
  display: inline-flex; align-items: center; justify-content: center;
}
@keyframes pe-vp-spin { to { transform: rotate(360deg); } }
.pe-vp-title {
  margin: 0 0 6px;
  font-size: 18px; font-weight: 700;
  letter-spacing: -0.02em;
}
.pe-vp-sub {
  margin: 0 0 18px;
  font-size: 13px;
  opacity: 0.92;
  line-height: 1.5;
  max-width: 360px;
}
.pe-vp-bar {
  width: 100%;
  height: 5px;
  border-radius: 999px;
  background: rgba(255,255,255,0.2);
  overflow: hidden;
}
.pe-vp-bar-fill {
  height: 100%;
  width: 40%;
  background: white;
  border-radius: 999px;
  animation: pe-vp-bar 1.6s ease-in-out infinite;
}
@keyframes pe-vp-bar {
  0%   { transform: translateX(-100%); }
  100% { transform: translateX(350%); }
}
</style>
