import { ref } from 'vue'
import { createYouTubeIframe, loadYouTubeIframeApi } from './youtubeIframeApi.js'

export const YOUTUBE_PLAYER_STATE = {
  UNSTARTED: -1,
  ENDED: 0,
  PLAYING: 1,
  PAUSED: 2,
  BUFFERING: 3,
  CUED: 5,
}

const ERROR_MESSAGES = {
  2: '视频 ID 无效',
  5: 'HTML5 播放器无法播放此视频',
  100: '视频不存在、已删除或设为私有',
  101: '视频所有者禁止在其他网站播放',
  150: '视频所有者禁止在其他网站播放',
  153: 'YouTube 无法确认当前页面来源',
}

function statusFromState(state) {
  switch (state) {
    case YOUTUBE_PLAYER_STATE.ENDED: return 'ended'
    case YOUTUBE_PLAYER_STATE.PLAYING: return 'playing'
    case YOUTUBE_PLAYER_STATE.PAUSED: return 'paused'
    case YOUTUBE_PLAYER_STATE.BUFFERING: return 'buffering'
    case YOUTUBE_PLAYER_STATE.CUED: return 'ready'
    default: return 'ready'
  }
}

export function useYouTubePlayer(containerRef) {
  const status = ref('idle')
  const errorMessage = ref('')
  let player = null
  let loadVersion = 0

  async function load(videoId, startSeconds = 0) {
    const version = ++loadVersion
    errorMessage.value = ''
    status.value = 'loading'

    if (player?.destroy) {
      player.destroy()
      player = null
    }

    const host = containerRef.value
    if (!host) {
      status.value = 'error'
      throw new Error('播放器容器尚未就绪')
    }
    host.replaceChildren()

    try {
      const YT = await loadYouTubeIframeApi()
      if (version !== loadVersion) return

      const iframe = createYouTubeIframe(window, { videoId, startSeconds })
      host.append(iframe)

      await new Promise((resolve, reject) => {
        let ready = false

        player = new YT.Player(iframe, {
          events: {
            onReady: () => {
              if (version !== loadVersion) return
              ready = true
              status.value = 'ready'
              resolve()
            },
            onStateChange: (event) => {
              if (version === loadVersion) {
                status.value = statusFromState(event.data)
              }
            },
            onError: (event) => {
              if (version !== loadVersion) return
              const message = ERROR_MESSAGES[event.data] || `YouTube 播放错误（${event.data}）`
              errorMessage.value = message
              status.value = 'error'
              if (!ready) reject(new Error(message))
            },
          },
        })
      })
    } catch (error) {
      if (version === loadVersion) {
        status.value = 'error'
        errorMessage.value = error instanceof Error ? error.message : '播放器加载失败'
      }
      throw error
    }
  }

  function play() {
    player?.playVideo?.()
  }

  function pause() {
    player?.pauseVideo?.()
  }

  function seekTo(seconds) {
    player?.seekTo?.(seconds, true)
  }

  function getCurrentTime() {
    const seconds = Number(player?.getCurrentTime?.())
    return Number.isFinite(seconds) ? seconds : 0
  }

  function getPlayerState() {
    const state = Number(player?.getPlayerState?.())
    return Number.isFinite(state) ? state : YOUTUBE_PLAYER_STATE.UNSTARTED
  }

  function destroy() {
    loadVersion++
    player?.destroy?.()
    player = null
    containerRef.value?.replaceChildren()
    status.value = 'idle'
    errorMessage.value = ''
  }

  return {
    status,
    errorMessage,
    load,
    play,
    pause,
    seekTo,
    getCurrentTime,
    getPlayerState,
    destroy,
  }
}
