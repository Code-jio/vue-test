<template>
  <div class="tag-chart" id="vue-chart-1">
    <h4>📊 数据图表</h4>
    <div class="chart-container">
      <div class="bar-chart">
        <div 
          v-for="(item, index) in chartData" 
          :key="index"
          class="bar"
          :style="{ height: item.value + '%', backgroundColor: item.color }"
        >
          <span class="bar-label">{{ item.label }}</span>
          <span class="bar-value">{{ item.value }}%</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const chartData = ref([
  { label: 'JS', value: 85, color: '#f7df1e' },
  { label: 'Vue', value: 92, color: '#4fc08d' },
  { label: 'CSS', value: 78, color: '#1572b6' },
  { label: 'HTML', value: 88, color: '#e34f26' }
])

// 暴露方法供外部调用
const updateChartData = () => {
  chartData.value.forEach(item => {
    item.value = Math.floor(Math.random() * 100)
  })
  console.log('📊 图表数据已更新')
}

// 导出方法
defineExpose({
  updateChartData
})
</script>

<style scoped>
/* 图表样式 */
.tag-chart {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 16px;
  max-width: 300px;
}

.tag-chart h4 {
  margin: 0 0 16px 0;
  color: #333;
}

.chart-container {
  width: 100%;
}

.bar-chart {
  display: flex;
  align-items: end;
  gap: 8px;
  height: 120px;
  padding: 8px;
}

.bar {
  flex: 1;
  position: relative;
  border-radius: 4px 4px 0 0;
  transition: all 0.5s ease;
  min-height: 20px;
  display: flex;
  flex-direction: column;
  justify-content: end;
  align-items: center;
}

.bar-label {
  position: absolute;
  bottom: -20px;
  font-size: 12px;
  font-weight: bold;
  color: #666;
}

.bar-value {
  color: white;
  font-size: 10px;
  font-weight: bold;
  margin: 4px;
  text-shadow: 1px 1px 1px rgba(0,0,0,0.5);
}
</style> 