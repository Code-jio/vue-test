import { THREE, BasePlugin } from "../basePlugin";
export declare enum LayerType {
    BASE_SCENE = "baseScene",// 基础场景图层
    BASE_MODEL = "baseModel",// 基础模型图层
    MODEL_ANNOTATION = "modelAnnotation",// 模型标注图层
    SPRITE = "sprite",// 精灵图层
    CSS3D = "css3d",// CSS3D图层
    IMAGE_ANNOTATION = "imageAnnotation",// 图片标注图层
    CUSTOM = "custom"
}
interface LayerConfig {
    id: string;
    name: string;
    type: LayerType;
    visible?: boolean;
    renderOrder?: number;
    opacity?: number;
    parent?: string | null;
    metadata?: {
        [key: string]: any;
    };
}
interface Layer {
    id: string;
    name: string;
    type: LayerType;
    group: THREE.Group;
    visible: boolean;
    renderOrder: number;
    opacity: number;
    parent: string | null;
    children: Set<string>;
    metadata: {
        [key: string]: any;
    };
    created: number;
    updated: number;
}
export declare class LayerManager extends BasePlugin {
    private layers;
    private scene;
    private layerOrder;
    constructor(meta: any);
    /**
     * 场景就绪时的回调
     */
    private onSceneReady;
    /**
     * 初始化默认图层
     */
    private initializeDefaultLayers;
    /**
     * 创建新图层
     */
    createLayer(config: LayerConfig): Layer | null;
    /**
     * 删除图层
     */
    deleteLayer(layerId: string): boolean;
    /**
     * 清理图层中的THREE对象
     */
    private disposeLayerObjects;
    /**
     * 显示/隐藏图层
     */
    setLayerVisibility(layerId: string, visible: boolean): boolean;
    /**
     * 设置图层透明度
     */
    setLayerOpacity(layerId: string, opacity: number): boolean;
    /**
     * 设置图层渲染顺序
     */
    setLayerRenderOrder(layerId: string, renderOrder: number): boolean;
    /**
     * 调整图层在列表中的位置
     */
    moveLayer(layerId: string, newIndex: number): boolean;
    /**
     * 向图层添加对象
     */
    addToLayer(layerId: string, object: THREE.Object3D): boolean;
    /**
     * 从图层移除对象
     */
    removeFromLayer(layerId: string, object: THREE.Object3D): boolean;
    /**
     * 获取图层信息
     */
    getLayer(layerId: string): Layer | null;
    /**
     * 获取所有图层
     */
    getAllLayers(): Layer[];
    /**
     * 根据类型获取图层
     */
    getLayersByType(type: LayerType): Layer[];
    /**
     * 获取图层顺序
     */
    getLayerOrder(): string[];
    /**
     * 根据名称查找图层
     */
    findLayersByName(name: string): Layer[];
    /**
     * 获取图层统计信息
     */
    getLayerStats(): any;
    /**
     * 批量操作：显示指定类型的所有图层
     */
    showLayersByType(type: LayerType): void;
    /**
     * 批量操作：隐藏指定类型的所有图层
     */
    hideLayersByType(type: LayerType): void;
    /**
     * 获取默认图层ID（按类型）
     */
    getDefaultLayerId(type: LayerType): string | null;
    /**
     * 快捷方法：添加对象到默认图层
     */
    addToDefaultLayer(type: LayerType, object: THREE.Object3D): boolean;
    /**
     * 导出图层配置
     */
    exportLayerConfig(): any;
    /**
     * 导入图层配置
     */
    importLayerConfig(config: any): boolean;
    /**
     * 销毁图层管理器
     */
    destroy(): void;
    /**
     * 更新方法（预留给父类调用）
     */
    update(): void;
}
export {};
