import { createYouTubeIframe, loadYouTubeIframeApi } from './youtubeIframeApi.js'

function preparePipDocument(pipWindow, playerOptions) {
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

  const referrer = document.createElement('meta')
  referrer.name = 'referrer'
  referrer.content = 'strict-origin-when-cross-origin'
  document.head.append(referrer)

  const iframe = createYouTubeIframe(pipWindow, {
    ...playerOptions,
    title: 'YouTube 画中画播放器',
  })
  document.body.replaceChildren(iframe)
  return iframe
}

export async function createPipPlayer({
  pipWindow,
  videoId,
  startSeconds,
  autoplay,
  onStateChange,
  onError,
}) {
  const iframe = preparePipDocument(pipWindow, {
    videoId,
    startSeconds,
    autoplay,
  })
  const YT = await loadYouTubeIframeApi(pipWindow)

  if (pipWindow.closed) {
    throw new Error('画中画窗口已关闭')
  }

  return new Promise((resolve, reject) => {
    let ready = false
    const player = new YT.Player(iframe, {
      events: {
        onReady: () => {
          ready = true
          resolve(player)
        },
        onStateChange: (event) => onStateChange?.(event.data),
        onError: (event) => {
          onError?.(event.data)
          if (!ready) {
            const message = event.data === 153
              ? 'YouTube 未收到画中画窗口的来源信息，请改用 Chrome 原生画中画'
              : `画中画播放器加载失败（${event.data}）`
            reject(new Error(message))
          }
        },
      },
    })
  })
}
