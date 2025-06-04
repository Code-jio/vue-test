<template>
  <div class="model-load-test-container">
    <!-- 三维场景容器 -->
    <div id="canvas-container" class="canvas-container"></div>
    
    <!-- 性能监控面板 -->
    <div class="performance-panel">
      <div class="panel-header">
        <h3>📊 模型加载性能测试</h3>
        <span class="status-badge" :class="statusClass">{{ initStatus }}</span>
      </div>
      
      <!-- 性能指标显示 -->
      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-label">FPS</div>
          <div class="metric-value" :class="getFpsClass()">{{ fpsCounter }}</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">内存使用</div>
          <div class="metric-value">{{ memoryUsage }}MB</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">相机距离</div>
          <div class="metric-value">{{ cameraDistance }}m</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">加载时间</div>
          <div class="metric-value">{{ loadTime }}ms</div>
        </div>
      </div>
      
      <!-- 模型加载状态 -->
      <div class="model-status">
        <div class="status-row">
          <span class="status-label">模型总数：</span>
          <span class="status-value">{{ modelStats.total }}</span>
        </div>
        <div class="status-row">
          <span class="status-label">已加载：</span>
          <span class="status-value">{{ modelStats.loaded }}</span>
        </div>
        <div class="status-row">
          <span class="status-label">失败：</span>
          <span class="status-value error">{{ modelStats.failed }}</span>
        </div>
        <div v-if="modelStats.total > 0" class="progress-bar">
          <div 
            class="progress-fill" 
            :style="{ width: `${(modelStats.loaded / modelStats.total) * 100}%` }"
          ></div>
        </div>
      </div>
      
      <!-- 操作按钮 -->
      <div class="action-buttons">
        <button @click="loadModelsFromJson" :disabled="!engineReady || isLoading" class="btn-primary">
          📦 加载模型列表
        </button>
        <button @click="loadSingleModel" :disabled="!engineReady || isLoading" class="btn-secondary">
          🐎 加载单个模型
        </button>
        <button @click="clearAllModels" :disabled="!engineReady" class="btn-secondary">
          🗑️ 清空模型
        </button>
        <button @click="analyzeCurrentPerformance" :disabled="!engineReady" class="btn-secondary">
          📈 性能分析
        </button>
        <button @click="resetPerformanceData" class="btn-secondary">
          🔄 重置数据
        </button>
      </div>
      
      <!-- 优化建议 -->
      <div v-if="suggestions.length > 0" class="suggestions">
        <h4>💡 优化建议</h4>
        <ul>
          <li v-for="(suggestion, index) in suggestions" :key="index">
            {{ suggestion }}
          </li>
        </ul>
      </div>
    </div>
    
    <!-- 调试日志面板 -->
    <div class="debug-panel">
      <div class="debug-header">
        <h4>🔍 调试日志</h4>
        <button @click="clearDebugLogs" class="btn-clear">清空</button>
      </div>
      <div class="debug-logs" ref="debugLogsRef">
        <div 
          v-for="(log, index) in debugLogs" 
          :key="index"
          :class="['debug-log', `debug-${log.type}`]"
        >
          <span class="log-time">{{ log.time }}</span>
          <span class="log-message">{{ log.message }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useEngine } from '@/composables/useEngine'
import { usePerformance } from '@/composables/usePerformance'

// 引擎和性能监控实例
const { 
  engineReady, 
  initStatus, 
  initializeEngine, 
  loadModel,
  getOrbitControlPlugin,
  getBaseScenePlugin,
  getEngineInstance
} = useEngine()

const {
  fpsCounter,
  cameraDistance,
  startFpsMonitoring,
  stopFpsMonitoring,
  setupCameraMonitoring,
  getPerformanceStats,
  analyzePerformance,
  getOptimizationSuggestions,
  resetPerformanceCounters
} = usePerformance()

// 响应式数据
const debugLogs = ref([])
const debugLogsRef = ref(null)
const memoryUsage = ref(0)
const loadTime = ref(0)
const suggestions = ref([])
const isLoading = ref(false)
const modelStats = ref({
  total: 0,
  loaded: 0,
  failed: 0
})

let modelLoadStartTime = 0
let loadedModels = [] // 存储已加载的模型引用

// 计算属性
const statusClass = computed(() => {
  switch (initStatus.value) {
    case '运行中': return 'status-success'
    case '初始化失败': return 'status-error'
    default: return 'status-loading'
  }
})

// 添加调试日志的方法
const addDebugLog = (type, message) => {
  const log = {
    type,
    message,
    time: new Date().toLocaleTimeString()
  }
  
  debugLogs.value.push(log)
  
  // 限制日志数量，避免占用过多内存
  if (debugLogs.value.length > 100) {
    debugLogs.value.shift()
  }
  
  // 自动滚动到底部
  setTimeout(() => {
    if (debugLogsRef.value) {
      debugLogsRef.value.scrollTop = debugLogsRef.value.scrollHeight
    }
  }, 50)
}

// 清空调试日志
const clearDebugLogs = () => {
  debugLogs.value = []
}

// 获取FPS样式类
const getFpsClass = () => {
  if (fpsCounter.value >= 60) return 'metric-excellent'
  if (fpsCounter.value >= 30) return 'metric-good'
  return 'metric-poor'
}

// 更新内存使用情况
const updateMemoryUsage = () => {
  if (performance.memory) {
    memoryUsage.value = Math.round(performance.memory.usedJSHeapSize / 1024 / 1024)
  }
}

// 读取模型文件列表
const loadModelFilesList = async () => {
  try {
    addDebugLog('info', '📄 正在读取模型文件列表...')
    
    const response = await fetch('/model-files.json')
    if (!response.ok) {
      throw new Error(`HTTP错误! 状态: ${response.status}`)
    }
    
    const modelData = await response.json()
    addDebugLog('success', `✅ 成功读取模型列表，共${modelData.totalCount}个文件`)
    addDebugLog('info', `📅 扫描时间: ${new Date(modelData.scanTime).toLocaleString()}`)
    
    return modelData.files
  } catch (error) {
    addDebugLog('error', `❌ 读取模型列表失败: ${error.message}`)
    return []
  }
}

// 加载单个模型文件
const loadSingleModelFile = async (filePath, index) => {
  return new Promise((resolve, reject) => {
    try {
      // 修复：正确获取引擎实例
      const engineInstance = getEngineInstance()
      const resourcePlugin = engineInstance?.getPlugin("ResourceReaderPlugin")
      const baseScene = getBaseScenePlugin()
      
      if (!resourcePlugin || !baseScene) {
        reject(new Error('插件未就绪'))
        return
      }

      // 修正路径格式（将反斜杠转为正斜杠）
      const normalizedPath = '/' + filePath.replace(/\\/g, '/')
      
      addDebugLog('info', `🔄 [${index + 1}] 加载: ${normalizedPath}`)
      const taskId = resourcePlugin.loadModel(
        normalizedPath,
        (gltf) => {
        //   // 调整模型位置避免重叠
        //   const offsetX = (index % 4) * 5 - 7.5 // 4列布局
        //   const offsetZ = Math.floor(index / 4) * 5 - 7.5
          
        //   gltf.scene.position.set(offsetX, 0, offsetZ)
        //   gltf.scene.scale.setScalar(0.5) // 缩小模型避免场景拥挤
          
          // 调整材质
          gltf.scene.traverse((child) => {
            if (child.material) {
              child.material.needsUpdate = true
            }
          })

          // 添加到场景
          baseScene.scene.add(gltf.scene)
          loadedModels.push(gltf.scene)
          
          modelStats.value.loaded++
          addDebugLog('success', `✅ [${index + 1}] 加载完成: ${normalizedPath}`)
          resolve(gltf)
        },
        (progress) => {
          // 进度回调
          if (progress.lengthComputable) {
            const percent = Math.round((progress.loaded / progress.total) * 100)
            addDebugLog('info', `📊 [${index + 1}] 加载进度: ${percent}%`)
          }
        },
        (error) => {
          modelStats.value.failed++
          addDebugLog('error', `❌ [${index + 1}] 加载失败: ${filePath} - ${error.message}`)
          reject(error)
        }
      )
    } catch (error) {
      modelStats.value.failed++
      addDebugLog('error', `❌ [${index + 1}] 加载异常: ${filePath} - ${error.message}`)
      reject(error)
    }
  })
}

// 从JSON加载所有模型
const loadModelsFromJson = async () => {
  if (!engineReady.value) {
    addDebugLog('warning', '⚠️ 引擎未就绪，请等待初始化完成')
    return
  }

  isLoading.value = true
  modelLoadStartTime = performance.now()
  
  // 重置统计
  modelStats.value = { total: 0, loaded: 0, failed: 0 }
  
  try {
    // 获取模型文件列表
    const modelFiles = await loadModelFilesList()
    
    if (modelFiles.length === 0) {
      addDebugLog('warning', '⚠️ 没有找到可加载的模型文件')
      return
    }
    
    modelStats.value.total = modelFiles.length
    addDebugLog('info', `🚀 开始批量加载${modelFiles.length}个模型...`)
    
    // 并发加载模型（限制并发数避免卡顿）
    const concurrencyLimit = 3 // 同时最多加载3个模型
    const results = []
    
    for (let i = 0; i < modelFiles.length; i += concurrencyLimit) {
      const batch = modelFiles.slice(i, i + concurrencyLimit)
      const batchPromises = batch.map((file, batchIndex) => 
        loadSingleModelFile(file, i + batchIndex)
          .catch(error => {
            // 单个文件加载失败不影响其他文件
            return { error: error.message, file }
          })
      )
      
      const batchResults = await Promise.all(batchPromises)
      results.push(...batchResults)
      
      // 给界面更新的时间
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    
    const endTime = performance.now()
    loadTime.value = Math.round(endTime - modelLoadStartTime)
    
    addDebugLog('success', `🎉 批量加载完成！`)
    addDebugLog('info', `📊 成功: ${modelStats.value.loaded}, 失败: ${modelStats.value.failed}`)
    addDebugLog('info', `⏱️ 总耗时: ${loadTime.value}ms`)
    
  } catch (error) {
    addDebugLog('error', `❌ 批量加载失败: ${error.message}`)
  } finally {
    isLoading.value = false
  }
}

// 加载单个测试模型（原有功能）
const loadSingleModel = () => {
  if (!engineReady.value) {
    addDebugLog('warning', '⚠️ 引擎未就绪，请等待初始化完成')
    return
  }
  
  modelLoadStartTime = performance.now()
  addDebugLog('info', '🚀 开始加载单个测试模型...')
  
  const loadModelWithTiming = (type, message) => {
    addDebugLog(type, message)
    
    if (type === 'success' && message.includes('模型加载完成')) {
      const endTime = performance.now()
      loadTime.value = Math.round(endTime - modelLoadStartTime)
      addDebugLog('info', `⏱️ 加载耗时: ${loadTime.value}ms`)
    }
  }
  
  loadModel(loadModelWithTiming)
}

// 清空所有模型
const clearAllModels = () => {
  if (!engineReady.value) return
  
  const baseScene = getBaseScenePlugin()
  if (!baseScene) return
  
  try {
    // 移除所有已加载的模型
    loadedModels.forEach(model => {
      baseScene.scene.remove(model)
      // 清理几何体和材质
      model.traverse(child => {
        if (child.geometry) child.geometry.dispose()
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(material => material.dispose())
          } else {
            child.material.dispose()
          }
        }
      })
    })
    
    loadedModels = []
    modelStats.value = { total: 0, loaded: 0, failed: 0 }
    addDebugLog('success', '🗑️ 已清空所有模型')
  } catch (error) {
    addDebugLog('error', `❌ 清空模型失败: ${error.message}`)
  }
}

// 分析当前性能
const analyzeCurrentPerformance = () => {
  const stats = analyzePerformance(addDebugLog)
  suggestions.value = getOptimizationSuggestions()
  updateMemoryUsage()
  
  addDebugLog('info', '📊 性能分析完成')
}

// 重置性能数据
const resetPerformanceData = () => {
  resetPerformanceCounters()
  loadTime.value = 0
  suggestions.value = []
  memoryUsage.value = 0
  addDebugLog('info', '🔄 性能数据已重置')
}

// 生命周期钩子
onMounted(async () => {
  addDebugLog('info', '🎯 开始初始化模型加载性能测试')
  
  try {
    // 初始化引擎
    await initializeEngine(addDebugLog)
    
    // 启动性能监控
    startFpsMonitoring(engineReady)
    
    // 设置相机监控（等引擎就绪后）
    const checkEngineReady = () => {
      if (engineReady.value) {
        const orbitControl = getOrbitControlPlugin()
        const baseScene = getBaseScenePlugin()
        if (orbitControl && baseScene) {
          setupCameraMonitoring(orbitControl, baseScene, addDebugLog)
          addDebugLog('success', '📷 相机监控已启用')
        }
      } else {
        setTimeout(checkEngineReady, 100)
      }
    }
    checkEngineReady()
    
    // 定期更新内存使用情况
    const memoryUpdateInterval = setInterval(updateMemoryUsage, 2000)
    
    // 组件卸载时清理定时器
    onUnmounted(() => {
      clearInterval(memoryUpdateInterval)
      stopFpsMonitoring()
    })
    
  } catch (error) {
    addDebugLog('error', `❌ 初始化失败: ${error.message}`)
  }
})

onUnmounted(() => {
  stopFpsMonitoring()
  // 清理模型资源
  clearAllModels()
})
</script>

<style scoped>
.model-load-test-container {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  background: #1a1a1a;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.canvas-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

/* 性能监控面板 */
.performance-panel {
  position: absolute;
  top: 20px;
  left: 20px;
  width: 320px;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 20px;
  color: white;
  z-index: 10;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding-bottom: 12px;
}

.panel-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
}

.status-badge {
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
}

.status-success { background: #10b981; }
.status-error { background: #ef4444; }
.status-loading { background: #f59e0b; }

/* 性能指标网格 */
.metrics-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 16px;
}

.metric-card {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 12px;
  text-align: center;
}

.metric-label {
  font-size: 12px;
  color: #9ca3af;
  margin-bottom: 4px;
}

.metric-value {
  font-size: 18px;
  font-weight: 600;
  color: white;
}

.metric-excellent { color: #10b981; }
.metric-good { color: #f59e0b; }
.metric-poor { color: #ef4444; }

/* 操作按钮 */
.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

.btn-primary {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 10px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-primary:hover:not(:disabled) {
  background: #2563eb;
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 13px;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.15);
}

.btn-primary:disabled,
.btn-secondary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 优化建议 */
.suggestions {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.suggestions h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #f59e0b;
}

.suggestions ul {
  margin: 0;
  padding-left: 16px;
}

.suggestions li {
  font-size: 12px;
  color: #d1d5db;
  margin-bottom: 4px;
}

/* 调试日志面板 */
.debug-panel {
  position: absolute;
  bottom: 20px;
  right: 20px;
  width: 400px;
  height: 200px;
  background: rgba(0, 0, 0, 0.9);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  z-index: 10;
  border: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
}

.debug-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.debug-header h4 {
  margin: 0;
  font-size: 14px;
  color: white;
}

.btn-clear {
  background: rgba(239, 68, 68, 0.2);
  color: #fca5a5;
  border: 1px solid rgba(239, 68, 68, 0.3);
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  cursor: pointer;
}

.debug-logs {
  flex: 1;
  overflow-y: auto;
  padding: 12px 16px;
  font-family: 'Monaco', 'Consolas', monospace;
}

.debug-log {
  display: flex;
  margin-bottom: 4px;
  font-size: 11px;
  line-height: 1.4;
}

.log-time {
  color: #9ca3af;
  margin-right: 8px;
  min-width: 60px;
}

.log-message {
  flex: 1;
}

.debug-info .log-message { color: #60a5fa; }
.debug-success .log-message { color: #34d399; }
.debug-warning .log-message { color: #fbbf24; }
.debug-error .log-message { color: #f87171; }

/* 滚动条样式 */
.debug-logs::-webkit-scrollbar {
  width: 6px;
}

.debug-logs::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
}

.debug-logs::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 3px;
}

.debug-logs::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.5);
}

/* 模型状态显示 */
.model-status {
  margin-bottom: 16px;
  padding: 12px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.status-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
  font-size: 12px;
}

.status-label {
  color: #9ca3af;
}

.status-value {
  color: white;
  font-weight: 500;
}

.status-value.error {
  color: #ef4444;
}

.progress-bar {
  margin-top: 8px;
  height: 4px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #10b981);
  border-radius: 2px;
  transition: width 0.3s ease;
}
</style>
