const apiPromises = new WeakMap()

export function createYouTubeIframe(targetWindow, {
  videoId,
  startSeconds = 0,
  autoplay = false,
  title = 'YouTube 视频播放器',
}) {
  const iframe = targetWindow.document.createElement('iframe')
  const embedUrl = new URL(`https://www.youtube.com/embed/${videoId}`)

  embedUrl.searchParams.set('enablejsapi', '1')
  embedUrl.searchParams.set('playsinline', '1')
  embedUrl.searchParams.set('autoplay', autoplay ? '1' : '0')
  embedUrl.searchParams.set('start', String(Math.floor(startSeconds)))

  if (window.location.origin !== 'null') {
    embedUrl.searchParams.set('origin', window.location.origin)
  }
  embedUrl.searchParams.set('widget_referrer', window.location.href)

  // Set the referrer policy before src/DOM insertion so it applies to the
  // very first YouTube request. This is required to avoid player error 153.
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

export function loadYouTubeIframeApi(targetWindow = window) {
  if (targetWindow.YT?.Player) {
    return Promise.resolve(targetWindow.YT)
  }

  if (apiPromises.has(targetWindow)) {
    return apiPromises.get(targetWindow)
  }

  const promise = new Promise((resolve, reject) => {
    const targetDocument = targetWindow.document
    const previousCallback = targetWindow.onYouTubeIframeAPIReady
    let settled = false

    const finish = () => {
      if (settled || !targetWindow.YT?.Player) return
      settled = true
      clearInterval(checkTimer)
      clearTimeout(timeoutTimer)
      resolve(targetWindow.YT)
    }

    targetWindow.onYouTubeIframeAPIReady = () => {
      try {
        if (typeof previousCallback === 'function') {
          previousCallback()
        }
      } finally {
        finish()
      }
    }

    let script = targetDocument.querySelector('script[src="https://www.youtube.com/iframe_api"]')
    if (!script) {
      script = targetDocument.createElement('script')
      script.src = 'https://www.youtube.com/iframe_api'
      script.async = true
      targetDocument.head.append(script)
    }

    script.addEventListener('error', () => {
      if (settled) return
      settled = true
      clearInterval(checkTimer)
      clearTimeout(timeoutTimer)
      apiPromises.delete(targetWindow)
      reject(new Error('YouTube 播放器加载失败，请检查网络连接'))
    }, { once: true })

    const checkTimer = setInterval(finish, 100)
    const timeoutTimer = setTimeout(() => {
      if (settled) return
      settled = true
      clearInterval(checkTimer)
      apiPromises.delete(targetWindow)
      reject(new Error('YouTube 播放器加载超时，请稍后重试'))
    }, 15000)

    finish()
  })

  apiPromises.set(targetWindow, promise)
  return promise
}
