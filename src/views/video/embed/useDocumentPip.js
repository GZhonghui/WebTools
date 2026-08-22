import { ref } from 'vue'
import { createPipPlayer } from './pipPlayerFactory.js'
import { YOUTUBE_PLAYER_STATE } from './useYouTubePlayer.js'

export function useDocumentPip(mainPlayer) {
  const supported = ref(
    'documentPictureInPicture' in window
      && window.top === window
      && window.isSecureContext,
  )
  const active = ref(false)
  const errorMessage = ref('')
  let currentSession = null
  let disposed = false

  function updateLastKnownState(session) {
    try {
      const seconds = Number(session.player?.getCurrentTime?.())
      const state = Number(session.player?.getPlayerState?.())
      if (Number.isFinite(seconds)) session.lastTime = seconds
      if (Number.isFinite(state)) session.lastState = state
    } catch {
      // The PiP document may already be gone.
    }
  }

  function finishSession(session, restore = true) {
    if (session.finished) return
    session.finished = true
    clearInterval(session.syncTimer)
    updateLastKnownState(session)

    try {
      session.player?.destroy?.()
    } catch {
      // Nothing else is needed when the PiP document is closing.
    }

    if (currentSession === session) {
      currentSession = null
      active.value = false
    }

    if (!restore || disposed) return

    mainPlayer.seekTo(session.lastTime)
    if ([YOUTUBE_PLAYER_STATE.PLAYING, YOUTUBE_PLAYER_STATE.BUFFERING].includes(session.lastState)) {
      mainPlayer.play()
    } else {
      mainPlayer.pause()
    }
  }

  async function toggle(videoId) {
    errorMessage.value = ''

    if (currentSession && !currentSession.pipWindow.closed) {
      currentSession.pipWindow.close()
      return
    }

    if (!supported.value) {
      errorMessage.value = '当前浏览器不支持页面内画中画'
      return
    }

    const lastTime = mainPlayer.getCurrentTime()
    const lastState = mainPlayer.getPlayerState()
    let pipWindow

    try {
      pipWindow = await window.documentPictureInPicture.requestWindow({
        width: 480,
        height: 270,
      })
    } catch (error) {
      errorMessage.value = error instanceof Error ? error.message : '无法打开画中画窗口'
      return
    }

    const session = {
      pipWindow,
      player: null,
      lastTime,
      lastState,
      syncTimer: null,
      finished: false,
    }
    currentSession = session
    active.value = true
    mainPlayer.pause()

    pipWindow.addEventListener('pagehide', () => finishSession(session), { once: true })

    try {
      session.player = await createPipPlayer({
        pipWindow,
        videoId,
        startSeconds: lastTime,
        autoplay: lastState === YOUTUBE_PLAYER_STATE.PLAYING,
        onStateChange: (state) => {
          session.lastState = state
        },
        onError: (code) => {
          errorMessage.value = `画中画播放器发生错误（${code}）`
          if (!pipWindow.closed) pipWindow.close()
        },
      })

      if (session.finished) {
        session.player.destroy?.()
        return
      }

      session.syncTimer = setInterval(() => updateLastKnownState(session), 750)
    } catch (error) {
      errorMessage.value = error instanceof Error ? error.message : '画中画播放器加载失败'
      finishSession(session)
      if (!pipWindow.closed) pipWindow.close()
    }
  }

  function destroy() {
    disposed = true
    if (!currentSession) return

    const session = currentSession
    finishSession(session, false)
    if (!session.pipWindow.closed) session.pipWindow.close()
  }

  return {
    supported,
    active,
    errorMessage,
    toggle,
    destroy,
  }
}
