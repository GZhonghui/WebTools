<script setup>
import { ref, onMounted } from 'vue';
import { setTitle } from '../../common.js'

setTitle('密码生成器')
const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

let password = ref('')
let passwordLength = ref(16) // TODO: let user input
let isCopied = ref(false)

function generatePassword() {
  let _password = '';
  for (let i = 0; i < passwordLength.value; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    _password += charset[randomIndex];
  }
  password.value = _password;
  isCopied.value = false;
}

function copyPassword() {
  navigator.clipboard.writeText(password.value);
  isCopied.value = true;
}

onMounted(() => {
  generatePassword()
})
</script>

<template>
  <h2 class="tool_title">密码生成器</h2>
  <div>
    <p class="password-display">{{ password }}</p>
    <br>
    <button class="stranded-button" @click="generatePassword">Generate</button>
    <button
      class="stranded-button"
      :class="{ 'copied-button': isCopied }"
      @click="copyPassword"
    >
      Copy
    </button>
  </div>
</template>

<style scoped>
.password-display {
  font-family: 'Courier New', Courier, monospace;
  font-size: 20px;
  font-weight: bold;
  max-width: 320px;
  border: 1px solid #ccc;
  padding: 10px;
  border-radius: 5px;
}

.copied-button {
  background-color: #4CAF50;
  color: white;
}
</style>