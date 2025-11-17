import { THREE } from "../basePlugin";
/**
 * 地板配置接口
 */
export interface FloorConfig {
    enabled: boolean;
    type: "water" | "static" | "reflection" | "grid" | "glow" | "infinite" | "Hexgon" | "none";
    size: number;
    position: [number, number, number];
    waterConfig?: {
        textureWidth?: number;
        textureHeight?: number;
        alpha?: number;
        time?: number;
        waterColor?: number;
        color?: number;
        sunColor?: number;
        distortionScale?: number;
        waterNormalsUrl?: string;
        animationSpeed?: number;
        waveScale?: number;
    };
    staticConfig?: {
        texture?: string;
        normalMap?: string;
        roughnessMap?: string;
        metallicMap?: string;
        color: number;
        opacity: number;
        tiling: [number, number];
        roughness: number;
        metalness: number;
    };
    reflectionConfig?: {
        reflectivity: number;
        color: number;
        roughness: number;
        metalness: number;
        mixStrength: number;
    };
    gridConfig?: {
        gridSize: number;
        lineWidth: number;
        primaryColor: number;
        secondaryColor: number;
        opacity: number;
        divisions: number;
    };
    glowConfig?: {
        color: number;
        intensity: number;
        emissiveColor: number;
        emissiveIntensity: number;
        pulseSpeed: number;
    };
    infiniteConfig?: {
        followCamera: boolean;
        updateDistance: number;
        gridSize: number;
        fadeDistance: number;
    };
}
/**
 * 地板管理器类 - 负责所有地板类型的创建、更新和管理
 */
export declare class FloorManager {
    private scene;
    private floor;
    private waterUniforms;
    private reflectionRenderTarget;
    private reflectionCamera;
    private lastCameraPosition;
    private animationTime;
    hexagonFloor: any;
    constructor(scene: THREE.Scene);
    /**
     * 创建地板
     */
    createFloor(config: FloorConfig, renderer: THREE.WebGLRenderer): void;
    /**
     * 创建水面地板
     */
    private createWaterFloor;
    /**
     * 创建静态贴图地板
     */
    private createStaticFloor;
    private createReflectionFloor;
    private createGridFloor;
    private createGlowFloor;
    private createInfiniteFloor;
    private createHexgonFloor;
    /**
     * 更新地板动画
     */
    updateFloor(deltaTime: number, elapsedTime: number, camera?: THREE.Camera): void;
    /**
     * 更新反射
     */
    updateReflection(camera: THREE.Camera, renderer: THREE.WebGLRenderer): void;
    /**
     * 移除地板
     */
    removeFloor(): void;
    /**
     * 切换地板类型
     */
    switchFloorType(type: FloorConfig["type"], config: FloorConfig, renderer: THREE.WebGLRenderer): void;
    /**
     * 获取地板信息
     */
    getFloorInfo(): any;
    /**
     * 销毁管理器
     */
    destroy(): void;
}
