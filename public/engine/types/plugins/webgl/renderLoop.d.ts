import { BasePlugin } from "../basePlugin";

interface RenderTask {
    id: string;
    callback: () => void;
    priority: number;
    enabled: boolean;
}

interface PerformanceMetrics {
    fps: number;
    frameTime: number;
    averageFrameTime: number;
    totalFrames: number;
    lastFrameTime: number;
    startTime: number;
}

export declare class RenderLoop extends BasePlugin {
    private clock;
    private taskList;
    private animationID;
    private isRunning;
    private lastFrameTime;
    private frameTimeHistory;
    private performanceMetrics;
    private targetFPS;
    private frameInterval;
    private lastRenderTime;
    private onDemandMode;
    private needsRender;
    private errorCount;
    private maxErrors;
    
    constructor(meta: any);
    initialize(): void;
    
    // 任务管理方法
    addTask(id: string, callback: () => void, priority?: number): void;
    removeTask(id: string): boolean;
    enableTask(id: string): boolean;
    disableTask(id: string): boolean;
    
    // 帧率控制方法
    setTargetFPS(fps: number): void;
    getTargetFPS(): number;
    
    // 按需渲染方法
    setOnDemandMode(enabled: boolean): void;
    requestRender(): void;
    
    // 控制方法
    pause(): void;
    resume(): void;
    stop(): void;
    
    // 状态查询方法
    isActive(): boolean;
    getPerformanceMetrics(): PerformanceMetrics;
    getTaskCount(): number;
    getEnabledTaskCount(): number;
    getTaskList(): RenderTask[];
    
    // 调试方法
    getDebugInfo(): any;
}
