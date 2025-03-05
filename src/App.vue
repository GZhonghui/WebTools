<template>
  <!--
    <h1>在线工具 Online Tools</h1>
    <hr>
  -->
  <div class="nav-container">
    <RouterLink class="router-link" to="/">首页</RouterLink>
    <RouterLink class="router-link" to="/file">文件</RouterLink>
    <RouterLink class="router-link" to="/image">图片</RouterLink>
    <RouterLink class="router-link" to="/math">数学</RouterLink>
    <RouterLink class="router-link" to="/game">游戏</RouterLink>
    <RouterLink class="router-link" to="/misc">杂项</RouterLink>
  </div>
  <RouterView />
</template>