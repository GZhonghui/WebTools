<script setup>
import { setTitle } from '../../common.js'
import { ref, onMounted } from 'vue'
import { PDFDocument } from 'pdf-lib'
import * as pdfjsLib from 'pdfjs-dist'
import { saveAs } from 'file-saver'
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.mjs?url'

// 设置PDF.js工作器路径，使用本地npm包
onMounted(() => {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl
})

setTitle('图片格式转换')

// 状态变量
const isConverting = ref(false)
const conversionProgress = ref(0)
const message = ref('')
const uploadedFile = ref(null)
const resultFiles = ref([])

// 清除文件和结果
const clearFiles = () => {
  uploadedFile.value = null
  resultFiles.value = []
  message.value = ''
  conversionProgress.value = 0
}

// 处理文件选择
const handleFileChange = (event) => {
  const file = event.target.files[0]
  if (!file) return
  
  clearFiles()
  uploadedFile.value = file
  message.value = `已选择文件: ${file.name}`
}

// PDF 转换为图片
const convertPdfToImages = async () => {
  if (!uploadedFile.value || !uploadedFile.value.type.includes('pdf')) {
    message.value = '请先选择一个PDF文件'
    return
  }
  
  try {
    isConverting.value = true
    message.value = '正在处理PDF...'
    
    // 读取PDF文件
    const arrayBuffer = await uploadedFile.value.arrayBuffer()
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
    const numPages = pdf.numPages
    
    resultFiles.value = []
    
    // 处理每一页
    for (let i = 1; i <= numPages; i++) {
      conversionProgress.value = Math.floor((i / numPages) * 100)
      
      // 获取页面
      const page = await pdf.getPage(i)
      
      // 设置高分辨率 (300 DPI)
      const viewport = page.getViewport({ scale: 16.0 })
      
      // 记录原始PDF点尺寸和使用的缩放比例
      const PDF_SCALE = 16.0
      const PDF_POINTS_TO_INCH = 72
      
      // 创建画布
      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d')
      canvas.height = viewport.height
      canvas.width = viewport.width
      
      // 渲染PDF页面到画布
      await page.render({
        canvasContext: context,
        viewport: viewport
      }).promise
      
      // 转换为PNG格式
      const pngDataUrl = canvas.toDataURL('image/png')
      
      // 保存结果
      resultFiles.value.push({
        name: `页面_${i}.png`,
        url: pngDataUrl,
        data: pngDataUrl
      })
    }
    
    message.value = `转换完成! 共处理了 ${numPages} 页`
    conversionProgress.value = 100
  } catch (error) {
    console.error('PDF转换错误:', error)
    message.value = `转换失败: ${error.message}`
  } finally {
    isConverting.value = false
  }
}

// 图片转换为PDF
const convertImageToPdf = async () => {
  if (!uploadedFile.value || !uploadedFile.value.type.includes('image')) {
    message.value = '请先选择一个图片文件'
    return
  }
  
  try {
    isConverting.value = true
    message.value = '正在处理图片...'
    conversionProgress.value = 25
    
    // 读取图片数据
    const arrayBuffer = await uploadedFile.value.arrayBuffer()
    
    // 创建一个新的PDF文档
    const pdfDoc = await PDFDocument.create()
    
    // 将图片嵌入到文档中
    let image
    if (uploadedFile.value.type.includes('png')) {
      image = await pdfDoc.embedPng(arrayBuffer)
    } else if (uploadedFile.value.type.includes('jpeg') || uploadedFile.value.type.includes('jpg')) {
      image = await pdfDoc.embedJpg(arrayBuffer)
    } else {
      // 如果不是PNG或JPG，先转换为PNG
      const img = new Image()
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      
      await new Promise((resolve) => {
        img.onload = () => {
          canvas.width = img.width
          canvas.height = img.height
          ctx.drawImage(img, 0, 0)
          resolve()
        }
        img.src = URL.createObjectURL(uploadedFile.value)
      })
      
      const pngData = canvas.toDataURL('image/png').split(',')[1]
      const pngBuffer = Uint8Array.from(atob(pngData), c => c.charCodeAt(0))
      image = await pdfDoc.embedPng(pngBuffer)
    }
    
    conversionProgress.value = 50
    
    // 定义与PDF->PNG转换相同的PPI (与scale=16对应)
    const PPI = PDF_POINTS_TO_INCH * PDF_SCALE  // 1152
    
    // 获取图片像素尺寸
    const pixelWidth = image.width;
    const pixelHeight = image.height;
    
    // 将像素转换为PDF点单位 (72点/英寸)
    const pdfWidth = (pixelWidth / PPI) * 72;
    const pdfHeight = (pixelHeight / PPI) * 72;
    
    // 创建PDF页面，使用计算出的点尺寸
    const page = pdfDoc.addPage([pdfWidth, pdfHeight]);
    
    // 绘制图像，占满整个页面
    page.drawImage(image, {
      x: 0,
      y: 0,
      width: pdfWidth,
      height: pdfHeight
    });
    
    conversionProgress.value = 75
    
    // 保存PDF文件
    const pdfBytes = await pdfDoc.save()
    const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' })
    
    // 保存结果
    const pdfName = uploadedFile.value.name.split('.')[0] + '.pdf'
    resultFiles.value = [{
      name: pdfName,
      url: URL.createObjectURL(pdfBlob),
      data: pdfBlob
    }]
    
    message.value = '转换完成!'
    conversionProgress.value = 100
  } catch (error) {
    console.error('图片转换错误:', error)
    message.value = `转换失败: ${error.message}`
  } finally {
    isConverting.value = false
  }
}

// 根据文件类型执行转换
const convertFile = () => {
  if (!uploadedFile.value) {
    message.value = '请先选择一个文件'
    return
  }
  
  if (uploadedFile.value.type.includes('pdf')) {
    convertPdfToImages()
  } else if (uploadedFile.value.type.includes('image')) {
    convertImageToPdf()
  } else {
    message.value = '不支持的文件类型'
  }
}

// 下载转换后的文件
const downloadFile = (file) => {
  if (file.data instanceof Blob) {
    saveAs(file.data, file.name)
  } else {
    // 对于DataURL格式
    const link = document.createElement('a')
    link.href = file.data
    link.download = file.name
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}
</script>

<template>
  <h2 class="tool_title">图片格式转换</h2>
  
  <div class="ai-generated-wrapper">
    <div class="ai-generated-label">AI生成</div>
    
    <div class="converter-container">
      <div class="file-input-section">
        <h3>选择文件</h3>
        <p class="description">支持PDF转PNG和PNG/JPG转PDF</p>
        
        <div class="file-input-container">
          <input 
            type="file" 
            id="fileInput" 
            accept=".pdf,.png,.jpg,.jpeg" 
            @change="handleFileChange"
            :disabled="isConverting"
          />
          <label for="fileInput" class="file-input-label">
            选择文件
          </label>
          <span v-if="uploadedFile" class="file-name">{{ uploadedFile.name }}</span>
        </div>
        
        <div class="actions">
          <button 
            @click="convertFile" 
            :disabled="!uploadedFile || isConverting" 
            class="convert-button"
          >
            {{ isConverting ? '转换中...' : '开始转换' }}
          </button>
          
          <button 
            @click="clearFiles" 
            :disabled="isConverting" 
            class="clear-button"
          >
            清除
          </button>
        </div>
        
        <div v-if="isConverting" class="progress-container">
          <div class="progress-bar">
            <div class="progress" :style="{width: `${conversionProgress}%`}"></div>
          </div>
          <span>{{ conversionProgress }}%</span>
        </div>
        
        <p class="message" v-if="message">{{ message }}</p>
      </div>
      
      <div v-if="resultFiles.length > 0" class="results-section">
        <h3>转换结果</h3>
        
        <div class="result-files">
          <div v-for="(file, index) in resultFiles" :key="index" class="result-file">
            <div class="file-preview">
              <img v-if="file.url && !file.name.endsWith('.pdf')" :src="file.url" alt="预览" />
              <div v-else class="pdf-preview">PDF文件</div>
            </div>
            
            <div class="file-info">
              <span class="file-name">{{ file.name }}</span>
              <button @click="downloadFile(file)" class="download-button">下载</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ai-generated-wrapper {
  position: relative;
  border: 2px dashed #3f51b5;
  border-radius: 8px;
  padding: 2rem 1rem 1rem;
  margin-top: 1.5rem;
  width: 800px;
}

.ai-generated-label {
  position: absolute;
  top: -12px;
  left: 20px;
  background-color: #3f51b5;
  color: white;
  padding: 2px 10px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
}

.converter-container {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  max-width: 800px;
  margin: 0;
}

.description {
  color: #666;
  margin-bottom: 1rem;
}

.file-input-container {
  display: flex;
  align-items: center;
  margin-bottom: 1rem;
}

.file-input-label {
  display: inline-block;
  padding: 8px 16px;
  background-color: #4CAF50;
  color: white;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.file-input-label:hover {
  background-color: #45a049;
}

input[type="file"] {
  display: none;
}

.file-name {
  margin-left: 10px;
  word-break: break-all;
}

.actions {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
}

button {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s;
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.convert-button {
  background-color: #2196F3;
  color: white;
}

.convert-button:hover:not(:disabled) {
  background-color: #0b7dda;
}

.clear-button {
  background-color: #f44336;
  color: white;
}

.clear-button:hover:not(:disabled) {
  background-color: #da190b;
}

.progress-container {
  margin: 1rem 0;
  display: flex;
  align-items: center;
  gap: 10px;
}

.progress-bar {
  flex-grow: 1;
  height: 15px;
  background-color: #f0f0f0;
  border-radius: 10px;
  overflow: hidden;
}

.progress {
  height: 100%;
  background-color: #4CAF50;
  border-radius: 10px;
  transition: width 0.3s ease;
}

.message {
  margin-top: 1rem;
  padding: 10px;
  background-color: #f0f0f0;
  border-radius: 4px;
}

.results-section {
  border-top: 1px solid #e0e0e0;
  padding-top: 1rem;
}

.result-files {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
}

.result-file {
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
  transition: transform 0.2s;
}

.result-file:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(0,0,0,0.1);
}

.file-preview {
  height: 150px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f9f9f9;
  overflow: hidden;
}

.file-preview img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.pdf-preview {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #666;
  font-weight: bold;
}

.file-info {
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.download-button {
  background-color: #4CAF50;
  color: white;
  width: 100%;
}

.download-button:hover {
  background-color: #45a049;
}
</style>