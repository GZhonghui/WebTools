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

import Design from './Design.vue'
import DesignColor from './design/Color.vue'

import Video from './Video.vue'
import VideoEmbed from './video/Embed.vue'

import Math from './Math.vue'
import MathInverse from './math/Inverse.vue'
import MathPrime from './math/Prime.vue'
import MathRadix from './math/Radix.vue'

import Text from './Text.vue'
import TextWordCount from './text/WordCount.vue'
import TextJsonCheck from './text/JsonCheck.vue'

import Game from './Game.vue'
import GameEldenRing from './game/EldenRing.vue'
import GameNikke from './game/Nikke.vue'

import Encryption from './Encryption.vue'
import EncryptionPassword from './encryption/Password.vue'
import EncryptionOtp from './encryption/Otp.vue'
import EncryptionBarcode from './encryption/Barcode.vue'
import EncryptionQr from './encryption/Qr.vue'
import EncryptionEncode from './encryption/Encode.vue'

import Time from './Time.vue'
import TimeTimezone from './time/Timezone.vue'
import TimePomodoro from './time/Pomodoro.vue'
import TimeAge from './time/Age.vue'

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
      // { path: 'crop', component: ImageCrop },
      // { path: 'resize', component: ImageResize },
      { path: 'watermark', component: ImageWatermark },
      // { path: 'format', component: ImageFormat },
    ]
  },
  {
    path: '/design',
    component: Design,
    children: [
      { path: 'color', component: DesignColor },
    ]
  },
  {
    path: '/video',
    component: Video,
    children: [
      { path: 'embed', component: VideoEmbed },
    ]
  },
  {
    path: '/math',
    component: Math,
    children: [
      { path: 'inverse', component: MathInverse },
      { path: 'prime', component: MathPrime },
      { path: 'radix', component: MathRadix },
    ]
  },
  {
    path: '/text',
    component: Text,
    children: [
      { path: 'word-count', component: TextWordCount },
      { path: 'json-check', component: TextJsonCheck },
    ]
  },
  {
    path: '/game',
    component: Game,
    children: [
      { path: 'elden-ring', component: GameEldenRing },
      { path: 'nikke', component: GameNikke },
    ]
  },
  {
    path: '/encryption',
    component: Encryption,
    children: [
      { path: 'password', component: EncryptionPassword },
      { path: 'otp', component: EncryptionOtp },
      { path: 'barcode', component: EncryptionBarcode },
      { path: 'qr', component: EncryptionQr },
      { path: 'encode', component: EncryptionEncode },
    ]
  },
  {
    path: '/time',
    component: Time,
    children: [
      { path: 'timezone', component: TimeTimezone },
      { path: 'pomodoro', component: TimePomodoro },
      { path: 'age', component: TimeAge },
    ]
  }
]

export const router = createRouter({
  history: createWebHistory(), // 使用这种模式 URL 才会变化
  routes,
})
