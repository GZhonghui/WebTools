// ==UserScript==
// @name         WebTools 视频嵌入快捷按钮
// @namespace    webtools-video-embed
// @version      1.0.1
// @description  在 YouTube 和 Bilibili 视频页面右上角显示 WebTools 嵌入播放按钮
// @author       WebTools
// @match        https://www.youtube.com/*
// @match        https://m.youtube.com/*
// @match        https://music.youtube.com/*
// @match        https://www.bilibili.com/*
// @match        https://m.bilibili.com/*
// @grant        GM_info
// @grant        GM_openInTab
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @grant        window.close
// @run-at       document-idle
// @noframes
// ==/UserScript==

(function () {
  'use strict'

  const BUTTON_HOST_ID = 'webtools-video-embed-button'
  const CUSTOM_EMBED_URL_KEY = 'webtoolsEmbedUrl'
  const YOUTUBE_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/
  const BILIBILI_BV_PATTERN = /^BV[A-Za-z0-9]{10}$/
  const BILIBILI_AV_PATTERN = /^av\d+$/i
  const BILIBILI_EP_PATTERN = /^ep\d+$/i

  let button
  let lastUrl = ''

  function parseTime(value) {
    if (!value) return 0
    if (/^\d+$/.test(value)) return Number(value)

    const match = value.toLowerCase().match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/)
    if (!match || !match.slice(1).some(Boolean)) return 0

    return Number(match[1] || 0) * 3600
      + Number(match[2] || 0) * 60
      + Number(match[3] || 0)
  }

  function getCurrentSeconds(url) {
    const player = document.querySelector('video.html5-main-video, video')
    if (player && Number.isFinite(player.currentTime) && player.currentTime > 0) {
      return Math.floor(player.currentTime)
    }

    const hashParams = new URLSearchParams(url.hash.replace(/^#/, ''))
    return parseTime(
      url.searchParams.get('t')
      || url.searchParams.get('start')
      || hashParams.get('t'),
    )
  }

  function parseYouTubePage(url) {
    const parts = url.pathname.split('/').filter(Boolean)
    let id = ''

    if (parts[0] === 'watch') {
      id = url.searchParams.get('v') || ''
    } else if (['shorts', 'live'].includes(parts[0])) {
      id = parts[1] || ''
    }

    if (!YOUTUBE_ID_PATTERN.test(id)) return null

    return {
      site: 'youtube',
      id,
      start: getCurrentSeconds(url),
    }
  }

  function parseBilibiliPage(url) {
    const parts = url.pathname.split('/').filter(Boolean)
    let id = ''

    if (parts[0] === 'video') {
      id = parts[1] || ''
      if (!BILIBILI_BV_PATTERN.test(id) && !BILIBILI_AV_PATTERN.test(id)) {
        return null
      }
    } else if (parts[0] === 'bangumi' && parts[1] === 'play') {
      id = parts[2] || ''
      if (!BILIBILI_EP_PATTERN.test(id)) return null
    } else {
      return null
    }

    const page = Number(url.searchParams.get('p') || 1)
    return {
      site: 'bilibili',
      id,
      page: Number.isInteger(page) && page > 1 ? page : 0,
      start: getCurrentSeconds(url),
    }
  }

  function parseCurrentPage() {
    const url = new URL(window.location.href)
    if (url.hostname.endsWith('youtube.com')) return parseYouTubePage(url)
    if (url.hostname.endsWith('bilibili.com')) return parseBilibiliPage(url)
    return null
  }

  function getInstallSourceUrl() {
    const candidates = [
      GM_info?.script?.downloadURL,
      GM_info?.scriptUpdateURL,
      GM_info?.script?.updateURL,
      GM_info?.script?.fileURL,
    ]

    return candidates.find((value) => {
      try {
        return ['http:', 'https:'].includes(new URL(value).protocol)
      } catch {
        return false
      }
    }) || ''
  }

  function getDefaultEmbedUrl() {
    const sourceUrl = getInstallSourceUrl()
    if (!sourceUrl) return ''

    // The script is published at <base>/userscripts/video-embed.user.js,
    // while the page is at <base>/video/embed.
    return new URL('../video/embed', sourceUrl).toString()
  }

  function getEmbedUrl() {
    const customUrl = GM_getValue(CUSTOM_EMBED_URL_KEY, '')
    return customUrl || getDefaultEmbedUrl()
  }

  function setEmbedUrl() {
    const currentUrl = getEmbedUrl()
    const value = window.prompt(
      '请输入 WebTools 视频嵌入页面地址：',
      currentUrl,
    )

    if (value == null) return

    try {
      const url = new URL(value.trim())
      if (!['http:', 'https:'].includes(url.protocol)) throw new Error()
      GM_setValue(CUSTOM_EMBED_URL_KEY, url.toString())
      window.alert('WebTools 视频嵌入页面地址已保存。')
    } catch {
      window.alert('请输入有效的 HTTP 或 HTTPS 地址。')
    }
  }

  function createTargetUrl(video) {
    const embedUrl = getEmbedUrl()
    if (!embedUrl) {
      throw new Error('无法识别 WebTools 地址，请从 WebTools 页面重新安装脚本。')
    }

    const target = new URL(embedUrl)
    target.search = ''
    target.hash = ''
    target.searchParams.set('site', video.site)
    target.searchParams.set('id', video.id)
    if (video.page > 1) target.searchParams.set('p', String(video.page))
    if (video.start > 0) target.searchParams.set('t', String(video.start))
    return target.toString()
  }

  function openEmbedPage() {
    const video = parseCurrentPage()
    if (!video) return

    try {
      const targetUrl = createTargetUrl(video)
      const openedTab = GM_openInTab(targetUrl, {
        active: true,
        insert: true,
        setParent: true,
      })
      if (openedTab) window.close()
    } catch (error) {
      window.alert(error instanceof Error ? error.message : '无法打开 WebTools 视频嵌入页面。')
    }
  }

  function createButton() {
    const existing = document.getElementById(BUTTON_HOST_ID)
    if (existing) existing.remove()

    const host = document.createElement('div')
    host.id = BUTTON_HOST_ID
    const shadow = host.attachShadow({ mode: 'closed' })

    const style = document.createElement('style')
    style.textContent = `
      :host {
        all: initial;
        position: fixed;
        top: 76px;
        right: 24px;
        z-index: 2147483647;
      }

      button {
        box-sizing: border-box;
        min-width: 160px;
        min-height: 54px;
        padding: 13px 22px;
        border: 1px solid rgba(255, 255, 255, 0.34);
        border-radius: 12px;
        background: linear-gradient(135deg, #ff4d4f, #d9363e);
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
        color: #fff;
        cursor: pointer;
        font: 700 18px/1.25 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        letter-spacing: 0.02em;
        transition: transform 120ms ease, box-shadow 120ms ease, filter 120ms ease;
      }

      button:hover {
        filter: brightness(1.08);
        transform: translateY(-1px);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.36);
      }

      button:active {
        transform: translateY(1px);
      }

      button:focus-visible {
        outline: 3px solid #fff;
        outline-offset: 3px;
      }

      @media (max-width: 640px) {
        :host {
          top: 64px;
          right: 12px;
        }

        button {
          min-width: 144px;
          min-height: 50px;
          padding: 11px 17px;
          font-size: 17px;
        }
      }
    `

    button = document.createElement('button')
    button.type = 'button'
    button.textContent = '嵌入播放 ↗'
    button.title = '在 WebTools 中嵌入当前视频'
    button.addEventListener('click', openEmbedPage)

    shadow.append(style, button)
    document.documentElement.append(host)
    return host
  }

  const buttonHost = createButton()

  function refreshButton() {
    const currentUrl = window.location.href
    if (currentUrl === lastUrl) return
    lastUrl = currentUrl
    buttonHost.hidden = !parseCurrentPage()
  }

  GM_registerMenuCommand('设置 WebTools 嵌入页面地址', setEmbedUrl)
  refreshButton()
  window.addEventListener('popstate', refreshButton)
  window.addEventListener('hashchange', refreshButton)
  document.addEventListener('yt-navigate-finish', refreshButton)
  window.setInterval(refreshButton, 1000)
})()
