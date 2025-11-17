import { THREE } from "../basePlugin";
import { SmokeParticleSystem } from "./SmokeMarker";
interface FireMarkerOptions {
    maxFireParticles: number;
    maxSmokeParticles: number;
    fireEmissionRate: number;
    smokeEmissionRate: number;
    fireLifetime: number;
    smokeLifetime: number;
    fireColorStart: THREE.Color;
    fireColorMid: THREE.Color;
    fireColorEnd: THREE.Color;
    smokeColorStart: THREE.Color;
    smokeColorEnd: THREE.Color;
    position: THREE.Vector3;
    coneAngle: number;
    coneHeight: number;
    turbulence: number;
    windForce: THREE.Vector3;
}
interface UpdateParams {
    deltaTime: number;
    elapsedTime: number;
}
/**
 * 火焰粒子系统类
 * 创建逼真的火焰燃烧效果，包含火焰源、烟雾和倒锥形扩散
 */
export declare class FireParticleSystem {
    scene: THREE.Scene;
    options: FireMarkerOptions;
    private fireParticles;
    private activeFireParticles;
    private fireGeometry;
    private firePositions;
    private fireColors;
    private fireSizes;
    private fireAlphas;
    private fireAges;
    private fireMaterial;
    private fireSystem;
    private smokeParticles;
    private activeSmokeParticles;
    private smokeGeometry;
    private smokePositions;
    private smokeColors;
    private smokeSizes;
    private smokeAlphas;
    private smokeMaterial;
    private smokeSystem;
    private clock;
    private growAnimation;
    private shrinkAnimation;
    private currentFireScale;
    private originalFireEmissionRate;
    private originalSmokeEmissionRate;
    constructor(scene: THREE.Scene, options: FireMarkerOptions);
    get visible(): boolean;
    set visible(value: boolean);
    initFireSystem(): void;
    initSmokeSystem(): void;
    emitFireParticle(): void;
    emitSmokeParticle(): void;
    update({ deltaTime }: UpdateParams): void;
    updateParticleSystem(particles: Array<{
        index: number;
        active: boolean;
        age: number;
        lifetime: number;
        position: THREE.Vector3;
        velocity: THREE.Vector3;
        color: THREE.Color;
        size: number;
        alpha: number;
    }>, positions: Float32Array, colors: Float32Array, sizes: Float32Array, alphas: Float32Array, colorStart: THREE.Color, colorMid: THREE.Color | null, colorEnd: THREE.Color | null, deltaTime: number, type: string): void;
    setPosition(position: THREE.Vector3): void;
    setEmissionRates(fireRate: number, smokeRate: number): void;
    destroy(): void;
    /**
     * 让火焰逐渐变大
     * @param {number} targetScale - 目标缩放倍数 (默认1.5)
     * @param {number} duration - 变大持续时间（秒，默认2.0）
     * @param {Function} onComplete - 完成回调函数
     */
    growFire(targetScale?: number, duration?: number, onComplete?: (() => void) | null): void;
    /**
     * 让火焰逐渐变小直到熄灭
     * @param {number} duration - 变小持续时间（秒，默认3.0）
     * @param {Function} onComplete - 完成回调函数
     */
    shrinkFire(duration?: number, onComplete?: (() => void) | null): void;
    /**
     * 重置火焰到初始状态
     */
    resetFire(): void;
    /**
     * 检查动画状态
     * @returns {Object} 动画状态信息
     */
    getAnimationStatus(): object;
    /**
     * 设置火焰强度（快捷方法）
     * @param {number} intensity - 强度系数 (0-2)
     */
    setIntensity(intensity: number): void;
}
/**
 * 火焰效果管理器
 * 提供简化的火焰效果创建接口
 */
export declare class FireEffectManager {
    scene: THREE.Scene;
    effects: Array<{
        type: string;
        effect: FireParticleSystem;
        update: (updateParams: UpdateParams) => void;
    }>;
    constructor(scene: THREE.Scene);
    createFireEffect(options?: Partial<FireMarkerOptions>): FireParticleSystem;
    removeEffect(effect: FireParticleSystem | SmokeParticleSystem): void;
    update({ deltaTime, elapsedTime }: UpdateParams): void;
    destroy(): void;
}
export {};
