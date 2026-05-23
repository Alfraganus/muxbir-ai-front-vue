/**
 * Editor.js OutputData blocklarini Telegram HTML formatga aylantiradi.
 * Backend'dagi telegram-publisher.service.ts buildHtml() bilan bir xil natija beradi
 * (preview va real natija mos kelishi uchun).
 */

function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function inlineHtml(html) {
  if (!html) return ''
  let s = html
  s = s.replace(/<br\s*\/?>/gi, '\n')
  s = s.replace(/<mark[^>]*>/gi, '<u>').replace(/<\/mark>/gi, '</u>')
  s = s.replace(/<code[^>]*class=["'][^"']*inline-code[^"']*["'][^>]*>/gi, '<code>')
  s = s.replace(/<strong>/gi, '<b>').replace(/<\/strong>/gi, '</b>')
  s = s.replace(/<em>/gi, '<i>').replace(/<\/em>/gi, '</i>')
  s = s.replace(/<a\b[^>]*?href=(["'])(.*?)\1[^>]*>/gi, (_m, _q, href) => {
    const safe = String(href).replace(/"/g, '&quot;')
    return `<a href="${safe}">`
  })
  s = s.replace(/<(?!\/?(b|i|u|s|a|code|pre|blockquote)(\s[^>]*)?>)[^>]+>/gi, '')
  s = s.replace(/&nbsp;/gi, ' ')
  return s.trim()
}

function stripTags(s) {
  return String(s ?? '').replace(/<[^>]+>/g, '')
}

function renderBlock(b) {
  switch (b.type) {
    case 'header':
      return `<b>${escapeHtml(stripTags(b.data?.text || ''))}</b>`
    case 'paragraph':
      return inlineHtml(b.data?.text || '')
    case 'list': {
      const style = b.data?.style
      const items = (b.data?.items || []).map((it, i) => {
        const text = typeof it === 'string' ? it : it?.content || ''
        const prefix = style === 'ordered' ? `${i + 1}. ` : '• '
        return prefix + inlineHtml(text)
      })
      return items.join('\n')
    }
    case 'quote':
      return `<blockquote>${inlineHtml(b.data?.text || '')}</blockquote>`
    case 'code':
      return `<pre>${escapeHtml(b.data?.code || '')}</pre>`
    case 'image': {
      const url = b.data?.file?.url || b.data?.url
      const cap = b.data?.caption ? ` — ${inlineHtml(b.data.caption)}` : ''
      return url ? `🖼 <a href="${url}">${escapeHtml(b.data?.caption || 'image')}</a>${cap}` : ''
    }
    case 'embed':
      return b.data?.source || b.data?.embed || ''
    case 'linkTool': {
      const url = b.data?.link
      if (!url) return ''
      const meta = b.data?.meta || {}
      const title = meta.title || meta.site_name || url
      return `<a href="${String(url).replace(/"/g, '&quot;')}">${escapeHtml(title)}</a>`
    }
    default:
      return b.data?.text ? inlineHtml(b.data.text) : ''
  }
}

/**
 * Backend bilan bir xil format quradi.
 * @returns Telegram HTML matni (subset: <b>, <i>, <u>, <a>, <code>, <pre>, <blockquote>)
 */
export function buildTelegramHtml({ title, short_description, content_json, tags }) {
  const parts = []
  if (title) parts.push(`<b>${escapeHtml(title)}</b>`)
  if (short_description) parts.push(`<i>${escapeHtml(short_description)}</i>`)

  const blocks = (content_json?.blocks || []).map(renderBlock).filter(Boolean)
  if (blocks.length) parts.push(blocks.join('\n\n'))

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

/**
 * Telegram HTML ni brauzer-do'st HTML ga aylantiradi (preview uchun).
 * \n → <br>; <a> link ochilmasin, oddiy ko'rsatamiz.
 */
export function telegramHtmlToBrowserHtml(html) {
  if (!html) return ''
  let s = html
  // Telegram HTML allowed tags already render in browser, except <blockquote> we keep
  // \n → <br/>
  s = s.replace(/\n/g, '<br/>')
  return s
}
