<template>
    <div class="engine-scene-container">
        <div id="css3d-container" class="css3d-container"></div>

        <!-- 云标注控制面板 -->
        <div class="cloud-control-panel">
            <h3 class="panel-title">云标注控制</h3>
            <div class="control-buttons">
                <button class="control-btn" @click="createDemoClouds" :disabled="isOperating"
                    style="background: linear-gradient(135deg, #FF9800, #F57C00); color: white;">
                    创建演示云
                </button>
                <button class="control-btn" @click="clearAllClouds" :disabled="isOperating"
                    style="background: linear-gradient(135deg, #F44336, #D32F2F); color: white;">
                    清除所有云
                </button>
            </div>

            <div v-if="operationStatus" class="status-message" :class="operationStatus.type">
                {{ operationStatus.message }}
            </div>
        </div>

        <ModelMessage v-show="currentModelInfo" ref="modelMessageRef" :modelInfo="currentModelInfo || {}"
            @close="hideModelInfo" />
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
    createCloudMarker,

    createSmoke,
    updateSmokeControls,

    smokeControls,

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

// 操作状态相关
const isOperating = ref(false); // 是否正在执行操作
const operationStatus = ref(null); // 操作状态信息

let mainSmoke;

onMounted(async () => {
    await useEngine();
    await loadModelsFromConfig();
    await buildingControlPlugin.init(baseScene);

    console.log('🏢 建筑模型解析结果:', buildingControlPlugin, baseScene);

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


    mainSmoke = createSmoke()

    EngineKernel.eventBus.on("update",()=>{
        updateSmokeControls(mainSmoke)

        // // 更新相机位置到着色器
        // if (mainSmoke && mainSmoke.material && mainSmoke.material.uniforms) {
        //     mainSmoke.material.uniforms.cameraPos.value.copy(camera.position);
        // }

        // // 更新所有粒子系统
        // if (window.effects && window.effects.length > 0) {
        //     window.effects.forEach(effect => {
        //         if (effect.type === 'smoke' && effect.update) {
        //             effect.update(deltaTime);
        //         }
        //     });
        // }
    })
    console.log("EngineKernel.event", smokeControls)
})
// console.log(EngineKernel)
EngineKernel.eventBus.on('mouse-pick:object-picked', (object) => {
    // console.log('选中对象:', object);
    // 获取点击位置的3D坐标
    if (object && object.results[0].localPosition) {
        const position = {
            x: object.results[0].localPosition.x,
            y: object.results[0].localPosition.y, // 稍微抬高一点，避免与地面重叠
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
        screenSpace: true,
        screenOffset: [250, 0],
        billboarding: false,
        useTransitions: false, // 禁用CSS过渡动画，避免位置更新时的缓慢位移
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
        css3dPlugin.setVisible(currentCSS3DObject.value, false, false); // 禁用动画效果
    }
    console.log('✅ CSS3D模型信息卡片已隐藏', currentCSS3DObject.value);
};

const showModelInfo = async () => {
    if (currentCSS3DObject.value) {
        css3dPlugin.setVisible(currentCSS3DObject.value, true, false); // 禁用动画效果
    }

    console.log('👁️ 显示模型信息', currentCSS3DObject.value);
}

// 组件卸载时清理资源
onUnmounted(async () => {
    await hideModelInfo();
});


// 显示操作状态
const showOperationStatus = (type, message) => {
    operationStatus.value = { type, message };
    // 3秒后自动清除状态信息
    setTimeout(() => {
        operationStatus.value = null;
    }, 3000);
};

// 测试CSS3D功能（可以在控制台调用）
const testCSS3D = async (position = { x: 80, y: 0, z: 90 }) => {
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
        useTransitions: false, // 禁用CSS过渡动画
        complete: () => {
            console.log('✅ CSS3D对象创建完成');
        },
    }

    // 在指定位置创建css3D对象
    let object3D = css3dPlugin.createCSS3DObject(options)
    currentCSS3DObject.value = object3D;

    return object3D
};

// 创建演示云场景 - 优化为支持动画演示的云标注
const createDemoClouds = async () => {
    try {
        isOperating.value = true;
        showOperationStatus('info', '正在创建云标注...');

        // 使用点集创建自定义形状的云标注
        const points = [
            new EngineKernel.THREE.Vector3(-8, 0, -8),
            new EngineKernel.THREE.Vector3(8, 0, -8),
            new EngineKernel.THREE.Vector3(12, 0, 0),
            new EngineKernel.THREE.Vector3(8, 0, 8),
            new EngineKernel.THREE.Vector3(-8, 0, 8),
            new EngineKernel.THREE.Vector3(-12, 0, 0)
        ];

        // 创建云标注实例（使用优化后的动画参数）
        const cloud = createCloudMarker({
            height: 5,
            contour: points,
            color: 0x87CEEB,
            opacity: 0.7,
            threshold: 0.25,
            range: 0.1,
            steps: 30,
            position: [0, 10, 0]
        });

        if (cloud) {
            // 添加到管理器
            if (window.cloudControls?.cloudManager) {
                window.cloudControls.cloudManager.add(cloud);
            }

            // 演示动画：创建后自动执行参数变化动画
            setTimeout(async () => {
                try {
                    // 动画序列1：透明度变化
                    await cloud.animateTo({
                        opacity: 0.9,
                        threshold: 0.15,
                        range: 0.2
                    }, 2000);

                    // 动画序列2：密度和步数变化
                    await cloud.animateTo({
                        opacity: 0.5,
                        threshold: 0.35,
                        steps: 50
                    }, 1500);

                    // 动画序列3：恢复到初始状态
                    await cloud.animateTo({
                        opacity: 0.7,
                        threshold: 0.25,
                        range: 0.1,
                        steps: 30
                    }, 1000);

                    console.log('🎬 云标注动画演示完成');
                } catch (error) {
                    console.error('动画演示失败:', error);
                }
            }, 1000);

            showOperationStatus('success', '云标注创建成功！动画演示已启动');
            console.log('☁️ 云标注已创建在场景中心位置，动画演示中...');

            // 将云实例暴露到全局，便于调试和手动控制
            if (typeof window !== 'undefined') {
                window.demoCloud = cloud;
                console.log('💡 提示：在控制台输入 window.demoCloud 可获取云实例进行手动动画控制');
                console.log('💡 示例：window.demoCloud.animateTo({opacity: 0.5, threshold: 0.3}, 2000)');
            }
        } else {
            showOperationStatus('error', '云标注创建失败');
        }

    } catch (error) {
        console.error('创建云标注失败:', error);
        showOperationStatus('error', '云标注创建失败');
    } finally {
        isOperating.value = false;
    }
};

// 清除所有云标注
const clearAllClouds = async () => {
    try {
        isOperating.value = true;
        showOperationStatus('info', '正在清除所有云标注...');

        if (window.cloudControls?.cloudManager) {
            window.cloudControls.cloudManager.clear();
            showOperationStatus('success', '所有云标注已清除');
        } else {
            // 备用清除方法
            console.log('🧹 清除云标注...');
            showOperationStatus('success', '云标注清除完成');
        }

    } catch (error) {
        console.error('清除云标注失败:', error);
        showOperationStatus('error', '清除云标注失败');
    } finally {
        isOperating.value = false;
    }
};

// 将测试函数暴露到全局，方便调试
if (typeof window !== 'undefined') {
    window.testCSS3D = testCSS3D;
    window.hideModelInfo = hideModelInfo;
    window.showModelInfo = showModelInfo;
    window.createDemoClouds = createDemoClouds;
    // window.createMultiCloudsDemo = createMultiCloudsDemo;
    window.clearAllClouds = clearAllClouds;
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
}

/* 云控制面板样式 */
.cloud-control-panel {
    display: block;
    position: fixed;
    top: 20px;
    right: 20px;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    min-width: 200px;
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
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    position: relative;
    overflow: hidden;
}

.control-btn:hover:not(:disabled) {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.control-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.status-message {
    margin-top: 12px;
    padding: 8px 12px;
    border-radius: 6px;
    font-size: 13px;
    font-weight: 500;
    text-align: center;
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

/* 响应式设计 */
@media (max-width: 768px) {
    .cloud-control-panel {
        top: 10px;
        right: 10px;
        left: 10px;
        min-width: auto;
        padding: 16px;
    }
}
</style>