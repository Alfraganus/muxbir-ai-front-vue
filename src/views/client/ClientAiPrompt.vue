<template>
  <div style="padding:20px 24px 40px;display:flex;flex-direction:column;gap:16px;max-width:920px;">
    <PageHeader
      :title="tt('aip.title')"
      :subtitle="tt('aip.subtitle')"
    />

    <AppPanel
      :title="tt('aip.panel.title')"
      :subtitle="tt('aip.panel.subtitle')"
    >
      <div v-if="loading" style="color:var(--muted);font-size:13px;">{{ tt('aip.loading') }}</div>
      <div v-else-if="!company" style="color:var(--muted);font-size:13px;">
        {{ tt('aip.noCompany') }}
      </div>
      <form v-else @submit.prevent="saveGroups" style="display:flex;flex-direction:column;gap:16px;">

        <!-- Sticky action bar — Saqlash har doim ko'rinadi -->
        <div v-if="groups.length"
             style="position:sticky;top:0;z-index:5;display:flex;align-items:center;gap:10px;
                    padding:10px 12px;background:var(--bg);border:1px solid var(--border-2);
                    border-radius:8px;box-shadow:0 2px 6px rgba(0,0,0,.04);">
          <span style="font-size:11.5px;color:var(--muted);">
            {{ tt('aip.count', { groups: groups.length, sections: totalPromptCount }) }}
          </span>
          <span v-if="dirty" style="font-size:11px;color:#f59e0b;font-weight:600;">
            {{ tt('aip.unsaved') }}
          </span>
          <div style="flex:1"></div>
          <span v-if="savedAt" style="font-size:11.5px;color:var(--success);">{{ tt('aip.saved') }}</span>
          <span v-if="error" style="font-size:11.5px;color:var(--danger);">{{ error }}</span>
          <!-- Yangi prompt — har doim qo'l ostida, scroll qilish kerak emas -->
          <button type="button" @click="addGroupAndScroll"
                  style="padding:8px 14px;border-radius:6px;background:transparent;color:var(--accent);
                         border:1.5px dashed var(--accent);cursor:pointer;font-size:12.5px;font-weight:500;
                         display:inline-flex;align-items:center;gap:5px;transition:all .15s;"
                  @mouseenter="$event.target.style.background='rgba(99,102,241,.05)'"
                  @mouseleave="$event.target.style.background='transparent'">
            ＋ {{ tt('aip.addPrompt') }}
          </button>
          <button type="submit" :disabled="saving || !dirty"
                  :style="{
                    padding: '8px 18px',
                    borderRadius: '6px',
                    background: dirty ? 'var(--accent)' : 'var(--bg-2,rgba(0,0,0,.05))',
                    color: dirty ? '#fff' : 'var(--muted)',
                    border: 'none',
                    cursor: (saving || !dirty) ? 'default' : 'pointer',
                    fontSize: '13px',
                    fontWeight: 600,
                    transition: 'all .15s',
                  }">
            {{ saving ? tt('aip.saving') : (dirty ? tt('aip.saveBtn') : tt('aip.savedBtn')) }}
          </button>
        </div>

        <!-- Bo'sh holat -->
        <div v-if="!groups.length"
             style="padding:36px 24px;text-align:center;border:1.5px dashed var(--border-2);border-radius:12px;
                    display:flex;flex-direction:column;gap:12px;align-items:center;">
          <div style="width:54px;height:54px;border-radius:50%;background:rgba(99,102,241,.1);
                       display:flex;align-items:center;justify-content:center;font-size:24px;">✨</div>
          <div style="font-size:14px;color:var(--text);font-weight:600;">{{ tt('aip.emptyTitle') }}</div>
          <div style="font-size:12px;color:var(--muted);max-width:380px;">
            {{ tt('aip.emptyDesc') }}
          </div>
          <button type="button" @click="addGroup"
                  style="padding:9px 18px;border-radius:7px;background:var(--accent);color:#fff;
                         border:none;cursor:pointer;font-size:13px;font-weight:500;">
            + {{ tt('aip.firstPrompt') }}
          </button>
        </div>

        <!-- Group cards -->
        <div
          v-for="(g, gi) in groups"
          :key="g._key"
          data-prompt-card
          style="border:1px solid var(--border-2);border-radius:12px;background:var(--bg);overflow:hidden;
                 transition:border-color .15s;"
        >
          <!-- Group header — har doim ko'rinadi -->
          <div style="display:flex;align-items:center;gap:10px;padding:12px 14px;
                       background:var(--bg-2,rgba(0,0,0,.02));border-bottom:1px solid var(--border-2);">
            <button type="button" @click="toggleCollapse(g)"
                    :style="{
                      width: '24px', height: '24px', border: 'none', background: 'transparent',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'var(--muted)', fontSize: '12px',
                      transform: g._collapsed ? 'rotate(-90deg)' : 'rotate(0)',
                      transition: 'transform .15s',
                    }">▼</button>
            <span style="font-size:10px;font-weight:700;color:var(--muted);letter-spacing:0.06em;">
              PROMPT #{{ gi + 1 }}
            </span>
            <input
              v-model="g.name"
              type="text"
              :placeholder="tt('aip.promptNamePh')"
              style="flex:1;padding:6px 10px;border:1px solid transparent;border-radius:6px;
                     background:transparent;color:var(--text);font-size:15px;font-weight:700;
                     letter-spacing:-0.01em;transition:all .15s;"
              @focus="$event.target.style.background='var(--bg)';$event.target.style.borderColor='var(--border-2)'"
              @blur="$event.target.style.background='transparent';$event.target.style.borderColor='transparent'"
            />
            <span v-if="g._collapsed"
                  style="font-size:11px;color:var(--muted);padding:3px 8px;
                         background:var(--bg);border-radius:999px;border:1px solid var(--border-2);">
              {{ tt('aip.sectionCount', { n: g.prompts.length }) }}
            </span>
            <div style="display:flex;gap:4px;">
              <button type="button" :disabled="gi === 0" @click="moveGroup(gi, -1)"
                      style="width:28px;height:28px;border:1px solid var(--border-2);background:var(--bg);
                             color:var(--muted);border-radius:6px;cursor:pointer;font-size:12px;line-height:1;
                             display:flex;align-items:center;justify-content:center;">↑</button>
              <button type="button" :disabled="gi === groups.length - 1" @click="moveGroup(gi, +1)"
                      style="width:28px;height:28px;border:1px solid var(--border-2);background:var(--bg);
                             color:var(--muted);border-radius:6px;cursor:pointer;font-size:12px;line-height:1;
                             display:flex;align-items:center;justify-content:center;">↓</button>
              <button type="button" @click="removeGroup(gi)"
                      style="width:28px;height:28px;border:1px solid var(--border-2);background:var(--bg);
                             color:#ef4444;border-radius:6px;cursor:pointer;font-size:14px;line-height:1;
                             display:flex;align-items:center;justify-content:center;">🗑</button>
            </div>
          </div>

          <!-- Prompts (collapse'da yashiriladi) -->
          <div v-show="!g._collapsed" style="padding:12px 14px;display:flex;flex-direction:column;gap:10px;">
            <div
              v-for="(p, pi) in g.prompts"
              :key="p._key"
              style="border:1px solid var(--border-2);border-radius:10px;background:var(--bg);
                     display:flex;flex-direction:column;overflow:hidden;"
            >
              <!-- Prompt header: collapse + title + actions. Header'ga bosish — collapse toggle -->
              <div :style="{
                     display: 'flex', alignItems: 'center', gap: '8px',
                     padding: '10px 12px',
                     background: p._collapsed ? 'var(--bg)' : 'var(--bg-2,rgba(0,0,0,.015))',
                     borderBottom: p._collapsed ? 'none' : '1px solid var(--border-2)',
                     cursor: 'pointer',
                     transition: 'background .15s',
                   }"
                   @click="togglePromptCollapse(p)">
                <button type="button"
                        :style="{
                          width: '20px', height: '20px', border: 'none', background: 'transparent',
                          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: 'var(--muted)', fontSize: '10px',
                          transform: p._collapsed ? 'rotate(-90deg)' : 'rotate(0)',
                          transition: 'transform .15s',
                        }">▼</button>
                <span style="font-size:10px;font-weight:700;color:var(--muted);letter-spacing:0.06em;
                             min-width:36px;">
                  #{{ pi + 1 }}
                </span>
                <input
                  v-model="p.title"
                  type="text"
                  :placeholder="tt('aip.sectionNamePh')"
                  style="flex:1;padding:5px 9px;border:1px solid transparent;border-radius:5px;
                         background:transparent;color:var(--text);font-size:13.5px;font-weight:600;
                         transition:all .15s;"
                  @click.stop
                  @focus.stop="$event.target.style.background='var(--bg)';$event.target.style.borderColor='var(--border-2)'"
                  @blur="$event.target.style.background='transparent';$event.target.style.borderColor='transparent'"
                />
                <!-- Collapse holatida matn preview ko'rsatamiz -->
                <span v-if="p._collapsed && p.content"
                      style="font-size:11px;color:var(--muted);max-width:200px;overflow:hidden;
                             text-overflow:ellipsis;white-space:nowrap;font-family:'JetBrains Mono',monospace;
                             padding:3px 8px;background:var(--bg-2,rgba(0,0,0,.04));border-radius:5px;">
                  {{ contentPreview(p.content) }}
                </span>
                <!-- BASE toggle switch -->
                <label
                       @click.stop
                       :style="{
                         display: 'inline-flex', alignItems: 'center', gap: '8px',
                         padding: '5px 10px', borderRadius: '999px', cursor: 'pointer',
                         background: p.apply_base ? 'rgba(99,102,241,.1)' : 'var(--bg)',
                         border: '1px solid ' + (p.apply_base ? 'rgba(99,102,241,.3)' : 'var(--border-2)'),
                         fontSize: '11px', fontWeight: 600,
                         color: p.apply_base ? 'var(--accent)' : 'var(--muted)',
                         userSelect: 'none', transition: 'all .15s',
                       }">
                  <input v-model="p.apply_base" type="checkbox" style="margin:0;cursor:pointer;accent-color:var(--accent);"/>
                  <span>BASE</span>
                </label>
                <div style="display:flex;gap:3px;" @click.stop>
                  <button type="button" :disabled="pi === 0" @click="movePrompt(gi, pi, -1)"
                          style="width:24px;height:24px;border:1px solid var(--border-2);background:var(--bg);
                                 color:var(--muted);border-radius:5px;cursor:pointer;font-size:11px;
                                 display:flex;align-items:center;justify-content:center;">↑</button>
                  <button type="button" :disabled="pi === g.prompts.length - 1" @click="movePrompt(gi, pi, +1)"
                          style="width:24px;height:24px;border:1px solid var(--border-2);background:var(--bg);
                                 color:var(--muted);border-radius:5px;cursor:pointer;font-size:11px;
                                 display:flex;align-items:center;justify-content:center;">↓</button>
                  <button type="button" @click="removePrompt(gi, pi)" :disabled="g.prompts.length <= 1"
                          style="width:24px;height:24px;border:1px solid var(--border-2);background:var(--bg);
                                 color:#ef4444;border-radius:5px;cursor:pointer;font-size:12px;
                                 display:flex;align-items:center;justify-content:center;">✕</button>
                </div>
              </div>
              <!-- Textarea — auto-grow, faqat ochiq holatda -->
              <textarea
                v-show="!p._collapsed"
                v-model="p.content"
                spellcheck="false"
                data-section-ta
                :placeholder="tt('aip.sectionContentPh')"
                @input="autoGrow"
                :ref="(el) => onTaMount(el)"
                style="width:100%;padding:14px 16px;border:none;font-family:'JetBrains Mono',Menlo,Consolas,monospace;
                       font-size:13px;line-height:1.7;background:transparent;color:var(--text);
                       resize:vertical;min-height:280px;outline:none;box-sizing:border-box;"
              ></textarea>
            </div>

            <button
              type="button"
              @click="addPrompt(gi)"
              style="padding:8px 14px;border-radius:7px;background:transparent;color:var(--accent);
                     border:1.5px dashed var(--accent);cursor:pointer;font-size:12.5px;font-weight:500;
                     align-self:flex-start;transition:all .15s;"
              @mouseenter="$event.target.style.background='rgba(99,102,241,.05)'"
              @mouseleave="$event.target.style.background='transparent'"
            >＋ {{ tt('aip.addSection') }}</button>
          </div>
        </div>

        <!-- Yangi prompt — boshqa promptlardan vizual ajratilgan -->
        <div v-if="groups.length"
             style="display:flex;align-items:center;gap:10px;padding-top:8px;
                    border-top:1px dashed var(--border-2);">
          <span style="font-size:11px;color:var(--muted);">{{ tt('aip.newPromptLabel') }}</span>
          <button type="button" @click="addGroup"
                  style="padding:8px 16px;border-radius:7px;background:var(--accent);color:#fff;
                         border:none;cursor:pointer;font-size:12.5px;font-weight:500;
                         display:inline-flex;align-items:center;gap:6px;">
            ＋ {{ tt('aip.addPrompt') }}
          </button>
          <span style="font-size:11px;color:var(--muted);">
            {{ tt('aip.newPromptHint') }}
          </span>
        </div>

      </form>
    </AppPanel>
  </div>
</template>

<script setup>
import { onMounted, reactive, ref, computed, watch } from 'vue'
import AppPanel from '@/components/ui/AppPanel.vue'
import PageHeader from '@/components/layout/PageHeader.vue'
import { companiesApi } from '@/api/companies.js'
import { useAppStore } from '@/stores/app.js'

const store = useAppStore()
const t = computed(() => store.t)
function tt(key, params) { return t.value(key, params) }

const loading = ref(true)
const saving = ref(false)
const savedAt = ref(null)
const error = ref(null)
const company = ref(null)
const groups = ref([]) // [{ _key, id, name, prompts: [{ _key, id, title, content, apply_base }] }]
const dirty = ref(false)

const totalPromptCount = computed(() =>
  groups.value.reduce((sum, g) => sum + (g.prompts?.length || 0), 0)
)

// Har qanday o'zgarish bo'lsa dirty=true qiladi (snapshot vs current solishtirish o'rniga oddiy yo'l)
watch(groups, () => { dirty.value = true }, { deep: true })

let _nextKey = 1
const newKey = () => `k${_nextKey++}`

function hydrateGroups(raw) {
  return (raw || []).map((g) => ({
    _key: newKey(),
    _collapsed: false,
    id: g.id,
    name: g.name || '',
    prompts: (g.prompts || []).map((p) => ({
      _key: newKey(),
      _collapsed: !!(p.content || '').trim(), // saqlangan kontentlar default yopiq
      id: p.id,
      title: p.title || '',
      content: p.content || '',
      apply_base: !!p.apply_base,
    })),
  }))
}

function toggleCollapse(g) {
  g._collapsed = !g._collapsed
}

function togglePromptCollapse(p) {
  p._collapsed = !p._collapsed
  // Ochilganda — textarea balandligini matn'ga moslab qayta hisoblash
  if (!p._collapsed) {
    requestAnimationFrame(() => {
      const tas = document.querySelectorAll('textarea[data-section-ta]')
      tas.forEach((ta) => {
        if (ta.offsetParent !== null) { // ko'rinadigan
          ta.style.height = 'auto'
          ta.style.height = Math.max(280, ta.scrollHeight + 2) + 'px'
        }
      })
    })
  }
}

function contentPreview(s) {
  const txt = (s || '').trim().replace(/\s+/g, ' ')
  return txt.length > 60 ? txt.slice(0, 60) + '…' : txt
}

function autoGrow(ev) {
  const ta = ev.target
  ta.style.height = 'auto'
  ta.style.height = Math.max(280, ta.scrollHeight + 2) + 'px'
}

/** Textarea mount qilinganda matnga moslab balandlikni hisoblash. */
function onTaMount(el) {
  if (!el) return
  // Keyingi tick'da scrollHeight to'g'ri hisoblanadi
  requestAnimationFrame(() => {
    el.style.height = 'auto'
    el.style.height = Math.max(280, el.scrollHeight + 2) + 'px'
  })
}

onMounted(async () => {
  try {
    const list = await companiesApi.getMy().catch(() => [])
    const arr = Array.isArray(list) ? list : [list].filter(Boolean)
    company.value = arr[0] || null
    if (!company.value) return
    const r = await companiesApi.getAiPromptGroups(company.value.id)
    groups.value = hydrateGroups(r.groups)
    // Initial load — dirty bo'lmasligi kerak
    setTimeout(() => { dirty.value = false }, 0)
  } catch (e) {
    error.value = e?.response?.data?.message ?? e.message
  } finally {
    loading.value = false
  }
})

function addGroup() {
  groups.value.push({
    _key: newKey(),
    _collapsed: false,
    id: null,
    name: `Prompt ${groups.value.length + 1}`,
    prompts: [{ _key: newKey(), _collapsed: false, id: null, title: '', content: '', apply_base: true }],
  })
}

/**
 * Sticky bar'dan yangi prompt qo'shganda: qo'shish + DOM yangilangach
 * yangi prompt'ga scroll qilish (sticky bar ostida joylashishi uchun).
 */
function addGroupAndScroll() {
  addGroup()
  requestAnimationFrame(() => requestAnimationFrame(() => {
    // Eng oxirgi prompt card'iga scroll
    const cards = document.querySelectorAll('[data-prompt-card]')
    const last = cards[cards.length - 1]
    if (last) last.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }))
}

function removeGroup(gi) {
  if (!confirm(tt('aip.confirmDelete', { name: groups.value[gi].name }))) return
  groups.value.splice(gi, 1)
}

function moveGroup(gi, delta) {
  const j = gi + delta
  if (j < 0 || j >= groups.value.length) return
  const [item] = groups.value.splice(gi, 1)
  groups.value.splice(j, 0, item)
}

function addPrompt(gi) {
  groups.value[gi].prompts.push({
    _key: newKey(),
    _collapsed: false, // yangi bo'lim ochiq — foydalanuvchi yozadi
    id: null,
    title: '',
    content: '',
    apply_base: true,
  })
}

function removePrompt(gi, pi) {
  if (groups.value[gi].prompts.length <= 1) return
  groups.value[gi].prompts.splice(pi, 1)
}

function movePrompt(gi, pi, delta) {
  const arr = groups.value[gi].prompts
  const j = pi + delta
  if (j < 0 || j >= arr.length) return
  const [item] = arr.splice(pi, 1)
  arr.splice(j, 0, item)
}

async function saveGroups() {
  if (!company.value) return
  saving.value = true
  error.value = null
  try {
    const payload = groups.value.map((g) => ({
      id: g.id || undefined,
      name: g.name,
      prompts: g.prompts.map((p) => ({
        id: p.id || undefined,
        title: p.title || '',
        content: p.content,
        apply_base: !!p.apply_base,
      })),
    }))
    const r = await companiesApi.setAiPromptGroups(company.value.id, payload)
    groups.value = hydrateGroups(r.groups)
    savedAt.value = Date.now()
    // hydrateGroups o'zgartiradi → dirty true bo'lib qoladi — keyingi tick'da false qilamiz
    setTimeout(() => { dirty.value = false }, 0)
    setTimeout(() => { savedAt.value = null }, 3000)
  } catch (e) {
    error.value = e?.response?.data?.message ?? e.message
  } finally {
    saving.value = false
  }
}
</script>
