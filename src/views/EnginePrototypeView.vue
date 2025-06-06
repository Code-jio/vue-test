<template>
  <div class="engine-scene-container">
    <!-- 纯3D场景容器 -->
    <div class="canvas-container" id="canvas-container"></div>
    
    <!-- CSS3D信息面板容器（初始隐藏）-->
    <div id="css3d-container" class="css3d-container"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, createApp } from "vue";
import { useEngine } from '@/composables/useEngine'
import { useDebug } from '@/composables/useDebug'
import eventBus from '@/eventBus'
import ModelMessage from '@/components/modelMessage.vue'

// 使用引擎和调试功能
const { 
  engineReady, 
  initStatus, 
  initializeEngine,
  loadBatchModels,
  loadHorseWithAnimation,
  createSceneHelpers,
  resetCamera,
  getEngineInstance,
  getBaseScenePlugin,
  getOrbitControlPlugin
} = useEngine()

const {
  addDebugLog
} = useDebug()

// 应用状态
const loadedModels = ref([])
const horseModel = ref(null)
const isAnimating = ref(false)

// 插件引用
let mousePickPlugin = null
let css3dPlugin = null
let css3dInfoInstance = null

// 动画相关
let animationId = null
let pathPoints = []
let currentPathIndex = 0
let pathProgress = 0
const animationSpeed = 0.002

// 清理函数存储
let pickEventCleanup = []

// 初始化鼠标拾取插件
const initializeMousePick = async () => {
  try {
    const engineInstance = getEngineInstance()
    const baseScenePlugin = getBaseScenePlugin()
    const orbitControlPlugin = getOrbitControlPlugin()
    
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
        controller: orbitControlPlugin
      }
    })

    // 获取插件实例
    mousePickPlugin = engineInstance.getPlugin("MousePickPlugin")
    
    if (mousePickPlugin) {
      // 设置初始配置
      mousePickPlugin.setConfig({
        mode: 'single',
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

// 初始化CSS3D插件
const initializeCSS3D = async () => {
  try {
    const engineInstance = getEngineInstance()
    const baseScenePlugin = getBaseScenePlugin()
    
    if (!engineInstance || !baseScenePlugin) {
      throw new Error('引擎或场景插件未就绪')
    }

    addDebugLog("info", "🎨 开始初始化CSS3D插件")

    // 注册CSS3D插件
    engineInstance.register({
      name: "CSS3DRenderPlugin",
      path: "/plugins/webgl/css3DRender",
      pluginClass: EngineKernel.CSS3DRenderPlugin,
      userData: {
        scene: baseScenePlugin.scene,
        renderer: baseScenePlugin.renderer,
      },
    })

    // 获取CSS3D插件
    css3dPlugin = engineInstance.getPlugin("CSS3DRenderPlugin")
    
    if (css3dPlugin) {
      addDebugLog("success", "✅ CSS3D插件初始化完成")
    } else {
      throw new Error('CSS3D插件获取失败')
    }
    
  } catch (error) {
    addDebugLog("error", `❌ CSS3D插件初始化失败: ${error.message}`)
    throw error
  }
}

// 设置拾取事件监听器
const setupPickEventListeners = () => {
  if (!mousePickPlugin) return

  // 物体被拾取事件
  const handleObjectPicked = (data) => {
    const { results, selectedObjectId, selectedObjectName, pickMode } = data
    if (results && results.length > 0) {
      const pickedObject = results[0].object
      showModelInfo(pickedObject)
      addDebugLog("info", `🎯 点击了模型: ${selectedObjectName}`)
    }
  }

  // 注册事件监听器
  eventBus.on('mouse-pick:object-picked', handleObjectPicked)

  // 保存清理函数
  pickEventCleanup = [
    () => eventBus.off('mouse-pick:object-picked', handleObjectPicked)
  ]
}

// 显示模型信息
const showModelInfo = (pickedObject) => {
  if (!css3dPlugin || !pickedObject) return

  try {
    // 清理之前的信息面板
    if (css3dInfoInstance) {
      css3dPlugin.remove3DObject(css3dInfoInstance)
      css3dInfoInstance = null
    }

    // 获取模型信息
    const modelInfo = extractModelInfo(pickedObject)
    
    // 创建Vue应用实例
    const infoApp = createApp(ModelMessage, {
      modelInfo: modelInfo,
      onClose: () => {
        if (css3dInfoInstance) {
          css3dPlugin.remove3DObject(css3dInfoInstance)
          css3dInfoInstance = null
        }
      },
      onFocus: () => {
        focusOnModel(pickedObject)
      },
      onHighlight: () => {
        highlightModel(pickedObject)
      }
    })

    // 创建DOM容器
    const container = document.createElement('div')
    container.className = 'model-info-container'
    
    // 挂载Vue组件
    infoApp.mount(container)

    // 计算3D位置（在模型上方）
    const worldPosition = new EngineKernel.THREE.Vector3()
    pickedObject.getWorldPosition(worldPosition)
    worldPosition.y += 10 // 在模型上方10单位

    // 创建CSS3D对象
    css3dInfoInstance = css3dPlugin.createCSS3DObject(
      container,
      worldPosition.x,
      worldPosition.y,
      worldPosition.z,
      {
        scale: 1,
        lookAtCamera: true
      }
    )

    addDebugLog("success", `✅ 显示模型信息: ${modelInfo.name}`)

  } catch (error) {
    addDebugLog("error", `❌ 显示模型信息失败: ${error.message}`)
  }
}

// 提取模型信息
const extractModelInfo = (object) => {
  const position = new EngineKernel.THREE.Vector3()
  object.getWorldPosition(position)

  const info = {
    name: object.name || '未命名模型',
    type: object.type || 'Object3D',
    uuid: object.uuid,
    position: {
      x: position.x,
      y: position.y,
      z: position.z
    }
  }

  // 获取几何体信息
  if (object.geometry) {
    info.geometry = object.geometry.type
    if (object.geometry.attributes.position) {
      info.vertices = object.geometry.attributes.position.count
    }
    if (object.geometry.index) {
      info.triangles = object.geometry.index.count / 3
    }
  }

  // 获取材质信息
  if (object.material) {
    if (Array.isArray(object.material)) {
      info.material = `MultiMaterial (${object.material.length})`
    } else {
      info.material = object.material.type
    }
  }

  return info
}

// 聚焦到模型
const focusOnModel = (object) => {
  const baseScenePlugin = getBaseScenePlugin()
  const orbitControlPlugin = getOrbitControlPlugin()
  
  if (!baseScenePlugin || !orbitControlPlugin || !object) return
  
  // 获取物体世界位置
  const worldPosition = new EngineKernel.THREE.Vector3()
  object.getWorldPosition(worldPosition)
  
  // 设置轨道控制器目标
  if (orbitControlPlugin.setTarget) {
    orbitControlPlugin.setTarget(worldPosition.x, worldPosition.y, worldPosition.z)
  }
  
  addDebugLog("info", `📍 相机已聚焦到模型: ${object.name}`)
}

// 高亮模型
const highlightModel = (object) => {
  if (!object) return
  
  // 简单的高亮效果：改变材质发光
  const originalEmissive = {}
  
  object.traverse((child) => {
    if (child.material) {
      if (Array.isArray(child.material)) {
        child.material.forEach((mat, index) => {
          if (mat.emissive) {
            originalEmissive[child.uuid + '_' + index] = mat.emissive.clone()
            mat.emissive.setHex(0x444444)
          }
        })
      } else if (child.material.emissive) {
        originalEmissive[child.uuid] = child.material.emissive.clone()
        child.material.emissive.setHex(0x444444)
      }
    }
  })

  // 3秒后恢复原始材质
  setTimeout(() => {
    object.traverse((child) => {
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach((mat, index) => {
            const key = child.uuid + '_' + index
            if (originalEmissive[key] && mat.emissive) {
              mat.emissive.copy(originalEmissive[key])
            }
          })
        } else if (child.material.emissive && originalEmissive[child.uuid]) {
          child.material.emissive.copy(originalEmissive[child.uuid])
        }
      }
    })
  }, 3000)
  
  addDebugLog("success", `✨ 模型已高亮: ${object.name}`)
}

// 批量加载模型
const loadModelsFromConfig = async () => {
  try {
    addDebugLog("info", "📁 开始读取模型配置文件...")
    
    // 获取模型文件配置
    const response = await fetch('/model-files.json')
    const config = await response.json()
    
    if (!config.files || !Array.isArray(config.files)) {
      throw new Error('模型配置文件格式无效')
    }

    addDebugLog("info", `📋 找到 ${config.files.length} 个模型文件`)

    // 批量加载模型
    const models = await loadBatchModels(config.files, addDebugLog)
    loadedModels.value = models

    addDebugLog("success", `🎉 批量加载完成，成功加载 ${models.length} 个模型`)

  } catch (error) {
    addDebugLog("error", `❌ 批量加载模型失败: ${error.message}`)
  }
}

// 生成随机路径点
const generateRandomPath = () => {
  const points = []
  const numPoints = 8 + Math.floor(Math.random() * 8) // 8-15个点
  
  for (let i = 0; i < numPoints; i++) {
    const angle = (i / numPoints) * Math.PI * 2 + Math.random() * 0.5
    const radius = 80 + Math.random() * 120 // 80-200的随机半径
    const x = Math.cos(angle) * radius
    const z = Math.sin(angle) * radius
    const y = 5 + Math.random() * 15 // 5-20的高度变化
    
    points.push(new EngineKernel.THREE.Vector3(x, y, z))
  }
  
  // 闭合路径
  points.push(points[0].clone())
  
  return points
}

// 创建路径可视化
const createPathVisualization = (points) => {
  const baseScenePlugin = getBaseScenePlugin()
  if (!baseScenePlugin) return

  // 移除之前的路径线
  const existingPath = baseScenePlugin.scene.getObjectByName('HorsePath')
  if (existingPath) {
    baseScenePlugin.scene.remove(existingPath)
  }

  // 创建路径曲线
  const curve = new EngineKernel.THREE.CatmullRomCurve3(points)
  const pathGeometry = new EngineKernel.THREE.TubeGeometry(curve, 200, 0.5, 8, false)
  const pathMaterial = new EngineKernel.THREE.MeshBasicMaterial({ 
    color: 0x00ff00,
    transparent: true,
    opacity: 0.6
  })
  
  const pathMesh = new EngineKernel.THREE.Mesh(pathGeometry, pathMaterial)
  pathMesh.name = 'HorsePath'
  baseScenePlugin.scene.add(pathMesh)
  
  return curve
}

// 马模型路径动画
const animateHorse = () => {
  if (!horseModel.value || !pathPoints.length) return

  const animate = () => {
    if (!isAnimating.value) return

    // 更新路径进度
    pathProgress += animationSpeed
    if (pathProgress >= 1) {
      // 生成新的随机路径
      pathPoints = generateRandomPath()
      const curve = createPathVisualization(pathPoints)
      pathProgress = 0
      addDebugLog("info", "🐎 马模型开始新的路径")
    }

    // 获取当前位置和方向
    const curve = new EngineKernel.THREE.CatmullRomCurve3(pathPoints)
    const position = curve.getPoint(pathProgress)
    const tangent = curve.getTangent(pathProgress)

    // 更新马模型位置
    horseModel.value.position.copy(position)
    
    // 让马模型面向前进方向
    const lookAtPosition = position.clone().add(tangent)
    horseModel.value.lookAt(lookAtPosition)

    animationId = requestAnimationFrame(animate)
  }

  animate()
}

// 开始马模型动画
const startHorseAnimation = () => {
  if (!horseModel.value) {
    addDebugLog("warning", "⚠️ 马模型未加载，无法开始动画")
    return
  }

  // 生成初始路径
  pathPoints = generateRandomPath()
  createPathVisualization(pathPoints)
  
  isAnimating.value = true
  animateHorse()
  
  addDebugLog("success", "🎬 马模型路径动画已开始")
}

// 停止马模型动画
const stopHorseAnimation = () => {
  isAnimating.value = false
  if (animationId) {
    cancelAnimationFrame(animationId)
    animationId = null
  }
  
  addDebugLog("info", "⏹️ 马模型路径动画已停止")
}

// 主初始化流程
const initializeApplication = async () => {
  try {
    addDebugLog("info", "🚀 开始初始化3D场景应用")
    
    // 1. 初始化引擎核心
    await initializeEngine(addDebugLog)
    
    // 等待引擎就绪
    const waitForReady = () => {
      return new Promise((resolve) => {
        const check = () => {
          if (engineReady.value) {
            resolve()
          } else {
            setTimeout(check, 100)
          }
        }
        check()
      })
    }
    
    await waitForReady()
    addDebugLog("success", "✅ 引擎已就绪")
    
    // 2. 创建场景辅助对象
    createSceneHelpers(addDebugLog)
    
    // 3. 初始化插件
    await initializeMousePick()
    await initializeCSS3D()
    
    // 4. 批量加载模型
    await loadModelsFromConfig()
    
    // 5. 加载马模型并开始动画
    horseModel.value = await loadHorseWithAnimation(addDebugLog)
    if (horseModel.value) {
      // 延迟启动动画，确保所有初始化完成
      setTimeout(() => {
        startHorseAnimation()
      }, 1000)
    }
    
    addDebugLog("success", "🎉 3D场景应用初始化完成")
    
  } catch (error) {
    addDebugLog("error", `❌ 应用初始化失败: ${error.message}`)
  }
}

// 组件挂载
onMounted(() => {
  initializeApplication()
})

// 组件卸载
onUnmounted(() => {
  // 停止动画
  stopHorseAnimation()
  
  // 清理拾取事件监听器
  pickEventCleanup.forEach(cleanup => cleanup())
  
  // 清理CSS3D信息面板
  if (css3dInfoInstance && css3dPlugin) {
    css3dPlugin.remove3DObject(css3dInfoInstance)
  }
  
  // 清理引擎资源
  const engineInstance = getEngineInstance()
  if (engineInstance) {
    addDebugLog("info", "🧹 引擎资源清理完成")
  }
})
</script>

<style scoped lang="css">
.engine-scene-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  margin: 0;
  padding: 0;
  background: #000;
}

.canvas-container {
  width: 100%;
  height: 100%;
  position: relative;
}

.css3d-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1000;
}

.model-info-container {
  pointer-events: auto;
}

/* 确保Canvas能正确接收鼠标事件 */
.canvas-container canvas {
  display: block;
  cursor: pointer;
}
</style>

