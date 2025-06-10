import { THREE, BasePlugin } from "../basePlugin";
interface Transform {
    position: THREE.Vector3;
    rotation: THREE.Euler;
    scale: THREE.Vector3;
}
interface Keyframe {
    time: number;
    transform: Transform;
    easing?: string;
}
interface PathPoint {
    position: THREE.Vector3;
    rotation?: THREE.Euler;
    duration?: number;
}
interface ModelMarkerConfig {
    modelUrl: string;
    name?: string;
    position?: Array<number> | THREE.Vector3;
    rotation?: Array<number> | THREE.Euler;
    scale?: Array<number> | THREE.Vector3;
    show?: boolean;
    autoLoad?: boolean;
    enableAnimations?: boolean;
    enableCaching?: boolean;
    optimizeGeometry?: boolean;
    enableFrustumCulling?: boolean;
    enableOcclusion?: boolean;
    lodLevels?: number[];
    onProgress?: (progress: any) => void;
    onComplete?: (model: THREE.Group) => void;
    onError?: (error: Error) => void;
    materialOverrides?: {
        [key: string]: any;
    };
    textureQuality?: 'low' | 'medium' | 'high';
}
export declare class ModelMarker extends BasePlugin {
    private scene;
    private resourceReaderPlugin;
    private modelInstances;
    private instanceIdCounter;
    private animationLoop;
    private clock;
    private enableDebugMode;
    private defaultConfig;
    constructor(meta?: any);
    /**
     * 插件初始化
     */
    init(coreInterface: any): Promise<void>;
    /**
     * 基类要求的load方法
     */
    load(): Promise<void>;
    /**
     * 设置事件监听器
     */
    private setupEventListeners;
    /**
     * 添加3D模型标记
     */
    addModel(config: ModelMarkerConfig): string;
    /**
     * 异步加载模型（不使用缓存，直接加载）
     */
    private loadModelAsync;
    /**
     * 直接加载模型（绕过缓存系统，提升性能）
     */
    private loadModelDirect;
    /**
     * 模型加载完成处理（优化版本）
     */
    private onModelLoaded;
    /**
     * 优化模型几何体
     */
    private optimizeModelGeometry;
    /**
     * 应用材质覆盖
     */
    private applyMaterialOverrides;
    /**
     * 调整纹理质量
     */
    private adjustTextureQuality;
    /**
     * 设置LOD（细节层次）
     */
    private setupLOD;
    /**
     * 为LOD简化模型
     */
    private simplifyModelForLOD;
    /**
     * 设置模型动画
     */
    private setupModelAnimations;
    /**
     * 更新阴影设置（默认关闭阴影以提高性能）
     */
    private updateShadowSettings;
    /**
     * 设置模型变换
     */
    setTransform(modelId: string, transform: Partial<Transform>): boolean;
    /**
     * 获取模型变换
     */
    getTransform(modelId: string): Transform | null;
    /**
     * 播放内置动画
     */
    playAnimation(modelId: string, animationName?: string, loop?: boolean): boolean;
    /**
     * 停止动画
     */
    stopAnimation(modelId: string, animationName?: string): boolean;
    /**
     * 创建关键帧动画
     */
    createKeyframeAnimation(modelId: string, keyframes: Keyframe[], loop?: boolean): boolean;
    /**
     * 播放关键帧动画
     */
    playKeyframeAnimation(modelId: string): boolean;
    /**
     * 创建路径动画
     */
    createPathAnimation(modelId: string, pathPoints: PathPoint[], loop?: boolean): boolean;
    /**
     * 播放路径动画
     */
    playPathAnimation(modelId: string): boolean;
    /**
     * 更新动画
     */
    private updateAnimations;
    /**
     * 更新关键帧动画
     */
    private updateKeyframeAnimation;
    /**
     * 更新路径动画
     */
    private updatePathAnimation;
    /**
     * 关键帧插值
     */
    private interpolateKeyframes;
    /**
     * 应用缓动函数
     */
    private applyEasing;
    /**
     * 显示/隐藏模型
     */
    setVisible(modelId: string, visible: boolean): boolean;
    /**
     * 移除模型
     */
    removeModel(modelId: string): boolean;
    /**
     * 清理模型资源
     */
    private disposeModelResources;
    /**
     * 获取所有模型实例
     */
    getAllModels(): {
        [key: string]: any;
    };
    /**
     * 获取模型实例详细信息
     */
    getModelInfo(modelId: string): any;
    /**
     * 估算模型内存使用量
     */
    private estimateModelMemoryUsage;
    /**
     * 批量加载模型
     */
    addModelBatch(configs: ModelMarkerConfig[]): Promise<string[]>;
    /**
     * 更新模型配置
     */
    updateModelConfig(modelId: string, newConfig: Partial<ModelMarkerConfig>): boolean;
    /**
     * 获取性能统计信息
     */
    getPerformanceStats(): {
        totalModels: number;
        loadedModels: number;
        totalVertices: number;
        totalFaces: number;
        totalTextures: number;
        estimatedMemoryMB: number;
        activeAnimations: number;
    };
    /**
     * 启动动画循环
     */
    private startAnimationLoop;
    /**
     * 停止动画循环
     */
    private stopAnimationLoop;
    /**
     * 生成模型ID
     */
    private generateModelId;
    /**
     * 从URL中提取文件名（不包含扩展名）
     */
    private extractFileNameFromUrl;
    /**
     * 递归设置模型及其子对象的名称
     */
    private setModelNamesRecursively;
    /**
     * 资源加载完成回调
     */
    private onResourceLoaded;
    /**
     * 销毁插件
     */
    dispose(): void;
}
export {};
