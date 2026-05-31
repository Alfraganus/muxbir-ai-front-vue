/**
 * Tiptap HTML ni Telegram-mos HTML matniga aylantiradi.
 * Editor endi HTML saqlaydi (content_json.html), shu sababli oldingi block-based
 * konverter o'rnida bevosita HTML sanitize qilamiz.
 *
 * Telegram parse_mode=HTML ruxsat beradi: <b>, <i>, <u>, <s>, <a>, <code>, <pre>, <blockquote>
 * Boshqa taglar olib tashlanadi; blok darajadagi taglar (<p>, <h2>, <li>, <br>) yangi qatorga aylanadi.
 */

function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function escapeAttr(s) {
  return String(s ?? '').replace(/"/g, '&quot;')
}

function stripBlockTags(s) {
  return String(s || '')
    .replace(/<\/?(p|div|h[1-6]|li|ul|ol|br)\b[^>]*>/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Tiptap HTML → Telegram HTML (parse_mode=HTML uchun mos subset). */
export function tiptapHtmlToTelegramHtml(html) {
  if (!html) return ''
  let s = String(html)

  s = s.replace(/<img\b[^>]*?src=(["'])([^"']+)\1[^>]*>/gi, (_m, _q, src) => {
    return `\n🖼 <a href="${escapeAttr(src)}">rasm</a>\n`
  })

  s = s.replace(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/gi, (_m, inner) => {
    return `\n<b>${stripBlockTags(inner)}</b>\n\n`
  })

  s = s.replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, (_m, inner) => {
    const cleaned = inner
      .replace(/<\/?p[^>]*>/gi, '\n')
      .replace(/\n+/g, '\n')
      .trim()
    return `\n<blockquote>${cleaned}</blockquote>\n`
  })

  s = s.replace(/<pre[^>]*>\s*<code[^>]*>([\s\S]*?)<\/code>\s*<\/pre>/gi, (_m, code) => {
    return `\n<pre>${code}</pre>\n`
  })

  s = s.replace(/<ol[^>]*>([\s\S]*?)<\/ol>/gi, (_m, inner) => {
    let i = 0
    const items = inner.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_mm, li) => {
      i += 1
      return `${i}. ${stripBlockTags(li)}\n`
    })
    return `\n${items.trim()}\n\n`
  })
  s = s.replace(/<ul[^>]*>([\s\S]*?)<\/ul>/gi, (_m, inner) => {
    const items = inner.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_mm, li) => {
      return `• ${stripBlockTags(li)}\n`
    })
    return `\n${items.trim()}\n\n`
  })

  s = s.replace(/<\/p>/gi, '\n\n').replace(/<p[^>]*>/gi, '')
  s = s.replace(/<br\s*\/?>(\s*)/gi, '\n')

  s = s.replace(/<strong[^>]*>/gi, '<b>').replace(/<\/strong>/gi, '</b>')
  s = s.replace(/<em[^>]*>/gi, '<i>').replace(/<\/em>/gi, '</i>')

  s = s.replace(/<a\b[^>]*?href=(["'])([^"']+)\1[^>]*>/gi, (_m, _q, href) => {
    return `<a href="${escapeAttr(href)}">`
  })

  s = s.replace(/<(?!\/?(b|i|u|s|a|code|pre|blockquote)(\s[^>]*)?>)[^>]+>/gi, '')
  s = s.replace(/&nbsp;/gi, ' ')
  s = s.replace(/\n{3,}/g, '\n\n').trim()
  return s
}

/** Tiptap HTML'dan oddiy matnni ajratib oladi (preview/short_description uchun). */
export function htmlToPlainText(html) {
  if (!html) return ''
  return String(html)
    .replace(/<br\s*\/?>(\s*)/gi, '\n')
    .replace(/<\/(p|div|h[1-6]|li|blockquote)>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/** content_json'dan HTML ajratib olish (har xil shakllarni qabul qiladi). */
export function extractHtml(contentJson) {
  if (!contentJson) return ''
  if (typeof contentJson === 'string') return contentJson
  if (typeof contentJson === 'object') return contentJson.html || ''
  return ''
}

/** content_json'da matn bormi? */
export function hasContent(contentJson) {
  const html = extractHtml(contentJson)
  if (!html) return false
  return htmlToPlainText(html).length > 0
}

/**
 * Backend telegram-publisher.buildHtml() bilan bir xil natija (preview va real natija mos kelishi uchun).
 * content_json — { html: "..." } shaklida.
 */
export function buildTelegramHtml({ title, short_description, content_json, tags }) {
  const parts = []
  if (title) parts.push(`<b>${escapeHtml(title)}</b>`)
  if (short_description) parts.push(`<i>${escapeHtml(short_description)}</i>`)

  const body = tiptapHtmlToTelegramHtml(extractHtml(content_json))
  if (body) parts.push(body)

  if (tags?.length) {
    const tagLine = tags
      .filter(Boolean)
      .map(tg => '#' + tg.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_Ѐ-ӿԀ-ԯ]/g, ''))
      .filter(t => t.length > 1)
      .join(' ')
    if (tagLine) parts.push(tagLine)
  }

  return parts.join('\n\n').trim()
}

/** Telegram HTML ni brauzer-do'st HTML ga aylantiradi (preview uchun). */
export function telegramHtmlToBrowserHtml(html) {
  if (!html) return ''
  return String(html).replace(/\n/g, '<br/>')
}
