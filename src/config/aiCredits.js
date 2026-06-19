/**
 * AI amallari narxi (kredit). 1 kredit = 10 so'm. Backend bilan bir xil
 * (posts-ai.service.ts → AI_CREDIT_COST). Narx o'zgarsa ikkala joyni ham yangila.
 */
export const AI_CREDIT_COST = {
  rewrite: 50, // AI bilan qayta yozish — 500 so'm
  shorten: 30, // AI bilan qisqartirish — 300 so'm
  tags: 30,    // AI teglar — 300 so'm (har generatsiya)
}

/** Narxni "50 kredit" ko'rinishida matn qiladi. */
export function creditLabel(amount) {
  return `${amount} kredit`
}
