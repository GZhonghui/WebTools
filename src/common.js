export function setTitle(title) {
    if(title && title.length > 0) {
        document.title = `在线工具 | ${title}`
    } else {
        document.title = '在线工具'
    }
}

// 限制字符串最大长度
export function truncate(str, maxLength) {
    if (str.length > maxLength) {
        return str.slice(0, maxLength) + '…'
    }
    return str
}

export function formatTimestamp(ts) {
    const date = new Date(ts * 1000) // 秒转毫秒
    return date.toLocaleString() // 可以用 toLocaleDateString 或自定义格式
}

// 根据IP计算实际地址（粗略版）
export function roughGuessLocation(ip) {
    if (!ip) return '未知'
    if (ip.startsWith('127.') || ip === '::1') return '本地'
    if (
      ip.startsWith('192.168.') || ip.startsWith('10.') ||
      ip.startsWith('172.') || ip.startsWith('169.254.')
    ) return '局域网'
  
    // 中国常见公网段
    if (
      ip.startsWith('1.') || ip.startsWith('36.') || ip.startsWith('39.') ||
      ip.startsWith('42.') || ip.startsWith('58.') || ip.startsWith('59.') ||
      ip.startsWith('60.') || ip.startsWith('61.') || ip.startsWith('101.') ||
      ip.startsWith('103.') || ip.startsWith('106.') || ip.startsWith('110.') ||
      ip.startsWith('111.') || ip.startsWith('112.') || ip.startsWith('113.') ||
      ip.startsWith('114.') || ip.startsWith('115.') || ip.startsWith('116.') ||
      ip.startsWith('117.') || ip.startsWith('118.') || ip.startsWith('119.') ||
      ip.startsWith('120.') || ip.startsWith('121.') || ip.startsWith('122.') ||
      ip.startsWith('123.') || ip.startsWith('124.') || ip.startsWith('125.') ||
      ip.startsWith('159.') || ip.startsWith('183.') || ip.startsWith('202.') ||
      ip.startsWith('203.') || ip.startsWith('210.') || ip.startsWith('211.') ||
      ip.startsWith('218.') || ip.startsWith('219.') || ip.startsWith('220.') ||
      ip.startsWith('221.') || ip.startsWith('222.')
    ) {
      return '中国'
    }
  
    // 日本常见公网段
    if (
      ip.startsWith('43.') || ip.startsWith('60.') || ip.startsWith('61.') ||
      ip.startsWith('106.') || ip.startsWith('110.') || ip.startsWith('114.') ||
      ip.startsWith('115.') || ip.startsWith('116.') || ip.startsWith('118.') ||
      ip.startsWith('119.') || ip.startsWith('121.') || ip.startsWith('122.') ||
      ip.startsWith('123.') || ip.startsWith('124.') || ip.startsWith('125.') ||
      ip.startsWith('126.') || ip.startsWith('133.') || ip.startsWith('153.') ||
      ip.startsWith('210.') || ip.startsWith('211.') || ip.startsWith('218.') ||
      ip.startsWith('219.') || ip.startsWith('220.') || ip.startsWith('221.')
    ) {
      return '日本'
    }
  
    // 美国常见公网段（如 Google DNS、Cloudflare）
    if (
      ip.startsWith('3.') || ip.startsWith('8.') || ip.startsWith('13.') ||
      ip.startsWith('17.') || ip.startsWith('18.') || ip.startsWith('20.') ||
      ip.startsWith('34.') || ip.startsWith('35.') || ip.startsWith('44.') ||
      ip.startsWith('52.') || ip.startsWith('54.') || ip.startsWith('63.') ||
      ip.startsWith('64.') || ip.startsWith('66.') || ip.startsWith('67.') ||
      ip.startsWith('68.') || ip.startsWith('69.') || ip.startsWith('70.') ||
      ip.startsWith('71.') || ip.startsWith('72.') || ip.startsWith('73.') ||
      ip.startsWith('74.') || ip.startsWith('75.') || ip.startsWith('104.') ||
      ip.startsWith('107.') || ip.startsWith('108.') || ip.startsWith('128.') ||
      ip.startsWith('129.') || ip.startsWith('130.') || ip.startsWith('131.') ||
      ip.startsWith('132.') || ip.startsWith('134.') || ip.startsWith('136.') ||
      ip.startsWith('138.') || ip.startsWith('139.') || ip.startsWith('140.') ||
      ip.startsWith('143.') || ip.startsWith('144.') || ip.startsWith('146.') ||
      ip.startsWith('147.') || ip.startsWith('148.') || ip.startsWith('149.') ||
      ip.startsWith('152.') || ip.startsWith('153.') || ip.startsWith('155.') ||
      ip.startsWith('156.') || ip.startsWith('157.') || ip.startsWith('158.') ||
      ip.startsWith('159.') || ip.startsWith('160.') || ip.startsWith('162.') ||
      ip.startsWith('163.') || ip.startsWith('164.') || ip.startsWith('165.') ||
      ip.startsWith('166.') || ip.startsWith('167.') || ip.startsWith('168.') ||
      ip.startsWith('169.') || ip.startsWith('170.') || ip.startsWith('172.') ||
      ip.startsWith('173.') || ip.startsWith('174.') || ip.startsWith('184.') ||
      ip.startsWith('192.') || ip.startsWith('198.') || ip.startsWith('199.') ||
      ip.startsWith('204.') || ip.startsWith('205.') || ip.startsWith('206.') ||
      ip.startsWith('207.') || ip.startsWith('208.') || ip.startsWith('209.') ||
      ip.startsWith('216.')
    ) {
      return '美国'
    }
  
    return '其他地区'
}