import { fromHex, toHex } from '@exodus/bytes/hex.js'
import { fromBase32, toBase32 } from '@exodus/bytes/base32.js'
import { fromBase58, toBase58 } from '@exodus/bytes/base58.js'
import { fromBase64, toBase64 } from '@exodus/bytes/base64.js'
import { utf8fromString, utf8toString } from '@exodus/bytes/utf8.js'

function encodeAscii85(bytes) {
  const groups = []
  for (let offset = 0; offset < bytes.length; offset += 4) {
    const size = Math.min(4, bytes.length - offset)
    let value = 0
    for (let i = 0; i < 4; i++) {
      value = value * 256 + (bytes[offset + i] ?? 0)
    }
    if (size === 4 && value === 0) {
      groups.push('z')
      continue
    }

    const digits = Array(5)
    for (let i = 4; i >= 0; i--) {
      digits[i] = String.fromCharCode(33 + value % 85)
      value = Math.floor(value / 85)
    }
    groups.push(digits.slice(0, size + 1).join(''))
  }
  return groups.join('')
}

function decodeAscii85(text) {
  // 同时接受裸编码和 Adobe 的 <~…~> 包装。
  const data = text.replace(/^<~(.*)~>$/, '$1')
  const bytes = []
  for (let offset = 0; offset < data.length;) {
    if (data[offset] === 'z') {
      bytes.push(0, 0, 0, 0)
      offset++
      continue
    }

    const size = Math.min(5, data.length - offset)
    if (size === 1) throw new Error('Ascii85 末组至少需要两个字符。')

    let value = 0
    for (let i = 0; i < 5; i++) {
      // 末组用最大数位 u 补足五位，只取实际编码的字节。
      const digit = i < size ? data.charCodeAt(offset + i) - 33 : 84
      if (digit < 0 || digit >= 85) throw new Error('Ascii85 字符无效。')
      value = value * 85 + digit
    }
    if (value > 0xffffffff) throw new Error('Ascii85 分组超出四字节范围。')
    for (let i = 0; i < size - 1; i++) {
      bytes.push((value >>> (24 - i * 8)) & 0xff)
    }
    offset += size
  }
  return Uint8Array.from(bytes)
}

const codecs = {
  Base64: { encode: toBase64, decode: fromBase64 },
  Base16: { encode: toHex, decode: fromHex },
  Base32: { encode: bytes => toBase32(bytes, { padding: true }), decode: fromBase32 },
  Base58: { encode: toBase58, decode: fromBase58 },
  Base85: { encode: encodeAscii85, decode: decodeAscii85 },
}

function convert({ action, format, input }) {
  const codec = codecs[format]
  if (action === 'encode') {
    try {
      return { result: codec.encode(utf8fromString(input)) }
    } catch {
      return { error: '无法编码，请检查输入是否为有效的 Unicode 文本。' }
    }
  }

  let bytes
  try {
    bytes = codec.decode(input.replace(/[ \t\r\n\f\v]+/g, ''))
  } catch (error) {
    return { error: format === 'Base85' ? error.message : `${format} 编码无效，请检查字符和长度。` }
  }
  try {
    return { result: utf8toString(bytes) }
  } catch {
    return { error: '解码后的字节无法按 UTF-8 读取。' }
  }
}

self.onmessage = ({ data }) => self.postMessage(convert(data))
