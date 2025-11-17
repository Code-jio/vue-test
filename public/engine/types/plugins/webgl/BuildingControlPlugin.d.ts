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
    group: THREE.Object3D;
    floorNumber: number;
    originalPosition: THREE.Vector3;
    targetPosition: THREE.Vector3;
    isVisible: boolean;
    opacity: number;
    associatedEquipment: {
        equipment: THREE.Object3D;
        equipmentName: string;
        roomCode: string;
        floorNumber: number;
    }[];
    rooms: RoomItem[];
}
export interface RoomItem {
    group: THREE.Object3D;
    roomNumber: string;
    floorNumber: number;
    originalPosition: THREE.Vector3;
    targetPosition: THREE.Vector3;
    isVisible: boolean;
    opacity: number;
    effectMarker: {}[];
    modelMarker: {}[];
    associatedEquipment: {
        equipment: THREE.Object3D;
        equipmentName: string;
        roomCode: string;
        floorNumber: number;
    }[];
}
/**
 * 楼层控制配置接口
 */
export interface FloorControlConfig {
    expandDistance: number;
    animationDuration: number;
    focusOpacity: number;
    unfocusOpacity: number;
    focusFloorStructureOpacity: boolean;
    easingFunction: string;
    showFacade: boolean;
    autoHideFacade: boolean;
    enableCameraAnimation: boolean;
    cameraAnimationDuration: number;
    cameraDistanceMultiplier: number;
    cameraMinHeight: number;
    restoreCameraOnUnfocus: boolean;
    enableEquipmentDisplayControl: boolean;
    showEquipmentOnlyInFocusedFloor: boolean;
    showAllEquipmentWhenNotFocused: boolean;
    hideAllEquipmentByDefault: boolean;
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
    onCameraAnimationStart?: (floorNumber: number) => void;
    onCameraAnimationComplete?: (floorNumber: number) => void;
    onCameraRestore?: () => void;
}
/**
 * 楼层控制插件
 *
 * 功能：
 * 1. 拆分可互动楼层，并提供拆分动画（主要表现为：各个楼层在垂直方向上一层一层的展开）
 * 2. 恢复楼层原有状态（将已拆分的楼层恢复到原有状态），并恢复建筑外立面的显示
 * 3. 切换至指定楼层，并提供切换动画，切换完成时，其他楼层设置为半透明
 */
export declare class BuildingControlPlugin extends BasePlugin {
    name: string;
    version: string;
    private currentState;
    private floors;
    private facadeGroup;
    private currentBuildingModel;
    private activeTweens;
    private focusedFloor;
    private scene;
    scenePlugin: any;
    allDevices: THREE.Object3D[];
    private facades;
    private rooms;
    private parseResult;
    private config;
    private events;
    private materialsMap;
    private cameraControls;
    private originalCameraPosition;
    private originalCameraTarget;
    private cameraAnimationTween;
    private debugMode;
    constructor(params?: any);
    init(scenePlugin?: any): Promise<void>;
    /**
     * 更新配置
     * @param config 配置对象
     * @returns 更新后的配置对象
     */
    updateConfig(config: FloorControlConfig): FloorControlConfig;
    /**
     * 设置可交互建筑模型
     * @returns 是否成功设置
     */
    setBuildingModel(): boolean;
    /**
     * 解析建筑模型
     * 内部子节点命名规则：
     * 楼层命名规则是：MAIN_BUILDING_1F、MAIN_BUILDING_2F、MAIN_BUILDING_nF。。。（数字n表示楼层）
     * 房间内部命名规则是：MAIN_BUILDING_1F_R101、MAIN_BUILDING_1F_K102。。。（某个字母+数字表示房间）
     * 外立面命名规则是：MAIN_BUILDING_MASK（名称里带有MASK字样）
     */
    parseBuildingModel(): {
        success: boolean;
        floors: Map<number, {
            floorObject: THREE.Object3D;
            floorNumber: number;
            rooms: Array<{
                roomObject: THREE.Object3D;
                roomCode: string;
            }>;
            equipments: Array<{
                equipmentObject: THREE.Object3D;
                equipmentName: string;
                roomCode: string | null;
                floorNumber: number;
                roomObject: THREE.Object3D | null;
            }>;
        }>;
        facades: THREE.Object3D[];
        statistics: {
            totalFloors: number;
            totalRooms: number;
            totalFacades: number;
            totalEquipments: number;
            unrecognizedObjects: THREE.Object3D[];
        };
        errors: string[];
    };
    /**
     * 判断是否为外立面对象
     */
    private isFacadeObject;
    /**
     * 从名称中解析楼层信息
     */
    private parseFloorFromName;
    /**
     * 从名称中解析房间信息
     */
    private parseRoomFromName;
    /**
     * 处理楼层对象
     */
    private processFloorObject;
    /**
     * 处理房间对象
     */
    private processRoomObject;
    /**
     * 验证解析结果
     */
    private validateParsingResult;
    /**
     * 生成解析报告
     */
    private generateParsingReport;
    /**
     * 获取对象的模型名称（优先从userData.modelName读取）
     */
    private getModelName;
    /**
     * 链接解析结果到插件属性（非侵入式）
     * 将parseBuildingModel的解析结果映射到插件的管理属性中，不修改原始模型结构
     */
    linkParsedStructure(): boolean;
    /**
     * 链接楼层结构（非侵入式）
     */
    private linkFloors;
    /**
     * 创建房间管理项（非侵入式）
     */
    private createRoomItems;
    /**
     * 链接外立面（非侵入式）
     */
    private linkFacades;
    /**
     * 链接房间索引（非侵入式）
     */
    private linkRooms;
    /**
     * 为房间对象提取并保存轮廓信息
     * @param roomObject 房间3D对象
     * @param roomCode 房间代码
     */
    private extractAndSaveRoomBounding;
    /**
     * 获取楼层对象（非侵入式访问）
     * @param floorNumber 楼层号
     * @returns 楼层对象，如果不存在返回null
     */
    getFloorObject(floorNumber: number): THREE.Object3D | null;
    /**
     * 获取房间对象（非侵入式访问）
     * @param roomCode 房间代码（如 "R101" 或 "1F_R101"）
     * @returns 房间对象，如果不存在返回null
     */
    getRoomObject(roomCode: string): THREE.Object3D<THREE.Object3DEventMap> | undefined;
    /**
     * 获取外立面对象列表（非侵入式访问）
     * @returns 外立面对象数组
     */
    getFacadeObjects(): THREE.Object3D[];
    /**
     * 获取指定楼层的房间列表（非侵入式访问）
     * @param floorNumber 楼层号
     * @returns 房间对象数组
     */
    getFloorRooms(floorNumber: number): THREE.Object3D[];
    /**
     * 获取完整的解析结果（只读）
     * @returns 解析结果的副本
     */
    getParseResult(): ReturnType<typeof this.parseBuildingModel> | null;
    /**
     * 检查结构是否已链接
     * @returns 是否已成功链接
     */
    isStructureLinked(): boolean;
    /**
     * 获取建筑结构概览
     * @returns 建筑结构统计信息
     */
    getBuildingOverview(): {
        isLinked: boolean;
        totalFloors: number;
        totalRooms: number;
        totalFacades: number;
        floorNumbers: number[];
        roomCodes: string[];
    };
    /**
     * 楼层展开（执行动画）
     * 将所有楼层在垂直方向上展开，其他楼层之间相互分离（具有一个渐进的补间动画）
     */
    expandFloor(): void;
    /**
     * 楼层收起（执行动画）
     * 将展开的楼层恢复到原始位置（具有一个渐进的补间动画）
     */
    collapseFloor(): void;
    /**
     * 楼层聚焦（执行动画）
     * 聚焦到指定楼层，其他楼层变为半透明.
     */
    focusFloor(floorNumber: number): void;
    /**
     * 展开所有楼层（兼容性方法，内部调用expandFloor）
     */
    expandAllFloors(): void;
    /**
     * 收起所有楼层（兼容性方法，内部调用collapseFloor）
     */
    collapseAllFloors(): void;
    /**
     * 取消楼层聚焦，恢复正常状态
     */
    unfocusAllFloors(): void;
    /**
     * 计算展开状态下所有楼层的目标位置
     */
    private calculateExpandedPositions;
    /**
     * 执行展开动画
     * 使用渐进式动画，楼层依次展开，创建视觉层次感
     */
    private executeExpandAnimation;
    /**
     * 执行收起动画
     * 使用反向渐进式动画，楼层依次收起
     */
    private executeCollapseAnimation;
    /**
     * 设置楼层聚焦时的透明度
     */
    private setFloorsOpacityForFocus;
    /**
     * 设置楼层透明度
     */
    private setFloorOpacity;
    /**
     * 设置设备透明度
     * @param equipment 设备对象
     * @param opacity 透明度值 (0-1)
     */
    private setEquipmentOpacity;
    /**
     * 设置设备显示状态（新增：设备显示控制）
     * @param equipment 设备对象
     * @param visible 是否显示
     */
    private setEquipmentVisibility;
    /**
     * 设置楼层所有设备的显示状态
     * @param floorNumber 楼层号
     * @param visible 是否显示
     */
    private setFloorEquipmentVisibility;
    /**
     * 设置所有设备的显示状态
     * @param visible 是否显示
     */
    private setAllEquipmentVisibility;
    /**
     * 设置所有设备的初始状态：顶楼设备常驻显示，其他设备隐藏
     * @param visible 是否显示
     */
    private setAllEquipmentInitializeState;
    /**
     * 根据楼层聚焦状态管理设备显示
     * @param focusedFloorNumber 聚焦的楼层号，如果为null则表示未聚焦
     */
    private manageEquipmentDisplayForFocus;
    /**
     * 初始化设备显示状态
     * 根据配置设置设备的初始显示状态
     */
    private initializeEquipmentDisplayState;
    /**
     * 设置房间透明度、显隐
     * @param room
     * @param opacity
     */
    setRoomOpacity(room: THREE.Object3D | THREE.Scene | THREE.Group, opacity: number | boolean): void;
    /**
     * 设置物体显隐
     * @param room
     * @param opacity
     */
    setObjectVisible(object: THREE.Object3D | THREE.Scene | THREE.Group, visible: boolean): void;
    /**
     * 统一的恢复透明度方法
     * @param target 3D对象
     * @param objectType 对象类型
     * @param identifier 对象标识符
     */
    private restoreObjectOpacity;
    /**
     * 恢复原始透明度（向后兼容方法）
     * @param target 3D对象
     */
    private restoreTargetOpacity;
    /**
     * 恢复所有楼层透明度
     */
    private restoreAllFloorOpacity;
    /**
     * 恢复单个楼层的原始透明度
     */
    private restoreFloorOpacity;
    /**
     * 恢复单个房间的透明度
     */
    private restoreRoomOpacity;
    /**
     * 隐藏外立面
     */
    private hideFacades;
    /**
     * 显示外立面
     */
    private showFacades;
    /**
     * 相机动画到指定楼层
     */
    private animateCameraToFloor;
    /**
     * 恢复相机位置
     */
    private restoreCameraPosition;
    /**
     * 获取缓动函数
     * @param easingFunction 缓动函数名称
     * @returns 缓动函数 默认为线性
     */
    private getEasingFunction;
    private delayedAnimationTimeouts;
    /**
     * 停止所有活动的动画
     */
    private stopAllAnimations;
    /**
     * 获取当前状态
     */
    getCurrentState(): FloorState;
    /**
     * 获取当前聚焦的楼层
     */
    getFocusedFloor(): number | null;
    /**
     * 检查指定楼层是否存在
     */
    hasFloor(floorNumber: number): boolean;
    /**
     * 获取所有楼层号
     */
    getFloorNumbers(): number[];
    /**
     * 切换楼层展开/收起状态
     * 如果当前是正常状态，则展开；如果是展开状态，则收起
     */
    toggleFloorExpansion(): void;
    /**
     * 检查是否可以执行楼层操作
     * @returns 是否可以执行操作
     */
    canPerformFloorOperation(): boolean;
    /**
     * 获取动画进度信息（用于调试）
     */
    getAnimationInfo(): {
        currentState: FloorState;
        focusedFloor: number | null;
        totalFloors: number;
        activeTweensCount: number;
        delayedTimeoutsCount: number;
    };
    /**
     * 获取材质映射状态信息（用于调试）
     */
    getMaterialMappingInfo(): {
        totalClonedMaterials: number;
        floorMaterials: number;
        roomMaterials: number;
        equipmentMaterials: number;
        materialsByType: {
            [key: string]: string[];
        };
    };
    /**
     * 验证材质映射完整性（用于调试）
     */
    validateMaterialMapping(): {
        isValid: boolean;
        issues: string[];
        statistics: {
            orphanedClones: number;
            missingOriginals: number;
            invalidKeys: number;
        };
    };
    /**
     * 关联设备模型到楼层
     * 根据命名规则自动识别和关联设备
     */
    private associateEquipmentToFloorsAndRooms;
    /**
     * 解析所有设备列表
     * 根据命名规则自动识别设备
     */
    private parseAllEquipments;
    /**
     * 获取楼层关联的设备列表
     * @param floorNumber 楼层号
     * @returns 设备对象数组
     */
    getFloorEquipment(floorNumber: number): THREE.Object3D[];
    /**
     * 获取房间关联的设备列表
     * @param roomCode 房间代码
     * @returns 设备对象数组
     */
    getRoomEquipment(roomCode: string): THREE.Object3D[];
    /**
     * 手动关联设备到楼层
     * @param equipment 设备对象
     * @param floorNumber 楼层号
     * @returns 是否关联成功
     */
    associateEquipmentToFloor(equipment: THREE.Object3D, floorNumber: number): boolean;
    /**
     * 移除楼层的设备关联
     * @param equipment 设备对象
     * @param floorNumber 楼层号
     * @returns 是否移除成功
     */
    removeEquipmentFromFloor(equipment: THREE.Object3D, floorNumber: number): boolean;
    /**
     * 设置指定设备的透明度
     * @param equipment 设备对象
     * @param opacity 透明度值 (0-1)
     */
    setEquipmentOpacityPublic(equipment: THREE.Object3D, opacity: number): void;
    /**
     * 恢复指定设备的原始透明度
     * @param equipment 设备对象
     */
    restoreEquipmentOpacityPublic(equipment: THREE.Object3D): void;
    /**
     * 手动设置指定楼层的透明度
     * @param floorNumber 楼层号
     * @param opacity 透明度值 (0-1)
     */
    setFloorOpacityPublic(floorNumber: number, opacity: number): void;
    /**
     * 手动恢复指定楼层的原始透明度
     * @param floorNumber 楼层号
     */
    restoreFloorOpacityPublic(floorNumber: number): void;
    /**
     * 手动设置指定房间的透明度
     * @param roomCode 房间代码
     * @param opacity 透明度值 (0-1)
     */
    setRoomOpacityPublic(roomCode: string, opacity: number, hideEquipment?: boolean): void;
    setObjectOpacity(object: THREE.Object3D, opacity: number, transparent?: boolean, saveOriginal?: boolean): void;
    restoreOriginalOpacity(object: THREE.Object3D, forceRestore?: boolean): void;
    /**
     * 手动恢复指定房间的原始透明度
     * @param roomCode 房间代码
     */
    restoreRoomOpacityPublic(roomCode: string): void;
    /**
     * 获取楼层和房间位置状态信息（用于调试）
     */
    getFloorAndRoomPositionInfo(): {
        floorPositions: {
            [floorNumber: number]: {
                originalPosition: THREE.Vector3;
                currentPosition: THREE.Vector3;
                targetPosition: THREE.Vector3;
                rooms: {
                    [roomCode: string]: {
                        originalPosition: THREE.Vector3;
                        currentPosition: THREE.Vector3;
                        targetPosition: THREE.Vector3;
                        hasOriginalY: boolean;
                    };
                };
            };
        };
        summary: {
            totalFloors: number;
            totalRooms: number;
            floorsWithPositionIssues: number[];
            roomsWithPositionIssues: string[];
        };
    };
    /**
     * 强制重置所有楼层和房间位置到原始状态（调试用）
     */
    forceResetAllPositions(): void;
    /**
     * 获取房间轮廓信息
     * @param roomCode 房间代码
     * @returns 房间轮廓信息，如果不存在返回null
     */
    getRoomBounding(roomCode: string): {
        vertices: Array<{
            x: number;
            y: number;
            z: number;
        }>;
        vertexCount: number;
        center: {
            x: number;
            y: number;
            z: number;
        };
        extractedAt: number;
        meshName: string;
    } | null;
    /**
     * 获取所有房间的轮廓信息
     * @returns 房间轮廓信息的映射表
     */
    getAllRoomBoundings(): Map<string, {
        vertices: Array<{
            x: number;
            y: number;
            z: number;
        }>;
        vertexCount: number;
        center: {
            x: number;
            y: number;
            z: number;
        };
        extractedAt: number;
        meshName: string;
    }>;
    /**
     * 重新提取指定房间的轮廓
     * @param roomCode 房间代码
     * @returns 是否提取成功
     */
    reextractRoomBounding(roomCode: string): object;
    /**
     * 重新提取所有房间的轮廓
     * @returns 提取成功的房间数量
     */
    reextractAllRoomBoundings(): number;
    /**
     * 获取房间轮廓提取状态概览
     * @returns 轮廓提取状态信息
     */
    getBoundingExtractionOverview(): {
        totalRooms: number;
        extractedRooms: number;
        missingBoundings: string[];
        averageVertexCount: number;
        extractionDetails: Array<{
            roomCode: string;
            hasBeenExtracted: boolean;
            vertexCount: number;
            extractedAt?: number;
            meshName?: string;
        }>;
    };
    /**
     * 公共API：手动显示指定楼层的设备
     * @param floorNumber 楼层号
     */
    showFloorEquipment(floorNumber: number): void;
    /**
     * 公共API：手动隐藏指定楼层的设备
     * @param floorNumber 楼层号
     */
    hideFloorEquipment(floorNumber: number): void;
    /**
     * 公共API：手动显示所有设备
     */
    showAllEquipment(): void;
    /**
     * 公共API：手动隐藏所有设备
     */
    hideAllEquipment(): void;
    /**
     * 公共API：手动显示指定设备
     * @param equipment 设备对象
     */
    showEquipment(equipment: THREE.Object3D): void;
    /**
     * 公共API：手动隐藏指定设备
     * @param equipment 设备对象
     */
    hideEquipment(equipment: THREE.Object3D): void;
    /**
     * 公共API：切换设备显示控制开关
     * @param enable 是否启用设备显示控制
     */
    toggleEquipmentDisplayControl(enable: boolean): void;
    /**
     * 公共API：获取设备显示状态概览
     * @returns 设备显示状态信息
     */
    getEquipmentDisplayOverview(): {
        isControlEnabled: boolean;
        totalEquipment: number;
        visibleEquipment: number;
        hiddenEquipment: number;
        equipmentByFloor: Array<{
            floorNumber: number;
            totalEquipment: number;
            visibleEquipment: number;
            hiddenEquipment: number;
        }>;
        config: {
            showEquipmentOnlyInFocusedFloor: boolean;
            showAllEquipmentWhenNotFocused: boolean;
            hideAllEquipmentByDefault: boolean;
        };
    };
    /**
     * 清理所有材质副本（在插件销毁时调用）
     */
    dispose(): void;
    /**
     * 获取房间水体轮廓信息（用于水体标注）
     * @param roomCode 房间代码
     * @returns 房间水体轮廓信息，如果不存在返回null
     */
    getRoomWaterBounding(roomCode: string): {
        vertices: Array<{
            x: number;
            y: number;
            z: number;
        }>;
        vertexCount: number;
        center: {
            x: number;
            y: number;
            z: number;
        };
        type: string;
        extractedAt: number;
        meshName: string;
    } | null;
    /**
     * 获取所有房间的水体轮廓信息
     * @returns 房间水体轮廓信息的映射表
     */
    getAllRoomWaterBoundings(): Map<string, {
        vertices: Array<{
            x: number;
            y: number;
            z: number;
        }>;
        vertexCount: number;
        center: {
            x: number;
            y: number;
            z: number;
        };
        type: string;
        extractedAt: number;
        meshName: string;
    }>;
    /**
     * 将Object3D对象添加到指定房间
     * @param roomNumber 房间号（字符串类型）
     * @param object3D Three.js的Object3D对象
     */
    addObjectToRoom(roomNumber: string, object3D: THREE.Object3D, type: string): void;
    /**
     * 将Object3D对象添加到指定设备
     * @param deviceNumber 设备号（字符串类型）
     * @param object3D Three.js的Object3D对象
     */
    addObjectToDevice(deviceNumber: string, object3D: THREE.Object3D): void;
    /**
     * 获取指定楼层的高度（以房间的地板高度为基准计算）
     * @param floorNumber 楼层号
     * @returns
     */
    getFloorHeight(floorNumber: number): number;
}
/**
 *
 *
 *
 *
 *
 * function getTopFaceVertices(cube) {
  const geometry = cube.geometry;
  const verticesArray = geometry.attributes.position.array;
  
  // 筛选Y值最大的顶点
  const maxY = Math.max(...Array.from({ length: verticesArray.length / 3 }, (_, i) => verticesArray[i * 3 + 1]));
  const topVertices = [];
  for (let i = 0; i < verticesArray.length; i += 3) {
    if (Math.abs(verticesArray[i + 1] - maxY) < 0.001) {
      topVertices.push(new THREE.Vector3(
        verticesArray[i],
        verticesArray[i + 1],
        verticesArray[i + 2]
      ));
    }
  }

  // 转换到世界坐标
  const worldVertices = topVertices.map(v => v.applyMatrix4(cube.matrixWorld).toArray());
  
  // 顶点排序（顺时针）
  const center = new THREE.Vector3();
  worldVertices.forEach(v => center.add(new THREE.Vector3(...v)));
  center.divideScalar(4);
  
  worldVertices.sort((a, b) => {
    return Math.atan2(a[2] - center.z, a[0] - center.x)
         - Math.atan2(b[2] - center.z, b[0] - center.x);
  });

  return worldVertices; // 返回轮廓顶点数组
}
 */
