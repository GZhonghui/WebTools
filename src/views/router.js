import { createWebHistory, createRouter } from 'vue-router'

import Home from './Home.vue'

import File from './File.vue'
import FileHash from './file/Hash.vue'
import FileRename from './file/Rename.vue'

import Image from './Image.vue'
import ImageCrop from './image/Crop.vue'
import ImageResize from './image/Resize.vue'
import ImageWatermark from './image/Watermark.vue'
import ImageFormat from './image/Format.vue'

import Math from './Math.vue'
import MathInverse from './math/Inverse.vue'

import Game from './Game.vue'
import GameEldenRing from './game/EldenRing.vue'

import Misc from './Misc.vue'
import MiscNikke from './misc/Nikke.vue'
import MiscEncode from './misc/Encode.vue'
import MiscTime from './misc/Time.vue'
import MiscComment from './misc/Comment.vue'
import MiscPomodoro from './misc/Pomodoro.vue'
import MiscPassword from './misc/Password.vue'

// 配置路由
const routes = [
  { path: '/', component: Home },
  { 
    path: '/file',
    component: File, // 一个路径对应一个组件
    // 配置子路由
    children: [
      { path: 'hash', component: FileHash },
      { path: 'rename', component: FileRename },
    ]
  },
  {
    path: '/image',
    component: Image,
    children: [
      { path: 'crop', component: ImageCrop },
      { path: 'resize', component: ImageResize },
      { path: 'watermark', component: ImageWatermark },
      { path: 'format', component: ImageFormat },
    ]
  },
  {
    path: '/math',
    component: Math,
    children: [
      { path: 'inverse', component: MathInverse },
    ]
  },
  {
    path: '/game',
    component: Game,
    children: [
      { path: 'elden-ring', component: GameEldenRing },
    ]
  },
  {
    path: '/misc',
    component: Misc,
    children: [
      { path: 'nikke', component: MiscNikke },
      { path: 'encode', component: MiscEncode },
      { path: 'time', component: MiscTime },
      { path: 'comment', component: MiscComment },
      { path: 'pomodoro', component: MiscPomodoro },
      { path: 'password', component: MiscPassword },
    ]
  }
]

export const router = createRouter({
  history: createWebHistory(), // 使用这种模式 URL 才会变化
  routes,
})