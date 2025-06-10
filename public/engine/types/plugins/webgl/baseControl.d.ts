import { THREE, BasePlugin } from "../basePlugin";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
export type OrbitControlPluginOptions = {
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
export declare class BaseControls extends BasePlugin {
    private control;
    private camera;
    private boundaryRadius;
    private controlLayer;
    constructor(meta: any);
    private setupDefaultLimits;
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
    configure(options: OrbitControlPluginOptions): void;
    addEventListener(event: "change", callback: () => void): void;
    destroy(): void;
    /**
     * 相机平滑飞行到目标位置
     * @param options CameraFlyToOptions
     */
    cameraFlyTo(options: CameraFlyToOptions): void;
}
export {};
