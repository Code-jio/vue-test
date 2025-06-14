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
    css3dPlugin = engine.getPlugin("CSS3DRenderPlugin");
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

/**
 * 模型路径动画功能使用示例
 * 
 * 基本用法：
 * ```javascript
 * import { createModelPathAnimation } from './composables/default.js';
 * 
 * // 定义路径点
 * const pathPoints = [
 *     { x: 0, y: 0, z: 0 },
 *     { x: 10, y: 5, z: 0 },
 *     { x: 20, y: 0, z: 10 },
 *     { x: 30, y: 10, z: 5 }
 * ];
 * 
 * // 创建动画 - 模型会立即开始移动并循环
 * const model = await createModelPathAnimation(
 *     '/models/car.glb',
 *     pathPoints,
 *     {
 *         duration: 8000,
 *         showTrail: true,
 *         trailColor: 0xff0000
 *     }
 * );
 * ```
 * 
 * 配置选项：
 * - duration: 动画持续时间(毫秒)，默认5000
 * - showTrail: 是否显示轨迹线，默认true
 * - trailColor: 轨迹线颜色，默认0x00ff00(绿色)
 * - trailWidth: 轨迹线宽度，默认2
 */

// 模型路径动画功能 - 简化版本，直接开始移动并重复
const createModelPathAnimation = async (modelUrl, pathPoints, options = {}) => {
    const resourceReaderPlugin = engine.getPlugin("ResourceReaderPlugin");
    if (!resourceReaderPlugin) {
        console.error("ResourceReaderPlugin not found");
        return null;
    }

    // 默认配置
    const config = {
        duration: 5000,          // 动画持续时间(毫秒)
        showTrail: true,         // 是否显示轨迹
        trailColor: 0x00ff00,    // 轨迹颜色
        trailWidth: 2,           // 轨迹宽度
        ...options
    };

    try {
        // 1. 使用resourceReaderPlugin加载模型
        console.log(`🚀 开始加载模型: ${modelUrl}`);
        const model = await resourceReaderPlugin.loadModelAsync(
            modelUrl,
            EngineKernel.TaskPriority.HIGH,
            {
                timeout: 30000,
                retryCount: 2,
                category: 'path_animation'
            }
        );

        // 2. 添加模型到场景
        baseScene.scene.add(model);

        // 设置初始位置
        if (pathPoints.length > 0) {
            model.position.set(pathPoints[0].x, pathPoints[0].y, pathPoints[0].z);
        }

        // 3. 使用Three.js原生方法创建轨迹线
        if (config.showTrail && pathPoints.length > 1) {
            const trailGeometry = new EngineKernel.THREE.BufferGeometry();
            const trailPoints = pathPoints.map(point =>
                new EngineKernel.THREE.Vector3(point.x, point.y, point.z)
            );
            trailGeometry.setFromPoints(trailPoints);

            const trailMaterial = new EngineKernel.THREE.LineBasicMaterial({
                color: config.trailColor,
                linewidth: config.trailWidth
            });

            const trailLine = new EngineKernel.THREE.Line(trailGeometry, trailMaterial);
            baseScene.scene.add(trailLine);
        }

        // 4. 路径插值计算函数
        const interpolatePosition = (t) => {
            if (pathPoints.length === 0) return new EngineKernel.THREE.Vector3();
            if (pathPoints.length === 1) return new EngineKernel.THREE.Vector3(pathPoints[0].x, pathPoints[0].y, pathPoints[0].z);

            // 计算当前应该在哪两个点之间
            const scaledT = t * (pathPoints.length - 1);
            const index = Math.floor(scaledT);
            const localT = scaledT - index;

            // 边界处理
            if (index >= pathPoints.length - 1) {
                const lastPoint = pathPoints[pathPoints.length - 1];
                return new EngineKernel.THREE.Vector3(lastPoint.x, lastPoint.y, lastPoint.z);
            }

            // 线性插值
            const point1 = pathPoints[index];
            const point2 = pathPoints[index + 1];

            return new EngineKernel.THREE.Vector3(
                point1.x + (point2.x - point1.x) * localT,
                point1.y + (point2.y - point1.y) * localT,
                point1.z + (point2.z - point1.z) * localT
            );
        };

        // 5. 创建循环动画函数
        const startAnimation = () => {
            if (pathPoints.length < 2) return;

            const pathProgress = { t: 0 };

            new TWEEN.Tween(pathProgress)
                .to({ t: 1 }, config.duration)
                .easing(TWEEN.Easing.Cubic.InOut)
                .onUpdate(() => {
                    const position = interpolatePosition(pathProgress.t);
                    model.position.copy(position);
                })
                .onComplete(() => {
                    // 动画完成后立即重新开始，实现循环
                    startAnimation();
                })
                .start();
        };

        // 6. 立即开始动画
        startAnimation();

        console.log(`✅ 模型路径动画创建成功并开始移动: ${modelUrl}`);
        return model; // 返回模型对象

    } catch (error) {
        console.error(`❌ 加载模型失败: ${modelUrl}`, error);
        return null;
    }
};

// 创建一个CSS3D对象，默认隐藏，点击可交互建筑后显示
// 传入参数是一个vue组件，
// 组件的props是modelInfo
// 返回一个css3dObject

const createCSS3D = async (vueComponent, modelInfo, position = { x: 0, y: 0, z: 0 }) => {
    if (!css3dPlugin) {
        console.error("CSS3DRenderPlugin not found");
        return null;
    }

    try {
        // 创建CSS3D对象配置
        const css3dConfig = {
            element:vueComponent,
            position,
            display:true
        };

        // 使用CSS3D插件创建对象
        const css3dObject = await css3dPlugin.createCSS3DObject(css3dConfig);
        
        console.log(`✅ CSS3D对象创建成功:`, css3dObject);
        return css3dObject;

    } catch (error) {
        console.error(`❌ 创建CSS3D对象失败:`, error);
        return null;
    }
};

export {
    useEngine,
    engineInitialize,
    loadBatchModels,
    createModelPathAnimation,
    createCSS3D,


    baseScene,
    engine,
    resourceReaderPlugin,
    mousePickPlugin,
    buildingControlPlugin,
    css3dPlugin,
}