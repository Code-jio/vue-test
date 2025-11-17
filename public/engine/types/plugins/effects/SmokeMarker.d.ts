import { THREE } from "../basePlugin";
interface UpdateParams {
    deltaTime: number;
    elapsedTime: number;
}
/**
 * 烟雾粒子系统类
 */
export declare class SmokeParticleSystem {
    scene: THREE.Scene;
    options: {
        maxParticles: number;
        particleSize: number;
        emissionRate: number;
        lifetime: number;
        windForce: THREE.Vector3;
        turbulence: number;
        colorStart: THREE.Color;
        colorEnd: THREE.Color;
        position: THREE.Vector3;
        spread: THREE.Vector3;
        url: string;
    };
    private particles;
    private activeParticles;
    private clock;
    private emitter;
    private growAnimation;
    private shrinkAnimation;
    private currentScale;
    private originalEmissionRate;
    private geometry;
    private positions;
    private colors;
    private sizes;
    private alphas;
    private ages;
    private velocities;
    private material;
    private particleSystem;
    smokeTexture: THREE.Texture;
    constructor(scene: THREE.Scene, options?: Partial<{
        maxParticles: number;
        particleSize: number;
        emissionRate: number;
        lifetime: number;
        windForce: THREE.Vector3;
        turbulence: number;
        colorStart: THREE.Color;
        colorEnd: THREE.Color;
        position: THREE.Vector3;
        spread: THREE.Vector3;
        url: string;
    }>);
    get visible(): boolean;
    set visible(value: boolean);
    init(): void;
    emitParticle(): void;
    update({ deltaTime }: UpdateParams): void;
    setPosition(position: THREE.Vector3): void;
    setEmissionRate(rate: number): void;
    setMaxParticles(max: number): void;
    destroy(): void;
    /**
     * 让烟雾逐渐变大
     * @param {number} targetScale - 目标缩放倍数 (默认2.0)
     * @param {number} duration - 变大持续时间（秒，默认3.0）
     * @param {Function} onComplete - 完成回调函数
     */
    growSmoke(targetScale?: number, duration?: number, onComplete?: (() => void) | null): void;
    /**
     * 让烟雾逐渐变小直到消失
     * @param {number} duration - 变小持续时间（秒，默认2.0）
     * @param {Function} onComplete - 完成回调函数
     */
    shrinkSmoke(duration?: number, onComplete?: (() => void) | null): void;
    /**
     * 重置烟雾到初始状态
     */
    resetSmoke(): void;
    /**
     * 检查动画状态
     * @returns {Object} 动画状态信息
     */
    getAnimationStatus(): {
        isGrowing: boolean;
        isShrinking: boolean;
        currentScale: number;
        emissionRate: number;
    };
}
/**
 * 烟雾效果管理器
 * 提供简化的烟雾效果创建接口
 */
export declare class SmokeEffectManager {
    scene: THREE.Scene;
    effects: Array<{
        type: string;
        effect: SmokeParticleSystem;
        update: (deltaTime: any) => void;
    }>;
    constructor(scene: THREE.Scene);
    createSmokeEffect(options?: Partial<{
        maxParticles: number;
        particleSize: number;
        emissionRate: number;
        lifetime: number;
        windForce: THREE.Vector3;
        turbulence: number;
        colorStart: THREE.Color;
        colorEnd: THREE.Color;
        position: THREE.Vector3;
        spread: THREE.Vector3;
    }>): SmokeParticleSystem;
    removeEffect(effect: SmokeParticleSystem): void;
    update({ deltaTime, elapsedTime }: UpdateParams): void;
    destroy(): void;
}
declare global {
    interface Window {
        effects: Array<{
            type: string;
            update: ({ deltaTime, elapsedTime }: UpdateParams) => void;
            effect?: SmokeParticleSystem;
        }>;
    }
}
export {};
