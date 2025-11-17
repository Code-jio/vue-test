import { BasePlugin } from "../basePlugin";
interface RenderTask {
    id: string;
    priority: number;
    enabled: boolean;
    callback: () => void;
}
export declare class RenderLoop extends BasePlugin {
    private clock;
    private taskList;
    private animationID;
    private isRunning;
    private targetFPS;
    private onDemandMode;
    private needsRender;
    private errorCount;
    private maxErrors;
    constructor(meta: any);
    private initialize;
    private executeTasks;
    private handleRenderError;
    private handleTaskError;
    addTask(id: string, callback: () => void, priority?: number): void;
    removeTask(id: string): boolean;
    enableTask(id: string): boolean;
    disableTask(id: string): boolean;
    getTargetFPS(): number;
    setOnDemandMode(enabled: boolean): void;
    requestRender(): void;
    pause(): void;
    resume(): void;
    stop(): void;
    isActive(): boolean;
    getTaskCount(): number;
    getEnabledTaskCount(): number;
    getTaskList(): RenderTask[];
    getDebugInfo(): any;
}
export {};
