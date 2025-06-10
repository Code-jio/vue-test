import { THREE, BasePlugin } from "../basePlugin";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { TaskPriority, TaskStatus } from './asyncTaskScheduler';
interface ResourceReaderConfig {
    url?: string;
    maxCacheSize?: number;
    maxConcurrentLoads?: number;
    enableDraco?: boolean;
    dracoPath?: string;
    supportedFormats?: string[];
    autoDispose?: boolean;
}
export declare class ResourceReaderPlugin extends BasePlugin {
    gltfLoader: GLTFLoader;
    private dracoLoader;
    private taskScheduler;
    private resourceCache;
    private loadingTasks;
    private loadingQueue;
    private activeLoads;
    private config;
    private baseUrl;
    private maxCacheSize;
    private maxConcurrentLoads;
    private taskIdCounter;
    private static readonly DEFAULT_CONFIG;
    /**
     * 创建带有默认配置的ResourceReaderPlugin实例
     * @param config 可选的配置参数
     * @returns ResourceReaderPlugin实例
     */
    static create(config?: Partial<ResourceReaderConfig>): ResourceReaderPlugin;
    /**
     * 创建禁用DRACO的ResourceReaderPlugin实例
     * @param config 可选的配置参数
     * @returns ResourceReaderPlugin实例
     */
    static createBasic(config?: Partial<ResourceReaderConfig>): ResourceReaderPlugin;
    /**
     * 创建高性能配置的ResourceReaderPlugin实例
     * @param config 可选的配置参数
     * @returns ResourceReaderPlugin实例
     */
    static createHighPerformance(config?: Partial<ResourceReaderConfig>): ResourceReaderPlugin;
    constructor(userData?: any);
    /**
     * 验证和标准化配置参数
     */
    private validateAndNormalizeConfig;
    /**
     * 初始化加载器
     */
    private initializeLoaders;
    /**
     * 初始化任务调度器
     */
    private initializeTaskScheduler;
    /**
     * 验证DRACO解码器文件是否存在
     */
    private verifyDracoDecoder;
    /**
     * 插件初始化
     */
    init(coreInterface: any): Promise<void>;
    /**
     * 基类要求的load方法
     */
    load(): Promise<void>;
    /**
     * 异步加载GLTF/GLB模型 - 新的推荐方法
     */
    loadModelAsync(url: string, priority?: TaskPriority, options?: {
        timeout?: number;
        retryCount?: number;
        category?: string;
        metadata?: any;
    }): Promise<THREE.Group>;
    /**
     * 批量异步加载模型
     */
    loadBatchAsync(urls: string[], priority?: TaskPriority, options?: {
        timeout?: number;
        retryCount?: number;
        category?: string;
    }): Promise<Array<{
        url: string;
        model?: THREE.Group;
        error?: Error;
    }>>;
    /**
     * 取消异步加载任务
     */
    cancelAsyncLoad(taskId: string): boolean;
    /**
     * 获取异步任务状态
     */
    getAsyncTaskStatus(taskId: string): TaskStatus | null;
    /**
     * 获取调度器状态
     */
    getSchedulerStatus(): {
        isRunning: boolean;
        processingInterval: number;
        pending: number;
        running: number;
        completed: number;
        maxConcurrent: number;
        maxQueueSize: number;
    };
    /**
     * 加载GLTF/GLB模型 - 兼容旧接口
     */
    loadModel(url: string, onComplete?: (gltf: any) => void, onProgress?: (progress: any) => void, onError?: (error: Error) => void, priority?: number): string;
    /**
     * 批量加载模型
     */
    loadBatch(urls: string[], onBatchComplete?: (results: any[]) => void): string[];
    /**
     * 取消加载任务
     */
    cancelLoad(taskId: string): boolean;
    /**
     * 获取加载进度
     */
    getLoadingProgress(): {
        total: number;
        completed: number;
        progress: number;
    };
    /**
     * 处理加载队列
     */
    private processQueue;
    /**
     * 执行具体的加载操作 - 直接使用配置好的GLTFLoader
     */
    private executeLoad;
    /**
     * 加载完成处理
     */
    private onLoadComplete;
    /**
     * 加载进度处理
     */
    private onLoadProgress;
    /**
     * 加载错误处理
     */
    private onLoadError;
    /**
     * 添加任务到队列
     */
    private addToQueue;
    /**
     * 解析完整URL
     */
    private resolveUrl;
    /**
     * 生成任务ID
     */
    private generateTaskId;
    /**
     * 从URL中提取文件名（不包含扩展名）
     */
    private extractFileNameFromUrl;
    /**
     * 添加到缓存
     */
    private addToCache;
    /**
     * 从缓存获取资源
     */
    private getCachedResource;
    /**
     * 确保缓存空间足够
     */
    private ensureCacheSpace;
    /**
     * 估算模型大小
     */
    private estimateModelSize;
    /**
     * 获取当前缓存大小
     */
    /**
     * 清理特定资源
     */
    disposeResource(url: string): void;
    /**
     * 清理所有缓存
     */
    clearCache(): void;
    /**
     * 开始缓存清理定时器
     */
    private startCacheCleanup;
    /**
     * 获取缓存状态
     */
    getCacheStatus(): {
        maxSize: number;
        itemCount: number;
        dracoEnabled: boolean;
    };
    /**
     * 获取加载器配置信息
     */
    getLoaderInfo(): {
        dracoEnabled: boolean;
        dracoPath: string | undefined;
        supportedFormats: string[];
    };
    /**
     * 获取加载任务状态
     */
    getTasksStatus(): {
        pending: number;
        loading: number;
        completed: number;
        error: number;
    };
    /**
     * 预加载资源列表
     */
    preload(urls: string[]): Promise<any[]>;
    /**
     * 销毁插件
     */
    dispose(): void;
}
export {};
