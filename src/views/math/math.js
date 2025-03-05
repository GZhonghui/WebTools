// AI: 判断 value 是否为实数
export function isRealNumber(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

/**
 * AI: 判断 n 是否为素数
 * @param {number} n
 * @returns {boolean}
 */
export function isPrime(n) {
  if (n <= 1) return false;
  if (n <= 3) return true;    // 2 和 3 为素数
  if (n % 2 === 0 || n % 3 === 0) return false;

  // 仅需判断到 sqrt(n) 即可
  for (let i = 5; i * i <= n; i += 6) {
    if (n % i === 0 || n % (i + 2) === 0) {
      return false;
    }
  }
  return true;
}

/**
 * AI: 计算 a 和 b 的最大公约数（gcd）
 * @param {number} a 
 * @param {number} b 
 * @returns {number} gcd(a, b)
 */
export function gcd(a, b) {
  return b === 0 ? a : gcd(b, a % b);
}

/**
 * AI: 使用扩展欧几里得算法求 a 在模 m 下的逆元：
 * 若 gcd(a, m) = 1，则存在逆元，返回该逆元；
 * 否则返回 -1。
 * @param {number} a 
 * @param {number} m 
 * @returns {number} 若存在逆元，则返回 0 <= inverse < m；否则返回 -1。
 */
export function modInverse(a, m) {
  // 先检查是否互质
  if (gcd(a, m) !== 1) {
    // 若不互质，无逆元
    return -1;
  }

  // 下面是扩展欧几里得算法
  let m0 = m;
  let x0 = 0;
  let x1 = 1;

  // 特殊情况：m == 1，通常无实际意义
  if (m === 1) {
    return 0;
  }

  // 按扩展欧几里得算法迭代
  while (a > 1) {
    // q 是商
    let q = Math.floor(a / m);
    let temp = m;

    // 类似普通欧几里得，计算余数
    m = a % m;
    a = temp;
    temp = x0;
    x0 = x1 - q * x0;
    x1 = temp;
  }

  // 修正负值（让 x1 映射到 [0, m0) 之间）
  if (x1 < 0) {
    x1 += m0;
  }

  return x1;
}