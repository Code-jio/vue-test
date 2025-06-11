import { THREE } from "../basePlugin";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
export type OrbitControlOptions = {
    damping?: boolean;
    dampingFactor?: number;
    minDistance?: number;
    maxDistance?: number;
    minPolarAngle?: number;
    maxPolarAngle?: number;
    minAzimuthAngle?: number;
    maxAzimuthAngle?: number;
    maxZoom?: number;
    minZoom?: number;
    boundaryRadius?: number;
};
interface CameraFlyToOptions {
    position: THREE.Vector3;
    lookAt?: THREE.Vector3;
    duration?: number;
    delay?: number;
    autoLookAt?: boolean;
    easing?: (amount: number) => number;
    onUpdate?: () => void;
    onComplete?: () => void;
}
export declare class BaseControls {
    private control;
    private camera;
    private boundaryRadius;
    private controlLayer;
    private currentMode;
    private saved3DLimits;
    constructor(camera: THREE.PerspectiveCamera | THREE.OrthographicCamera, domElement?: HTMLElement, options?: OrbitControlOptions);
    private setupDefaultLimits;
    /**
     * 应用2D模式的控制限制
     */
    private apply2DLimits;
    /**
     * 恢复3D模式的控制限制
     */
    private apply3DLimits;
    /**
     * 切换控制器绑定的相机
     * @param newCamera 新的相机实例
     * @param mode 相机模式 '2D' 或 '3D'
     */
    switchCamera(newCamera: THREE.PerspectiveCamera | THREE.OrthographicCamera, mode: '2D' | '3D'): void;
    /**
     * 获取当前相机模式
     */
    getCurrentMode(): '2D' | '3D';
    /**
     * 设置2D模式特定的俯视角度
     * @param angle 俯视角度（弧度，默认Math.PI/2为完全俯视）
     */
    set2DViewAngle(angle?: number): void;
    /**
     * 获取控制器图层元素
     */
    getControlLayer(): HTMLElement;
    private enforceMovementBounds;
    update(): void;
    /**
     * 初始化事件监听器
     */
    initializeEventListeners(): void;
    /**
     * 获取Three.js OrbitControls实例
     */
    getControl(): OrbitControls | null;
    /**
     * 检查控制器是否已初始化且可用
     */
    isControlReady(): boolean;
    /**
     * 获取控制器详细状态信息
     */
    getControlStatus(): any;
    setBoundaryRadius(radius: number): void;
    getDistanceFromCenter(): number;
    resetToSafePosition(): void;
    setCameraPosition(x: number, y: number, z: number, targetX?: number, targetY?: number, targetZ?: number): void;
    configure(options: OrbitControlOptions): void;
    addEventListener(event: "change", callback: () => void): void;
    destroy(): void;
    /**
     * 相机平滑飞行到目标位置
     * @param options CameraFlyToOptions
     */
    cameraFlyTo(options: CameraFlyToOptions): void;
}
export {};
