import { createYouTubeIframe, loadYouTubeIframeApi } from './youtubeIframeApi.js'
import pipHostUrl from './pipHost.html?url&no-inline'

function preparePipWindow(pipWindow) {
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

  const host = document.createElement('iframe')
  host.referrerPolicy = 'strict-origin-when-cross-origin'
  host.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen'
  host.title = 'YouTube 画中画宿主'
  host.width = '100%'
  host.height = '100%'
  host.style.border = '0'

  return new Promise((resolve, reject) => {
    let settled = false

    const cleanup = () => {
      clearTimeout(timeoutTimer)
      host.removeEventListener('load', handleLoad)
      host.removeEventListener('error', handleError)
      pipWindow.removeEventListener('pagehide', handleClose)
    }

    const fail = (message) => {
      if (settled) return
      settled = true
      cleanup()
      reject(new Error(message))
    }

    const handleLoad = () => {
      if (settled) return
      try {
        const hostWindow = host.contentWindow
        if (!hostWindow || hostWindow.location.origin !== window.location.origin) {
          fail('画中画宿主页未能从当前网站加载')
          return
        }
        settled = true
        cleanup()
        resolve(hostWindow)
      } catch {
        fail('无法访问画中画宿主页')
      }
    }

    const handleError = () => fail('画中画宿主页加载失败')
    const handleClose = () => fail('画中画窗口已关闭')
    const timeoutTimer = setTimeout(() => fail('画中画宿主页加载超时'), 10000)

    host.addEventListener('load', handleLoad)
    host.addEventListener('error', handleError)
    pipWindow.addEventListener('pagehide', handleClose, { once: true })
    host.src = pipHostUrl
    document.body.replaceChildren(host)
  })
}

export async function createPipPlayer({
  pipWindow,
  videoId,
  startSeconds,
  autoplay,
  onStateChange,
  onError,
}) {
  const hostWindow = await preparePipWindow(pipWindow)

  if (pipWindow.closed) {
    throw new Error('画中画窗口已关闭')
  }

  const hostDocument = hostWindow.document
  hostDocument.documentElement.style.width = '100%'
  hostDocument.documentElement.style.height = '100%'
  hostDocument.body.style.width = '100%'
  hostDocument.body.style.height = '100%'
  hostDocument.body.style.margin = '0'
  hostDocument.body.style.overflow = 'hidden'
  hostDocument.body.style.background = '#000'

  const iframe = createYouTubeIframe(hostWindow, {
    videoId,
    startSeconds,
    autoplay,
    title: 'YouTube 画中画播放器',
  })
  hostDocument.body.replaceChildren(iframe)

  const YT = await loadYouTubeIframeApi(hostWindow)

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
