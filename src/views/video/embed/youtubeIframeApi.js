const apiPromises = new WeakMap()

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
