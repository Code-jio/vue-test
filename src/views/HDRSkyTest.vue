<template>
  <div class="hdr-sky-test">
    <!-- 标题区域 -->
    <div class="header">
      <h1>🌅 HDR天空盒测试</h1>
      <div class="status-indicator">
        <span :class="['status-dot', engineReady ? 'ready' : 'loading']"></span>
        <span class="status-text">{{ initStatus }}</span>
      </div>
    </div>

    <!-- 3D场景容器 -->
    <div id="canvas-container" class="canvas-container"></div>

    <!-- 控制面板 -->
    <div class="control-panel">
      <div class="control-section">
        <h3>🎮 场景控制</h3>
        <div class="button-group">
          <button @click="handleResetCamera" :disabled="!engineReady" class="btn btn-primary">
            重置相机
          </button>
          <button @click="handleLoadTestModel" :disabled="!engineReady" class="btn btn-secondary">
            加载测试模型
          </button>
          <button @click="handleToggleDebugObjects" :disabled="!engineReady" class="btn btn-secondary">
            {{ showDebugObjects ? '隐藏' : '显示' }}调试对象
          </button>
        </div>
      </div>

      <div class="control-section">
        <h3>🌌 HDR天空盒设置</h3>
        <div class="setting-group">
          <label>HDR强度:</label>
          <input 
            type="range" 
            v-model="hdrIntensity" 
            min="0.1" 
            max="3.0" 
            step="0.1"
            @input="updateHDRIntensity"
            :disabled="!engineReady"
          />
          <span class="value-display">{{ hdrIntensity }}</span>
        </div>
        
        <div class="setting-group">
          <label>天空盒资源:</label>
          <select v-model="selectedHDRFile" @change="switchHDRFile" :disabled="!engineReady">
            <option value="/skybox/rustig_koppie_puresky_2k.hdr">2K HDR天空盒</option>
            <option value="/skybox/rustig_koppie_puresky_4k.hdr">4K HDR天空盒</option>
          </select>
        </div>

        <div class="button-group">
          <button @click="handleReloadHDR" :disabled="!engineReady" class="btn btn-accent">
            重新加载HDR
          </button>
        </div>
      </div>

      <div class="control-section">
        <h3>📊 场景信息</h3>
        <div class="info-display">
          <div class="info-item">
            <span class="label">引擎状态:</span>
            <span class="value">{{ engineReady ? '就绪' : '加载中' }}</span>
          </div>
          <div class="info-item">
            <span class="label">天空盒类型:</span>
            <span class="value">HDR环境贴图</span>
          </div>
          <div class="info-item">
            <span class="label">HDR文件:</span>
            <span class="value">{{ selectedHDRFile.split('/').pop() }}</span>
          </div>
          <div class="info-item">
            <span class="label">曝光强度:</span>
            <span class="value">{{ hdrIntensity }}x</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 调试日志面板 -->
    <div class="debug-panel">
      <div class="debug-header">
        <h4>🔍 调试日志</h4>
        <button @click="clearDebugLogs" class="btn btn-small">
          清空日志
        </button>
      </div>
      <div class="debug-logs">
        <div 
          v-for="log in debugLogs.slice(-10)" 
          :key="log.id" 
          :class="['debug-log', log.level]"
        >
          <span class="log-time">{{ log.time }}</span>
          <span class="log-level">{{ log.level.toUpperCase() }}</span>
          <span class="log-message">{{ log.message }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { useEngine } from '@/composables/useEngine'
import { useDebug } from '@/composables/useDebug'

// 使用组合式API
const { 
  engineReady, 
  initStatus, 
  initializeEngine,
  resetCamera,
  getEngineInstance,
  getBaseScenePlugin,
  getOrbitControlPlugin
} = useEngine()

const {
  debugLogs,
  addDebugLog,
  clearDebugLogs: clearLogs
} = useDebug()

// 响应式状态
const hdrIntensity = ref(1.0)
const selectedHDRFile = ref('/skybox/rustig_koppie_puresky_2k.hdr')
const showDebugObjects = ref(false)

// 插件引用
let skyboxPlugin = null
let debugObjects = []

/**
 * 初始化HDR天空盒引擎
 */
const initializeHDREngine = async () => {
  try {
    addDebugLog('info', '🚀 开始初始化HDR天空盒引擎')
    
    // 复用useEngine的初始化逻辑
    await initializeEngine(addDebugLog)
    
    // 等待引擎就绪
    await waitForEngineReady()
    
    if (engineReady.value) {
      // 注册HDR天空盒插件
      await registerHDRSkyboxPlugin()
      
      // 创建调试对象
      createDebugObjects()
      
      addDebugLog('success', '🎉 HDR天空盒引擎初始化完成')
    }
    
  } catch (error) {
    addDebugLog('error', `❌ HDR引擎初始化失败: ${error.message}`)
    console.error('HDR引擎初始化失败:', error)
  }
}

/**
 * 等待引擎就绪
 */
const waitForEngineReady = () => {
  return new Promise((resolve) => {
    const checkReady = () => {
      if (engineReady.value) {
        resolve()
      } else {
        setTimeout(checkReady, 100)
      }
    }
    checkReady()
  })
}

/**
 * 注册HDR天空盒插件
 */
const registerHDRSkyboxPlugin = async () => {
  try {
    const engineInstance = getEngineInstance()
    const baseScenePlugin = getBaseScenePlugin()
    
    if (!engineInstance || !baseScenePlugin) {
      throw new Error('引擎实例或基础场景插件未就绪')
    }

    addDebugLog('info', '📦 注册HDR天空盒插件')

    // 注册HDR天空盒插件
    engineInstance.register({
      name: 'HDRSkyBoxPlugin',
      path: '/plugins/webgl/skyBox',
      pluginClass: EngineKernel.SkyBox,
      userData: {
        scene: baseScenePlugin.scene,
        camera: baseScenePlugin.camera,
        renderer: baseScenePlugin.renderer,
        skyBoxType: EngineKernel.SkyBoxType.HDR_ENVIRONMENT,
        hdrMapPath: selectedHDRFile.value,
        hdrIntensity: hdrIntensity.value,
        size: 50000
      }
    })

    // 获取插件实例
    skyboxPlugin = engineInstance.getPlugin('HDRSkyBoxPlugin')
    
    if (skyboxPlugin) {
      addDebugLog('success', '✅ HDR天空盒插件注册成功')
      
      // 监听天空盒就绪事件
      EngineKernel.eventBus.on('skybox-ready', (data) => {
        addDebugLog('success', `🌌 HDR天空盒加载完成: ${data.type}`)
      })
      
      EngineKernel.eventBus.on('skybox-error', (error) => {
        addDebugLog('error', `❌ HDR天空盒加载失败: ${error.message}`)
      })
      
    } else {
      throw new Error('HDR天空盒插件获取失败')
    }

  } catch (error) {
    addDebugLog('error', `❌ HDR天空盒插件注册失败: ${error.message}`)
    throw error
  }
}

/**
 * 创建调试对象
 */
const createDebugObjects = () => {
  try {
    const baseScenePlugin = getBaseScenePlugin()
    if (!baseScenePlugin?.scene) return

    addDebugLog('info', '🎯 创建调试对象')

    // 清理现有对象
    debugObjects.forEach(obj => {
      baseScenePlugin.scene.remove(obj)
      obj.geometry?.dispose()
      obj.material?.dispose()
    })
    debugObjects = []

    const scene = baseScenePlugin.scene
    const THREE = EngineKernel.THREE

    // 创建基础几何体用于测试光照效果
    const geometries = [
      new THREE.BoxGeometry(50, 50, 50),
      new THREE.SphereGeometry(25, 32, 16),
      new THREE.ConeGeometry(20, 60, 8),
      new THREE.TorusGeometry(30, 10, 8, 20)
    ]

    const materials = [
      new THREE.MeshStandardMaterial({ 
        color: 0xff6b6b, 
        metalness: 0.3, 
        roughness: 0.4 
      }),
      new THREE.MeshStandardMaterial({ 
        color: 0x4ecdc4, 
        metalness: 0.7, 
        roughness: 0.2 
      }),
      new THREE.MeshStandardMaterial({ 
        color: 0x45b7d1, 
        metalness: 0.1, 
        roughness: 0.8 
      }),
      new THREE.MeshStandardMaterial({ 
        color: 0xf9ca24, 
        metalness: 0.5, 
        roughness: 0.3 
      })
    ]

    // 创建测试对象
    for (let i = 0; i < geometries.length; i++) {
      const mesh = new THREE.Mesh(geometries[i], materials[i])
      mesh.position.set(
        (i - 1.5) * 100,
        Math.sin(i) * 30,
        -200 + (i % 2) * 100
      )
      mesh.rotation.set(
        Math.random() * Math.PI,
        Math.random() * Math.PI,
        Math.random() * Math.PI
      )
      mesh.name = `DebugObject_${i}`
      
      scene.add(mesh)
      debugObjects.push(mesh)
    }

    // 添加环境光和方向光
    const ambientLight = new THREE.AmbientLight(0x404040, 0.2)
    scene.add(ambientLight)
    debugObjects.push(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5)
    directionalLight.position.set(100, 100, 50)
    directionalLight.castShadow = true
    scene.add(directionalLight)
    debugObjects.push(directionalLight)

    addDebugLog('success', `✅ 创建了 ${debugObjects.length} 个调试对象`)
    
  } catch (error) {
    addDebugLog('error', `❌ 创建调试对象失败: ${error.message}`)
  }
}

/**
 * 更新HDR强度
 */
const updateHDRIntensity = () => {
  if (!skyboxPlugin || !engineReady.value) return

  try {
    const baseScenePlugin = getBaseScenePlugin()
    if (baseScenePlugin?.renderer) {
      baseScenePlugin.renderer.toneMappingExposure = parseFloat(hdrIntensity.value)
      addDebugLog('info', `🌟 HDR强度已更新: ${hdrIntensity.value}x`)
    }
  } catch (error) {
    addDebugLog('error', `❌ 更新HDR强度失败: ${error.message}`)
  }
}

/**
 * 切换HDR文件
 */
const switchHDRFile = async () => {
  if (!skyboxPlugin || !engineReady.value) return

  try {
    addDebugLog('info', `🔄 切换HDR文件: ${selectedHDRFile.value}`)
    
    // 重新配置天空盒
    skyboxPlugin.switchSkyBoxType(EngineKernel.SkyBoxType.HDR_ENVIRONMENT, {
      hdrMapPath: selectedHDRFile.value,
      hdrIntensity: parseFloat(hdrIntensity.value)
    })
    
  } catch (error) {
    addDebugLog('error', `❌ 切换HDR文件失败: ${error.message}`)
  }
}

/**
 * 重新加载HDR
 */
const handleReloadHDR = async () => {
  if (!skyboxPlugin) return
  
  try {
    addDebugLog('info', '🔄 重新加载HDR天空盒')
    await switchHDRFile()
    addDebugLog('success', '✅ HDR天空盒重新加载完成')
  } catch (error) {
    addDebugLog('error', `❌ 重新加载HDR失败: ${error.message}`)
  }
}

/**
 * 加载测试模型
 */
const handleLoadTestModel = () => {
  try {
    const engineInstance = getEngineInstance()
    const baseScenePlugin = getBaseScenePlugin()
    
    if (!engineInstance || !baseScenePlugin) {
      addDebugLog('warning', '⚠️ 引擎未就绪，无法加载模型')
      return
    }

    addDebugLog('info', '🐎 开始加载测试模型...')
    
    const resourcePlugin = engineInstance.getPlugin('ResourceReaderPlugin')
    if (!resourcePlugin) {
      addDebugLog('error', '❌ 资源加载插件未找到')
      return
    }

    resourcePlugin.loadModel(
      '/model/Horse.glb',
      (gltf) => {
        console.log('模型加载成功:', gltf)
        gltf.scene.traverse((child) => {
          if (child.material) {
            child.material.needsUpdate = true
          }
        })
        gltf.scene.position.set(0, -50, 0)
        gltf.scene.scale.setScalar(0.5)
        baseScenePlugin.scene.add(gltf.scene)
        addDebugLog('success', '✅ 测试模型加载完成')
      },
      (progress) => {
        if (progress.lengthComputable) {
          const percent = ((progress.loaded / progress.total) * 100).toFixed(2)
          addDebugLog('info', `📦 模型加载进度: ${percent}%`)
        }
      },
      (error) => {
        addDebugLog('error', `❌ 模型加载失败: ${error.message}`)
      }
    )
  } catch (error) {
    addDebugLog('error', `❌ 加载测试模型出错: ${error.message}`)
  }
}

/**
 * 切换调试对象显示
 */
const handleToggleDebugObjects = () => {
  showDebugObjects.value = !showDebugObjects.value
  
  debugObjects.forEach(obj => {
    if (obj.visible !== undefined) {
      obj.visible = showDebugObjects.value
    }
  })
  
  addDebugLog('info', `👁️ 调试对象${showDebugObjects.value ? '显示' : '隐藏'}`)
}

// 事件处理函数
const handleResetCamera = () => resetCamera(addDebugLog)
const clearDebugLogs = () => clearLogs()

// 生命周期
onMounted(async () => {
  try {
    addDebugLog('info', '📦 HDR天空盒测试组件挂载')
    await nextTick()
    await initializeHDREngine()
  } catch (error) {
    addDebugLog('error', `❌ 组件初始化失败: ${error.message}`)
  }
})

onUnmounted(() => {
  try {
    // 清理事件监听
    if (skyboxPlugin) {
      EngineKernel.eventBus.off('skybox-ready')
      EngineKernel.eventBus.off('skybox-error')
    }
    
    // 清理调试对象
    const baseScenePlugin = getBaseScenePlugin()
    if (baseScenePlugin?.scene) {
      debugObjects.forEach(obj => {
        baseScenePlugin.scene.remove(obj)
        obj.geometry?.dispose()
        obj.material?.dispose()
      })
    }
    debugObjects = []
    
    addDebugLog('info', '🧹 HDR天空盒测试组件卸载')
  } catch (error) {
    console.error('组件卸载时出错:', error)
  }
})
</script>

<style scoped>
.hdr-sky-test {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  font-family: 'Arial', sans-serif;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  z-index: 1000;
}

.header h1 {
  margin: 0;
  color: white;
  font-size: 24px;
  font-weight: 600;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.status-dot.loading {
  background: #ffc107;
  animation: pulse 2s infinite;
}

.status-dot.ready {
  background: #28a745;
}

.status-text {
  color: white;
  font-weight: 500;
}

.canvas-container {
  flex: 1;
  position: relative;
  background: #1a1a1a;
}

.control-panel {
  position: fixed;
  top: 80px;
  right: 20px;
  width: 320px;
  max-height: calc(100vh - 200px);
  overflow-y: auto;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(15px);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  z-index: 1000;
}

.control-section {
  padding: 20px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.control-section:last-child {
  border-bottom: none;
}

.control-section h3 {
  margin: 0 0 15px 0;
  color: #333;
  font-size: 16px;
  font-weight: 600;
}

.button-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.btn {
  padding: 10px 16px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: center;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: #007bff;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #0056b3;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background: #545b62;
}

.btn-accent {
  background: #17a2b8;
  color: white;
}

.btn-accent:hover:not(:disabled) {
  background: #138496;
}

.btn-small {
  padding: 5px 10px;
  font-size: 12px;
}

.setting-group {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 15px;
}

.setting-group label {
  min-width: 80px;
  font-size: 14px;
  color: #555;
  font-weight: 500;
}

.setting-group input[type="range"] {
  flex: 1;
  margin: 0 10px;
}

.setting-group select {
  flex: 1;
  padding: 6px 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.value-display {
  min-width: 40px;
  text-align: right;
  font-weight: 600;
  color: #007bff;
}

.info-display {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: rgba(0, 123, 255, 0.1);
  border-radius: 6px;
}

.info-item .label {
  font-size: 13px;
  color: #666;
  font-weight: 500;
}

.info-item .value {
  font-size: 13px;
  color: #333;
  font-weight: 600;
}

.debug-panel {
  position: fixed;
  bottom: 20px;
  left: 20px;
  width: 400px;
  max-height: 300px;
  background: rgba(0, 0, 0, 0.9);
  backdrop-filter: blur(10px);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  z-index: 1000;
}

.debug-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.debug-header h4 {
  margin: 0;
  color: white;
  font-size: 14px;
}

.debug-logs {
  max-height: 220px;
  overflow-y: auto;
  padding: 10px;
}

.debug-log {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 8px;
  margin-bottom: 4px;
  border-radius: 4px;
  font-size: 12px;
  line-height: 1.4;
}

.debug-log.info {
  background: rgba(0, 123, 255, 0.2);
  border-left: 3px solid #007bff;
}

.debug-log.success {
  background: rgba(40, 167, 69, 0.2);
  border-left: 3px solid #28a745;
}

.debug-log.warning {
  background: rgba(255, 193, 7, 0.2);
  border-left: 3px solid #ffc107;
}

.debug-log.error {
  background: rgba(220, 53, 69, 0.2);
  border-left: 3px solid #dc3545;
}

.log-time {
  color: #aaa;
  font-size: 11px;
  min-width: 60px;
}

.log-level {
  color: white;
  font-weight: 600;
  min-width: 50px;
  text-transform: uppercase;
}

.log-message {
  color: #eee;
  flex: 1;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* 滚动条样式 */
::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
}

::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.5);
}
</style>
