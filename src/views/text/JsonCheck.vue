<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { createEditor } from 'prism-code-editor'
import { insertText } from 'prism-code-editor/utils'
import 'prism-code-editor/prism/languages/json'
import 'prism-code-editor/layout.css'
import 'prism-code-editor/themes/github-light.css'
import { format, printParseErrorCode, visit } from 'jsonc-parser'
import { setTitle } from '../../common.js'

setTitle('JSON 检查')

const editorHost = ref(null)
const message = ref('')
let editor

onMounted(() => {
  editor = createEditor(editorHost.value, {
    language: 'json',
    lineNumbers: true,
    onUpdate: () => { message.value = '' },
  })
  editor.textarea.id = 'json-input'
})

onBeforeUnmount(() => editor?.remove())

const reasons = {
  InvalidSymbol: '有无法识别的符号',
  InvalidNumberFormat: '数字格式有误',
  PropertyNameExpected: '此处需要用双引号包裹的属性名',
  ValueExpected: '此处需要一个 JSON 值',
  ColonExpected: '属性名后缺少冒号',
  CommaExpected: '相邻项之间缺少逗号',
  CloseBraceExpected: '对象缺少右花括号 }',
  CloseBracketExpected: '数组缺少右方括号 ]',
  EndOfFileExpected: '根值后还有多余内容',
  InvalidCommentToken: '请移除 JSON 中的注释',
  UnexpectedEndOfString: '字符串缺少结束双引号',
  UnexpectedEndOfNumber: '数字不完整',
  InvalidUnicode: 'Unicode 转义需要四位十六进制数字',
  InvalidEscapeCharacter: '字符串中有无效的转义',
  InvalidCharacter: '字符串中有未转义的控制字符',
}

function showSyntaxError(text, nativeError) {
  let first
  try {
    visit(text, {
      onError(code, offset, length, line, column) {
        first ??= { code, offset, length, line, column }
      },
    }, { disallowComments: true, allowTrailingComma: false })
  } catch {
    // 嵌套过深时，诊断器可能无法定位，仍可显示浏览器的报错。
  }
  if (!first) {
    message.value = `JSON 语法错误。${nativeError.message}`
    return
  }

  const reason = reasons[printParseErrorCode(first.code)] || '语法有误'
  message.value = `第 ${first.line + 1} 行，第 ${first.column + 1} 列，${reason}。`
  editor.textarea.focus({ preventScroll: true })
  editor.textarea.setSelectionRange(first.offset, first.offset + first.length)
  editor.lines[first.line + 1]?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
}

function checkJson() {
  const text = editor.value
  if (/^[ \t\r\n]*$/.test(text)) {
    message.value = '请先输入或粘贴 JSON。'
    editor.textarea.focus()
    return false
  }
  try {
    JSON.parse(text)
  } catch (error) {
    showSyntaxError(text, error)
    return false
  }
  message.value = 'JSON 语法正确。'
  return true
}

function formatJson() {
  if (!checkJson()) return
  const text = editor.value
  try {
    const edits = format(text, undefined, { insertSpaces: true, tabSize: 2, eol: '\n' })
    if (edits.length) {
      // 按原文顺序一次拼接空白修改，保留数字、键顺序和字符串的原始写法。
      const parts = []
      let start = 0
      for (const { offset, length, content } of edits) {
        parts.push(text.slice(start, offset), content)
        start = offset + length
      }
      parts.push(text.slice(start))
      insertText(editor, parts.join(''), 0, text.length, 0)
    }
    message.value = '已按两个空格缩进格式化。'
  } catch {
    message.value = '未能完成格式化。'
  }
}
</script>

<template>
  <h2 class="tool_title">JSON 检查</h2>
  <p><label for="json-input">输入或粘贴 JSON</label></p>
  <div ref="editorHost" class="stranded-textarea json-editor"></div>
  <p>
    <button type="button" class="stranded-button" @click="checkJson">检查</button>
    <button type="button" class="stranded-button" @click="formatJson">格式化</button>
  </p>
  <p role="status">{{ message }}</p>
</template>

<style scoped>
.json-editor :deep(.prism-code-editor) {
  height: 20rem;
  resize: vertical;
  border: 1px solid #999;
}
</style>
