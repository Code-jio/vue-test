<template>
    <div class="engine-scene-container">
        <div id="css3d-container" class="css3d-container"></div>
        
        <!-- 楼层控制面板 -->
        <div class="floor-control-panel">
            <h3 class="panel-title">楼层控制</h3>
            <div class="control-buttons">
                <button 
                    class="control-btn expand-btn" 
                    @click="expandFloors"
                    :disabled="isOperating"
                >
                    楼层展开
                </button>
                <button 
                    class="control-btn collapse-btn" 
                    @click="collapseFloors"
                    :disabled="isOperating"
                >
                    楼层合并
                </button>
                <div class="focus-floor-group">
                    <input 
                        type="number" 
                        v-model.number="targetFloor" 
                        placeholder="楼层号"
                        class="floor-input"
                        min="1"
                        :disabled="isOperating"
                    />
                    <button 
                        class="control-btn focus-btn" 
                        @click="focusOnFloor"
                        :disabled="isOperating || !targetFloor"
                    >
                        聚焦至{{ targetFloor || 'n' }}楼
                    </button>
                </div>
            </div>
            <div v-if="operationStatus" class="status-message" :class="operationStatus.type">
                {{ operationStatus.message }}
            </div>
        </div>

        <ModelMessage 
            v-show="currentModelInfo"
            ref="modelMessageRef"
            :modelInfo="currentModelInfo || {}"
            @close="hideModelInfo"
        />
    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from "vue";
import {
    useEngine,
    engineInitialize,
    loadBatchModels,
    loadModel,
    createPathDemo,
    createFireMarker,
    createWaterMarker,

    baseScene,
    engine,
    css3dPlugin,
    resourceReaderPlugin,
    mousePickPlugin,
    buildingControlPlugin,
} from "@/composables/default";
import eventBus from "@/eventBus";
import ModelMessage from "@/components/modelMessage.vue";

const currentModelInfo = ref(null); // 当前显示的模型信息
const currentCSS3DObject = ref(null); // 当前显示的CSS3D对象
const modelMessageRef = ref(null); // ModelMessage组件引用

// 楼层控制相关状态
const targetFloor = ref(null); // 目标楼层号
const isOperating = ref(false); // 是否正在执行操作
const operationStatus = ref(null); // 操作状态信息

onMounted(async () => {
    await useEngine();
    await loadModelsFromConfig();
    await buildingControlPlugin.init(baseScene);

    console.log('🏢 建筑模型解析结果:', buildingControlPlugin,baseScene);

    // // 设置点击事件监听
    // setupBuildingClickHandler();
    
    // 设置鼠标点击事件监听 - 在点击位置创建CSS3D对象
    // setupClickToCreateCSS3D();
    
    // // 创建火焰效果
    // let fire = createFireMarker({
    //     position: [10, 30, 10], // 设置在容易看到的位置，提高高度
    //     size: 20.0, // 大幅增大尺寸
    //     intensity: 1.0,
    //     debugMode: true, // 启用调试模式
    //     renderOrder: 1, // 确保在水面之上渲染
    // });
    // console.log('🔥 火焰效果:', fire);
    // fire.addToScene(baseScene.scene, baseScene.camera); // 传递相机参数以支持Billboard效果


    // // 指定轮廓的水体生成 - 创建演示异形水体
    // createWaterMarker({
    //     height: 30.0,
    //     position: { x: 50, y: 10, z: 50 },
    //     contour: [
    //         { x: -15, y: 10, z: -15 },
    //         { x: 15, y: 10, z: -15 },
    //         { x: 15, y: 10, z: 15 },
    //         { x: -15, y: 10, z: 15 },
    //         { x: -10, y: 10, z: 10 },
    //         { x: 10, y: 10, z: 10 },
    //         { x: 15, y: 10, z: -15 },
    //     ],
    //     waterColor: 0x4a90e2,
    //     transparency: 0.7,
    //     waveScale: 1.2,
    //     distortionScale: 3.0,
    //     onCreated: (waterMarker) => {
    //         console.log('🌊 演示水体创建完成:', waterMarker);
    //     }
    // });

    // await createPathDemo('/MAN.gltf')

    // 方法2：使用测试函数
    // testPathLineRendering()

})
// console.log(EngineKernel)
EngineKernel.eventBus.on('mouse-pick:object-picked', (object) => {
    // console.log('选中对象:', object);
            // 获取点击位置的3D坐标
        if (object && object.results[0].localPosition) {
            const position = {
                x: object.results[0].localPosition.x,
                y: object.results[0].localPosition.y , // 稍微抬高一点，避免与地面重叠
                z: object.results[0].localPosition.z
            };
            
            console.log('在模型位置创建CSS3D对象:', position);
            
            try {
                const css3dObject = createCSS3DAtPosition(position);
                console.log('✅ CSS3D对象创建完成:', css3dObject);
            } catch (error) {
                console.error('创建CSS3D对象失败:', error);
            }
        } else if (object && object.results && object.results.length > 0 && object.results[0].worldPosition) {
            // 备用数据结构
            const position = {
                x: object.results[0].worldPosition.x,
                y: object.results[0].worldPosition.y + 2,
                z: object.results[0].worldPosition.z
            };
            
            console.log('在模型位置创建CSS3D对象(备用):', position);
            
            try {
                const css3dObject = createCSS3DAtPosition(position);
                console.log('✅ CSS3D对象创建完成:', css3dObject);
            } catch (error) {
                console.error('创建CSS3D对象失败:', error);
            }
        }
})

// 设置建筑点击处理器
const setupBuildingClickHandler = () => {
    if (!mousePickPlugin) {
        console.error("MousePickPlugin not found");
        return;
    }

    // 监听建筑模型点击事件
    EngineKernel.eventBus.on('mouse-pick:getBuilding', async (event) => {
        console.log('点击事件：getBuilding', event);
        await showModelInfo(event);
    });

    // 
    // EngineKernel.eventBus.on('mouse-pick:emptyClick', async () => {
    //     await hideModelInfo();
    // });
};

// 在指定位置创建CSS3D对象
const createCSS3DAtPosition = async (position) => {
    if (!modelMessageRef.value || !modelMessageRef.value.$el) {
        throw new Error('ModelMessage组件未准备就绪');
    }

    const options = {
        element: modelMessageRef.value.$el,
        position: [position.x, position.y, position.z],
        display: true,
        opacity: 1,
        offset: 0,
        scale: 0.05,
        complete: () => {
            console.log('✅ CSS3D对象在点击位置创建完成');
        },
    };

    // 在指定位置创建css3D对象
    const object3D = css3dPlugin.createCSS3DObject(options);
    
    // 更新当前CSS3D对象引用
    currentCSS3DObject.value = object3D;
    
    // 显示模型信息
    await showModelInfo();
    
    return object3D;
};

// 隐藏模型信息
const hideModelInfo = async () => {
    if (currentCSS3DObject.value) {
        css3dPlugin.setVisible(currentCSS3DObject.value, false, true); // 第三个参数是useAnimation
    }
    console.log('✅ CSS3D模型信息卡片已隐藏',currentCSS3DObject.value);
};

const showModelInfo = async () => {
    if (currentCSS3DObject.value) {
        css3dPlugin.setVisible(currentCSS3DObject.value, true, true); // 第三个参数是useAnimation
    }
    
    console.log('👁️ 显示模型信息', currentCSS3DObject.value);
}

// 组件卸载时清理资源
onUnmounted(async () => {
    await hideModelInfo();
});

// 楼层控制方法
const expandFloors = async () => {
    if (!buildingControlPlugin) {
        showOperationStatus('error', '楼层控制插件未初始化');
        return;
    }
    
    try {
        isOperating.value = true;
        showOperationStatus('info', '正在展开楼层...');
        
        await buildingControlPlugin.expandFloors();
        showOperationStatus('success', '楼层展开完成');
    } catch (error) {
        console.error('楼层展开失败:', error);
        showOperationStatus('error', '楼层展开失败');
    } finally {
        isOperating.value = false;
    }
};

const collapseFloors = async () => {
    if (!buildingControlPlugin) {
        showOperationStatus('error', '楼层控制插件未初始化');
        return;
    }
    
    try {
        isOperating.value = true;
        showOperationStatus('info', '正在合并楼层...');
        
        await buildingControlPlugin.collapseFloors();
        showOperationStatus('success', '楼层合并完成');
    } catch (error) {
        console.error('楼层合并失败:', error);
        showOperationStatus('error', '楼层合并失败');
    } finally {
        isOperating.value = false;
    }
};

const focusOnFloor = async () => {
    if (!buildingControlPlugin) {
        showOperationStatus('error', '楼层控制插件未初始化');
        return;
    }
    
    if (!targetFloor.value || targetFloor.value < 1) {
        showOperationStatus('error', '请输入有效的楼层号（大于0的整数）');
        return;
    }
    
    try {
        isOperating.value = true;
        showOperationStatus('info', `正在聚焦至${targetFloor.value}楼...`);
        
        await buildingControlPlugin.focusOnFloor(targetFloor.value);
        showOperationStatus('success', `已聚焦至${targetFloor.value}楼`);
    } catch (error) {
        console.error('楼层聚焦失败:', error);
        showOperationStatus('error', `聚焦至${targetFloor.value}楼失败`);
    } finally {
        isOperating.value = false;
    }
};

// 显示操作状态
const showOperationStatus = (type, message) => {
    operationStatus.value = { type, message };
    // 3秒后自动清除状态信息
    setTimeout(() => {
        operationStatus.value = null;
    }, 3000);
};

// 测试CSS3D功能（可以在控制台调用）
const testCSS3D = async (position = {x: 80, y: 0, z: 90}) => {
    if (!modelMessageRef.value || !modelMessageRef.value.$el) {
        throw new Error('ModelMessage组件未准备就绪');
    }

    let options = {
        element: modelMessageRef.value.$el,
        position: [position.x, position.y, position.z],
        display: true,
        opacity: 1,
        offset: 50,
        scale: 0.05,
        complete: () => {
            console.log('✅ CSS3D对象创建完成');
        },
    }


    // 在指定位置创建css3D对象
    let object3D = css3dPlugin.createCSS3DObject(options)
    currentCSS3DObject.value = object3D;
    
    return object3D
};

// 将测试函数暴露到全局，方便调试
if (typeof window !== 'undefined') {
    window.testCSS3D = testCSS3D;
    window.hideModelInfo = hideModelInfo;
    window.showModelInfo = showModelInfo;
}

const loadModelsFromConfig = async () => {
    const response = await fetch("/model-files.json");
    const config = await response.json();
    const modelFiles = config.files;
    
    // 🔧 修复：使用 Promise.all 确保所有模型加载完成
    console.log(`📥 开始加载 ${modelFiles.length} 个模型...`);
    
    const loadPromises = modelFiles.map(async (modelFile, index) => {
        
        const model = await resourceReaderPlugin.loadModelAsync(modelFile, EngineKernel.TaskPriority.MEDIUM, {
            timeout: 30000,
            retryCount: 1,
            category: 'batch_load'
        });
        
        baseScene.scene.add(model);
        console.log(`✅ 模型加载完成: ${model.name || model.userData?.modelName || 'unknown'}`);
        return model;
    });

    const loadedModels = await Promise.all(loadPromises);
    console.log(`🎉 所有模型加载完成！总计: ${loadedModels.length} 个`);
    
    // // 🔧 打印场景中的所有建筑模型以便调试
    // baseScene.scene.children.forEach((child, index) => {
    //     if (child.userData?.isBuildingModel) {
    //         console.log(`🏢 发现建筑模型 ${index + 1}: ${child.name || child.userData?.modelName}`);
    //     }
    // });
    
    return loadedModels;
    

}

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
    /* CSS3D容器不接收事件 */
    z-index: 999;
    /* 在Canvas之上，确保CSS3D对象可见 */
    overflow: hidden;
    /* 防止内容溢出 */
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

/* 楼层控制面板样式 */
.floor-control-panel {
    display: none;
    position: fixed;
    top: 20px;
    right: 20px;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    min-width: 280px;
    z-index: 999999;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
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

.control-buttons {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.control-btn {
    padding: 12px 16px;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    position: relative;
    overflow: hidden;
}

.control-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.control-btn:active:not(:disabled) {
    transform: translateY(0);
}

.control-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
}

.expand-btn {
    background: linear-gradient(135deg, #4CAF50, #45a049);
    color: white;
}

.expand-btn:hover:not(:disabled) {
    background: linear-gradient(135deg, #45a049, #3d8b40);
}

.collapse-btn {
    background: linear-gradient(135deg, #2196F3, #1976D2);
    color: white;
}

.collapse-btn:hover:not(:disabled) {
    background: linear-gradient(135deg, #1976D2, #1565C0);
}

.focus-floor-group {
    display: flex;
    gap: 8px;
    align-items: center;
}

.floor-input {
    flex: 1;
    padding: 10px 12px;
    border: 2px solid #e0e0e0;
    border-radius: 6px;
    font-size: 14px;
    transition: border-color 0.3s ease;
    background: white;
}

.floor-input:focus {
    outline: none;
    border-color: #FF9800;
    box-shadow: 0 0 0 3px rgba(255, 152, 0, 0.1);
}

.floor-input:disabled {
    background: #f5f5f5;
    color: #999;
}

.focus-btn {
    background: linear-gradient(135deg, #FF9800, #F57C00);
    color: white;
    flex: 2;
}

.focus-btn:hover:not(:disabled) {
    background: linear-gradient(135deg, #F57C00, #E65100);
}

.status-message {
    margin-top: 12px;
    padding: 8px 12px;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 500;
    text-align: center;
    animation: fadeIn 0.3s ease;
}

.status-message.success {
    background: #E8F5E8;
    color: #2E7D32;
    border: 1px solid #C8E6C9;
}

.status-message.error {
    background: #FFEBEE;
    color: #C62828;
    border: 1px solid #FFCDD2;
}

.status-message.info {
    background: #E3F2FD;
    color: #1565C0;
    border: 1px solid #BBDEFB;
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

/* 响应式设计 */
@media (max-width: 768px) {
    .floor-control-panel {
        top: 10px;
        right: 10px;
        left: 10px;
        min-width: auto;
        padding: 16px;
    }
    
    .focus-floor-group {
        flex-direction: column;
    }
    
    .focus-btn {
        flex: 1;
    }
}
</style>