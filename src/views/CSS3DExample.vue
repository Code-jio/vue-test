<template>
  <div id="css3d-container">
    <!-- Canvas容器 - 必须在最前面 -->
    <div class="canvas-container" id="canvas-container"></div>
    
    <!-- 控制面板 -->
    <div class="control-panel">
      <h3>🎮 CSS3D 示例控制台</h3>
      <div class="control-group">
        <button @click="initEngineScene" class="btn primary" :disabled="!engineReady">初始化EngineKernel场景</button>
        <button @click="directInitializeEngine" class="btn warning">备用直接初始化</button>
        <button @click="createCSS3DObjects" class="btn success" :disabled="!engineReady">创建CSS3D对象</button>
        <button @click="clearAllObjects" class="btn danger" :disabled="!engineReady">清空所有对象</button>
        <button @click="debugCSS3DObjects" class="btn info" :disabled="!css3dPlugin">🔍 调试CSS3D对象</button>
        <button @click="adjustCameraView" class="btn secondary" :disabled="!css3dPlugin">📷 调整相机视角</button>
        <button @click="testVueEvents" class="btn info" :disabled="!css3dPlugin">🧪 测试Vue事件绑定</button>
      </div>
      <div class="control-group">
        <button @click="toggleDebugMode" class="btn debug" :disabled="!engineReady">🐛 切换Debug模式</button>
        <button @click="toggleGridHelper" class="btn debug" :disabled="!engineReady">📐 切换网格</button>
        <button @click="toggleAxesHelper" class="btn debug" :disabled="!engineReady">🎯 切换坐标轴</button>
        <button @click="getDebugStatus" class="btn debug" :disabled="!engineReady">📊 Debug状态</button>
      </div>
      <div class="control-group">
        <label>渲染模式:</label>
        <select v-model="renderMode" @change="updateRenderMode" :disabled="!engineReady">
          <option value="continuous">连续渲染</option>
          <option value="onDemand">按需渲染</option>
        </select>
      </div>
      <div class="status-info">
        <p>引擎状态: {{ initStatus }}</p>
        <p>场景状态: {{ sceneStatus }}</p>
        <p>对象数量: {{ objectCount }}</p>
      </div>
      
      <!-- 调试信息 -->
      <div class="debug-section">
        <h4>🔍 调试信息</h4>
        <div class="debug-info">
          <div v-for="log in debugLogs" :key="log.id" class="debug-log">
            <span class="log-time">{{ log.time }}</span>
            <span :class="['log-level', log.level]">{{ log.level }}</span>
            <span class="log-message">{{ log.message }}</span>
          </div>
        </div>
      </div>
    </div>

    <!--  -->
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick, createApp } from 'vue'
import { useEngine } from '@/composables/useEngine'
import { useDebug } from '@/composables/useDebug'
import Chart3D from '../components/Chart3D.vue'
import Card3D from '../components/Card3D.vue'
import Form3D from '../components/Form3D.vue'
import Controls3D from '../components/Controls3D.vue'
import Media3D from '../components/Media3D.vue'

// 使用 composables
const { 
  engineReady, 
  initStatus, 
  initializeEngine,
  getEngineInstance,
  getBaseScenePlugin
} = useEngine()

const {
  debugLogs,
  addDebugLog
} = useDebug()

// 响应式数据
const sceneStatus = ref('未初始化')
const objectCount = ref(0)
const renderMode = ref('continuous')

// 核心实例
let css3dPlugin = null
let createdObjects = []

/**
 * 初始化EngineKernel场景
 */
const initEngineScene = async () => {
  try {
    addDebugLog("info", "🚀 开始初始化EngineKernel场景")
    sceneStatus.value = '正在初始化引擎...'
    
    // 检查EngineKernel是否可用
    if (typeof EngineKernel === 'undefined') {
      throw new Error('EngineKernel未加载，请检查引入')
    }
    
    // 检查Canvas容器是否存在
    const canvasContainer = document.getElementById("canvas-container")
    if (!canvasContainer) {
      throw new Error('Canvas容器未找到')
    }
    
    addDebugLog("info", "✅ 前置条件检查通过")
    
    try {
      // 尝试使用 useEngine 初始化引擎
      await initializeEngine(addDebugLog)
      
      // 等待引擎完全就绪
      addDebugLog("info", "⏳ 等待引擎就绪...")
      await waitForEngineReady()
      
      if (engineReady.value) {
        // 注册CSS3D插件
        await registerCSS3DPlugin()
      } else {
        throw new Error('引擎未能正确就绪')
      }
      
    } catch (useEngineError) {
      addDebugLog("warning", `⚠️ useEngine初始化失败: ${useEngineError.message}`)
      addDebugLog("info", "🔄 尝试备用直接初始化方法")
      
      // 使用备用的直接初始化方法
      await directInitializeEngine()
    }
    
    sceneStatus.value = '场景创建完成'
    addDebugLog("success", "🎉 EngineKernel场景初始化成功！")
    
  } catch (error) {
    addDebugLog("error", `❌ EngineKernel场景初始化失败: ${error.message}`)
    sceneStatus.value = '场景创建失败'
  }
}

/**
 * 等待引擎就绪
 */
const waitForEngineReady = () => {
  return new Promise((resolve, reject) => {
    let attempts = 0
    const maxAttempts = 50 // 最多等待5秒
    
    const checkReady = () => {
      if (engineReady.value) {
        addDebugLog("success", "✅ 引擎已就绪")
        resolve()
        return
      }
      
      attempts++
      if (attempts >= maxAttempts) {
        reject(new Error('引擎就绪超时'))
        return
      }
      
      setTimeout(checkReady, 100)
    }
    
    checkReady()
  })
}

/**
 * 注册CSS3D插件到EngineKernel
 */
const registerCSS3DPlugin = async () => {
  try {
    const engineInstance = getEngineInstance()
    const baseScenePlugin = getBaseScenePlugin()
    
    if (!engineInstance || !baseScenePlugin) {
      throw new Error('引擎实例或场景插件未就绪')
    }

    // 获取Canvas容器
    const canvasContainer = document.getElementById("canvas-container")
    if (!canvasContainer) {
      throw new Error('Canvas容器未找到')
    }

    // 注册CSS3D插件到EngineKernel，传入容器信息
    engineInstance.register({
      name: "CSS3DRenderPlugin",
      path: "/plugins/webgl/css3DRender",
      pluginClass: EngineKernel.CSS3DRenderPlugin,
      userData: {
        scene: baseScenePlugin.scene,
        camera: baseScenePlugin.camera,
        container: canvasContainer  // 传入容器
      }
    })

    // 获取CSS3D插件实例
    css3dPlugin = engineInstance.getPlugin("CSS3DRenderPlugin")
    
    if (css3dPlugin) {
      // 手动修复CSS3D渲染器的定位
      await fixCSS3DRendererPosition()
      
      // 设置渲染模式
      css3dPlugin.setRenderMode(renderMode.value)
      addDebugLog("success", "✅ CSS3D插件注册成功")
      sceneStatus.value = 'CSS3D插件已就绪'
    } else {
      throw new Error('CSS3D插件获取失败')
    }
    
  } catch (error) {
    addDebugLog("error", `❌ CSS3D插件注册失败: ${error.message}`)
    throw error
  }
}

/**
 * 修复CSS3D渲染器定位
 */
const fixCSS3DRendererPosition = async () => {
  try {
    if (!css3dPlugin) return
    
    // 获取CSS3D渲染器
    const css3dRenderer = css3dPlugin.getCSS3DRenderer()
    if (!css3dRenderer) {
      throw new Error('CSS3D渲染器未找到')
    }
    
    const canvasContainer = document.getElementById("canvas-container")
    if (!canvasContainer) {
      throw new Error('Canvas容器未找到')
    }
    
    // 获取CSS3D渲染器的DOM元素
    const css3dDomElement = css3dRenderer.domElement
    
    // 移除CSS3D渲染器可能被添加到body的元素
    if (css3dDomElement.parentNode === document.body) {
      document.body.removeChild(css3dDomElement)
    }
    
    // 将CSS3D渲染器添加到canvas容器中
    canvasContainer.appendChild(css3dDomElement)
    
    // 确保CSS3D渲染器尺寸正确
    css3dRenderer.setSize(window.innerWidth, window.innerHeight)
    
    addDebugLog("success", "✅ CSS3D渲染器定位已修复")
    
  } catch (error) {
    addDebugLog("error", `❌ CSS3D渲染器定位修复失败: ${error.message}`)
    throw error
  }
}

/**
 * 渲染Vue组件为HTML元素（保持Vue实例活跃）
 */
const renderComponentToHTML = (component) => {
  return new Promise((resolve, reject) => {
    try {
      // 创建一个临时的容器，但不隐藏它
      const tempContainer = document.createElement('div')
      tempContainer.style.position = 'absolute'
      tempContainer.style.top = '-9999px'  // 移到视窗外
      tempContainer.style.left = '-9999px'
      tempContainer.style.visibility = 'hidden'  // 隐藏但保持布局
      
      // 添加到DOM中（Vue实例需要在DOM中才能正常工作）
      document.body.appendChild(tempContainer)
      
      // 创建Vue应用实例
      const app = createApp(component)
      
      // 挂载组件到临时容器
      const instance = app.mount(tempContainer)
      
      // 等待下一个tick确保渲染完成
      nextTick(() => {
        // 获取渲染后的HTML元素
        const renderedElement = tempContainer.firstElementChild
        
        if (renderedElement) {
          // 不再克隆元素，直接使用原始元素
          // 将元素从临时容器移除，但保持Vue实例活跃
          tempContainer.removeChild(renderedElement)
          
          // 清理临时容器
          document.body.removeChild(tempContainer)
          
          // 保存Vue实例引用到全局，避免被垃圾回收
          if (!window.vueInstancesForCSS3D) {
            window.vueInstancesForCSS3D = new Map()
          }
          
          // 为元素生成唯一ID并保存Vue实例
          const elementId = `vue-instance-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
          renderedElement.setAttribute('data-vue-instance-id', elementId)
          window.vueInstancesForCSS3D.set(elementId, { app, instance })
          
          // 返回保持Vue实例活跃的元素
          resolve(renderedElement)
        } else {
          reject(new Error('组件渲染失败'))
        }
      })
      
    } catch (error) {
      reject(error)
    }
  })
}

/**
 * 创建CSS3D对象
 * 直接渲染Vue组件为HTML，不在页面显示
 */
const createCSS3DObjects = async () => {
  if (!css3dPlugin) {
    addDebugLog("error", "❌ CSS3D插件未就绪")
    alert('请先初始化EngineKernel场景！')
    return
  }

  try {
    addDebugLog("info", "🎨 开始创建CSS3D对象")
    sceneStatus.value = '正在创建CSS3D对象...'

    // 定义组件配置
    const componentConfigs = [
      {
        component: Chart3D,
        css3dId: 'css3d-chart',
        position: [0, 0, 0],
        rotation: [0, 0.2, 0],
        scale: 0.1,
        name: '图表组件'
      },
      {
        component: Card3D,
        css3dId: 'css3d-card',
        position: [0, 0, 40],
        rotation: [0, 0, 0],
        scale: 0.1,
        name: '卡片组件'
      },
      {
        component: Form3D,
        css3dId: 'css3d-form',
        position: [0, -50, 50],
        rotation: [0.1, 0, 0],
        scale: 0.1,
        name: '表单组件'
      },
      {
        component: Controls3D,
        css3dId: 'css3d-controls',
        position: [-100, 0, 10],
        rotation: [0, 0.1, 0],
        scale: 0.1,
        name: '控制组件'
      },
      {
        component: Media3D,
        css3dId: 'css3d-media',
        position: [50, 20, -50],
        rotation: [0, -0.2, 0],
        scale: 0.1,
        name: '媒体组件'
      }
    ]

    // 创建所有CSS3D对象
    for (const config of componentConfigs) {
      try {
        addDebugLog("info", `🎨 正在渲染${config.name}`)
        
        // 直接渲染Vue组件为HTML元素
        const htmlElement = await renderComponentToHTML(config.component)
        
        if (htmlElement) {
          // 给元素添加唯一ID
          htmlElement.id = `${config.css3dId}-rendered`
          
          const objectId = css3dPlugin.createCSS3DObject({
            element: htmlElement,
            position: config.position,
            rotation: config.rotation,
            scale: config.scale,
            id: config.css3dId,
            visible: true,
            interactive: true,
            complete: () => addDebugLog("success", `✅ ${config.name}已添加到3D场景`)
          })
          
          createdObjects.push(objectId)
          addDebugLog("success", `✅ ${config.name}创建成功`)
        }
        
      } catch (error) {
        addDebugLog("error", `❌ 渲染${config.name}失败: ${error.message}`)
      }
    }

    // 更新状态
    objectCount.value = createdObjects.length
    sceneStatus.value = `已创建 ${createdObjects.length} 个CSS3D对象`
    addDebugLog("success", `🎉 所有CSS3D对象创建完成！共创建 ${createdObjects.length} 个对象`)
    
  } catch (error) {
    addDebugLog("error", `❌ 创建CSS3D对象失败: ${error.message}`)
    sceneStatus.value = '创建对象失败'
  }
}

/**
 * 清空所有对象
 */
const clearAllObjects = () => {
  if (!css3dPlugin) {
    addDebugLog("error", "❌ CSS3D插件未就绪")
    alert('场景未初始化！')
    return
  }

  try {
    addDebugLog("info", "🗑️ 开始清空所有CSS3D对象")
    
    // 移除所有创建的对象并清理Vue实例
    createdObjects.forEach(id => {
      // 移除CSS3D对象
      css3dPlugin.removeObject(id)
      
      // 清理对应的Vue实例
      cleanupVueInstanceForCSS3DObject(id)
    })
    
    createdObjects = []
    objectCount.value = 0
    sceneStatus.value = '所有对象已清空'
    
    addDebugLog("success", "🗑️ 所有CSS3D对象及Vue实例已清空")
    
  } catch (error) {
    addDebugLog("error", `❌ 清空对象失败: ${error.message}`)
  }
}

/**
 * 清理CSS3D对象对应的Vue实例
 */
const cleanupVueInstanceForCSS3DObject = (objectId) => {
  try {
    if (!window.vueInstancesForCSS3D) return
    
    // 查找CSS3D对象中的元素
    const css3dItem = css3dPlugin?.items?.get?.(objectId)
    if (!css3dItem || !css3dItem.element) return
    
    const element = css3dItem.element
    const vueInstanceId = element.getAttribute('data-vue-instance-id')
    
    if (vueInstanceId && window.vueInstancesForCSS3D.has(vueInstanceId)) {
      const { app } = window.vueInstancesForCSS3D.get(vueInstanceId)
      
      // 卸载Vue实例
      if (app && typeof app.unmount === 'function') {
        app.unmount()
        addDebugLog("success", `✅ Vue实例已清理: ${vueInstanceId}`)
      }
      
      // 从全局映射中移除
      window.vueInstancesForCSS3D.delete(vueInstanceId)
    }
    
  } catch (error) {
    addDebugLog("warning", `⚠️ 清理Vue实例时出错: ${error.message}`)
  }
}

/**
 * 更新渲染模式
 */
const updateRenderMode = () => {
  if (css3dPlugin) {
    css3dPlugin.setRenderMode(renderMode.value)
    addDebugLog("info", `🎬 渲染模式已切换到: ${renderMode.value}`)
  }
}

/**
 * 清理所有资源
 */
const cleanup = () => {
  try {
    addDebugLog("info", "🧹 开始清理资源")
    
    // 清理CSS3D对象
    if (css3dPlugin && createdObjects.length > 0) {
      createdObjects.forEach(id => {
        css3dPlugin.removeObject(id)
        // 清理对应的Vue实例
        cleanupVueInstanceForCSS3DObject(id)
      })
    }
    
    // 清理剩余的Vue实例（防止遗漏）
    if (window.vueInstancesForCSS3D) {
      window.vueInstancesForCSS3D.forEach(({ app }, instanceId) => {
        try {
          if (app && typeof app.unmount === 'function') {
            app.unmount()
          }
        } catch (error) {
          console.warn(`清理Vue实例${instanceId}失败:`, error)
        }
      })
      window.vueInstancesForCSS3D.clear()
      addDebugLog("success", "✅ 所有Vue实例已清理")
    }
    
    // 清理创建的对象记录
    createdObjects = []
    objectCount.value = 0
    
    addDebugLog("success", "🗑️ 所有资源已清理")
    
  } catch (error) {
    addDebugLog("error", `❌ 资源清理失败: ${error.message}`)
  }
}

/**
 * 组件挂载后自动初始化
 */
onMounted(() => {
  addDebugLog("info", "🚀 CSS3D示例页面已挂载")
  
  // 延迟初始化，确保DOM和EngineKernel已加载
  setTimeout(() => {
    if (typeof EngineKernel !== 'undefined') {
      // 自动初始化引擎场景
      initEngineScene()
    } else {
      addDebugLog("error", "❌ EngineKernel未加载，请检查引入")
    }
  }, 1000)
})

/**
 * 备用直接初始化方法（如果useEngine失败）
 */
const directInitializeEngine = async () => {
  try {
    addDebugLog("info", "🔄 尝试直接初始化引擎")
    sceneStatus.value = '正在直接初始化引擎...'
    
    // 确保DOM已经渲染
    await nextTick()
    
    // 获取Canvas容器
    const canvasContainer = document.getElementById("canvas-container")
    if (!canvasContainer) {
      throw new Error('Canvas容器未找到')
    }
    
    // 直接创建EngineKernel实例
    const engineInstance = new EngineKernel.BaseCore({
      pluginsParams: [
        {
          name: "BaseScene",
          path: "/plugins/scene",
          pluginClass: EngineKernel.BaseScene,
          userData: {
            rendererConfig: {
              container: canvasContainer,
            }
          },
        },
      ],
    })

    // 获取基础场景插件
    const baseScenePlugin = engineInstance.getPlugin("BaseScene")
    
    if (!baseScenePlugin) {
      throw new Error('BaseScene插件获取失败')
    }

    addDebugLog("success", "✅ 基础场景创建完成")

    // 注册渲染循环插件
    engineInstance.register({
      name: "RenderLoopPlugin",
      path: "/plugins/webgl/renderLoop",
      pluginClass: EngineKernel.RenderLoop,
      userData: {
        scene: baseScenePlugin.scene,
      },
    })

    // 注册CSS3D插件
    engineInstance.register({
      name: "CSS3DRenderPlugin",
      path: "/plugins/webgl/css3DRender",
      pluginClass: EngineKernel.CSS3DRenderPlugin,
      userData: {
        scene: baseScenePlugin.scene,
        camera: baseScenePlugin.camera,
        container: canvasContainer  // 传入容器
      }
    })

    // 获取CSS3D插件实例
    css3dPlugin = engineInstance.getPlugin("CSS3DRenderPlugin")
    
    if (css3dPlugin) {
      // 手动修复CSS3D渲染器的定位
      await fixCSS3DRendererPosition()
      
      css3dPlugin.setRenderMode(renderMode.value)
      addDebugLog("success", "✅ CSS3D插件注册成功")
      sceneStatus.value = 'CSS3D插件已就绪（直接模式）'
      
      // 启动渲染循环
      const renderLoopPlugin = engineInstance.getPlugin("RenderLoopPlugin")
      if (renderLoopPlugin) {
        renderLoopPlugin.initialize()
        addDebugLog("success", "🎬 渲染循环启动完成")
      }
      
      addDebugLog("success", "🎉 直接初始化成功！")
    } else {
      throw new Error('CSS3D插件获取失败')
    }
    
  } catch (error) {
    addDebugLog("error", `❌ 直接初始化失败: ${error.message}`)
    throw error
  }
}

/**
 * 调试CSS3D对象
 */
const debugCSS3DObjects = () => {
  if (!css3dPlugin) {
    addDebugLog("error", "❌ CSS3D插件未就绪")
    return
  }

  try {
    addDebugLog("info", "🔍 开始调试CSS3D对象")
    
    // 检查CSS3D渲染器
    const css3dRenderer = css3dPlugin.getCSS3DRenderer()
    if (css3dRenderer) {
      addDebugLog("success", "✅ CSS3D渲染器存在")
      
      const domElement = css3dRenderer.domElement
      addDebugLog("info", `📐 CSS3D渲染器尺寸: ${domElement.offsetWidth}x${domElement.offsetHeight}`)
      addDebugLog("info", `📍 CSS3D渲染器位置: (${domElement.offsetLeft}, ${domElement.offsetTop})`)
      addDebugLog("info", `👁️ CSS3D渲染器可见性: ${domElement.style.visibility || 'visible'}`)
      addDebugLog("info", `🎭 CSS3D渲染器透明度: ${domElement.style.opacity || '1'}`)
    } else {
      addDebugLog("error", "❌ CSS3D渲染器未找到")
    }
    
    // 检查场景中的CSS3D对象
    const baseScenePlugin = getBaseScenePlugin()
    if (baseScenePlugin && baseScenePlugin.scene) {
      let css3dObjectCount = 0
      baseScenePlugin.scene.traverse((child) => {
        if (child.type === 'CSS3DObject') {
          css3dObjectCount++
          addDebugLog("info", `🎯 CSS3D对象${css3dObjectCount}: 位置(${child.position.x.toFixed(1)}, ${child.position.y.toFixed(1)}, ${child.position.z.toFixed(1)})`)
        }
      })
      addDebugLog("info", `📊 场景中CSS3D对象总数: ${css3dObjectCount}`)
    }
    
    // 检查相机信息
    if (baseScenePlugin && baseScenePlugin.camera) {
      const camera = baseScenePlugin.camera
      addDebugLog("info", `📸 相机位置: (${camera.position.x.toFixed(1)}, ${camera.position.y.toFixed(1)}, ${camera.position.z.toFixed(1)})`)
      addDebugLog("info", `🎯 相机朝向: (${camera.rotation.x.toFixed(2)}, ${camera.rotation.y.toFixed(2)}, ${camera.rotation.z.toFixed(2)})`)
    }
    
  } catch (error) {
    addDebugLog("error", `❌ 调试CSS3D对象失败: ${error.message}`)
  }
}

/**
 * 调整相机视角以便看到CSS3D对象
 */
const adjustCameraView = () => {
  try {
    addDebugLog("info", "📷 调整相机视角")
    
    const baseScenePlugin = getBaseScenePlugin()
    if (!baseScenePlugin || !baseScenePlugin.camera) {
      addDebugLog("error", "❌ 相机未找到")
      return
    }
    
    const camera = baseScenePlugin.camera
    
    // 设置相机到能看到CSS3D对象的位置
    camera.position.set(0, 0, 800)  // 向后拉远
    camera.lookAt(0, 0, 0)  // 看向原点
    
    // 如果有轨道控制器，也更新一下
    const orbitControls = getOrbitControlPlugin && getOrbitControlPlugin()
    if (orbitControls && orbitControls.setCameraPosition) {
      orbitControls.setCameraPosition(0, 0, 800, 0, 0, 0)
    }
    
    addDebugLog("success", "✅ 相机视角已调整")
    
  } catch (error) {
    addDebugLog("error", `❌ 调整相机视角失败: ${error.message}`)
  }
}

/**
 * 测试Vue事件绑定是否正常工作
 */
const testVueEvents = () => {
  try {
    addDebugLog("info", "🧪 开始测试Vue事件绑定")
    
    if (!window.vueInstancesForCSS3D || window.vueInstancesForCSS3D.size === 0) {
      addDebugLog("warning", "⚠️ 没有找到活跃的Vue实例")
      alert("请先创建CSS3D对象后再测试事件绑定！")
      return
    }
    
    // 检查Vue实例状态
    let activeInstances = 0
    window.vueInstancesForCSS3D.forEach(({ app, instance }, instanceId) => {
      if (app && instance) {
        activeInstances++
        addDebugLog("success", `✅ Vue实例活跃: ${instanceId}`)
      }
    })
    
    addDebugLog("info", `📊 共找到 ${activeInstances} 个活跃的Vue实例`)
    
    // 查找卡片按钮并模拟点击（程序化测试）
    const cardButton = document.querySelector('[data-vue-instance-id] .card-button')
    if (cardButton) {
      addDebugLog("info", "🎯 找到卡片按钮，测试程序化点击")
      cardButton.click()
      addDebugLog("success", "✅ 程序化点击测试完成")
    } else {
      addDebugLog("warning", "⚠️ 未找到卡片按钮")
    }
    
    // 提示用户手动测试
    alert(`🧪 Vue事件绑定测试:\n\n✅ 找到 ${activeInstances} 个活跃Vue实例\n\n💡 请手动点击3D场景中的按钮来测试交互！\n\n📍 如果按钮有响应，说明事件绑定成功！`)
    
  } catch (error) {
    addDebugLog("error", `❌ 测试Vue事件绑定失败: ${error.message}`)
  }
}

/**
 * 组件卸载前清理
 */
onUnmounted(() => {
  cleanup()
  addDebugLog("info", "🗑️ CSS3D示例页面已卸载")
})

/**
 * 切换Debug模式
 */
const toggleDebugMode = () => {
  try {
    const baseScenePlugin = getBaseScenePlugin()
    if (!baseScenePlugin) {
      addDebugLog("error", "❌ 基础场景插件未找到")
      return
    }
    
    const currentStatus = baseScenePlugin.getDebugStatus()
    const newStatus = !currentStatus.enabled
    
    baseScenePlugin.setDebugMode(newStatus)
    addDebugLog("success", `🐛 Debug模式已${newStatus ? '启用' : '禁用'}`)
    
  } catch (error) {
    addDebugLog("error", `❌ 切换Debug模式失败: ${error.message}`)
  }
}

/**
 * 切换网格辅助器
 */
const toggleGridHelper = () => {
  try {
    const baseScenePlugin = getBaseScenePlugin()
    if (!baseScenePlugin) {
      addDebugLog("error", "❌ 基础场景插件未找到")
      return
    }
    
    baseScenePlugin.toggleGridHelper()
    addDebugLog("success", "📐 网格辅助器已切换")
    
  } catch (error) {
    addDebugLog("error", `❌ 切换网格辅助器失败: ${error.message}`)
  }
}

/**
 * 切换坐标轴辅助器
 */
const toggleAxesHelper = () => {
  try {
    const baseScenePlugin = getBaseScenePlugin()
    if (!baseScenePlugin) {
      addDebugLog("error", "❌ 基础场景插件未找到")
      return
    }
    
    baseScenePlugin.toggleAxesHelper()
    addDebugLog("success", "🎯 坐标轴辅助器已切换")
    
  } catch (error) {
    addDebugLog("error", `❌ 切换坐标轴辅助器失败: ${error.message}`)
  }
}

/**
 * 获取Debug状态
 */
const getDebugStatus = () => {
  try {
    const baseScenePlugin = getBaseScenePlugin()
    if (!baseScenePlugin) {
      addDebugLog("error", "❌ 基础场景插件未找到")
      return
    }
    
    const status = baseScenePlugin.getDebugStatus()
    addDebugLog("info", "📊 Debug状态:")
    addDebugLog("info", `  • Debug模式: ${status.enabled ? '启用' : '禁用'}`)
    addDebugLog("info", `  • 网格辅助器: ${status.gridHelper.enabled ? '启用' : '禁用'} (大小: ${status.gridHelper.size}, 分割: ${status.gridHelper.divisions})`)
    addDebugLog("info", `  • 坐标轴辅助器: ${status.axesHelper.enabled ? '启用' : '禁用'} (大小: ${status.axesHelper.size})`)
    
  } catch (error) {
    addDebugLog("error", `❌ 获取Debug状态失败: ${error.message}`)
  }
}
</script>

<style scoped>
#css3d-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  margin: 0;
  padding: 0;
  pointer-events: none;
  z-index: 1;
}

/* Canvas容器 */
.canvas-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

/* 确保CSS3D元素能正确显示 */
.canvas-container canvas,
.canvas-container > div {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

/* 控制面板样式 */
.control-panel {
  position: absolute;
  top: 20px;
  left: 20px;
  width: 320px;
  max-width: calc(100vw - 40px);
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(10px);
  max-height: calc(100vh - 40px);
  overflow-y: auto;
  pointer-events: auto;
  z-index: 1001;
}

.control-panel h3 {
  margin: 0 0 16px 0;
  color: #333;
  font-size: 16px;
}

.control-group {
  margin-bottom: 12px;
}

.control-group label {
  display: block;
  margin-bottom: 4px;
  font-weight: 500;
  color: #555;
}

.control-group select {
  width: 100%;
  padding: 6px;
  border: 1px solid #ccc;
  border-radius: 4px;
}

/* 按钮样式 */
.btn {
  padding: 8px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  margin-right: 8px;
  margin-bottom: 6px;
  transition: all 0.2s;
}

.btn:disabled {
  background: #6c757d;
  cursor: not-allowed;
  transform: none;
}

.btn.primary {
  background: #007bff;
  color: white;
}

.btn.primary:hover:not(:disabled) {
  background: #0056b3;
}

.btn.success {
  background: #28a745;
  color: white;
}

.btn.success:hover:not(:disabled) {
  background: #218838;
}

.btn.danger {
  background: #dc3545;
  color: white;
}

.btn.danger:hover:not(:disabled) {
  background: #c82333;
}

.btn.warning {
  background: #ffc107;
  color: white;
}

.btn.warning:hover:not(:disabled) {
  background: #e0a800;
}

.btn.info {
  background: #17a2b8;
  color: white;
}

.btn.info:hover:not(:disabled) {
  background: #148f9f;
}

.btn.secondary {
  background: #6c757d;
  color: white;
}

.btn.secondary:hover:not(:disabled) {
  background: #5a6268;
}

.btn.debug {
  background: #6c757d;
  color: white;
}

.btn.debug:hover:not(:disabled) {
  background: #5a6268;
}

/* 状态信息样式 */
.status-info {
  background: #f8f9fa;
  padding: 8px;
  border-radius: 4px;
  margin-top: 12px;
}

.status-info p {
  margin: 4px 0;
  font-size: 12px;
  color: #666;
}

/* 调试信息样式 */
.debug-section {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e9ecef;
}

.debug-section h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #495057;
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

</style>
