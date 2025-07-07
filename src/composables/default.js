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
                        size: 25000,
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
    renderLoop = engine.getPlugin("RenderLoopPlugin");
    if (renderLoop) {
        renderLoop.initialize();
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
        const modelInstance = await modelMarkerPlugin.addModel(config);
        console.log('🌐 模型添加结果:', modelInstance.id, modelInstance.model);        
        
        if (!modelInstance || !modelInstance.id) {
            throw new Error('模型添加失败，未返回有效的模型实例');
        }
        
        const modelId = modelInstance.id;
        modelMarkerPlugin.setModelColor(modelId, [255, 0, 0]);

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
                    cycle: true,
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

const createFireMarker = (options = {}) => {
    // 合并默认配置 - 使用优化后的配置
    const config = {
        position: [0, 20, 0],
        size: 15.0,
        billboard: true,
        visible: true,
        intensity: 1.0,
        animationSpeed: 1.0,
        baseColor: 0xff4400,
        tipColor: 0xffff00,
        opacity: 1.0,
        flickerIntensity: 0.3,
        waveAmplitude: 0.2,
        depthWrite: false,
        depthTest: true, // 启用深度测试
        renderOrder: 0, // 设置渲染顺序
        // 新增优化属性
        turbulenceScale: 2, // 湍流强度
        windDirection: [0.1, 0.05], // 轻微的风向
        windStrength: 0.3, // 风力强度
        fireHeight: 1.8, // 火焰高度比例
        coreIntensity: 0.1, // 核心亮度
        edgeSoftness: 0.7, // 边缘柔和度
        temperatureVariation: 0.4, // 温度变化
        sparkleIntensity: 0.5, // 火星效果
        debugMode: true,
        ...options
    };

    console.log('🔥 创建 FireMarker，配置:', config);
    
    let fire = null;
    try {
        fire = new EngineKernel.FireMarker(config);
        console.log('🔥 FireMarker 创建成功:', fire);
    } catch (error) {
        console.error('❌ FireMarker 创建失败:', error);
        return null;
    }
    
    // 添加到渲染循环中进行更新
    if (renderLoop) {
        // 检查火焰对象是否有update方法
        if (typeof fire.update === 'function') {
            // 使用唯一ID添加火焰更新任务
            const fireTaskId = `fire-update-${Date.now()}`;
            renderLoop.addTask(fireTaskId, () => fire.update(), 0);
            
            // 将任务ID保存到火焰对象中，以便后续移除
            fire.renderTaskId = fireTaskId;
            console.log('✅ 火焰更新任务已添加到渲染循环，任务ID:', fireTaskId);
        } else {
            console.error('❌ FireMarker 对象没有 update 方法');
        }
    } else {
        console.error('❌ RenderLoop 未初始化，无法添加火焰更新任务');
    }
    
    // 暴露控制方法到全局，方便调试
    if (typeof window !== 'undefined') {
        window.fireMarker = fire;
        window.fireMarkerControls = {
            // 基础控制
            setPosition: (x, y, z) => fire.setPosition([x, y, z]),
            setSize: (size) => fire.setSize(size),
            setIntensity: (intensity) => fire.setIntensity(intensity),
            setVisible: (visible) => fire.setVisible(visible),
            
            // 动画控制
            startAnimation: () => fire.startAnimation(),
            stopAnimation: () => fire.stopAnimation(),
            
            // 新增优化控制方法
            setWind: (directionX, directionY, strength) => fire.setWind([directionX, directionY], strength),
            setCoreIntensity: (intensity) => fire.setCoreIntensity(intensity),
            setTurbulence: (scale) => fire.setTurbulence(scale),
            setSparkle: (intensity) => fire.setSparkle(intensity),
            
            // 快速预设
            presets: {
                // 温和火焰
                gentle: () => {
                    fire.setIntensity(0.7);
                    fire.setWind([0.05, 0.02], 0.1);
                    fire.setTurbulence(0.8);
                    fire.setSparkle(0.1);
                    console.log('🔥 应用温和火焰预设');
                },
                // 狂野火焰
                wild: () => {
                    fire.setIntensity(1.0);
                    fire.setWind([0.2, 0.1], 0.5);
                    fire.setTurbulence(1.5);
                    fire.setSparkle(0.5);
                    console.log('🔥 应用狂野火焰预设');
                },
                // 神秘火焰
                mystical: () => {
                    fire.setIntensity(0.9);
                    fire.setWind([0.0, 0.0], 0.0);
                    fire.setTurbulence(2.0);
                    fire.setSparkle(0.3);
                    fire.setCoreIntensity(2.0);
                    console.log('🔥 应用神秘火焰预设');
                },
                // 风中火焰
                windy: () => {
                    fire.setIntensity(0.8);
                    fire.setWind([0.3, 0.0], 0.7);
                    fire.setTurbulence(1.2);
                    fire.setSparkle(0.4);
                    console.log('🔥 应用风中火焰预设');
                }
            },
            
            // 工具方法
            getConfig: () => fire.getConfig(),
            getMesh: () => fire.getMesh(),
            
            // 清理方法
            dispose: () => {
                if (renderLoop && fire.renderTaskId) {
                    renderLoop.removeTask(fire.renderTaskId);
                    console.log('🔥 火焰渲染任务已移除');
                }
                if (fire.dispose) {
                    fire.dispose();
                    console.log('🔥 火焰对象已清理');
                }
            },
            
            // 调试和测试方法
            testVisibility: () => {
                console.log('🔥 FireMarker 测试可见性:');
                console.log('- 位置:', fire.getPosition());
                console.log('- 可见性:', fire.getVisible());
                console.log('- 配置:', fire.getConfig());
                console.log('- 网格:', fire.getMesh());
                console.log('- 渲染任务ID:', fire.renderTaskId);
                
                fire.setPosition([0, 15, 0]);
                fire.setVisible(true);
                fire.setIntensity(1.0);
                console.log('🔥 已强制设置位置为 [0, 15, 0]，可见性为 true，强度为 1.0');
            },
            
            // 动态效果演示
            demo: {
                // 风向变化演示
                windDemo: () => {
                    let angle = 0;
                    const interval = setInterval(() => {
                        const x = Math.cos(angle) * 0.3;
                        const y = Math.sin(angle) * 0.3;
                        fire.setWind([x, y], 0.4);
                        angle += 0.1;
                        if (angle > Math.PI * 4) { // 2圈后停止
                            clearInterval(interval);
                            fire.setWind([0.1, 0.05], 0.3); // 恢复默认
                            console.log('🔥 风向演示完成');
                        }
                    }, 100);
                    console.log('🔥 开始风向变化演示');
                },
                
                // 强度脉冲演示
                pulseDemo: () => {
                    let time = 0;
                    const interval = setInterval(() => {
                        const intensity = 0.5 + 0.5 * Math.sin(time * 0.1);
                        fire.setIntensity(intensity);
                        time++;
                        if (time > 100) { // 10秒后停止
                            clearInterval(interval);
                            fire.setIntensity(1.0); // 恢复默认
                            console.log('🔥 强度脉冲演示完成');
                        }
                    }, 100);
                    console.log('🔥 开始强度脉冲演示');
                }
            }
        };
        console.log('🔥 优化版 FireMarker 控制方法已暴露到全局:');
        console.log('📍 基础控制:');
        console.log('- window.fireMarkerControls.setPosition(x, y, z)');
        console.log('- window.fireMarkerControls.setSize(size)');
        console.log('- window.fireMarkerControls.setIntensity(0-1)');
        console.log('- window.fireMarkerControls.setVisible(true/false)');
        console.log('');
        console.log('🌪️ 高级效果:');
        console.log('- window.fireMarkerControls.setWind(x, y, strength) // 设置风向和强度');
        console.log('- window.fireMarkerControls.setCoreIntensity(0-3) // 核心亮度');
        console.log('- window.fireMarkerControls.setTurbulence(0-3) // 湍流强度');
        console.log('- window.fireMarkerControls.setSparkle(0-1) // 火星效果');
        console.log('');
        console.log('🎨 快速预设:');
        console.log('- window.fireMarkerControls.presets.gentle() // 温和火焰');
        console.log('- window.fireMarkerControls.presets.wild() // 狂野火焰');
        console.log('- window.fireMarkerControls.presets.mystical() // 神秘火焰');
        console.log('- window.fireMarkerControls.presets.windy() // 风中火焰');
        console.log('');
        console.log('🎭 动态演示:');
        console.log('- window.fireMarkerControls.demo.windDemo() // 风向变化演示');
        console.log('- window.fireMarkerControls.demo.pulseDemo() // 强度脉冲演示');
        console.log('');
        console.log('🔧 工具方法:');
        console.log('- window.fireMarkerControls.dispose() // 清理火焰');
        console.log('- window.fireMarkerControls.testVisibility() // 调试可见性');
    }
    
    return fire;
}



export {
    useEngine,
    engineInitialize,
    loadBatchModels,
    loadModel,
    createPathDemo,
    createFireMarker,


    baseScene,
    engine,
    renderLoop,
    resourceReaderPlugin,
    mousePickPlugin,
    buildingControlPlugin,
    modelMarkerPlugin,
    css3dPlugin,
    floorManager,
}