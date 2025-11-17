import { THREE, BasePlugin } from "../basePlugin";
/**
 * Three.js 静态几何体合并优化插件
 * 功能：自动合并静态模型，使用BVH加速射线检测，提升渲染性能20%+
 *
 * @author EngineKernel
 * @version 1.0.0
 */
export declare class StaticGeometryMerger extends BasePlugin {
    name: string;
    path: string;
    private scene?;
    private mergeConfig;
    private mergedGroups;
    private originalObjects;
    private isMerged;
    private stats;
    constructor(meta: any);
    /**
     * 插件初始化
     */
    init(): Promise<void>;
    /**
     * 场景就绪处理 - 自动触发合并
     */
    onSceneReady(scene: THREE.Scene): void;
    /**
     * 模型加载完成处理
     */
    onModelLoaded(model: any): void;
    /**
     * 资源加载完成处理
     */
    onResourceLoaded(resource: any): void;
    /**
     * 主要优化方法 - 供外部调用
     */
    optimize(): void;
    /**
     * 查找静态网格对象
     */
    private _findStaticMeshes;
    /**
     * 判断是否为动态对象
     */
    private _isDynamicObject;
    /**
     * 按材质分组合并
     */
    private _groupMeshesByMaterial;
    /**
     * 获取材质键（用于分组）
     */
    private _getMaterialKey;
    /**
     * 获取单个材质键
     */
    private _getSingleMaterialKey;
    /**
     * 获取世界变换后的几何体
     */
    private _getWorldGeometry;
    /**
     * 创建合并后的网格
     */
    private _createMergedMeshes;
    /**
     * 恢复原始对象（用于动态更新）
     */
    restoreOriginalObjects(): void;
    /**
     * 插件卸载
     */
    unload(): Promise<void>;
}
