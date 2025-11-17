import * as THREE from "three";
interface UpdateParams {
    deltaTime: number;
    elapsedTime: number;
}
/**
 * 电火花粒子系统类
 * 用于创建和管理电弧和电火花粒子效果
 */
export declare class SparkParticleSystem {
    scene: THREE.Scene;
    config: any;
    camera: THREE.Camera;
    particles: any[];
    arcs: any[];
    sparkParticles: any[];
    rootGroup: THREE.Group;
    arcGroup: THREE.Group;
    sparkGroup: THREE.Group;
    clock: THREE.Clock;
    isVisible: boolean;
    isPaused: boolean;
    savedStates: Map<string, any>;
    currentStateId: string | null;
    arcMaterial: THREE.LineBasicMaterial;
    trailMaterial: THREE.LineBasicMaterial;
    sparkShaderMaterial: THREE.ShaderMaterial;
    sparkGeometry: THREE.PlaneGeometry;
    activeFlashes: any[];
    flashLight: any;
    /**
     * 构造函数
     * @param {THREE.Scene} scene - Three.js场景对象
     * @param {Object} config - 配置参数
     * @param {THREE.Camera} camera - Three.js相机对象
     */
    constructor(scene: THREE.Scene, config: any, camera: THREE.Camera);
    get visible(): boolean;
    set visible(value: boolean);
    /**
     * 初始化光源
     */
    initLight(): void;
    /**
     * 初始化电火花系统
     */
    init(): void;
    /**
     * 创建锯齿状电弧路径
     * @param {THREE.Vector3} start - 起点
     * @param {THREE.Vector3} end - 终点
     * @param {number} segments - 分段数量
     * @returns {THREE.Vector3[]} 路径点数组
     */
    createArcPath(start: THREE.Vector3, end: THREE.Vector3, segments?: number): THREE.Vector3[];
    /**
     * 发射电弧
     */
    emitArc(): void;
    /**
     * 发射电火花粒子
     */
    emitSparkParticles(startPos: THREE.Vector3, endPos: THREE.Vector3): void;
    /**
     * 创建单个点状粒子
     * @param {THREE.Vector3} startPos - 起始位置
     * @param {THREE.Vector3} baseDirection - 基础方向
     * @returns {THREE.Mesh} 粒子对象
     */
    createSparkParticle(startPos: THREE.Vector3, baseDirection: THREE.Vector3): THREE.Mesh;
    /**
     * 创建拖尾效果
     * @param {THREE.Vector3[]} points - 路径点数组
     */
    createTrail(points: THREE.Vector3[]): void;
    /**
     * 更新电弧系统
     * @param {number} deltaTime - 时间增量
     */
    update({ deltaTime }: UpdateParams): void;
    /**
     * 重置粒子系统
     */
    reset(): void;
    /**
     * 显示粒子系统
     */
    show(): void;
    /**
     * 隐藏粒子系统
     */
    hide(): void;
    /**
     * 切换显示/隐藏状态
     */
    toggleVisibility(): void;
    /**
     * 更新所有对象的可见性
     * @private
     */
    _updateVisibility(): void;
    /**
     * 暂停粒子系统
     */
    pause(): void;
    /**
     * 恢复粒子系统
     */
    resume(): void;
    /**
     * 保存当前状态
     * @param {string} stateId - 状态ID
     * @param {Object} additionalData - 额外保存的数据
     */
    saveState(stateId: string, additionalData?: object): {
        config: any;
        isVisible: boolean;
        isPaused: boolean;
        arcsCount: number;
        particlesCount: number;
        timestamp: number;
    };
    /**
     * 加载保存的状态
     * @param {string} stateId - 状态ID
     * @returns {boolean} 是否成功加载
     */
    loadState(stateId: string): boolean;
    /**
     * 获取所有保存的状态ID
     * @returns {string[]} 状态ID数组
     */
    getSavedStateIds(): string[];
    /**
     * 获取保存的状态信息
     * @param {string} stateId - 状态ID
     * @returns {Object|null} 状态信息
     */
    getStateInfo(stateId: string): object | null;
    /**
     * 删除保存的状态
     * @param {string} stateId - 状态ID
     * @returns {boolean} 是否成功删除
     */
    deleteState(stateId: string): boolean;
    /**
     * 导出所有状态到JSON
     * @returns {string} JSON字符串
     */
    exportStates(): string;
    /**
     * 从JSON导入状态
     * @param {string} jsonData - JSON字符串
     * @returns {boolean} 是否成功导入
     */
    importStates(jsonData: string): boolean;
    /**
     * 获取整体实体，包含所有电弧和火花粒子
     * @returns {THREE.Group} 包含所有元素的根实体组
     */
    getEntity(): THREE.Group;
    /**
     * 将整体实体添加到指定场景
     * @param {THREE.Scene} scene - 目标场景
     */
    addToScene(): void;
    /**
     * 从指定场景移除整体实体
     * @param {THREE.Scene} scene - 目标场景
     */
    removeFromScene(scene: THREE.Scene): void;
    /**
     * 获取当前状态摘要
     * @returns {Object} 当前状态摘要
     */
    getCurrentStateSummary(): object;
    /**
     * 获取随机电弧颜色（基于真实电弧光谱）
     * @returns {string} 随机颜色值
     */
    getRandomArcColor(): string;
    /**
     * 更新颜色配置
     * @param {string} color1 - 电弧主颜色
     * @param {string} color2 - 电弧拖尾颜色
     */
    updateColors(color1: string, color2: string): void;
    /**
     * 销毁粒子系统
     */
    dispose(): void;
    /**
     * 创建闪烁光源
     * @param {THREE.Vector3} position - 光源位置
     * @param {number} intensity - 光源强度
     * @param {number} duration - 持续时间（秒）
     */
    createFlashLight(position: THREE.Vector3, intensity: number, duration: number): THREE.PointLight | undefined;
    /**
     * 更新闪烁光源
     * @param {number} deltaTime - 时间增量
     */
    updateFlashLights(deltaTime: number): void;
    /**
     * 更新光源配置
     * @param {Object} lightConfig - 光源配置对象
     */
    updateLightConfig(lightConfig: any): void;
    /**
     * 获取当前光源配置
     * @returns {Object} 光源配置
     */
    getLightConfig(): object;
    /**
     * 手动触发一次光源闪烁
     * @param {THREE.Vector3} position - 闪烁位置（可选，默认为当前电弧位置）
     * @param {number} intensity - 闪烁强度（可选，默认为配置值）
     */
    triggerFlash(position?: THREE.Vector3 | null, intensity?: number | null): void;
}
export {};
