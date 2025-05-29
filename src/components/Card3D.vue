<template>
  <div class="tag-card" id="vue-card-1">
    <div class="card-header">🚀 Vue 3D卡片</div>
    <div class="card-body">
      <p>这是一个Vue组件转换的3D卡片</p>
      <div class="card-stats">
        <span class="stat">{{ cardStats.views }} 浏览</span>
        <span class="stat">{{ cardStats.likes }} 点赞</span>
      </div>
      <button class="card-button" @click="handleCardClick">点击互动</button>
    </div>
  </div>
</template>

<script setup>
import { reactive } from 'vue'

// 响应式数据
const cardStats = reactive({
  views: 1234,
  likes: 89
})

// 事件处理函数
const handleCardClick = () => {
  cardStats.views++
  cardStats.likes++
  console.log('🎯 卡片被点击了！', cardStats)
}
</script>

<style scoped>
/* 卡片样式 */
.tag-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 8px;
  color: white;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  max-width: 300px;
  z-index: 1000;
}

.card-header {
  background: rgba(0, 0, 0, 0.2);
  padding: 12px 16px;
  font-weight: bold;
  font-size: 16px;
}

.card-body {
  padding: 16px;
}

.card-stats {
  display: flex;
  gap: 12px;
  margin: 12px 0;
}

.stat {
  background: rgba(255, 255, 255, 0.2);
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.card-button {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
}

.card-button:hover {
  background: rgba(255, 255, 255, 0.3);
}
</style> 