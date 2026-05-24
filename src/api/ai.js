import http from './http.js'

export const aiApi = {
  /** AI token iste'moli va tarif chegarasi */
  getUsage: async () => {
    const { data } = await http.get('/ai/usage')
    return data // { company_id, used_tokens, limit_tokens, calls, has_tariff }
  },
}
