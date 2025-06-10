<template>
  <div class="engine-scene-container">
    <!-- 纯3D场景容器 -->
    <div class="canvas-container" id="canvas-container"></div>

    <!-- CSS3D信息面板容器（初始隐藏）-->
    <div id="css3d-container" class="css3d-container"></div>
  </div>
</template>

<script setup>
console.time("场景初始化");

import { ref, onMounted, onUnmounted, createApp } from "vue";
import { useEngine } from "@/composables/useEngine";
import { useDebug } from "@/composables/useDebug";
import eventBus from "@/eventBus";
import ModelMessage from "@/components/modelMessage.vue";

// 使用引擎和调试功能
const {
  engineReady,
  initStatus,
  initializeEngine,
  loadBatchModels,
  resetCamera,
  getEngineInstance,
  getBaseScenePlugin,
  getOrbitControlPlugin,
} = useEngine();

const { addDebugLog } = useDebug();

// 应用状态
const loadedModels = ref([]);
const horseModel = ref(null);
const isAnimating = ref(false);

// 插件引用
let mousePickPlugin = null;
let css3dPlugin = null;
let css3dInfoInstance = null;

// 动画相关
let animationId = null;
let currentTarget = null;
let currentPosition = null;
let moveStartTime = 0;
let moveDuration = 5000; // 移动到目标点的时间（毫秒）
let trajectoryPoints = []; // 轨迹点数组
let trajectoryLine = null; // 轨迹线对象

// 清理函数存储
let pickEventCleanup = [];

// 初始化鼠标拾取插件
const initializeMousePick = async () => {
  try {
    const engineInstance = getEngineInstance();
    const baseScenePlugin = getBaseScenePlugin();
    const orbitControlPlugin = getOrbitControlPlugin();

    if (!engineInstance || !baseScenePlugin) {
      throw new Error("引擎或场景插件未就绪");
    }

    addDebugLog("info", "🎯 开始初始化鼠标拾取插件");

    // 注册鼠标拾取插件
    engineInstance.register({
      name: "MousePickPlugin",
      path: "/plugins/webgl/mousePickPlugin",
      pluginClass: EngineKernel.MousePickPlugin,
      userData: {
        camera: baseScenePlugin.camera,
        scene: baseScenePlugin.scene,
        renderer: baseScenePlugin.rendererInstance,
        controller: orbitControlPlugin,
      },
    });

    // 获取插件实例
    mousePickPlugin = engineInstance.getPlugin("MousePickPlugin");

    if (mousePickPlugin) {
      // 设置初始配置
      mousePickPlugin.setConfig({
        mode: "single",
        tolerance: 0,
        maxDistance: Infinity,
        sortByDistance: true,
        includeInvisible: false,
        recursive: true,
        enableDebug: false,
      });

      // 设置事件监听器
      setupPickEventListeners();

      addDebugLog("success", "✅ 鼠标拾取插件初始化完成");
    } else {
      throw new Error("鼠标拾取插件获取失败");
    }
  } catch (error) {
    addDebugLog("error", `❌ 鼠标拾取插件初始化失败: ${error.message}`);
    throw error;
  }
};

// 初始化CSS3D插件
const initializeCSS3D = async () => {
  try {
    const engineInstance = getEngineInstance();
    const baseScenePlugin = getBaseScenePlugin();

    if (!engineInstance || !baseScenePlugin) {
      throw new Error("引擎或场景插件未就绪");
    }

    addDebugLog("info", "🎨 开始初始化CSS3D插件");

    // 确保CSS3D容器存在
    const css3dContainer = document.getElementById("css3d-container");
    if (!css3dContainer) {
      throw new Error("CSS3D容器未找到");
    }

    // 注册CSS3D插件
    engineInstance.register({
      name: "CSS3DRenderPlugin",
      path: "/plugins/webgl/css3DRender",
      pluginClass: EngineKernel.CSS3DRenderPlugin,
      userData: {
        scene: baseScenePlugin.scene,
        renderer: baseScenePlugin.renderer,
        container: css3dContainer,
        camera: baseScenePlugin.camera,
      },
    });

    // 获取CSS3D插件
    css3dPlugin = engineInstance.getPlugin("CSS3DRenderPlugin");

    if (css3dPlugin) {
      addDebugLog("info", "🔍 检查CSS3D插件方法...");

      // 检查可用方法
      const methods = [
        "createCSS3DObject",
        "addObject",
        "removeObject",
        "render",
      ];
      methods.forEach((method) => {
        const available = typeof css3dPlugin[method] === "function";
        addDebugLog(
          "info",
          `📋 ${method}: ${available ? "✅ 可用" : "❌ 不可用"}`
        );
      });

      // 启动CSS3D渲染循环
      if (typeof css3dPlugin.startRenderLoop === "function") {
        css3dPlugin.startRenderLoop();
        addDebugLog("info", "🎬 CSS3D渲染循环已启动");
      }

      // 确保CSS3D能正常渲染
      if (typeof css3dPlugin.render === "function") {
        // 手动触发一次渲染测试
        css3dPlugin.render(baseScenePlugin.camera);
        addDebugLog("info", "🎯 CSS3D首次渲染测试完成");
      }

      addDebugLog("success", "✅ CSS3D插件初始化完成");
    } else {
      throw new Error("CSS3D插件获取失败");
    }
  } catch (error) {
    addDebugLog("error", `❌ CSS3D插件初始化失败: ${error.message}`);
    console.error("CSS3D初始化错误详情:", error);
    throw error;
  }
};

// 设置拾取事件监听器
const setupPickEventListeners = () => {
  if (!mousePickPlugin) return;

  // 物体被拾取事件
  const handleObjectPicked = (data) => {
    const { results, selectedObjectId, selectedObjectName, pickMode } = data;
    if (results && results.length > 0) {
      const pickedObject = results[0].object;
      showModelInfo(pickedObject);
      addDebugLog("info", `🎯 点击了模型: ${selectedObjectName}`);
    }
  };

  // 注册事件监听器
  eventBus.on("mouse-pick:object-picked", handleObjectPicked);

  // 保存清理函数
  pickEventCleanup = [
    () => eventBus.off("mouse-pick:object-picked", handleObjectPicked),
  ];
};

// 显示模型信息
const showModelInfo = (pickedObject) => {
  if (!css3dPlugin || !pickedObject) {
    addDebugLog("error", "❌ CSS3D插件或拾取对象不存在");
    return;
  }

  try {
    addDebugLog("info", `🎯 准备显示模型信息: ${pickedObject.name}`);

    // 清理之前的信息面板
    if (css3dInfoInstance) {
      try {
        if (typeof css3dPlugin.removeObject === "function") {
          css3dPlugin.removeObject(css3dInfoInstance);
        } else if (typeof css3dPlugin.remove3DObject === "function") {
          css3dPlugin.remove3DObject(css3dInfoInstance);
        }
        addDebugLog("info", "🗑️ 已清理之前的信息面板");
      } catch (e) {
        addDebugLog("warning", `⚠️ 清理面板失败: ${e.message}`);
      }
      css3dInfoInstance = null;
    }

    // 获取模型信息
    const modelInfo = extractModelInfo(pickedObject);
    addDebugLog("info", `📋 模型信息: ${modelInfo.name} (${modelInfo.type})`);

    // 创建DOM容器
    const container = document.createElement("div");
    container.className = "model-info-container";
    container.style.cssText = `
      position: relative;
      pointer-events: auto;
      z-index: 1;
      transform-style: preserve-3d;
      background: transparent;
    `;

    // 创建Vue应用实例
    const infoApp = createApp(ModelMessage, {
      modelInfo: modelInfo,
      onClose: () => {
        addDebugLog("info", "📱 用户点击关闭按钮");
        if (css3dInfoInstance && css3dPlugin) {
          try {
            if (typeof css3dPlugin.removeObject === "function") {
              css3dPlugin.removeObject(css3dInfoInstance);
            } else if (typeof css3dPlugin.remove3DObject === "function") {
              css3dPlugin.remove3DObject(css3dInfoInstance);
            }
            css3dInfoInstance = null;
            addDebugLog("success", "✅ 信息面板已关闭");
          } catch (e) {
            addDebugLog("error", `❌ 关闭面板失败: ${e.message}`);
          }
        }
      },
      onFocus: () => {
        addDebugLog("info", "📱 用户点击聚焦按钮");
        focusOnModel(pickedObject);
      },
      onHighlight: () => {
        addDebugLog("info", "📱 用户点击高亮按钮");
        highlightModel(pickedObject);
      },
    });

    // 挂载Vue组件
    infoApp.mount(container);
    addDebugLog("success", "✅ Vue组件已挂载到DOM");

    // 计算3D位置（在模型上方）
    const worldPosition = new EngineKernel.THREE.Vector3();
    pickedObject.getWorldPosition(worldPosition);

    // 调整位置，确保在模型上方显示
    const offsetY = 20; // 向上偏移
    const finalPosition = [
      worldPosition.x,
      worldPosition.y + offsetY,
      worldPosition.z,
    ];

    addDebugLog(
      "info",
      `📍 CSS3D位置: x=${finalPosition[0].toFixed(
        2
      )}, y=${finalPosition[1].toFixed(2)}, z=${finalPosition[2].toFixed(2)}`
    );

    // 使用CSS3D插件的createCSS3DObject方法
    if (typeof css3dPlugin.createCSS3DObject === "function") {
      try {
        const objectId = css3dPlugin.createCSS3DObject({
          element: container,
          position: finalPosition,
          scale: 1,
          visible: true,
          interactive: true,
        });
        css3dInfoInstance = objectId;
        addDebugLog("success", `✅ CSS3D对象创建成功，ID: ${objectId}`);

        // 创建CSS3D对象后，立即聚焦到该位置
        focusOnCSS3DObject(finalPosition);
      } catch (e) {
        addDebugLog("error", `❌ CSS3D对象创建失败: ${e.message}`);
        // 尝试备用方法
        useBackupCSS3DMethod(container, finalPosition);
      }
    } else {
      // 使用备用方法
      useBackupCSS3DMethod(container, finalPosition);
    }

    addDebugLog("success", `🎉 模型信息面板显示成功: ${modelInfo.name}`);
  } catch (error) {
    addDebugLog("error", `❌ 显示模型信息失败: ${error.message}`);
    console.error("CSS3D显示错误详情:", error);
  }
};

// 备用CSS3D对象创建方法
const useBackupCSS3DMethod = (container, position) => {
  try {
    addDebugLog("info", "🔄 尝试备用CSS3D创建方法");

    // 创建CSS3D对象
    const css3dObject = new EngineKernel.THREE.CSS3DObject(container);
    css3dObject.position.set(position[0], position[1], position[2]);
    css3dObject.scale.setScalar(1);

    // 添加到CSS3D插件的场景中
    if (typeof css3dPlugin.addObject === "function") {
      css3dInfoInstance = css3dPlugin.addObject(css3dObject);
      addDebugLog("success", "✅ CSS3D对象创建成功（备用方法）");

      // 备用方法创建成功后也要聚焦
      focusOnCSS3DObject(position);
    } else {
      // 最后的备用方法 - 直接添加到主场景
      const baseScenePlugin = getBaseScenePlugin();
      if (baseScenePlugin && baseScenePlugin.scene) {
        baseScenePlugin.scene.add(css3dObject);
        css3dInfoInstance = css3dObject;
        addDebugLog("success", "✅ CSS3D对象添加到主场景（最后备用方法）");

        // 最后备用方法创建成功后也要聚焦
        focusOnCSS3DObject(position);
      } else {
        throw new Error("无法找到可用的场景来添加CSS3D对象");
      }
    }
  } catch (error) {
    addDebugLog("error", `❌ 备用CSS3D方法失败: ${error.message}`);
  }
};

// 提取模型信息
const extractModelInfo = (object) => {
  const position = new EngineKernel.THREE.Vector3();
  object.getWorldPosition(position);

  const info = {
    name: object.name || "未命名模型",
    type: object.type || "Object3D",
    uuid: object.uuid,
    position: {
      x: position.x,
      y: position.y,
      z: position.z,
    },
  };

  // 获取几何体信息
  if (object.geometry) {
    info.geometry = object.geometry.type;
    if (object.geometry.attributes.position) {
      info.vertices = object.geometry.attributes.position.count;
    }
    if (object.geometry.index) {
      info.triangles = object.geometry.index.count / 3;
    }
  }

  // 获取材质信息
  if (object.material) {
    if (Array.isArray(object.material)) {
      info.material = `MultiMaterial (${object.material.length})`;
    } else {
      info.material = object.material.type;
    }
  }

  return info;
};

// 聚焦到模型
const focusOnModel = (object) => {
  const baseScenePlugin = getBaseScenePlugin();
  const orbitControlPlugin = getOrbitControlPlugin();

  if (!baseScenePlugin || !orbitControlPlugin || !object) return;

  // 获取物体世界位置
  const worldPosition = new EngineKernel.THREE.Vector3();
  object.getWorldPosition(worldPosition);

  // 设置轨道控制器目标
  if (orbitControlPlugin.setTarget) {
    orbitControlPlugin.setTarget(
      worldPosition.x,
      worldPosition.y,
      worldPosition.z
    );
  }

  addDebugLog("info", `📍 相机已聚焦到模型: ${object.name}`);
};

// 聚焦到CSS3D对象位置
const focusOnCSS3DObject = (position) => {
  const baseScenePlugin = getBaseScenePlugin();
  const orbitControlPlugin = getOrbitControlPlugin();

  if (!baseScenePlugin || !position) {
    addDebugLog("warning", "⚠️ 无法聚焦CSS3D对象：缺少必要的插件或位置信息");
    return;
  }

  try {
    addDebugLog(
      "info",
      `🎯 开始聚焦到CSS3D对象位置: (${position[0].toFixed(
        2
      )}, ${position[1].toFixed(2)}, ${position[2].toFixed(2)})`
    );

    // 目标位置（CSS3D对象的位置）
    const targetPosition = new EngineKernel.THREE.Vector3(
      position[0],
      position[1],
      position[2]
    );

    // 计算合适的相机位置（在CSS3D对象前方一定距离）
    const distance = 30; // 相机到目标的距离
    const cameraOffset = new EngineKernel.THREE.Vector3(0, 5, distance); // 相机在目标前方偏上一点
    const finalCameraPosition = targetPosition.clone().add(cameraOffset);

    // 使用引擎内置的 cameraFlyTo 方法
    if (typeof baseScenePlugin.cameraFlyTo === "function") {
      addDebugLog("info", "🚀 使用引擎内置 cameraFlyTo 方法");

      baseScenePlugin.cameraFlyTo({
        position: finalCameraPosition, // 相机目标位置
        lookAt: targetPosition, // 相机朝向目标（CSS3D对象位置）
        duration: 1500, // 动画时长1.5秒
        easing: (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2), // 平滑缓动 (easeInOutQuad)
        onUpdate: () => {
          // 动画过程中的回调（可选）
        },
        onComplete: () => {
          addDebugLog("success", "✅ 相机聚焦动画完成（引擎方法）");

          // 确保轨道控制器目标正确设置
          if (orbitControlPlugin && orbitControlPlugin.setTarget) {
            orbitControlPlugin.setTarget(
              targetPosition.x,
              targetPosition.y,
              targetPosition.z
            );
          }
        },
      });

      addDebugLog(
        "success",
        `🎬 相机聚焦动画已启动（引擎方法），目标位置: (${position[0].toFixed(
          2
        )}, ${position[1].toFixed(2)}, ${position[2].toFixed(2)})`
      );
    } else if (typeof orbitControlPlugin?.cameraFlyTo === "function") {
      // 尝试使用轨道控制器的 cameraFlyTo 方法
      addDebugLog("info", "🎮 使用轨道控制器 cameraFlyTo 方法");

      orbitControlPlugin.cameraFlyTo({
        position: finalCameraPosition,
        lookAt: targetPosition,
        duration: 1500,
        autoLookAt: true,
        easing: (t) => 1 - Math.pow(1 - t, 3), // easeOutCubic
        onComplete: () => {
          addDebugLog("success", "✅ 相机聚焦动画完成（控制器方法）");
        },
      });

      addDebugLog(
        "success",
        `🎬 相机聚焦动画已启动（控制器方法），目标位置: (${position[0].toFixed(
          2
        )}, ${position[1].toFixed(2)}, ${position[2].toFixed(2)})`
      );
    } else {
      // 如果引擎方法不可用，使用备用方法
      addDebugLog("warning", "⚠️ 引擎 cameraFlyTo 方法不可用，使用备用实现");

      const camera = baseScenePlugin.camera;
      const currentPosition = camera.position.clone();

      // 使用平滑过渡动画
      const startTime = Date.now();
      const duration = 1500; // 1.5秒过渡时间

      const animateCamera = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // 使用缓动函数让移动更平滑
        const easeProgress = 1 - Math.pow(1 - progress, 3); // easeOutCubic

        // 插值计算当前相机位置
        const currentCameraPos = currentPosition
          .clone()
          .lerp(finalCameraPosition, easeProgress);

        // 更新相机位置
        camera.position.copy(currentCameraPos);

        // 设置轨道控制器目标为CSS3D对象位置
        if (orbitControlPlugin && orbitControlPlugin.setTarget) {
          orbitControlPlugin.setTarget(
            targetPosition.x,
            targetPosition.y,
            targetPosition.z
          );
        }

        // 让相机看向目标
        camera.lookAt(targetPosition);

        // 如果动画未完成，继续下一帧
        if (progress < 1) {
          requestAnimationFrame(animateCamera);
        } else {
          addDebugLog("success", "✅ 相机聚焦动画完成（备用方法）");

          // 最终确保轨道控制器目标正确设置
          if (orbitControlPlugin && orbitControlPlugin.setTarget) {
            orbitControlPlugin.setTarget(
              targetPosition.x,
              targetPosition.y,
              targetPosition.z
            );
          }

          // 更新轨道控制器状态
          if (orbitControlPlugin && orbitControlPlugin.update) {
            orbitControlPlugin.update();
          }
        }
      };

      // 开始动画
      animateCamera();

      addDebugLog(
        "success",
        `🎬 相机聚焦动画已启动（备用方法），目标位置: (${position[0].toFixed(
          2
        )}, ${position[1].toFixed(2)}, ${position[2].toFixed(2)})`
      );
    }
  } catch (error) {
    addDebugLog("error", `❌ 聚焦CSS3D对象失败: ${error.message}`);
    console.error("聚焦CSS3D对象错误详情:", error);
  }
};

// 高亮模型
const highlightModel = (object) => {
  if (!object) return;

  // 简单的高亮效果：改变材质发光
  const originalEmissive = {};

  object.traverse((child) => {
    if (child.material) {
      if (Array.isArray(child.material)) {
        child.material.forEach((mat, index) => {
          if (mat.emissive) {
            originalEmissive[child.uuid + "_" + index] = mat.emissive.clone();
            mat.emissive.setHex(0x444444);
          }
        });
      } else if (child.material.emissive) {
        originalEmissive[child.uuid] = child.material.emissive.clone();
        child.material.emissive.setHex(0x444444);
      }
    }
  });

  // 3秒后恢复原始材质
  setTimeout(() => {
    object.traverse((child) => {
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach((mat, index) => {
            const key = child.uuid + "_" + index;
            if (originalEmissive[key] && mat.emissive) {
              mat.emissive.copy(originalEmissive[key]);
            }
          });
        } else if (child.material.emissive && originalEmissive[child.uuid]) {
          child.material.emissive.copy(originalEmissive[child.uuid]);
        }
      }
    });
  }, 3000);

  addDebugLog("success", `✨ 模型已高亮: ${object.name}`);
};

// 批量加载模型
const loadModelsFromConfig = async () => {
  try {
    addDebugLog("info", "📁 开始读取模型配置文件...");

    // 获取模型文件配置
    const response = await fetch("/model-files.json");
    if (!response.ok) {
      throw new Error(`无法获取模型配置文件: ${response.status}`);
    }

    const config = await response.json();

    if (!config.files || !Array.isArray(config.files)) {
      throw new Error("模型配置文件格式无效");
    }

    addDebugLog("info", `📋 找到 ${config.files.length} 个模型文件`);

    // 验证模型文件路径
    const validPaths = [];
    for (const filePath of config.files) {
      // 修复路径格式
      const fixedPath = filePath.replace(/\\/g, "/");
      const fullPath = fixedPath.startsWith("/") ? fixedPath : `/${fixedPath}`;

      addDebugLog("info", `🔍 验证模型路径: ${fullPath}`);

      // 简单的路径验证
      if (fullPath.includes(".gltf") || fullPath.includes(".glb")) {
        validPaths.push(fullPath);
      } else {
        addDebugLog("warning", `⚠️ 跳过无效路径: ${fullPath}`);
      }
    }

    if (validPaths.length === 0) {
      throw new Error("没有找到有效的模型文件路径");
    }

    addDebugLog("info", `✅ 验证通过，准备加载 ${validPaths.length} 个模型`);

    // 可选：检查文件是否存在（仅作为调试信息）
    for (let i = 0; i < Math.min(validPaths.length, 3); i++) {
      try {
        const testResponse = await fetch(validPaths[i], { method: "HEAD" });
        addDebugLog(
          "info",
          `🔍 文件检查 ${validPaths[i]}: ${testResponse.ok ? "存在" : "不存在"}`
        );
      } catch (error) {
        addDebugLog("warning", `⚠️ 无法检查文件: ${validPaths[i]}`);
      }
    }

    // 批量加载模型
    const models = await loadBatchModels(validPaths, addDebugLog);
    loadedModels.value = models;

    const successCount = models.filter((m) => m !== null).length;
    addDebugLog(
      "success",
      `🎉 批量加载完成！成功: ${successCount}/${validPaths.length}`
    );

    if (successCount === 0) {
      addDebugLog("error", "❌ 所有模型加载都失败了，请检查模型文件是否存在");
    }
  } catch (error) {
    addDebugLog("error", `❌ 批量加载模型失败: ${error.message}`);

    // 如果批量加载失败，尝试加载一些测试几何体作为替代
    addDebugLog("info", "🔄 尝试创建替代几何体...");
    createFallbackGeometry();
  }
};

// 生成随机目标点
const generateRandomTarget = () => {
  const angle = Math.random() * Math.PI * 2; // 随机角度
  const radius = 50 + Math.random() * 100; // 50-150的随机半径
  const x = Math.cos(angle) * radius;
  const z = Math.sin(angle) * radius;
  const y = 2 + Math.random() * 8; // 2-10的高度变化

  return new EngineKernel.THREE.Vector3(x, y, z);
};

// 更新轨迹线可视化
const updateTrajectoryVisualization = () => {
  const baseScenePlugin = getBaseScenePlugin();
  if (!baseScenePlugin || trajectoryPoints.length < 2) return;

  try {
    // 移除之前的轨迹线
    if (trajectoryLine) {
      baseScenePlugin.scene.remove(trajectoryLine);
      trajectoryLine = null;
    }

    // 创建轨迹线几何体
    const geometry = new EngineKernel.THREE.BufferGeometry().setFromPoints(
      trajectoryPoints
    );
    const material = new EngineKernel.THREE.LineBasicMaterial({
      color: 0x00ff00,
      linewidth: 3,
      transparent: true,
      opacity: 0.8,
    });

    trajectoryLine = new EngineKernel.THREE.Line(geometry, material);
    trajectoryLine.name = "HorseTrajectory";
    baseScenePlugin.scene.add(trajectoryLine);
  } catch (error) {
    addDebugLog("error", `❌ 更新轨迹线失败: ${error.message}`);
  }
};

// 添加轨迹点
const addTrajectoryPoint = (position) => {
  trajectoryPoints.push(position.clone());

  // 限制轨迹点数量，避免内存泄露
  const maxPoints = 5000; // 增加轨迹点数量，让轨迹更长
  if (trajectoryPoints.length > maxPoints) {
    trajectoryPoints.shift(); // 移除最老的点
  }

  // 每隔几个点更新一次轨迹线（性能优化）
  if (trajectoryPoints.length % 5 === 0 || trajectoryPoints.length < 10) {
    updateTrajectoryVisualization();
  }
};

// 清除轨迹线
const clearTrajectory = () => {
  trajectoryPoints = [];
  const baseScenePlugin = getBaseScenePlugin();
  if (baseScenePlugin && trajectoryLine) {
    baseScenePlugin.scene.remove(trajectoryLine);
    trajectoryLine = null;
  }
};

// 马模型目标点移动动画
const animateHorse = () => {
  if (!horseModel.value) return;

  const animate = () => {
    if (!isAnimating.value) return;

    const currentTime = Date.now();

    // 如果没有目标点或已到达目标点，生成新目标
    if (!currentTarget || currentTime - moveStartTime >= moveDuration) {
      // 每次生成新目标时，将当前位置设置为模型的实际位置
      currentPosition = horseModel.value.position.clone();

      // 生成新的随机目标点
      currentTarget = generateRandomTarget();
      moveStartTime = currentTime;
      moveDuration = 3000 + Math.random() * 4000; // 3-7秒随机移动时间

      addDebugLog(
        "info",
        `🐎 马模型从 (${currentPosition.x.toFixed(
          1
        )}, ${currentPosition.y.toFixed(1)}, ${currentPosition.z.toFixed(
          1
        )}) 前往新目标: (${currentTarget.x.toFixed(
          1
        )}, ${currentTarget.y.toFixed(1)}, ${currentTarget.z.toFixed(1)})`
      );
    }

    // 计算移动进度 (0 到 1)
    const progress = Math.min((currentTime - moveStartTime) / moveDuration, 1);

    // 使用缓动函数让移动更自然 (easeInOutQuad)
    const easeProgress =
      progress < 0.5
        ? 2 * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 2) / 2;

    // 计算当前位置 (从currentPosition到currentTarget的插值)
    const newPosition = new EngineKernel.THREE.Vector3();
    newPosition.lerpVectors(currentPosition, currentTarget, easeProgress);

    // 更新马模型位置
    horseModel.value.position.copy(newPosition);

    // 让马模型面向目标方向
    const direction = currentTarget.clone().sub(currentPosition).normalize();
    if (direction.length() > 0.01) {
      // 避免方向为零向量
      const lookAtPosition = newPosition.clone().add(direction);
      horseModel.value.lookAt(lookAtPosition);
    }

    // 添加轨迹点（每帧都添加，确保轨迹连续）
    addTrajectoryPoint(newPosition);

    // 如果达到目标点，记录日志但不在这里更新currentPosition
    // currentPosition会在生成新目标时更新
    if (progress >= 1) {
      addDebugLog("success", "🎯 马模型已到达目标点，准备前往下一个目标");
    }

    animationId = requestAnimationFrame(animate);
  };

  animate();
};

// 开始马模型动画
const startHorseAnimation = () => {
  if (!horseModel.value) {
    addDebugLog("warning", "⚠️ 马模型未加载，无法开始动画");
    return;
  }

  // 初始化位置和目标
  currentPosition = horseModel.value.position.clone();
  currentTarget = null; // 让动画函数生成第一个目标

  // 如果是第一次启动，清空轨迹点；否则保持现有轨迹
  if (trajectoryPoints.length === 0) {
    trajectoryPoints = [];
    addDebugLog("info", "🎬 初始化新的轨迹记录");
  } else {
    addDebugLog("info", "🎬 继续在现有轨迹基础上移动");
  }

  isAnimating.value = true;
  animateHorse();

  addDebugLog("success", "🎬 马模型目标点移动动画已开始");
};

// 停止马模型动画
const stopHorseAnimation = () => {
  isAnimating.value = false;
  if (animationId) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }

  // 清除轨迹线
  clearTrajectory();

  addDebugLog("info", "⏹️ 马模型目标点移动动画已停止");
};

// 测试CSS3D显示功能
const testCSS3DDisplay = () => {
  if (!css3dPlugin) {
    addDebugLog("error", "❌ CSS3D插件未初始化");
    return;
  }

  addDebugLog("info", "🧪 开始测试CSS3D显示功能");

  try {
    // 获取模型信息
    const modelInfo = {
      name: "测试CSS3D对象",
      type: "TestObject",
      uuid: "test-css3d-uuid",
      position: { x: 0, y: 0, z: 0 },
      geometry: "TestGeometry",
      material: "TestMaterial",
      vertices: 1000,
      triangles: 500,
    };

    // 创建DOM容器
    const container = document.createElement("div");
    container.className = "model-info-container";
    container.style.cssText = `
      position: relative;
      pointer-events: auto;
      z-index: 1;
      transform-style: preserve-3d;
      background: transparent;
    `;

    // 创建Vue应用实例
    const infoApp = createApp(ModelMessage, {
      modelInfo: modelInfo,
      onClose: () => {
        addDebugLog("info", "🧪 测试面板关闭");
        if (css3dInfoInstance && css3dPlugin) {
          try {
            if (typeof css3dPlugin.removeObject === "function") {
              css3dPlugin.removeObject(css3dInfoInstance);
            } else if (typeof css3dPlugin.remove3DObject === "function") {
              css3dPlugin.remove3DObject(css3dInfoInstance);
            }
            css3dInfoInstance = null;
          } catch (e) {
            addDebugLog("error", `❌ 测试面板清理失败: ${e.message}`);
          }
        }
      },
      onFocus: () => {
        addDebugLog("info", "🧪 测试聚焦功能");
      },
      onHighlight: () => {
        addDebugLog("info", "🧪 测试高亮功能");
      },
    });

    // 挂载Vue组件
    infoApp.mount(container);

    // 设置测试位置（相机前方）
    const baseScenePlugin = getBaseScenePlugin();
    if (baseScenePlugin && baseScenePlugin.camera) {
      const camera = baseScenePlugin.camera;
      const direction = new EngineKernel.THREE.Vector3(0, 0, -1);
      direction.applyQuaternion(camera.quaternion);

      const testPosition = camera.position
        .clone()
        .add(direction.multiplyScalar(30));

      addDebugLog(
        "info",
        `🧪 测试位置: (${testPosition.x.toFixed(1)}, ${testPosition.y.toFixed(
          1
        )}, ${testPosition.z.toFixed(1)})`
      );

      // 创建CSS3D对象
      if (typeof css3dPlugin.createCSS3DObject === "function") {
        try {
          const objectId = css3dPlugin.createCSS3DObject({
            element: container,
            position: [testPosition.x, testPosition.y, testPosition.z],
            scale: 1,
            visible: true,
            interactive: true,
          });
          css3dInfoInstance = objectId;
          addDebugLog("success", `✅ CSS3D测试对象创建成功，ID: ${objectId}`);

          // 聚焦到测试CSS3D对象
          focusOnCSS3DObject([testPosition.x, testPosition.y, testPosition.z]);
        } catch (e) {
          addDebugLog("error", `❌ CSS3D测试对象创建失败: ${e.message}`);
          // 使用备用方法
          useBackupCSS3DMethod(container, [
            testPosition.x,
            testPosition.y,
            testPosition.z,
          ]);
        }
      } else {
        addDebugLog("warning", "⚠️ createCSS3DObject方法不可用，使用备用方法");
        useBackupCSS3DMethod(container, [
          testPosition.x,
          testPosition.y,
          testPosition.z,
        ]);
      }
    }
  } catch (error) {
    addDebugLog("error", `❌ CSS3D测试失败: ${error.message}`);
    console.error("CSS3D测试错误:", error);
  }
};



// 创建替代几何体（当模型加载失败时）
const createFallbackGeometry = () => {
  const baseScenePlugin = getBaseScenePlugin();
  if (!baseScenePlugin) return;

  try {
    addDebugLog("info", "📦 开始创建替代几何体...");

    const fallbackModels = [];
    const scene = baseScenePlugin.scene;

    // 创建不同的几何体替代模型
    const geometries = [
      {
        geo: new EngineKernel.THREE.BoxGeometry(2, 2, 2),
        name: "立方体_01",
        color: 0xff6b6b,
      },
      {
        geo: new EngineKernel.THREE.SphereGeometry(1, 16, 16),
        name: "球体_02",
        color: 0x4ecdc4,
      },
      {
        geo: new EngineKernel.THREE.CylinderGeometry(1, 1, 2, 16),
        name: "圆柱体_03",
        color: 0x45b7d1,
      },
      {
        geo: new EngineKernel.THREE.ConeGeometry(1, 2, 16),
        name: "圆锥体_04",
        color: 0xf39c12,
      },
      {
        geo: new EngineKernel.THREE.TorusGeometry(1, 0.4, 8, 16),
        name: "环形体_05",
        color: 0xe74c3c,
      },
      {
        geo: new EngineKernel.THREE.OctahedronGeometry(1.5),
        name: "八面体_06",
        color: 0x9b59b6,
      },
      {
        geo: new EngineKernel.THREE.TetrahedronGeometry(1.5),
        name: "四面体_07",
        color: 0x1abc9c,
      },
      {
        geo: new EngineKernel.THREE.IcosahedronGeometry(1.2),
        name: "二十面体_08",
        color: 0xe67e22,
      },
      {
        geo: new EngineKernel.THREE.DodecahedronGeometry(1.2),
        name: "十二面体_09",
        color: 0x34495e,
      },
      {
        geo: new EngineKernel.THREE.TorusKnotGeometry(1, 0.3, 64, 8),
        name: "环结_10",
        color: 0x8e44ad,
      },
    ];

    geometries.forEach((item, index) => {
      // 创建材质
      const material = new EngineKernel.THREE.MeshPhongMaterial({
        color: item.color,
        shininess: 100,
        specular: 0x222222,
      });

      const mesh = new EngineKernel.THREE.Mesh(item.geo, material);

      // 设置位置（圆形分布）
      const angle = (index / geometries.length) * Math.PI * 2;
      const radius = 20 + Math.random() * 40; // 20-60 的随机半径
      const x = Math.cos(angle) * radius + (Math.random() - 0.5) * 10;
      const z = Math.sin(angle) * radius + (Math.random() - 0.5) * 10;
      const y = Math.random() * 5; // 0-5 的随机高度

      mesh.position.set(x, y, z);

      // 随机旋转
      mesh.rotation.x = Math.random() * Math.PI * 2;
      mesh.rotation.y = Math.random() * Math.PI * 2;
      mesh.rotation.z = Math.random() * Math.PI * 2;

      // 设置名称
      mesh.name = item.name;
      mesh.userData = {
        type: "fallback_geometry",
        originalIndex: index + 1,
      };

      // 添加到场景
      scene.add(mesh);
      fallbackModels.push(mesh);
    });

    // 更新加载的模型列表
    loadedModels.value = fallbackModels;

    addDebugLog("success", `✅ 已创建 ${geometries.length} 个替代几何体`);
  } catch (error) {
    addDebugLog("error", `❌ 创建替代几何体失败: ${error.message}`);
  }
};

// 主初始化流程
const initializeApplication = async () => {
  try {
    addDebugLog("info", "🚀 开始初始化3D场景应用");

    // 1. 初始化引擎核心
    await initializeEngine(addDebugLog);

    // 等待引擎就绪
    const waitForReady = () => {
      return new Promise((resolve) => {
        const check = () => {
          if (engineReady.value) {
            resolve();
          } else {
            setTimeout(check, 100);
          }
        };
        check();
      });
    };

    await waitForReady();
    addDebugLog("success", "✅ 引擎已就绪");

    // 确保轨道控制器正常工作
    const orbitControlPlugin = getOrbitControlPlugin();
    if (orbitControlPlugin) {
      addDebugLog("success", "🎮 轨道控制器已激活");

      // 检查Canvas事件绑定
      const baseScenePlugin = getBaseScenePlugin();
      if (baseScenePlugin && baseScenePlugin.rendererInstance) {
        const canvas = baseScenePlugin.rendererInstance.domElement;
        if (canvas) {
          addDebugLog("success", `✅ Canvas元素已找到: ${canvas.tagName}`);

          // 确保Canvas样式正确
          canvas.style.pointerEvents = "auto";
          canvas.style.zIndex = "1";
          canvas.style.position = "relative";

          // 测试事件监听
          canvas.addEventListener(
            "mousedown",
            () => {
              addDebugLog("info", "🖱️ Canvas鼠标按下事件已触发");
            },
            { once: true }
          );
        }
      }
    } else {
      addDebugLog("error", "❌ 轨道控制器未找到");
    }




    // 3. 初始化插件
    await initializeMousePick();
    await initializeCSS3D();

    // 延迟测试CSS3D功能
    setTimeout(() => {
      addDebugLog("info", "💡 提示：按C键测试CSS3D显示功能");
    }, 3000);

    // 4. 批量加载模型
    await loadModelsFromConfig();

    // // 5. 加载马模型并开始动画
    // horseModel.value = await loadHorseWithAnimation(addDebugLog)
    // if (horseModel.value) {
    //   // 延迟启动动画，确保所有初始化完成
    //   setTimeout(() => {
    //     startHorseAnimation()
    //   }, 1000)
    // }

    addDebugLog("success", "🎉 3D场景应用初始化完成");

    // 检查UI层级设置
    setTimeout(() => {
      const navButton = document.querySelector(".nav-toggle-mini");
      if (navButton) {
        const styles = window.getComputedStyle(navButton);
        addDebugLog(
          "info",
          `🎯 导航按钮层级检查: z-index=${styles.zIndex}, pointer-events=${styles.pointerEvents}`
        );
      }

      const sceneContainer = document.querySelector(".engine-scene-container");
      if (sceneContainer) {
        const styles = window.getComputedStyle(sceneContainer);
        addDebugLog("info", `🎬 场景容器层级检查: z-index=${styles.zIndex}`);
      }

      // 显示快捷键提示
      addDebugLog(
        "info",
        "⌨️ 快捷键提示: R=重置相机, H=隐藏面板, T=测试控制器, C=测试CSS3D, X=清除轨迹, F=聚焦中心, G=聚焦马模型"
      );
    }, 2000);
  } catch (error) {
    addDebugLog("error", `❌ 应用初始化失败: ${error.message}`);
  }
};

// 添加键盘快捷键支持
const setupKeyboardControls = () => {
  const handleKeyPress = (event) => {
    switch (event.key.toLowerCase()) {
      case "r":
        // R键重置相机
        resetCamera(addDebugLog);
        addDebugLog("info", "🎯 快捷键R: 相机已重置");
        break;
      case "h":
        // H键隐藏/显示信息面板
        if (css3dInfoInstance && css3dPlugin) {
          css3dPlugin.remove3DObject(css3dInfoInstance);
          css3dInfoInstance = null;
          addDebugLog("info", "👁️ 快捷键H: 隐藏信息面板");
        }
        break;
      case "t":
        // T键测试控制器
        const orbitControlPlugin = getOrbitControlPlugin();
        if (orbitControlPlugin) {
          addDebugLog(
            "info",
            `🎮 快捷键T: 控制器状态 enabled=${orbitControlPlugin.enabled}`
          );
        }
        break;
      case "c":
        // C键测试CSS3D
        testCSS3DDisplay();
        break;
      case "x":
        // X键清除轨迹线
        clearTrajectory();
        addDebugLog("info", "🧹 快捷键X: 轨迹线已清除");
        break;
      case "f":
        // F键测试聚焦功能（聚焦到场景中心）
        const centerPosition = [0, 10, 0]; // 场景中心稍微偏上的位置
        focusOnCSS3DObject(centerPosition);
        addDebugLog("info", "🎯 快捷键F: 聚焦到场景中心");
        break;
      case "g":
        // G键聚焦到马模型（如果存在）
        if (horseModel.value) {
          const horsePosition = new EngineKernel.THREE.Vector3();
          horseModel.value.getWorldPosition(horsePosition);
          focusOnCSS3DObject([
            horsePosition.x,
            horsePosition.y + 5,
            horsePosition.z,
          ]);
          addDebugLog("info", "🐎 快捷键G: 聚焦到马模型");
        } else {
          addDebugLog("warning", "⚠️ 马模型不存在，无法聚焦");
        }
        break;

    }
  };

  document.addEventListener("keydown", handleKeyPress);

  return () => {
    document.removeEventListener("keydown", handleKeyPress);
  };
};

// 组件挂载
onMounted(() => {
  initializeApplication();
  // 设置键盘控制
  const keyboardCleanup = setupKeyboardControls();

  // 保存清理函数
  window.engineKeyboardCleanup = keyboardCleanup;
});

// 组件卸载
onUnmounted(() => {
  // 停止动画
  stopHorseAnimation();

  // 清理拾取事件监听器
  pickEventCleanup.forEach((cleanup) => cleanup());

  // 清理CSS3D信息面板
  if (css3dInfoInstance && css3dPlugin) {
    css3dPlugin.remove3DObject(css3dInfoInstance);
  }

  // 清理键盘事件监听器
  if (window.engineKeyboardCleanup) {
    window.engineKeyboardCleanup();
    delete window.engineKeyboardCleanup;
  }

  // 清理引擎资源
  const engineInstance = getEngineInstance();
  if (engineInstance) {
    addDebugLog("info", "🧹 引擎资源清理完成");
  }
});
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
  z-index: 0; /* 确保3D场景在最底层，不影响App.vue的导航 */
}

.canvas-container {
  width: 100%;
  height: 100%;
  position: relative;
  z-index: 1; /* Canvas容器层级 */
}

.canvas-container canvas {
  display: block !important;
  cursor: pointer !important;
  pointer-events: auto !important; /* 确保Canvas接收鼠标事件 */
  position: relative !important;
  z-index: 1 !important; /* Canvas在场景容器内的层级 */
  outline: none; /* 移除焦点边框 */
}

.css3d-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none !important; /* CSS3D容器不接收事件 */
  z-index: 999; /* 在Canvas之上，确保CSS3D对象可见 */
  overflow: hidden; /* 防止内容溢出 */
}

.model-info-container {
  pointer-events: auto !important; /* 只有信息卡片可以接收事件 */
  position: relative;
  z-index: 1; /* 信息卡片在CSS3D容器内的层级 */
  background: transparent; /* 确保背景透明 */
  transform-style: preserve-3d; /* 保持3D变换 */
}

/* CSS3D渲染器全局样式 */
:global(.css3d-renderer-layer) {
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  width: 100% !important;
  height: 100% !important;
  pointer-events: none !important;
  z-index: 999 !important;
  overflow: hidden !important;
}

/* CSS3D对象内的模型信息卡片样式增强 */
:global(.css3d-renderer-layer .model-info-container) {
  pointer-events: auto !important;
  visibility: visible !important;
  opacity: 1 !important;
  display: block !important;
}
</style>
