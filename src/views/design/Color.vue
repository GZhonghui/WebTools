<script setup>
import { computed, ref, watch } from 'vue'
import { setTitle } from '../../common.js'
import { colorValues, grayscaleColor, invertColor, normalizeHex, parseColorValue } from './color.js'

setTitle('调色')

const formats = [
  { key: 'hex', label: 'HEX', example: '#336699', hint: 'HEX 需要 3、4、6 或 8 位十六进制数字。' },
  { key: 'rgb', label: 'RGB', example: 'rgb(51, 102, 153)', hint: 'RGB 通道范围为 0–255 或 0%–100%，可选透明度为 0–1 或百分比。' },
  { key: 'hsl', label: 'HSL', example: 'hsl(210, 50%, 40%)', hint: '请输入色相、饱和度和亮度，例如 hsl(210, 50%, 40%)。' },
]
const slotNames = ['A', 'B', 'C']
const sessionKey = 'webtools.design.color'
const historyLimit = 8

function readSession() {
  let saved
  try {
    saved = JSON.parse(sessionStorage.getItem(sessionKey))
  } catch {
    // 存储不可用时仍可在页面内调色。
  }
  const colors = Array.isArray(saved?.recent) ? saved.recent.map(normalizeHex).filter(Boolean) : []
  return {
    recent: [...new Set(colors)].slice(0, historyLimit),
    slots: Object.fromEntries(slotNames.map(name => [name, normalizeHex(saved?.slots?.[name])])),
  }
}

const saved = readSession()
const history = ref(saved.recent)
const slots = ref(saved.slots)
const current = ref(history.value[0] ?? '#336699')
const draft = ref(null)
const values = computed(() => current.value ? colorValues(current.value) : {})

function withRecent(hex, colors) {
  if (colors[0] === hex) return colors
  return [hex, ...colors.filter(color => color !== hex)].slice(0, historyLimit)
}

// 同一次输入或拖动只占一个历史位置，确认后再纳入下一次编辑的历史。
const recent = computed(() => draft.value && current.value ? withRecent(current.value, history.value) : history.value)

watch([recent, slots], ([colors, comparison]) => {
  try {
    sessionStorage.setItem(sessionKey, JSON.stringify({ recent: colors, slots: comparison }))
  } catch {
    // 内存中的历史和对比色仍然可用。
  }
})

function edit(format, text) {
  draft.value = { format, text }
  current.value = parseColorValue(format, text)
}

function rememberBeforeReplacement(event) {
  const field = event.target
  if (draft.value && current.value && field.selectionStart === 0 && field.selectionEnd === field.value.length) {
    history.value = recent.value
  }
}

function finishEdit() {
  if (draft.value && current.value) {
    history.value = recent.value
    draft.value = null
  }
}

function choose(hex) {
  finishEdit()
  draft.value = null
  current.value = hex
  history.value = withRecent(hex, history.value)
}

function pick(event) {
  // 原生选色器提供 RGB，沿用当前颜色的透明度。
  edit('hex', event.target.value + (current.value?.slice(7) ?? ''))
  if (event.type === 'change') finishEdit()
}

function assign(name) {
  choose(current.value)
  slots.value = { ...slots.value, [name]: current.value }
}
</script>

<template>
  <div class="color-tool">
    <h2 class="tool_title">调色</h2>
    <div class="editor">
      <div class="color-fields">
        <template v-for="format in formats" :key="format.key">
          <label :for="`color-${format.key}`">{{ format.label }}</label>
          <input
            :id="`color-${format.key}`" class="stranded-input" type="text" size="32"
            :placeholder="format.example" autocomplete="off" spellcheck="false"
            :value="draft?.format === format.key ? draft.text : values[format.key] ?? ''"
            :aria-invalid="draft?.format === format.key && !current"
            :aria-describedby="draft?.format === format.key && !current ? 'color-error' : undefined"
            @beforeinput="rememberBeforeReplacement" @input="edit(format.key, $event.target.value)"
            @blur="finishEdit" @keydown.enter.prevent="finishEdit"
          >
        </template>
      </div>
      <label class="picker">
        当前颜色（点击选色）
        <span class="swatch" :style="{ '--color': current }">
          <input type="color" aria-label="选色器" :value="current?.slice(0, 7) ?? '#000000'" @input="pick" @change="pick">
        </span>
      </label>
    </div>
    <p v-if="!current && draft" id="color-error" role="alert">{{ formats.find(format => format.key === draft.format).hint }}</p>
    <p>
      <button type="button" class="stranded-button" :disabled="!current" @click="choose(invertColor(current))">反色</button>
      <button type="button" class="stranded-button" :disabled="!current" @click="choose(grayscaleColor(current))">灰度</button>
    </p>

    <section aria-labelledby="comparison-title">
      <h3 id="comparison-title">颜色对比</h3>
      <div class="comparison">
        <div v-for="name in slotNames" :key="name">
          <div class="swatch" :style="{ '--color': slots[name] }"></div>
          <p><strong>{{ name }}</strong> <code>{{ slots[name] ?? '未设置' }}</code></p>
          <button type="button" class="stranded-button" :disabled="!current" @click="assign(name)">设为 {{ name }}</button>
        </div>
      </div>
    </section>

    <section aria-labelledby="recent-title">
      <h3 id="recent-title">最近颜色</h3>
      <p v-if="!recent.length">本标签页会保留最近 {{ historyLimit }} 个颜色，点击即可回选。</p>
      <button v-for="hex in recent" :key="hex" type="button" class="stranded-button recent-color" @click="choose(hex)">
        <span class="swatch" :style="{ '--color': hex }"></span><code>{{ hex }}</code>
      </button>
    </section>
  </div>
</template>

<style scoped>
.color-tool { max-width: 46rem; }
.editor { display: flex; align-items: center; flex-wrap: wrap; gap: 1rem; }
.color-fields { display: grid; grid-template-columns: max-content minmax(0, 1fr); align-items: center; }
.swatch {
  display: block;
  border: 1px solid #999;
  background: linear-gradient(var(--color, transparent), var(--color, transparent)),
    repeating-conic-gradient(#ddd 0 25%, white 0 50%) 0 0 / 16px 16px;
}
.picker .swatch { position: relative; height: 4.5rem; margin-top: .25rem; }
.picker input { position: absolute; inset: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer; }
.picker .swatch:focus-within { outline: 2px solid Highlight; }
.comparison { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: .5rem; }
.comparison .swatch { height: 6rem; }
.comparison p { margin: .4rem 0; }
.recent-color { display: inline-flex; align-items: center; gap: .4rem; }
.recent-color .swatch { width: 1.1rem; height: 1.1rem; }
</style>
