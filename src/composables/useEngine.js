import { ref, nextTick } from 'vue'

// 引擎核心功能管理
export function useEngine() {
  // 响应式状态
  const engineReady = ref(false)
  const initStatus = ref("准备中...")
  
  // 引擎实例存储
  let engineInstance = null
  let baseScenePlugin = null
  let orbitControlPlugin = null
  let modelMarker = null

  // 初始化三维引擎
  const initializeEngine = async (addDebugLog) => {
    try {
      initStatus.value = "初始化中..."
      addDebugLog("info", "🚀 开始初始化EngineKernel")

      // 确保DOM已经渲染
      await nextTick()

      // 创建引擎实例
      engineInstance = new EngineKernel.BaseCore({
        pluginsParams: [
          {
            name: "ResourceReaderPlugin",
            path: "/plugins/ResourceReaderPlugin",
            supportedFormats: ["gltf", "fbx"],
            pluginClass: EngineKernel.ResourceReaderPlugin,
            userData: {
              url: "/",
            },
          },
          {
            name: "BaseScene",
            path: "/plugins/scene",
            pluginClass: EngineKernel.BaseScene,
            userData: {
              // 让Three.js自动创建canvas并添加到document.body
              rendererConfig: {
                container: document.getElementById("canvas-container"),
              }
            },
          },
        ],
      })

      // 获取基础场景插件
      baseScenePlugin = engineInstance.getPlugin("BaseScene")
      
      // 注册需要依赖场景的插件
      engineInstance.register({
        name: "RenderLoopPlugin",
        path: "/plugins/webgl/renderLoop",
        pluginClass: EngineKernel.RenderLoop,
        userData: {
          scene: baseScenePlugin.scene,
        },
      })

      // 确保渲染器尺寸正确
      if (baseScenePlugin && baseScenePlugin.renderer) {
        baseScenePlugin.renderer.setSize(window.innerWidth, window.innerHeight)
        baseScenePlugin.renderer.setPixelRatio(
          Math.min(window.devicePixelRatio, 2)
        )
      }

      addDebugLog("success", "✅ 基础场景插件加载完成")
      console.log("🚀 ~ engine:", engineInstance)
      console.log(baseScenePlugin, "基础场景插件")

      // 注册其他插件
      registerAdditionalPlugins(addDebugLog)

      // 监听初始化完成事件
      engineInstance.on("init-complete", () => onEngineInitComplete(addDebugLog))
      addDebugLog("success", "🎉 引擎核心初始化完成")
      
    } catch (error) {
      initStatus.value = "初始化失败"
      addDebugLog("error", `❌ 引擎初始化失败: ${error.message}`)
      console.error("引擎初始化失败:", error)
    }
  }

  // 注册额外插件
  const registerAdditionalPlugins = (addDebugLog) => {
    engineInstance
      .register({
        name: "orbitControl",
        path: "/plugin/webgl/renderLoop",
        pluginClass: EngineKernel.orbitControls,
        userData: {
          camera: baseScenePlugin.camera,
          domElement: baseScenePlugin.renderer.domElement,
        },
      })
      .register({
        name: "ModelMarkerPlugin",
        path: "/plugins/webgl/3DModelMarker",
        pluginClass: EngineKernel.ModelMarker,
        userData: {
          scene: baseScenePlugin.scene,
        },
      })
      .register({
        name: "SkyBoxPlugin",
        path: "/plugins/webgl/skyBox",
        pluginClass: EngineKernel.SkyBox,
        userData: {
          scene: baseScenePlugin.scene,
          camera: baseScenePlugin.camera,
          renderer: baseScenePlugin.renderer,
          skyBoxType: EngineKernel.SkyBoxType.PROCEDURAL_SKY,
        },
      })

    modelMarker = engineInstance.getPlugin("ModelMarkerPlugin")
    orbitControlPlugin = engineInstance.getPlugin("orbitControl")
    
    console.log(modelMarker, "模型标记插件")
    addDebugLog("success", "✅ 轨道控制器插件加载完成")
  }

  // 引擎初始化完成处理
  const onEngineInitComplete = (addDebugLog) => {
    try {
      addDebugLog("info", "🎯 引擎初始化完成，开始后续配置")

      // 启动轨道控制器
      if (orbitControlPlugin) {
        orbitControlPlugin.initializeEventListeners()
        addDebugLog("success", "🎮 轨道控制器启动完成")
      }

      // 启动渲染循环
      const renderLoopPlugin = engineInstance.getPlugin("RenderLoopPlugin")
      if (renderLoopPlugin) {
        renderLoopPlugin.initialize()
        addDebugLog("success", "🎬 渲染循环启动完成")
      }

      engineReady.value = true
      initStatus.value = "运行中"
      addDebugLog("success", "🚀 引擎完全就绪")
      
    } catch (error) {
      addDebugLog("error", `❌ 引擎配置失败: ${error.message}`)
    }
  }

  // 加载模型
  const loadModel = (addDebugLog) => {
    if (!engineInstance || !engineReady.value) return

    try {
      addDebugLog("info", "🐎 开始加载马模型...")
      const resourcePlugin = engineInstance.getPlugin("ResourceReaderPlugin")

      const taskId = resourcePlugin.loadModel(
        "/model/Horse.glb",
        (gltf) => {
          console.log("模型加载成功:", gltf)

          // 调整模型材质
          gltf.scene.traverse((child) => {
            if (child.material) {
              child.material.needsUpdate = true
            }
          })

          // 添加模型到场景
          baseScenePlugin.scene.add(gltf.scene)
          addDebugLog("success", "✅ 马模型加载完成")
        },
        (progress) => {
          if (progress.lengthComputable) {
            const percent = ((progress.loaded / progress.total) * 100).toFixed(2)
            addDebugLog("info", `📦 加载进度: ${percent}%`)
          }
        },
        (error) => {
          addDebugLog("error", `❌ 模型加载失败: ${error.message}`)
        }
      )

      if (taskId !== "cached") {
        addDebugLog("info", `📝 加载任务创建: ${taskId}`)
      } else {
        addDebugLog("info", "⚡ 使用缓存模型")
      }
    } catch (error) {
      addDebugLog("error", `❌ 加载模型出错: ${error.message}`)
    }
  }

  // 重置相机位置
  const resetCamera = (addDebugLog) => {
    if (!baseScenePlugin || !orbitControlPlugin) {
      addDebugLog("warning", "⚠️ 基础场景或轨道控制器未就绪")
      return
    }

    try {
      // 使用轨道控制器的专用重置方法
      orbitControlPlugin.setCameraPosition(500, 500, 500, 0, 0, 0)
      addDebugLog("info", "🎯 相机位置已重置")
    } catch (error) {
      addDebugLog("error", `❌ 重置相机失败: ${error.message}`)
    }
  }

  // 切换天空盒
  const toggleSkybox = (addDebugLog) => {
    addDebugLog("info", "🌌 天空盒切换功能待实现")
  }

  // 显示缓存状态
  const showCacheStatus = (addDebugLog) => {
    if (!engineInstance) return

    try {
      const resourcePlugin = engineInstance.getPlugin("ResourceReaderPlugin")
      const cacheStatus = resourcePlugin.getCacheStatus()
      const taskStatus = resourcePlugin.getTasksStatus()

      addDebugLog(
        "info",
        `📊 缓存: ${cacheStatus.itemCount}项, ${(
          cacheStatus.size /
          1024 /
          1024
        ).toFixed(2)}MB, 利用率${cacheStatus.utilization.toFixed(1)}%`
      )
      addDebugLog(
        "info",
        `📋 任务: 等待${taskStatus.pending}, 加载中${taskStatus.loading}, 完成${taskStatus.completed}, 错误${taskStatus.error}`
      )
    } catch (error) {
      addDebugLog("error", `❌ 获取缓存状态失败: ${error.message}`)
    }
  }

  // 清理资源缓存
  const clearResourceCache = (addDebugLog) => {
    if (!engineInstance) return

    try {
      const resourcePlugin = engineInstance.getPlugin("ResourceReaderPlugin")
      resourcePlugin.clearCache()
      addDebugLog("success", "🗑️ 资源缓存已清理")
    } catch (error) {
      addDebugLog("error", `❌ 清理缓存失败: ${error.message}`)
    }
  }

  return {
    // 状态
    engineReady,
    initStatus,
    
    // 实例获取器
    getEngineInstance: () => engineInstance,
    getBaseScenePlugin: () => baseScenePlugin,
    getOrbitControlPlugin: () => orbitControlPlugin,
    
    // 方法
    initializeEngine,
    loadModel,
    resetCamera,
    toggleSkybox,
    showCacheStatus,
    clearResourceCache
  }
} 