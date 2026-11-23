import { gcd } from './math.js'

export const bases = [2, 4, 8, 10, 16]
const digits = '0123456789ABCDEF'
const prefixes = { 2: '0b', 8: '0o', 16: '0x' }
const maxCycleDigits = 32

function readDigits(text, base) {
  let value = 0n
  const radix = BigInt(base)
  for (const character of text.toUpperCase()) {
    const digit = digits.indexOf(character)
    if (digit >= base) throw new Error(`“${character}”不能用于 ${base} 进制。`)
    value = value * radix + BigInt(digit)
  }
  return value
}

export function parseRadix(text, base) {
  const input = text.trim()
  let body = input.replace(/^[+-]/, '')
  if (prefixes[base] && body.slice(0, 2).toLowerCase() === prefixes[base]) body = body.slice(2)
  const match = /^([0-9a-f]*)(?:\.([0-9a-f]*)(?:\(([0-9a-f]+)\))?)?$/i.exec(body)
  if (!match || !(match[1] || match[2] || match[3])) {
    throw new Error(`请输入有效的 ${base} 进制数。`)
  }

  const [, whole, fraction = '', cycle = ''] = match
  const radix = BigInt(base)
  let numerator = readDigits(whole + fraction, base)
  let denominator = radix ** BigInt(fraction.length)
  if (cycle) {
    // k 位循环节的值等于这 k 位表示的整数除以 (radix^k - 1)。
    const factor = radix ** BigInt(cycle.length) - 1n
    numerator = numerator * factor + readDigits(cycle, base)
    denominator *= factor
  }
  return { numerator: input.startsWith('-') ? -numerator : numerator, denominator }
}

export function formatRadix(numerator, denominator, base) {
  if (denominator < 0n) {
    numerator = -numerator
    denominator = -denominator
  }
  const magnitude = numerator < 0n ? -numerator : numerator
  const sign = numerator < 0n ? '-' : ''
  let output = sign + (magnitude / denominator).toString(base).toUpperCase()
  let remainder = magnitude % denominator
  if (!remainder) return output

  const radix = BigInt(base)
  function nextDigit() {
    remainder *= radix
    const digit = remainder / denominator
    remainder %= denominator
    return digits[Number(digit)]
  }

  // 约分后的分母每消去一组与进制共有的因子，就有一位非循环小数。
  output += '.'
  let tailDenominator = denominator / gcd(remainder, denominator)
  let factor = gcd(tailDenominator, radix)
  while (factor > 1n) {
    output += nextDigit()
    tailDenominator /= factor
    factor = gcd(tailDenominator, radix)
  }
  if (!remainder) return output

  const cycleStart = remainder
  let cycle = ''
  do {
    cycle += nextDigit()
  } while (remainder !== cycleStart && cycle.length < maxCycleDigits)
  return remainder === cycleStart ? `${output}(${cycle})` : `${output}${cycle}…`
}

export function calculateRadix(leftText, operator, rightText, base) {
  if (!leftText.trim() || !rightText.trim()) throw new Error('请输入两个运算数。')
  const left = parseRadix(leftText, base)
  const right = parseRadix(rightText, base)
  const denominator = left.denominator * right.denominator
  if (operator === '*') {
    return { value: formatRadix(left.numerator * right.numerator, denominator, base) }
  }

  // 通分后可以直接对两个分子做加减或取余。
  const a = left.numerator * right.denominator
  const b = right.numerator * left.denominator
  switch (operator) {
    case '+': return { value: formatRadix(a + b, denominator, base) }
    case '-': return { value: formatRadix(a - b, denominator, base) }
    case '/':
      if (b === 0n) throw new Error('除数不能为零。')
      return { value: formatRadix(a, b, base), remainder: formatRadix(a % b, denominator, base) }
  }
}
