<script setup>
import { computed, ref, watch } from 'vue'
import { setTitle } from '../../common.js'
import { bases, calculateRadix, formatRadix, parseRadix } from './radix.js'

setTitle('进制')

const conversions = ref({})
const conversionError = ref('')

function convertFrom(base, text) {
  const values = { [base]: text }
  conversionError.value = ''
  if (text.trim()) {
    try {
      const { numerator, denominator } = parseRadix(text, base)
      for (const target of bases) {
        if (target !== base) values[target] = formatRadix(numerator, denominator, target)
      }
    } catch (error) {
      conversionError.value = error.message
    }
  }
  conversions.value = values
}

const calculationBase = ref(10)
const left = ref('')
const right = ref('')
const operator = ref('+')
const calculation = ref(null)

function calculate() {
  try {
    calculation.value = calculateRadix(left.value, operator.value, right.value, calculationBase.value)
  } catch (error) {
    calculation.value = { error: error.message }
  }
}

watch([calculationBase, left, right, operator], () => { calculation.value = null })

const showCycleHint = computed(() => (
  [...Object.values(conversions.value), calculation.value?.value, calculation.value?.remainder]
    .some(value => value && /[（(…]/.test(value))
))
</script>

<template>
  <h2 class="tool_title">进制</h2>
  <section aria-labelledby="radix-convert-title">
    <h3 id="radix-convert-title">进制转换</h3>
    <p>在任一栏输入数值，其余四栏会自动换算。</p>
    <div class="radix-fields">
      <template v-for="base in bases" :key="base">
        <label :for="`radix-${base}`">{{ base }} 进制</label>
        <input
          :id="`radix-${base}`" class="stranded-input" type="text" autocomplete="off" spellcheck="false"
          :value="conversions[base] ?? ''" @input="convertFrom(base, $event.target.value)"
        >
      </template>
    </div>
    <p v-if="conversionError" role="alert">{{ conversionError }}</p>
  </section>

  <section aria-labelledby="radix-calc-title">
    <h3 id="radix-calc-title">四则运算</h3>
    <form @submit.prevent="calculate">
      <label for="calc-base">运算进制</label>
      <select id="calc-base" v-model="calculationBase" class="stranded-input">
        <option v-for="base in bases" :key="base" :value="base">{{ base }} 进制</option>
      </select>
      <div>
        <input
          v-model="left" class="stranded-input" type="text" aria-label="第一个数" placeholder="第一个数"
          autocomplete="off" spellcheck="false"
        >
        <select v-model="operator" class="stranded-input" aria-label="运算符">
          <option value="+">+</option>
          <option value="-">−</option>
          <option value="*">×</option>
          <option value="/">÷</option>
        </select>
        <input
          v-model="right" class="stranded-input" type="text" aria-label="第二个数" placeholder="第二个数"
          autocomplete="off" spellcheck="false"
        >
        <button type="submit" class="stranded-button">计算</button>
      </div>
    </form>
    <p v-if="calculation?.error" role="alert">{{ calculation.error }}</p>
    <template v-else-if="calculation">
      <p>
        {{ calculation.remainder === undefined ? '结果' : '商' }}（{{ calculationBase }} 进制）
        <output>{{ calculation.value }}</output>
      </p>
      <p v-if="calculation.remainder !== undefined">
        余数（商向零取整）
        <output>{{ calculation.remainder }}</output>
      </p>
    </template>
  </section>
  <p v-if="showCycleHint">括号内的数字循环出现，… 表示省略了后续的循环位。</p>
</template>

<style scoped>
.radix-fields {
  display: grid;
  grid-template-columns: max-content minmax(0, 32rem);
  align-items: center;
}

output {
  font-family: monospace;
  overflow-wrap: anywhere;
}
</style>
