<script setup>
import { ref, watch } from 'vue'
import QRCode from 'qrcode'
import { setTitle } from '../../common.js'
import { useCodeReader } from './readCodeImage.js'

setTitle('块码')
const { file, results, readMessage } = useCodeReader('QRCode', '二维码')

const text = ref('')
const size = ref(256)
const sizes = [128, 192, 256, 320, 512]
const imageUrl = ref('')
const error = ref('')

watch([text, size], async ([value, width], _, onCleanup) => {
  let current = true
  onCleanup(() => { current = false })
  imageUrl.value = ''
  error.value = ''
  if (!value) return

  try {
    const symbol = await QRCode.toCanvas(value, { scale: 1, margin: 4, errorCorrectionLevel: 'M' })
    if (!current) return
    const scale = Math.floor(width / symbol.width)
    if (scale < 1) {
      error.value = '当前尺寸容纳不下这些内容，请选择更大的尺寸。'
      return
    }

    // 每个模块占整数个像素，多余的空间留作白边。
    const side = symbol.width * scale
    const offset = Math.floor((width - side) / 2)
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = width
    const context = canvas.getContext('2d')
    context.fillStyle = '#fff'
    context.fillRect(0, 0, width, width)
    context.imageSmoothingEnabled = false
    context.drawImage(symbol, offset, offset, side, side)
    imageUrl.value = canvas.toDataURL('image/png')
  } catch {
    if (current) error.value = '内容超出二维码容量，请缩短后重试。'
  }
})
</script>

<template>
  <main>
    <h2 class="tool_title">块码</h2>

    <h3>生成二维码</h3>
    <p><label for="qr-text">文本或网址</label></p>
    <textarea id="qr-text" v-model="text" class="stranded-textarea" rows="3" cols="32"
      placeholder="输入文本或 https://example.com" spellcheck="false"></textarea>
    <p>
      <label for="qr-size">图片尺寸</label>
      <select id="qr-size" v-model.number="size">
        <option v-for="width in sizes" :key="width" :value="width">{{ width }} × {{ width }}</option>
      </select>
    </p>
    <p v-if="error" role="alert">{{ error }}</p>
    <template v-if="imageUrl">
      <p><img class="code-preview" :src="imageUrl" alt="生成的二维码"></p>
      <p><a :href="imageUrl" :download="`qrcode-${size}.png`">下载 PNG</a></p>
    </template>

    <h3>读取二维码</h3>
    <p><label for="code-file">选择本地图片</label></p>
    <input id="code-file" type="file" accept="image/*" @change="file = $event.target.files[0] ?? null">
    <div role="status">
      <p v-if="readMessage">{{ readMessage }}</p>
      <p v-if="results.length">
        <label for="qr-result">读取结果</label><br>
        <textarea id="qr-result" class="stranded-textarea" rows="3" cols="32" :value="results[0].text" readonly></textarea>
      </p>
    </div>
  </main>
</template>
