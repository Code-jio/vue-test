import { THREE } from "../basePlugin";
interface CloudMarkerOptions {
    position: null | number[] | THREE.Vector3;
    contour: THREE.Vector3[];
    height?: number;
    color?: number;
    threshold?: number;
    opacity?: number;
    range?: number;
    steps?: number;
}
/**
 * 云标注默认配置
 */
export declare const CloudMarkerDefaults: {
    readonly color: 7965344;
    readonly threshold: 0.25;
    readonly opacity: 0.25;
    readonly range: 0.1;
    readonly steps: 30;
    readonly position: readonly [0, 0, 0];
    readonly contour: readonly [THREE.Vector3, THREE.Vector3, THREE.Vector3, THREE.Vector3];
};
/**
 * 体积云标注类 - 快速创建和管理云标注
 */
export declare class CloudMarker {
    private options;
    private group;
    private cloudMesh;
    private material;
    private animationTime;
    texture: THREE.Texture;
    geometry: THREE.ExtrudeGeometry | THREE.BoxGeometry;
    constructor(options: CloudMarkerOptions);
    private validateOptions;
    /**
     * 创建3D纹理
     * @returns
     */
    private createTexture;
    /**
     * 创建shader材质
     * @returns
     */
    private createMaterial;
    private createMesh;
    /**
     * 创建几何体、以ExtrudeGeometry创建
     */
    private createGeometry;
    updateMaterial(camera: THREE.PerspectiveCamera): void;
    /**
     * 设置云标注颜色
     */
    setColor(color: number): void;
    /**
     * 设置不透明度
     */
    setOpacity(opacity: number): void;
    /**
     * 设置阈值
     */
    setThreshold(threshold: number): void;
    /**
     * 设置范围
     */
    setRange(range: number): void;
    /**
     * 设置渲染步数
     */
    setSteps(steps: number): void;
    /**
     * 设置云标注位置
     */
    setPosition(x: number, y: number, z: number): void;
    /**
     * 设置可见性
     */
    setVisible(visible: boolean): void;
    /**
     * 获取场景组
     */
    getGroup(): THREE.Group;
    /**
     * 销毁资源
     */
    dispose(): void;
    /**
     * 使用tween动画平滑过渡到新的云参数
     * @param params 目标参数对象
     * @param duration 动画持续时间（毫秒）
     * @param easing 缓动函数
     * @returns Promise<Tween> 返回动画实例，可用于链式调用
     */
    animateTo(params: {
        threshold?: number;
        opacity?: number;
        range?: number;
        steps?: number;
    }, duration?: number, easing?: (k: number) => number): Promise<void>;
    /**
     * 创建云参数动画序列
     * @param keyframes 关键帧数组
     * @returns Promise<void>
     */
    animateSequence(keyframes: Array<{
        threshold?: number;
        opacity?: number;
        range?: number;
        steps?: number;
        duration: number;
        easing?: (k: number) => number;
    }>): Promise<void>;
    /**
     * 停止当前正在进行的动画
     */
    stopAnimation(): void;
    /**
     * 获取当前云参数
     */
    getCurrentParams(): {
        threshold: number;
        opacity: number;
        range: number;
        steps: number;
    };
}
export {};
