import { BasePlugin } from "../basePlugin";
export declare class GLMonitor extends BasePlugin {
    private gl;
    private state;
    private originalMethods;
    private statsPanel;
    private boundUpdateStats;
    private renderer;
    constructor(meta: any);
    private detectExtensions;
    private _getBytesPerPixel;
    private setupMethodProxies;
    private createStatsPanel;
    private updateStats;
    initialize(): void;
}
