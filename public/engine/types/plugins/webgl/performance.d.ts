import { BasePlugin } from "../basePlugin";
export declare class Performance extends BasePlugin {
    private dom;
    private stats;
    private fps;
    private ms;
    private mb;
    private frameCount;
    private lastFPSUpdate;
    private lastFrameTime;
    private thresholds;
    constructor(meta: any);
    initialize(): void;
    getRealTimeStats(): void;
    update(): void;
    destroy(): void;
}
