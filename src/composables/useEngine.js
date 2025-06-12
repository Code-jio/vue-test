import { ref, nextTick } from "vue";

/**
 * 从文件路径中提取文件名（不包含扩展名）
 */
function extractFileNameFromPath(filePath) {
  if (!filePath) {
    return `model_${Date.now()}`
  }

  try {
    // 处理各种路径格式
    const cleanPath = filePath.replace(/\\/g, '/')
    const pathParts = cleanPath.split('/')
    const fullFileName = pathParts[pathParts.length - 1]
    
    // 移除文件扩展名
    const dotIndex = fullFileName.lastIndexOf('.')
    const fileNameWithoutExt = dotIndex > 0 ? fullFileName.substring(0, dotIndex) : fullFileName
    
    // 清理文件名，移除特殊字符
    const cleanFileName = fileNameWithoutExt.replace(/[^a-zA-Z0-9\u4e00-\u9fa5_-]/g, '_')
    
    return cleanFileName || `model_${Date.now()}`
  } catch (error) {
    console.warn('文件名提取失败，使用默认名称:', error)
    return `model_${Date.now()}`
  }
}

/**
 * 设置模型根对象的名称
 */
function setModelName(object, baseName) {
  if (!object) return
  
  // 将名称存储到userData中（新的命名规则）
  if (!object.userData) {
    object.userData = {}
  }
  object.userData.modelName = baseName
  
  // 同时保留object.name用于显示和调试
  object.name = baseName
  
  console.log(`🏷️ 模型名称设置完成: ${baseName} (存储在userData.modelName中)`)
}

/**
 * 获取模型名称（优先从userData.modelName读取）
 */
function getModelName(object) {
  if (!object) return '未命名模型'
  
  // 优先使用userData.modelName
  if (object.userData && object.userData.modelName) {
    return object.userData.modelName
  }
  
  // 向后兼容：如果userData.modelName不存在，使用object.name
  return object.name || '未命名模型'
}

// 引擎核心功能管理
export function useEngine(options = {}) {
  // 响应式状态
  const engineReady = ref(false);
  const initStatus = ref("准备中...");

  // 引擎实例存储
  let engineInstance = null;
  let baseScenePlugin = null;
  let modelMarker = null;

  // 初始化三维引擎
  const initializeEngine = async (customSkyBoxConfig = null) => {
    try {
      initStatus.value = "初始化中...";

      // 确保DOM已经渲染
      await nextTick();

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
              },
              debugConfig: {
                enabled: true,
                gridHelper: false,
                axesHelper: false,
              },
              floorConfig: {
                enabled: true,
                type: 'static',
                staticConfig: {
                  tiling: [25, 25], // 图片铺满
                  texture: './textures/floor.png' // 你的图片路径
                }
              },
            },
          },
        ],
      });

      // 获取基础场景插件
      baseScenePlugin = engineInstance.getPlugin("BaseScene");
      console.log(baseScenePlugin);
      // 注册需要依赖场景的插件
      engineInstance.register({
        name: "RenderLoopPlugin",
        path: "/plugins/webgl/renderLoop",
        pluginClass: EngineKernel.RenderLoop,
        userData: {
          scene: baseScenePlugin.scene,
        },
      });

      // 确保渲染器尺寸正确
      if (baseScenePlugin && baseScenePlugin.renderer) {
        baseScenePlugin.renderer.setSize(window.innerWidth, window.innerHeight);
        baseScenePlugin.renderer.setPixelRatio(
          Math.min(window.devicePixelRatio, 2)
        );
      }

      // 注册其他插件（包含天空盒配置）
      registerAdditionalPlugins(customSkyBoxConfig);

      // 监听初始化完成事件
      engineInstance.on("init-complete", () =>
        onEngineInitComplete()
      );
    } catch (error) {
      initStatus.value = "初始化失败";
      console.error("引擎初始化失败:", error);
    }
  };

  // 注册额外插件
  const registerAdditionalPlugins = (customSkyBoxConfig = null) => {
    engineInstance
      .register({
        name: "ModelMarkerPlugin",
        path: "/plugins/webgl/3DModelMarker",
        pluginClass: EngineKernel.ModelMarker,
        userData: {
          scene: baseScenePlugin.scene,
        },
      });

    // 只有在没有自定义天空盒配置时，才注册默认天空盒
    if (!customSkyBoxConfig) {
      engineInstance.register({
        name: "SkyBoxPlugin",
        path: "/plugins/webgl/skyBox",
        pluginClass: EngineKernel.SkyBox,
        userData: {
          scene: baseScenePlugin.scene,
          camera: baseScenePlugin.camera,
          renderer: baseScenePlugin.renderer,
          skyBoxType: EngineKernel.SkyBoxType.HDR_ENVIRONMENT,
          // hdrMapPath: './skybox/SPACE018SN.hdr',
          hdrMapPath: './skybox/rustig_koppie_puresky_2k.hdr',
          hdrIntensity: 1.0,
        },
      });
    } else {
      // 使用自定义天空盒配置
      engineInstance.register({
        name: "SkyBoxPlugin",
        path: "/plugins/webgl/skyBox",
        pluginClass: EngineKernel.SkyBox,
        userData: {
          scene: baseScenePlugin.scene,
          camera: baseScenePlugin.camera,
          renderer: baseScenePlugin.renderer,
          ...customSkyBoxConfig,
        },
      });
    }

    modelMarker = engineInstance.getPlugin("ModelMarkerPlugin");
  };

  // 引擎初始化完成处理
  const onEngineInitComplete = () => {
    try {
      // 启动渲染循环
      const renderLoopPlugin = engineInstance.getPlugin("RenderLoopPlugin");
      if (renderLoopPlugin) {
        renderLoopPlugin.initialize();
      }

      engineReady.value = true;
      initStatus.value = "运行中";
    } catch (error) {
      console.error("引擎配置失败:", error);
    }
  };

  // 加载模型（新的异步版本）
  const loadModel = async () => {
    if (!engineInstance || !engineReady.value) return;

    try {
      const resourcePlugin = engineInstance.getPlugin("ResourceReaderPlugin");

      // 监听加载进度事件
      const progressHandler = (progress) => {
        if (progress.taskId && progress.percentage) {
          console.log(`加载进度: ${progress.percentage.toFixed(2)}%`);
        }
      };

      // 监听完成事件
      const completedHandler = (result) => {
        if (result.success) {
          console.log(`马模型异步加载完成 (${result.executionTime}ms)`);
        }
      };

      // 监听错误事件
      const errorHandler = (result) => {
        console.error(`模型异步加载失败: ${result.error?.message || '未知错误'}`);
      };

      // 添加事件监听
      EngineKernel.eventBus.on('task:progress', progressHandler);
      EngineKernel.eventBus.on('task:completed', completedHandler);
      EngineKernel.eventBus.on('task:failed', errorHandler);

      // 使用新的异步API加载模型
      const model = await resourcePlugin.loadModelAsync(
        "/static/model/Horse.glb",
        EngineKernel.TaskPriority.HIGH,
        {
          timeout: 30000,
          retryCount: 2,
          category: 'character'
        }
      );

      console.log("模型异步加载成功:", model);

      // 调整模型材质
      model.traverse((child) => {
        if (child.material) {
          child.material.needsUpdate = true;
        }
      });

      // 添加模型到场景
      baseScenePlugin.scene.add(model);

      // 清理事件监听
      EngineKernel.eventBus.off('task:progress', progressHandler);
      EngineKernel.eventBus.off('task:completed', completedHandler);
      EngineKernel.eventBus.off('task:failed', errorHandler);

    } catch (error) {
      console.error(`异步加载模型出错: ${error.message}`);
    }
  };

  // 重置相机位置
  const resetCamera = () => {
    if (!baseScenePlugin) {
      return;
    }

    try {
      // 使用BaseScene的控制器重置相机
      if (baseScenePlugin.controlsInstance) {
        baseScenePlugin.controlsInstance.setCameraPosition(500, 500, 500, 0, 0, 0);
      } else {
        // 备用方法：直接设置相机位置
        const camera = baseScenePlugin.getCurrentCamera();
        camera.position.set(500, 500, 500);
        camera.lookAt(0, 0, 0);
      }
    } catch (error) {
      console.error(`重置相机失败: ${error.message}`);
    }
  };

  // 切换天空盒
  const toggleSkybox = () => {
    console.log("天空盒切换功能待实现");
  };

  // 显示缓存状态
  const showCacheStatus = () => {
    if (!engineInstance) return;

    try {
      const resourcePlugin = engineInstance.getPlugin("ResourceReaderPlugin");
      const cacheStatus = resourcePlugin.getCacheStatus();
      const taskStatus = resourcePlugin.getTasksStatus();

      console.log(
        `缓存: ${cacheStatus.itemCount}项, ${(
          cacheStatus.size /
          1024 /
          1024
        ).toFixed(2)}MB, 利用率${cacheStatus.utilization.toFixed(1)}%`
      );
      console.log(
        `任务: 等待${taskStatus.pending}, 加载中${taskStatus.loading}, 完成${taskStatus.completed}, 错误${taskStatus.error}`
      );
    } catch (error) {
      console.error(`获取缓存状态失败: ${error.message}`);
    }
  };

  // 清理资源缓存
  const clearResourceCache = () => {
    if (!engineInstance) return;

    try {
      const resourcePlugin = engineInstance.getPlugin("ResourceReaderPlugin");
      resourcePlugin.clearCache();
      console.log("资源缓存已清理");
    } catch (error) {
      console.error(`清理缓存失败: ${error.message}`);
    }
  };

  // 添加获取引擎实例的方法
  const getEngineInstance = () => {
    return engineInstance;
  };

  // 获取轨道控制器插件（现在集成在BaseScene中）
  const getOrbitControlPlugin = () => {
    // 控制器现在集成在BaseScene中，通过BaseScene获取
    if (baseScenePlugin && baseScenePlugin.controlsInstance) {
      return baseScenePlugin.controlsInstance; // 返回BaseControls实例
    }
    return null;
  };

  // 获取基础场景插件
  const getBaseScenePlugin = () => {
    return baseScenePlugin;
  };

  // 获取模型标记插件
  const getModelMarkerPlugin = () => {
    return modelMarker;
  };

  // 批量加载模型（新增功能）
  const loadBatchModels = async (modelFiles) => {
    if (!engineInstance || !engineReady.value) {
      return [];
    }

    const loadedModels = [];
    const resourcePlugin = engineInstance.getPlugin("ResourceReaderPlugin");
    
    if (!resourcePlugin) {
      return [];
    }

    try {
      
      const loadPromises = modelFiles.map(async (modelPath, index) => {
        try {
          // 修复路径格式：替换反斜杠为正斜杠，并确保路径格式正确
          const fixedPath = modelPath.replace(/\\/g, '/');
          const fullPath = fixedPath.startsWith('/') ? fixedPath : `/${fixedPath}`;
          
          // 加载模型
          const model = await resourcePlugin.loadModelAsync(
            fullPath,
            EngineKernel.TaskPriority.MEDIUM,
            {
              timeout: 30000,
              retryCount: 1,
              category: 'batch_load'
            }
          );
          
          // 提取文件名并设置模型名称
          const fileName = extractFileNameFromPath(modelPath);
          const modelName = fileName;
          
          // 只设置模型根对象名称
          setModelName(model, modelName);
          
          // 添加到场景
          baseScenePlugin.scene.add(model);
          
          return model;
          
        } catch (error) {
          console.error(`模型 ${index + 1} (${fullPath}) 加载失败: ${error.message}`);
          
          // 检查是否是路径问题
          if (error.message.includes('404') || error.message.includes('Not Found')) {
            console.warn(`文件不存在: ${fullPath}`);
          } else if (error.message.includes('RangeError') || error.message.includes('Invalid typed array')) {
            console.warn(`文件格式问题: ${fullPath}`);
          }
          
          return null;
        }
      });

      // 等待所有模型加载完成
      const results = await Promise.allSettled(loadPromises);
      
      // 统计加载结果
      results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value) {
          loadedModels.push(result.value);
        }
      });

      console.log(`批量加载完成！成功加载 ${loadedModels.length}/${modelFiles.length} 个模型`);
      console.timeEnd("场景初始化")
      return loadedModels;

    } catch (error) {
      console.error(`批量加载模型出错: ${error.message}`);
      return loadedModels;
    }
  };



  // 设置调试模式（占位符函数）
  const setDebugMode = (enabled) => {
    console.log(`调试模式${enabled ? "已启用" : "已禁用"}`);
  };

  return {
    // 状态
    engineReady,
    initStatus,

    // 方法
    initializeEngine,
    loadModel,
    loadBatchModels,
    // loadHorseWithAnimation,
    resetCamera,
    toggleSkybox,
    showCacheStatus,
    clearResourceCache,
    getOrbitControlPlugin,
    getBaseScenePlugin,
    getEngineInstance,
    getModelMarkerPlugin,
    setDebugMode,
    
    // 工具函数
    setModelName,
    getModelName,
  };
}
