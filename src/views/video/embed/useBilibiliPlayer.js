import { ref } from 'vue'
import { createBilibiliIframe } from './bilibiliIframe.js'

export function useBilibiliPlayer(containerRef) {
  const status = ref('idle')
  const errorMessage = ref('')
  let iframe = null
  let loadVersion = 0

  async function load(video, options = {}) {
    const version = ++loadVersion
    errorMessage.value = ''
    status.value = 'loading'
    iframe?.remove()
    iframe = null

    const host = containerRef.value
    if (!host) {
      status.value = 'error'
      throw new Error('播放器容器尚未就绪')
    }
    host.replaceChildren()

    const nextIframe = createBilibiliIframe(window, video, options)
    iframe = nextIframe

    try {
      await new Promise((resolve, reject) => {
        const handleLoad = () => {
          clearTimeout(timeoutTimer)
          resolve()
        }
        const handleError = () => {
          clearTimeout(timeoutTimer)
          reject(new Error('Bilibili 播放器加载失败，请检查网络连接'))
        }
        const timeoutTimer = setTimeout(() => {
          nextIframe.removeEventListener('load', handleLoad)
          nextIframe.removeEventListener('error', handleError)
          reject(new Error('Bilibili 播放器加载超时，请稍后重试'))
        }, 15000)

        nextIframe.addEventListener('load', handleLoad, { once: true })
        nextIframe.addEventListener('error', handleError, { once: true })
        host.append(nextIframe)
      })

      if (version === loadVersion) status.value = 'ready'
    } catch (error) {
      if (version === loadVersion) {
        status.value = 'error'
        errorMessage.value = error instanceof Error ? error.message : '播放器加载失败'
      }
      throw error
    }
  }

  function suspend() {
    loadVersion++
    iframe?.remove()
    iframe = null
    containerRef.value?.replaceChildren()
    status.value = 'paused'
  }

  function destroy() {
    loadVersion++
    iframe?.remove()
    iframe = null
    containerRef.value?.replaceChildren()
    status.value = 'idle'
    errorMessage.value = ''
  }

  return {
    status,
    errorMessage,
    load,
    suspend,
    destroy,
  }
}
