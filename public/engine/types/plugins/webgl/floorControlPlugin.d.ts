import { THREE, BasePlugin } from "../basePlugin";
/**
 * 楼层状态枚举
 */
export declare enum FloorState {
    NORMAL = "NORMAL",// 正常显示状态
    EXPANDED = "EXPANDED",// 展开状态
    FOCUSED = "FOCUSED"
}
/**
 * 楼层项接口
 */
export interface FloorItem {
    group: THREE.Group;
    floorNumber: number;
    originalPosition: THREE.Vector3;
    targetPosition: THREE.Vector3;
    isVisible: boolean;
    opacity: number;
    nodeCount: number;
}
/**
 * 楼层控制配置接口
 */
export interface FloorControlConfig {
    expandDistance: number;
    animationDuration: number;
    focusOpacity: number;
    unfocusOpacity: number;
    easingFunction: string;
    showFacade: boolean;
    autoHideFacade: boolean;
}
/**
 * 楼层控制事件类型
 */
export interface FloorControlEvents {
    onExpandStart?: () => void;
    onExpandComplete?: () => void;
    onCollapseStart?: () => void;
    onCollapseComplete?: () => void;
    onFloorFocus?: (floorNumber: number) => void;
    onFloorUnfocus?: () => void;
}
/**
 * 楼层控制插件
 *
 * 功能：
 * 1. 拆分可互动楼层，并提供拆分动画（主要表现为：各个楼层在垂直方向上一层一层的展开）
 * 2. 恢复楼层原有状态（将已拆分的楼层恢复到原有状态），并恢复建筑外立面的显示
 * 3. 切换至指定楼层，并提供切换动画，切换完成时，其他楼层设置为半透明
 */
export declare class FloorControlPlugin extends BasePlugin {
    name: string;
    version: string;
    private currentState;
    private floors;
    private facadeGroup;
    private floorsGroup;
    private currentBuildingModel;
    private activeTweens;
    private focusedFloor;
    private config;
    private events;
    constructor(params?: any);
    init(coreInterface: any): Promise<void>;
    /**
     * 更新配置
     */
    updateConfig(newConfig: Partial<FloorControlConfig>): void;
    /**
     * 设置建筑模型
     */
    setBuildingModel(model: THREE.Group): boolean;
    /**
     * 初始化楼层数据
     */
    private initializeFloors;
    /**
     * 计算楼层节点数量
     */
    private countFloorNodes;
    /**
     * 展开所有楼层
     */
    expandFloors(): Promise<void>;
    /**
     * 收回楼层到原位置
     */
    collapseFloors(): Promise<void>;
    /**
     * 聚焦到指定楼层
     */
    focusOnFloor(floorNumber: number): Promise<void>;
    /**
     * 显示所有楼层（取消聚焦）
     */
    showAllFloors(): Promise<void>;
    /**
     * 设置楼层透明度
     */
    setFloorOpacity(floorNumber: number, opacity: number): void;
    /**
     * 设置外立面可见性
     */
    setFacadeVisibility(visible: boolean): void;
    /**
     * 动画化楼层位置
     */
    private animateFloorPosition;
    /**
     * 动画化楼层透明度
     */
    private animateFloorOpacity;
    /**
     * 应用楼层透明度
     */
    private applyFloorOpacity;
    /**
     * 获取缓动函数
     */
    private getEasingFunction;
    /**
     * 移除动画补间
     */
    private removeTween;
    /**
     * 停止所有动画
     */
    stopAllAnimations(): void;
    /**
     * 获取当前状态
     */
    getCurrentState(): FloorState;
    /**
     * 获取楼层信息
     */
    getFloorInfo(): {
        totalFloors: number;
        floorNumbers: number[];
        currentState: FloorState;
        focusedFloor: number | null;
        floors: {
            [key: number]: {
                floorNumber: number;
                isVisible: boolean;
                opacity: number;
                nodeCount: number;
            };
        };
    };
    /**
     * 更新动画（在渲染循环中调用）
     */
    update(): void;
    /**
     * 销毁插件
     */
    destroy(): void;
}
