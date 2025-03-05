<script setup>
import { ref } from 'vue'
import { modInverse, isRealNumber } from './math.js'

let x = ref(3)
let mod = ref(1e9 + 7)
let info = ref('')

function calculate() {
  if (!isRealNumber(x.value) || !isRealNumber(mod.value)) {
    info.value = 'Input a real number'
    return
  }
  let ans = modInverse(x.value, mod.value)
  if (ans === -1) {
    info.value = `Inverse of [${x.value}] mod [${mod.value}] does not exist`
  } else {
    info.value = `Inverse of [${x.value}] mod [${mod.value}] is [${ans}]`
  }
}
</script>

<template>
  <h2 class="tool_title">计算逆元</h2>
  <div>
    <label>目标</label>
    <input class="stranded-input" type="number" v-model="x">
    <br>
    <label>模数</label>
    <input class="stranded-input" type="number" v-model="mod">
    <br>
    <button class="stranded-button" @click="calculate">计算</button>
    <p style="font-size: 28px; color: green;">{{ info }}</p>
  </div>
</template>
