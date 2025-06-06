<template>
  <div class="text-marker-test-container">
    <div class="canvas-container" id="text-marker-canvas"></div>
    
    <!-- 控制面板 -->
    <div class="control-panel">
      <div class="panel-header">
        <h2>📝 图文标注测试</h2>
        <div class="status-info">
          <span :class="['status-badge', engineReady ? 'ready' : 'loading']">
            {{ engineReady ? '✅ 引擎就绪' : '⏳ 加载中...' }}
          </span>
          <span class="marker-count">标注数量: {{ markerCount }}</span>
        </div>
      </div>

      <!-- 快速测试区域 -->
      <div class="panel-section">
        <h3>🚀 快速测试</h3>
        <div class="quick-actions">
          <button @click="addBasicMarker" :disabled="!engineReady" class="btn-primary">
            添加基础标注
          </button>
          <button @click="addImageMarker" :disabled="!engineReady" class="btn-primary">
            添加图片标注
          </button>
          <button @click="addStyledMarker" :disabled="!engineReady" class="btn-primary">
            添加样式标注
          </button>
          <button @click="clearAllMarkers" :disabled="!engineReady || markerCount === 0" class="btn-danger">
            清空所有标注
          </button>
        </div>
      </div>

      <!-- 标注样式配置 -->
      <div class="panel-section">
        <h3>🎨 样式配置</h3>
        <div class="style-config">
          <div class="config-row">
            <label>文本内容:</label>
            <input v-model="markerConfig.text" type="text" placeholder="输入标注文本">
          </div>
          <div class="config-row">
            <label>字体大小:</label>
            <input v-model.number="markerConfig.fontSize" type="range" min="12" max="48" step="2">
            <span>{{ markerConfig.fontSize }}px</span>
          </div>
          <div class="config-row">
            <label>文字颜色:</label>
            <input v-model="markerConfig.textColor" type="color">
          </div>
          <div class="config-row">
            <label>背景颜色:</label>
            <input v-model="markerConfig.backgroundColor" type="color">
          </div>
          <div class="config-row">
            <label>透明度:</label>
            <input v-model.number="markerConfig.opacity" type="range" min="0" max="1" step="0.1">
            <span>{{ markerConfig.opacity }}</span>
          </div>
        </div>
        <button @click="addCustomMarker" :disabled="!engineReady" class="btn-secondary">
          添加自定义标注
        </button>
      </div>

      <!-- 位置控制 -->
      <div class="panel-section">
        <h3>📍 位置控制</h3>
        <div class="position-config">
          <div class="config-row">
            <label>X轴:</label>
            <input v-model.number="markerPosition.x" type="range" min="-10" max="10" step="0.5">
            <span>{{ markerPosition.x }}</span>
          </div>
          <div class="config-row">
            <label>Y轴:</label>
            <input v-model.number="markerPosition.y" type="range" min="-5" max="10" step="0.5">
            <span>{{ markerPosition.y }}</span>
          </div>
          <div class="config-row">
            <label>Z轴:</label>
            <input v-model.number="markerPosition.z" type="range" min="-10" max="10" step="0.5">
            <span>{{ markerPosition.z }}</span>
          </div>
        </div>
        <div class="position-actions">
          <button @click="resetPosition" class="btn-secondary">重置位置</button>
          <button @click="randomPosition" class="btn-secondary">随机位置</button>
        </div>
      </div>

      <!-- 标注列表 -->
      <div class="panel-section" v-if="markerList.length > 0">
        <h3>📋 标注列表</h3>
        <div class="marker-list">
          <div 
            v-for="marker in markerList" 
            :key="marker.id"
            class="marker-item"
            @click="focusMarker(marker.id)"
          >
            <div class="marker-info">
              <span class="marker-name">{{ marker.name }}</span>
              <span class="marker-text">{{ marker.text }}</span>
            </div>
            <div class="marker-actions">
              <button @click.stop="toggleMarkerVisibility(marker.id)" class="btn-small">
                {{ marker.visible ? '👁️' : '🚫' }}
              </button>
              <button @click.stop="removeMarker(marker.id)" class="btn-small btn-danger">
                🗑️
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 测试日志 -->
      <div class="panel-section">
        <h3>📊 测试日志</h3>
        <div class="test-logs">
          <div v-for="log in testLogs" :key="log.id" :class="['log-item', log.type]">
            <span class="log-time">{{ log.time }}</span>
            <span class="log-message">{{ log.message }}</span>
          </div>
        </div>
        <button @click="clearLogs" class="btn-secondary btn-small">清空日志</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue'
import { useTextMarker } from '@/composables/useTextMarker'
import { useDebug } from '@/composables/useDebug'

// 使用图文标注功能模块
const {
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
  addBasicMarker: createBasicMarker,
  addImageMarker: createImageMarker,
  addStyledMarker: createStyledMarker,
  addCustomMarker: createCustomMarker,
  clearAllMarkers: clearMarkers,
  
  // 位置控制方法
  resetPosition,
  randomPosition,
  
  // 标注管理方法
  focusMarker: focusOnMarker,
  toggleMarkerVisibility: toggleVisibility,
  removeMarker: deleteMarker,
  
  // 工具方法
  getMarkerStats,
  dispose
} = useTextMarker()

// 使用调试功能模块
const {
  debugLogs: testLogs,
  addDebugLog,
  clearDebugLogs
} = useDebug()

/**
 * 简化的日志记录函数
 */
const addLog = (message, type = 'info') => {
  addDebugLog(type, message)
}

/**
 * 清空日志
 */
const clearLogs = () => {
  clearDebugLogs()
}

/**
 * 初始化引擎
 */
const initializeEngine = async () => {
  try {
    await initializeTextMarkerEngine('text-marker-canvas', addLog)
    createReferenceObjects(addLog)
  } catch (error) {
    console.error('引擎初始化失败:', error)
  }
}

/**
 * 标注操作包装函数 - 统一处理日志记录
 */
const addBasicMarker = () => createBasicMarker(addLog)
const addImageMarker = () => createImageMarker(addLog)
const addStyledMarker = () => createStyledMarker(addLog)
const addCustomMarker = () => createCustomMarker(addLog)
const clearAllMarkers = () => clearMarkers(addLog)

/**
 * 标注管理包装函数 - 统一处理日志记录
 */
const focusMarker = (markerId) => focusOnMarker(markerId, addLog)
const toggleMarkerVisibility = (markerId) => toggleVisibility(markerId, addLog)
const removeMarker = (markerId) => deleteMarker(markerId, addLog)

// 生命周期管理
onMounted(() => {
  initializeEngine()
})

onUnmounted(() => {
  dispose()
})
</script>

<style scoped>
.text-marker-test-container {
  position: relative;
  height: 100vh;
  background: #f5f5f5;
}

.canvas-container {
  position: absolute;
  top: 0;
  left: 0;
  height: 100vh;
  width: calc(100vw - 350px); /* 为控制面板留出空间 */
  background: #000;
  z-index: 0;
  /* 确保canvas可以响应鼠标事件 */
  pointer-events: auto;
}

.control-panel {
  position: absolute;
  top: 0;
  right: 0;
  width: 350px;
  height: 100vh;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-left: 1px solid #ddd;
  overflow-y: auto;
  padding: 16px;
  box-sizing: border-box;
  z-index: 10;
  /* 确保控制面板始终可以响应鼠标事件 */
  pointer-events: auto;
  /* 添加阴影以增强层次感 */
  box-shadow: -2px 0 10px rgba(0, 0, 0, 0.1);
}

.panel-header {
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 2px solid #007bff;
}

.panel-header h2 {
  margin: 0 0 8px 0;
  color: #333;
  font-size: 20px;
}

.status-info {
  display: flex;
  gap: 12px;
  align-items: center;
}

.status-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
}

.status-badge.ready {
  background: #d4edda;
  color: #155724;
}

.status-badge.loading {
  background: #fff3cd;
  color: #856404;
}

.marker-count {
  font-size: 12px;
  color: #666;
}

.panel-section {
  margin-bottom: 20px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

.panel-section h3 {
  margin: 0 0 12px 0;
  font-size: 16px;
  color: #495057;
}

.quick-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.style-config, .position-config {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 12px;
}

.config-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.config-row label {
  min-width: 80px;
  font-size: 14px;
  font-weight: 500;
}

.config-row input[type="text"] {
  flex: 1;
  padding: 4px 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  pointer-events: auto;
  position: relative;
  z-index: 1;
}

.config-row input[type="range"] {
  flex: 1;
  pointer-events: auto;
  position: relative;
  z-index: 1;
}

.config-row input[type="color"] {
  width: 40px;
  height: 32px;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  pointer-events: auto;
  position: relative;
  z-index: 1;
}

.config-row span {
  min-width: 40px;
  font-size: 12px;
  color: #666;
}

.position-actions {
  display: flex;
  gap: 8px;
}

.marker-list {
  max-height: 200px;
  overflow-y: auto;
}

.marker-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px;
  background: #fff;
  border: 1px solid #eee;
  border-radius: 4px;
  margin-bottom: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.marker-item:hover {
  background: #f0f8ff;
}

.marker-info {
  flex: 1;
}

.marker-name {
  display: block;
  font-weight: bold;
  font-size: 12px;
  color: #007bff;
}

.marker-text {
  display: block;
  font-size: 11px;
  color: #666;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.marker-actions {
  display: flex;
  gap: 4px;
}

.test-logs {
  max-height: 200px;
  overflow-y: auto;
  background: #fff;
  border: 1px solid #eee;
  border-radius: 4px;
  padding: 8px;
  margin-bottom: 8px;
}

.log-item {
  display: flex;
  gap: 8px;
  padding: 4px 0;
  border-bottom: 1px solid #f0f0f0;
  font-size: 12px;
}

.log-item:last-child {
  border-bottom: none;
}

.log-item.success {
  color: #28a745;
}

.log-item.error {
  color: #dc3545;
}

.log-item.info {
  color: #17a2b8;
}

.log-time {
  min-width: 60px;
  color: #999;
}

.log-message {
  flex: 1;
}

/* 按钮样式 */
button {
  padding: 8px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
  /* 确保按钮始终可以交互 */
  pointer-events: auto;
  position: relative;
  z-index: 1;
}

button:disabled {
  opacity: 0.5;
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

.btn-secondary:hover:not(:disabled) {
  background: #545b62;
}

.btn-danger {
  background: #dc3545;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: #c82333;
}

.btn-small {
  padding: 4px 8px;
  font-size: 12px;
  min-width: auto;
}
</style> 