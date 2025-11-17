/**
 * 任务优先级枚举
 */
export declare enum TaskPriority {
    LOW = 0,
    NORMAL = 1,
    HIGH = 2,
    URGENT = 3
}
/**
 * 任务状态枚举
 */
export declare enum TaskStatus {
    PENDING = "pending",
    QUEUED = "queued",
    RUNNING = "running",
    COMPLETED = "completed",
    FAILED = "failed",
    CANCELLED = "cancelled",
    TIMEOUT = "timeout"
}
/**
 * 任务配置接口
 */
export interface TaskConfig {
    id: string;
    url: string;
    priority: TaskPriority;
    timeout?: number;
    retryCount?: number;
    category?: string;
    metadata?: any;
}
/**
 * 任务执行结果接口
 */
export interface TaskResult<T = any> {
    taskId: string;
    success: boolean;
    data?: T;
    error?: Error;
    executionTime: number;
    retryCount: number;
    fromCache: boolean;
}
/**
 * 任务进度接口
 */
export interface TaskProgress {
    taskId: string;
    loaded: number;
    total: number;
    percentage: number;
    stage: string;
}
/**
 * 异步任务接口
 */
export interface AsyncTask<T = any> {
    config: TaskConfig;
    status: TaskStatus;
    startTime: number;
    completionTime?: number;
    executionTime: number;
    retryCount: number;
    error?: Error;
    result?: T;
    promise: Promise<TaskResult<T>>;
    resolve: (result: TaskResult<T>) => void;
    reject: (error: Error) => void;
    abortController: AbortController;
    onProgress?: (progress: TaskProgress) => void;
    onComplete?: (result: TaskResult<T>) => void;
    onError?: (error: Error) => void;
}
/**
 * 队列配置接口
 */
export interface QueueConfig {
    maxConcurrentTasks: number;
    maxQueueSize: number;
    defaultTimeout: number;
    defaultRetryCount: number;
    priorityWeights: Record<TaskPriority, number>;
}
/**
 * 单个任务执行器
 */
export declare class TaskRunner<T = any> {
    private task;
    private executor;
    constructor(task: AsyncTask<T>, executor: (task: AsyncTask<T>) => Promise<T>);
    /**
     * 执行任务
     */
    execute(): Promise<TaskResult<T>>;
    /**
     * 取消任务
     */
    cancel(): void;
    /**
     * 更新进度
     */
    updateProgress(loaded: number, total: number, stage?: string): void;
}
/**
 * 智能异步队列
 */
export declare class AsyncQueue<T = any> {
    private queue;
    private runningTasks;
    private completedTasks;
    private config;
    constructor(config?: Partial<QueueConfig>);
    /**
     * 添加任务到队列
     */
    enqueue(taskConfig: TaskConfig): AsyncTask<T>;
    /**
     * 从队列获取下一个任务
     */
    dequeue(): AsyncTask<T> | null;
    /**
     * 创建任务
     */
    private createTask;
    /**
     * 按优先级插入任务
     */
    insertByPriority(task: AsyncTask<T>): void;
    /**
     * 使用加权优先级选择任务
     */
    private selectByWeightedPriority;
    /**
     * 查找任务
     */
    findTask(taskId: string): AsyncTask<T> | null;
    /**
     * 移除任务
     */
    removeTask(taskId: string): boolean;
    /**
     * 标记任务为运行中
     */
    markAsRunning(task: AsyncTask<T>): void;
    /**
     * 标记任务完成
     */
    markAsCompleted(taskId: string, result: TaskResult<T>): void;
    /**
     * 获取队列状态
     */
    getStatus(): {
        pending: number;
        running: number;
        completed: number;
        maxConcurrent: number;
        maxQueueSize: number;
    };
    /**
     * 清空队列
     */
    clear(): void;
}
/**
 * 异步任务调度器
 */
export declare class TaskScheduler<T = any> {
    private queue;
    private executor;
    private isRunning;
    private processingInterval;
    constructor(executor: (task: AsyncTask<T>) => Promise<T>, queueConfig?: Partial<QueueConfig>);
    /**
     * 启动调度器
     */
    start(): void;
    /**
     * 停止调度器
     */
    stop(): void;
    /**
     * 调度任务
     */
    schedule(taskConfig: TaskConfig): Promise<TaskResult<T>>;
    /**
     * 批量调度任务
     */
    scheduleBatch(taskConfigs: TaskConfig[]): Promise<TaskResult<T>[]>;
    /**
     * 取消任务
     */
    cancel(taskId: string): boolean;
    /**
     * 获取任务状态
     */
    getTaskStatus(taskId: string): TaskStatus | null;
    /**
     * 获取调度器状态
     */
    getStatus(): {
        isRunning: boolean;
        processingInterval: number;
        pending: number;
        running: number;
        completed: number;
        maxConcurrent: number;
        maxQueueSize: number;
    };
    /**
     * 处理队列
     */
    private processQueue;
    /**
     * 执行单个任务
     */
    private executeTask;
    /**
     * 休眠函数
     */
    private sleep;
    /**
     * 销毁调度器
     */
    destroy(): void;
}
