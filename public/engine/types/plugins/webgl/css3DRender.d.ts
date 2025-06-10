import { THREE, BasePlugin } from "../basePlugin";
import { CSS3DRenderer, CSS3DObject } from "../../utils/three-imports";
interface CSS3DConfig {
    element: HTMLElement | string;
    position?: [number, number, number];
    rotation?: [number, number, number];
    scale?: number | [number, number, number];
    visible?: boolean;
    opacity?: number;
    zIndex?: number;
    id?: string;
    name?: string;
    userData?: any;
    interactive?: boolean;
    draggable?: boolean;
    complete?: () => void;
    onUpdate?: () => void;
    onDestroy?: () => void;
}
export declare class CSS3DRenderPlugin extends BasePlugin {
    private css3Drenderer;
    private items;
    private nextId;
    private mainScene;
    private camera;
    private domElement;
    private needsRender;
    private resizeHandler;
    private renderMode;
    private updateHandler;
    constructor(meta: any);
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
    createCSS3DObject(options: CSS3DConfig): string;
    /**
     * 标记需要重新渲染
     */
    private markNeedsRender;
    /**
     * 初始化插件
     * @description 插件初始化方法，集成到渲染循环
     */
    private initialize;
    /**
     * 设置窗口大小变化监听
     * @description 设置窗口大小变化监听
     */
    private setupResizeListener;
    /**
     * 添加CSS3D对象到场景
     * @param object CSS3D对象
     * @param id 对象ID
     */
    addObject(object: CSS3DObject, id?: string): string;
    /**
     * 移除CSS3D对象
     * @param id 对象ID
     */
    removeObject(id: string): boolean;
    /**
     * 清理所有对象
     */
    clearAll(): void;
    /**
     * 优化的更新方法 - 支持连续渲染和按需渲染
     */
    update(): void;
    /**
     * 设置渲染模式
     * @param mode 'continuous' | 'onDemand'
     */
    setRenderMode(mode: 'continuous' | 'onDemand'): void;
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
    createObject(options: CSS3DConfig): string;
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
     * 动画移动对象到目标位置
     * @param id 对象ID
     * @param targetPosition 目标位置 [x, y, z]
     * @param duration 动画时长（毫秒）
     * @returns 是否成功启动动画
     */
    animateMove(id: string, targetPosition: [number, number, number], duration?: number): boolean;
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
}
export {};
