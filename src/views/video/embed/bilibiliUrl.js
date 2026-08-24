const BV_ID_PATTERN = /^BV[A-Za-z0-9]{10}$/
const AV_ID_PATTERN = /^av(\d+)$/i
const EP_ID_PATTERN = /^ep(\d+)$/i

const BILIBILI_HOSTS = new Set([
  'bilibili.com',
  'www.bilibili.com',
  'm.bilibili.com',
])

function parseTime(value) {
  if (!value) return 0

  if (/^\d+$/.test(value)) {
    return Number(value)
  }

  const match = value.toLowerCase().match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/)
  if (!match || !match.slice(1).some(Boolean)) return 0

  return Number(match[1] || 0) * 3600
    + Number(match[2] || 0) * 60
    + Number(match[3] || 0)
}

function getStartSeconds(url) {
  const hashParams = new URLSearchParams(url.hash.replace(/^#/, ''))
  return parseTime(url.searchParams.get('t') || hashParams.get('t'))
}

function getPage(url) {
  const value = Number(url.searchParams.get('p') || url.searchParams.get('page') || 1)
  return Number.isInteger(value) && value > 0 ? value : 1
}

function createWatchUrl(idType, videoId, page, startSeconds) {
  let url
  if (idType === 'episodeId') {
    url = new URL(`https://www.bilibili.com/bangumi/play/ep${videoId}`)
  } else {
    const pathId = idType === 'aid' ? `av${videoId}` : videoId
    url = new URL(`https://www.bilibili.com/video/${pathId}`)
    if (page > 1) url.searchParams.set('p', String(page))
  }

  if (startSeconds > 0) url.searchParams.set('t', String(startSeconds))
  return url.toString()
}

function parsedResult(idType, videoId, url) {
  const page = getPage(url)
  const startSeconds = getStartSeconds(url)

  return {
    provider: 'bilibili',
    providerName: 'Bilibili',
    idType,
    videoId,
    page,
    startSeconds,
    watchUrl: createWatchUrl(idType, videoId, page, startSeconds),
  }
}

function parsePathId(value, url) {
  if (BV_ID_PATTERN.test(value)) {
    return parsedResult('bvid', value, url)
  }

  const avMatch = value.match(AV_ID_PATTERN)
  if (avMatch) {
    return parsedResult('aid', avMatch[1], url)
  }

  const epMatch = value.match(EP_ID_PATTERN)
  if (epMatch) {
    return parsedResult('episodeId', epMatch[1], url)
  }

  return null
}

export function isBilibiliHostname(hostname) {
  return BILIBILI_HOSTS.has(hostname)
    || hostname === 'player.bilibili.com'
    || hostname === 'b23.tv'
}

export function parseBilibiliUrl(value) {
  const input = value.trim()
  if (!input) {
    throw new Error('请输入 Bilibili 视频链接')
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
  if (!isBilibiliHostname(hostname)) {
    throw new Error('只支持 Bilibili 链接')
  }

  const pathParts = url.pathname.split('/').filter(Boolean)

  if (hostname === 'player.bilibili.com') {
    const bvid = url.searchParams.get('bvid') || ''
    if (BV_ID_PATTERN.test(bvid)) {
      return parsedResult('bvid', bvid, url)
    }

    const aid = url.searchParams.get('aid') || ''
    if (/^\d+$/.test(aid)) {
      return parsedResult('aid', aid, url)
    }

    const episodeId = url.searchParams.get('episodeId') || ''
    if (/^\d+$/.test(episodeId)) {
      return parsedResult('episodeId', episodeId, url)
    }
  } else if (hostname === 'b23.tv') {
    const parsed = parsePathId(pathParts[0] || '', url)
    if (parsed) return parsed
    throw new Error('此 b23.tv 短链接无法直接解析，请粘贴展开后的 Bilibili 链接')
  } else if (BILIBILI_HOSTS.has(hostname)) {
    if (pathParts[0] === 'video') {
      const parsed = parsePathId(pathParts[1] || '', url)
      if (parsed && parsed.idType !== 'episodeId') return parsed
    }

    if (pathParts[0] === 'bangumi' && pathParts[1] === 'play') {
      const parsed = parsePathId(pathParts[2] || '', url)
      if (parsed?.idType === 'episodeId') return parsed
    }
  }

  throw new Error('链接中没有有效的 Bilibili 视频 ID')
}
