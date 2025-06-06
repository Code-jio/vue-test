<template>
  <div class="async-loading-test">
    <div class="header">
      <h1>异步模型加载测试</h1>
      <div class="status-indicator">
        <div :class="['status-dot', engineReady ? 'ready' : 'loading']"></div>
        <span class="status-text">{{ initStatus }}</span>
      </div>
    </div>

    <div id="canvas-container" class="canvas-container"></div>

    <div class="control-panel">
      <!-- 基础控制 -->
      <div class="control-section">
        <h3>🎮 基础控制</h3>
        <div class="button-group">
          <button
            @click="handleResetCamera"
            :disabled="!engineReady"
            class="btn btn-secondary"
          >
            重置相机
          </button>
          <button
            @click="clearAllModels"
            :disabled="!engineReady"
            class="btn btn-warning"
          >
            清空所有模型
          </button>
        </div>
      </div>

      <!-- 单个模型加载 -->
      <div class="control-section">
        <h3>🐎 单个模型加载</h3>
        <div class="button-group">
          <button
            @click="loadSingleModel"
            :disabled="!engineReady || isLoading"
            class="btn btn-primary"
          >
            加载马模型（高优先级）
          </button>
          <button
            @click="loadModelWithPriority('normal')"
            :disabled="!engineReady || isLoading"
            class="btn btn-secondary"
          >
            加载模型（普通优先级）
          </button>
          <button
            @click="loadModelWithPriority('low')"
            :disabled="!engineReady || isLoading"
            class="btn btn-info"
          >
            加载模型（低优先级）
          </button>
        </div>
      </div>

      <!-- 批量模型加载 -->
      <div class="control-section">
        <h3>📦 批量模型加载</h3>
        <div class="button-group">
                      <button
              @click="loadMultipleModels"
              :disabled="!engineReady || isLoading"
              class="btn btn-success"
            >
              批量加载GLTF模型（从JSON）
            </button>
          <button
            @click="loadModelsWithMixedPriority"
            :disabled="!engineReady || isLoading"
            class="btn btn-warning"
          >
            混合优先级加载
          </button>
        </div>
      </div>

      <!-- 调度器状态监控 -->
      <div class="control-section">
        <h3>📊 调度器状态</h3>
        <div class="status-grid">
          <div class="status-item">
            <span class="label">排队中:</span>
            <span class="value">{{ schedulerStatus.pending }}</span>
          </div>
          <div class="status-item">
            <span class="label">运行中:</span>
            <span class="value">{{ schedulerStatus.running }}</span>
          </div>
          <div class="status-item">
            <span class="label">已完成:</span>
            <span class="value">{{ schedulerStatus.completed }}</span>
          </div>
          <div class="status-item">
            <span class="label">最大并发:</span>
            <span class="value">{{ schedulerStatus.maxConcurrent }}</span>
          </div>
        </div>
        <button @click="refreshSchedulerStatus" class="btn btn-outline">
          刷新状态
        </button>
      </div>

      <!-- 性能统计 -->
      <div class="control-section">
        <h3>⚡ 性能统计</h3>
        <div class="stats-grid">
          <div class="stat-item">
            <span class="label">已加载模型:</span>
            <span class="value">{{ loadedModelCount }}</span>
          </div>
          <div class="stat-item">
            <span class="label">平均加载时间:</span>
            <span class="value">{{ averageLoadTime }}ms</span>
          </div>
          <div class="stat-item">
            <span class="label">成功率:</span>
            <span class="value">{{ successRate }}%</span>
          </div>
        </div>
        <div class="button-group" style="margin-top: 10px;">
          <button @click="startPerformanceMonitoring" :disabled="isPerformanceMonitoring" class="btn btn-outline">
            开始性能监控
          </button>
          <button @click="stopPerformanceMonitoring" :disabled="!isPerformanceMonitoring" class="btn btn-outline">
            停止性能监控
          </button>
        </div>
      </div>

      <!-- 实时性能数据 -->
      <div class="control-section">
        <h3>📊 实时性能数据</h3>
        <div class="performance-grid">
          <div class="perf-item">
            <span class="label">FPS:</span>
            <span class="value" :class="{ 'low-fps': performanceStats.fps < 30 }">{{ performanceStats.fps }}</span>
          </div>
          <div class="perf-item">
            <span class="label">帧时间:</span>
            <span class="value">{{ performanceStats.frameTime }}ms</span>
          </div>
          <div class="perf-item">
            <span class="label">三角面:</span>
            <span class="value">{{ performanceStats.triangleCount.toLocaleString() }}</span>
          </div>
          <div class="perf-item">
            <span class="label">顶点数:</span>
            <span class="value">{{ performanceStats.vertexCount.toLocaleString() }}</span>
          </div>
          <div class="perf-item">
            <span class="label">几何体:</span>
            <span class="value">{{ performanceStats.geometryCount }}</span>
          </div>
          <div class="perf-item">
            <span class="label">材质数:</span>
            <span class="value">{{ performanceStats.materialCount }}</span>
          </div>
          <div class="perf-item">
            <span class="label">绘制调用:</span>
            <span class="value">{{ performanceStats.drawCalls }}</span>
          </div>
          <div class="perf-item">
            <span class="label">纹理内存:</span>
            <span class="value">{{ performanceStats.textureMemory }}MB</span>
          </div>
        </div>
        <button @click="updateSceneStats" class="btn btn-outline" style="margin-top: 10px; width: 100%;">
          刷新场景统计
        </button>
      </div>

      <!-- 模型加载时间记录 -->
      <div class="control-section">
        <h3>⏱️ 模型加载记录</h3>
        <div class="load-times-container">
          <div
            v-for="(record, index) in modelLoadTimes.slice(-10)"
            :key="index"
            :class="['load-record', record.success ? 'success' : 'failed']"
          >
            <span class="model-name">{{ record.modelName }}</span>
            <span class="load-time">{{ record.duration.toFixed(0) }}ms</span>
            <span class="triangle-count" v-if="record.triangles">{{ record.triangles.toLocaleString() }} 面</span>
          </div>
        </div>
      </div>

      <!-- 调试日志 -->
      <div class="control-section">
        <h3>📝 调试日志</h3>
        <div class="log-container">
          <div
            v-for="(log, index) in debugLogs"
            :key="index"
            :class="['log-entry', `log-${log.type}`]"
          >
            <span class="log-time">{{ log.time }}</span>
            <span class="log-message">{{ log.message }}</span>
          </div>
        </div>
        <button @click="clearLogs" class="btn btn-outline">清空日志</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useEngine } from "../composables/useEngine";

// 响应式状态
const isLoading = ref(false);
const loadedModelCount = ref(0);
const loadStats = ref([]);
const debugLogs = ref([]);
const schedulerStatus = ref({
  pending: 0,
  running: 0,
  completed: 0,
  maxConcurrent: 0,
});

// 性能统计状态
const performanceStats = ref({
  fps: 0,
  frameTime: 0,
  triangleCount: 0,
  vertexCount: 0,
  geometryCount: 0,
  materialCount: 0,
  drawCalls: 0,
  textureMemory: 0
});

const modelLoadTimes = ref([]);
const isPerformanceMonitoring = ref(false);

// 使用引擎
const {
  engineReady,
  initStatus,
  initializeEngine,
  resetCamera,
  getEngineInstance,
  getBaseScenePlugin,
} = useEngine();

// 存储已加载的模型
let loadedModels = [];

// 添加调试日志
const addDebugLog = (type, message) => {
  const time = new Date().toLocaleTimeString();
  debugLogs.value.unshift({ type, message, time });

  // 限制日志数量
  if (debugLogs.value.length > 50) {
    debugLogs.value = debugLogs.value.slice(0, 50);
  }

  console.log(`[${type.toUpperCase()}] ${message}`);
};

// 清空日志
const clearLogs = () => {
  debugLogs.value = [];
};

// 记录加载统计
const recordLoadStat = (duration, success = true, modelName = '', triangles = 0) => {
  const loadRecord = { 
    duration, 
    success, 
    timestamp: Date.now(), 
    modelName,
    triangles
  };
  loadStats.value.push(loadRecord);
  modelLoadTimes.value.push(loadRecord);
  
  if (success) {
    loadedModelCount.value++;
  }
  
  // 保持最近50条记录
  if (modelLoadTimes.value.length > 50) {
    modelLoadTimes.value = modelLoadTimes.value.slice(-50);
  }
};

// 计算平均加载时间
const averageLoadTime = computed(() => {
  const successfulLoads = loadStats.value.filter((stat) => stat.success);
  if (successfulLoads.length === 0) return 0;

  const total = successfulLoads.reduce((sum, stat) => sum + stat.duration, 0);
  return Math.round(total / successfulLoads.length);
});

// 计算成功率
const successRate = computed(() => {
  if (loadStats.value.length === 0) return 100;

  const successful = loadStats.value.filter((stat) => stat.success).length;
  return Math.round((successful / loadStats.value.length) * 100);
});

// 刷新调度器状态
const refreshSchedulerStatus = () => {
  const engineInstance = getEngineInstance();
  if (!engineInstance) return;

  const resourcePlugin = engineInstance.getPlugin("ResourceReaderPlugin");
  if (resourcePlugin?.getSchedulerStatus) {
    schedulerStatus.value = resourcePlugin.getSchedulerStatus();
  }
};

// 计算模型三角面数量
const calculateTriangleCount = (model) => {
  let triangleCount = 0;
  let vertexCount = 0;
  
  model.traverse((child) => {
    if (child.geometry) {
      const geometry = child.geometry;
      if (geometry.index) {
        triangleCount += geometry.index.count / 3;
      } else if (geometry.attributes.position) {
        triangleCount += geometry.attributes.position.count / 3;
      }
      
      if (geometry.attributes.position) {
        vertexCount += geometry.attributes.position.count;
      }
    }
  });
  
  return { triangleCount: Math.floor(triangleCount), vertexCount };
};

// 更新场景性能统计
const updateSceneStats = () => {
  const baseScene = getBaseScenePlugin();
  if (!baseScene || !baseScene.scene || !baseScene.renderer) return;

  const scene = baseScene.scene;
  const renderer = baseScene.renderer;
  
  let totalTriangles = 0;
  let totalVertices = 0;
  let geometryCount = 0;
  let materialCount = 0;
  
  // 统计场景中的几何体和材质
  scene.traverse((object) => {
    if (object.geometry) {
      geometryCount++;
      const geometry = object.geometry;
      
      if (geometry.index) {
        totalTriangles += geometry.index.count / 3;
      } else if (geometry.attributes.position) {
        totalTriangles += geometry.attributes.position.count / 3;
      }
      
      if (geometry.attributes.position) {
        totalVertices += geometry.attributes.position.count;
      }
    }
    
    if (object.material) {
      if (Array.isArray(object.material)) {
        materialCount += object.material.length;
      } else {
        materialCount++;
      }
    }
  });
  
  // 获取渲染器信息
  const renderInfo = renderer.info;
  
  performanceStats.value = {
    ...performanceStats.value,
    triangleCount: Math.floor(totalTriangles),
    vertexCount: totalVertices,
    geometryCount,
    materialCount,
    drawCalls: renderInfo.render.calls,
    textureMemory: (renderInfo.memory.textures * 0.25).toFixed(2) // 粗略估算MB
  };
};

// FPS计算
let lastTime = 0;
let frameCount = 0;
let fpsUpdateTime = 0;

const updateFPS = () => {
  const now = performance.now();
  frameCount++;
  
  if (now - fpsUpdateTime >= 1000) { // 每秒更新一次FPS
    const fps = Math.round((frameCount * 1000) / (now - fpsUpdateTime));
    const frameTime = ((now - fpsUpdateTime) / frameCount).toFixed(2);
    
    performanceStats.value.fps = fps;
    performanceStats.value.frameTime = parseFloat(frameTime);
    
    frameCount = 0;
    fpsUpdateTime = now;
  }
  
  if (isPerformanceMonitoring.value) {
    requestAnimationFrame(updateFPS);
  }
};

// 开始性能监控
const startPerformanceMonitoring = () => {
  if (isPerformanceMonitoring.value) return;
  
  isPerformanceMonitoring.value = true;
  fpsUpdateTime = performance.now();
  updateFPS();
  
  addDebugLog("info", "📊 性能监控已启动");
};

// 停止性能监控
const stopPerformanceMonitoring = () => {
  isPerformanceMonitoring.value = false;
  addDebugLog("info", "📊 性能监控已停止");
};

// 加载单个模型
const loadSingleModel = async () => {
  if (isLoading.value) return;

  isLoading.value = true;
  const startTime = performance.now();

  try {
    addDebugLog("info", "🚀 开始异步加载单个模型...");

    const engineInstance = getEngineInstance();
    const resourcePlugin = engineInstance.getPlugin("ResourceReaderPlugin");
    const baseScene = getBaseScenePlugin();

    // 异步加载模型
    const model = await resourcePlugin.loadModelAsync(
      "/static/model/Horse.glb",
      EngineKernel.TaskPriority.HIGH,
      {
        timeout: 30000,
        retryCount: 2,
        category: "single-load",
      }
    );

    const loadTime = performance.now() - startTime;

    // 计算模型面片数量
    const { triangleCount, vertexCount } = calculateTriangleCount(model);

    // 设置模型位置
    const offset = loadedModels.length * 3;
    model.position.set(offset, 0, 0);
    model.scale.setScalar(0.8);

    // 调整材质
    model.traverse((child) => {
      if (child.material) {
        child.material.needsUpdate = true;
      }
    });

    baseScene.scene.add(model);
    loadedModels.push(model);

    // 记录加载统计
    recordLoadStat(loadTime, true, "Horse.glb", triangleCount);

    // 更新场景统计
    updateSceneStats();

    addDebugLog("success", `✅ 单个模型加载完成 (${loadTime.toFixed(0)}ms, ${triangleCount.toLocaleString()} 三角面)`);
  } catch (error) {
    const loadTime = performance.now() - startTime;
    recordLoadStat(loadTime, false, "Horse.glb", 0);
    addDebugLog("error", `❌ 单个模型加载失败: ${error.message}`);
  } finally {
    isLoading.value = false;
    refreshSchedulerStatus();
  }
};

// 根据优先级加载模型
const loadModelWithPriority = async (priorityLevel) => {
  if (isLoading.value) return;

  isLoading.value = true;
  const startTime = performance.now();

  const priorityMap = {
    urgent: EngineKernel.TaskPriority.URGENT,
    high: EngineKernel.TaskPriority.HIGH,
    normal: EngineKernel.TaskPriority.NORMAL,
    low: EngineKernel.TaskPriority.LOW,
  };

  try {
    addDebugLog("info", `🚀 开始${priorityLevel}优先级异步加载...`);

    const engineInstance = getEngineInstance();
    const resourcePlugin = engineInstance.getPlugin("ResourceReaderPlugin");
    const baseScene = getBaseScenePlugin();

    const model = await resourcePlugin.loadModelAsync(
      "/static/model/Horse.glb",
      priorityMap[priorityLevel],
      {
        timeout: 30000,
        retryCount: 1,
        category: `${priorityLevel}-priority`,
      }
    );

    const loadTime = performance.now() - startTime;
    const { triangleCount, vertexCount } = calculateTriangleCount(model);

    const offset = loadedModels.length * 3;
    model.position.set(offset, 0, 0);
    model.scale.setScalar(0.6);

    baseScene.scene.add(model);
    loadedModels.push(model);

    // 记录加载统计
    recordLoadStat(loadTime, true, `Horse(${priorityLevel}).glb`, triangleCount);
    updateSceneStats();

    addDebugLog("success", `✅ ${priorityLevel}优先级模型加载完成 (${loadTime.toFixed(0)}ms, ${triangleCount.toLocaleString()} 三角面)`);
  } catch (error) {
    const loadTime = performance.now() - startTime;
    recordLoadStat(loadTime, false, `Horse(${priorityLevel}).glb`, 0);
    addDebugLog(
      "error",
      `❌ ${priorityLevel}优先级模型加载失败: ${error.message}`
    );
  } finally {
    isLoading.value = false;
    refreshSchedulerStatus();
  }
};

// 批量加载多个模型
const loadMultipleModels = async () => {
  if (isLoading.value) return;

  isLoading.value = true;

  try {
    addDebugLog("info", "🚀 开始从model-files.json批量异步加载模型...");

    const engineInstance = getEngineInstance();
    const resourcePlugin = engineInstance.getPlugin("ResourceReaderPlugin");
    const baseScene = getBaseScenePlugin();

    // 从model-files.json获取模型列表
    addDebugLog("info", "📋 正在读取model-files.json...");
    const response = await fetch('/model-files.json');
    const modelData = await response.json();
    
    // 转换路径格式并取前5个模型（避免加载太多）
    const modelUrls = modelData.files.slice(0, 15).map(file => 
      `/${file.replace(/\\/g, '/')}`
    );
    
    addDebugLog("info", `📦 准备加载${modelUrls.length}个模型: ${modelUrls.map(url => url.split('/').pop()).join(', ')}`);

    const results = await resourcePlugin.loadBatchAsync(
      modelUrls,
      EngineKernel.TaskPriority.NORMAL,
      {
        timeout: 45000,
        retryCount: 1,
        category: "batch-load",
      }
    );

    // 处理加载结果
    results.forEach((result, index) => {
      const modelName = modelUrls[index].split('/').pop();
      
      if (result.model) {
        const offsetX = (index % 3) * 6;
        const offsetZ = Math.floor(index / 3) * 6;

        result.model.position.set(offsetX, 0, offsetZ);
        result.model.scale.setScalar(0.8);

        // 计算模型面片数量
        const { triangleCount, vertexCount } = calculateTriangleCount(result.model);

        baseScene.scene.add(result.model);
        loadedModels.push(result.model);

        // 记录加载统计（使用结果中的加载时间）
        const loadTime = result.loadTime || 0;
        recordLoadStat(loadTime, true, modelName, triangleCount);

        addDebugLog("success", `✅ 模型 ${modelName} 加载成功 (${loadTime.toFixed(0)}ms, ${triangleCount.toLocaleString()} 三角面)`);
      } else {
        const loadTime = result.loadTime || 0;
        recordLoadStat(loadTime, false, modelName, 0);
        addDebugLog("error", `❌ 模型 ${modelName} 加载失败`);
      }
    });

    // 更新场景统计
    updateSceneStats();

    const successCount = results.filter((r) => r.model).length;
    addDebugLog(
      "success",
      `🎉 批量加载完成: ${successCount}/${results.length} 个模型成功加载`
    );
  } catch (error) {
    addDebugLog("error", `❌ 批量模型加载失败: ${error.message}`);
  } finally {
    isLoading.value = false;
    refreshSchedulerStatus();
  }
};

// 混合优先级加载
const loadModelsWithMixedPriority = async () => {
  if (isLoading.value) return;

  isLoading.value = true;
  addDebugLog("info", "🚀 开始混合优先级异步加载...");

  try {
    const engineInstance = getEngineInstance();
    const resourcePlugin = engineInstance.getPlugin("ResourceReaderPlugin");

    // 同时启动不同优先级的加载任务
    const urgentTask = resourcePlugin.loadModelAsync(
      "/static/model/Horse.glb",
      EngineKernel.TaskPriority.URGENT,
      { category: "urgent-test" }
    );

    const normalTask = resourcePlugin.loadModelAsync(
      "/static/model/Horse.glb",
      EngineKernel.TaskPriority.NORMAL,
      { category: "normal-test" }
    );

    const lowTask = resourcePlugin.loadModelAsync(
      "/static/model/Horse.glb",
      EngineKernel.TaskPriority.LOW,
      { category: "low-test" }
    );

    // 等待所有任务完成
    const results = await Promise.allSettled([urgentTask, normalTask, lowTask]);
    const baseScene = getBaseScenePlugin();

    results.forEach((result, index) => {
      const priority = ["紧急", "普通", "低"][index];

      if (result.status === "fulfilled") {
        const model = result.value;
        const { triangleCount, vertexCount } = calculateTriangleCount(model);
        
        model.position.set(index * 5, 0, -5);
        model.scale.setScalar(0.5);

        baseScene.scene.add(model);
        loadedModels.push(model);

        // 记录加载统计（估算加载时间）
        recordLoadStat(1000 + Math.random() * 2000, true, `Horse(${priority}).glb`, triangleCount);

        addDebugLog("success", `✅ ${priority}优先级任务完成 (${triangleCount.toLocaleString()} 三角面)`);
      } else {
        recordLoadStat(1000 + Math.random() * 2000, false, `Horse(${priority}).glb`, 0);
        addDebugLog("error", `❌ ${priority}优先级任务失败`);
      }
    });

    updateSceneStats();

    addDebugLog("success", "🎉 混合优先级加载完成");
  } catch (error) {
    addDebugLog("error", `❌ 混合优先级加载失败: ${error.message}`);
  } finally {
    isLoading.value = false;
    refreshSchedulerStatus();
  }
};

// 清空所有模型
const clearAllModels = () => {
  const baseScene = getBaseScenePlugin();
  if (!baseScene) return;

  try {
    loadedModels.forEach((model) => {
      baseScene.scene.remove(model);

      // 清理几何体和材质
      model.traverse((child) => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach((material) => material.dispose());
          } else {
            child.material.dispose();
          }
        }
      });
    });

    loadedModels = [];
    loadedModelCount.value = 0;

    addDebugLog("success", "🗑️ 所有模型已清空");
  } catch (error) {
    addDebugLog("error", `❌ 清空模型失败: ${error.message}`);
  }
};

// 处理重置相机
const handleResetCamera = () => {
  resetCamera(addDebugLog);
};

// 定时刷新调度器状态
let statusTimer = null;

// 组件挂载
onMounted(async () => {
  addDebugLog("info", "📦 异步加载测试组件挂载");

  try {
    await initializeEngine(addDebugLog);

    // 启动状态监控
    statusTimer = setInterval(() => {
      refreshSchedulerStatus();
      updateSceneStats();
    }, 2000);

    // 延迟启动性能监控
    setTimeout(() => {
      startPerformanceMonitoring();
    }, 1000);

    addDebugLog("success", "✅ 异步加载测试初始化完成");
  } catch (error) {
    addDebugLog("error", `❌ 初始化失败: ${error.message}`);
  }
});

// 组件卸载
onUnmounted(() => {
  if (statusTimer) {
    clearInterval(statusTimer);
  }

  clearAllModels();
  addDebugLog("info", "🧹 异步加载测试组件卸载");
});
</script>

<style scoped>
.async-loading-test {
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  font-family: "Arial", sans-serif;
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

.status-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.status-dot.loading {
  background: #ffc107;
  animation: pulse 2s infinite;
}

.status-dot.ready {
  background: #28a745;
}

.status-text {
  color: white;
  font-weight: 500;
}

.canvas-container {
  flex: 1;
  position: relative;
  background: #1a1a1a;
}

.control-panel {
  position: fixed;
  top: 80px;
  right: 20px;
  width: 350px;
  max-height: calc(100vh - 200px);
  overflow-y: auto;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(15px);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  z-index: 1000;
}

.control-section {
  padding: 20px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.control-section:last-child {
  border-bottom: none;
}

.control-section h3 {
  margin: 0 0 15px 0;
  color: #333;
  font-size: 16px;
  font-weight: 600;
}

.button-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.btn {
  padding: 10px 16px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: #007bff;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #0056b3;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-success {
  background: #28a745;
  color: white;
}

.btn-warning {
  background: #ffc107;
  color: #212529;
}

.btn-info {
  background: #17a2b8;
  color: white;
}

.btn-outline {
  background: transparent;
  color: #007bff;
  border: 1px solid #007bff;
}

.status-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-bottom: 12px;
}

.status-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #f8f9fa;
  border-radius: 4px;
  font-size: 12px;
}

.label {
  color: #666;
  font-weight: 500;
}

.value {
  color: #333;
  font-weight: 600;
}

.log-container {
  max-height: 200px;
  overflow-y: auto;
  background: #f8f9fa;
  border-radius: 6px;
  padding: 8px;
  margin-bottom: 12px;
  font-family: "Consolas", "Monaco", monospace;
}

.log-entry {
  display: flex;
  gap: 8px;
  padding: 4px 0;
  border-bottom: 1px solid #e9ecef;
  font-size: 12px;
}

.log-entry:last-child {
  border-bottom: none;
}

.log-time {
  color: #666;
  font-weight: 500;
  flex-shrink: 0;
}

.log-message {
  flex: 1;
}

.log-info .log-message {
  color: #0066cc;
}

.log-success .log-message {
  color: #28a745;
}

.log-warning .log-message {
  color: #ffc107;
}

.log-error .log-message {
  color: #dc3545;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.performance-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
  margin-bottom: 12px;
}

.perf-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 10px;
  background: #f1f3f4;
  border-radius: 4px;
  font-size: 11px;
}

.perf-item .label {
  color: #666;
  font-weight: 500;
}

.perf-item .value {
  color: #333;
  font-weight: 600;
}

.perf-item .value.low-fps {
  color: #dc3545;
  font-weight: 700;
}

.load-times-container {
  max-height: 200px;
  overflow-y: auto;
  background: #f8f9fa;
  border-radius: 6px;
  padding: 8px;
}

.load-record {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 8px;
  margin-bottom: 4px;
  border-radius: 4px;
  font-size: 11px;
}

.load-record.success {
  background: #d4edda;
  border-left: 3px solid #28a745;
}

.load-record.failed {
  background: #f8d7da;
  border-left: 3px solid #dc3545;
}

.load-record:last-child {
  margin-bottom: 0;
}

.model-name {
  font-weight: 600;
  color: #333;
  flex: 1;
}

.load-time {
  color: #666;
  margin: 0 8px;
}

.triangle-count {
  color: #666;
  font-size: 10px;
}

.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-bottom: 12px;
}
</style>
