<script setup>
import { ref, watch, onMounted, onUnmounted, computed } from 'vue';
import { setTitle } from '../../common.js'

setTitle('OTP代码生成器')

const PERIOD_SECONDS = 30;
const DIGITS = 6;

const secret = ref('');
const otpCode = ref('------');
const errorMessage = ref('');
const copyMessage = ref('');
const now = ref(Date.now());

let timerId = null;
let copyMessageTimerId = null;
let refreshTaskId = 0;

function normalizeSecret(value) {
  return value.replace(/\s+/g, '').toUpperCase();
}

function decodeBase32(input) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const clean = normalizeSecret(input).replace(/=+$/g, '');

  if (!clean) {
    return new Uint8Array(0);
  }

  if (!/^[A-Z2-7]+$/.test(clean)) {
    throw new Error('Invalid secret format: please use a Base32 string.');
  }

  let bits = '';
  for (const char of clean) {
    const val = alphabet.indexOf(char);
    if (val < 0) {
      throw new Error('Invalid secret format: contains unsupported characters.');
    }
    bits += val.toString(2).padStart(5, '0');
  }

  const bytes = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.slice(i, i + 8), 2));
  }

  return new Uint8Array(bytes);
}

function counterToBytes(counter) {
  const bytes = new Uint8Array(8);
  let value = BigInt(counter);

  for (let i = 7; i >= 0; i -= 1) {
    bytes[i] = Number(value & 0xffn);
    value >>= 8n;
  }

  return bytes;
}

async function generateTotp(secretValue, counter) {
  const keyBytes = decodeBase32(secretValue);

  if (keyBytes.length === 0) {
    throw new Error('Please enter a secret key.');
  }

  const key = await crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign'],
  );

  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    counterToBytes(counter),
  );

  const hmac = new Uint8Array(signature);
  const offset = hmac[hmac.length - 1] & 0x0f;
  const binary =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  const otp = binary % (10 ** DIGITS);
  return otp.toString().padStart(DIGITS, '0');
}

const currentCounter = computed(() => Math.floor(now.value / 1000 / PERIOD_SECONDS));
const elapsedInPeriod = computed(() => (now.value / 1000) % PERIOD_SECONDS);
const progressValue = computed(() => elapsedInPeriod.value);
const remainingSeconds = computed(() => {
  const elapsedWhole = Math.floor(elapsedInPeriod.value);
  return PERIOD_SECONDS - elapsedWhole;
});
const canCopy = computed(() => /^\d{6}$/.test(otpCode.value));

async function refreshOtp() {
  const thisTask = ++refreshTaskId;
  const rawSecret = secret.value;

  if (!rawSecret.trim()) {
    otpCode.value = '------';
    errorMessage.value = '';
    return;
  }

  try {
    const code = await generateTotp(rawSecret, currentCounter.value);
    if (thisTask !== refreshTaskId) {
      return;
    }
    otpCode.value = code;
    errorMessage.value = '';
  } catch (error) {
    if (thisTask !== refreshTaskId) {
      return;
    }
    otpCode.value = '------';
    errorMessage.value = error instanceof Error ? error.message : 'Failed to generate OTP.';
  }
}

async function copyOtp() {
  if (!canCopy.value) {
    return;
  }

  try {
    await navigator.clipboard.writeText(otpCode.value);
    copyMessage.value = 'Copied';
  } catch {
    copyMessage.value = 'Copy failed, please copy manually';
  }

  if (copyMessageTimerId) {
    clearTimeout(copyMessageTimerId);
  }

  copyMessageTimerId = setTimeout(() => {
    copyMessage.value = '';
  }, 1500);
}

watch(secret, () => {
  copyMessage.value = '';
});

watch([secret, currentCounter], () => {
  void refreshOtp();
}, { immediate: true });

onMounted(() => {
  timerId = setInterval(() => {
    now.value = Date.now();
  }, 200);
});

onUnmounted(() => {
  if (timerId) {
    clearInterval(timerId);
  }
  if (copyMessageTimerId) {
    clearTimeout(copyMessageTimerId);
  }
});
</script>

<template>
  <div class="otp-page">
    <h2 class="tool_title">OTP代码生成器</h2>
    <p>
      <label for="otp-secret">Enter OTP secret (Base32):</label>
    </p>
    <p>
      <input
        id="otp-secret"
        v-model="secret"
        type="text"
        placeholder="Example: JBSWY3DPEHPK3PXP"
        autocomplete="off"
        spellcheck="false"
        style="font-size: 32px;"
      >
    </p>

    <p style="font-size: 32px; color: green;">Current OTP: {{ otpCode }}</p>
    <p v-if="errorMessage">{{ errorMessage }}</p>

    <p>
      <button type="button" :disabled="!canCopy" @click="copyOtp" style="font-size: 24px;">
        Copy OTP
      </button>
      <span v-if="copyMessage"> {{ copyMessage }}</span>
    </p>

    <p>Refresh progress:</p>
    <progress :value="progressValue" :max="PERIOD_SECONDS"></progress>
    <p>Refreshes in {{ remainingSeconds }}s</p>
  </div>
</template>

<style scoped>
.otp-page {
  font-size: 1.00rem;
}
</style>