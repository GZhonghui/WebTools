const VIDEO_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/

const YOUTUBE_HOSTS = new Set([
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'music.youtube.com',
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
  const value = url.searchParams.get('t')
    || url.searchParams.get('start')
    || hashParams.get('t')

  return parseTime(value)
}

export function parseYouTubeUrl(value) {
  const input = value.trim()
  if (!input) {
    throw new Error('请输入 YouTube 视频链接')
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
  const pathParts = url.pathname.split('/').filter(Boolean)
  let videoId = ''

  if (hostname === 'youtu.be') {
    videoId = pathParts[0] || ''
  } else if (YOUTUBE_HOSTS.has(hostname)) {
    if (pathParts[0] === 'watch') {
      videoId = url.searchParams.get('v') || ''
    } else if (['shorts', 'live', 'embed'].includes(pathParts[0])) {
      videoId = pathParts[1] || ''
    }
  } else {
    throw new Error('只支持 YouTube 链接')
  }

  if (!VIDEO_ID_PATTERN.test(videoId)) {
    throw new Error('链接中没有有效的 YouTube 视频 ID')
  }

  return {
    videoId,
    startSeconds: getStartSeconds(url),
    watchUrl: `https://www.youtube.com/watch?v=${videoId}`,
  }
}
