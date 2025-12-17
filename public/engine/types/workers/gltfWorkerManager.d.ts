/**
 * GLTF Worker管理器
 * 提供在主线程中管理Web Worker的接口
 */
import { THREE } from '../utils/three-imports';
export interface WorkerMessage {
    type: 'init' | 'load' | 'progress' | 'complete' | 'error' | 'dispose';
    id?: string;
    data?: any;
}
export interface LoadTask {
    id: string;
    url: string;
    config?: {
        dracoPath?: string;
        ktx2Path?: string;
        meshoptPath?: string;
        enableDraco?: boolean;
        enableKTX2?: boolean;
        enableMeshopt?: boolean;
    };
}
export interface LoadResult {
    scene: THREE.Group | THREE.Scene | THREE.Object3D;
    animations: any[];
    metadata: {
        url: string;
        loadTime: number;
        format: 'gltf' | 'glb';
    };
}
export type WorkerEventListener = (event: any) => void;
/**
 * GLTF Worker管理器类
 */
export declare class GLTFWorkerManager {
    private workerScript?;
    private worker;
    private taskCallbacks;
    private isInitialized;
    private isInitializing;
    private taskQueue;
    private activeTasks;
    /**
     * 构造函数
     * @param workerScript Worker脚本路径
     */
    constructor(workerScript?: string | undefined);
    /**
     * 初始化Worker
     * @param config 配置参数
     * @param renderer Three.js渲染器实例（可选，用于KTX2支持检测）
     */
    initialize(config?: any, renderer?: THREE.WebGLRenderer): Promise<void>;
    /**
     * 获取默认Worker脚本路径
     */
    private getDefaultWorkerPath;
    /**
     * 设置消息监听器
     */
    private setupMessageListener;
    /**
     * 发送消息到Worker
     * @param type 消息类型
     * @param data 数据
     * @param id 任务ID
     */
    private sendMessage;
    /**
     * 生成任务ID
     */
    private generateTaskId;
    /**
     * 加载模型
     * @param task 加载任务
     * @param callbacks 回调函数
     */
    loadModel(task: Omit<LoadTask, 'id'>, callbacks?: {
        onProgress?: WorkerEventListener;
        onComplete?: WorkerEventListener;
        onError?: WorkerEventListener;
    }): string;
    /**
     * 取消任务
     * @param taskId 任务ID
     */
    cancelTask(taskId: string): void;
    /**
     * 清理资源
     */
    dispose(): Promise<void>;
    /**
     * 获取任务状态
     */
    getTaskStatus(taskId: string): 'pending' | 'loading' | 'completed' | 'error' | 'cancelled';
    /**
     * 获取活跃任务数量
     */
    getActiveTaskCount(): number;
    /**
     * 获取队列任务数量
     */
    getQueueTaskCount(): number;
    /**
     * 检查Worker是否已初始化
     */
    isReady(): boolean;
}
export declare const gltfWorkerManager: GLTFWorkerManager;
export declare function loadModelWithWorker(url: string, options?: {
    config?: any;
    onProgress?: WorkerEventListener;
    onComplete?: (result: LoadResult) => void;
    onError?: WorkerEventListener;
}): Promise<LoadResult>;
