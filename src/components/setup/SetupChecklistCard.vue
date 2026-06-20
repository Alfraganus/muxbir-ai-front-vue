<template>
  <div class="sc-card" :class="{ 'sc-ok': ok }">
    <button type="button" class="sc-head" :aria-expanded="open" @click="open = !open">
      <div class="sc-head-l">
        <span class="sc-badge" :class="ok ? 'sc-badge-ok' : 'sc-badge-warn'">
          <AppIcon :name="ok ? 'Check' : 'Bell'" :size="14"/>
        </span>
        <div class="sc-head-txt">
          <div class="sc-title">
            {{ ok ? tt('setupChecklistCard.titleOk') : tt('setupChecklistCard.titleWarn') }}
          </div>
          <div class="sc-sub">
            <template v-if="ok">{{ tt('setupChecklistCard.subOk') }}</template>
            <template v-else>{{ tt('setupChecklistCard.subProgress', { done: doneCount, total: totalCount, missing: missingCount }) }}</template>
          </div>
        </div>
      </div>
      <div class="sc-head-r">
        <AppButton variant="ghost" size="sm" :loading="loading" @click.stop="$emit('refresh')">
          <template #icon><AppIcon name="Chart" :size="12"/></template>{{ tt('setupChecklistCard.checkBtn') }}
        </AppButton>
        <span class="sc-chev" :class="{ 'sc-chev-open': open }"><AppIcon name="Chevron" :size="16"/></span>
      </div>
    </button>

    <!-- Progress bar (doim ko'rinadi) -->
    <div class="sc-bar"><div class="sc-bar-fill" :style="{ width: pct + '%' }"/></div>

    <ul v-show="open" class="sc-list">
      <li v-for="it in items" :key="it.key" class="sc-item" :class="{ 'sc-item-done': it.done }">
        <span class="sc-ic" :class="it.done ? 'sc-ic-done' : 'sc-ic-todo'">
          <AppIcon :name="it.done ? 'Check' : it.icon" :size="13"/>
        </span>
        <div class="sc-item-body">
          <div class="sc-item-title">
            {{ it.title }}
            <span v-if="it.count !== null && it.count > 0" class="sc-count">{{ it.count }}</span>
            <span v-if="it.key === 'bot' && it.username" class="sc-uname">@{{ it.username }}</span>
          </div>
          <div v-if="!it.done" class="sc-item-hint">{{ it.hint }}</div>
        </div>
        <RouterLink v-if="!it.done && it.link" :to="it.link" class="sc-fix">
          {{ tt('setupChecklistCard.setupLink') }}<AppIcon name="ChevronR" :size="12"/>
        </RouterLink>
        <span v-else-if="it.done" class="sc-tag">{{ tt('setupChecklistCard.readyTag') }}</span>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import AppButton from '@/components/ui/AppButton.vue'
import { useAppStore } from '@/stores/app.js'

const store = useAppStore()
const t = computed(() => store.t)
function tt(key, params) { return t.value(key, params) }

const props = defineProps({
  items: { type: Array, default: () => [] },
  ok: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
  doneCount: { type: Number, default: 0 },
  totalCount: { type: Number, default: 0 },
  missingCount: { type: Number, default: 0 },
})

defineEmits(['refresh'])

// Default yopiq — foydalanuvchi sarlavhani bosib ochadi
const open = ref(false)

const pct = computed(() =>
  props.totalCount ? Math.round((props.doneCount / props.totalCount) * 100) : 0,
)
</script>

<style scoped>
.sc-card {
  border:1px solid var(--border);
  border-left:3px solid var(--warning, #F59E0B);
  border-radius:var(--r-md, 12px);
  background:var(--panel);
  padding:16px 18px;
  display:flex;flex-direction:column;gap:14px;
}
.sc-card.sc-ok { border-left-color:var(--success, #22C55E); }

.sc-head { width:100%;display:flex;align-items:center;justify-content:space-between;gap:12px;
  background:none;border:none;padding:0;margin:0;font-family:inherit;text-align:left;cursor:pointer; }
.sc-head-l { display:flex;align-items:center;gap:12px;min-width:0; }
.sc-head-txt { min-width:0; }
.sc-head-r { display:flex;align-items:center;gap:8px;flex-shrink:0; }
.sc-chev { color:var(--muted);display:inline-flex;transition:transform .25s; }
.sc-chev-open { transform:rotate(180deg); }
.sc-badge { width:34px;height:34px;border-radius:9px;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0; }
.sc-badge-warn { background:color-mix(in srgb, var(--warning, #F59E0B) 16%, transparent); color:var(--warning, #F59E0B); }
.sc-badge-ok { background:color-mix(in srgb, var(--success, #22C55E) 16%, transparent); color:var(--success, #22C55E); }
.sc-title { font-size:13.5px;font-weight:600;color:var(--text);line-height:1.3; }
.sc-sub { font-size:12px;color:var(--muted);margin-top:2px; }

.sc-bar { height:6px;border-radius:999px;background:var(--border-2, rgba(148,163,184,.18));overflow:hidden; }
.sc-bar-fill { height:100%;border-radius:999px;background:linear-gradient(90deg, var(--accent, #6366F1), var(--success, #22C55E));transition:width .5s; }

.sc-list { list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:2px; }
.sc-item { display:flex;align-items:center;gap:11px;padding:8px 6px;border-radius:8px; }
.sc-item + .sc-item { border-top:1px solid var(--border-2, rgba(148,163,184,.12)); }
.sc-ic { width:26px;height:26px;border-radius:7px;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0; }
.sc-ic-done { background:color-mix(in srgb, var(--success, #22C55E) 14%, transparent); color:var(--success, #22C55E); }
.sc-ic-todo { background:var(--border-2, rgba(148,163,184,.15)); color:var(--muted); }
.sc-item-body { flex:1;min-width:0; }
.sc-item-title { font-size:12.5px;font-weight:500;color:var(--text);display:flex;align-items:center;gap:7px;flex-wrap:wrap; }
.sc-item-done .sc-item-title { color:var(--muted); }
.sc-count { font-size:10.5px;font-weight:700;padding:1px 7px;border-radius:999px;background:color-mix(in srgb, var(--success, #22C55E) 16%, transparent);color:var(--success, #22C55E);font-variant-numeric:tabular-nums; }
.sc-uname { font-size:11px;color:var(--accent, #6366F1); }
.sc-item-hint { font-size:11px;color:var(--muted);margin-top:2px;line-height:1.4; }

.sc-fix { display:inline-flex;align-items:center;gap:2px;font-size:11.5px;font-weight:600;color:var(--accent, #6366F1);text-decoration:none;padding:4px 8px;border-radius:7px;background:color-mix(in srgb, var(--accent, #6366F1) 10%, transparent);flex-shrink:0; }
.sc-fix:hover { background:color-mix(in srgb, var(--accent, #6366F1) 18%, transparent); }
.sc-tag { font-size:11px;color:var(--success, #22C55E);font-weight:600;flex-shrink:0; }
</style>
