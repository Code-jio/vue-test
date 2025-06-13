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
import eventBus from "@/eventBus";
import ModelMessage from "@/components/modelMessage.vue";

// 使用引擎功能
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

// 应用状态
const loadedModels = ref([]);
const currentBuildingModel = ref(null);
const floorControlVisible = ref(false);

// 插件引用
let mousePickPlugin = null;
let css3dPlugin = null;
let css3dInfoInstance = null;
let buildingControlPlugin = null;

// 动画相关
let animationId = null;

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
    } else {
      throw new Error("鼠标拾取插件获取失败");
    }
  } catch (error) {
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
      // 检查可用方法
      const methods = [
        "createCSS3DObject",
        "addObject",
        "removeObject",
        "render",
      ];

      // 启动CSS3D渲染循环
      if (typeof css3dPlugin.startRenderLoop === "function") {
        css3dPlugin.startRenderLoop();
      }

      // 确保CSS3D能正常渲染
      if (typeof css3dPlugin.render === "function") {
        // 手动触发一次渲染测试
        css3dPlugin.render(baseScenePlugin.camera);
      }
    } else {
      throw new Error("CSS3D插件获取失败");
    }
  } catch (error) {
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
    return;
  }

  try {

    // 检查是否为建筑模型并应用楼层控件
    let buildingModel = pickedObject;

    // 向上遍历找到建筑模型根节点
    while (buildingModel && !buildingModel.userData?.isBuildingModel) {
      buildingModel = buildingModel.parent;
    }

    if (buildingModel && buildingModel.userData?.isBuildingModel) {
      setCurrentBuildingModel(buildingModel);
    }

    // 清理之前的信息面板
    if (css3dInfoInstance) {
      try {
        if (typeof css3dPlugin.removeObject === "function") {
          css3dPlugin.removeObject(css3dInfoInstance);
        } else if (typeof css3dPlugin.remove3DObject === "function") {
          css3dPlugin.remove3DObject(css3dInfoInstance);
        }
      } catch (e) {
      }
      css3dInfoInstance = null;
    }

    // 获取模型信息
    const modelInfo = extractModelInfo(pickedObject);

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
        if (css3dInfoInstance && css3dPlugin) {
          try {
            if (typeof css3dPlugin.removeObject === "function") {
              css3dPlugin.removeObject(css3dInfoInstance);
            } else if (typeof css3dPlugin.remove3DObject === "function") {
              css3dPlugin.remove3DObject(css3dInfoInstance);
            }
            css3dInfoInstance = null;
          } catch (e) {
            // 静默处理错误
          }
        }
      },
      onFocus: () => {
        focusOnModel(pickedObject);
      },
      onHighlight: () => {
        highlightModel(pickedObject);
      },
    });

    // 挂载Vue组件
    infoApp.mount(container);

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

    // CSS3D位置设置完成

    // 使用CSS3D插件的createCSS3DObject方法
    if (typeof css3dPlugin.createCSS3DObject === "function") {

      const objectId = css3dPlugin.createCSS3DObject({
        element: container,
        position: finalPosition,
        scale: 1,
        visible: true,
        interactive: true,
      });
      css3dInfoInstance = objectId;

      // 创建CSS3D对象后，立即聚焦到该位置
      focusOnCSS3DObject(finalPosition);

    }
  } catch (error) {
    console.error("CSS3D显示错误详情:", error);
  }
};

// 提取模型信息
const extractModelInfo = (object) => {
  const position = new EngineKernel.THREE.Vector3();
  object.getWorldPosition(position);

  // 获取模型名称（优先从userData.modelName读取）
  let modelName = '未命名模型';
  if (object.userData && object.userData.modelName) {
    modelName = object.userData.modelName;
  } else if (object.name) {
    modelName = object.name;
  }

  const info = {
    name: modelName,
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
};

// 聚焦到CSS3D对象位置
const focusOnCSS3DObject = (position) => {
  const baseScenePlugin = getBaseScenePlugin();
  const orbitControlPlugin = getOrbitControlPlugin();

  if (!baseScenePlugin || !position) {
    return;
  }

  try {
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

      baseScenePlugin.cameraFlyTo({
        position: finalCameraPosition, // 相机目标位置
        lookAt: targetPosition, // 相机朝向目标（CSS3D对象位置）
        duration: 1500, // 动画时长1.5秒
        onUpdate: () => {
          // 动画过程中的回调（可选）
        },
        onComplete: () => {
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
    } else {
      // 如果引擎方法不可用，使用备用方法

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


    }
  } catch (error) {
    console.error("聚焦CSS3D对象错误详情:", error);
  }
};


// 批量加载模型
const loadModelsFromConfig = async () => {
  try {
    // 获取模型文件配置
    const response = await fetch("/model-files.json");
    if (!response.ok) {
      throw new Error(`无法获取模型配置文件: ${response.status}`);
    }

    const config = await response.json();

    if (!config.files || !Array.isArray(config.files)) {
      throw new Error("模型配置文件格式无效");
    }

    // 验证模型文件路径
    const validPaths = [];
    for (const filePath of config.files) {
      // 修复路径格式
      const fixedPath = filePath.replace(/\\/g, "/");
      const fullPath = fixedPath.startsWith("/") ? fixedPath : `/${fixedPath}`;


      // 简单的路径验证
      if (fullPath.includes(".gltf") || fullPath.includes(".glb")) {
        validPaths.push(fullPath);
      }
    }

    if (validPaths.length === 0) {
      throw new Error("没有找到有效的模型文件路径");
    }
    // 批量加载模型
    const models = await loadBatchModels(validPaths);
    loadedModels.value = models;

    const successCount = models.filter((m) => m !== null).length;

  } catch (error) {
    console.error("批量加载模型失败:", error);
  }
};


// 初始化楼层控件插件
const initializeFloorControl = async () => {
  try {
    const engineInstance = getEngineInstance();
    const baseScenePlugin = getBaseScenePlugin();

    if (!engineInstance || !baseScenePlugin) {
      throw new Error("引擎或场景插件未就绪");
    }

    // 注册楼层控件插件
    engineInstance.register({
      name: "BuildingControlPlugin",
      path: "/plugins/webgl/BuildingControlPlugin",
      pluginClass: EngineKernel.BuildingControlPlugin,
      userData: {
        floorControlConfig: {
          expandDistance: 30,
          animationDuration: 1500,
          focusOpacity: 1.0,
          unfocusOpacity: 0.3,
          easingFunction: 'Cubic.InOut',
          showFacade: true,
          autoHideFacade: true
        },
        events: {
          onExpandStart: () => {
            console.log('🏗️ 楼层开始展开');
          },
          onExpandComplete: () => {
            console.log('✅ 楼层展开完成');
            updateFloorControlStatus();
          },
          onCollapseStart: () => {
            console.log('🏗️ 楼层开始收回');
          },
          onCollapseComplete: () => {
            console.log('✅ 楼层收回完成');
            updateFloorControlStatus();
          },
          onFloorFocus: (floorNumber) => {
            console.log(`🎯 聚焦到 ${floorNumber} 楼`);
            updateFloorControlStatus();
          },
          onFloorUnfocus: () => {
            console.log('👁️ 取消楼层聚焦');
            updateFloorControlStatus();
          }
        }
      },
    });

    // 获取插件实例
    buildingControlPlugin = engineInstance.getPlugin("BuildingControlPlugin");
    console.log(buildingControlPlugin)
    if (buildingControlPlugin) {
      console.log('🏗️ 楼层控制插件已注册，开始自动场景检索...');
      
      if (baseScenePlugin) {
        // 重新初始化插件，传入场景对象进行自动配置
        await buildingControlPlugin.init(baseScenePlugin);
      } else {
        console.warn('⚠️ 场景对象不可用，无法执行自动检索');
      }
    } else {
      throw new Error("楼层控件插件获取失败");
    }
  } catch (error) {
    console.error('❌ 楼层控制插件初始化失败:', error);
    throw error;
  }
};

// 设置当前建筑模型（手动设置，通常用于用户点击选择）
const setCurrentBuildingModel = (model) => {
  if (!buildingControlPlugin || !model) return;

  // 检查是否为建筑模型
  if (model.userData && model.userData.isBuildingModel) {
    const success = buildingControlPlugin.setBuildingModel(model);
    if (success) {
      currentBuildingModel.value = model;
      floorControlVisible.value = true; // 显示楼层控件面板
      updateFloorControlUI();

      // 如果有场景对象，重新执行设备关联
      const baseScenePlugin = getBaseScenePlugin();
      if (baseScenePlugin && baseScenePlugin.scene) {
        buildingControlPlugin.reAssociateEquipmentByNaming(baseScenePlugin.scene);
        console.log('🔄 已重新关联设备到新建筑');
      }
    }
  }
};

// 更新楼层控件UI
const updateFloorControlUI = () => {
  if (!buildingControlPlugin) return;

  const floorInfo = buildingControlPlugin.getFloorInfo();

  // 更新楼层选择器
  const floorSelect = document.getElementById('floorSelect');
  if (floorSelect && floorInfo.totalFloors > 0) {
    floorSelect.innerHTML = '<option value="">选择楼层</option>';
    floorInfo.floorNumbers.forEach(floorNumber => {
      const option = document.createElement('option');
      option.value = floorNumber.toString();
      option.textContent = `${floorNumber} 楼`;
      floorSelect.appendChild(option);
    });
  }

  // 更新状态信息
  updateFloorControlStatus();
};

// 更新楼层控件状态信息
const updateFloorControlStatus = () => {
  if (!buildingControlPlugin) return;

  const floorInfo = buildingControlPlugin.getFloorInfo();
  const equipmentAssociations = buildingControlPlugin.getEquipmentAssociations();
  const statusElement = document.getElementById('floorControlStatus');

  if (statusElement) {
    let stateText = '';
    switch (floorInfo.currentState) {
      case 'NORMAL':
        stateText = '正常状态';
        break;
      case 'EXPANDED':
        stateText = '展开状态';
        break;
      case 'FOCUSED':
        stateText = `聚焦状态 (${floorInfo.focusedFloor}楼)`;
        break;
    }

    // 计算设备总数
    const totalEquipment = Object.values(equipmentAssociations).reduce((sum, equipmentList) => sum + equipmentList.length, 0);

    // 生成设备关联详情
    let equipmentDetails = '';
    if (totalEquipment > 0) {
      equipmentDetails = '<br><strong>设备关联详情:</strong><br>';
      Object.entries(equipmentAssociations).forEach(([floorNumber, equipmentList]) => {
        if (equipmentList.length > 0) {
          equipmentDetails += `${floorNumber}楼: ${equipmentList.length}个设备 (${equipmentList.join(', ')})<br>`;
        }
      });
    }

    statusElement.innerHTML = `
      <strong>楼层控制状态:</strong><br>
      当前状态: ${stateText}<br>
      楼层总数: ${floorInfo.totalFloors} 层<br>
      楼层编号: ${floorInfo.floorNumbers.join(', ')}<br>
      ${floorInfo.focusedFloor ? `聚焦楼层: ${floorInfo.focusedFloor}楼<br>` : ''}
      关联设备: ${totalEquipment} 个<br>
      ${equipmentDetails}
    `;
  }
};

// 确保楼层控制插件已准备就绪的辅助函数
const ensureBuildingModel = () => {
  const baseScenePlugin = getBaseScenePlugin();
  
  // 使用插件的ensureBuildingModel方法
  const success = buildingControlPlugin.ensureBuildingModel(baseScenePlugin.scene);
  if (success) {
    // 确保UI状态同步
    floorControlVisible.value = true;
    updateFloorControlUI();
  }
  
  return success;
};

// 楼层展开
window.expandFloors = async () => {
  if (!ensureBuildingModel()) return;

  await buildingControlPlugin.expandFloors();
  updateFloorControlStatus();
};

// 楼层收回
window.collapseFloors = async () => {
  if (!ensureBuildingModel()) return;

  await buildingControlPlugin.collapseFloors();
  updateFloorControlStatus();
};

// 聚焦到楼层
window.focusOnFloor = async (floorNumber) => {
  if (!floorNumber) {
    console.warn('⚠️ 请指定楼层号');
    return;
  }
  if (!ensureBuildingModel()) return;

  await buildingControlPlugin.focusOnFloor(parseInt(floorNumber));
  updateFloorControlStatus();
};

// 显示所有楼层
window.showAllFloors = async () => {
  if (!ensureBuildingModel()) return;

  await buildingControlPlugin.showAllFloors();
  updateFloorControlStatus();
};

// 显示/隐藏建筑外立面
window.toggleFacade = (flag) => {
  if (!ensureBuildingModel()) return;

  const floorInfo = buildingControlPlugin.getFloorInfo();
  console.log('当前楼层状态:', floorInfo.currentState);
  buildingControlPlugin.setFacadeVisibility(flag);
};

// 启动动画更新循环
const startAnimationLoop = () => {
  const animate = () => {
    // 更新楼层控件动画
    if (buildingControlPlugin) {
      buildingControlPlugin.update();
    }
    requestAnimationFrame(animate);
  };
  animate();
};

// 主初始化流程
const initializeApplication = async () => {
  try {
    // 1. 初始化引擎核心
    await initializeEngine();

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
    // 确保轨道控制器正常工作
    const orbitControlPlugin = getOrbitControlPlugin();
    if (orbitControlPlugin) {

      // 检查Canvas事件绑定
      const baseScenePlugin = getBaseScenePlugin();
      if (baseScenePlugin && baseScenePlugin.rendererInstance) {
        const canvas = baseScenePlugin.rendererInstance.domElement;
        if (canvas) {
          // 确保Canvas样式正确
          canvas.style.pointerEvents = "auto";
          canvas.style.zIndex = "1";
          canvas.style.position = "relative";

        }
      }
    }
    // 批量加载模型
    await loadModelsFromConfig();

    // 初始化插件
    await initializeMousePick();
    
    await initializeCSS3D();
    await initializeFloorControl();
  } catch (error) {
    console.error("应用初始化失败:", error);
  }
};

// 组件挂载
onMounted(() => {
  initializeApplication();
  // 启动动画循环
  startAnimationLoop();
});

// 停止马匹动画的函数
const stopHorseAnimation = () => {
  // 停止动画的逻辑
  if (animationId) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }
};

// 高亮模型函数
const highlightModel = (object) => {
  // 高亮模型的逻辑
  if (object && object.material) {
    // 简单的高亮效果
    if (Array.isArray(object.material)) {
      object.material.forEach(mat => {
        if (mat.emissive) {
          mat.emissive.setHex(0x404040);
        }
      });
    } else if (object.material.emissive) {
      object.material.emissive.setHex(0x404040);
    }
  }
};

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

  // 清理楼层控件
  if (buildingControlPlugin) {
    buildingControlPlugin.destroy();
  }

  // 清理键盘事件监听器
  if (window.engineKeyboardCleanup) {
    window.engineKeyboardCleanup();
    delete window.engineKeyboardCleanup;
  }

  // 清理引擎资源
  const engineInstance = getEngineInstance();
  if (engineInstance) {
    // 引擎资源清理完成
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
  z-index: 0;
  /* 确保3D场景在最底层，不影响App.vue的导航 */
}

.canvas-container {
  width: 100%;
  height: 100%;
  position: relative;
  z-index: 1;
  /* Canvas容器层级 */
}

.canvas-container canvas {
  display: block !important;
  cursor: pointer !important;
  pointer-events: auto !important;
  /* 确保Canvas接收鼠标事件 */
  position: relative !important;
  z-index: 1 !important;
  /* Canvas在场景容器内的层级 */
  outline: none;
  /* 移除焦点边框 */
}

.css3d-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none !important;
  /* CSS3D容器不接收事件 */
  z-index: 999;
  /* 在Canvas之上，确保CSS3D对象可见 */
  overflow: hidden;
  /* 防止内容溢出 */
}

.model-info-container {
  pointer-events: auto !important;
  /* 只有信息卡片可以接收事件 */
  position: relative;
  z-index: 1;
  /* 信息卡片在CSS3D容器内的层级 */
  background: transparent;
  /* 确保背景透明 */
  transform-style: preserve-3d;
  /* 保持3D变换 */
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
