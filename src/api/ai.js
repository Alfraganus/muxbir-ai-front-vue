import http from './http.js'

export const aiApi = {
  /** AI token iste'moli va tarif chegarasi */
  getUsage: async () => {
    const { data } = await http.get('/ai/usage')
    return data // { company_id, used_tokens, limit_tokens, calls, has_tariff }
  },

  /**
   * Admin tomonidan tavsiya etilgan prompt mavjudligini tekshirish.
   * usage: 'article_from_url' | 'article_shorten' | 'autopost' | 'article_tags'
   * Qaytaradi: { exists: boolean, name?: string, key?: string }
   */
  getRecommendedPrompt: async (usage) => {
    const { data } = await http.get(`/ai-prompts/recommended/${encodeURIComponent(usage)}`)
    return data
  },
}
