import { THREE, BasePlugin } from "../basePlugin";
import { GLTFLoader } from "../../utils/three-imports";
import { TaskPriority, TaskStatus } from "../../tools/asyncTaskScheduler";
export declare class ResourceReaderPlugin extends BasePlugin {
    gltfLoader: GLTFLoader;
    private dracoLoader;
    private ktx2Loader;
    private meshoptDecoder;
    private taskScheduler;
    private serviceWorkerRegistration;
    private loadingTasks;
    private loadingQueue;
    private activeLoads;
    private config;
    private baseUrl;
    private maxCacheSize;
    private maxConcurrentLoads;
    private taskIdCounter;
    private renderer;
    private static readonly DEFAULT_CONFIG;
    constructor(userData?: any);
    /**
     * 初始化，默认执行
    */
    initialize(): void;
    /**
     * 初始化DRACO解压器
     */
    private initializeDracoLoader;
    /**
     * 初始化KTX2纹理加载器
     */
    private initializeKTX2Loader;
    /**
     * 异步初始化KTX2Loader（需要renderer）
     */
    private initializeKTX2LoaderAsync;
    /**
     * 初始化Meshopt量化解码器
     */
    private initializeMeshoptDecoder;
    /**
     * 异步初始化Meshopt解码器
     */
    private initializeMeshoptDecoderAsync;
    /**
     * 初始化任务调度器
     */
    private initializeTaskScheduler;
    /**
     * 初始化Service Worker网络拦截器
     */
    private initializeServiceWorker;
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
    }): Promise<THREE.Group | THREE.Scene | THREE.Object3D>;
    /**
     * 批量异步加载模型
     */
    loadBatchAsync(urls: string[], priority?: TaskPriority, options?: {
        timeout?: number;
        retryCount?: number;
        category?: string;
    }): Promise<Array<{
        url: string;
        model?: THREE.Group | THREE.Scene | THREE.Object3D;
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
     * 获取加载器配置信息
     */
    getLoaderInfo(): {
        dracoEnabled: boolean;
        dracoPath: string | undefined;
        ktx2Enabled: boolean;
        ktx2Path: string | undefined;
        meshoptEnabled: boolean;
        meshoptPath: string | undefined;
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
     * 设置模型名称
     */
    setModelName(object: THREE.Group | THREE.Scene | THREE.Object3D, baseName: string): void;
    /**
     * 获取模型名称
     */
    getModelName(object: THREE.Group | THREE.Scene | THREE.Object3D): string;
    /**
     * 从文件路径提取文件名
     */
    extractFileNameFromPath(filePath: string): string;
    /**
     * 销毁插件
     */
    dispose(): void;
    private processLoadedModel;
    private isBuildingModel;
}
