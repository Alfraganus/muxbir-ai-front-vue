<template>
  <button
    class="nav-item"
    :class="{ 'nav-item--active': active, 'nav-item--nested': nested }"
    @click="$emit('click')"
  >
    <span v-if="active" class="nav-item__bar" aria-hidden="true" />
    <span v-if="icon" class="nav-item__icon">
      <AppIcon :name="icon" :size="16" />
    </span>
    <span class="nav-item__label">{{ label }}</span>
    <span v-if="count != null" class="nav-item__count mono tabular">{{ count }}</span>
  </button>
</template>

<script setup>
import AppIcon from '@/components/ui/AppIcon.vue'

defineProps({
  icon: String,
  label: String,
  count: [Number, String],
  active: Boolean,
  nested: Boolean,
})
defineEmits(['click'])
</script>

<style scoped>
.nav-item {
  position: relative;
  width: 100%;
  height: 34px;
  padding: 0 10px;
  display: flex;
  align-items: center;
  gap: 10px;
  border-radius: var(--r-sm);
  border: none;
  background: transparent;
  color: var(--text-2);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  text-align: left;
  transition: background 0.14s ease, color 0.14s ease;
}
.nav-item--nested { padding-left: 30px; }
.nav-item:hover { background: var(--nav-hover-bg); color: var(--text); }

.nav-item--active {
  background: var(--nav-active-bg);
  color: var(--accent);
  font-weight: 600;
}
.nav-item--active:hover { background: var(--nav-active-bg); }

/* Chap tomondagi accent indikator */
.nav-item__bar {
  position: absolute;
  left: -4px;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 18px;
  border-radius: 999px;
  background: var(--accent);
}

.nav-item__icon {
  display: inline-flex;
  flex-shrink: 0;
  color: var(--muted);
  transition: color 0.14s ease;
}
.nav-item:hover .nav-item__icon { color: var(--text-2); }
.nav-item--active .nav-item__icon { color: var(--accent); }

.nav-item__label {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.nav-item__count {
  font-size: 10.5px;
  padding: 1px 7px;
  border-radius: 999px;
  background: var(--panel-2);
  color: var(--muted);
  border: 1px solid var(--border);
}
.nav-item--active .nav-item__count {
  background: color-mix(in oklab, var(--accent) 16%, transparent);
  color: var(--accent);
  border-color: transparent;
}
</style>
