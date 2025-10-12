<template>
    <div class="engine-scene-container">
        <div id="css3d-container" class="css3d-container"></div>
    </div>
</template>

<script setup>
console.time('当前场景加载完成');
import { ref, onMounted, onUnmounted, computed } from 'vue';
import {
    useEngine,
    baseScene,
    resourceReaderPlugin,
    buildingControlPlugin,
} from '@/composables/perfTest';

let model,
    arr = [];
onMounted(async () => {
    await useEngine();
    
    // 添加光照 - 修复材质渲染问题
    setupLighting();
    
    await loadModelsFromConfig();
    await buildingControlPlugin.init(baseScene);
    window.baseScene = baseScene;
    console.log('🏢 建筑模型解析结果:', buildingControlPlugin, baseScene);

    // await testCSS3D();

    EngineKernel.eventBus.on('mouse-pick:object-picked', (payload) => {
        arr.push(payload.mousePosition);
        console.log(payload);
        // console.log(arr);
    });
});

// 添加光照配置
const setupLighting = () => {
    // 环境光 - 提供基础照明
    const ambientLight = new EngineKernel.THREE.AmbientLight(0x404040, 0.6);
    baseScene.scene.add(ambientLight);
    
    // 方向光 - 提供主要照明和阴影
    const directionalLight = new EngineKernel.THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 5);
    directionalLight.castShadow = true;
    
    // 配置阴影
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 500;
    directionalLight.shadow.camera.left = -100;
    directionalLight.shadow.camera.right = 100;
    directionalLight.shadow.camera.top = 100;
    directionalLight.shadow.camera.bottom = -100;
    
    baseScene.scene.add(directionalLight);
    
    console.log('💡 光照设置完成');
};

const loadModelsFromConfig = async () => {
    const response = await fetch('./model-files.json');
    const config = await response.json();
    const modelFiles = config.files;

    // 🔧 修复：使用 Promise.all 确保所有模型加载完成
    console.log(`📥 开始加载 ${modelFiles.length} 个模型...`);

    const loadPromises = modelFiles.map(async (modelFile, index) => {
        model = await resourceReaderPlugin.loadModelAsync(
            modelFile,
            EngineKernel.TaskPriority.MEDIUM,
            {
                timeout: 30000,
                retryCount: 1,
                category: 'batch_load',
            }
        );

        baseScene.scene.add(model);
        return model;
    });

    const loadedModels = await Promise.all(loadPromises);
    console.log(`🎉 所有模型加载完成！总计: ${loadedModels.length} 个`);

    return loadedModels;
};
</script>

<style scoped>
.engine-scene-container {
    position: absolute;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    overflow: hidden;
    margin: 0;
    padding: 0;
    z-index: 0;
}

.css3d-container {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none !important;
    z-index: 999;
    overflow: hidden;
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

/* ModelMessage组件在CSS3D中的样式 */
:global(.css3d-object .model-info-card) {
    transform-style: preserve-3d;
    transition: opacity 0.3s ease-in-out, transform 0.3s ease-in-out;
}

/* CSS3D渐入动画 */
:global(.css3d-object.fade-in .model-info-card) {
    opacity: 1;
    transform: scale(1) translateZ(0);
}

/* CSS3D渐出动画 */
:global(.css3d-object.fade-out .model-info-card) {
    opacity: 0;
    transform: scale(0.8) translateZ(0);
}

.panel-title {
    margin: 0 0 16px 0;
    font-size: 18px;
    font-weight: 600;
    color: #333;
    text-align: center;
    border-bottom: 2px solid #e0e0e0;
    padding-bottom: 8px;
}

.expand-btn {
    background: linear-gradient(135deg, #4caf50, #45a049);
    color: white;
}

.expand-btn:hover:not(:disabled) {
    background: linear-gradient(135deg, #45a049, #3d8b40);
}

.move-btn {
    background: linear-gradient(45deg, #e65100, #c62828);
    color: white;
}

.move-btn:hover:not(:disabled) {
    background: linear-gradient(135deg, #ad3b27, #e25454);
}

.collapse-btn {
    background: linear-gradient(135deg, #2196f3, #1976d2);
    color: white;
}

.collapse-btn:hover:not(:disabled) {
    background: linear-gradient(135deg, #1976d2, #1565c0);
}

.focus-btn {
    background: linear-gradient(135deg, #ff9800, #f57c00);
    color: white;
    flex: 2;
}

.focus-btn:hover:not(:disabled) {
    background: linear-gradient(135deg, #f57c00, #e65100);
}

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(-10px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

@media (max-width: 768px) {
    .floor-control-panel {
        display: block;
        position: fixed;
        top: 200px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(10px);
        border-radius: 12px;
        padding: 20px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        min-width: 100px;
        z-index: 999999;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
}
</style>
