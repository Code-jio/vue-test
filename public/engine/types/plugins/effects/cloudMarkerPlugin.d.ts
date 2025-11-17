import { THREE, BasePlugin } from "../basePlugin";
import { CloudMarker } from "./cloudMarker";
export declare class CloudMarkerPlugin extends BasePlugin {
    private scenePlugin;
    private cloudMarkers;
    constructor(meta: any);
    /**
     * 创建体积云标注
     * @param options 云配置参数（支持光照控制、时间同步、着色器参数、动画控制）
     * @param options.height 云层高度
     * @param options.contour 云标注轮廓点集（定义云的水平形状）
     * @param options.color 云颜色
     * @param options.opacity 云透明度（支持动画）
     * @param options.steps 渲染步数（支持动画）
     * @param options.threshold 密度阈值（支持动画）
     * @param options.range 云范围（支持动画）
     */
    createCloudMarker(options: {
        height: number;
        contour: THREE.Vector3[] | number[];
        color?: number;
        opacity?: number;
        threshold?: number;
        range?: number;
        steps?: number;
    }): CloudMarker;
    /**
     * 更新所有云动画
     * @param camera 相机对象
     */
    private handleUpdate;
    /**
     * 更新所有云动画
     * @param camera 相机对象
     */
    update(camera: THREE.PerspectiveCamera): void;
    /**
     * 移除云标注
     */
    removeCloudMarker(marker: CloudMarker): void;
    /**
     * 清空所有云标注
     */
    clearAllCloudMarkers(): void;
    /**
     * 获取所有云标注
     */
    getCloudMarkers(): CloudMarker[];
    /**
     * 批量动画控制：同时对所有云执行动画
     * @param params 目标参数对象
     * @param duration 动画持续时间（毫秒）
     * @param easing 缓动函数
     */
    animateAllTo(params: {
        opacity?: number;
        threshold?: number;
        range?: number;
        steps?: number;
    }, duration?: number, easing?: (k: number) => number): Promise<void[]>;
    /**
     * 批量动画控制：对所有云执行关键帧动画序列
     * @param keyframes 关键帧数组
     */
    animateAllSequence(keyframes: Array<{
        params: {
            opacity?: number;
            threshold?: number;
            range?: number;
            steps?: number;
        };
        duration: number;
        easing?: (k: number) => number;
    }>): Promise<void[]>;
    /**
     * 停止所有云动画
     */
    stopAllAnimations(): void;
    /**
     * 获取所有云的当前参数
     */
    getAllCurrentParams(): Array<{
        opacity: number;
        threshold: number;
        range: number;
        steps: number;
    }>;
    /**
     * 根据条件查找云标注
     * @param predicate 条件函数
     */
    findCloudMarkers(predicate: (marker: CloudMarker) => boolean): CloudMarker[];
    /**
     * 对符合条件的云执行动画
     * @param predicate 条件函数
     * @param params 目标参数对象
     * @param duration 动画持续时间
     * @param easing 缓动函数
     */
    animateCloudsIf(predicate: (marker: CloudMarker) => boolean, params: {
        opacity?: number;
        threshold?: number;
        range?: number;
        steps?: number;
    }, duration?: number, easing?: (k: number) => number): Promise<void[]>;
}
