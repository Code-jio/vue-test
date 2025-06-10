import { PluginInstance } from "../types/core";
import PluginManager from "./pluginManager";
import { PluginMeta } from "../types/Plugin";
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
    private _initPlugins;
    getPlugin(name: string): any;
    register(pluginMeta: PluginMeta): this;
    unregisterPlugin(plugin: PluginInstance): boolean;
    _loadSync(plugin: PluginInstance): Promise<void>;
    _loadAsync(plugin: PluginInstance): Promise<void>;
    _unload(plugin: PluginInstance): void;
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
