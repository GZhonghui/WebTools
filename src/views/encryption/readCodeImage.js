import { ref, shallowRef, watch } from 'vue'
import readerWasmUrl from 'zxing-wasm/reader/zxing_reader.wasm?url'

const wasmOptions = { overrides: { locateFile: () => readerWasmUrl } }

async function readCodeImage(file, format) {
  const url = URL.createObjectURL(file)
  try {
    const image = new Image()
    image.src = url
    await image.decode()

    // 限制大照片占用的画布内存，小图和细长的条形码保留原始分辨率。
    const { naturalWidth: width, naturalHeight: height } = image
    const scale = Math.min(1, Math.sqrt(8_000_000 / (width * height)))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(width * scale))
    canvas.height = Math.max(1, Math.round(height * scale))
    const context = canvas.getContext('2d')
    context.fillStyle = '#fff'
    context.fillRect(0, 0, canvas.width, canvas.height)
    context.drawImage(image, 0, 0, canvas.width, canvas.height)

    const { prepareZXingModule, readBarcodes } = await import('zxing-wasm/reader')
    prepareZXingModule(wasmOptions)
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height)
    const [code] = await readBarcodes(pixels, {
      formats: [format],
      maxNumberOfSymbols: 1,
      textMode: 'Plain',
    })
    if (!code) return []
    // UPC-A 和前置一个 0 的 EAN-13 有相同的条纹，图片本身无法区分两种记法。
    if (code.format === 'EAN13' && /^0\d{12}$/.test(code.text)) {
      return [
        { label: 'EAN-13', text: code.text },
        { label: 'UPC-A', text: code.text.slice(1) },
      ]
    }
    return [{ label: '', text: code.text }]
  } finally {
    URL.revokeObjectURL(url)
  }
}

export function useCodeReader(format, codeName) {
  const file = shallowRef(null)
  const results = ref([])
  const readMessage = ref('')

  watch(file, async (selectedFile, _, onCleanup) => {
    let current = true
    onCleanup(() => { current = false })
    results.value = []
    readMessage.value = selectedFile ? '正在读取图片…' : ''
    if (!selectedFile) return

    try {
      const decoded = await readCodeImage(selectedFile, format)
      if (!current) return
      results.value = decoded
      readMessage.value = decoded.length ? '' : `未识别到${codeName}，请选择码图完整、清晰的图片。`
    } catch {
      if (current) readMessage.value = '读取失败，请重新选择 PNG、JPEG 或其他可打开的图片。'
    }
  })

  return { file, results, readMessage }
}
