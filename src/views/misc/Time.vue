<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

const timestamp = ref(0)
const copyMessage = ref('')
const cities = ref([
  { name: '北京', timezone: 'Asia/Shanghai', time: '' },
  { name: '东京', timezone: 'Asia/Tokyo', time: '' },
  { name: '伦敦', timezone: 'Europe/London', time: '' },
  { name: '巴黎', timezone: 'Europe/Paris', time: '' },
  { name: '纽约', timezone: 'America/New_York', time: '' }
])
let timer = null

const copyTimestamp = async () => {
  const value = String(timestamp.value)
  copyMessage.value = ''

  try {
    await navigator.clipboard.writeText(value)
    copyMessage.value = `已复制：${value}`
  } catch {
    copyMessage.value = '复制失败，请手动复制时间戳'
  }
}

const updateTimes = () => {
  const now = new Date()
  timestamp.value = Math.floor(now.getTime() / 1000);
  
  cities.value.forEach(city => {
    city.time = new Date().toLocaleTimeString('zh-CN', {
      timeZone: city.timezone,
      hour12: false,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  })
}

onMounted(() => {
  updateTimes()
  timer = setInterval(updateTimes, 1000)
})

onBeforeUnmount(() => {
  if (timer) {
    clearInterval(timer)
  }
})
</script>

<template>
  <h2 class="tool_title">时间</h2>
  <div>
    <p>
      时间戳：{{ timestamp }}
      <button type="button" class="stranded-button" @click="copyTimestamp">复制时间戳</button>
      <span role="status">{{ copyMessage }}</span>
    </p>
    <div v-for="(city, index) in cities" :key="index" id="city-time">
      <p>{{ city.name }}：{{ city.time }}</p>
    </div>
  </div>
</template>

<style scoped>
#city-time p {
  font-size: 18px;
  color: blue;
}

</style>
