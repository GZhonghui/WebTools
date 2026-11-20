<script setup>
import { computed, ref } from 'vue'
import JsBarcode from 'jsbarcode'
import { setTitle } from '../../common.js'
import { useCodeReader } from './readCodeImage.js'

setTitle('条码')
const { file, results, readMessage } = useCodeReader('AllLinear', '条形码')

const formats = [
  { id: 'CODE128', name: 'Code 128', example: 'BOX-001' },
  { id: 'EAN13', name: 'EAN-13', example: '690123456789', digits: 13 },
  { id: 'EAN8', name: 'EAN-8', example: '1234567', digits: 8 },
  { id: 'UPC', name: 'UPC-A', example: '03600029145', digits: 12 },
]
const format = ref(formats[0])
const text = ref('')
const hint = computed(() => format.value.digits
  ? `输入 ${format.value.digits - 1} 位数字可自动补齐校验位，也可输入完整的 ${format.value.digits} 位数字。`
  : '支持英文字母、数字、空格和半角符号。')

const preview = computed(() => {
  if (!text.value) return {}
  if (format.value.id === 'CODE128' && /[^\x20-\x7e]/.test(text.value)) {
    return { error: '请输入可打印的 ASCII 字符。含中文的内容请使用「块码」。' }
  }
  try {
    const canvas = document.createElement('canvas')
    JsBarcode(canvas, text.value, { format: format.value.id, width: 2, height: 80, margin: 24 })
    const url = canvas.toDataURL('image/png')
    return url === 'data:,' ? { error: '条形码过长，请缩短内容。' } : { url }
  } catch {
    return { error: format.value.digits ? '请检查数字位数和末位校验码。' : '无法生成条形码，请检查或缩短内容。' }
  }
})
</script>

<template>
  <main>
    <h2 class="tool_title">条码</h2>

    <h3>生成条形码</h3>
    <p>
      <label for="barcode-format">编码格式</label>
      <select id="barcode-format" v-model="format">
        <option v-for="option in formats" :key="option.id" :value="option">{{ option.name }}</option>
      </select>
    </p>
    <p>
      <label for="barcode-text">条形码内容</label>
      <input id="barcode-text" v-model="text" class="stranded-input" type="text"
        :inputmode="format.digits ? 'numeric' : 'text'" :placeholder="`例如 ${format.example}`"
        autocomplete="off" spellcheck="false" aria-describedby="barcode-hint">
    </p>
    <p id="barcode-hint">{{ hint }}</p>
    <p v-if="preview.error" role="alert">{{ preview.error }}</p>
    <template v-if="preview.url">
      <p><img class="code-preview" :src="preview.url" alt="生成的条形码"></p>
      <p><a :href="preview.url" download="barcode.png">下载 PNG</a></p>
    </template>

    <h3>读取条形码</h3>
    <p><label for="code-file">选择本地图片</label></p>
    <input id="code-file" type="file" accept="image/*" @change="file = $event.target.files[0] ?? null">
    <div role="status">
      <p v-if="readMessage">{{ readMessage }}</p>
      <p v-for="result in results" :key="result.label">
        <label>
          {{ result.label || '读取结果' }}<br>
          <textarea class="stranded-textarea" rows="2" cols="32" :value="result.text" readonly></textarea>
        </label>
      </p>
    </div>
  </main>
</template>
