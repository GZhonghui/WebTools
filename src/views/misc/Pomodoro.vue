<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

let workTime = ref(25)
let breakTime = ref(5)
let progress = ref(100)

let timer = null
let isRunning = ref(false)
let isWorking = ref(true)
let remainingSeconds = ref(workTime.value * 60)

function start() {
  isWorking.value = true;
  remainingSeconds.value = workTime.value * 60;
  isRunning.value = true;
}

function pause() {
  isRunning.value = !isRunning.value;
}

function tick() {
  if (!isRunning.value) {
    return;
  }

  if (remainingSeconds.value > 0) {
    remainingSeconds.value--;
  } else {
    isWorking.value = !isWorking.value;
    remainingSeconds.value = (isWorking.value ? workTime.value : breakTime.value) * 60;
  }
  progress.value = remainingSeconds.value / (isWorking.value ? workTime.value : breakTime.value) / 60 * 100;
}

onMounted(() => {
  timer = setInterval(tick, 1000)
})

onBeforeUnmount(() => {
  if (timer) {
    clearInterval(timer)
  }
})
</script>

<template>
  <h2 class="tool_title">番茄钟</h2>
  <div style="margin-bottom: 16px;">
    <label>工作</label>
    <input class="stranded-input" style="width: 64px;" type="number" v-model="workTime" />
    <label>休息</label>
    <input class="stranded-input" style="width: 64px;" type="number" v-model="breakTime" />
    <br>
    <button class="stranded-button" @click="start">开始</button>
    <button class="stranded-button" @click="pause">{{ isRunning ? '暂停' : '继续' }}</button>
  </div>
  <p style="margin-bottom: 4px;"
  >
    {{ isRunning ? (isWorking ? '工作中' : '休息中') : '暂停中' }}
    {{ Math.floor(remainingSeconds / 60) }}:{{ remainingSeconds % 60 }}
  </p>
  <progress id="progress-bar" :value="progress" :max="100"></progress>
</template>

<style scoped>
#progress-bar {
  width: 360px;
  color: blue;
}
</style>