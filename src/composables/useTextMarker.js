import { ref, reactive } from 'vue'

/**
 * 图文标注功能管理 Composable
 * 遵循SOLID原则，单一职责专注于TextMarker功能
 * 复用useEngine.js的引擎初始化逻辑，确保一致性
 */
export function useTextMarker() {
  // 响应式状态
  const engineReady = ref(false)
  const markerCount = ref(0)
  const markerList = ref([])

  // 引擎实例引用
  let engineInstance = null
  let textMarkerPlugin = null
  let scene = null
  let camera = null
  let renderer = null
  let THREE = EngineKernel.THREE

  // 标注配置（响应式）
  const markerConfig = reactive({
    text: '测试标注',
    fontSize: 16,
    textColor: '#ffffff',
    backgroundColor: '#000000',
    opacity: 0.8
  })

  // 位置配置（响应式）
  const markerPosition = reactive({
    x: 0,
    y: 2,
    z: 0
  })

  /**
   * 初始化图文标注引擎
   * 复用useEngine.js的初始化逻辑，确保一致性
   */
  const initializeTextMarkerEngine = async (canvasId, debugLogger) => {
    try {
      debugLogger?.('开始初始化图文标注引擎...', 'info')
      
      // 获取Canvas容器 - 这是必需的！
      const container = document.getElementById(canvasId)
      if (!container) {
        throw new Error(`Canvas容器未找到: ${canvasId}`)
      }
      
      // 检查EngineKernel是否可用
      if (typeof EngineKernel === 'undefined') {
        throw new Error('EngineKernel 未定义，请检查脚本加载')
      }

      // 创建引擎实例 - 复用useEngine.js的方式
      engineInstance = new EngineKernel.BaseCore({
        pluginsParams: [
          {
            name: "BaseScene",
            path: "/plugins/scene", 
            pluginClass: EngineKernel.BaseScene,
            userData: {
              rendererConfig: {
                container: container, // 必须指定容器！
              },
              debugConfig: {
                enabled: true,
                gridHelper: false, // 图文标注场景不需要网格
                axesHelper: false, // 图文标注场景不需要坐标轴
              },
              floorConfig:{
                enabled: false, // 禁用地板生成
                type: 'none',
                size: 1000,
                position: [0, 0, 0]
              }
            },
          },
        ],
      })
      
      // 获取基础场景插件
      const baseScenePlugin = engineInstance.getPlugin("BaseScene")
      if (!baseScenePlugin) {
        throw new Error('基础场景插件初始化失败')
      }

      scene = baseScenePlugin.scene
      camera = baseScenePlugin.camera
      renderer = baseScenePlugin.renderer

      // 设置渲染器尺寸
      if (renderer) {
        // 设置背景色为天空蓝
        renderer.setClearColor(0x87CEEB)
      }

      debugLogger?.('✅ 基础场景插件加载完成', 'success')

      // 注册渲染循环插件
      engineInstance.register({
        name: "RenderLoopPlugin",
        path: "/plugins/webgl/renderLoop",
        pluginClass: EngineKernel.RenderLoop,
        userData: {
          scene: scene,
        },
      })

      // 注册轨道控制器 - 复用useEngine.js的方式
      engineInstance.register({
        name: "orbitControl",
        path: "/plugin/webgl/renderLoop",
        pluginClass: EngineKernel.BaseControls,
        userData: {
          camera: camera,
          scene: scene,
        },
      })

      // 注册图文标注插件
      engineInstance.register({
        name: 'TextMarkerPlugin',
        path: '/plugins/webgl/textMarker',
        pluginClass: EngineKernel.TextMarkerPlugin,
        userData: {
          scene: scene,
          camera: camera,
          renderer: renderer,
          enableDebugMode: true
        }
      })

      // 获取插件实例
      const orbitControlPlugin = engineInstance.getPlugin("orbitControl")
      textMarkerPlugin = engineInstance.getPlugin('TextMarkerPlugin')
      
      if (!textMarkerPlugin) {
        throw new Error('图文标注插件注册失败')
      }

      // 设置相机位置
      camera.position.set(5, 5, 5)
      camera.lookAt(0, 0, 0)

      // 添加基础光照
      setupLighting()

      // 监听初始化完成事件 - 复用useEngine.js的模式
      engineInstance.on("init-complete", () => {
        debugLogger?.('🎯 引擎初始化完成，开始后续配置', 'info')
        
        // 启动轨道控制器
        if (orbitControlPlugin) {
          orbitControlPlugin.initializeEventListeners()
          debugLogger?.('🎮 轨道控制器启动完成', 'success')
        }

        // 启动渲染循环
        const renderLoopPlugin = engineInstance.getPlugin("RenderLoopPlugin")
        if (renderLoopPlugin) {
          renderLoopPlugin.initialize()
          debugLogger?.('🎬 渲染循环启动完成', 'success')
        }
        
        // 存储清理函数
        if (!window.textMarkerCleanup) {
          window.textMarkerCleanup = []
        }
        window.textMarkerCleanup.push(() => {
          window.removeEventListener('resize', handleResize)
        })

        engineReady.value = true
        debugLogger?.('🚀 图文标注引擎完全就绪', 'success')
      })

      debugLogger?.('🎉 引擎核心初始化完成', 'success')
      
    } catch (error) {
      debugLogger?.(`图文标注引擎初始化失败: ${error.message}`, 'error')
      throw error
    }
  }

  /**
   * 设置场景光照
   */
  const setupLighting = () => {
    if (!scene) return

    // 环境光
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6)
    scene.add(ambientLight)
    
    // 平行光
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(10, 10, 5)
    scene.add(directionalLight)
  }

  /**
   * 创建参考物体
   */
  const createReferenceObjects = (debugLogger) => {
    if (!scene) return

    // 确保THREE对象可用
    if (typeof THREE === 'undefined') {
      debugLogger?.('THREE对象未定义，无法创建参考物体', 'error')
      return
    }

    try {
      // 禁用地面生成
      // const groundGeometry = new THREE.PlaneGeometry(20, 20)
      // const groundMaterial = new THREE.MeshLambertMaterial({ color: 0x90EE90 })
      // const ground = new THREE.Mesh(groundGeometry, groundMaterial)
      // ground.rotation.x = -Math.PI / 2
      // ground.name = 'ground'
      // scene.add(ground)

      // 添加几个简单的立方体作为参考
      for (let i = 0; i < 3; i++) {
        const geometry = new THREE.BoxGeometry(1, 1, 1)
        const material = new THREE.MeshLambertMaterial({ 
          color: new THREE.Color().setHSL(i * 0.3, 0.7, 0.6) 
        })
        const cube = new THREE.Mesh(geometry, material)
        cube.position.set((i - 1) * 3, 0.5, 0)
        cube.name = `cube_${i}`
        scene.add(cube)
      }

      debugLogger?.('参考物体创建完成（已禁用地面）', 'info')
    } catch (error) {
      debugLogger?.(`参考物体创建失败: ${error.message}`, 'error')
    }
  }

  /**
   * 添加基础标注
   */
  const addBasicMarker = (debugLogger) => {
    if (!textMarkerPlugin) return null

    try {
      const markerId = textMarkerPlugin.addMarker({
        text: '基础标注',
        position: [markerPosition.x, markerPosition.y, markerPosition.z],
        textStyle: {
          fontSize: 18,
          color: '#ffffff'
        },
        backgroundStyle: {
          color: '#007bff',
          opacity: 0.9
        },
        name: 'basic_marker'
      })

      updateMarkerList()
      debugLogger?.(`添加基础标注: ${markerId}`, 'success')
      return markerId
    } catch (error) {
      debugLogger?.(`添加基础标注失败: ${error.message}`, 'error')
      return null
    }
  }

  /**
   * 添加图片标注
   */
  const addImageMarker = (debugLogger) => {
    if (!textMarkerPlugin) return null

    try {
      const markerId = textMarkerPlugin.addMarker({
        text: '图片标注示例',
        position: [markerPosition.x + 2, markerPosition.y, markerPosition.z],
        textStyle: {
          fontSize: 16,
          color: '#333333'
        },
        backgroundStyle: {
          color: '#ffffff',
          opacity: 0.95
        },
        image: {
          url: createIconSVG(),
          width: 24,
          height: 24,
          position: 'left',
          margin: 8
        },
        name: 'image_marker'
      })

      updateMarkerList()
      debugLogger?.(`添加图片标注: ${markerId}`, 'success')
      return markerId
    } catch (error) {
      debugLogger?.(`添加图片标注失败: ${error.message}`, 'error')
      return null
    }
  }

  /**
   * 添加样式标注
   */
  const addStyledMarker = (debugLogger) => {
    if (!textMarkerPlugin) return null

    try {
      const markerId = textMarkerPlugin.addMarker({
        text: '样式标注\n多行文本\n支持换行',
        position: [markerPosition.x - 2, markerPosition.y, markerPosition.z],
        textStyle: {
          fontSize: 20,
          color: '#fff',
          fontWeight: 'bold',
          textAlign: 'center',
          textShadow: {
            color: '#000000',
            blur: 2,
            offsetX: 1,
            offsetY: 1
          }
        },
        backgroundStyle: {
          color: '#e74c3c',
          opacity: 0.9,
          borderRadius: 12,
          padding: { top: 12, right: 16, bottom: 12, left: 16 }
        },
        scale: 1.2,
        name: 'styled_marker'
      })

      updateMarkerList()
      debugLogger?.(`添加样式标注: ${markerId}`, 'success')
      return markerId
    } catch (error) {
      debugLogger?.(`添加样式标注失败: ${error.message}`, 'error')
      return null
    }
  }

  /**
   * 添加自定义标注
   */
  const addCustomMarker = (debugLogger) => {
    if (!textMarkerPlugin) return null

    try {
      const markerId = textMarkerPlugin.addMarker({
        text: markerConfig.text,
        position: [markerPosition.x, markerPosition.y + 1, markerPosition.z],
        textStyle: {
          fontSize: markerConfig.fontSize,
          color: markerConfig.textColor
        },
        backgroundStyle: {
          color: markerConfig.backgroundColor,
          opacity: markerConfig.opacity
        },
        name: 'custom_marker',
        onClick: (id) => {
          debugLogger?.(`点击了标注: ${id}`, 'info')
        },
        onHover: (id, isHovered) => {
          debugLogger?.(`${isHovered ? '悬停' : '离开'}标注: ${id}`, 'info')
        }
      })

      updateMarkerList()
      debugLogger?.(`添加自定义标注: ${markerId}`, 'success')
      return markerId
    } catch (error) {
      debugLogger?.(`添加自定义标注失败: ${error.message}`, 'error')
      return null
    }
  }

  /**
   * 清空所有标注
   */
  const clearAllMarkers = (debugLogger) => {
    if (!textMarkerPlugin) return

    try {
      textMarkerPlugin.clearAllMarkers()
      updateMarkerList()
      debugLogger?.('清空所有标注', 'info')
    } catch (error) {
      debugLogger?.(`清空标注失败: ${error.message}`, 'error')
    }
  }

  /**
   * 重置位置到默认值
   */
  const resetPosition = () => {
    markerPosition.x = 0
    markerPosition.y = 2
    markerPosition.z = 0
  }

  /**
   * 生成随机位置
   */
  const randomPosition = () => {
    markerPosition.x = (Math.random() - 0.5) * 10
    markerPosition.y = Math.random() * 5 + 1
    markerPosition.z = (Math.random() - 0.5) * 10
  }

  /**
   * 更新标注列表
   */
  const updateMarkerList = () => {
    if (!textMarkerPlugin) return

    try {
      const markers = textMarkerPlugin.getAllMarkers()
      markerList.value = Object.values(markers).map(marker => ({
        id: marker.id,
        name: marker.name,
        text: marker.config.text,
        visible: marker.isVisible
      }))
      markerCount.value = markerList.value.length
    } catch (error) {
      console.error('更新标注列表失败:', error)
    }
  }

  /**
   * 聚焦到指定标注
   */
  const focusMarker = (markerId, debugLogger) => {
    if (!textMarkerPlugin || !camera) return false

    try {
      const markerInfo = textMarkerPlugin.getMarkerInfo(markerId)
      if (markerInfo) {
        const [x, y, z] = markerInfo.position
        camera.position.set(x + 3, y + 2, z + 3)
        camera.lookAt(x, y, z)
        debugLogger?.(`聚焦标注: ${markerId}`, 'info')
        return true
      }
      return false
    } catch (error) {
      debugLogger?.(`聚焦标注失败: ${error.message}`, 'error')
      return false
    }
  }

  /**
   * 切换标注可见性
   */
  const toggleMarkerVisibility = (markerId, debugLogger) => {
    if (!textMarkerPlugin) return false

    try {
      const markerInfo = textMarkerPlugin.getMarkerInfo(markerId)
      if (markerInfo) {
        const visible = !markerInfo.isVisible
        textMarkerPlugin.setVisible(markerId, visible)
        updateMarkerList()
        debugLogger?.(`${visible ? '显示' : '隐藏'}标注: ${markerId}`, 'info')
        return true
      }
      return false
    } catch (error) {
      debugLogger?.(`切换标注可见性失败: ${error.message}`, 'error')
      return false
    }
  }

  /**
   * 移除指定标注
   */
  const removeMarker = (markerId, debugLogger) => {
    if (!textMarkerPlugin) return false

    try {
      const success = textMarkerPlugin.removeMarker(markerId)
      if (success) {
        updateMarkerList()
        debugLogger?.(`移除标注: ${markerId}`, 'info')
      }
      return success
    } catch (error) {
      debugLogger?.(`移除标注失败: ${error.message}`, 'error')
      return false
    }
  }

  /**
   * 创建图标SVG (复用的图标生成函数)
   */
  const createIconSVG = () => {
    return 'data:image/svg+xml;base64,' + btoa(`
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" fill="#ff6b6b"/>
        <path d="M8 12l2 2 4-4" stroke="white" stroke-width="2" stroke-linecap="round"/>
      </svg>
    `)
  }

  /**
   * 获取标注统计信息
   */
  const getMarkerStats = () => {
    return {
      total: markerCount.value,
      visible: markerList.value.filter(m => m.visible).length,
      hidden: markerList.value.filter(m => !m.visible).length
    }
  }

  /**
   * 销毁引擎 - 复用useEngine.js的清理逻辑
   */
  const dispose = () => {
    try {
      // 清理标注插件
      if (textMarkerPlugin) {
        textMarkerPlugin.clearAllMarkers?.()
      }
      
      // 清理事件监听器
      if (window.textMarkerCleanup) {
        window.textMarkerCleanup.forEach(cleanup => cleanup())
        window.textMarkerCleanup = []
      }
      
      // 停止引擎 - 对应useEngine的销毁方式
      if (engineInstance && typeof engineInstance.stop === 'function') {
        engineInstance.stop()
      }
      
      // 清理引用
      engineInstance = null
      textMarkerPlugin = null
      scene = null
      camera = null
      renderer = null
      
      // 重置状态
      engineReady.value = false
      markerCount.value = 0
      markerList.value = []
      
      console.log('🧹 TextMarker引擎已销毁')
    } catch (error) {
      console.error('销毁引擎时出错:', error)
    }
  }

  return {
    // 响应式状态
    engineReady,
    markerCount,
    markerList,
    markerConfig,
    markerPosition,

    // 初始化方法
    initializeTextMarkerEngine,
    createReferenceObjects,

    // 标注操作方法
    addBasicMarker,
    addImageMarker,
    addStyledMarker,
    addCustomMarker,
    clearAllMarkers,

    // 位置控制方法
    resetPosition,
    randomPosition,

    // 标注管理方法
    updateMarkerList,
    focusMarker,
    toggleMarkerVisibility,
    removeMarker,

    // 工具方法
    getMarkerStats,
    dispose,

    // 引擎实例访问 (谨慎使用)
    getEngineInstance: () => engineInstance,
    getTextMarkerPlugin: () => textMarkerPlugin,
    getScene: () => scene,
    getCamera: () => camera,
    getRenderer: () => renderer
  }
} 