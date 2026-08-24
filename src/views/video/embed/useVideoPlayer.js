import { computed, ref } from 'vue'
import { useBilibiliPlayer } from './useBilibiliPlayer.js'
import { useYouTubePlayer, YOUTUBE_PLAYER_STATE } from './useYouTubePlayer.js'

export function useVideoPlayer(containerRef) {
  const activeProvider = ref(null)
  const youtube = useYouTubePlayer(containerRef)
  const bilibili = useBilibiliPlayer(containerRef)

  const activePlayer = computed(() => {
    if (activeProvider.value === 'youtube') return youtube
    if (activeProvider.value === 'bilibili') return bilibili
    return null
  })

  const status = computed(() => activePlayer.value?.status.value || 'idle')
  const errorMessage = computed(() => activePlayer.value?.errorMessage.value || '')

  async function load(video, options = {}) {
    if (video.provider !== activeProvider.value) {
      youtube.destroy()
      bilibili.destroy()
      activeProvider.value = video.provider
    }

    if (video.provider === 'youtube') {
      return youtube.load(video.videoId, options.startSeconds ?? video.startSeconds)
    }
    return bilibili.load(video, options)
  }

  function play() {
    if (activeProvider.value === 'youtube') youtube.play()
  }

  function pause() {
    if (activeProvider.value === 'youtube') youtube.pause()
  }

  function suspend() {
    if (activeProvider.value === 'bilibili') {
      bilibili.suspend()
    } else {
      youtube.pause()
    }
  }

  function seekTo(seconds) {
    if (activeProvider.value === 'youtube') youtube.seekTo(seconds)
  }

  function getCurrentTime() {
    // Bilibili's public external-player interface only exposes URL options,
    // so its current playback position cannot be queried cross-origin.
    return activeProvider.value === 'youtube' ? youtube.getCurrentTime() : 0
  }

  function getPlayerState() {
    return activeProvider.value === 'youtube'
      ? youtube.getPlayerState()
      : YOUTUBE_PLAYER_STATE.UNSTARTED
  }

  function destroy() {
    youtube.destroy()
    bilibili.destroy()
    activeProvider.value = null
  }

  return {
    activeProvider,
    status,
    errorMessage,
    load,
    play,
    pause,
    suspend,
    seekTo,
    getCurrentTime,
    getPlayerState,
    destroy,
  }
}
