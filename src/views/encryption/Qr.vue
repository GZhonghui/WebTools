<script setup>
import { ref, watch } from 'vue';
import QRCode from 'qrcode';
import { setTitle } from '../../common.js'

setTitle('QR Code Generator')

const text = ref('');
const size = ref(256);
const qrDataUrl = ref('');
const errorMessage = ref('');

async function generateQr() {
  const value = text.value.trim();

  if (!value) {
    qrDataUrl.value = '';
    errorMessage.value = '';
    return;
  }

  try {
    qrDataUrl.value = await QRCode.toDataURL(value, {
      width: Number(size.value),
      margin: 1,
      errorCorrectionLevel: 'M',
    });
    errorMessage.value = '';
  } catch (error) {
    qrDataUrl.value = '';
    errorMessage.value = error instanceof Error ? error.message : 'Failed to generate QR code.';
  }
}

watch([text, size], () => {
  void generateQr();
}, { immediate: true });
</script>

<template>
  <h2 class="tool_title">条码</h2>

  <p>
    <label for="qr-text">Text or URL</label>
  </p>
  <p>
    <input
      id="qr-text"
      v-model="text"
      type="text"
      placeholder="Enter text or https://example.com"
      autocomplete="off"
      spellcheck="false"
      style="font-size: 32px;"
    >
  </p>

  <p>
    <label for="qr-size">Size</label>
    <select id="qr-size" v-model.number="size" style="margin-left: 8px;">
      <option :value="128">128 x 128</option>
      <option :value="192">192 x 192</option>
      <option :value="256">256 x 256</option>
      <option :value="320">320 x 320</option>
      <option :value="512">512 x 512</option>
    </select>
  </p>

  <p v-if="qrDataUrl">
    <img :src="qrDataUrl" alt="Generated QR code">
  </p>
  <p v-else>
    Preview will appear after you enter text.
  </p>

  <p v-if="qrDataUrl">
    <a :href="qrDataUrl" :download="`qrcode-${size}.png`">Download PNG</a>
  </p>

  <p v-if="errorMessage">{{ errorMessage }}</p>
</template>