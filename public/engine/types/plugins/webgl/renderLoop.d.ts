import { BasePlugin } from "../basePlugin";
export declare class RenderLoop extends BasePlugin {
    private clock;
    private taskList;
    private animationID;
    constructor(meta: any);
    initialize(): void;
    addTask(callback: () => void): void;
    removeTask(callback: () => void): void;
    pause(): void;
}
