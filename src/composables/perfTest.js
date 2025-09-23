let engine = null;
let baseScene = null;
let renderLoop = null;
let resourceReaderPlugin = null;
let buildingControlPlugin = null;
let floorManager = null;
let performancePlugin = null;

const useEngine = () => {
    try {
        engineInitialize();
        window.THREE = EngineKernel.THREE;
    } catch (error) {
        console.error(error);
    }
};

// 引擎初始化
const engineInitialize = async () => {
    engine = new window.EngineKernel.BaseCore({
        pluginsParams: [
            {
                name: 'baseScenePlugin',
                path: '/plugins/scene',
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
                            waterNormalsUrl: './textures/waternormals.jpg',
                            animationSpeed: 0.3,
                            waveScale: 0.5,
                        },
                    },
                    debugConfig: {
                        enabled: true,
                        gridHelper: false,
                        axesHelper: false,
                    },
                    cameraConfig: {
                        type: 'perspective',
                        fov: 45,
                        near: 0.01,
                        far: 50000,
                        position: [57, 51, 26],
                        lookAt: [11.89, 6.39, -18],
                    },
                }, // 后续将userData改为config
            },
            {
                name: 'ResourceReaderPlugin',
                path: '/plugins/ResourceReaderPlugin',
                supportedFormats: ['gltf', 'glb'],
                pluginClass: EngineKernel.ResourceReaderPlugin,
                userData: {
                    url: '/',
                },
            },
        ],
    });

    baseScene = engine.getPlugin('baseScenePlugin');
    resourceReaderPlugin = engine.getPlugin('ResourceReaderPlugin');

    // 后续renderLoop 考虑集成至其他插件
    engine
        // 渲染循环
        .register({
            name: 'RenderLoopPlugin',
            path: '/plugins/webgl/renderLoop',
            pluginClass: EngineKernel.RenderLoop,
            userData: {
                scene: baseScene.scene,
            },
        })
        // 模型标注
        .register({
            name: 'ModelMarkerPlugin',
            path: '/plugins/webgl/3DModelMarker',
            pluginClass: EngineKernel.ModelMarker,
            userData: {
                scene: baseScene.scene,
                resourceReaderPlugin,
            },
        })
        // 建筑控件
        .register({
            name: 'BuildingControlPlugin',
            path: '/plugins/webgl/BuildingControlPlugin',
            pluginClass: EngineKernel.BuildingControlPlugin,
            userData: {
                floorControlConfig: {
                    expandDistance: 30,
                    animationDuration: 1500,
                    focusOpacity: 1.0,
                    unfocusOpacity: 0.3,
                    easingFunction: 'Cubic.InOut',
                    showFacade: true,
                    autoHideFacade: true,
                },
                events: {
                    onExpandStart: () => {
                        console.log('🏗️ 楼层开始展开');
                    },
                    onExpandComplete: () => {
                        console.log('✅ 楼层展开完成');
                    },
                    onCollapseStart: () => {
                        console.log('🏗️ 楼层开始收回');
                    },
                    onCollapseComplete: () => {
                        console.log('✅ 楼层收回完成');
                    },
                    onFloorFocus: (floorNumber) => {
                        console.log(`🎯 聚焦到 ${floorNumber} 楼`);
                    },
                    onFloorUnfocus: () => {
                        console.log('👁️ 取消楼层聚焦');
                    },
                },
            },
        })
        // 性能监视器
        .register({
            name: 'performance',
            path: '/plugins/webgl/performance',
            pluginClass: EngineKernel.Performance,
            userData: {},
        });

    // 启动渲染循环
    renderLoop = engine.getPlugin('RenderLoopPlugin');
    // console.log(renderLoop, 'renderLoop');
    // renderLoop.initialize(); // 构造函数中已经调用了initialize，这里不需要重复调用

    buildingControlPlugin = engine.getPlugin('BuildingControlPlugin');
    performancePlugin = engine.getPlugin('performance'); // 使用局部变量避免覆盖原生performance
    // 获取地板管理器实例
    floorManager = baseScene.floorManager;
};

export {
    useEngine,
    engineInitialize,
    buildingControlPlugin,
    floorManager,
    renderLoop,
    resourceReaderPlugin,
    baseScene,
};
