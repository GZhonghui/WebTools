export function createBilibiliIframe(targetWindow, video, {
  startSeconds = video.startSeconds,
  autoplay = false,
  title = 'Bilibili 视频播放器',
} = {}) {
  const iframe = targetWindow.document.createElement('iframe')
  const embedUrl = new URL('https://player.bilibili.com/player.html')

  embedUrl.searchParams.set(video.idType, video.videoId)
  if (video.idType !== 'episodeId') {
    embedUrl.searchParams.set('p', String(video.page))
  }
  embedUrl.searchParams.set('autoplay', autoplay ? '1' : '0')
  embedUrl.searchParams.set('poster', '1')
  embedUrl.searchParams.set('refer', '1')
  if (startSeconds > 0) {
    embedUrl.searchParams.set('t', String(Math.floor(startSeconds)))
  }

  iframe.referrerPolicy = 'strict-origin-when-cross-origin'
  iframe.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen'
  iframe.allowFullscreen = true
  iframe.title = title
  iframe.width = '100%'
  iframe.height = '100%'
  iframe.style.border = '0'
  iframe.src = embedUrl.toString()

  return iframe
}
