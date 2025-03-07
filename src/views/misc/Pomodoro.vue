<script setup>
import { ref, reactive, onMounted, onBeforeUnmount } from 'vue'
import { setTitle } from '../../common.js'

let workTime = ref(25) // 绑定输入：工作时间
let breakTime = ref(5) // 绑定输入：休息时间
let progress = ref(100) // 绑定进度条：进度

let timer = null // 计时器
let isRunning = ref(false) // 是否计时中
let isWorking = ref(true) // 状态：工作/休息
let remainingSeconds = ref(workTime.value * 60) // 当前状态的剩余秒数

let record_data = ref({}); // 记录专注时长

// 在 DOM 完成加载之前，是无法获取到 bgm 组件的
let bgm_cache = null;
let bgm = () => {
  if(!bgm_cache) {
    bgm_cache = document.getElementById("bgm");
    if(!bgm_cache) bgm_cache.volume = 1.0;
  }
  return bgm_cache;
}

let today = () => {
  let d = new Date();
  return d.getFullYear() + '-'
    + (d.getMonth() + 1).toString().padStart(2, '0') + '-'
    + d.getDate().toString().padStart(2, '0');
}

// 状态显示
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

  if(isRunning.value && isWorking.value) {
    // 计时功能
    let id = today();
    if(!record_data.value[id]) {
      record_data.value[id] = 0;
    }
    record_data.value[id]++;
    // 保存到本地
    localStorage.setItem('pomodoro-data', JSON.stringify(record_data.value));
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
  let t = localStorage.getItem('pomodoro-data');
  record_data.value = t ? JSON.parse(t) : {};
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
  <div id="record-data">
    <!-- 这里绑定一个 key 是为了帮助 Vue 能够准确地追踪每个节点的身份，从而在数据变化时高效地更新 DOM -->
    <p v-for="(value, date) in record_data" :key="date">
      {{ date }} Stay Focused: {{ Math.ceil(value / 60) }} minutes
    </p>
  </div>
  <p>安静，专注，高效</p>
</template>

<style scoped>
#progress-bar {
  width: 360px;
  color: blue;
}

#record-data p {
  font-family: monospace;
  font-size: 18px;
  color: green;
}
</style>