import { THREE, BasePlugin } from "../basePlugin";
/**
 * 粒子类型枚举
 */
export declare enum ParticleType {
    FIRE = "fire",// 火焰粒子
    SMOKE = "smoke",// 烟雾粒子
    SPARK = "spark",// 火花粒子
    MAGIC = "magic",// 魔法粒子
    WATER = "water",// 水滴粒子
    DUST = "dust",// 尘埃粒子
    CUSTOM = "custom"
}
/**
 * 粒子发射器配置接口
 */
export interface ParticleConfig {
    position: THREE.Vector3 | [number, number, number];
    maxParticles: number;
    emissionRate: number;
    particleLifetime: number;
    particleType: ParticleType;
    startColor: THREE.Color | number;
    endColor: THREE.Color | number;
    startSize: number;
    endSize: number;
    opacity: number;
    velocity: THREE.Vector3;
    acceleration: THREE.Vector3;
    velocityRandomness: number;
    angularVelocity: number;
    emissionShape: 'point' | 'sphere' | 'box' | 'cone';
    emissionRadius: number;
    emissionAngle: number;
    enableFrustumCulling: boolean;
    enableLOD: boolean;
    updateFrequency: number;
    maxDistance: number;
    billboardMode: boolean;
    renderOrder: number;
    depthWrite: boolean;
    blendMode: THREE.Blending;
    texture?: THREE.Texture;
    onParticleSpawn?: (particle: Particle) => void;
    onParticleUpdate?: (particle: Particle, deltaTime: number) => void;
    onParticleDeath?: (particle: Particle) => void;
    debugMode?: boolean;
}
/**
 * 单个粒子数据
 */
export declare class Particle {
    position: THREE.Vector3;
    velocity: THREE.Vector3;
    acceleration: THREE.Vector3;
    life: number;
    maxLife: number;
    age: number;
    size: number;
    rotation: number;
    angularVelocity: number;
    color: THREE.Color;
    opacity: number;
    isActive: boolean;
    /**
     * 重置粒子状态（对象池复用）
     */
    reset(): void;
    /**
     * 更新粒子状态
     */
    update(deltaTime: number): void;
}
/**
 * 粒子发射器主类
 */
export declare class ParticleEmitter extends BasePlugin {
    private config;
    private scene;
    private camera;
    private renderer;
    private particleSystem;
    private geometry;
    private material;
    private particles;
    private particlePool;
    private activeParticleCount;
    private positionArray;
    private colorArray;
    private sizeArray;
    private opacityArray;
    private rotationArray;
    private lastEmissionTime;
    private emissionAccumulator;
    private isEmitting;
    private startTime;
    private lastUpdateTime;
    private frameSkipCounter;
    private lodLevel;
    private updateHandler;
    constructor(meta?: any);
    /**
     * 插件初始化
     */
    init(coreInterface?: any): Promise<void>;
    /**
     * 验证配置参数
     */
    private validateConfig;
    /**
     * 初始化缓冲区
     */
    private initializeBuffers;
    /**
     * 创建粒子系统
     */
    private createParticleSystem;
    /**
     * 获取顶点着色器
     */
    private getVertexShader;
    /**
     * 获取片元着色器
     */
    private getFragmentShader;
    /**
     * 主更新函数
     */
    private update;
    /**
     * 更新LOD级别
     */
    private updateLOD;
    /**
     * 检查是否在视锥内
     */
    private isInFrustum;
    /**
     * 发射新粒子
     */
    private emitParticles;
    /**
     * 发射单个粒子
     */
    private emitSingleParticle;
    /**
     * 设置发射位置
     */
    private setEmissionPosition;
    /**
     * 设置发射速度
     */
    private setEmissionVelocity;
    /**
     * 更新所有粒子
     */
    private updateParticles;
    /**
     * 更新粒子外观
     */
    private updateParticleAppearance;
    /**
     * 终止粒子
     */
    private killParticle;
    /**
     * 从对象池获取粒子
     */
    private getParticleFromPool;
    /**
     * 将粒子返回对象池
     */
    private returnParticleToPool;
    /**
     * 更新渲染缓冲区
     */
    private updateBuffers;
    /**
     * 公共API方法
     */
    /**
     * 开始发射
     */
    startEmission(): void;
    /**
     * 停止发射
     */
    stopEmission(): void;
    /**
     * 设置发射器位置
     */
    setPosition(position: THREE.Vector3 | [number, number, number]): void;
    /**
     * 获取发射器位置
     */
    getPosition(): THREE.Vector3;
    /**
     * 设置发射速率
     */
    setEmissionRate(rate: number): void;
    /**
     * 设置最大粒子数
     */
    setMaxParticles(max: number): void;
    /**
     * 获取活跃粒子数量
     */
    getActiveParticleCount(): number;
    /**
     * 获取性能统计
     */
    getPerformanceStats(): {
        activeParticles: number;
        maxParticles: number;
        lodLevel: number;
        isEmitting: boolean;
        particleUtilization: number;
    };
    /**
     * 启用调试模式
     */
    enableDebugMode(): void;
    /**
     * 清空所有粒子
     */
    clearAllParticles(): void;
    /**
     * 销毁粒子发射器
     */
    dispose(): void;
    /**
     * 静态工厂方法
     */
    /**
     * 创建火焰粒子发射器
     */
    static createFireEmitter(config?: Partial<ParticleConfig>): ParticleConfig;
    /**
     * 创建烟雾粒子发射器
     */
    static createSmokeEmitter(config?: Partial<ParticleConfig>): ParticleConfig;
    /**
     * 创建魔法粒子发射器
     */
    static createMagicEmitter(config?: Partial<ParticleConfig>): ParticleConfig;
}
