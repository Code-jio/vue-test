import { ref, nextTick } from "vue";

let engine = null;
let baseScene = null;
let renderLoop = null;
let modelMarkerPlugin = null;
let skyBoxPlugin = null;
let resourceReaderPlugin = null;
let mousePickPlugin = null;
let buildingControlPlugin = null;

const useEngine = () => {
    try {
        engineInitialize();
    } catch (error) {
        console.error(error);
    }
}

const engineInitialize = async () => {
    engine = new EngineKernel.BaseCore({
        pluginsParams: [
            {
                name: "baseScenePlugin",
                path: "/plugins/scene",
                pluginClass: EngineKernel.BaseScene,
                userData: {
                    floorConfig: {
                        enabled: true,
                        type: 'static',
                        staticConfig: {
                            tiling: [25, 25], // 图片铺满
                            texture: './textures/floor.png' // 你的图片路径
                        }
                    },
                    debugConfig: {
                        enabled: true,
                        gridHelper: false,
                        axesHelper: true,
                    }
                } // 后续将userData改为config
            },
            {
                name: "ResourceReaderPlugin",
                path: "/plugins/ResourceReaderPlugin",
                supportedFormats: ["gltf", "glb"],
                pluginClass: EngineKernel.ResourceReaderPlugin,
                userData: {
                    url: "/",
                },
            }
        ]
    })

    baseScene = engine.getPlugin("baseScenePlugin");

    // 后续renderLoop 考虑集成至其他插件
    engine.register({
        name: "RenderLoopPlugin",
        path: "/plugins/webgl/renderLoop",
        pluginClass: EngineKernel.RenderLoop,
        userData: {
            scene: baseScene.scene,
        },
    }).register({
        name: "ModelMarkerPlugin",
        path: "/plugins/webgl/3DModelMarker",
        pluginClass: EngineKernel.ModelMarker,
        userData: {
            scene: baseScene.scene,
        },
    }).register({
        name: "SkyBoxPlugin",
        path: "/plugins/webgl/SkyBox",
        pluginClass: EngineKernel.SkyBox,
        userData: {
            scene: baseScene.scene,
            camera: baseScene.camera,
            renderer: baseScene.renderer,
            skyBoxType: EngineKernel.SkyBoxType.HDR_ENVIRONMENT,
            hdrMapPath: './skybox/rustig_koppie_puresky_2k.hdr',
        },
    }).register({
        name: "CSS3DRenderPlugin",
        path: "/plugins/webgl/css3DRender",
        pluginClass: EngineKernel.CSS3DRenderPlugin,
        userData: {
            scene: baseScene.scene,
            renderer: baseScene.renderer,
            camera: baseScene.camera,
            container: document.getElementById("css3d-container"),
        }
    }).register({
        name: "MousePickPlugin",
        path: "/plugins/webgl/mousePickPlugin",
        pluginClass: EngineKernel.MousePickPlugin,
        userData: {
            scene: baseScene.scene,
            camera: baseScene.camera,
            renderer: baseScene.renderer,
            controller: baseScene.controlsInstance,
        }
    }).register({
        name: "BuildingControlPlugin",
        path: "/plugins/webgl/BuildingControlPlugin",
        pluginClass: EngineKernel.BuildingControlPlugin,
        userData: {
            floorControlConfig: {
                expandDistance: 30,
                animationDuration: 1500,
                focusOpacity: 1.0,
                unfocusOpacity: 0.3,
                easingFunction: 'Cubic.InOut',
                showFacade: true,
                autoHideFacade: true
            },
            events: {
                onExpandStart: () => {
                    console.log('🏗️ 楼层开始展开');
                },
                onExpandComplete: () => {
                    console.log('✅ 楼层展开完成');
                    updateFloorControlStatus();
                },
                onCollapseStart: () => {
                    console.log('🏗️ 楼层开始收回');
                },
                onCollapseComplete: () => {
                    console.log('✅ 楼层收回完成');
                    updateFloorControlStatus();
                },
                onFloorFocus: (floorNumber) => {
                    console.log(`🎯 聚焦到 ${floorNumber} 楼`);
                    updateFloorControlStatus();
                },
                onFloorUnfocus: () => {
                    console.log('👁️ 取消楼层聚焦');
                    updateFloorControlStatus();
                }
            }
        },
    });

    // 启动渲染循环
    let renderLoopPlugin = engine.getPlugin("RenderLoopPlugin");
    if (renderLoopPlugin) {
        renderLoopPlugin.initialize();
    }
    resourceReaderPlugin = engine.getPlugin("ResourceReaderPlugin");
    mousePickPlugin = engine.getPlugin("MousePickPlugin");
    buildingControlPlugin = engine.getPlugin("BuildingControlPlugin");

}

// 批量加载模型
const loadBatchModels = async (modelFiles) => {
    const resourceReaderPlugin = engine.getPlugin("ResourceReaderPlugin");
    if (!resourceReaderPlugin) {
        console.error("ResourceReaderPlugin not found");
        return;
    }
    const loadedModels = [];
    const loadPromises = modelFiles.map(async (modelPath, index) => {
        // 修复路径格式：替换反斜杠为正斜杠，并确保路径格式正确
        const fixedPath = modelPath.replace(/\\/g, '/');
        const fullPath = fixedPath.startsWith('/') ? fixedPath : `/${fixedPath}`;

        // 加载模型
        const model = await resourceReaderPlugin.loadModelAsync(
            fullPath,
            EngineKernel.TaskPriority.MEDIUM,
            {
                timeout: 30000,
                retryCount: 1,
                category: 'batch_load'
            }
        );

        // 添加到场景
        baseScene.scene.add(model);
        // 设置模型名称
        resourceReaderPlugin.setModelName(model, modelPath);

        // 设置模型是否为建筑模型
        const isBuildingModel = resourceReaderPlugin.isBuildingModel(modelPath);
        if (isBuildingModel) {
            buildingControlPlugin.setBuildingModel(model);
        }
        

        return model;
    });

    // 等待所有模型加载完成
    const results = await Promise.allSettled(loadPromises);

    // 统计加载结果
    results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value) {
            loadedModels.push(result.value);
        }
    });

    console.log(`批量加载完成！成功加载 ${loadedModels.length}/${modelFiles.length} 个模型`);
    return loadedModels;
}

export {
    useEngine,
    engineInitialize,
    loadBatchModels,


    baseScene,
    engine,
    resourceReaderPlugin,
    mousePickPlugin,
    buildingControlPlugin,
}