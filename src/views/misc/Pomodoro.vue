<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { setTitle } from '../../common.js'

let workTime = ref(25)
let breakTime = ref(5)
let progress = ref(100)

let timer = null
let isRunning = ref(false)
let isWorking = ref(true)
let remainingSeconds = ref(workTime.value * 60)

// 在 DOM 完成加载之前，是无法获取到 bgm 组件的
let bgm_cache = null;
let bgm = () => {
  if(!bgm_cache) {
    bgm_cache = document.getElementById("bgm");
    if(!bgm_cache) bgm_cache.volume = 1.0;
  }
  return bgm_cache;
}

function status() {
  let s = isRunning.value ? (isWorking.value ? '工作中' : '休息中') : '暂停中';
  let t = Math.floor(remainingSeconds.value / 60) + ':' + (remainingSeconds.value % 60);
  return s + ' ' + t;
}

function start() {
  isWorking.value = true;
  remainingSeconds.value = workTime.value * 60;
  isRunning.value = true;
}

function pause() {
  isRunning.value = !isRunning.value;
}

function tick() {
  setTitle(status());

  if(isRunning.value && isWorking.value) {
    if(bgm() && bgm().paused) {
      bgm().play();
    }
  } else {
    if(bgm() && !bgm().paused) {
      bgm().pause();
    }
  }

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
  <!-- 最基础的音频组件 使用 loop 设定循环播放 -->
  <audio id="bgm" loop>
    <source src="/pomodoro/Tide_app_Her_city.mp3" type="audio/mpeg">
  </audio>
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
    {{ status() }}
  </p>
  <progress id="progress-bar" :value="progress" :max="100"></progress>
</template>

<style scoped>
#progress-bar {
  width: 360px;
  color: blue;
}
</style>