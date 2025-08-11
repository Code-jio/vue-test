<template>
    <div class="particle-test-container">
        <div id="particle-canvas" class="particle-canvas"></div>
        
        <!-- 控制面板 -->
        <div class="control-panel">
            <h3>粒子发射器测试</h3>
            
            <div class="control-group">
                <label>粒子类型:</label>
                <select v-model="selectedParticleType" @change="updateParticleType">
                    <option value="fire">火焰</option>
                    <option value="smoke">烟雾</option>
                    <option value="spark">火花</option>
                    <option value="magic">魔法</option>
                    <option value="water">水滴</option>
                    <option value="dust">尘埃</option>
                </select>
            </div>
            
            <div class="control-group">
                <label>发射速率: {{ emissionRate }}</label>
                <input type="range" v-model.number="emissionRate" min="10" max="500" @input="updateConfig">
            </div>
            
            <div class="control-group">
                <label>粒子数量: {{ maxParticles }}</label>
                <input type="range" v-model.number="maxParticles" min="100" max="2000" @input="updateConfig">
            </div>
            
            <div class="control-group">
                <label>生命周期: {{ particleLifetime }}秒</label>
                <input type="range" v-model.number="particleLifetime" min="1" max="10" step="0.5" @input="updateConfig">
            </div>
            
            <div class="control-group">
                <label>起始大小: {{ startSize }}</label>
                <input type="range" v-model.number="startSize" min="0.1" max="5" step="0.1" @input="updateConfig">
            </div>
            
            <div class="control-group">
                <label>结束大小: {{ endSize }}</label>
                <input type="range" v-model.number="endSize" min="0.1" max="5" step="0.1" @input="updateConfig">
            </div>
            
            <div class="control-group">
                <label>透明度: {{ opacity }}</label>
                <input type="range" v-model.number="opacity" min="0.1" max="1" step="0.1" @input="updateConfig">
            </div>
            
            <div class="control-group">
                <label>发射位置:</label>
                <div class="position-inputs">
                    <input type="number" v-model.number="positionX" placeholder="X" @input="updatePosition">
                    <input type="number" v-model.number="positionY" placeholder="Y" @input="updatePosition">
                    <input type="number" v-model.number="positionZ" placeholder="Z" @input="updatePosition">
                </div>
            </div>
            
            <div class="control-group">
                <label>发射形状:</label>
                <select v-model="emissionShape" @change="updateConfig">
                    <option value="point">点</option>
                    <option value="sphere">球体</option>
                    <option value="box">立方体</option>
                    <option value="cone">圆锥</option>
                </select>
            </div>
            
            <div class="control-group">
                <label>发射半径: {{ emissionRadius }}</label>
                <input type="range" v-model.number="emissionRadius" min="0.5" max="10" step="0.5" @input="updateConfig">
            </div>
            
            <div class="button-group">
                <button @click="toggleEmitter" class="btn primary">
                    {{ isEmitting ? '停止发射' : '开始发射' }}
                </button>
                <button @click="resetEmitter" class="btn secondary">重置</button>
                <button @click="toggleDebug" class="btn info">
                    {{ debugMode ? '关闭调试' : '开启调试' }}
                </button>
            </div>
            
            <div class="stats">
                <p>活跃粒子: {{ activeParticles }}</p>
                <p>FPS: {{ fps }}</p>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

// 控制变量
const selectedParticleType = ref('fire') // 选择的粒子类型
const emissionRate = ref(200) // 发射速率
const maxParticles = ref(1000) // 最大粒子数量
const particleLifetime = ref(4) // 粒子生命周期
const startSize = ref(2) // 起始大小
const endSize = ref(0.5) // 结束大小
const opacity = ref(1) // 透明度
const positionX = ref(0)
const positionY = ref(2)
const positionZ = ref(0)
const emissionShape = ref('cone') // 发射形状
const emissionRadius = ref(2) // 发射半径
const isEmitting = ref(true)
const debugMode = ref(true)

// 状态变量
const activeParticles = ref(0)
const fps = ref(0)

// 引擎实例
let engine = null
let baseScene = null
let particleEmitter = null
let renderLoop = null

// 初始化引擎
const initializeEngine = async () => {
    try {
        // 创建引擎核心
        engine = new EngineKernel.BaseCore({
            pluginsParams: [
                {
                    name: "baseScenePlugin",
                    path: "/plugins/scene",
                    pluginClass: EngineKernel.BaseScene,
                    userData: {
                        debugConfig: {
                            enabled: true,
                            gridHelper: true,
                            axesHelper: true,
                        }
                    }
                }
            ]
        })

        baseScene = engine.getPlugin("baseScenePlugin")
        
        // 注册渲染循环
        await engine.register({
            name: "RenderLoopPlugin",
            path: "/plugins/webgl/renderLoop",
            pluginClass: EngineKernel.RenderLoop,
            userData: {
                scene: baseScene.scene,
            },
        })

        // 获取渲染循环实例
        renderLoop = engine.getPlugin("RenderLoopPlugin")
        if (renderLoop && renderLoop.initialize) {
            renderLoop.initialize()
        }

        // 创建粒子发射器
        createParticleEmitter()
        
        // 设置相机位置
        baseScene.camera.position.set(15, 8, 15)
        baseScene.camera.lookAt(0, 2, 0)
        
        console.log('✅ 粒子测试引擎初始化完成')
    } catch (error) {
        console.error('❌ 引擎初始化失败:', error)
    }
}

// 创建粒子发射器
const createParticleEmitter = () => {
    try {
        const config = {
            position: [positionX.value, positionY.value, positionZ.value],
            maxParticles: maxParticles.value,
            emissionRate: emissionRate.value,
            particleLifetime: particleLifetime.value,
            particleType: selectedParticleType.value,
            startColor: getParticleColor(selectedParticleType.value, 'start'),
            endColor: getParticleColor(selectedParticleType.value, 'end'),
            startSize: startSize.value,
            endSize: endSize.value,
            opacity: opacity.value,
            velocity: new EngineKernel.THREE.Vector3(0, 5, 0),
            acceleration: new EngineKernel.THREE.Vector3(0, -2, 0),
            emissionShape: emissionShape.value,
            emissionRadius: emissionRadius.value,
            debugMode: debugMode.value,
            billboardMode: true,
            depthWrite: false,
            blendMode: EngineKernel.THREE.AdditiveBlending
        }

        particleEmitter = new EngineKernel.ParticleEmitter({
            userData: {
                scene: baseScene.scene,
                camera: baseScene.camera,
                renderer: baseScene.renderer,
                config: config
            }
        })

        particleEmitter.init()
        
        // 启动粒子发射
        if (particleEmitter.startEmission) {
            particleEmitter.startEmission()
        }
        
        // 添加到渲染循环
        if (renderLoop && particleEmitter && particleEmitter.update) {
            const particleTaskId = `particle-update-${Date.now()}`
            renderLoop.addTask(particleTaskId, () => {
                if (particleEmitter && particleEmitter.particleSystem) {
                    particleEmitter.update()
                    activeParticles.value = particleEmitter.getActiveParticleCount ? 
                        particleEmitter.getActiveParticleCount() : 
                        particleEmitter.activeParticleCount || 0
                }
            }, 0)
            particleEmitter.renderTaskId = particleTaskId
        }

        console.log('✅ 粒子发射器创建成功并启动发射')
    } catch (error) {
        console.error('❌ 粒子发射器创建失败:', error)
    }
}

// 获取粒子颜色
const getParticleColor = (type, colorType) => {
    const colors = {
        fire: { start: 0xff4400, end: 0x440000 },
        smoke: { start: 0x888888, end: 0x222222 },
        spark: { start: 0xffff00, end: 0xff4400 },
        magic: { start: 0x00ffff, end: 0x0088ff },
        water: { start: 0x4488ff, end: 0x004488 },
        dust: { start: 0xaaaaaa, end: 0x666666 }
    }
    return colors[type]?.[colorType] || colors.fire[colorType]
}

// 更新粒子类型
const updateParticleType = () => {
    if (particleEmitter) {
        particleEmitter.destroy()
        createParticleEmitter()
    }
}

// 更新配置
const updateConfig = () => {
    if (particleEmitter) {
        particleEmitter.config = {
            ...particleEmitter.config,
            maxParticles: maxParticles.value,
            emissionRate: emissionRate.value,
            particleLifetime: particleLifetime.value,
            startSize: startSize.value,
            endSize: endSize.value,
            opacity: opacity.value,
            emissionShape: emissionShape.value,
            emissionRadius: emissionRadius.value
        }
    }
}

// 更新位置
const updatePosition = () => {
    if (particleEmitter && particleEmitter.particleSystem) {
        particleEmitter.particleSystem.position.set(
            positionX.value,
            positionY.value,
            positionZ.value
        )
    }
}

// 切换发射器
const toggleEmitter = () => {
    isEmitting.value = !isEmitting.value
    if (particleEmitter) {
        particleEmitter.isEmitting = isEmitting.value
    }
}

// 重置发射器
const resetEmitter = () => {
    if (particleEmitter) {
        particleEmitter.destroy()
        createParticleEmitter()
    }
}

// 切换调试模式
const toggleDebug = () => {
    debugMode.value = !debugMode.value
    if (particleEmitter) {
        particleEmitter.config.debugMode = debugMode.value
    }
}

// FPS计算
let lastTime = performance.now()
let frameCount = 0

const calculateFPS = () => {
    frameCount++
    const currentTime = performance.now()
    if (currentTime - lastTime >= 1000) {
        fps.value = Math.round((frameCount * 1000) / (currentTime - lastTime))
        frameCount = 0
        lastTime = currentTime
    }
    requestAnimationFrame(calculateFPS)
}

// 生命周期钩子
onMounted(() => {
    initializeEngine()
    calculateFPS()
})

onUnmounted(() => {
    if (particleEmitter) {
        particleEmitter.destroy()
    }
    if (renderLoop) {
        renderLoop.stop()
    }
})
</script>

<style scoped>
.particle-test-container {
    position: relative;
    width: 100vw;
    height: 100vh;
    overflow: hidden;
}

.particle-canvas {
    width: 100%;
    height: 100%;
    z-index: 1;
}

.control-panel {
    position: absolute;
    top: 20px;
    right: 20px;
    width: 300px;
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 20px;
    border-radius: 10px;
    backdrop-filter: blur(10px);
    max-height: 90vh;
    overflow-y: auto;
    z-index: 1000;
}

.control-group {
    margin-bottom: 15px;
}

.control-group label {
    display: block;
    margin-bottom: 5px;
    font-weight: bold;
}

.control-group input,
.control-group select {
    width: 100%;
    padding: 5px;
    border: none;
    border-radius: 5px;
    background: rgba(255, 255, 255, 0.1);
    color: white;
}

.position-inputs {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 5px;
}

.button-group {
    display: flex;
    gap: 10px;
    margin-top: 20px;
}

.btn {
    flex: 1;
    padding: 10px;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    font-weight: bold;
    transition: background-color 0.3s;
}

.btn.primary {
    background: #007bff;
    color: white;
}

.btn.secondary {
    background: #6c757d;
    color: white;
}

.btn.info {
    background: #17a2b8;
    color: white;
}

.btn:hover {
    opacity: 0.8;
}

.stats {
    margin-top: 20px;
    padding-top: 15px;
    border-top: 1px solid rgba(255, 255, 255, 0.3);
}

.stats p {
    margin: 5px 0;
    font-size: 14px;
}
</style>