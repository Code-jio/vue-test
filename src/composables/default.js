import { ref, nextTick } from "vue";

let engine = null;
let baseScene = null;
let renderLoop = null;
let modelMarkerPlugin = null;
let skyBoxPlugin = null;
let resourceReaderPlugin = null;
let mousePickPlugin = null;
let buildingControlPlugin = null;
let css3dPlugin = null;
let floorManager = null;

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
                        type: 'water',
                        size: Infinity,
                        position: [0, 0, 0],
                        waterConfig: {
                            textureWidth: 512,
                            textureHeight: 512,
                            alpha: 1.0,
                            time: 0,
                            waterColor: 0x4a90e2,
                            distortionScale: 2.0,
                            waterNormalsUrl: "./textures/waternormals.jpg",
                            animationSpeed: 0.3,
                            waveScale: 0.5
                        },
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
    css3dPlugin = engine.getPlugin("CSS3DRenderPlugin");
    modelMarkerPlugin = engine.getPlugin("ModelMarkerPlugin");

    // 获取楼层管理器实例
    floorManager = baseScene.floorManager;
    
    // 暴露水面控制方法到全局（方便调试）
    if (typeof window !== 'undefined') {
        window.setWaterAnimationSpeed = (speed) => {
            if (floorManager) {
                floorManager.setWaterAnimationSpeed(speed);
                console.log(`水面动画速度设置为: ${speed}`);
            }
        };
        window.setWaterWaveIntensity = (intensity) => {
            if (floorManager) {
                floorManager.setWaterWaveIntensity(intensity);
                console.log(`水面波浪强度设置为: ${intensity}`);
            }
        };
        window.setWaterDistortionScale = (scale) => {
            if (floorManager) {
                floorManager.setWaterDistortionScale(scale);
                console.log(`水面扭曲比例设置为: ${scale}`);
            }
        };
        window.setWaterColor = (color) => {
            if (floorManager) {
                floorManager.setWaterColor(color);
                console.log(`水面颜色设置为: 0x${color.toString(16)}`);
            }
        };
        window.getWaterParams = () => {
            return floorManager ? floorManager.getWaterParams() : null;
        };
        
        console.log('🌊 简化水面控制方法已暴露到全局:');
        console.log('- window.setWaterAnimationSpeed(speed) // 0.1-5.0 动画速度');
        console.log('- window.setWaterWaveIntensity(intensity) // 0.0-3.0 波浪强度');
        console.log('- window.setWaterDistortionScale(scale) // 0.0-8.0 扭曲程度');
        console.log('- window.setWaterColor(0xHEXCOLOR) // 水面颜色');
        console.log('- window.getWaterParams() // 获取当前参数');
    }

    modelMarkerPlugin.init(engine)
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


// 添加模型：\public\MAN.gltf 作为3Dmodelmarker，然后执行moveByPath方法，使用modelMarkerPlugin的内置方法
const loadModel = async (url = '/MAN.gltf', options = {}) => {
    if (!modelMarkerPlugin) {
        console.error("❌ ModelMarkerPlugin not found");
        return null;
    }

    try {
        // 合并默认配置
        const config = {
            modelUrl: url,
            name: options.name || `Model_${Date.now()}`,
            position: options.position || [0, 0, 0],
            rotation: options.rotation || [0, 0, 0],
            scale: options.scale || [1, 1, 1],
            show: options.show !== undefined ? options.show : true,
            autoLoad: options.autoLoad !== undefined ? options.autoLoad : true,
            enableAnimations: options.enableAnimations !== undefined ? options.enableAnimations : true,
            ...options
        };
        
        // 添加模型到ModelMarker
        const modelId = modelMarkerPlugin.addModel(config);
        
        if (!modelId) {
            throw new Error('模型添加失败，未返回有效的模型ID');
        }

        // 创建增强的模型控制器
        const modelController = {
            id: modelId,
            url: url,
            config: config,

            // 路径移动功能
            moveByPath: (pathPoints, moveOptions = {}) => {
                const instance = modelMarkerPlugin.getModelById(modelId);
                if (!instance || !instance.model) {
                    console.error('❌ 模型未加载，无法执行路径移动');
                    return null;
                }

                const pathConfig = {
                    pathPoints: pathPoints,
                    duration: 5000,
                    loop: false,
                    autoStart: true,
                    showPath: true,
                    pathLineColor: 0x00ff00,
                    pathLineWidth: 2,
                    easing: 'easeInOut',
                    lookAtDirection: true,
                    // onStart: () => console.log(`🎬 模型 ${modelId} 开始路径移动`),
                    onUpdate: (progress) => {
                        // if (moveOptions.showProgress !== false) {
                            // console.log(`📍 ${modelId} 移动进度: ${Math.round(progress * 100)}%`);
                        // }
                    },
                    // onComplete: () => console.log(`🏁 模型 ${modelId} 路径移动完成`),
                    // onStop: () => console.log(`⏹️ 模型 ${modelId} 路径移动停止`),
                    ...moveOptions
                };

                return modelMarkerPlugin.moveByPath(instance.model, pathConfig);
            },
        };

        return modelController;

    } catch (error) {
        console.error(`❌ 加载模型失败: ${url}`, error);
        throw error;
    }
};

// 获取随机点位
const getRandomPosition = (min = -30, max = 30) => {
    const random = (a, b) => Math.random() * (b - a) + a;
    return {
        x: random(min, max),
        y: 0,
        z: random(min, max)
    };
}

// 快速创建演示路径动画的辅助函数
const createPathDemo = async (modelUrl = '/MAN.gltf') => {
    try {
        // 加载模型
        const modelController = await loadModel(modelUrl, {
            name: 'PathDemoModel',
            position: [0, 5, 0],
            scale: [5, 5, 5] // 缩小一些便于观察
        });
        
        // 定义一个示例路径 - 正方形路径
        const demoPath = [];
        for (let index = 0; index < 8; index++) {
            demoPath.push(getRandomPosition())            
        }
        
        // 启动路径动画
        const pathAnimation = modelController.moveByPath(demoPath, {
            duration: 8000,
            loop: true,
            showPath: true,
            pathLineColor: 0xff0000, // 改为红色，更容易看到
            pathLineWidth: 5, // 增加线宽，测试管道几何体
            easing: 'linear',
        });
        
        // 将控制器暴露到全局以便调试
        if (typeof window !== 'undefined') {
            window.pathDemoController = {
                model: modelController,
                animation: pathAnimation,
                stop: () => pathAnimation.stop(),
                start: () => pathAnimation.start(),
                remove: () => modelController.remove()
            };
            console.log('🌐 路径演示控制器已暴露到全局: window.pathDemoController');
        }
        
        return { modelController, pathAnimation };
        
    } catch (error) {
        console.error('❌ 创建路径演示失败:', error);
        throw error;
    }
};

export {
    useEngine,
    engineInitialize,
    loadBatchModels,
    loadModel,
    createPathDemo,


    baseScene,
    engine,
    resourceReaderPlugin,
    mousePickPlugin,
    buildingControlPlugin,
    modelMarkerPlugin,
    css3dPlugin,
    floorManager,
}