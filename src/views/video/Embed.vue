<script setup>
import { computed, onBeforeUnmount, ref } from 'vue'
import { setTitle } from '../../common.js'
import { useDocumentPip } from './embed/useDocumentPip.js'
import { useVideoPlayer } from './embed/useVideoPlayer.js'
import { parseVideoUrl } from './embed/videoUrl.js'

setTitle('视频嵌入')

const input = ref('')
const playerHost = ref(null)
const parsedVideo = ref(null)
const inputError = ref('')
const isPasting = ref(false)

const player = useVideoPlayer(playerHost)
const pip = useDocumentPip(player)

const statusLabels = {
  loading: '载入中',
  ready: '就绪',
  playing: '播放中',
  paused: '已暂停',
  buffering: '缓冲中',
  ended: '已结束',
  error: '载入失败',
}

const canUsePlayer = computed(() => (
  parsedVideo.value
    && !['idle', 'loading', 'error'].includes(player.status.value)
))

const visibleError = computed(() => (
  inputError.value || player.errorMessage.value || pip.errorMessage.value
))

async function pasteFromClipboard() {
  inputError.value = ''

  if (!navigator.clipboard?.readText) {
    inputError.value = '当前浏览器不支持读取剪贴板，请手动粘贴链接'
    return
  }

  isPasting.value = true
  try {
    const text = (await navigator.clipboard.readText()).trim()
    if (!text) {
      inputError.value = '剪贴板中没有文本'
      return
    }
    input.value = text
  } catch {
    inputError.value = '无法读取剪贴板，请允许此网站访问剪贴板'
  } finally {
    isPasting.value = false
  }
}

async function embedVideo() {
  inputError.value = ''
  pip.errorMessage.value = ''

  if (pip.active.value) {
    inputError.value = '请先关闭画中画窗口'
    return
  }

  let parsed
  try {
    parsed = parseVideoUrl(input.value)
  } catch (error) {
    inputError.value = error instanceof Error ? error.message : '无法识别此链接'
    return
  }

  parsedVideo.value = parsed
  try {
    await player.load(parsed)
  } catch {
    // The player exposes a concise, user-facing error message.
  }
}

onBeforeUnmount(() => {
  pip.destroy()
  player.destroy()
})
</script>

<template>
  <h2 class="tool_title">视频嵌入</h2>

  <form @submit.prevent="embedVideo">
    <label for="video-url">视频链接</label>
    <input
      id="video-url"
      v-model="input"
      class="stranded-input"
      type="text"
      size="48"
      placeholder="YouTube 或 Bilibili 视频链接"
      autocomplete="off"
      spellcheck="false"
    >
    <button
      class="stranded-button"
      type="button"
      :disabled="isPasting"
      @click="pasteFromClipboard"
    >
      {{ isPasting ? '读取中' : '粘贴' }}
    </button>
    <button class="stranded-button" type="submit" :disabled="player.status.value === 'loading'">
      {{ player.status.value === 'loading' ? '载入中' : '嵌入' }}
    </button>
  </form>

  <p v-if="visibleError" role="alert">{{ visibleError }}</p>

  <div v-show="parsedVideo" ref="playerHost" class="video-player"></div>

  <template v-if="parsedVideo">
    <p>状态：{{ pip.active.value ? '画中画' : (statusLabels[player.status.value] || '等待播放') }}</p>

    <button
      v-if="pip.supported.value"
      class="stranded-button"
      type="button"
      :disabled="!canUsePlayer"
      @click="pip.toggle(parsedVideo)"
    >
      {{ pip.active.value ? '关闭画中画' : '画中画' }}
    </button>

    <a :href="parsedVideo.watchUrl" target="_blank" rel="noopener noreferrer">
      在 {{ parsedVideo.providerName }} 打开
    </a>

    <p v-if="parsedVideo.provider === 'bilibili' && pip.supported.value">
      Bilibili 外链播放器没有公开的播放进度接口；切换页面内画中画时会从链接指定的时间重新载入。
    </p>

    <p v-else-if="pip.supported.value">
      播放后，也可以从 Chrome 地址栏右侧的媒体控制进入原生画中画。
    </p>
    <p v-else>
      当前浏览器不支持页面内画中画；播放后可尝试使用 Chrome 的媒体控制。
    </p>
  </template>
</template>

<style scoped>
.video-player {
  width: min(100%, 720px);
  aspect-ratio: 16 / 9;
  margin-top: 10px;
  background: #000;
}
</style>
