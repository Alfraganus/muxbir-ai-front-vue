// Qoralama yozish/tekshirish uchun AI provayderlar (backend: style-profiles.config.ts).
export const AI_PROVIDERS = [
  { value: 'gemini', label: 'Google Gemini' },
  { value: 'anthropic', label: 'Anthropic Claude' },
  { value: 'openai', label: 'OpenAI' },
]

// Profil versiyasidagi tahrirlanadigan maydonlar (yangi versiyaga ko'chiriladi)
export const VERSION_FIELDS = [
  'writer_prompt', 'format_rules', 'review_prompt',
  'writer_provider', 'writer_model', 'review_provider', 'review_model', 'temperature',
]
