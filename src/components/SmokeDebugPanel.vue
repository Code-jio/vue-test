<template>
    <div class="smoke-debug-panel" v-if="visible">
        <div class="panel-header">
            <h3>🌫️ 烟雾调试面板</h3>
            <button @click="togglePanel" class="close-btn">×</button>
        </div>
        
        <div class="panel-content">
            <div class="control-group">
                <label>主烟雾发射率: {{ mainEmissionRate }}</label>
                <input type="range" v-model="mainEmissionRate" min="0" max="100" step="1">
            </div>
            
            <div class="control-group">
                <label>左侧烟雾发射率: {{ leftEmissionRate }}</label>
                <input type="range" v-model="leftEmissionRate" min="0" max="80" step="1">
            </div>
            
            <div class="control-group">
                <label>右侧烟雾发射率: {{ rightEmissionRate }}</label>
                <input type="range" v-model="rightEmissionRate" min="0" max="60" step="1">
            </div>
            
            <div class="control-group">
                <label>风力X: {{ windX.toFixed(1) }}</label>
                <input type="range" v-model="windX" min="-2" max="2" step="0.1">
            </div>
            
            <div class="control-group">
                <label>风力Y: {{ windY.toFixed(1) }}</label>
                <input type="range" v-model="windY" min="0" max="3" step="0.1">
            </div>
            
            <div class="control-group">
                <label>湍流强度: {{ turbulence.toFixed(1) }}</label>
                <input type="range" v-model="turbulence" min="0" max="1" step="0.1">
            </div>
            
            <div class="control-group">
                <label>粒子大小: {{ particleSize.toFixed(1) }}</label>
                <input type="range" v-model="particleSize" min="1" max="8" step="0.5">
            </div>
            
            <div class="control-group">
                <label>透明度: {{ globalOpacity.toFixed(1) }}</label>
                <input type="range" v-model="globalOpacity" min="0.1" max="1" step="0.1">
            </div>
            
            <div class="action-buttons">
                <button @click="runTest" class="test-btn">🧪 运行测试</button>
                <button @click="resetDefaults" class="reset-btn">🔄 重置</button>
                <button @click="toggleMarkers" class="marker-btn">📍 标记</button>
            </div>
            
            <div class="debug-info">
                <p>烟雾源数量: {{ smokeCount }}</p>
                <p>FPS: {{ fps }}</p>
            </div>
        </div>
    </div>
    
    <button v-else @click="togglePanel" class="toggle-btn">
        🌫️ 调试
    </button>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'

// 状态
const visible = ref(true)
const fps = ref(60)

// 烟雾控制参数
const mainEmissionRate = ref(30)
const leftEmissionRate = ref(20)
const rightEmissionRate = ref(15)
const windX = ref(0.3)
const windY = ref(1.5)
const windZ = ref(0.1)
const turbulence = ref(0.4)
const particleSize = ref(3.5)
const globalOpacity = ref(0.8)

// 计算属性
const smokeCount = computed(() => {
    return window.smokeEffects ? window.smokeEffects.length : 0
})

// 方法
const updateControls = () => {
    if (!window.smokeControls) return
    
    Object.assign(window.smokeControls, {
        mainEmissionRate: parseInt(mainEmissionRate.value),
        leftEmissionRate: parseInt(leftEmissionRate.value),
        rightEmissionRate: parseInt(rightEmissionRate.value),
        windX: parseFloat(windX.value),
        windY: parseFloat(windY.value),
        windZ: parseFloat(windZ.value),
        turbulence: parseFloat(turbulence.value),
        particleSize: parseFloat(particleSize.value),
        globalOpacity: parseFloat(globalOpacity.value)
    })
}

const togglePanel = () => {
    visible.value = !visible.value
}

const runTest = () => {
    if (window.testSmoke) {
        window.testSmoke()
    } else {
        console.warn('测试函数未定义')
    }
}

const resetDefaults = () => {
    mainEmissionRate.value = 30
    leftEmissionRate.value = 20
    rightEmissionRate.value = 15
    windX.value = 0.3
    windY.value = 1.5
    turbulence.value = 0.4
    particleSize.value = 3.5
    globalOpacity.value = 0.8
    updateControls()
}

const toggleMarkers = () => {
    if (window.debugMarkers) {
        window.debugMarkers.forEach(marker => {
            marker.visible = !marker.visible
        })
    }
}

// 生命周期
onMounted(() => {
    // 监听参数变化
    [
        mainEmissionRate, leftEmissionRate, rightEmissionRate,
        windX, windY, windZ, turbulence, particleSize, globalOpacity
    ].forEach(ref => {
        watch(ref, updateControls)
    })
    
    // 初始化控制器
    setTimeout(() => {
        if (window.smokeControls) {
            const controls = window.smokeControls
            mainEmissionRate.value = controls.mainEmissionRate || 30
            leftEmissionRate.value = controls.leftEmissionRate || 20
            rightEmissionRate.value = controls.rightEmissionRate || 15
            windX.value = controls.windX || 0.3
            windY.value = controls.windY || 1.5
            windZ.value = controls.windZ || 0.1
            turbulence.value = controls.turbulence || 0.4
            particleSize.value = controls.particleSize || 3.5
            globalOpacity.value = controls.globalOpacity || 0.8
        }
    }, 1000)
    
    // 简单的FPS计算
    let lastTime = performance.now()
    let frameCount = 0
    
    const calculateFPS = () => {
        frameCount++
        const now = performance.now()
        if (now - lastTime >= 1000) {
            fps.value = Math.round((frameCount * 1000) / (now - lastTime))
            frameCount = 0
            lastTime = now
        }
        requestAnimationFrame(calculateFPS)
    }
    
    calculateFPS()
})
</script>

<style scoped>
.smoke-debug-panel {
    position: fixed;
    top: 20px;
    right: 20px;
    width: 280px;
    background: rgba(0, 0, 0, 0.8);
    border: 1px solid #333;
    border-radius: 8px;
    color: white;
    font-family: Arial, sans-serif;
    z-index: 10000;
}

.panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 15px;
    border-bottom: 1px solid #333;
    background: rgba(255, 255, 255, 0.1);
}

.panel-header h3 {
    margin: 0;
    font-size: 14px;
    font-weight: bold;
}

.close-btn {
    background: none;
    border: none;
    color: white;
    font-size: 18px;
    cursor: pointer;
    padding: 0;
    width: 20px;
    height: 20px;
}

.panel-content {
    padding: 15px;
}

.control-group {
    margin-bottom: 12px;
}

.control-group label {
    display: block;
    margin-bottom: 4px;
    font-size: 12px;
    color: #ccc;
}

.control-group input[type="range"] {
    width: 100%;
    height: 4px;
    background: #333;
    outline: none;
    border-radius: 2px;
}

.action-buttons {
    display: flex;
    gap: 5px;
    margin: 15px 0;
}

.action-buttons button {
    flex: 1;
    padding: 6px 8px;
    font-size: 11px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    color: white;
}

.test-btn {
    background: #007bff;
}

.reset-btn {
    background: #6c757d;
}

.marker-btn {
    background: #28a745;
}

.debug-info {
    font-size: 11px;
    color: #aaa;
    margin-top: 10px;
    padding-top: 10px;
    border-top: 1px solid #333;
}

.toggle-btn {
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 8px 12px;
    background: rgba(0, 0, 0, 0.8);
    color: white;
    border: 1px solid #333;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
    z-index: 10000;
}

.toggle-btn:hover {
    background: rgba(50, 50, 50, 0.8);
}
</style>