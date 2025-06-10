import { THREE } from "../basePlugin";
/**
 * 地板配置接口
 */
export interface FloorConfig {
    enabled: boolean;
    type: 'water' | 'static' | 'reflection' | 'grid' | 'glow' | 'infinite' | 'none';
    size: number;
    position: [number, number, number];
    waterConfig?: {
        color: number;
        sunColor: number;
        distortionScale: number;
        textureWidth: number;
        textureHeight: number;
        alpha: number;
        time: number;
        waterNormalsUrl?: string;
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
     * 生成程序化水面法线贴图
     */
    private generateProceduralWaterNormals;
    /**
     * 水面顶点着色器
     */
    private getWaterVertexShader;
    /**
     * 水面片段着色器
     */
    private getWaterFragmentShader;
    /**
     * 创建静态贴图地板
     */
    private createStaticFloor;
    private createReflectionFloor;
    private createGridFloor;
    private createGlowFloor;
    private createInfiniteFloor;
    /**
     * 更新地板动画
     */
    updateFloor(deltaTime: number, camera?: THREE.Camera): void;
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
    switchFloorType(type: FloorConfig['type'], config: FloorConfig, renderer: THREE.WebGLRenderer): void;
    /**
     * 获取地板信息
     */
    getFloorInfo(): any;
    /**
     * 销毁管理器
     */
    destroy(): void;
}
