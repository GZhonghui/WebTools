<script setup>
/*
import { ref, onMounted } from 'vue'
import { truncate, formatTimestamp, roughGuessLocation } from '../../common.js'

let name = ref('')
let message = ref('')
let commentList = ref([])

function getList() {
  fetch('https://api.osakayaki.com/comment')
    .then(res => res.json())
    .then(data => {
      const rawList = (data.list || []).slice().reverse()

      // 对每个 IP 请求定位信息
      for (const entry of rawList) {
        entry.location = roughGuessLocation(entry.ip)
      }

      commentList.value = rawList
    })
    .catch(err => {
      console.error('get comments failed:', err)
    })
}

function sent() {
  if (!name.value || !message.value) {
    return
  }

  fetch('https://api.osakayaki.com/comment', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: truncate(name.value, 20),
      message: truncate(message.value, 100)
    })
  })
  .then(response => {
    if (!response.ok) {
      throw new Error('sent failed!')
    }
    return response.json()
  })
  .then(data => {
    console.log('sent done:', data)
    message.value = ''
    getList()
  })
  .catch(error => {
    console.error('error:', error)
  })
}

onMounted(() => {
  getList()
})
*/
</script>

<template>
  <h2 class="tool_title">留言板</h2>
  <!-- <div>
    <label>昵称</label>
    <input class="stranded-input" style="width: 128px;" v-model="name" />
    <label>留言</label>
    <input class="stranded-input" style="width: 128px;" v-model="message" />
    <br>
    <button class="stranded-button" @click="sent">发送</button>
  </div>
  <div style="margin-top: 20px;">
    <h3>最新留言</h3>
    <ul>
      <li v-for="(entry, index) in commentList" :key="index">
        <strong>{{ entry.name }}</strong>: {{ entry.message }}
        <div style="font-size: 12px; color: #888;">
          时间：{{ formatTimestamp(entry.time) }}<br />
          来自：{{ entry.location || '...' }} ({{ entry.ip }})
        </div>
      </li>
    </ul>
  </div> -->
</template>