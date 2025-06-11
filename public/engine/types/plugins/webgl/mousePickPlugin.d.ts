import { BasePlugin, THREE } from "../basePlugin";
/**
 * 拾取结果管理
详细拾取信息：物体ID、世界坐标、局部坐标、UV坐标、法向量
拾取历史记录：支持撤销/重做操作
选中状态管理：高亮显示、边框效果、颜色变化
⚡ 性能优化
空间分割：使用八叉树、BSP树等加速结构
视锥裁剪：只检测可见区域内的物体
LOD支持：根据距离使用不同精度的碰撞体
异步拾取：大场景下分帧处理，避免卡顿
🎮 交互体验
拾取预览：鼠标悬停时的即时反馈
拾取滤镜：按图层、标签、类型过滤可拾取物体
拾取热键：支持键盘组合键改变拾取行为
触摸设备支持：移动端的触摸拾取
🔧 调试和可视化
debug模式：显示射线、包围盒、碰撞网格
性能监控：拾取耗时、检测物体数量统计
可视化工具：拾取区域高亮、射线可视化
🛠 配置和扩展
回调系统：拾取开始、进行中、完成、失败等事件
插件化架构：支持自定义拾取算法
配置选项：拾取精度、性能等级、效果开关
💡 高级功能
语义拾取：支持拾取物体的子组件（如模型的某个部件）
区域拾取：矩形选框、圆形选框、自由绘制选框
智能拾取：根据场景复杂度自动调整算法
批量操作：对拾取结果进行批量变换、删除等
 */
declare enum PickMode {
    SINGLE = "single",// 单选
    BOX_SELECT = "box"
}
interface PickResult {
    object: THREE.Object3D;
    point: THREE.Vector3;
    localPoint: THREE.Vector3;
    distance: number;
    face?: THREE.Face;
    faceIndex?: number;
    uv?: THREE.Vector2;
    normal?: THREE.Vector3;
    instanceId?: number;
    objectType: string;
    materialName?: string;
    geometryType?: string;
    worldMatrix: THREE.Matrix4;
    boundingBox?: THREE.Box3;
    objectList?: THREE.Object3D[];
}
interface PickConfig {
    mode: PickMode;
    tolerance: number;
    maxDistance: number;
    sortByDistance: boolean;
    includeInvisible: boolean;
    recursive: boolean;
    enableDebug: boolean;
}
/**
 * 鼠标拾取插件
 * 支持射线投射拾取、多种拾取模式、精度控制和深度排序
 */
export declare class MousePickPlugin extends BasePlugin {
    private raycaster;
    private mouse;
    private camera;
    private scene;
    private renderer;
    private controller;
    private config;
    private selectedObjects;
    private hoveredObject;
    private isBoxSelecting;
    private boxSelectArea;
    private boxSelectElement;
    private boundMouseDown;
    private boundMouseMove;
    private boundMouseUp;
    private boundKeyDown;
    private boundKeyUp;
    private debugRayLine;
    private debugEnabled;
    private isCtrlPressed;
    private isShiftPressed;
    private controllerOriginalState;
    constructor(meta: any);
    /**
     * 初始化事件监听器
     */
    private initializeEventListeners;
    /**
     * 创建框选元素
     */
    private createBoxSelectElement;
    /**
     * 鼠标按下事件处理
     */
    private handleMouseDown;
    /**
     * 鼠标移动事件处理
     */
    private handleMouseMove;
    /**
     * 鼠标抬起事件处理
     */
    private handleMouseUp;
    /**
     * 键盘按下事件处理
     */
    private handleKeyDown;
    /**
     * 键盘抬起事件处理
     */
    private handleKeyUp;
    /**
     * 更新鼠标标准化坐标
     */
    private updateMousePosition;
    /**
     * 执行射线投射拾取
     */
    private performRaycastPick;
    /**
     * 获取可拾取的物体列表
     */
    private getPickableObjects;
    /**
     * 过滤交点结果
     */
    private filterIntersections;
    /**
     * 处理拾取结果
     */
    private handlePickResults;
    /**
     * 开始框选
     */
    private startBoxSelection;
    /**
     * 更新框选
     */
    private updateBoxSelection;
    /**
     * 更新框选显示
     */
    private updateBoxSelectDisplay;
    /**
     * 完成框选
     */
    private finishBoxSelection;
    /**
     * 获取框选区域内的物体
     */
    private getObjectsInBox;
    /**
     * 悬停检测
     */
    private performHoverDetection;
    /**
     * 选中单个物体
     */
    private selectSingleObject;
    /**
     * 添加到选中列表
     */
    private addToSelection;
    /**
     * 从选中列表移除
     */
    private removeFromSelection;
    /**
     * 清空选择
     */
    private clearSelection;
    /**
     * 更新调试射线
     */
    private updateDebugRay;
    /**
     * 发送拾取事件
     */
    private emitPickEvent;
    /**
     * 设置拾取配置
     */
    setConfig(config: Partial<PickConfig>): void;
    /**
     * 获取当前配置
     */
    getConfig(): PickConfig;
    /**
     * 设置拾取模式
     */
    setPickMode(mode: PickMode): void;
    /**
     * 设置拾取容差
     */
    setTolerance(tolerance: number): void;
    /**
     * 获取当前选中的物体
     */
    getSelectedObjects(): THREE.Object3D[];
    /**
     * 获取当前悬停的物体
     */
    getHoveredObject(): THREE.Object3D | null;
    /**
     * 启用/禁用调试模式
     */
    enableDebug(enable: boolean): void;
    /**
     * 手动执行拾取（用于编程式拾取）
     */
    pickAtPosition(x: number, y: number): PickResult[];
    /**
     * 销毁插件
     */
    destroy(): void;
    /**
     * 取消框选（ESC键或其他情况）
     */
    cancelBoxSelection(): void;
    /**
     * 彻底禁用控制器
     */
    private disableController;
    /**
     * 启用控制器
     */
    private enableController;
    /**
     * 调试控制器状态
     */
    debugControllerState(): void;
}
export {};
