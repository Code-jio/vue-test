<template>
  <div class="tag-controls" id="vue-controls-1">
    <h4>🎮 控制面板</h4>
    <div class="control-row">
      <button @click="updateTime" class="control-btn">更新时间</button>
      <span class="current-time">{{ currentTime }}</span>
    </div>
    <div class="control-row">
      <label>颜色主题:</label>
      <select v-model="selectedTheme" @change="applyTheme">
        <option value="blue">蓝色主题</option>
        <option value="green">绿色主题</option>
        <option value="purple">紫色主题</option>
      </select>
    </div>
    <div class="control-row">
      <button @click="animateElements" class="control-btn">动画效果</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const currentTime = ref('')
const selectedTheme = ref('blue')

const updateTime = () => {
  currentTime.value = new Date().toLocaleTimeString()
  console.log('⏰ 时间已更新:', currentTime.value)
}

const applyTheme = () => {
  console.log('🎨 主题切换为:', selectedTheme.value)
  // 这里可以添加主题切换逻辑
}

const animateElements = () => {
  console.log('✨ 动画效果触发')
  // 这里可以添加动画逻辑
}

// 组件挂载时初始化
onMounted(() => {
  updateTime()
  console.log('🎮 控制面板组件已加载')
})

// 暴露方法供外部调用
defineExpose({
  updateTime,
  applyTheme,
  animateElements
})
</script>

<style scoped>
/* 控制面板样式 */
.tag-controls {
  background: #e3f2fd;
  border: 1px solid #2196f3;
  border-radius: 8px;
  padding: 16px;
  max-width: 300px;
}

.tag-controls h4 {
  margin: 0 0 16px 0;
  color: #1565c0;
}

.control-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.control-row:last-child {
  margin-bottom: 0;
}

.control-btn {
  background: #2196f3;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: background 0.3s;
}

.control-btn:hover {
  background: #1976d2;
}

.current-time {
  font-family: monospace;
  font-weight: bold;
  color: #2196f3;
  background: rgba(33, 150, 243, 0.1);
  padding: 4px 8px;
  border-radius: 4px;
}

.control-row label {
  font-size: 12px;
  color: #1565c0;
  font-weight: 500;
}

.control-row select {
  padding: 4px 8px;
  border: 1px solid #2196f3;
  border-radius: 4px;
  font-size: 12px;
  background: white;
  color: #1565c0;
}

.control-row select:focus {
  outline: none;
  border-color: #1976d2;
  box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.2);
}
</style> 