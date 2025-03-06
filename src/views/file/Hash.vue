<script setup>
import { ref } from 'vue';
import CryptoJS from 'crypto-js';
// import MD5 from 'crypto-js/md5';
// import SHA1 from 'crypto-js/sha1';
// import SHA256 from 'crypto-js/sha256';
// import lib from 'crypto-js/lib-typedarrays';
// import MD5Algo from 'crypto-js/md5';
// import SHA1Algo from 'crypto-js/sha1';
// import SHA256Algo from 'crypto-js/sha256';

let calculating = ref(false);
let progress = ref(0);
let res_md5 = ref('');
let res_sha1 = ref('');
let res_sha256 = ref('');

function calculateHash() {
  if(calculating.value) {
    return;
  }
  calculating.value = true;

  // 获取文件输入框
  const fileInput = document.getElementById('file-input');
  if(!fileInput.files.length) {
    res_md5.value = '请选择文件';

    calculating.value = false;
    return;
  }

  // 获取文件
  // 出于安全考虑，无法获得文件路径，只能通过这种方式读取文件内容
  const file = fileInput.files[0];
  const chunkSize = 2 * 1024 * 1024; // 2MB
  let currentChunk = 0;

  // 初始化哈希对象
  const md5Hash = CryptoJS.algo.MD5.create();
  const sha1Hash = CryptoJS.algo.SHA1.create();
  const sha256Hash = CryptoJS.algo.SHA256.create();

  // 用于读取文件内容
  const reader = new FileReader();

  reader.onload = (e) => {
    if (e.target.result) {
      // 更新各个哈希对象
      const wordArray = CryptoJS.lib.WordArray.create(e.target.result);
      md5Hash.update(wordArray);
      sha1Hash.update(wordArray);
      sha256Hash.update(wordArray);

      currentChunk++;
      
      // 计算下一块
      loadNextChunk();
    }
  };

  reader.onerror = function() {
    res_md5.value = '读取文件失败';

    calculating.value = false;
  }

  function loadNextChunk() {
    const start = currentChunk * chunkSize;
    const end = Math.min(start + chunkSize, file.size);
    
    if (start < file.size) {
      progress.value = Math.floor((start / file.size) * 100);
      // 继续读取下一块
      const blob = file.slice(start, end);
      reader.readAsArrayBuffer(blob);
    } else {
      progress.value = 100;
      // 完成所有块的读取，计算最终哈希值
      res_md5.value = md5Hash.finalize().toString();
      res_sha1.value = sha1Hash.finalize().toString();
      res_sha256.value = sha256Hash.finalize().toString();
      calculating.value = false;
    }
  }

  loadNextChunk();
}
</script>

<template>
  <h2 class="tool_title">计算文件哈希：全程离线，已做分块处理，大文件也没问题</h2>
  <!-- 让用户选择文件：用最简单、原生的 input 标签即可，自带一个选择按钮 -->
  <input type="file" id="file-input">
  <br>
  <button class="stranded-button" @click="calculateHash">
    {{ calculating ? '等待' : '计算' }}
  </button>
  <br>
  <div>
    <progress :value="progress" max=100></progress>
    <label>{{ progress }}%</label>
  </div>
  <div id="hash-res">
    <p>MD5: {{ res_md5 }}</p>
    <p>SHA1: {{ res_sha1 }}</p>
    <p>SHA256: {{ res_sha256 }}</p>
  </div>
</template>

<style scoped>
#hash-res p {
  font-size: 20px;
  color: green;
}
</style>
