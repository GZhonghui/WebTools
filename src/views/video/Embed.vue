<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { setTitle } from '../../common.js'
import { useDocumentPip } from './embed/useDocumentPip.js'
import { useVideoPlayer } from './embed/useVideoPlayer.js'
import { parseVideoId, parseVideoUrl } from './embed/videoUrl.js'

setTitle('视频嵌入')

const route = useRoute()
const input = ref('')
const playerHost = ref(null)
const parsedVideo = ref(null)
const inputError = ref('')
const isPasting = ref(false)
const userscriptUrl = new URL(
  `${import.meta.env.BASE_URL}userscripts/video-embed.user.js`,
  window.location.origin,
).toString()

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

const canControlPlayback = computed(() => (
  parsedVideo.value?.provider === 'youtube'
    && canUsePlayer.value
    && !pip.active.value
))

const isPlaying = computed(() => (
  ['playing', 'buffering'].includes(player.status.value)
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

async function loadVideo(parsed) {
  parsedVideo.value = parsed
  try {
    await player.load(parsed)
  } catch {
    // The player exposes a concise, user-facing error message.
  }
}

async function embedVideo() {
  inputError.value = ''
  pip.errorMessage.value = ''

  if (pip.active.value) {
    inputError.value = '请先关闭画中画窗口'
    return
  }

  try {
    await loadVideo(parseVideoUrl(input.value))
  } catch (error) {
    inputError.value = error instanceof Error ? error.message : '无法识别此链接'
  }
}

function togglePlayback() {
  if (!canControlPlayback.value) return
  if (isPlaying.value) {
    player.pause()
  } else {
    player.play()
  }
}

function getQueryValue(name) {
  const value = route.query[name]
  if (!Array.isArray(value)) return value
  return value.find((item) => typeof item === 'string' && item.trim())
}

async function embedVideoFromQuery() {
  const site = getQueryValue('site')
  const id = getQueryValue('id')

  if (site != null || id != null) {
    inputError.value = ''
    pip.errorMessage.value = ''

    if (pip.active.value) {
      inputError.value = '请先关闭画中画窗口'
      return
    }

    try {
      const parsed = parseVideoId(site, id, {
        page: getQueryValue('p'),
        start: getQueryValue('t'),
      })
      input.value = parsed.watchUrl
      await loadVideo(parsed)
    } catch (error) {
      inputError.value = error instanceof Error ? error.message : '无法识别 URL 参数'
    }
    return
  }
}

watch(
  () => [
    route.query.site,
    route.query.id,
    route.query.p,
    route.query.t,
  ],
  embedVideoFromQuery,
)

onMounted(() => {
  embedVideoFromQuery()
})

onBeforeUnmount(() => {
  pip.destroy()
  player.destroy()
})
</script>

<template>
  <h2 class="tool_title">视频嵌入</h2>

  <section class="userscript-card" aria-labelledby="userscript-title">
    <div>
      <strong id="userscript-title">在视频页面一键打开</strong>
      <p>
        已安装 Tampermonkey？安装脚本后，YouTube 和 Bilibili 视频页面右上角会显示“嵌入播放”按钮。
      </p>
    </div>
    <div class="userscript-actions">
      <a
        class="userscript-store-link"
        href="https://chromewebstore.google.com/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo"
        target="_blank"
        rel="noopener noreferrer"
      >
        获取 Tampermonkey
      </a>
      <a
        class="stranded-button userscript-install-button"
        :href="userscriptUrl"
        title="安装 WebTools 视频嵌入油猴脚本"
      >
        安装油猴脚本
      </a>
    </div>
  </section>

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
      v-if="parsedVideo.provider === 'youtube'"
      class="stranded-button"
      type="button"
      :disabled="!canControlPlayback"
      @click="togglePlayback"
    >
      {{ isPlaying ? '暂停' : '播放' }}
    </button>

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

    <p v-if="parsedVideo.provider === 'bilibili'">
      Bilibili 外链播放器没有公开的播放控制和进度接口；请使用播放器自带的播放栏。
      <span v-if="pip.supported.value">切换页面内画中画时会从链接指定的时间重新载入。</span>
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
.userscript-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  width: min(100%, 720px);
  box-sizing: border-box;
  margin: 0 0 14px;
  padding: 14px 16px;
  border: 1px solid #ccc;
  border-radius: 8px;
  background: #f7f7f7;
}

.userscript-card p {
  margin: 6px 0 0;
  line-height: 1.5;
}

.userscript-actions {
  flex: none;
  display: flex;
  align-items: center;
  gap: 12px;
}

.userscript-store-link {
  white-space: nowrap;
}

.userscript-install-button {
  display: inline-block;
  box-sizing: border-box;
  padding: 9px 14px;
  border: 1px solid #222;
  border-radius: 5px;
  background: #fff;
  color: #111;
  text-decoration: none;
  white-space: nowrap;
}

.userscript-install-button:hover {
  background: #e9e9e9;
}

.video-player {
  width: min(100%, 720px);
  aspect-ratio: 16 / 9;
  margin-top: 10px;
  background: #000;
}

@media (max-width: 640px) {
  .userscript-card {
    align-items: flex-start;
    flex-direction: column;
    gap: 8px;
  }

  .userscript-actions {
    flex-wrap: wrap;
  }
}
</style>
