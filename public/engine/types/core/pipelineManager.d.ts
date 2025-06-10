export declare class PipelineManager {
    private stages;
    constructor();
    private setupEventListeners;
    registerStage(stage: string, handler: Function): void;
    private executeStage;
    private handleLoadStart;
    private handleCacheVerified;
    private handleLODPrecomputed;
    destroy(): void;
}
