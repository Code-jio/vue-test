import { THREE, BasePlugin } from "../basePlugin";
import { CSS3DRenderer, CSS3DObject } from "../../utils/three-imports";
import * as TWEEN from "@tweenjs/tween.js";
interface CSS3DConfig {
    element: HTMLElement | string;
    position: [number, number, number];
    rotation?: [number, number, number];
    scale?: number | [number, number, number];
    screenOffset?: [number, number];
    screenSpace?: boolean;
    display?: boolean;
    opacity?: number;
    zIndex?: number;
    id?: string;
    name?: string;
    userData?: any;
    draggable?: boolean;
    animatedToggle?: boolean;
    gpuAcceleration?: boolean;
    pointerEventsControl?: "auto" | "none" | "smart";
    useTransitions?: boolean;
    billboarding?: boolean;
    complete?: () => void;
    onUpdate?: () => void;
    onDestroy?: () => void;
}
interface CSS3DItem {
    id: string;
    object: CSS3DObject;
    element: HTMLElement;
}
export declare class CSS3DRenderPlugin extends BasePlugin {
    css3Drenderer: CSS3DRenderer | null;
    items: Map<string, CSS3DItem>;
    nextId: number;
    mainScene: THREE.Scene | null;
    camera: THREE.Camera;
    domElement: HTMLElement | null;
    needsRender: boolean;
    renderMode: "continuous" | "onDemand";
    enableBillboarding: boolean;
    updateHandler: (() => void) | null;
    animations: TWEEN.Group;
    _cameraPosition?: THREE.Vector3;
    _objectPosition?: THREE.Vector3;
    _lookAtQuaternion?: THREE.Quaternion;
    _tempMatrix?: THREE.Matrix4;
    _tempUp?: THREE.Vector3;
    _vector3?: THREE.Vector3;
    _screenVector?: THREE.Vector3;
    constructor(meta: any);
    /**
     * 初始化插件
     * @description 插件初始化方法，集成到渲染循环
     */
    initialize(): void;
    /**
     * 创建CSS3D对象
     * @param options 参数配置
     * @param options.element 元素
     * @param options.position 位置
     * @param options.rotation 旋转
     * @param options.scale 缩放
     * @param options.complete 完成回调
     * @param options.onUpdate 更新回调
     * @param options.onDestroy 销毁回调
     * @returns CSS3DObject
     * @description 创建CSS3D对象，并添加到CSS3D渲染器中
     */
    createCSS3DObject(options: CSS3DConfig): CSS3DObject | CSS3DConfig;
    /**
     * 标记需要重新渲染
     */
    private markNeedsRender;
    /**
     * 设置窗口大小变化监听
     * @description 设置窗口大小变化监听
     */
    private setupResizeListener;
    /**
     * 添加CSS3D对象到场景
     * @param object CSS3D对象或屏幕空间对象
     * @param id 对象ID
     */
    addObject(object: CSS3DObject, id?: string): string;
    /**
     * 移除CSS3D对象
     * @param id 对象ID
     * @param useAnimation 是否使用渐隐动画，默认为true
     */
    removeObject(id: string, useAnimation?: boolean): boolean;
    /**
     * 清理所有对象
     * @param useAnimation 是否使用渐隐动画，默认为false（批量清理通常不需要动画）
     */
    clearAll(useAnimation?: boolean): void;
    /**
     * 优化的更新方法 - 支持连续渲染和按需渲染
     */
    update(): void;
    /**
     * 让所有CSS3D对象永远朝向镜头
     * @description 通过设置对象的rotation使其始终面向相机，优化性能减少延迟
     */
    private makeAllObjectsFaceCamera;
    /**
     * 设置billboarding效果开关
     * @param enabled 是否启用billboarding效果
     */
    setBillboardingEnabled(enabled: boolean): void;
    /**
     * 获取billboarding效果状态
     * @returns 是否启用billboarding效果
     */
    isBillboardingEnabled(): boolean;
    /**
     * 更新屏幕空间对象的位置
     * @description 根据3D坐标自动转换为2D屏幕坐标更新屏幕空间DOM元素的位置
     */
    private updateScreenSpaceObjects;
    /**
     * 获取CSS3D对象的原始配置数据
     * @param id 对象ID
     * @returns 原始配置数据，如果对象不存在则返回null
     */
    getObjectConfig(id: string): CSS3DConfig | null;
    /**
     * 设置屏幕空间对象的位置
     * @param id 对象ID
     * @param worldPosition 3D世界坐标
     */
    setScreenPosition(id: string, worldPosition: [number, number, number]): boolean;
    /**
     * 检查对象是否为屏幕空间对象
     * @param id 对象ID
     * @returns 是否为屏幕空间对象
     */
    isScreenSpaceObject(id: string): boolean;
    /**
     * 设置渲染模式
     * @param mode 'continuous' | 'onDemand'
     */
    setRenderMode(mode: "continuous" | "onDemand"): void;
    /**
     * 启动渲染循环监听
     * @description 手动启动eventBus渲染循环监听
     */
    startRenderLoop(): void;
    /**
     * 停止渲染循环监听
     * @description 手动停止eventBus渲染循环监听
     */
    stopRenderLoop(): void;
    /**
     * 销毁插件
     * @description 销毁整个插件，清理所有资源
     */
    destroyPlugin(): void;
    /**
     * 获取CSS3D渲染器
     * @description 获取CSS3D渲染器
     * @returns CSS3DRenderer
     */
    getCSS3DRenderer(): CSS3DRenderer | null;
    /**
     * 创建CSS3D对象 - 兼容旧API
     * @param options 配置选项
     * @returns 对象ID
     */
    createObject(options: CSS3DConfig): CSS3DObject;
    /**
     * 移动对象到指定位置
     * @param id 对象ID
     * @param x X坐标
     * @param y Y坐标
     * @param z Z坐标
     * @returns 是否成功
     */
    moveObject(id: string, x: number, y: number, z: number): boolean;
    /**
     * 缩放对象
     * @param id 对象ID
     * @param scale 缩放比例
     * @returns 是否成功
     */
    scaleObject(id: string, scale: number): boolean;
    /**
     * 旋转对象
     * @param id 对象ID
     * @param x X轴旋转角度
     * @param y Y轴旋转角度
     * @param z Z轴旋转角度
     * @returns 是否成功
     */
    rotateObject(id: string, x: number, y: number, z: number): boolean;
    /**
     * 动画移动对象到目标位置 - 优化版本，解决卡顿问题
     * @param id 对象ID
     * @param targetPosition 目标位置 [x, y, z]
     * @param duration 动画时长（毫秒），默认为400ms减少等待时间
     * @param easing 缓动函数，默认为更快的缓动
     * @returns 是否成功启动动画
     */
    animateMove(id: string, targetPosition: [number, number, number], duration?: number, easing?: (amount: number) => number): boolean;
    /**
     * 快速移动对象到目标位置 - 无动画版本，解决卡顿问题
     * @param id 对象ID
     * @param targetPosition 目标位置 [x, y, z]
     * @returns 是否成功
     */
    moveObjectInstant(id: string, targetPosition: [number, number, number]): boolean;
    /**
     * 优化动画移动对象 - 使用更高效的动画策略
     * @param id 对象ID
     * @param targetPosition 目标位置 [x, y, z]
     * @param duration 动画时长（毫秒），默认为300ms减少等待时间
     * @param useHardwareAcceleration 是否使用硬件加速，默认为true
     * @returns 是否成功启动动画
     */
    animateMoveOptimized(id: string, targetPosition: [number, number, number], duration?: number, useHardwareAcceleration?: boolean): boolean;
    /**
     * 渲染场景 - 兼容旧API
     * @param camera 相机
     */
    render(camera: THREE.Camera): void;
    /**
     * 初始化插件 - 重写基类方法
     * @param coreInterface 核心接口
     */
    init(coreInterface?: any): Promise<void>;
    /**
     * 强制更新CSS3D对象的matrix3d变换
     * @param object CSS3D对象
     */
    private forceUpdateMatrix3D;
    /**
     * 批量更新对象样式 - 性能优化方法
     * @param updates 批量更新配置数组
     */
    batchUpdateStyles(updates: Array<{
        id: string;
        styles: Partial<{
            opacity: number;
            visibility: "visible" | "hidden";
            transform: string;
            pointerEvents: "auto" | "none";
        }>;
    }>): void;
    /**
     * 启用/禁用GPU加速
     * @param objectId 对象ID，如果为空则应用到所有对象
     * @param enable 是否启用
     */
    setGPUAcceleration(objectId?: string, enable?: boolean): void;
    /**
     * 性能监控 - 获取渲染统计信息
     * @returns 性能统计数据
     */
    getPerformanceStats(): {
        totalObjects: number;
        visibleObjects: number;
        hiddenObjects: number;
        gpuAcceleratedObjects: number;
        renderMode: string;
    };
    /**
     * 优化CSS3D对象的DOM结构
     * @param objectId 对象ID
     */
    optimizeDOMStructure(objectId: string): boolean;
    /**
     * 设置对象可见性 - 支持动画版本
     * @param object CSS3D对象
     * @param visible 是否可见
     * @param useAnimation 是否使用动画过渡，默认为true
     */
    setVisible(object: CSS3DObject, visible: boolean, useAnimation?: boolean): void;
    /**
     * 获取指针事件控制
     * @param id 对象ID
     * @returns 指针事件控制策略
     */
    getPointerEventsControl(object: CSS3DObject): "auto" | "none" | "smart";
    /**
     * 确保CSS3D对象具有正确的变换
     * @param element HTML元素
     */
    private ensureCorrectTransform;
    /**
     * 手动同步所有CSS3D对象的matrix3d变换
     * @description 当Three.js对象位置发生变化后，调用此方法确保CSS3D对象同步
     */
    syncAllMatrix3D(): void;
    /**
     * 3D世界坐标到2D屏幕空间的转换
     * @param worldPosition 3D世界坐标
     * @returns 2D屏幕坐标
     */
    worldToScreen(worldPosition: number[]): number[];
}
export {};
/**
 * 使用示例：
 *
 * // 1. 基础使用（传统offset方式）
 * const css3d1 = css3DRender.createCSS3DObject({
 *     element: '<div>测试1</div>',
 *     position: [0, 0, 0],
 *     offset: 5  // 向上偏移5个单位
 * })
 *
 * // 2. 使用新的offsetConfig（推荐）
 * const css3d2 = css3DRender.createCSS3DObject({
 *     element: '<div>测试2</div>',
 *     position: [0, 0, 0],
 *     offsetConfig: {
 *         distance: 8,
 *         direction: 'up'
 *     }
 * })
 *
 * // 3. 使用工具函数创建配置
 * const css3d3 = css3DRender.createCSS3DObject({
 *     element: '<div>测试3</div>',
 *     position: [0, 0, 0],
 *     offsetConfig: css3DRender.getOffsetConfig(10, 'right')
 * })
 *
 * // 4. 不同方向示例
 * const directions = [
 *     { dir: 'up', desc: '向上偏移' },
 *     { dir: 'down', desc: '向下偏移' },
 *     { dir: 'left', desc: '向左偏移' },
 *     { dir: 'right', desc: '向右偏移' },
 *     { dir: 'front', desc: '向前偏移' },
 *     { dir: 'back', desc: '向后偏移' },
 *     { dir: 'diagonal', desc: '对角线偏移' }
 * ]
 *
 * directions.forEach(({ dir, desc }) => {
 *     const css3d = css3DRender.createCSS3DObject({
 *         element: `<div>${desc}</div>`,
 *         position: [0, 0, 0],
 *         offsetConfig: css3DRender.getOffsetConfig(6, dir as any)
 *     })
 * })
 *
 * // 5. 动态更新偏移
 * css3DRender.updateObjectConfig('object-id', {
 *     offsetConfig: css3DRender.getOffsetConfig(12, 'front')
 * })
 */
