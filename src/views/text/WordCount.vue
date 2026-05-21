<script setup>
import { ref, computed } from 'vue'
import { setTitle } from '../../common.js'

setTitle('字数统计')

const inputText = ref('')

// 总字符数（含空白）
const totalChars = computed(() => inputText.value.length)

// 不含空白的字符数
const charsNoSpace = computed(() => inputText.value.replace(/\s/g, '').length)

// 中文字符数
const chineseChars = computed(() => {
  const matches = inputText.value.match(/[\u4e00-\u9fff\u3400-\u4dbf]/g)
  return matches ? matches.length : 0
})

// 英文单词数
const englishWords = computed(() => {
  const matches = inputText.value.match(/[a-zA-Z]+/g)
  return matches ? matches.length : 0
})

// 数字个数
const digitCount = computed(() => {
  const matches = inputText.value.match(/\d/g)
  return matches ? matches.length : 0
})

// 标点符号数
const punctuationCount = computed(() => {
  // 中英文标点
  const matches = inputText.value.match(/[，。！？；：、""''（）《》【】…—\-,.!?;:'"()\[\]{}<>\/\\@#$%^&*_+=~`|]/g)
  return matches ? matches.length : 0
})

// 行数
const lineCount = computed(() => {
  if (inputText.value.length === 0) return 0
  return inputText.value.split('\n').length
})

// 段落数（以空行分隔的非空段落）
const paragraphCount = computed(() => {
  if (inputText.value.trim().length === 0) return 0
  return inputText.value.split(/\n\s*\n/).filter(p => p.trim().length > 0).length
})

function clearText() {
  inputText.value = ''
}
</script>

<template>
  <h2 class="tool_title">字数统计</h2>
  <div>
    <textarea
      class="stranded-input"
      v-model="inputText"
      placeholder="在此输入或粘贴文本…"
      rows="10"
      style="width: calc(100vw - 64px); resize: vertical; font-size: 16px;"
    ></textarea>
    <br>
    <button class="stranded-button" @click="clearText">清空</button>

    <table style="margin-top: 16px; border-collapse: collapse; width: 100%; max-width: 480px;">
      <tbody>
        <tr>
          <td style="padding: 6px 12px; border-bottom: 1px solid #eee;">总字符数</td>
          <td style="padding: 6px 12px; border-bottom: 1px solid #eee; font-weight: bold; color: green;">{{ totalChars }}</td>
        </tr>
        <tr>
          <td style="padding: 6px 12px; border-bottom: 1px solid #eee;">字符数（不含空白）</td>
          <td style="padding: 6px 12px; border-bottom: 1px solid #eee; font-weight: bold; color: green;">{{ charsNoSpace }}</td>
        </tr>
        <tr>
          <td style="padding: 6px 12px; border-bottom: 1px solid #eee;">中文字符</td>
          <td style="padding: 6px 12px; border-bottom: 1px solid #eee; font-weight: bold; color: green;">{{ chineseChars }}</td>
        </tr>
        <tr>
          <td style="padding: 6px 12px; border-bottom: 1px solid #eee;">英文单词</td>
          <td style="padding: 6px 12px; border-bottom: 1px solid #eee; font-weight: bold; color: green;">{{ englishWords }}</td>
        </tr>
        <tr>
          <td style="padding: 6px 12px; border-bottom: 1px solid #eee;">数字</td>
          <td style="padding: 6px 12px; border-bottom: 1px solid #eee; font-weight: bold; color: green;">{{ digitCount }}</td>
        </tr>
        <tr>
          <td style="padding: 6px 12px; border-bottom: 1px solid #eee;">标点符号</td>
          <td style="padding: 6px 12px; border-bottom: 1px solid #eee; font-weight: bold; color: green;">{{ punctuationCount }}</td>
        </tr>
        <tr>
          <td style="padding: 6px 12px; border-bottom: 1px solid #eee;">行数</td>
          <td style="padding: 6px 12px; border-bottom: 1px solid #eee; font-weight: bold; color: green;">{{ lineCount }}</td>
        </tr>
        <tr>
          <td style="padding: 6px 12px;">段落数</td>
          <td style="padding: 6px 12px; font-weight: bold; color: green;">{{ paragraphCount }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
