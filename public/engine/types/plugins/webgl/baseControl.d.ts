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
export declare class BaseControls {
    control: OrbitControls;
    camera: THREE.PerspectiveCamera | THREE.OrthographicCamera;
    boundaryRadius: number;
    controlLayer: HTMLElement;
    currentMode: '2D' | '3D';
    saved3DLimits: any;
    constructor(camera: THREE.PerspectiveCamera | THREE.OrthographicCamera, domElement?: HTMLElement, options?: OrbitControlOptions);
    private setupDefaultLimits;
    /**
     * 获取控制器图层元素
     */
    getControlLayer(): HTMLElement;
    private enforceMovementBounds;
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
    setBoundaryRadius(radius: number): void;
    getDistanceFromCenter(): number;
    resetToSafePosition(): void;
    setCameraPosition(x: number, y: number, z: number, targetX?: number, targetY?: number, targetZ?: number): void;
    configure(options: OrbitControlOptions): void;
    destroy(): void;
}
