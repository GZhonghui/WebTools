import { convertHslToRgb, convertRgbToHsl, parseHex, serializeHex8 } from 'culori/fn'

function toHex(color) {
  const hex = serializeHex8(color).toUpperCase()
  return hex.endsWith('FF') ? hex.slice(0, -2) : hex
}

export function normalizeHex(text) {
  const color = typeof text === 'string' && parseHex(text.trim())
  return color ? toHex(color) : null
}

const quantity = /^([+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?)(%|deg|grad|rad|turn|°)?$/i
const angleUnits = { deg: 1, '°': 1, grad: 0.9, rad: 180 / Math.PI, turn: 360 }

function channel(text, maximum) {
  const match = quantity.exec(text)
  if (!match || (match[2] && match[2] !== '%')) return NaN
  const value = Number(match[1]) / (match[2] === '%' ? 100 : maximum)
  return value >= 0 && value <= 1 ? value : NaN
}

function splitChannels(body) {
  if (body.includes(',')) return body.split(',').map(part => part.trim())
  const [values, alpha, ...extra] = body.split('/')
  const parts = values.trim().split(/\s+/)
  if (parts.length !== 3 || extra.length) return []
  if (alpha !== undefined) parts.push(alpha.trim())
  return parts
}

export function parseColorValue(format, text) {
  if (format === 'hex') return normalizeHex(text)
  const input = text.trim().toLowerCase()
  const wrapped = /^(rgb|hsl)a?\(([^()]*)\)$/.exec(input)
  if (wrapped && wrapped[1] !== format) return null
  const parts = splitChannels(wrapped ? wrapped[2] : input)
  if (parts.length !== 3 && parts.length !== 4) return null
  const alpha = channel(parts[3] ?? '1', 1)
  if (!Number.isFinite(alpha)) return null

  if (format === 'rgb') {
    const [r, g, b] = parts.slice(0, 3).map(part => channel(part, 255))
    return [r, g, b].every(Number.isFinite) ? toHex({ r, g, b, alpha }) : null
  }
  const hue = quantity.exec(parts[0])
  if (!hue) return null
  const h = Number(hue[1]) * angleUnits[hue[2] ?? 'deg']
  const s = channel(parts[1], 100)
  const l = channel(parts[2], 100)
  return [h, s, l].every(Number.isFinite) ? toHex(convertHslToRgb({ h, s, l, alpha })) : null
}

function cssValue(name, channels, alpha) {
  const values = channels.join(', ')
  if (alpha === 1) return `${name}(${values})`
  // 常用的 0.5 等写法可以保留。两位小数无法还原原始透明度字节时，使用三位。
  const rounded = Number(alpha.toFixed(2))
  const opacity = Math.round(rounded * 255) === Math.round(alpha * 255) ? rounded : Number(alpha.toFixed(3))
  return `${name}a(${values}, ${opacity})`
}

export function colorValues(hex) {
  const rgb = parseHex(hex)
  const { h = 0, s, l } = convertRgbToHsl(rgb)
  const alpha = rgb.alpha ?? 1
  const rgbChannels = [rgb.r, rgb.g, rgb.b].map(value => Math.round(value * 255))
  const hslChannels = [Number(h.toFixed(2)), Number((s * 100).toFixed(2)) + '%', Number((l * 100).toFixed(2)) + '%']
  return { hex, rgb: cssValue('rgb', rgbChannels, alpha), hsl: cssValue('hsl', hslChannels, alpha) }
}

export function invertColor(hex) {
  const { r, g, b, alpha } = parseHex(hex)
  return toHex({ r: 1 - r, g: 1 - g, b: 1 - b, alpha })
}

export function grayscaleColor(hex) {
  const { r, g, b, alpha } = parseHex(hex)
  const gray = 0.2126 * r + 0.7152 * g + 0.0722 * b
  return toHex({ r: gray, g: gray, b: gray, alpha })
}
