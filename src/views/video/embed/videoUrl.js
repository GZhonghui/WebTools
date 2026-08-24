import { isBilibiliHostname, parseBilibiliUrl } from './bilibiliUrl.js'
import { parseYouTubeUrl } from './youtubeUrl.js'

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
