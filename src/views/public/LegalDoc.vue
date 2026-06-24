<script setup>
/**
 * Umumiy huquqiy hujjat layouti (Privacy / Terms uchun).
 * MetaDataDeletion bilan bir xil kartali, responsive uslub.
 * Kontentni bermaydi — faqat sarlavha + bo'limlar ro'yxatini chiroyli ko'rsatadi
 * (Open/Closed: yangi hujjat qo'shilsa, bu komponent o'zgarmaydi).
 */
defineProps({
  // string — kartaning yuqori sarlavhasi
  title: { type: String, required: true },
  // string — sarlavha ostidagi kichik matn (brend)
  subtitle: { type: String, default: '' },
  // string — "Oxirgi yangilanish: ..." kabi matn
  updated: { type: String, default: '' },
  // Array<{ h: string, b: string }> — har bir bo'lim sarlavhasi (h) va HTML tanasi (b)
  sections: { type: Array, default: () => [] },
})
</script>

<template>
  <div class="legal-wrap">
    <div class="legal-card">
      <div class="legal-head">
        <div class="legal-logo">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="white"><path d="M12 2L2 7v10l10 5 10-5V7L12 2zm0 2.18L19.5 8 12 11.82 4.5 8 12 4.18zM4 9.54l7 3.5v6.42l-7-3.5V9.54zm16 0v6.42l-7 3.5v-6.42l7-3.5z"/></svg>
        </div>
        <div>
          <h1 class="legal-title">{{ title }}</h1>
          <p v-if="subtitle" class="legal-subtitle">{{ subtitle }}</p>
        </div>
      </div>

      <p v-if="updated" class="legal-updated">{{ updated }}</p>

      <section v-for="(s, i) in sections" :key="i" class="legal-section">
        <h2 v-if="s.h" class="legal-h2">{{ s.h }}</h2>
        <div class="legal-body" v-html="s.b"></div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.legal-wrap {
  min-height: 100vh;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  background: #f5f5f5;
  padding: 40px 24px;
}
.legal-card {
  max-width: 760px;
  width: 100%;
  background: #fff;
  border-radius: 12px;
  padding: 40px 40px 44px;
  box-shadow: 0 2px 16px rgba(0, 0, 0, .08);
}
.legal-head {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}
.legal-logo {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  background: #1877F2;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.legal-title {
  font-size: 22px;
  font-weight: 700;
  margin: 0;
  color: #111;
}
.legal-subtitle {
  font-size: 13px;
  color: #666;
  margin: 2px 0 0;
}
.legal-updated {
  font-size: 12px;
  color: #999;
  margin: 0 0 20px;
}
.legal-section { margin-bottom: 22px; }
.legal-h2 {
  font-size: 16px;
  font-weight: 700;
  color: #1877F2;
  margin: 0 0 8px;
}
.legal-body {
  font-size: 14px;
  line-height: 1.7;
  color: #333;
}
.legal-body :deep(a) { color: #1877F2; }
.legal-body :deep(ul) { margin: 8px 0; padding-left: 20px; }
.legal-body :deep(li) { margin-bottom: 4px; }

@media (max-width: 640px) {
  .legal-wrap { padding: 20px 14px; }
  .legal-card { padding: 26px 20px 30px; border-radius: 10px; }
  .legal-title { font-size: 19px; }
}
</style>
