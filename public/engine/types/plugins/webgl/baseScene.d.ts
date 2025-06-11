import { THREE, BasePlugin } from "../basePlugin";
import { FloorConfig } from "./floorManager";
import { BaseControls } from "./baseControl";
/**
 * BaseScene - 基础场景插件（增强版）
 *
 * 🏢 地板功能使用示例：
 *
 * // 1. 创建带水面地板的场景
 * const scene = BaseScene.createWithFloor('water', 20000)
 *
 * // 2. 动态切换地板类型
 * scene.setFloorType('grid')  // 切换到网格地板
 * scene.setWaterFloor(30000)  // 设置水面地板
 * scene.setStaticFloor(10000, { color: 0x654321 })  // 设置静态地板
 *
 * // 3. 使用贴图的地板
 * scene.setStaticFloorWithTexture(15000, './textures/floor.jpg')  // 单贴图地板
 * scene.setStaticFloorWithPBR(20000, {  // PBR地板
 *     diffuse: './textures/floor_diffuse.jpg',
 *     normal: './textures/floor_normal.jpg',
 *     roughness: './textures/floor_roughness.jpg',
 *     metallic: './textures/floor_metallic.jpg'
 * })
 * scene.setWaterFloorWithTexture(25000, './textures/water_normals.jpg')  // 水面法线贴图
 *
 * // 4. 配置地板参数
 * scene.updateFloorConfig({
 *     waterConfig: {
 *         color: 0x004466,
 *         distortionScale: 5.0
 *     }
 * })
 *
 * // 5. 切换地板显示
 * scene.toggleFloor(false)  // 隐藏地板
 * scene.toggleFloor(true)   // 显示地板
 *
 * // 6. 获取地板信息
 * const floorInfo = scene.getFloorInfo()
 * console.log('地板信息:', floorInfo)
 *
 * 🎥 相机切换功能使用示例：
 *
 * // 1. 2D/3D相机切换
 * scene.switchTo2D()        // 切换到2D俯视模式
 * scene.switchTo3D()        // 切换到3D透视模式
 * scene.toggleCameraMode()  // 自动切换模式
 *
 * // 2. 相机状态查询
 * const mode = scene.getCameraMode()         // 获取当前模式 '2D' 或 '3D'
 * const camera = scene.getCurrentCamera()    // 获取当前激活的相机
 *
 * // 3. 2D相机缩放控制
 * const zoom = scene.get2DCameraZoom()       // 获取2D相机缩放
 * scene.set2DCameraZoom(2.0)                 // 设置2D相机缩放
 * scene.apply2DCameraZoomDelta(0.5)          // 增加缩放增量
 *
 * 支持的地板类型：
 * - water: 水面地板（参照three.js webgl_shaders_ocean）
 * - static: 静态贴图地板（支持PBR材质）
 * - reflection: 实时反射地板
 * - grid: 网格地板（程序生成）
 * - glow: 发光地板（带脉冲动画）
 * - infinite: 无限地板（跟随相机）
 */
interface PerformanceStats {
    fps: number;
    frameTime: number;
    avgFrameTime: number;
    frameCount: number;
    objects: number;
    vertices: number;
    faces: number;
    drawCalls: number;
    triangles: number;
    points: number;
    lines: number;
    textures: number;
    geometries: number;
    programs: number;
}
interface CameraFlyToOptions {
    position: THREE.Vector3;
    lookAt?: THREE.Vector3;
    duration?: number;
    easing?: (amount: number) => number;
    onUpdate?: () => void;
    onComplete?: () => void;
}
export declare class BaseScene extends BasePlugin {
    private camera;
    private aspectRatio;
    private scene;
    private ambientLight;
    private renderer;
    private pipelineManager;
    private directionalLight;
    private controls;
    private cameraConfig;
    private floorManager;
    private floorConfig;
    private performanceMonitor;
    private rendererAdvancedConfig;
    private debugConfig;
    private debugHelpers;
    private _flyTween;
    constructor(meta: any);
    /**
     * 初始化控制器系统
     */
    private initializeControls;
    /**
     * 初始化双相机系统
     */
    private initializeDualCameraSystem;
    /**
     * 验证是否为有效的HTMLCanvasElement
     */
    private isValidCanvas;
    /**
     * 深度合并配置对象（防止循环引用）
     */
    private mergeConfigs;
    /**
     * 安全的深拷贝方法（防止循环引用）
     */
    private safeDeepClone;
    /**
     * 应用渲染器高级配置
     */
    private applyRendererAdvancedConfig;
    /**
     * 获取色调映射名称
     */
    private getToneMappingName;
    /**
     * 更新性能统计
     */
    private updatePerformanceStats;
    /**
     * 计算性能统计
     */
    private calculatePerformanceStats;
    /**
     * 计算场景统计（点线面信息）
     */
    private calculateSceneStats;
    initialize(): void;
    /**
     * 更新渲染器尺寸
     */
    private updateRendererSize;
    handleResize(): void;
    /**
     * 启用/禁用性能监控
     */
    setPerformanceMonitorEnabled(enabled: boolean): void;
    /**
     * 获取当前性能统计
     */
    getPerformanceStats(): PerformanceStats;
    /**
     * 重置性能统计
     */
    resetPerformanceStats(): void;
    /**
     * 获取渲染器配置信息
     */
    getRendererConfig(): any;
    /**
     * 更新阴影设置
     */
    setShadowEnabled(enabled: boolean): void;
    /**
     * 更新色调映射
     */
    setToneMapping(toneMapping: THREE.ToneMapping, exposure?: number): void;
    /**
     * 获取场景信息
     */
    getSceneInfo(): any;
    /**
     * 访问器方法
     */
    get sceneInstance(): THREE.Scene;
    get cameraInstance(): THREE.Camera;
    get rendererInstance(): THREE.WebGLRenderer;
    get controlsInstance(): BaseControls | null;
    get isPerformanceMonitorEnabled(): boolean;
    /**
     * 静态工厂方法 - 创建高性能场景
     */
    static createHighPerformance(customConfig?: any): BaseScene;
    /**
     * 静态工厂方法 - 创建平衡配置场景（推荐）
     */
    static createBalanced(customConfig?: any): BaseScene;
    /**
     * 静态工厂方法 - 创建高质量场景
     */
    static createHighQuality(customConfig?: any): BaseScene;
    /**
     * 静态工厂方法 - 创建开发调试场景
     */
    static createDevelopment(customConfig?: any): BaseScene;
    /**
     * 静态工厂方法 - 创建最简场景（最少配置）
     */
    static createMinimal(): BaseScene;
    /**
     * 静态工厂方法 - 创建带Debug模式的场景
     */
    static createWithDebug(preset?: string, customConfig?: any): BaseScene;
    /**
     * 静态工厂方法 - 创建带自定义地板的场景
     */
    static createWithFloor(floorType: FloorConfig['type'], floorSize?: number, customConfig?: any): BaseScene;
    /**
     * 静态工厂方法 - 创建带贴图地板的场景
     * @param floorType 地板类型
     * @param textureUrl 贴图地址
     * @param floorSize 地板大小
     * @param customConfig 自定义配置
     */
    static createWithTexturedFloor(floorType: 'static' | 'water', textureUrl: string, floorSize?: number, customConfig?: any): BaseScene;
    /**
     * 静态工厂方法 - 创建带PBR贴图地板的场景
     * @param textures PBR贴图集合
     * @param floorSize 地板大小
     * @param customConfig 自定义配置
     */
    static createWithPBRFloor(textures: {
        diffuse?: string;
        normal?: string;
        roughness?: string;
        metallic?: string;
    }, floorSize?: number, customConfig?: any): BaseScene;
    /**
     * 获取所有可用的配置预设
     */
    static getAvailablePresets(): string[];
    /**
     * 获取指定预设的详细配置
     */
    static getPresetConfig(preset: string): any;
    destroy(): void;
    update(): void;
    private addDebugHelpers;
    /**
     * 移除Debug辅助器
     */
    private removeDebugHelpers;
    /**
     * 切换Debug模式
     */
    setDebugMode(enabled: boolean): void;
    /**
     * 切换网格辅助器
     */
    toggleGridHelper(enabled?: boolean): void;
    /**
     * 切换坐标轴辅助器
     */
    toggleAxesHelper(enabled?: boolean): void;
    /**
     * 更新网格辅助器配置
     */
    updateGridConfig(size?: number, divisions?: number): void;
    /**
     * 更新坐标轴辅助器配置
     */
    updateAxesConfig(size?: number): void;
    /**
     * 获取Debug状态
     */
    getDebugStatus(): any;
    /**
     * 设置地板类型
     * @param type 地板类型
     * @param config 可选的配置参数
     */
    setFloorType(type: FloorConfig['type'], config?: Partial<FloorConfig>): void;
    /**
     * 更新地板配置
     * @param config 新的配置参数
     */
    updateFloorConfig(config: Partial<FloorConfig>): void;
    /**
     * 切换地板显示状态
     * @param enabled 是否启用地板
     */
    toggleFloor(enabled: boolean): void;
    /**
     * 获取地板信息
     */
    getFloorInfo(): any;
    /**
     * 获取当前地板配置
     */
    getFloorConfig(): FloorConfig;
    /**
     * 预设地板配置 - 水面地板
     */
    setWaterFloor(size?: number, config?: Partial<FloorConfig['waterConfig']>): void;
    /**
     * 预设地板配置 - 水面地板（带贴图）
     * @param size 地板大小
     * @param waterNormalsUrl 水面法线贴图地址
     * @param config 其他配置参数
     */
    setWaterFloorWithTexture(size: number | undefined, waterNormalsUrl: string, config?: Partial<FloorConfig['waterConfig']>): void;
    /**
     * 预设地板配置 - 静态地板
     */
    setStaticFloor(size?: number, config?: Partial<FloorConfig['staticConfig']>): void;
    /**
     * 预设地板配置 - 静态地板（带贴图）
     * @param size 地板大小
     * @param textureUrl 主贴图地址
     * @param config 其他配置参数
     */
    setStaticFloorWithTexture(size: number | undefined, textureUrl: string, config?: Partial<FloorConfig['staticConfig']>): void;
    /**
     * 预设地板配置 - PBR静态地板（完整贴图）
     * @param size 地板大小
     * @param textures 贴图集合
     * @param config 其他配置参数
     */
    setStaticFloorWithPBR(size: number | undefined, textures: {
        diffuse?: string;
        normal?: string;
        roughness?: string;
        metallic?: string;
    }, config?: Partial<FloorConfig['staticConfig']>): void;
    /**
     * 预设地板配置 - 网格地板
     */
    setGridFloor(size?: number, config?: Partial<FloorConfig['gridConfig']>): void;
    /**
     * 预设地板配置 - 反射地板
     */
    setReflectionFloor(size?: number, config?: Partial<FloorConfig['reflectionConfig']>): void;
    /**
     * 预设地板配置 - 发光地板
     */
    setGlowFloor(size?: number, config?: Partial<FloorConfig['glowConfig']>): void;
    /**
     * 预设地板配置 - 无限地板
     */
    setInfiniteFloor(size?: number, config?: Partial<FloorConfig['infiniteConfig']>): void;
    /**
     * 视角飞入
     * 平滑动画地将相机移动到目标位置并朝向目标点
     * @param options 相机飞行配置参数
     */
    cameraFlyTo(options: CameraFlyToOptions): void;
    /**
     * 判断是否应该跳过该对象（天空盒等）
     * @param object 要检查的三维对象
     * @returns 是否应该跳过
     */
    private isSkipObject;
    /**
     * 计算对象的包围盒或包围球
     * @param object 要计算边界的对象
     * @returns 包围盒信息，如果无法计算则返回null
     */
    private calculateObjectBounds;
    /**
     * 递归遍历场景，收集所有有效的包围盒
     * @param object 要遍历的对象
     * @param boundingBoxes 收集包围盒的数组
     */
    private traverseSceneForBounds;
    /**
     * 初始化视角
     * 自动计算场景中所有物体的包围盒，避开天空盒等特殊对象
     * 递归查找几何体，优先使用包围盒，备选包围球
     * 计算总包围盒和场景中心点，中心点高度设为0
     */
    initializeView(): {
        center: THREE.Vector3;
        boundingBox: THREE.Box3 | null;
        objectCount: number;
        hasValidBounds: boolean;
    };
    /**
     * 自动计算最佳相机位置并飞行过去
     * 使用等轴测视角，确保场景完整可见，注视场景中心点
     */
    autoFitScene(): void;
    getCameraState(): any;
    setCameraState(state: any): void;
}
export {};
