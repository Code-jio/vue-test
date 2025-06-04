<template>
  <div class="hdr-basic-example">
    <!-- 标题 -->
    <div class="header">
      <h1>🌅 HDR天空盒基础示例</h1>
      <div class="status">
        <span :class="['dot', engineReady ? 'ready' : 'loading']"></span>
        <span>{{ initStatus }}</span>
      </div>
    </div>

    <!-- 3D场景容器 -->
    <div id="canvas-container" class="canvas-container"></div>

    <!-- 简单控制面板 -->
    <div class="controls">
      <div class="control-group">
        <h3>🎮 基础控制</h3>
        <button @click="handleResetCamera" :disabled="!engineReady" class="btn">
          重置相机
        </button>
        <button @click="handleAddTestObject" :disabled="!engineReady" class="btn">
          添加测试对象
        </button>
      </div>

      <div class="control-group">
        <h3>🌌 HDR设置</h3>
        <div class="setting">
          <label>曝光强度: {{ hdrIntensity }}</label>
          <input 
            type="range" 
            v-model="hdrIntensity" 
            min="0.1" 
            max="2.0" 
            step="0.1"
            @input="updateHDRIntensity"
            :disabled="!engineReady"
          />
        </div>
      </div>

      <div class="control-group">
        <h3>📊 信息</h3>
        <div class="info">
          <p>引擎状态: {{ engineReady ? '就绪' : '加载中' }}</p>
          <p>HDR文件: rustig_koppie_puresky_2k.hdr</p>
          <p>曝光强度: {{ hdrIntensity }}x</p>
        </div>
      </div>
    </div>

    <!-- 简化的日志 -->
    <div class="logs">
      <h4>🔍 日志</h4>
      <div class="log-list">
        <div v-for="log in debugLogs.slice(-5)" :key="log.id" :class="['log', log.level]">
          {{ log.message }}
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
  getBaseScenePlugin
} = useEngine()

const {
  debugLogs,
  addDebugLog
} = useDebug()

// 响应式状态
const hdrIntensity = ref(1.0)

// 插件引用
let skyboxPlugin = null
let testObjects = []

/**
 * 初始化HDR天空盒引擎
 */
const initializeHDREngine = async () => {
  try {
    addDebugLog('info', '🚀 开始初始化HDR天空盒引擎')
    
    // 配置HDR天空盒参数
    const hdrSkyBoxConfig = {
      skyBoxType: EngineKernel.SkyBoxType.HDR_ENVIRONMENT,
      hdrMapPath: '/skybox/rustig_koppie_puresky_2k.hdr',
      hdrIntensity: hdrIntensity.value,
      size: 50000
    }
    
    // 复用useEngine的初始化逻辑，传入HDR配置
    await initializeEngine(addDebugLog, hdrSkyBoxConfig)
    
    // 等待引擎就绪
    await waitForEngineReady()
    
    if (engineReady.value) {
      // 获取天空盒插件实例
      skyboxPlugin = getEngineInstance().getPlugin('SkyBoxPlugin')
      
      if (skyboxPlugin) {
        addDebugLog('success', '✅ HDR天空盒插件获取成功')
        
        // 监听天空盒就绪事件
        EngineKernel.eventBus.on('skybox-ready', (data) => {
          addDebugLog('success', `🌌 HDR天空盒加载完成`)
        })
        
        EngineKernel.eventBus.on('skybox-error', (error) => {
          addDebugLog('error', `❌ HDR天空盒加载失败: ${error.message}`)
        })
      }
      
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
 * 添加测试对象
 */
const handleAddTestObject = () => {
  try {
    const baseScenePlugin = getBaseScenePlugin()
    if (!baseScenePlugin?.scene) return

    const THREE = EngineKernel.THREE
    const scene = baseScenePlugin.scene

    // 创建一个金属球体来展示HDR反射效果
    const geometry = new THREE.SphereGeometry(30, 32, 16)
    const material = new THREE.MeshStandardMaterial({ 
      color: 0xffffff, 
      metalness: 0.9, 
      roughness: 0.1 
    })
    
    const sphere = new THREE.Mesh(geometry, material)
    sphere.position.set(
      (Math.random() - 0.5) * 200,
      Math.random() * 100,
      (Math.random() - 0.5) * 200
    )
    
    scene.add(sphere)
    testObjects.push(sphere)
    
    addDebugLog('success', `✅ 添加了测试对象，总数: ${testObjects.length}`)
    
  } catch (error) {
    addDebugLog('error', `❌ 添加测试对象失败: ${error.message}`)
  }
}

// 事件处理函数
const handleResetCamera = () => resetCamera(addDebugLog)

// 生命周期
onMounted(async () => {
  try {
    addDebugLog('info', '📦 HDR天空盒基础示例组件挂载')
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
    
    // 清理测试对象
    const baseScenePlugin = getBaseScenePlugin()
    if (baseScenePlugin?.scene) {
      testObjects.forEach(obj => {
        baseScenePlugin.scene.remove(obj)
        obj.geometry?.dispose()
        obj.material?.dispose()
      })
    }
    testObjects = []
    
    addDebugLog('info', '🧹 HDR天空盒基础示例组件卸载')
  } catch (error) {
    console.error('组件卸载时出错:', error)
  }
})
</script>

<style scoped>
.hdr-basic-example {
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

.status {
  display: flex;
  align-items: center;
  gap: 8px;
  color: white;
  font-weight: 500;
}

.dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.dot.loading {
  background: #ffc107;
  animation: pulse 2s infinite;
}

.dot.ready {
  background: #28a745;
}

.canvas-container {
  flex: 1;
  position: relative;
  background: #1a1a1a;
}

.controls {
  position: fixed;
  top: 80px;
  right: 20px;
  width: 280px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(15px);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  z-index: 1000;
}

.control-group {
  padding: 20px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.control-group:last-child {
  border-bottom: none;
}

.control-group h3 {
  margin: 0 0 15px 0;
  color: #333;
  font-size: 16px;
  font-weight: 600;
}

.btn {
  width: 100%;
  padding: 10px 16px;
  margin-bottom: 8px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  background: #007bff;
  color: white;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn:hover:not(:disabled) {
  background: #0056b3;
}

.setting {
  margin-bottom: 15px;
}

.setting label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  color: #555;
  font-weight: 500;
}

.setting input[type="range"] {
  width: 100%;
}

.info p {
  margin: 5px 0;
  font-size: 13px;
  color: #666;
}

.logs {
  position: fixed;
  bottom: 20px;
  left: 20px;
  width: 350px;
  max-height: 200px;
  background: rgba(0, 0, 0, 0.9);
  backdrop-filter: blur(10px);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  z-index: 1000;
  padding: 15px;
}

.logs h4 {
  margin: 0 0 10px 0;
  color: white;
  font-size: 14px;
}

.log-list {
  max-height: 150px;
  overflow-y: auto;
}

.log {
  padding: 5px 8px;
  margin-bottom: 3px;
  border-radius: 4px;
  font-size: 12px;
  line-height: 1.4;
  color: #eee;
}

.log.info {
  background: rgba(0, 123, 255, 0.2);
  border-left: 3px solid #007bff;
}

.log.success {
  background: rgba(40, 167, 69, 0.2);
  border-left: 3px solid #28a745;
}

.log.error {
  background: rgba(220, 53, 69, 0.2);
  border-left: 3px solid #dc3545;
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