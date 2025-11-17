import { BasePlugin } from "../basePlugin";
import { WaterMarker } from "./waterMarker";
export declare class WaterMarkerPlugin extends BasePlugin {
    private scenePlugin;
    private waterMarker;
    constructor(meta: any);
    createWaterMarker(options: any): WaterMarker;
    /**
     * 从房间轮廓创建水体标注（便捷方法）
     * @param roomCode 房间代码
     * @param buildingControlPlugin 建筑控制插件实例
     * @param options 可选的水体配置
     * @returns 创建的水体标注实例，如果失败返回null
     */
    createWaterMarkerFromRoom(roomCode: string, buildingControlPlugin: any, options?: {
        height?: number;
        waterColor?: number;
        transparency?: number;
        reflectivity?: number;
        flowSpeed?: number;
        waveScale?: number;
        distortionScale?: number;
        enableAnimation?: boolean;
    }): WaterMarker | null;
    /**
     * 使用tween动画平滑过渡水体高度
     * @param targetHeight 目标高度值
     * @param duration 动画持续时间（毫秒）
     * @param easing 缓动函数类型，默认为线性
     * @returns Promise<void> 动画完成的Promise
     */
    animateWaterHeight(targetHeight: number, duration?: number, easing?: (k: number) => number): Promise<void>;
    /**
     * 获取当前水体高度
     * @returns 当前水体高度，如果没有水体标注则返回0
     */
    getCurrentWaterHeight(): number;
    /**
     * 批量为所有房间创建水体标注
     * @param buildingControlPlugin 建筑控制插件实例
     * @param options 可选的水体配置
     * @returns 创建成功的水体标注数量
     */
    createWaterMarkersForAllRooms(buildingControlPlugin: any, options?: {
        height?: number;
        waterColor?: number;
        transparency?: number;
        reflectivity?: number;
        flowSpeed?: number;
        waveScale?: number;
        distortionScale?: number;
        enableAnimation?: boolean;
        roomFilter?: (roomCode: string) => boolean;
    }): number;
    /**
     * 创建水面材质（仅用于顶面）
     */
    private createWaterMaterial;
}
