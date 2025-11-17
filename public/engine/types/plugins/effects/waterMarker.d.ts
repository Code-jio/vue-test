import { THREE } from "../basePlugin";
interface UpdateParams {
    deltaTime: number;
    elapsedTime: number;
}
interface WaterMarkerOptions {
    height: number;
    contour: THREE.Vector3[];
    position?: THREE.Vector3 | null;
    waterColor?: number;
    transparency?: number;
    reflectivity?: number;
    refractionRatio?: number;
    flowSpeed?: number;
    waveScale?: number;
    distortionScale?: number;
    enableAnimation?: boolean;
    waterNormalsTexture?: string;
}
export declare class WaterMarker {
    private options;
    private group;
    private waterMesh;
    private waterMaterial;
    private sideMaterial;
    private animationTime;
    private scene;
    constructor(options: WaterMarkerOptions);
    get visible(): boolean;
    set visible(value: boolean);
    /**
     * 验证输入参数
     */
    private validateOptions;
    /**
     * 初始化水体
     */
    init(options: WaterMarkerOptions): void;
    /**
     * 创建材质
     */
    private createMaterials;
    /**
     * 创建水面材质（仅用于顶面）
     */
    private createWaterMaterial;
    /**
     * 创建几何体、以ExtrudeGeometry创建
     */
    private createGeometry;
    /**
     * 颜色变暗工具函数
     */
    private darkenColor;
    /**
     * 更新动画
     */
    update({ deltaTime }: UpdateParams): void;
    /**
     * 从场景移除
     */
    removeFromScene(): void;
    /**
     * 设置位置
     */
    setPosition(position: THREE.Vector3): void;
    /**
     * 获取位置
     */
    getPosition(): THREE.Vector3;
    /**
     * 设置水体颜色
     */
    setWaterColor(color: number): void;
    /**
     * 设置透明度
     */
    setTransparency(transparency: number): void;
    /**
     * 设置波浪参数
     */
    setWaveParameters(waveScale: number, distortionScale: number): void;
    /**
     * 启用/禁用动画
     */
    setAnimationEnabled(enabled: boolean): void;
    /**
     * 更新轮廓（重新生成几何体）
     */
    updateContour(newContour: THREE.Vector3[]): void;
    /**
     * 清除几何体
     */
    private clearGeometry;
    /**
     * 获取配置信息
     */
    getOptions(): WaterMarkerOptions;
    /**
     * 获取群组对象
     */
    getGroup(): THREE.Group;
    /**
     * 销毁资源
     */
    dispose(): void;
}
export {};
