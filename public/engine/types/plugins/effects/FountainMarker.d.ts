import * as THREE from "three";
interface Config {
    position?: {
        x: number;
        y: number;
        z: number;
    };
    maxParticles?: number;
    gravity?: number;
    direction?: {
        x: number;
        y: number;
        z: number;
    };
    initialSpeed?: number;
    spread?: number;
    particleSize?: number;
    particleLife?: number;
    emissionRate?: number;
    airResistance?: number;
    sizeDecay?: number;
    initialPosition?: {
        x: number;
        y: number;
        z: number;
    } | THREE.Vector3;
}
/**
 * 喷水粒子系统类
 * 用于创建和控制喷水特效，支持自定义方向、速度和重力
 */
export declare class FountainParticleSystem {
    scene: THREE.Scene;
    position: THREE.Vector3;
    initialPosition: THREE.Vector3;
    particles: Array<{
        index: number;
    }>;
    maxParticles: number;
    gravity: number;
    direction: THREE.Vector3;
    initialSpeed: number;
    spread: number;
    particleSize: number;
    particleLife: number;
    emissionRate: number;
    airResistance: number;
    sizeDecay: number;
    clock: THREE.Clock;
    lastEmitTime: number;
    particleGeometry: THREE.BufferGeometry;
    particleSystem: THREE.Points | undefined;
    particleMaterial: THREE.PointsMaterial | undefined;
    positions: Float32Array;
    velocities: Float32Array;
    lifetimes: Float32Array;
    startTimes: Float32Array;
    root: THREE.Group;
    config: Config;
    running: boolean;
    constructor(scene: THREE.Scene, options: Config);
    get visible(): boolean;
    set visible(value: boolean);
    /**
     * 创建粒子材质
     * 使用更真实的水材质：淡蓝色、透明度变化、大小衰减
     */
    createParticleMaterial(): void;
    /**
     * 创建粒子几何体
     * 使用BufferGeometry优化性能，预分配内存
     */
    createParticleGeometry(): void;
    /**
     * 发射新粒子
     * 当粒子数量达到上限时重用最旧的粒子
     */
    emitParticle(): void;
    /**
     * 重置粒子状态
     * 设置初始位置、速度和生命周期，添加随机变化
     * @param {number} index - 粒子索引
     */
    resetParticle(index: number): void;
    /**
     * 更新粒子系统
     * 每帧调用，处理粒子循环运动和物理模拟
     * @param {number} deltaTime - 时间增量（秒）
     */
    update({ deltaTime }: {
        deltaTime: number;
    }): void;
    /**
     * 设置喷射方向
     * @param {Object | THREE.Vector3} direction - 喷射方向向量，支持{x,y,z}对象格式
     */
    setDirection(direction: {
        x?: number;
        y?: number;
        z?: number;
    } | THREE.Vector3): void;
    /**
     * 设置粒子系统位置
     * @param {Object|THREE.Vector3} position - 位置坐标，支持{x,y,z}对象格式
     */
    setPosition(position: {
        x?: number;
        y?: number;
        z?: number;
    } | THREE.Vector3): void;
    /**
     * 设置初始喷射速度
     * @param {number} speed - 速度值（单位/秒）
     */
    setInitialSpeed(speed: number): void;
    /**
     * 设置重力加速度
     * @param {number} gravity - 重力值（向下为负）
     */
    setGravity(gravity: number): void;
    /**
     * 设置粒子大小
     * @param {number} size - 粒子大小
     */
    setParticleSize(size: number): void;
    /**
     * 设置粒子生命周期
     * @param {number} life - 生命周期（秒）
     */
    setParticleLife(life: number): void;
    /**
     * 设置发射频率
     * @param {number} rate - 每秒发射粒子数
     */
    setEmissionRate(rate: number): void;
    /**
     * 设置空气阻力
     * @param {number} resistance - 空气阻力系数（0-1，1为无阻力）
     */
    setAirResistance(resistance: number): void;
    /**
     * 设置粒子大小衰减
     * @param {number} decay - 大小衰减系数（0-1，1为不衰减）
     */
    setSizeDecay(decay: number): void;
    /**
     * 切换是否喷水
     * @param flag - 是否出水
     */
    toggleState(flag: boolean): void;
    /**
     * 批量更新配置参数
     * @param {Object} config - 配置对象，支持所有可配置参数的对象格式
     */
    updateConfig(config: Config): void;
    /**
     * 清理资源
     * 从场景中移除并释放内存
     */
    dispose(): void;
}
export {};
