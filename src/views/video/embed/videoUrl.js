import { isBilibiliHostname, parseBilibiliUrl } from './bilibiliUrl.js'
import { parseYouTubeUrl } from './youtubeUrl.js'

export function parseVideoId(siteValue, idValue, { page, start } = {}) {
  const site = typeof siteValue === 'string' ? siteValue.trim().toLowerCase() : ''
  const id = typeof idValue === 'string' ? idValue.trim() : ''

  if (!site) throw new Error('URL 参数缺少 site')
  if (!id) throw new Error('URL 参数缺少 id')

  let url
  if (site === 'youtube') {
    url = new URL('https://www.youtube.com/watch')
    url.searchParams.set('v', id)
  } else if (site === 'bilibili') {
    if (/^BV[A-Za-z0-9]+$/.test(id) || /^av\d+$/i.test(id)) {
      url = new URL(`https://www.bilibili.com/video/${id}`)
      if (page != null && String(page).trim()) {
        url.searchParams.set('p', String(page).trim())
      }
    } else if (/^ep\d+$/i.test(id)) {
      url = new URL(`https://www.bilibili.com/bangumi/play/${id}`)
    } else {
      throw new Error('Bilibili id 必须是有效的 BV 号、av 号或 ep 号')
    }
  } else {
    throw new Error('site 只支持 bilibili 或 youtube')
  }

  if (start != null && String(start).trim()) {
    url.searchParams.set('t', String(start).trim())
  }

  return parseVideoUrl(url.toString())
}

export function parseVideoUrl(value) {
  const input = value.trim()
  if (!input) {
    throw new Error('请输入 YouTube 或 Bilibili 视频链接')
  }

  let url
  try {
    url = new URL(/^https?:\/\//i.test(input) ? input : `https://${input}`)
  } catch {
    throw new Error('链接格式不正确')
  }

  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error('只支持 HTTP 或 HTTPS 链接')
  }

  const hostname = url.hostname.toLowerCase().replace(/\.$/, '')
  if (isBilibiliHostname(hostname)) {
    return parseBilibiliUrl(input)
  }

  try {
    return {
      provider: 'youtube',
      providerName: 'YouTube',
      ...parseYouTubeUrl(input),
    }
  } catch (error) {
    if (error instanceof Error && error.message === '只支持 YouTube 链接') {
      throw new Error('只支持 YouTube 或 Bilibili 链接')
    }
    throw error
  }
}
