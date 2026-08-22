import { loadYouTubeIframeApi } from './youtubeIframeApi.js'

function preparePipDocument(pipWindow) {
  const document = pipWindow.document
  document.title = 'YouTube 画中画'

  const viewport = document.createElement('meta')
  viewport.name = 'viewport'
  viewport.content = 'width=device-width, initial-scale=1'
  document.head.append(viewport)

  document.documentElement.style.width = '100%'
  document.documentElement.style.height = '100%'
  document.body.style.width = '100%'
  document.body.style.height = '100%'
  document.body.style.margin = '0'
  document.body.style.overflow = 'hidden'
  document.body.style.background = '#000'

  const mount = document.createElement('div')
  mount.style.width = '100%'
  mount.style.height = '100%'
  document.body.replaceChildren(mount)
  return mount
}

export async function createPipPlayer({
  pipWindow,
  videoId,
  startSeconds,
  autoplay,
  onStateChange,
  onError,
}) {
  const mount = preparePipDocument(pipWindow)
  const YT = await loadYouTubeIframeApi(pipWindow)

  if (pipWindow.closed) {
    throw new Error('画中画窗口已关闭')
  }

  return new Promise((resolve, reject) => {
    let ready = false
    const player = new YT.Player(mount, {
      width: '100%',
      height: '100%',
      videoId,
      playerVars: {
        enablejsapi: 1,
        playsinline: 1,
        autoplay: autoplay ? 1 : 0,
        start: Math.floor(startSeconds),
        origin: window.location.origin,
      },
      events: {
        onReady: () => {
          ready = true
          const iframe = player.getIframe?.()
          iframe?.setAttribute('allow', 'autoplay; encrypted-media; picture-in-picture; fullscreen')
          iframe?.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin')
          iframe?.setAttribute('title', 'YouTube 画中画播放器')
          resolve(player)
        },
        onStateChange: (event) => onStateChange?.(event.data),
        onError: (event) => {
          onError?.(event.data)
          if (!ready) reject(new Error(`画中画播放器加载失败（${event.data}）`))
        },
      },
    })
  })
}
