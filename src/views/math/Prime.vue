<script setup>
import { ref } from 'vue'
import { setTitle } from '../../common.js'

setTitle('质数计算')

// 用户输入（number input 在部分场景会回传 number/null，统一按未知类型处理）
const inputNumber = ref('')
// 结果文案：仅通过页面文本展示，不使用弹窗
const resultText = ref('')

/**
 * 判断一个整数是否为质数
 * 规则：
 * - 小于等于 1 不是质数
 * - 2 是质数
 * - 偶数（除 2 外）都不是质数
 * - 其余只需尝试到 sqrt(n)
 */
function isPrime(n) {
  if (n <= 1) return false
  if (n === 2) return true
  if (n % 2 === 0) return false

  for (let i = 3; i * i <= n; i += 2) {
    if (n % i === 0) {
      return false
    }
  }
  return true
}

function checkPrime() {
  // 兜底转换为字符串，避免 value 为 number/null 时调用 trim 报错
  const raw = String(inputNumber.value ?? '').trim()

  if (raw === '') {
    resultText.value = '请输入一个整数。'
    return
  }

  const n = Number(raw)
  // 仅接受有限整数（例如：3、17、100）
  if (!Number.isFinite(n) || !Number.isInteger(n)) {
    resultText.value = '请输入有效的整数。'
    return
  }

  resultText.value = isPrime(n)
    ? `${n} 是质数。`
    : `${n} 不是质数。`
}
</script>

<template>
  <h2 class="tool_title">质数计算</h2>
  <div>
    <label>输入数字</label>
    <input
      class="stranded-input"
      type="number"
      v-model="inputNumber"
      placeholder="例如：17"
    >
    <br>
    <button class="stranded-button" @click="checkPrime">判断</button>
    <p style="font-size: 24px; color: green;">{{ resultText }}</p>
  </div>
</template>
