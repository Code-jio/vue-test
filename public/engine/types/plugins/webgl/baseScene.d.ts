import { THREE, BasePlugin } from '../basePlugin';
import { PipelineManager } from '../../core/pipelineManager';
import { FloorConfig, FloorManager } from './floorManager';
import { BaseControls } from './baseControl';
interface CameraState {
    position: THREE.Vector3 | {
        x: number;
        y: number;
        z: number;
    };
    lookAt: THREE.Vector3 | {
        x: number;
        y: number;
        z: number;
    };
    mode: '2D' | '3D';
    distance?: number;
    target?: THREE.Vector3 | {
        x: number;
        y: number;
        z: number;
    };
    up?: THREE.Vector3 | {
        x: number;
        y: number;
        z: number;
    };
    quaternion?: THREE.Quaternion | object;
    rotation?: THREE.Euler | object;
    fov?: number;
    aspect?: number;
    near?: number;
    far?: number;
    zoom?: number;
    left?: number;
    right?: number;
    top?: number;
    bottom?: number;
    controlsEnabled?: boolean;
    enableZoom?: boolean;
    enableRotate?: boolean;
    enablePan?: boolean;
    minDistance?: number;
    maxDistance?: number;
    minPolarAngle?: number;
    maxPolarAngle?: number;
    minAzimuthAngle?: number;
    maxAzimuthAngle?: number;
    duration?: number;
    easing?: (amount: number) => number;
    onUpdate?: () => void;
    onComplete?: () => void;
}
interface CameraFlyToOptions {
    position?: {
        x: number;
        y: number;
        z: number;
    };
    lookAt?: {
        x: number;
        y: number;
        z: number;
    };
    duration?: number;
    enableLookAt?: boolean;
    rotation?: {
        pitch: number;
        yaw: number;
        roll: number;
    };
    easing?: (amount: number) => number;
    onStart?: () => void;
    onUpdate?: () => void;
    onComplete?: () => void;
}
interface UpdateParams {
    deltaTime: number;
    elapsedTime: number;
}
export declare class BaseScene extends BasePlugin {
    camera: THREE.PerspectiveCamera | THREE.OrthographicCamera;
    aspectRatio: number;
    scene: THREE.Scene;
    renderer: THREE.WebGLRenderer;
    pipelineManager: PipelineManager;
    controls: BaseControls | null;
    cameraConfig: {
        perspectiveCamera: THREE.PerspectiveCamera;
        orthographicCamera: THREE.OrthographicCamera;
        currentMode: '2D' | '3D';
        switchAnimationDuration: number;
    };
    cameraOption: {
        lookAt: number[];
        position: number[];
        type: "perspective" | "orthographic";
        fov: number;
        far: number;
        near: number;
    };
    floorManager: FloorManager;
    floorConfig: FloorConfig;
    debugConfig: {
        enabled: boolean;
        gridHelper: boolean;
        axesHelper: boolean;
        gridSize: number;
        gridDivisions: number;
        axesSize: number;
    };
    debugHelpers: {
        gridHelper: THREE.GridHelper | null;
        axesHelper: THREE.AxesHelper | null;
    };
    _flyTween: any;
    orthographicCamera: THREE.OrthographicCamera | null;
    perspectiveCamera: THREE.PerspectiveCamera | null;
    lastCameraState: {
        position: THREE.Vector3;
        quaternion: THREE.Quaternion;
    } | null;
    constructor(meta: any);
    /**
     * 初始化控制器系统
     */
    private initializeControls;
    /**
     * 初始化双相机系统
     */
    private initializeDualCameraSystem;
    initialize(): void;
    /**
     * 更新渲染器尺寸
     * @param width 窗口宽度
     * @param height 窗口高度
     */
    updateRendererSize(width?: number, height?: number): void;
    /**
     * 处理窗口 resize 事件
     * @param width 窗口宽度
     * @param height 窗口高度
     */
    handleResize(width?: number, height?: number): void;
    /**
     * 访问器方法
     */
    get sceneInstance(): THREE.Scene;
    get cameraInstance(): THREE.Camera;
    get rendererInstance(): THREE.WebGLRenderer;
    get controlsInstance(): BaseControls | null;
    destroy(): void;
    update({ deltaTime, elapsedTime }: UpdateParams): void;
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
    setupLight(): void;
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
     * @param options 相机飞行配置参数或相机状态对象
     */
    cameraFlyTo(options: CameraFlyToOptions | CameraState): void;
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
    getCameraState(): CameraState;
    setCameraState(state: any): void;
    /**
     * 恢复相机状态（带动画）
     * 这是 cameraFlyTo 的便捷封装，专门用于恢复之前保存的相机状态
     * @param state 要恢复的相机状态
     * @param duration 动画时长（可选，默认使用状态中的duration或2000ms）
     */
    restoreCameraState(state: CameraState, duration?: number): void;
    /**
     * 计算视野匹配的正交相机参数
     * 根据透视相机的FOV和距离计算正交相机应有的视锥体大小
     * @param perspectiveCamera 透视相机
     * @param distance 相机到目标的距离
     * @returns 正交相机的视锥体参数
     */
    private calculateOrthographicFrustum;
    /**
     * 切换相机类型
     * 检查当前相机类型，如果是透视相机则切换为正交相机，反之亦然
     * 保持相机位置和朝向不变，只改变投影方式
     */
    switchCamera(): void;
    /**
     * 切换相机模式
     * @param mode 相机模式：“2D” | “3D”
     */
    switchCameraMode(mode?: string | null): Promise<string>;
    /**
     * 手动调整正交相机的缩放以匹配当前视野
     * 用于解决3D到2D切换时视野不匹配的问题
     * @param targetZoom 目标缩放值，可选，如果不提供则自动计算
     */
    adjustOrthographicZoom(targetZoom?: number): void;
    /**
     * 获取当前相机的视野信息
     * @returns 视野信息对象
     */
    getCameraViewInfo(): any;
    /**
     * 相机沿视线方向前进n个单位
     * @param distance 距离,默认为10, 负值为后退
     */
    moveForward(distance?: number): void;
    /**
     * 强制切换到2D模式（俯视正交相机）
     * @returns Promise<string> 切换结果
     */
    switchTo2D(): Promise<string>;
    /**
     * 强制切换到3D模式（透视相机）
     * @returns Promise<string> 切换结果
     */
    switchTo3D(): Promise<string>;
    /**
     * 自动切换相机模式（3D⇄2D）
     * @returns Promise<string> 切换结果
     */
    toggleCameraMode(): Promise<string>;
    /**
     * 获取当前相机模式
     * @returns "2D" | "3D"
     */
    getCameraMode(): '2D' | '3D';
    /**
     * 检查当前是否为2D模式
     * @returns boolean
     */
    is2DMode(): boolean;
    /**
     * 检查当前是否为3D模式
     * @returns boolean
     */
    is3DMode(): boolean;
    /**
     * 获取当前激活的相机对象
     * @returns THREE.Camera
     */
    getCurrentCamera(): THREE.Camera;
    /**
     * 获取2D相机的缩放值
     * @returns number | null 如果不是正交相机则返回null
     */
    get2DCameraZoom(): number | null;
    /**
     * 设置2D相机的缩放值
     * @param zoom 缩放值（大于0）
     * @returns boolean 是否设置成功
     */
    set2DCameraZoom(zoom: number): boolean;
    /**
     * 应用2D相机缩放增量
     * @param delta 缩放增量（可正可负）
     * @returns boolean 是否应用成功
     */
    apply2DCameraZoomDelta(delta: number): boolean;
    /**
     * 通过包围盒计算物体世界坐标
     * @param mesh
     * @returns
     */
    getWorldPositionByBoundingBox(mesh: THREE.Group | THREE.Mesh | THREE.Object3D): THREE.Vector3;
}
export {};
