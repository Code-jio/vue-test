<template>
  <div class="engine-prototype-container">
    <div class="canvas-container" id="canvas-container"></div>
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

      <!-- 新增：鼠标拾取控制区域 -->
      <div class="panel-section">
        <h3>🎯 鼠标拾取</h3>
        <div class="pick-controls">
          <div class="pick-mode-selector">
            <label>拾取模式:</label>
            <select v-model="currentPickMode" @change="updatePickMode" :disabled="!mousePickPlugin">
              <option value="single">单选模式</option>
              <option value="box">框选模式</option>
            </select>
          </div>
          
          <div class="pick-buttons">
            <button @click="togglePickDebug" :disabled="!mousePickPlugin">
              {{ pickDebugEnabled ? '🔍 关闭调试' : '🔍 开启调试' }}
            </button>
            <button @click="clearSelection" :disabled="!mousePickPlugin">
              🗑️ 清空选择
            </button>
            <button @click="createTestObjects" :disabled="!engineReady">
              📦 创建测试物体
            </button>
            <button @click="debugControllerState" :disabled="!mousePickPlugin">
              🔍 调试控制器
            </button>
          </div>
          
          <div class="pick-info">
            <div class="info-item">选中物体: {{ selectedCount }}个</div>
            <div class="info-item">悬停物体: {{ hoveredObjectName || '无' }}</div>
            <div class="info-item">拾取模式: {{ currentPickMode }}</div>
          </div>
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
          <button @click="handleDiagnosePickEvents" :disabled="!engineReady">🎯 诊断拾取事件</button>
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

      <!-- 新增：拾取结果显示区域 -->
      <div class="panel-section" v-if="selectedObjects.length > 0">
        <h3>🎯 拾取结果</h3>
        <div class="selected-objects">
          <div 
            v-for="(obj, index) in selectedObjects" 
            :key="obj.uuid"
            class="selected-object-item"
            @click="focusOnObject(obj)"
          >
            <span class="object-icon">📦</span>
            <span class="object-name">{{ getObjectDisplayName(obj) }}</span>
            <span class="object-type">{{ obj.type }}</span>
            <button @click.stop="removeFromSelection(obj)" class="remove-btn">✕</button>
          </div>
        </div>
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
          <div class="help-item">• 左键点击：拾取物体</div>
          <div class="help-item">• Ctrl+拖拽：框选物体（按住Ctrl键拖拽）</div>
          <div class="help-item">• ESC键：取消框选</div>
          <div class="help-item">• 右键拖拽：平移视角</div>
          <div class="help-item">• 滚轮：缩放视角</div>
          <div class="help-item">• R键：重置相机位置</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import { useEngine } from '@/composables/useEngine'
import { useDebug } from '@/composables/useDebug'
import { usePerformance } from '@/composables/usePerformance'
import { useControls } from '@/composables/useControls'
import eventBus from '@/eventBus'



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

// 鼠标拾取相关状态
const mousePickPlugin = ref(null)
const currentPickMode = ref('single')
const pickDebugEnabled = ref(false)
const selectedObjects = ref([])
const selectedCount = ref(0)
const hoveredObjectName = ref('')
const testObjects = ref([])

// 清理函数存储
let keyboardCleanup = null
let pickEventCleanup = []

// 初始化鼠标拾取插件
const initializeMousePick = async () => {
  try {
    const engineInstance = getEngineInstance()
    const baseScenePlugin = getBaseScenePlugin()
    const Control = getOrbitControlPlugin()
    if (!engineInstance || !baseScenePlugin) {
      throw new Error('引擎或场景插件未就绪')
    }

    addDebugLog("info", "🎯 开始初始化鼠标拾取插件")

    // 注册鼠标拾取插件
    engineInstance.register({
      name: "MousePickPlugin",
      path: "/plugins/webgl/mousePickPlugin",
      pluginClass: EngineKernel.MousePickPlugin,
      userData: {
        camera: baseScenePlugin.camera,
        scene: baseScenePlugin.scene,
        renderer: baseScenePlugin.rendererInstance,
        controller: Control
      }
    })

    // 获取插件实例
    mousePickPlugin.value = engineInstance.getPlugin("MousePickPlugin")
    
    if (mousePickPlugin.value) {
      // 设置初始配置
      mousePickPlugin.value.setConfig({
        mode: currentPickMode.value,
        tolerance: 0,
        maxDistance: Infinity,
        sortByDistance: true,
        includeInvisible: false,
        recursive: true,
        enableDebug: false
      })

      // 设置事件监听器
      setupPickEventListeners()
      
      addDebugLog("success", "✅ 鼠标拾取插件初始化完成")
    } else {
      throw new Error('鼠标拾取插件获取失败')
    }
    
  } catch (error) {
    addDebugLog("error", `❌ 鼠标拾取插件初始化失败: ${error.message}`)
    throw error
  }
}

// 设置拾取事件监听器
const setupPickEventListeners = () => {
  if (!mousePickPlugin.value) return

  // 物体被拾取事件
  const handleObjectPicked = (data) => {
    const { results, selectedObjectId, selectedObjectName, pickMode } = data
    addDebugLog("info", `🎯 拾取到物体: ${selectedObjectName}, 模式: ${pickMode}`)
    
    // 更新选中状态
    updateSelectedObjects()
  }

  // 物体选中事件
  const handleObjectSelected = (data) => {
    const { object } = data
    addDebugLog("success", `✅ 物体已选中: ${getObjectDisplayName(object)}`)
    updateSelectedObjects()
  }

  // 物体取消选中事件
  const handleObjectDeselected = (data) => {
    const { object } = data
    addDebugLog("info", `➖ 物体已取消选中: ${getObjectDisplayName(object)}`)
    updateSelectedObjects()
  }

  // 选择清空事件
  const handleSelectionCleared = (data) => {
    addDebugLog("info", "🗑️ 已清空所有选择")
    updateSelectedObjects()
  }

  // 悬停变化事件
  const handleHoverChanged = (data) => {
    const { currentObject } = data
    hoveredObjectName.value = currentObject ? currentObject.name || `${currentObject.type}_${currentObject.id}` : ''
  }

  // 框选完成事件
  const handleBoxSelectFinished = (data) => {
    const { selectedObjects: boxSelected } = data
    addDebugLog("success", `📦 框选完成，选中 ${boxSelected.length} 个物体`)
    updateSelectedObjects()
  }

  // 框选模式开启事件
  const handleBoxSelectModeEnabled = (data) => {
    addDebugLog("info", "🔒 Ctrl键按下，进入框选模式，控制器已禁用")
    // 可以在这里更新UI状态，比如改变光标样式
    document.body.style.cursor = 'crosshair'
  }

  // 框选模式关闭事件
  const handleBoxSelectModeDisabled = (data) => {
    addDebugLog("info", "🔓 Ctrl键松开，退出框选模式，控制器已恢复")
    // 恢复默认光标
    document.body.style.cursor = 'default'
  }

  // 框选取消事件
  const handleBoxSelectCancelled = (data) => {
    addDebugLog("warning", "❌ 框选已取消")
    document.body.style.cursor = 'default'
  }

  // 注册事件监听器
  eventBus.on('mouse-pick:object-picked', handleObjectPicked)
  eventBus.on('mouse-pick:object-selected', handleObjectSelected)
  eventBus.on('mouse-pick:object-deselected', handleObjectDeselected)
  eventBus.on('mouse-pick:selection-cleared', handleSelectionCleared)
  eventBus.on('mouse-pick:hover-changed', handleHoverChanged)
  eventBus.on('mouse-pick:box-select-finished', handleBoxSelectFinished)
  eventBus.on('mouse-pick:box-select-mode-enabled', handleBoxSelectModeEnabled)
  eventBus.on('mouse-pick:box-select-mode-disabled', handleBoxSelectModeDisabled)
  eventBus.on('mouse-pick:box-select-cancelled', handleBoxSelectCancelled)

  // 保存清理函数
  pickEventCleanup = [
    () => eventBus.off('mouse-pick:object-picked', handleObjectPicked),
    () => eventBus.off('mouse-pick:object-selected', handleObjectSelected),
    () => eventBus.off('mouse-pick:object-deselected', handleObjectDeselected),
    () => eventBus.off('mouse-pick:selection-cleared', handleSelectionCleared),
    () => eventBus.off('mouse-pick:hover-changed', handleHoverChanged),
    () => eventBus.off('mouse-pick:box-select-finished', handleBoxSelectFinished),
    () => eventBus.off('mouse-pick:box-select-mode-enabled', handleBoxSelectModeEnabled),
    () => eventBus.off('mouse-pick:box-select-mode-disabled', handleBoxSelectModeDisabled),
    () => eventBus.off('mouse-pick:box-select-cancelled', handleBoxSelectCancelled)
  ]
}

// 更新选中物体列表
const updateSelectedObjects = () => {
  if (!mousePickPlugin.value) return
  
  const selected = mousePickPlugin.value.getSelectedObjects()
  selectedObjects.value = selected
  selectedCount.value = selected.length
}

// 获取物体显示名称
const getObjectDisplayName = (object) => {
  if (object.name && object.name !== '') {
    return object.name
  }
  return `${object.type}_${object.id || object.uuid.substring(0, 8)}`
}

// 切换拾取模式
const updatePickMode = () => {
  if (!mousePickPlugin.value) return
  
  mousePickPlugin.value.setPickMode(currentPickMode.value)
  addDebugLog("info", `🔄 拾取模式已切换到: ${currentPickMode.value === 'single' ? '单选' : '框选'}`)
}

// 切换调试模式
const togglePickDebug = () => {
  if (!mousePickPlugin.value) return
  
  pickDebugEnabled.value = !pickDebugEnabled.value
  mousePickPlugin.value.enableDebug(pickDebugEnabled.value)
  addDebugLog("info", `🔍 拾取调试模式: ${pickDebugEnabled.value ? '开启' : '关闭'}`)
}

// 清空选择
const clearSelection = () => {
  if (!mousePickPlugin.value) return
  
  // 这里需要直接调用插件的私有方法，或者模拟点击空白区域
  // 暂时通过点击空白区域实现
  const canvas = getBaseScenePlugin()?.rendererInstance?.domElement
  if (canvas) {
    // 创建一个点击事件在空白区域
    const event = new MouseEvent('mousedown', {
      clientX: 10,
      clientY: 10,
      button: 0
    })
    canvas.dispatchEvent(event)
    
    const upEvent = new MouseEvent('mouseup', {
      clientX: 10,
      clientY: 10,
      button: 0
    })
    canvas.dispatchEvent(upEvent)
  }
}

// 聚焦到选中物体
const focusOnObject = (object) => {
  const baseScenePlugin = getBaseScenePlugin()
  if (!baseScenePlugin || !object) return
  
  // 获取物体世界位置
  const worldPosition = new EngineKernel.THREE.Vector3()
  object.getWorldPosition(worldPosition)
  
  // 设置相机看向该物体
  const camera = baseScenePlugin.camera
  const orbitControls = getOrbitControlPlugin()
  
  if (orbitControls && orbitControls.setTarget) {
    orbitControls.setTarget(worldPosition.x, worldPosition.y, worldPosition.z)
  }
  
  addDebugLog("info", `📍 相机已聚焦到物体: ${getObjectDisplayName(object)}`)
}

// 从选择中移除物体
const removeFromSelection = (object) => {
  // 这里需要通过模拟Ctrl+点击来切换选择状态
  // 由于插件的限制，这里只是从显示列表中移除
  selectedObjects.value = selectedObjects.value.filter(obj => obj.uuid !== object.uuid)
  selectedCount.value = selectedObjects.value.length
  addDebugLog("info", `➖ 从显示列表移除: ${getObjectDisplayName(object)}`)
}

// 创建测试物体
const createTestObjects = () => {
  const baseScenePlugin = getBaseScenePlugin()
  if (!baseScenePlugin) return
  
  try {
    addDebugLog("info", "📦 开始创建测试物体")
    
    // 清理之前的测试物体
    testObjects.value.forEach(obj => {
      baseScenePlugin.scene.remove(obj)
    })
    testObjects.value = []
    
    // 创建几个基础几何体
    const geometries = [
      { geo: new EngineKernel.THREE.BoxGeometry(1, 1, 1), name: '立方体', color: 0xff6b6b },
      { geo: new EngineKernel.THREE.SphereGeometry(0.5, 16, 16), name: '球体', color: 0x4ecdc4 },
      { geo: new EngineKernel.THREE.CylinderGeometry(0.5, 0.5, 1, 16), name: '圆柱体', color: 0x45b7d1 },
      { geo: new EngineKernel.THREE.ConeGeometry(0.5, 1, 16), name: '圆锥体', color: 0xf39c12 },
      { geo: new EngineKernel.THREE.TorusGeometry(0.5, 0.2, 8, 16), name: '环形体', color: 0xe74c3c }
    ]
    
    geometries.forEach((item, index) => {
      const material = new EngineKernel.THREE.MeshPhongMaterial({ color: item.color })
      const mesh = new EngineKernel.THREE.Mesh(item.geo, material)
      
      // 设置位置
      const angle = (index / geometries.length) * Math.PI * 2
      const radius = 3
      mesh.position.set(
        Math.cos(angle) * radius,
        0,
        Math.sin(angle) * radius
      )
      
      // 设置名称
      mesh.name = item.name
      
      // 添加到场景
      baseScenePlugin.scene.add(mesh)
      testObjects.value.push(mesh)
    })
    
    addDebugLog("success", `✅ 已创建 ${geometries.length} 个测试物体`)
    
  } catch (error) {
    addDebugLog("error", `❌ 创建测试物体失败: ${error.message}`)
  }
}

// 主初始化流程
const initializeApplication = async () => {
  try {
    addDebugLog("info", "📦 组件挂载，准备初始化引擎")
    
    // 1. 初始化引擎核心
    await initializeEngine(addDebugLog)
    
    // 2. 设置性能监控
    setupCameraMonitoring(getOrbitControlPlugin(), getBaseScenePlugin(), addDebugLog)
    startFpsMonitoring(engineReady)
    
    // 3. 初始化鼠标拾取插件
    await initializeMousePick()
    
    // 4. 设置控制系统
    keyboardCleanup = setupAdaptiveControls(engineReady, () => resetCamera(addDebugLog), addDebugLog)
    
    // 5. 创建测试物体
    setTimeout(() => {
      if (engineReady.value) {
        createTestObjects()
      }
    }, 1000)
    
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

// 诊断拾取事件
const handleDiagnosePickEvents = () => {
  addDebugLog("info", "🎯 开始诊断拾取事件系统")
  
  if (!mousePickPlugin.value) {
    addDebugLog("error", "❌ 鼠标拾取插件未初始化")
    return
  }
  
  // 检查插件配置
  const config = mousePickPlugin.value.getConfig()
  addDebugLog("info", `📋 当前配置: 模式=${config.mode}, 容差=${config.tolerance}, 最大距离=${config.maxDistance}`)
  
  // 检查选中状态
  const selected = mousePickPlugin.value.getSelectedObjects()
  addDebugLog("info", `📦 当前选中物体数量: ${selected.length}`)
  
  // 检查悬停状态
  const hovered = mousePickPlugin.value.getHoveredObject()
  addDebugLog("info", `👆 当前悬停物体: ${hovered ? getObjectDisplayName(hovered) : '无'}`)
  
  // 检查控制器状态
  const control = getOrbitControlPlugin()
  if (control) {
    addDebugLog("info", `🎮 控制器状态: enabled=${control.enabled}`)
  }
  
  // 测试事件发送
  eventBus.emit('mouse-pick:test-event', { message: '测试事件', timestamp: Date.now() })
  addDebugLog("success", "✅ 拾取事件系统诊断完成")
}

// 调试控制器状态
const debugControllerState = () => {
  if (!mousePickPlugin.value) {
    addDebugLog("error", "❌ 鼠标拾取插件未初始化")
    return
  }
  
  addDebugLog("info", "🔍 正在调试控制器状态...")
  mousePickPlugin.value.debugControllerState()
  addDebugLog("success", "✅ 控制器状态已输出到控制台")
}

// 组件挂载
onMounted(() => {
  initializeApplication()
})

// 组件卸载
onUnmounted(() => {
  // 清理拾取事件监听器
  pickEventCleanup.forEach(cleanup => cleanup())
  
  // 清理测试物体
  const baseScenePlugin = getBaseScenePlugin()
  if (baseScenePlugin) {
    testObjects.value.forEach(obj => {
      baseScenePlugin.scene.remove(obj)
    })
  }
  
  // 销毁鼠标拾取插件
  if (mousePickPlugin.value) {
    mousePickPlugin.value.destroy()
  }
  
  // 停止性能监控
  stopFpsMonitoring()

  // 清理键盘监听器
  if (keyboardCleanup) {
    keyboardCleanup()
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
  width: 320px;
  max-width: calc(100vw - 32px);
  background: rgba(248, 249, 250, 0.95);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(10px);
  z-index: 1000;
  max-height: calc(100vh - 32px);
  overflow-y: auto;
  overflow-x: hidden;
  pointer-events: auto !important; /* 控制面板接收事件 */
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

/* 鼠标拾取控制样式 */
.pick-controls {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.pick-mode-selector {
  display: flex;
  align-items: center;
  gap: 8px;
}

.pick-mode-selector label {
  font-size: 12px;
  font-weight: 500;
  color: #495057;
  min-width: 60px;
}

.pick-mode-selector select {
  flex: 1;
  padding: 4px 8px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 12px;
  background: white;
}

.pick-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.pick-buttons button {
  flex: 1;
  min-width: 80px;
  font-size: 11px;
  padding: 6px 8px;
}

.pick-info {
  background: #f8f9fa;
  border-radius: 4px;
  padding: 8px;
  border-left: 3px solid #28a745;
}

.info-item {
  font-size: 11px;
  color: #495057;
  margin: 2px 0;
}

/* 选中物体列表样式 */
.selected-objects {
  max-height: 200px;
  overflow-y: auto;
}

.selected-object-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  margin: 4px 0;
  background: #fff;
  border: 1px solid #e9ecef;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.selected-object-item:hover {
  background: #f8f9fa;
  transform: translateX(2px);
}

.object-icon {
  font-size: 14px;
  width: 20px;
  text-align: center;
}

.object-name {
  flex: 1;
  font-size: 12px;
  font-weight: 500;
  color: #495057;
}

.object-type {
  font-size: 10px;
  color: #6c757d;
  background: #e9ecef;
  padding: 2px 6px;
  border-radius: 12px;
}

.remove-btn {
  width: 20px;
  height: 20px;
  padding: 0;
  background: #dc3545;
  border: none;
  border-radius: 50%;
  color: white;
  font-size: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.remove-btn:hover {
  background: #c82333;
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
.control-panel::-webkit-scrollbar,
.selected-objects::-webkit-scrollbar {
  width: 6px;
}

.debug-info::-webkit-scrollbar-track,
.control-panel::-webkit-scrollbar-track,
.selected-objects::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.debug-info::-webkit-scrollbar-thumb,
.control-panel::-webkit-scrollbar-thumb,
.selected-objects::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.debug-info::-webkit-scrollbar-thumb:hover,
.control-panel::-webkit-scrollbar-thumb:hover,
.selected-objects::-webkit-scrollbar-thumb:hover {
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

