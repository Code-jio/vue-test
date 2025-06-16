<template>
    <div class="engine-scene-container">
        <div id="css3d-container" class="css3d-container"></div>
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
    testPathLineRendering,

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

onMounted(async () => {
    await useEngine();
    await loadModelsFromConfig();
    await buildingControlPlugin.init(baseScene);

    const floorInfo = buildingControlPlugin.getFloorInfo();
    console.log('📊 楼层控制插件初始化完成，楼层信息:', floorInfo, buildingControlPlugin);
    console.log('场景:', baseScene);

    // 设置点击事件监听
    setupBuildingClickHandler();

    await testCSS3D();

    await createPathDemo('/MAN.gltf')

    // 方法2：使用测试函数
    // testPathLineRendering()
})

// 设置建筑点击处理器
const setupBuildingClickHandler = () => {
    if (!mousePickPlugin) {
        console.error("MousePickPlugin not found");
        return;
    }

    // 监听建筑模型点击事件
    EngineKernel.eventBus.on('mouse-pick:getBuilding', async (event) => {
        await showModelInfo(event);
    });

    // 
    EngineKernel.eventBus.on('mouse-pick:emptyClick', async () => {
        await hideModelInfo();
    });
};

// 隐藏模型信息
const hideModelInfo = async () => {
    if (currentCSS3DObject.value) {
        // 使用动画隐藏CSS3D对象
        console.log('👁️ 隐藏CSS3D模型信息卡片...');
        css3dPlugin.setVisible(currentCSS3DObject.value, false, true); // 第三个参数是useAnimation
    }
    console.log('✅ CSS3D模型信息卡片已隐藏');
};

const showModelInfo = async () => {
    // 设置模型信息
    currentModelInfo.value = {
        name: '测试建筑模型',
        type: '建筑',
        position: { x: 0, y: 0, z: 0 },
        uuid: 'test-uuid-12345',
    };
    
    // 等待Vue组件更新完成
    await nextTick();
    
    if (currentCSS3DObject.value) {
        // 使用动画显示CSS3D对象
        css3dPlugin.setVisible(currentCSS3DObject.value, true, true); // 第三个参数是useAnimation
        console.log('👁️ 显示CSS3D模型信息卡片...');
    }
    
    console.log('👁️ 显示模型信息', currentCSS3DObject.value);
}

// 组件卸载时清理资源
onUnmounted(async () => {
    await hideModelInfo();
});

// 测试CSS3D功能（可以在控制台调用）
const testCSS3D = async (position = {x: 0, y: 0, z: 0}) => {
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

// // 将测试函数暴露到全局，方便调试
// if (typeof window !== 'undefined') {
//     window.testCSS3D = testCSS3D;
//     window.hideModelInfo = hideModelInfo;
// }

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
    position: fixed;
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
    backface-visibility: hidden;
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
</style>