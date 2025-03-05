<template>
  <div class="nav-container">
    <RouterLink class="router-link" to="/image/crop">裁剪</RouterLink>
    <RouterLink class="router-link" to="/image/resize">尺寸</RouterLink>
    <RouterLink class="router-link" to="/image/watermark">水印</RouterLink>
  </div>
  <RouterView />
</template>