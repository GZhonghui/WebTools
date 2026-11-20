# WebTools 开发约定

WebTools 是基于 Vue 3、Vue Router 和 Vite 的工具网站，以静态文件部署。新工具默认在浏览器本地运行，文件读取、计算和结果导出都尽量在用户设备上完成，无需后端服务。

视频嵌入页通过浏览器直接加载第三方播放器。

## 界面与使用体验

- 实用性和稳定性优先于美观。面向桌面浏览器开发，移动端适配只在有明确需求时再做。
- 参考同分类的现有页面，按操作顺序摆放输入、按钮和结果。优先使用原生表单控件、文件选择框和普通链接。
- 尽量少写 CSS。先复用 `src/assets/css/global.css` 中的 `tool_title`、`stranded-input`、`stranded-button` 等样式。某个工具确实需要特殊布局时，把样式留在该页。

## 页面与代码组织

- 原则上一个工具页面对应一个 `.vue` 文件，用 `<script setup>` 和 `<template>` 放置该页的逻辑与界面。输入、结果和临时状态由页面自己管理，尤其要避免跨分类依赖其他页面的内部实现。
- 复杂工具可以把专用逻辑放在页面旁边，例如 `src/views/video/Embed.vue` 的播放器实现位于 `src/views/video/embed/`。工具自带的静态资源可按用途放在 `public/` 的子目录中。
- 少量相似的表单或代码可以各自保留。只有同一段逻辑已经在多处反复使用、需要一起维护时，再考虑抽成公共模块。分类内共用的函数就近放置，例如 `src/views/math/math.js`。跨分类反复使用的通用函数可以放在 `src/common.js`。

## 新增工具页

1. 在 `src/views/` 下相应的分类目录中新建页面，例如 `src/views/text/WordCount.vue`。页面标题沿用 `<h2 class="tool_title">`，浏览器标签页标题用 `src/common.js` 中的 `setTitle()` 设置。
2. 在 `src/views/router.js` 顶部与同分类页面一起静态导入组件，然后在该分类的 `children` 中直接引用。例如字数统计的路由写作 `{ path: 'word-count', component: TextWordCount }`。
3. 在分类导航页添加对应的 `RouterLink`。例如 `src/views/Text.vue` 链接到 `/text/word-count`，由该页的 `RouterView` 显示工具。新增一级分类时，建立对应的父路由，并在 `src/App.vue` 的顶栏添加入口。

## 开发与验证

- 项目使用 npm。首次安装依赖可运行 `npm ci`，开发时运行 `npm run dev`。调整依赖时一并更新 `package-lock.json`。
- 修改工具或路由后，运行 `npm run build` 检查生产构建。产物在 `dist/`，可用 `npm run preview` 本地预览。
- 从分类导航进入改动的页面，用实际输入走一遍主要操作并核对结果。按功能检查容易出错的情况，例如文件无法读取、连续换文件时旧结果覆盖新结果，或离开页面后定时器仍在运行。
