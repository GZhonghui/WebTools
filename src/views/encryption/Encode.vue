<script setup>
import { onBeforeUnmount, ref, shallowRef } from 'vue'
import { setTitle } from '../../common.js'

setTitle('编解码')

const format = ref('Base64')
const plainText = ref('')
const encodedText = ref('')
const errorMessage = ref('')
const activeWorker = shallowRef(null)

function stopWorker() {
  const worker = activeWorker.value
  if (!worker) return
  worker.onmessage = null
  worker.onerror = null
  worker.terminate()
  activeWorker.value = null
}

function resetConversion() {
  stopWorker()
  errorMessage.value = ''
}

function showFailure() {
  stopWorker()
  errorMessage.value = '转换未能完成，请重试。'
}

function convert(action) {
  resetConversion()
  const [source, destination] = action === 'encode' ? [plainText, encodedText] : [encodedText, plainText]
  try {
    const worker = new Worker(new URL('./encode.worker.js', import.meta.url), { type: 'module' })
    activeWorker.value = worker
    worker.onmessage = ({ data }) => {
      stopWorker()
      if (data.error) {
        errorMessage.value = data.error
      } else {
        destination.value = data.result
      }
    }
    worker.onerror = showFailure
    worker.postMessage({ action, format: format.value, input: source.value })
  } catch {
    showFailure()
  }
}

onBeforeUnmount(stopWorker)
</script>

<template>
  <h2 class="tool_title">编解码</h2>
  <label for="encode-plain">原文（UTF-8）</label>
  <textarea
    id="encode-plain" v-model="plainText" class="stranded-textarea" rows="6" cols="72"
    spellcheck="false" @input="resetConversion"
  ></textarea>
  <p>
    <button type="button" class="stranded-button" :disabled="!plainText || activeWorker" @click="convert('encode')">
      编码 <span aria-hidden="true">↓</span>
    </button>
    <button type="button" class="stranded-button" :disabled="!encodedText || activeWorker" @click="convert('decode')">
      解码 <span aria-hidden="true">↑</span>
    </button>
    <label for="encode-format">编码格式</label>
    <select id="encode-format" v-model="format" class="stranded-input" @change="resetConversion">
      <option>Base64</option>
      <option value="Base16">Base16（十六进制）</option>
      <option>Base32</option>
      <option value="Base58">Base58（Bitcoin）</option>
      <option value="Base85">Base85（Ascii85）</option>
    </select>
    <span v-if="activeWorker" role="status">正在转换…</span>
    <span v-else-if="errorMessage" role="alert">{{ errorMessage }}</span>
  </p>
  <label for="encode-encoded">编码文本</label>
  <textarea
    id="encode-encoded" v-model="encodedText" class="stranded-textarea" rows="6" cols="72"
    spellcheck="false" @input="resetConversion"
  ></textarea>
</template>

<style scoped>
textarea {
  display: block;
  box-sizing: border-box;
  max-width: 100%;
}
</style>
