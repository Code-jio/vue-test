import { ref, nextTick, createApp } from 'vue'
import Card3D from '@/components/Card3D.vue'
import Form3D from '@/components/Form3D.vue'
import Chart3D from '@/components/Chart3D.vue'
import Controls3D from '@/components/Controls3D.vue'
import Media3D from '@/components/Media3D.vue'

// CSS3D功能管理
export function useCSS3D() {
  // 响应式状态
  const css3dReady = ref(false)
  const css3dObjects = ref([])
  
  // 存储组件实例映射
  const componentInstances = new Map()
  
  // CSS3D插件实例
  let css3dPlugin = null

  // 初始化CSS3D插件
  const initCSS3DPlugin = async (engineInstance, baseScenePlugin, addDebugLog) => {
    try {
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
        await css3dPlugin.init()
        css3dReady.value = true
        addDebugLog("success", "✅ CSS3D插件初始化完成")
      } else {
        addDebugLog("error", "❌ CSS3D插件加载失败")
      }
    } catch (error) {
      addDebugLog("error", `❌ CSS3D插件初始化失败: ${error.message}`)
    }
  }

  // 创建Vue组件3D对象的通用方法
  const createVueComponent3D = async (ComponentClass, config, addDebugLog) => {
    if (!css3dPlugin) return

    try {
      const app = createApp(ComponentClass)
      const container = document.createElement('div')
      
      // 设置容器样式确保可见
      container.style.position = 'absolute'
      container.style.top = '-9999px'
      container.style.left = '-9999px'
      container.style.visibility = 'hidden'
      document.body.appendChild(container)
      
      const vm = app.mount(container)
      
      // 等待组件渲染完成
      await nextTick()
      
      const componentElement = container.firstElementChild
      if (!componentElement) {
        addDebugLog("error", `❌ ${config.type}组件渲染失败`)
        return
      }

      // 创建3D对象
      const objectId = css3dPlugin.createObject({
        element: componentElement,
        position: config.position || [0, 0, -100],
        rotation: config.rotation || [0, 0, 0],
        scale: config.scale || 1
      })

      // 保存对象和组件实例的关联
      const objectData = {
        id: objectId,
        type: config.type,
        name: config.name,
        app: app,
        vm: vm,
        container: container,
        element: componentElement
      }
      
      css3dObjects.value.push(objectData)
      componentInstances.set(objectId, objectData)

      addDebugLog("success", `✅ ${config.name}3D对象已创建: ${objectId}`)
      
      return objectId
    } catch (error) {
      addDebugLog("error", `❌ 创建${config.name}失败: ${error.message}`)
    }
  }

  // 创建Vue卡片3D对象
  const createVueCard = (addDebugLog) => {
    return createVueComponent3D(Card3D, {
      type: 'card',
      name: 'Vue卡片',
      position: [0, 0, -100],
      rotation: [0, 0, 0],
      scale: 1
    }, addDebugLog)
  }

  // 创建表单3D对象
  const createVueForm = (addDebugLog) => {
    return createVueComponent3D(Form3D, {
      type: 'form',
      name: '表单',
      position: [getRandomPosition(), getRandomPosition(), getRandomPosition()],
      rotation: [0, Math.random() * Math.PI, 0],
      scale: 0.6
    }, addDebugLog)
  }

  // 创建图表3D对象
  const createVueChart = (addDebugLog) => {
    return createVueComponent3D(Chart3D, {
      type: 'chart',
      name: '图表',
      position: [getRandomPosition(), getRandomPosition(), getRandomPosition()],
      rotation: [0, Math.random() * Math.PI, 0],
      scale: 0.7
    }, addDebugLog)
  }

  // 创建控制面板3D对象
  const create3DControls = (addDebugLog) => {
    return createVueComponent3D(Controls3D, {
      type: 'controls',
      name: '控制面板',
      position: [getRandomPosition(), getRandomPosition(), getRandomPosition()],
      rotation: [0, Math.random() * Math.PI, 0],
      scale: 0.8
    }, addDebugLog)
  }

  // 创建媒体3D对象
  const createVueMedia = (addDebugLog) => {
    return createVueComponent3D(Media3D, {
      type: 'media',
      name: '媒体播放器',
      position: [getRandomPosition(), getRandomPosition(), getRandomPosition()],
      rotation: [0, Math.random() * Math.PI, 0],
      scale: 0.6
    }, addDebugLog)
  }

  // 动画演示
  const animate3DObjects = async (addDebugLog) => {
    if (!css3dPlugin || css3dObjects.value.length === 0) return

    try {
      addDebugLog("info", "🎬 开始3D对象动画演示")

      // 并行执行所有对象的动画
      const animationPromises = css3dObjects.value.map((obj, index) => {
        const delay = index * 200 // 错开动画时间
        
        return new Promise(resolve => {
          setTimeout(async () => {
            // 随机移动
            await css3dPlugin.animateMove(
              obj.id,
              [getRandomPosition(), getRandomPosition(), getRandomPosition()],
              1500
            )
            
            // 旋转
            css3dPlugin.rotateObject(
              obj.id,
              Math.random() * Math.PI,
              Math.random() * Math.PI,
              Math.random() * Math.PI
            )
            
            resolve()
          }, delay)
        })
      })

      await Promise.all(animationPromises)
      addDebugLog("success", "✨ 动画演示完成")
    } catch (error) {
      addDebugLog("error", `❌ 动画演示失败: ${error.message}`)
    }
  }

  // 组件交互方法
  const triggerChartUpdate = (addDebugLog) => {
    const chartObject = css3dObjects.value.find(obj => obj.type === 'chart')
    if (chartObject && chartObject.vm) {
      try {
        if (chartObject.vm.updateChartData) {
          chartObject.vm.updateChartData()
          addDebugLog("success", "📊 图表数据已更新")
        } else {
          addDebugLog("warning", "⚠️ 图表组件没有updateChartData方法")
        }
      } catch (error) {
        addDebugLog("error", `❌ 更新图表失败: ${error.message}`)
      }
    } else {
      addDebugLog("warning", "⚠️ 未找到图表3D对象")
    }
  }

  const updateControlsTime = (addDebugLog) => {
    const controlsObject = css3dObjects.value.find(obj => obj.type === 'controls')
    if (controlsObject && controlsObject.vm) {
      try {
        if (controlsObject.vm.updateTime) {
          controlsObject.vm.updateTime()
          addDebugLog("success", "⏰ 控制面板时间已更新")
        } else {
          addDebugLog("warning", "⚠️ 控制面板组件没有updateTime方法")
        }
      } catch (error) {
        addDebugLog("error", `❌ 更新时间失败: ${error.message}`)
      }
    } else {
      addDebugLog("warning", "⚠️ 未找到控制面板3D对象")
    }
  }

  const playMediaVideo = (addDebugLog) => {
    const mediaObject = css3dObjects.value.find(obj => obj.type === 'media')
    if (mediaObject && mediaObject.vm) {
      try {
        if (mediaObject.vm.playVideo) {
          mediaObject.vm.playVideo()
          addDebugLog("success", "🎬 媒体播放器状态已切换")
        } else {
          addDebugLog("warning", "⚠️ 媒体组件没有playVideo方法")
        }
      } catch (error) {
        addDebugLog("error", `❌ 播放视频失败: ${error.message}`)
      }
    } else {
      addDebugLog("warning", "⚠️ 未找到媒体播放器3D对象")
    }
  }

  // 清空所有3D对象
  const clear3DObjects = (addDebugLog) => {
    if (!css3dPlugin) return

    try {
      let removedCount = 0
      
      // 遍历所有对象进行清理
      css3dObjects.value.forEach(obj => {
        // 清理CSS3D对象
        if (css3dPlugin.removeObject(obj.id)) {
          removedCount++
        }
        
        // 清理Vue组件实例
        if (obj.vm && obj.app) {
          try {
            obj.app.unmount()
            if (obj.container && obj.container.parentNode) {
              obj.container.parentNode.removeChild(obj.container)
            }
          } catch (error) {
            console.warn(`清理组件实例失败: ${error.message}`)
          }
        }
        
        // 从实例映射中移除
        componentInstances.delete(obj.id)
      })

      css3dObjects.value = []
      addDebugLog("success", `🗑️ 已清空${removedCount}个3D对象及其组件实例`)
    } catch (error) {
      addDebugLog("error", `❌ 清空3D对象失败: ${error.message}`)
    }
  }

  // 增强渲染循环，包含CSS3D渲染
  const enhancedRenderLoop = (baseScenePlugin) => {
    if (!baseScenePlugin) return

    // 渲染CSS3D对象
    if (css3dPlugin && css3dReady.value) {
      css3dPlugin.render(baseScenePlugin.scene, baseScenePlugin.camera)
    }

    // 继续渲染循环
    requestAnimationFrame(() => enhancedRenderLoop(baseScenePlugin))
  }

  // 调试CSS3D对象状态
  const debugCSS3DObjects = (baseScenePlugin, addDebugLog) => {
    if (!css3dPlugin) {
      addDebugLog("error", "❌ CSS3D插件未初始化")
      return
    }

    const allObjects = css3dPlugin.getAllObjects()
    addDebugLog("info", `🔍 CSS3D对象总数: ${allObjects.length}`)
    
    allObjects.forEach((item, index) => {
      const obj = item.object
      const pos = obj.position
      const visible = obj.visible
      const scale = obj.scale
      
      addDebugLog("info", `📦 对象${index + 1}: ID=${item.id}, 位置=(${pos.x.toFixed(1)}, ${pos.y.toFixed(1)}, ${pos.z.toFixed(1)}), 可见=${visible}, 缩放=${scale.x.toFixed(2)}`)
      
      // 检查DOM元素状态
      const element = item.element
      addDebugLog("info", `🌐 DOM: 显示=${element.style.display}, 可见=${element.style.visibility}, 透明度=${element.style.opacity}, 尺寸=${element.offsetWidth}x${element.offsetHeight}`)
    })

    // 检查相机位置
    if (baseScenePlugin) {
      const cam = baseScenePlugin.camera
      addDebugLog("info", `📷 相机位置: (${cam.position.x.toFixed(1)}, ${cam.position.y.toFixed(1)}, ${cam.position.z.toFixed(1)})`)
    }

    // 检查CSS3D渲染器状态
    const renderer = css3dPlugin.getRenderer()
    if (renderer) {
      const domElement = renderer.domElement
      const rect = domElement.getBoundingClientRect()
      addDebugLog("info", `🖥️ CSS3D渲染器: z-index=${domElement.style.zIndex}, 位置=(${rect.left}, ${rect.top}), 尺寸=${rect.width}x${rect.height}`)
      addDebugLog("info", `🔗 DOM层级: 父节点=${domElement.parentNode?.nodeName}, 子节点数=${domElement.children.length}`)
    }
    
    // 检查WebGL渲染器状态对比
    if (baseScenePlugin?.renderer) {
      const webglElement = baseScenePlugin.renderer.domElement
      const webglRect = webglElement.getBoundingClientRect()
      const webglZIndex = window.getComputedStyle(webglElement).zIndex
      addDebugLog("info", `🎮 WebGL渲染器: z-index=${webglZIndex}, 位置=(${webglRect.left}, ${webglRect.top}), 尺寸=${webglRect.width}x${webglRect.height}`)
    }
  }

  // 获取随机位置（在相机视野范围内）
  const getRandomPosition = () => {
    return (Math.random() - 0.5) * 200 // -100 到 100 的范围，更接近相机
  }

  return {
    // 状态
    css3dReady,
    css3dObjects,
    
    // 插件获取器
    getCSS3DPlugin: () => css3dPlugin,
    
    // 方法
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
  }
} 