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
 * 递归设置模型及其子对象的名称
 */
function setModelNamesRecursively(object, baseName, fileName) {
  if (!object) return
  
  // 设置根对象名称
  object.name = baseName
  
  // 为子对象设置名称
  let childIndex = 0
  object.traverse((child) => {
    if (child !== object) { // 跳过根对象本身
      if (child.type === 'Mesh') {
        child.name = `${fileName}_mesh_${childIndex}`
      } else if (child.type === 'Group') {
        child.name = `${fileName}_group_${childIndex}`
      } else if (child.type === 'Object3D') {
        child.name = `${fileName}_object_${childIndex}`
      } else {
        child.name = `${fileName}_${child.type.toLowerCase()}_${childIndex}`
      }
      childIndex++
    }
  })
  
  console.log(`🏷️ 模型名称设置完成: ${baseName}, 子对象数量: ${object.children.length}`)
}

// 引擎核心功能管理
export function useEngine(options = {}) {
  // 响应式状态
  const engineReady = ref(false);
  const initStatus = ref("准备中...");

  // 引擎实例存储
  let engineInstance = null;
  let baseScenePlugin = null;
  let orbitControlPlugin = null;
  let modelMarker = null;

  // 初始化三维引擎
  const initializeEngine = async (addDebugLog, customSkyBoxConfig = null) => {
    try {
      initStatus.value = "初始化中...";
      addDebugLog("info", "🚀 开始初始化EngineKernel");

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
                enabled: false, // 禁用地板
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

      addDebugLog("success", "✅ 基础场景插件加载完成");

      // 注册其他插件（包含天空盒配置）
      registerAdditionalPlugins(addDebugLog, customSkyBoxConfig);

      // 监听初始化完成事件
      engineInstance.on("init-complete", () =>
        onEngineInitComplete(addDebugLog)
      );
      addDebugLog("success", "🎉 引擎核心初始化完成");
    } catch (error) {
      initStatus.value = "初始化失败";
      addDebugLog("error", `❌ 引擎初始化失败: ${error.message}`);
      console.error("引擎初始化失败:", error);
    }
  };

  // 注册额外插件
  const registerAdditionalPlugins = (
    addDebugLog,
    customSkyBoxConfig = null
  ) => {
    engineInstance
      .register({
        name: "orbitControl",
        path: "/plugin/webgl/renderLoop",
        pluginClass: EngineKernel.BaseControls,
        userData: {
          camera: baseScenePlugin.camera,
          scene: baseScenePlugin.scene,
        },
      })
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
          skyBoxType: EngineKernel.SkyBoxType.PROCEDURAL_SKY,
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
    orbitControlPlugin = engineInstance.getPlugin("orbitControl");

    // console.log(modelMarker, "模型标记插件")
    addDebugLog("success", "✅ 轨道控制器插件加载完成");
  };

  // 引擎初始化完成处理
  const onEngineInitComplete = (addDebugLog) => {
    try {
      addDebugLog("info", "🎯 引擎初始化完成，开始后续配置");

      // 启动轨道控制器
      if (orbitControlPlugin) {
        orbitControlPlugin.initializeEventListeners();
        addDebugLog("success", "🎮 轨道控制器启动完成");
      }

      // 启动渲染循环
      const renderLoopPlugin = engineInstance.getPlugin("RenderLoopPlugin");
      if (renderLoopPlugin) {
        renderLoopPlugin.initialize();
        addDebugLog("success", "🎬 渲染循环启动完成");
      }

      engineReady.value = true;
      initStatus.value = "运行中";
      addDebugLog("success", "🚀 引擎完全就绪");
    } catch (error) {
      addDebugLog("error", `❌ 引擎配置失败: ${error.message}`);
    }
  };

  // 加载模型（新的异步版本）
  const loadModel = async (addDebugLog) => {
    if (!engineInstance || !engineReady.value) return;

    try {
      addDebugLog("info", "🐎 开始异步加载马模型...");
      const resourcePlugin = engineInstance.getPlugin("ResourceReaderPlugin");

      // 监听加载进度事件
      const progressHandler = (progress) => {
        if (progress.taskId && progress.percentage) {
          addDebugLog("info", `📦 加载进度: ${progress.percentage.toFixed(2)}%`);
        }
      };

      // 监听完成事件
      const completedHandler = (result) => {
        if (result.success) {
          addDebugLog("success", `✅ 马模型异步加载完成 (${result.executionTime}ms)`);
        }
      };

      // 监听错误事件
      const errorHandler = (result) => {
        addDebugLog("error", `❌ 模型异步加载失败: ${result.error?.message || '未知错误'}`);
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
      addDebugLog("success", "✅ 马模型已添加到场景");

      // 清理事件监听
      EngineKernel.eventBus.off('task:progress', progressHandler);
      EngineKernel.eventBus.off('task:completed', completedHandler);
      EngineKernel.eventBus.off('task:failed', errorHandler);

    } catch (error) {
      addDebugLog("error", `❌ 异步加载模型出错: ${error.message}`);
    }
  };

  // 重置相机位置
  const resetCamera = (addDebugLog) => {
    if (!baseScenePlugin || !orbitControlPlugin) {
      addDebugLog("warning", "⚠️ 基础场景或轨道控制器未就绪");
      return;
    }

    try {
      // 使用轨道控制器的专用重置方法
      orbitControlPlugin.setCameraPosition(500, 500, 500, 0, 0, 0);
      addDebugLog("info", "🎯 相机位置已重置");
    } catch (error) {
      addDebugLog("error", `❌ 重置相机失败: ${error.message}`);
    }
  };

  // 切换天空盒
  const toggleSkybox = (addDebugLog) => {
    addDebugLog("info", "🌌 天空盒切换功能待实现");
  };

  // 显示缓存状态
  const showCacheStatus = (addDebugLog) => {
    if (!engineInstance) return;

    try {
      const resourcePlugin = engineInstance.getPlugin("ResourceReaderPlugin");
      const cacheStatus = resourcePlugin.getCacheStatus();
      const taskStatus = resourcePlugin.getTasksStatus();

      addDebugLog(
        "info",
        `📊 缓存: ${cacheStatus.itemCount}项, ${(
          cacheStatus.size /
          1024 /
          1024
        ).toFixed(2)}MB, 利用率${cacheStatus.utilization.toFixed(1)}%`
      );
      addDebugLog(
        "info",
        `📋 任务: 等待${taskStatus.pending}, 加载中${taskStatus.loading}, 完成${taskStatus.completed}, 错误${taskStatus.error}`
      );
    } catch (error) {
      addDebugLog("error", `❌ 获取缓存状态失败: ${error.message}`);
    }
  };

  // 清理资源缓存
  const clearResourceCache = (addDebugLog) => {
    if (!engineInstance) return;

    try {
      const resourcePlugin = engineInstance.getPlugin("ResourceReaderPlugin");
      resourcePlugin.clearCache();
      addDebugLog("success", "🗑️ 资源缓存已清理");
    } catch (error) {
      addDebugLog("error", `❌ 清理缓存失败: ${error.message}`);
    }
  };

  // 添加获取引擎实例的方法
  const getEngineInstance = () => {
    return engineInstance;
  };

  // 获取轨道控制器插件
  const getOrbitControlPlugin = () => {
    return orbitControlPlugin;
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
  const loadBatchModels = async (modelFiles, addDebugLog) => {
    if (!engineInstance || !engineReady.value) {
      addDebugLog("error", "❌ 引擎未就绪，无法批量加载模型");
      return [];
    }

    const loadedModels = [];
    const resourcePlugin = engineInstance.getPlugin("ResourceReaderPlugin");
    
    if (!resourcePlugin) {
      addDebugLog("error", "❌ 资源加载插件未找到");
      return [];
    }

    try {
      addDebugLog("info", `📦 开始批量加载 ${modelFiles.length} 个模型...`);
      
      const loadPromises = modelFiles.map(async (modelPath, index) => {
        try {
          // 修复路径格式：替换反斜杠为正斜杠，并确保路径格式正确
          const fixedPath = modelPath.replace(/\\/g, '/');
          const fullPath = fixedPath.startsWith('/') ? fixedPath : `/${fixedPath}`;
          
          addDebugLog("info", `🔄 正在加载模型 ${index + 1}: ${fullPath}`);
          
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

          // // 设置模型位置（在一个圆形区域内随机分布）
          // const angle = (index / modelFiles.length) * Math.PI * 2;
          // const radius = 50 + Math.random() * 100; // 50-150 的随机半径
          // const x = Math.cos(angle) * radius + (Math.random() - 0.5) * 20;
          // const z = Math.sin(angle) * radius + (Math.random() - 0.5) * 20;
          // const y = Math.random() * 10; // 0-10 的随机高度

          // model.position.set(x, y, z);
          
          // // 随机旋转
          // model.rotation.y = Math.random() * Math.PI * 2;
          
          // 提取文件名并设置模型名称
          const fileName = extractFileNameFromPath(modelPath);
          const modelName = `${index + 1}_${fileName}`;
          
          // 设置模型名称（包括子对象）
          setModelNamesRecursively(model, modelName, fileName);
          
          // 添加到场景
          baseScenePlugin.scene.add(model);
          
          addDebugLog("success", `✅ 模型 ${index + 1} 加载完成: ${modelName}`);
          return model;
          
        } catch (error) {
          addDebugLog("error", `❌ 模型 ${index + 1} (${fullPath}) 加载失败: ${error.message}`);
          
          // 检查是否是路径问题
          if (error.message.includes('404') || error.message.includes('Not Found')) {
            addDebugLog("warning", `⚠️ 文件不存在: ${fullPath}`);
          } else if (error.message.includes('RangeError') || error.message.includes('Invalid typed array')) {
            addDebugLog("warning", `⚠️ 文件格式问题: ${fullPath}`);
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

      addDebugLog("success", `🎉 批量加载完成！成功加载 ${loadedModels.length}/${modelFiles.length} 个模型`);
      console.timeEnd("场景初始化")
      return loadedModels;

    } catch (error) {
      addDebugLog("error", `❌ 批量加载模型出错: ${error.message}`);
      return loadedModels;
    }
  };

  // 加载马模型并设置路径动画
  const loadHorseWithAnimation = async (addDebugLog) => {
    if (!engineInstance || !engineReady.value) {
      addDebugLog("error", "❌ 引擎未就绪，无法加载马模型");
      return null;
    }

    try {
      addDebugLog("info", "🐎 开始加载马模型...");
      const resourcePlugin = engineInstance.getPlugin("ResourceReaderPlugin");

      const horseModel = await resourcePlugin.loadModelAsync(
        "/static/model/Horse.glb",
        EngineKernel.TaskPriority.HIGH,
        {
          timeout: 30000,
          retryCount: 2,
          category: 'character'
        }
      );

      // 设置马模型的初始位置
      horseModel.position.set(0, 0, 0);
      horseModel.scale.set(0.1, 0.1, 0.1);
      
      // 设置模型名称（包括子对象）
      const fileName = extractFileNameFromPath("/static/model/Horse.glb");
      setModelNamesRecursively(horseModel, "AnimatedHorse", fileName);
      
      // 调整模型材质
      horseModel.traverse((child) => {
        if (child.material) {
          child.material.needsUpdate = true;
        }
      });

      baseScenePlugin.scene.add(horseModel);
      addDebugLog("success", "✅ 马模型加载完成，准备设置动画");

      return horseModel;

    } catch (error) {
      addDebugLog("error", `❌ 马模型加载失败: ${error.message}`);
      return null;
    }
  };

  // 创建场景辅助对象（网格、坐标轴等）
  const createSceneHelpers = (addDebugLog) => {
    if (!baseScenePlugin) {
      addDebugLog("error", "❌ 基础场景插件未就绪");
      return;
    }

    try {
      const scene = baseScenePlugin.scene;

      // 创建网格辅助线
      const gridHelper = new EngineKernel.THREE.GridHelper(1000, 100, 0x444444, 0x444444);
      gridHelper.name = "GridHelper";
      scene.add(gridHelper);

      // 创建坐标轴辅助线
      const axesHelper = new EngineKernel.THREE.AxesHelper(100);
      axesHelper.name = "AxesHelper";
      scene.add(axesHelper);

      addDebugLog("success", "✅ 场景辅助对象创建完成");

    } catch (error) {
      addDebugLog("error", `❌ 创建场景辅助对象失败: ${error.message}`);
    }
  };

  // 设置调试模式（占位符函数）
  const setDebugMode = (enabled, addDebugLog) => {
    if (addDebugLog) {
      addDebugLog("info", `🔧 调试模式${enabled ? "已启用" : "已禁用"}`);
    }
  };

  return {
    // 状态
    engineReady,
    initStatus,

    // 方法
    initializeEngine,
    loadModel,
    loadBatchModels,
    loadHorseWithAnimation,
    createSceneHelpers,
    resetCamera,
    toggleSkybox,
    showCacheStatus,
    clearResourceCache,
    getOrbitControlPlugin,
    getBaseScenePlugin,
    getEngineInstance,
    getModelMarkerPlugin,
    setDebugMode,
  };
}
