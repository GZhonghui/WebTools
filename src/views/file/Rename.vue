<script setup>
import { ref, computed } from 'vue';
import { setTitle } from '../../common.js'

setTitle('整理文件')

let ls_output = ref('')
let file_ext = ref('png, jpg, jpeg, gif, webp, mp4')

function copy_ls() {
  navigator.clipboard.writeText('ls | pbcopy')
}

function file_ext_list() {
  return file_ext.value.split(',')
    .map(item => item.trim())
    .filter(item => item.length > 0)
}

let file_ext_computed = computed(() => {
  if(file_ext.value.length === 0) {
    return 'Empty, use all extensions'
  }
  return file_ext_list().join(' | ')
})

let target_name = ref('2025')
let id_start = ref(1)
let command = ref('')

function generate_command() {
  let exts = file_ext_list()
  let file_list = ls_output.value.split('\n').filter((item) => {
    if(item.length === 0 || !item.includes('.')) return false
    let ext = item.split('.').pop()
    return exts.length === 0 || exts.includes(ext)
  })
  file_list.sort()

  let command_list = []
  for(let i = 0; i < file_list.length; i++) {
    let target_name_full = `${target_name.value}_${(id_start.value + i).toString().padStart(4, '0')}`
    let ext = file_list[i].split('.').pop()
    command_list.push(`mv "${file_list[i]}" "${target_name_full}.${ext}"`)
  }
  command.value = command_list.join(' && ')
}

function copy_command() {
  navigator.clipboard.writeText(command.value)
}
</script>

<template>
  <h2 class="tool_title">重命名，整理文件</h2>
  <div>
    <p style="color: green;">移动到目标文件夹，获取文件列表，在  MacOS 上，执行以下命令</p>
    <pre class="stranded-code"><code>ls | pbcopy</code></pre>
    <button
      class="stranded-button"
      @click="copy_ls"
    >
      复制命令
    </button>
    <p>Paste the output here</p>
    <textarea class="stranded-textarea" style="width: 480px; height: 120px;" v-model="ls_output"></textarea>
  </div>
  <div>
    <p style="color: green;">设定文件拓展名（留空为不过滤拓展名）</p>
    <input
      class="stranded-input"
      style="width: 320px;"
      type="text"
      v-model="file_ext"
    />
    <p style="font-family: monospace;">Target extensions: {{ file_ext_computed }}</p>
  </div>
  <div>
    <p style="color: green;">设定目标文件名格式</p>
    <label>文件名称</label>
    <input class="stranded-input" type="text" v-model="target_name" />
    <label>起始编号</label>
    <input class="stranded-input" type="number" v-model="id_start" />
  </div>
  <div>
    <p style="color: green;">生成文件重命名命令，复制后，在目标文件夹执行</p>
    <button class="stranded-button" @click="generate_command">Generate</button>
    <button class="stranded-button" @click="copy_command">Copy</button>
    <br>
    <textarea
      class="stranded-textarea"
      style="width: 480px; height: 120px; background-color: #f0f0f0; color: gray;"
      v-model="command"
      readonly
    ></textarea>
  </div>
</template>
