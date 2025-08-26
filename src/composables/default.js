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
let waterMakerPlugin = null;
let cloudMarkerPlugin = null;

const useEngine = () => {
    try {
        engineInitialize();
    } catch (error) {
        console.error(error);
    }
};

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
                        type: "water",
                        size: 10,
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
                            waveScale: 0.5,
                        },
                    },
                    debugConfig: {
                        enabled: true,
                        gridHelper: false,
                        axesHelper: true,
                    },
                }, // 后续将userData改为config
            },
            {
                name: "ResourceReaderPlugin",
                path: "/plugins/ResourceReaderPlugin",
                supportedFormats: ["gltf", "glb"],
                pluginClass: EngineKernel.ResourceReaderPlugin,
                userData: {
                    url: "/",
                    ktx2Path: "./ktx2/",
                    enableKTX2: true,
                },
            },
        ],
    });

    baseScene = engine.getPlugin("baseScenePlugin");
    resourceReaderPlugin = engine.getPlugin("ResourceReaderPlugin");
    resourceReaderPlugin.init(baseScene.renderer);

    console.log("🔧 ResourceReaderPlugin状态:", resourceReaderPlugin);

    // 后续renderLoop 考虑集成至其他插件
    engine
        .register({
            name: "RenderLoopPlugin",
            path: "/plugins/webgl/renderLoop",
            pluginClass: EngineKernel.RenderLoop,
            userData: {
                scene: baseScene.scene,
            },
        })
        .register({
            name: "ModelMarkerPlugin",
            path: "/plugins/webgl/3DModelMarker",
            pluginClass: EngineKernel.ModelMarker,
            userData: {
                scene: baseScene.scene,
                resourceReaderPlugin: resourceReaderPlugin,
            },
        })
        .register({
            name: "SkyBoxPlugin",
            path: "/plugins/webgl/SkyBox",
            pluginClass: EngineKernel.SkyBox,
            userData: {
                scene: baseScene.scene,
                camera: baseScene.camera,
                renderer: baseScene.renderer,
                skyBoxType: EngineKernel.SkyBoxType.HDR_ENVIRONMENT,
                hdrMapPath: "./skybox/rustig_koppie_puresky_2k.hdr",
            },
        })
        .register({
            name: "CSS3DRenderPlugin",
            path: "/plugins/webgl/css3DRender",
            pluginClass: EngineKernel.CSS3DRenderPlugin,
            userData: {
                scene: baseScene.scene,
                renderer: baseScene.renderer,
                camera: baseScene.camera,
                container: document.getElementById("css3d-container"),
            },
        })
        .register({
            name: "MousePickPlugin",
            path: "/plugins/webgl/mousePickPlugin",
            pluginClass: EngineKernel.MousePickPlugin,
            userData: {
                scene: baseScene.scene,
                camera: baseScene.camera,
                renderer: baseScene.renderer,
                controller: baseScene.controlsInstance,
            },
        })
        .register({
            name: "BuildingControlPlugin",
            path: "/plugins/webgl/BuildingControlPlugin",
            pluginClass: EngineKernel.BuildingControlPlugin,
            userData: {
                floorControlConfig: {
                    expandDistance: 30,
                    animationDuration: 1500,
                    focusOpacity: 1.0,
                    unfocusOpacity: 0.3,
                    easingFunction: "Cubic.InOut",
                    showFacade: true,
                    autoHideFacade: true,
                },
                events: {
                    onExpandStart: () => {
                        console.log("🏗️ 楼层开始展开");
                    },
                    onExpandComplete: () => {
                        console.log("✅ 楼层展开完成");
                        updateFloorControlStatus();
                    },
                    onCollapseStart: () => {
                        console.log("🏗️ 楼层开始收回");
                    },
                    onCollapseComplete: () => {
                        console.log("✅ 楼层收回完成");
                        updateFloorControlStatus();
                    },
                    onFloorFocus: (floorNumber) => {
                        console.log(`🎯 聚焦到 ${floorNumber} 楼`);
                        updateFloorControlStatus();
                    },
                    onFloorUnfocus: () => {
                        console.log("👁️ 取消楼层聚焦");
                        updateFloorControlStatus();
                    },
                },
            },
        })
        .register({
            name: "WaterMakerPlugin",
            path: "/plugins/webgl/WaterMakerPlugin",
            pluginClass: EngineKernel.WaterMarkerPlugin,
            userData: {
                scenePlugin: baseScene,
            },
        })
        .register({
            name: "CloudMarkerPlugin",
            path: "/plugins/webgl/cloudMarkerPlugin",
            pluginClass: EngineKernel.CloudMarkerPlugin,
            userData: {
                scenePlugin: baseScene,
            },
        });

    // 启动渲染循环
    renderLoop = engine.getPlugin("RenderLoopPlugin");
    if (renderLoop) {
        renderLoop.initialize();
    }
    mousePickPlugin = engine.getPlugin("MousePickPlugin");
    mousePickPlugin.enabled = true;
    buildingControlPlugin = engine.getPlugin("BuildingControlPlugin");
    css3dPlugin = engine.getPlugin("CSS3DRenderPlugin");
    modelMarkerPlugin = engine.getPlugin("ModelMarkerPlugin");
    waterMakerPlugin = engine.getPlugin("WaterMakerPlugin");

    // 获取楼层管理器实例
    floorManager = baseScene.floorManager;
    cloudMarkerPlugin = engine.getPlugin("CloudMarkerPlugin");

    // 暴露水面控制方法到全局（方便调试）
    if (typeof window !== "undefined") {
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
    }

    modelMarkerPlugin.init(engine);
};

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
        const fixedPath = modelPath.replace(/\\/g, "/");
        const fullPath = fixedPath.startsWith("/") ? fixedPath : `/${fixedPath}`;

        // 加载模型
        const model = await resourceReaderPlugin.loadModelAsync(
            fullPath,
            EngineKernel.TaskPriority.MEDIUM,
            {
                timeout: 30000,
                retryCount: 1,
                category: "batch_load",
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
        if (result.status === "fulfilled" && result.value) {
            loadedModels.push(result.value);
        }
    });

    console.log(
        `批量加载完成！成功加载 ${loadedModels.length}/${modelFiles.length} 个模型`
    );
    return loadedModels;
};

// 添加模型：\public\MAN.gltf 作为3Dmodelmarker，然后执行moveByPath方法，使用modelMarkerPlugin的内置方法
const loadModel = async (url = "/MAN.gltf", options = {}) => {
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
            enableAnimations:
                options.enableAnimations !== undefined
                    ? options.enableAnimations
                    : true,
            ...options,
        };

        // 添加模型到ModelMarker
        const modelInstance = await modelMarkerPlugin.addModel(config);
        console.log("🌐 模型添加结果:", modelInstance.id, modelInstance.model);

        if (!modelInstance || !modelInstance.id) {
            throw new Error("模型添加失败，未返回有效的模型实例");
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
                    console.error("❌ 模型未加载，无法执行路径移动");
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
                    easing: "easeInOut",
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
                    ...moveOptions,
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
        z: random(min, max),
    };
};

// 快速创建演示路径动画的辅助函数
const createPathDemo = async (modelUrl = "/MAN.gltf") => {
    try {
        // 加载模型
        const modelController = await loadModel(modelUrl, {
            name: "PathDemoModel",
            position: [0, 5, 0],
            scale: [5, 5, 5], // 缩小一些便于观察
        });

        // 定义一个示例路径 - 正方形路径
        const demoPath = [];
        for (let index = 0; index < 8; index++) {
            demoPath.push(getRandomPosition());
        }

        // 启动路径动画
        const pathAnimation = modelController.moveByPath(demoPath, {
            duration: 8000,
            loop: true,
            showPath: true,
            pathLineColor: 0xff0000, // 改为红色，更容易看到
            pathLineWidth: 5, // 增加线宽，测试管道几何体
            easing: "linear",
        });

        // 将控制器暴露到全局以便调试
        if (typeof window !== "undefined") {
            window.pathDemoController = {
                model: modelController,
                animation: pathAnimation,
                stop: () => pathAnimation.stop(),
                start: () => pathAnimation.start(),
                remove: () => modelController.remove(),
            };
            console.log("🌐 路径演示控制器已暴露到全局: window.pathDemoController");
        }

        return { modelController, pathAnimation };
    } catch (error) {
        console.error("❌ 创建路径演示失败:", error);
        throw error;
    }
};

// 创建体积云标注 - 优化版
const createCloudMarker = (options = {}) => {
    if (!cloudMarkerPlugin) {
        console.error("❌ CloudMarkerPlugin not found");
        return null;
    }

    try {
        // 优化后的默认配置
        const config = {
            height: 15,
            contour: [
                new EngineKernel.THREE.Vector3(-10, 0, -10),
                new EngineKernel.THREE.Vector3(10, 0, -10),
                new EngineKernel.THREE.Vector3(10, 0, 10),
                new EngineKernel.THREE.Vector3(-10, 0, 10),
            ],
            color: 0x87ceeb,
            opacity: 0.7,
            ...options,
        };

        // 创建云标注
        const cloudMarker = cloudMarkerPlugin.createCloudMarker(config);
        console.log("☁️ 体积云标注创建成功:", cloudMarker);

        if (cloudMarker && cloudMarker.getGroup) {
            cloudMarker.getGroup().name = "cloudMarker";
        }

        return cloudMarker;
    } catch (error) {
        console.error("❌ 创建体积云标注失败:", error);
        return null;
    }
};

// 云标注管理器
const cloudManager = {
    clouds: [],

    add: (cloud) => {
        if (cloud) {
            cloudManager.clouds.push(cloud);
            return cloud;
        }
        return null;
    },

    remove: (cloud) => {
        const index = cloudManager.clouds.indexOf(cloud);
        if (index > -1) {
            if (cloud.dispose) cloud.dispose();
            cloudManager.clouds.splice(index, 1);
            return true;
        }
        return false;
    },

    clear: () => {
        cloudManager.clouds.forEach((cloud) => {
            if (cloud.dispose) cloud.dispose();
        });
        cloudManager.clouds = [];
    },

    setVisible: (visible) => {
        cloudManager.clouds.forEach((cloud) => {
            if (cloud.setVisible) cloud.setVisible(visible);
        });
    },

    setOpacity: (opacity) => {
        cloudManager.clouds.forEach((cloud) => {
            if (cloud.setOpacity) cloud.setOpacity(opacity);
        });
    },

    getCount: () => cloudManager.clouds.length,
};

// 暴露到全局的控制方法
if (typeof window !== "undefined") {
    window.cloudControls = {
        cloudManager,

        // 高级控制参数
        setCloudParameters: (params) => {
            cloudManager.clouds.forEach((cloud) => {
                if (params.density !== undefined && cloud.setDensity)
                    cloud.setDensity(params.density);
                if (params.steps !== undefined && cloud.setSteps)
                    cloud.setSteps(params.steps);
                if (params.color !== undefined && cloud.setColor)
                    cloud.setColor(params.color);
                if (params.opacity !== undefined && cloud.setOpacity)
                    cloud.setOpacity(params.opacity);
                if (params.height !== undefined && cloud.setHeight)
                    cloud.setHeight(params.height);
                if (params.position && cloud.setPosition)
                    cloud.setPosition(params.position);
            });
        },
        getCloudCount: () => cloudManager.clouds.length,
    };
}

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
        ...options,
    };

    console.log("🔥 创建 FireMarker，配置:", config);

    let fire = null;
    try {
        fire = new EngineKernel.FireMarker(config);
        console.log("🔥 FireMarker 创建成功:", fire);
    } catch (error) {
        console.error("❌ FireMarker 创建失败:", error);
        return null;
    }

    // 添加到渲染循环中进行更新
    if (renderLoop) {
        // 检查火焰对象是否有update方法
        if (typeof fire.update === "function") {
            // 使用唯一ID添加火焰更新任务
            const fireTaskId = `fire-update-${Date.now()}`;
            renderLoop.addTask(fireTaskId, () => fire.update(), 0);

            // 将任务ID保存到火焰对象中，以便后续移除
            fire.renderTaskId = fireTaskId;
            console.log("✅ 火焰更新任务已添加到渲染循环，任务ID:", fireTaskId);
        } else {
            console.error("❌ FireMarker 对象没有 update 方法");
        }
    } else {
        console.error("❌ RenderLoop 未初始化，无法添加火焰更新任务");
    }

    // 暴露控制方法到全局，方便调试
    if (typeof window !== "undefined") {
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
            setWind: (directionX, directionY, strength) =>
                fire.setWind([directionX, directionY], strength),
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
                    console.log("🔥 应用温和火焰预设");
                },
                // 狂野火焰
                wild: () => {
                    fire.setIntensity(1.0);
                    fire.setWind([0.2, 0.1], 0.5);
                    fire.setTurbulence(1.5);
                    fire.setSparkle(0.5);
                    console.log("🔥 应用狂野火焰预设");
                },
                // 神秘火焰
                mystical: () => {
                    fire.setIntensity(0.9);
                    fire.setWind([0.0, 0.0], 0.0);
                    fire.setTurbulence(2.0);
                    fire.setSparkle(0.3);
                    fire.setCoreIntensity(2.0);
                    console.log("🔥 应用神秘火焰预设");
                },
                // 风中火焰
                windy: () => {
                    fire.setIntensity(0.8);
                    fire.setWind([0.3, 0.0], 0.7);
                    fire.setTurbulence(1.2);
                    fire.setSparkle(0.4);
                    console.log("🔥 应用风中火焰预设");
                },
            },

            // 工具方法
            getConfig: () => fire.getConfig(),
            getMesh: () => fire.getMesh(),

            // 清理方法
            dispose: () => {
                if (renderLoop && fire.renderTaskId) {
                    renderLoop.removeTask(fire.renderTaskId);
                    console.log("🔥 火焰渲染任务已移除");
                }
                if (fire.dispose) {
                    fire.dispose();
                    console.log("🔥 火焰对象已清理");
                }
            },

            // 调试和测试方法
            testVisibility: () => {
                fire.setPosition([0, 15, 0]);
                fire.setVisible(true);
                fire.setIntensity(1.0);
                console.log(
                    "🔥 已强制设置位置为 [0, 15, 0]，可见性为 true，强度为 1.0"
                );
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
                        if (angle > Math.PI * 4) {
                            // 2圈后停止
                            clearInterval(interval);
                            fire.setWind([0.1, 0.05], 0.3); // 恢复默认
                            console.log("🔥 风向演示完成");
                        }
                    }, 100);
                    console.log("🔥 开始风向变化演示");
                },

                // 强度脉冲演示
                pulseDemo: () => {
                    let time = 0;
                    const interval = setInterval(() => {
                        const intensity = 0.5 + 0.5 * Math.sin(time * 0.1);
                        fire.setIntensity(intensity);
                        time++;
                        if (time > 100) {
                            // 10秒后停止
                            clearInterval(interval);
                            fire.setIntensity(1.0); // 恢复默认
                            console.log("🔥 强度脉冲演示完成");
                        }
                    }, 100);
                    console.log("🔥 开始强度脉冲演示");
                },
            },
        };
    }

    return fire;
};

// 指定轮廓的水体生成
const createWaterMarker = (options = {}) => {
    try {
        // 检查插件是否已初始化
        if (!waterMakerPlugin) {
            throw new Error("WaterMakerPlugin 未初始化");
        }

        // 参数验证
        if (
            !options.contour ||
            !Array.isArray(options.contour) ||
            options.contour.length < 3
        ) {
            throw new Error("水体轮廓必须是包含至少3个点的数组");
        }

        if (!options.height || options.height <= 0) {
            throw new Error("水体高度必须大于0");
        }

        // 转换轮廓坐标格式：{x, y, z} -> THREE.Vector3
        const contour = options.contour.map((point) => {
            if (
                typeof point !== "object" ||
                point.x === undefined ||
                point.z === undefined
            ) {
                throw new Error("轮廓点必须包含x和z坐标");
            }
            return new EngineKernel.THREE.Vector3(point.x, point.y || 0, point.z);
        });

        // 转换位置格式
        const position = options.position
            ? new EngineKernel.THREE.Vector3(
                options.position.x || 0,
                options.position.y || 0,
                options.position.z || 0
            )
            : new EngineKernel.THREE.Vector3(0, 0, 0);

        // 创建水体配置
        const waterConfig = {
            height: options.height,
            contour: contour,
            position: position,
            waterColor: options.waterColor || 0x4a90e2,
            transparency: options.transparency || 0.7,
            reflectivity: options.reflectivity || 0.8,
            flowSpeed: options.flowSpeed || 0.5,
            waveScale: options.waveScale || 1.0,
            distortionScale: options.distortionScale || 3.7,
            enableAnimation: options.enableAnimation !== false, // 默认启用动画
            refractionRatio: options.refractionRatio || 1.33,
            waterNormalsTexture: options.waterNormalsTexture,
        };

        // 使用 WaterMakerPlugin 创建水体实例
        const waterMarker = waterMakerPlugin.createWaterMarker(waterConfig);

        console.log("🌊 使用 WaterMakerPlugin 创建水体成功", {
            height: options.height,
            contourPoints: contour.length,
            position: position,
            color: `#${waterConfig.waterColor.toString(16)}`,
        });

        // 执行回调
        if (typeof options.onCreated === "function") {
            options.onCreated(waterMarker);
        }

        return waterMarker;
    } catch (error) {
        console.error("❌ 创建水体失败:", error.message);

        // 执行错误回调
        if (typeof options.onError === "function") {
            options.onError(error);
        }

        throw error;
    }
};

let smokeManager, smokeControls;

/**
 * 创建烟雾效果
 * @param {Object} options - 烟雾配置选项
 * @param {Object} options.position - 烟雾位置 {x, y, z}
 * @param {number} options.maxParticles - 最大粒子数量 (默认: 100)
 * @param {number} options.emissionRate - 发射速率 (默认: 10)
 * @param {number} options.particleSize - 粒子大小 (默认: 2.0)
 * @param {number} options.lifetime - 粒子生命周期 (默认: 5.0)
 * @param {Array} options.colorStart - 起始颜色 [r, g, b] (默认: [0.5, 0.5, 0.5])
 * @param {Array} options.colorEnd - 结束颜色 [r, g, b] (默认: [0.2, 0.2, 0.2])
 * @param {Object} options.spread - 扩散范围 {x, y, z} (默认: {x: 5, y: 2, z: 5})
 * @param {string} options.id - 烟雾效果ID (默认: 'smoke_' + 时间戳)
 * @param {Function} options.onCreated - 创建成功回调
 * @param {Function} options.onError - 创建失败回调
 * @returns {Object} 烟雾控制器对象
 */
const createSmoke = (options = {}) => {
    try {
        // 检查场景
        if (!baseScene.scene) {
            throw new Error("场景未初始化");
        }

        // 初始化烟雾管理器（如果尚未初始化）
        if (!smokeManager) {
            smokeManager = new EngineKernel.SmokeEffectManager(baseScene.scene);
            console.log("🌫️ 烟雾管理器已初始化");
        }

        // 生成唯一ID
        const id = options.id || `smoke_${Date.now()}`;

        // 转换颜色格式
        const colorStart = options.colorStart
            ? new EngineKernel.THREE.Color(...options.colorStart)
            : new EngineKernel.THREE.Color(0x888888);
        const colorEnd = options.colorEnd
            ? new EngineKernel.THREE.Color(...options.colorEnd)
            : new EngineKernel.THREE.Color(0x333333);

        // 转换位置格式
        const position = options.position
            ? new EngineKernel.THREE.Vector3(
                options.position.x || 0,
                options.position.y || 0,
                options.position.z || 0
            )
            : new EngineKernel.THREE.Vector3(0, 0, 0);

        // 转换扩散范围格式
        const spread = new EngineKernel.THREE.Vector3(
            options.spread?.x || 5,
            options.spread?.y || 2,
            options.spread?.z || 5
        );

        // 创建烟雾配置
        const smokeConfig = {
            maxParticles: options.maxParticles || 100,
            emissionRate: options.emissionRate || 10,
            particleSize: options.particleSize || 2.0,
            lifetime: options.lifetime || 5.0,
            colorStart: colorStart,
            colorEnd: colorEnd,
            position: position,
            spread: spread,
            windForce: new EngineKernel.THREE.Vector3(0.2, 0.5, 0.05),
            turbulence: 0.3,
            texturePath: "./textures/smoke1.png",
        };

        // 创建烟雾效果
        const smokeEffect = smokeManager.createSmokeEffect(id, smokeConfig);

        console.log("🌫️ 烟雾效果创建成功", {
            id: id,
            position: position,
            maxParticles: smokeConfig.maxParticles,
            emissionRate: smokeConfig.emissionRate,
        });

        // 执行创建成功回调
        if (typeof options.onCreated === "function") {
            options.onCreated(smokeEffect, id);
        }

        // 返回烟雾控制器
        return {
            id: id,
            effect: smokeEffect,
            manager: smokeManager,

            // 控制方法
            setPosition: (position) => {
                if (smokeEffect) {
                    smokeEffect.setPosition(
                        new EngineKernel.THREE.Vector3(position.x, position.y, position.z)
                    );
                }
            },

            setEmissionRate: (rate) => {
                if (smokeEffect) {
                    smokeEffect.setEmissionRate(rate);
                }
            },

            setIntensity: (intensity) => {
                if (smokeEffect) {
                    smokeEffect.setEmissionRate(intensity * 20);
                }
            },

            setColor: (colorStart, colorEnd) => {
                if (smokeEffect) {
                    smokeEffect.options.colorStart.set(colorStart);
                    smokeEffect.options.colorEnd.set(colorEnd);
                }
            },

            remove: () => {
                if (smokeManager) {
                    smokeManager.removeEffect(id);
                    console.log(`🌫️ 烟雾效果 ${id} 已移除`);
                }
            },

            getStats: () => {
                if (smokeEffect) {
                    return {
                        activeParticles: smokeEffect.getActiveParticleCount(),
                        utilization: smokeEffect.getPoolUtilization(),
                        maxParticles: smokeEffect.options.maxParticles,
                    };
                }
                return null;
            },
        };
    } catch (error) {
        console.error("❌ 创建烟雾效果失败:", error.message);

        // 执行错误回调
        if (typeof options.onError === "function") {
            options.onError(error);
        }

        throw error;
    }
};

/**
 * 烟雾控制更新方法
 * 需要在渲染循环中调用
 * @param {number} deltaTime - 时间增量（秒）
 */
const updateSmokeControls = (deltaTime = 0.016) => {
    if (!smokeManager) {
        return;
    }

    try {
        // 更新所有烟雾效果
        smokeManager.update(deltaTime);
    } catch (error) {
        console.error("❌ 更新烟雾控制失败:", error.message);
    }
};

/**
 * 烟雾预设配置
 */
const smokePresets = {
    // 工厂烟囱烟雾
    factory: {
        maxParticles: 200,
        emissionRate: 15,
        particleSize: 3.0,
        lifetime: 8.0,
        colorStart: [0.4, 0.4, 0.4],
        colorEnd: [0.1, 0.1, 0.1],
        spread: { x: 3, y: 1, z: 3 },
    },

    // 篝火烟雾
    campfire: {
        maxParticles: 150,
        emissionRate: 12,
        particleSize: 1.5,
        lifetime: 4.0,
        colorStart: [0.6, 0.5, 0.4],
        colorEnd: [0.2, 0.2, 0.2],
        spread: { x: 2, y: 1, z: 2 },
    },

    // 蒸汽烟雾
    steam: {
        maxParticles: 80,
        emissionRate: 8,
        particleSize: 1.0,
        lifetime: 3.0,
        colorStart: [0.9, 0.9, 0.9],
        colorEnd: [0.7, 0.7, 0.7],
        spread: { x: 1, y: 0.5, z: 1 },
    },

    // 爆炸烟雾
    explosion: {
        maxParticles: 300,
        emissionRate: 50,
        particleSize: 4.0,
        lifetime: 10.0,
        colorStart: [0.3, 0.3, 0.3],
        colorEnd: [0.05, 0.05, 0.05],
        spread: { x: 8, y: 4, z: 8 },
    },
};

/**
 * 使用预设创建烟雾效果
 * @param {string} presetName - 预设名称
 * @param {Object} position - 位置 {x, y, z}
 * @param {Object} options - 额外选项
 * @returns {Object} 烟雾控制器
 */
const createSmokeWithPreset = (presetName, position, options = {}) => {
    const preset = smokePresets[presetName];
    if (!preset) {
        console.error(`❌ 未知的烟雾预设: ${presetName}`);
        return null;
    }

    return createSmoke({
        ...preset,
        position: position,
        ...options,
    });
};

// 初始化烟雾管理器
const initSmokeManager = () => {
    if (!smokeManager) {
        smokeManager = new EngineKernel.SmokeEffectManager(engine.scene);
        console.log("🌫️ 烟雾管理器已初始化");
    }
};

/**
 * 烟雾效果使用示例
 */
const smokeExamples = {
    // 创建工厂烟囱烟雾
    createFactorySmoke: () => {
        return createSmokeWithPreset("factory", { x: 0, y: 10, z: 0 });
    },

    // 创建篝火烟雾
    createCampfireSmoke: () => {
        return createSmokeWithPreset("campfire", { x: 5, y: 1, z: 0 });
    },

    // 创建蒸汽烟雾
    createSteamSmoke: () => {
        return createSmokeWithPreset("steam", { x: -5, y: 2, z: 0 });
    },

    // 创建爆炸烟雾
    createExplosionSmoke: (position) => {
        return createSmokeWithPreset("explosion", position || { x: 0, y: 5, z: 0 });
    },

    // 创建自定义烟雾
    createCustomSmoke: () => {
        return createSmoke({
            position: { x: 10, y: 5, z: 0 },
            maxParticles: 120,
            emissionRate: 8,
            particleSize: 2.5,
            lifetime: 6.0,
            colorStart: [0.7, 0.6, 0.5],
            colorEnd: [0.3, 0.3, 0.3],
            spread: { x: 4, y: 2, z: 4 },
        });
    },
};

/**
 * 烟雾控制面板数据
 */
const smokeControlData = {
    activeSmokes: {},
    globalIntensity: 1.0,
    windForce: { x: 0.2, y: 0.5, z: 0.05 },

    // 添加烟雾到控制面板
    addSmoke: (id, controller) => {
        smokeControlData.activeSmokes[id] = controller;
        console.log(`🌫️ 烟雾 ${id} 已添加到控制面板`);
    },

    // 从控制面板移除烟雾
    removeSmoke: (id) => {
        if (smokeControlData.activeSmokes[id]) {
            delete smokeControlData.activeSmokes[id];
            console.log(`🌫️ 烟雾 ${id} 已从控制面板移除`);
        }
    },

    // 设置全局强度
    setGlobalIntensity: (intensity) => {
        smokeControlData.globalIntensity = Math.max(0, Math.min(2, intensity));
        Object.values(smokeControlData.activeSmokes).forEach((controller) => {
            controller.setIntensity(smokeControlData.globalIntensity);
        });
    },

    // 设置全局风向
    setWindForce: (windForce) => {
        smokeControlData.windForce = windForce;
        // 应用到所有烟雾效果
        Object.values(smokeControlData.activeSmokes).forEach((controller) => {
            if (controller.effect && controller.effect.setWindForce) {
                controller.effect.setWindForce(
                    new EngineKernel.THREE.Vector3(windForce.x, windForce.y, windForce.z)
                );
            }
        });
    },
};

/**
 * 渲染循环中的烟雾更新
 * 需要在主渲染循环中调用
 */
const updateSmokeInRenderLoop = () => {
    if (engine && engine.clock) {
        const deltaTime = engine.clock.getDelta();
        updateSmokeControls(deltaTime);
    }
};

export {
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
    initSmokeManager,
    updateSmokeInRenderLoop,
    smokeExamples,
    smokeControlData,
    smokeControls,
    baseScene,
    engine,
    renderLoop,
    resourceReaderPlugin,
    mousePickPlugin,
    buildingControlPlugin,
    modelMarkerPlugin,
    css3dPlugin,
    floorManager,
    waterMakerPlugin,
};
