<template>
  <div class="model-info-card">
    <div class="card-header">
      <h3 class="card-title">{{ modelInfo.name || '未命名模型' }}</h3>
      <button class="close-btn" @click="$emit('close')">✕</button>
    </div>
    
    <div class="card-content">
      <div class="info-section">
        <div class="info-item">
          <span class="label">类型:</span>
          <span class="value">{{ modelInfo.type || 'Unknown' }}</span>
        </div>
        
        <div class="info-item">
          <span class="label">位置:</span>
          <span class="value">
            X: {{ formatNumber(modelInfo.position?.x) }} 
            Y: {{ formatNumber(modelInfo.position?.y) }} 
            Z: {{ formatNumber(modelInfo.position?.z) }}
          </span>
        </div>
        
        <div class="info-item">
          <span class="label">UUID:</span>
          <span class="value uuid">{{ modelInfo.uuid?.substring(0, 8) }}...</span>
        </div>
        
        <div class="info-item" v-if="modelInfo.material">
          <span class="label">材质:</span>
          <span class="value">{{ modelInfo.material }}</span>
        </div>
        
        <div class="info-item" v-if="modelInfo.geometry">
          <span class="label">几何体:</span>
          <span class="value">{{ modelInfo.geometry }}</span>
        </div>
        
        <div class="info-item" v-if="modelInfo.triangles">
          <span class="label">三角面:</span>
          <span class="value">{{ modelInfo.triangles }} 个</span>
        </div>
        
        <div class="info-item" v-if="modelInfo.vertices">
          <span class="label">顶点数:</span>
          <span class="value">{{ modelInfo.vertices }} 个</span>
        </div>
      </div>
      
      <div class="action-section">
        <button class="action-btn focus-btn" @click="$emit('focus')">
          📍 聚焦到此模型
        </button>
        <button class="action-btn highlight-btn" @click="$emit('highlight')">
          ✨ 高亮显示
        </button>
      </div>
    </div>
    
    <div class="card-footer">
      <small class="timestamp">
        点击时间: {{ new Date().toLocaleTimeString() }}
      </small>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

// 定义props
const props = defineProps({
  modelInfo: {
    type: Object,
    required: true,
    default: () => ({})
  }
})

// 定义事件
const emit = defineEmits(['close', 'focus', 'highlight'])

// 格式化数字显示
const formatNumber = (num) => {
  if (typeof num !== 'number') return '0.00'
  return num.toFixed(2)
}
</script>

<style scoped>
.model-info-card {
  width: 320px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(248, 249, 250, 0.9));
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  overflow: hidden;
  transition: all 0.3s ease;
}

.model-info-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.25);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.card-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  max-width: 240px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.close-btn {
  background: none;
  border: none;
  color: white;
  font-size: 20px;
  cursor: pointer;
  padding: 4px;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: rotate(90deg);
}

.card-content {
  padding: 20px;
}

.info-section {
  margin-bottom: 16px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
  padding: 8px 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.info-item:last-child {
  border-bottom: none;
  margin-bottom: 0;
}

.label {
  font-weight: 600;
  color: #495057;
  min-width: 60px;
  font-size: 14px;
}

.value {
  color: #212529;
  font-size: 14px;
  text-align: right;
  flex: 1;
  margin-left: 12px;
  word-break: break-word;
}

.uuid {
  font-family: 'Courier New', monospace;
  font-size: 12px;
  color: #6c757d;
}

.action-section {
  display: flex;
  gap: 8px;
  margin-top: 16px;
}

.action-btn {
  flex: 1;
  padding: 10px 16px;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: center;
}

.focus-btn {
  background: linear-gradient(135deg, #28a745, #20c997);
  color: white;
}

.focus-btn:hover {
  background: linear-gradient(135deg, #218838, #1da896);
  transform: translateY(-1px);
}

.highlight-btn {
  background: linear-gradient(135deg, #ffc107, #fd7e14);
  color: #212529;
}

.highlight-btn:hover {
  background: linear-gradient(135deg, #e0a800, #e8590c);
  transform: translateY(-1px);
}

.card-footer {
  padding: 12px 20px;
  background: rgba(248, 249, 250, 0.8);
  border-top: 1px solid rgba(0, 0, 0, 0.05);
}

.timestamp {
  color: #6c757d;
  font-size: 12px;
  font-style: italic;
}

.model-info-card {
  animation: slideIn 0.3s ease-out;
}

/* 响应式设计 */
@media (max-width: 480px) {
  .model-info-card {
    width: 280px;
  }
  
  .card-title {
    font-size: 16px;
    max-width: 200px;
  }
  
  .action-section {
    flex-direction: column;
  }
  
  .action-btn {
    margin-bottom: 8px;
  }
}
</style>
