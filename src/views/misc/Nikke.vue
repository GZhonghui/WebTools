<script setup>
import { ref, computed, onMounted } from 'vue'; // vue 指的是 npm 的 vue 包
// 分版本加载
import { SpinePlayer as SpinePlayer40 } from '@esotericsoftware/spine-player';
import { SpinePlayer as SpinePlayer41 } from '@esotericsoftware/spine-player-41';
// 注意：这里 CSS 没有分版本加载 使用的4.0版本的 测试没有问题
import '@esotericsoftware/spine-player/dist/spine-player.css'; // 可以从 npm 包中引入 css
import nikkeCfg from './nikke.json';

// 使用普通变量保存当前SpinePlayer实例
let currentPlayer = null;
let isLoading = ref(false);

function randomCharacter() {
  if(isLoading.value) return;
  isLoading.value = true;

  // 清除现有的SpinePlayer实例
  if (currentPlayer) {
    // 销毁现有实例
    currentPlayer.dispose();
    currentPlayer = null;
    
    // 清空容器内容
    const container = document.getElementById('player-container');
    if (container) {
      container.innerHTML = '';
    }
  }
  
  const characters = nikkeCfg.characters;
  const selected = characters[Math.floor(Math.random() * characters.length)];
  const [name, version] = selected;

  const SpinePlayer = version === 40 ? SpinePlayer40 : SpinePlayer41;
  
  // 创建新的SpinePlayer实例
  currentPlayer = new SpinePlayer('player-container', {
    skelUrl: `/nikke/${name}/${name}.skel`,
    atlasUrl: `/nikke/${name}/${name}.atlas`,
    animation: "idle",
    backgroundColor: "#00000000",
    alpha: true,
    showControls: false,
    success: () => {
      isLoading.value = false;
    },
    error: () => {
      isLoading.value = false;
    }
  });
}

onMounted(() => {
  randomCharacter();
})

function tryPlay(animationName) {
  if(isLoading.value || !currentPlayer) return;
  isLoading.value = true;

  const animations = currentPlayer.skeleton.data.animations.map(a => a.name);
  if(animations.includes(animationName)) {
    currentPlayer.animationState.setAnimation(0, animationName, true);
  }

  isLoading.value = false;
}
</script>

<template>
  <h2 class="tool_title">妮姬 Live 2D</h2>
  <div>
    <button class="stranded-button" @click="randomCharacter">{{ isLoading ? '在路上' : '下一位' }}</button>
    <button class="stranded-button" @click="tryPlay('expression_0')">动</button>
    <button class="stranded-button" @click="tryPlay('idle')">停</button>
  </div>
  <div id="player-container" style="max-width:640px; aspect-ratio: 1"></div>
</template>