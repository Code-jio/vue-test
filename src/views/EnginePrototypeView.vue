<template>
  <div class="engine-prototype-container">
    <!-- 控制面板 -->
    <div class="control-panel">
      <div class="panel-section">
        <h3>🚀 引擎状态</h3>
        <div class="status-info">
          <span class="status-item">状态: {{ initStatus }}</span>
          <span class="status-item">FPS: {{ fpsCounter }}</span>
          <span class="status-item">相机距离: {{ cameraDistance }}m</span>
        </div>
      </div>

      <div class="panel-section">
        <h3>🎮 场景控制</h3>
        <button @click="handleLoadModel" :disabled="!engineReady">加载马模型</button>
        <button @click="handleResetCamera" :disabled="!engineReady">重置相机</button>
        <button @click="handleToggleSkybox" :disabled="!engineReady">
          切换天空盒
        </button>
        <!-- 新增控制器诊断功能 -->
        <div class="control-diagnostics">
          <button @click="handleCheckControls" :disabled="!engineReady">🔍 检查控制器</button>
          <button @click="handleReinitControls" :disabled="!engineReady">🔄 重新初始化</button>
          <button @click="handleDiagnoseControls" :disabled="!engineReady">🩺 全面诊断</button>
          <button @click="handleCheckCanvas" :disabled="!engineReady">🖼️ 检查Canvas</button>
        </div>
      </div>

      <!-- 新增CSS3D控制部分 -->
      <div class="panel-section">
        <h3>🌐 CSS3D测试</h3>
        <button @click="handleCreateVueCard" :disabled="!css3dReady">创建Vue卡片</button>
        <button @click="handleCreateVueForm" :disabled="!css3dReady">创建表单</button>
        <button @click="handleCreateVueChart" :disabled="!css3dReady">创建图表</button>
        <button @click="handleCreate3DControls" :disabled="!css3dReady">创建控制面板</button>
        <button @click="handleCreateVueMedia" :disabled="!css3dReady">创建媒体播放器</button>
        <div class="css3d-actions">
          <button @click="handleAnimate3DObjects" :disabled="!css3dReady || css3dObjects.length === 0">
            动画演示
          </button>
          <button @click="handleClear3DObjects" :disabled="!css3dReady || css3dObjects.length === 0">
            清空所有
          </button>
        </div>
        <div class="css3d-interaction">
          <button @click="handleTriggerChartUpdate" :disabled="!css3dReady">更新图表数据</button>
          <button @click="handleUpdateControlsTime" :disabled="!css3dReady">刷新时间</button>
          <button @click="handlePlayMediaVideo" :disabled="!css3dReady">切换播放</button>
        </div>
        <div class="css3d-debug">
          <button @click="handleDebugCSS3DObjects" :disabled="!css3dReady">🔍 调试CSS3D</button>
        </div>
        <div class="css3d-status">
          <span class="status-item">3D对象数量: {{ css3dObjects.length }}</span>
        </div>
      </div>

      <div class="panel-section">
        <h3>📊 资源管理</h3>
        <button @click="handleShowCacheStatus" :disabled="!engineReady">
          缓存状态
        </button>
        <button @click="handleClearResourceCache" :disabled="!engineReady">
          清理缓存
        </button>
      </div>

      <div class="panel-section">
        <h3>🔍 调试信息</h3>
        <div class="debug-info">
          <div v-for="log in debugLogs" :key="log.id" class="debug-log">
            <span class="log-time">{{ log.time }}</span>
            <span :class="['log-level', log.level]">{{ log.level }}</span>
            <span class="log-message">{{ log.message }}</span>
          </div>
        </div>
      </div>

      <div class="panel-section">
        <h3>💡 控制说明</h3>
        <div class="help-info">
          <div class="help-item">• 左键拖拽：旋转视角</div>
          <div class="help-item">• 右键拖拽：平移视角</div>
          <div class="help-item">• 滚轮：缩放视角</div>
          <div class="help-item">• R键：重置相机位置</div>
          <div class="help-item">• CSS3D：测试HTML转3D功能</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted } from "vue";
import { useEngine } from '@/composables/useEngine'
import { useCSS3D } from '@/composables/useCSS3D'
import { useDebug } from '@/composables/useDebug'
import { usePerformance } from '@/composables/usePerformance'
import { useControls } from '@/composables/useControls'

// 使用各个功能模块
const { 
  engineReady, 
  initStatus, 
  initializeEngine,
  loadModel,
  resetCamera,
  toggleSkybox,
  showCacheStatus,
  clearResourceCache,
  getEngineInstance,
  getBaseScenePlugin,
  getOrbitControlPlugin
} = useEngine()

const {
  css3dReady,
  css3dObjects,
  initCSS3DPlugin,
  createVueCard,
  createVueForm,
  createVueChart,
  create3DControls,
  createVueMedia,
  animate3DObjects,
  triggerChartUpdate,
  updateControlsTime,
  playMediaVideo,
  clear3DObjects,
  enhancedRenderLoop,
  debugCSS3DObjects
} = useCSS3D()

const {
  debugLogs,
  addDebugLog
} = useDebug()

const {
  fpsCounter,
  cameraDistance,
  startFpsMonitoring,
  stopFpsMonitoring,
  setupCameraMonitoring
} = usePerformance()

const {
  setupAdaptiveControls,
  getControlsHelp,
  checkControlsStatus,
  reinitializeControls,
  diagnoseControls
} = useControls()

// 清理函数存储
let keyboardCleanup = null

// 主初始化流程
const initializeApplication = async () => {
  try {
    addDebugLog("info", "📦 组件挂载，准备初始化引擎")
    
    // 1. 初始化引擎核心
    await initializeEngine(addDebugLog)
    
    // 2. 初始化CSS3D插件
    const engineInstance = getEngineInstance()
    const baseScenePlugin = getBaseScenePlugin()
    
    if (engineInstance && baseScenePlugin) {
      await initCSS3DPlugin(engineInstance, baseScenePlugin, addDebugLog)
    }
    
    // 3. 设置性能监控
    setupCameraMonitoring(getOrbitControlPlugin(), baseScenePlugin, addDebugLog)
    startFpsMonitoring(engineReady)
    
    // 4. 启动CSS3D渲染循环
    enhancedRenderLoop(baseScenePlugin)
    addDebugLog("success", "🌐 CSS3D渲染循环启动完成")
    
    // 5. 设置控制系统
    keyboardCleanup = setupAdaptiveControls(engineReady, () => resetCamera(addDebugLog), addDebugLog)
    
    addDebugLog("success", "🎉 应用程序初始化完成")
    
    // 6. 自动检查控制器状态
    setTimeout(() => {
      if (engineReady.value) {
        checkControlsStatus(getOrbitControlPlugin(), addDebugLog)
        handleCheckCanvas() // 同时检查Canvas状态
      }
    }, 500) // 延迟500ms确保所有初始化完成
    
  } catch (error) {
    addDebugLog("error", `❌ 应用程序初始化失败: ${error.message}`)
  }
}

// 简化的按钮处理函数
const handleLoadModel = () => loadModel(addDebugLog)
const handleResetCamera = () => resetCamera(addDebugLog)
const handleToggleSkybox = () => toggleSkybox(addDebugLog)
const handleShowCacheStatus = () => showCacheStatus(addDebugLog)
const handleClearResourceCache = () => clearResourceCache(addDebugLog)

// 控制器诊断处理函数
const handleCheckControls = () => checkControlsStatus(getOrbitControlPlugin(), addDebugLog)
const handleReinitControls = () => reinitializeControls(getOrbitControlPlugin(), addDebugLog)
const handleDiagnoseControls = () => diagnoseControls(
  getEngineInstance(), 
  getBaseScenePlugin(), 
  getOrbitControlPlugin(), 
  addDebugLog
)

// Canvas状态检查
const handleCheckCanvas = () => {
  const canvasElements = document.querySelectorAll('canvas')
  if (canvasElements.length === 0) {
    addDebugLog("error", "❌ 页面中未找到Canvas元素")
  } else {
    addDebugLog("success", `✅ 找到 ${canvasElements.length} 个Canvas元素`)
    canvasElements.forEach((canvas, index) => {
      const rect = canvas.getBoundingClientRect()
      addDebugLog("info", `📐 Canvas${index + 1}: ${rect.width}x${rect.height}, 位置:(${rect.left}, ${rect.top})`)
    })
  }
  
  const baseScene = getBaseScenePlugin()
  if (baseScene && baseScene.rendererInstance) {
    const canvasElement = baseScene.rendererInstance.domElement
    if (canvasElement.parentNode) {
      addDebugLog("success", "✅ 渲染器Canvas已正确添加到DOM")
    } else {
      addDebugLog("error", "❌ 渲染器Canvas未添加到DOM")
    }
  }
}

// CSS3D相关处理函数
const handleCreateVueCard = () => createVueCard(addDebugLog)
const handleCreateVueForm = () => createVueForm(addDebugLog)
const handleCreateVueChart = () => createVueChart(addDebugLog)
const handleCreate3DControls = () => create3DControls(addDebugLog)
const handleCreateVueMedia = () => createVueMedia(addDebugLog)

const handleAnimate3DObjects = () => animate3DObjects(addDebugLog)
const handleTriggerChartUpdate = () => triggerChartUpdate(addDebugLog)
const handleUpdateControlsTime = () => updateControlsTime(addDebugLog)
const handlePlayMediaVideo = () => playMediaVideo(addDebugLog)
const handleClear3DObjects = () => clear3DObjects(addDebugLog)
const handleDebugCSS3DObjects = () => debugCSS3DObjects(getBaseScenePlugin(), addDebugLog)

// 组件挂载
onMounted(() => {
  initializeApplication()
})

// 组件卸载
onUnmounted(() => {
  // 停止性能监控
  stopFpsMonitoring()

  // 清理键盘监听器
  if (keyboardCleanup) {
    keyboardCleanup()
  }

  // 清理所有CSS3D对象
  if (css3dObjects.value.length > 0) {
    handleClear3DObjects()
  }

  // 清理引擎资源
  const engineInstance = getEngineInstance()
  if (engineInstance) {
    addDebugLog("info", "🧹 引擎资源清理完成")
  }
})
</script>

<style scoped lang="css">
.engine-prototype-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  margin: 0;
  padding: 0;
  pointer-events: none; /* 允许鼠标事件穿透到canvas */
  z-index: 1; /* 确保在canvas之上 */
}

.control-panel {
  position: fixed;
  top: 16px;
  right: 16px;
  width: 300px;
  max-width: calc(100vw - 32px);
  background: rgba(248, 249, 250, 0.95);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(10px);
  z-index: 1000;
  max-height: calc(100vh - 32px);
  overflow-y: auto;
  overflow-x: hidden;
  pointer-events: auto !important; /* 强制控制面板能接收事件 */
}

.panel-section {
  padding: 16px;
  border-bottom: 1px solid #e9ecef;
}

.panel-section:last-child {
  border-bottom: none;
}

.panel-section h3 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: #495057;
}

.status-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.status-item {
  font-size: 12px;
  color: #6c757d;
  background: #f8f9fa;
  padding: 6px 10px;
  border-radius: 4px;
  border-left: 3px solid #007bff;
}

button {
  padding: 8px 16px;
  margin: 4px 8px 4px 0;
  background: #007bff;
  border: none;
  color: white;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
}

button:hover:not(:disabled) {
  background: #0056b3;
  transform: translateY(-1px);
}

button:disabled {
  background: #6c757d;
  cursor: not-allowed;
  transform: none;
}

.debug-info {
  max-height: 200px;
  overflow-y: auto;
  font-family: "Consolas", "Monaco", monospace;
  font-size: 11px;
  background: #f8f9fa;
  border-radius: 4px;
  padding: 8px;
}

.debug-log {
  display: flex;
  gap: 8px;
  padding: 2px 0;
  border-bottom: 1px solid #e9ecef;
}

.debug-log:last-child {
  border-bottom: none;
}

.log-time {
  color: #6c757d;
  min-width: 60px;
  font-size: 10px;
}

.log-level {
  min-width: 50px;
  font-weight: 600;
  font-size: 10px;
}

.log-level.info {
  color: #007bff;
}

.log-level.success {
  color: #28a745;
}

.log-level.warning {
  color: #ffc107;
}

.log-level.error {
  color: #dc3545;
}

.log-message {
  flex: 1;
  word-wrap: break-word;
}

/* 滚动条样式 */
.debug-info::-webkit-scrollbar,
.control-panel::-webkit-scrollbar {
  width: 6px;
}

.debug-info::-webkit-scrollbar-track,
.control-panel::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.debug-info::-webkit-scrollbar-thumb,
.control-panel::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.debug-info::-webkit-scrollbar-thumb:hover,
.control-panel::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* 帮助信息样式 */
.help-info {
  font-size: 11px;
  color: #6c757d;
  line-height: 1.4;
}

.help-item {
  padding: 2px 0;
  margin: 1px 0;
  background: #f8f9fa;
  border-radius: 3px;
  padding: 4px 8px;
  border-left: 2px solid #28a745;
}

/* CSS3D控制面板样式 */
.css3d-actions {
  display: flex;
  gap: 8px;
  margin: 8px 0;
}

.css3d-actions button {
  flex: 1;
  background: #17a2b8;
  font-size: 11px;
}

.css3d-actions button:hover:not(:disabled) {
  background: #138496;
}

.css3d-interaction {
  display: flex;
  gap: 8px;
  margin: 8px 0;
}

.css3d-interaction button {
  flex: 1;
  background: #6f42c1;
  font-size: 11px;
}

.css3d-interaction button:hover:not(:disabled) {
  background: #5a32a3;
}

.css3d-debug {
  margin-top: 8px;
  padding: 6px 10px;
  background: #e8f4f8;
  border-radius: 4px;
  border-left: 3px solid #17a2b8;
}

.css3d-debug button {
  flex: 1;
  background: #17a2b8;
  font-size: 11px;
}

.css3d-debug button:hover:not(:disabled) {
  background: #138496;
}

.css3d-status {
  margin-top: 8px;
  padding: 6px 10px;
  background: #e8f4f8;
  border-radius: 4px;
  border-left: 3px solid #17a2b8;
}

.css3d-status .status-item {
  background: transparent;
  border: none;
  color: #0c5460;
  font-weight: 500;
}

/* CSS3D按钮特殊样式 */
.panel-section h3:contains("🌐") + * button {
  background: #6f42c1;
  margin: 2px;
}

.panel-section h3:contains("🌐") + * button:hover:not(:disabled) {
  background: #5a32a3;
}

/* 控制器诊断按钮样式 */
.control-diagnostics {
  display: flex;
  gap: 8px;
  margin-top: 8px;
  padding: 8px;
  background: #fff3cd;
  border-radius: 4px;
  border-left: 3px solid #ffc107;
}

.control-diagnostics button {
  flex: 1;
  background: #ffc107;
  color: #212529;
  font-weight: 600;
  margin: 0;
}

.control-diagnostics button:hover:not(:disabled) {
  background: #e0a800;
}

/* Canvas和UI交互修复 */
.engine-prototype-container > * {
  pointer-events: auto; /* 确保容器内的元素能接收事件 */
}
</style>

