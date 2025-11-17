import { PluginInstance } from "../types/core";
import PluginManager from "./pluginManager";
import { EventDispatcher } from "../eventBus/eventDispatch";
interface InitParams {
    pluginsParams: [];
}
declare class BaseCore {
    static STATUS: {
        REGISTERED: string;
        LOADING: string;
        LOADED: string;
        ERROR: string;
        UNLOADING: string;
    };
    loadStrategies: {
        [key: string]: (plugin: PluginInstance) => Promise<void>;
    };
    performance: {
        metrics: Map<string, any>;
        enable: boolean;
    };
    components: any;
    _messageChannels: any;
    _servicePermissions: any;
    private logger;
    gpuManager: any;
    constructor(InitParams: InitParams);
    private _startAsyncInit;
    getPlugin(name: string): any;
    private register;
    unregisterPlugin(plugin: PluginInstance): boolean;
    private _loadSync;
    private _loadAsync;
    private _unload;
    private _withPerfMonitoring;
    _recordMetrics(methodName: string, data: {
        duration: number;
        memoryDelta?: number;
        error?: string;
        success: boolean;
    }): void;
}
interface BaseCore extends PluginManager, EventDispatcher {
}
declare const _default: typeof BaseCore & PluginManager & EventDispatcher;
export default _default;
