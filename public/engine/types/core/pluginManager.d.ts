import type { PluginInstance } from "../types/core";
import type { PluginMeta } from "../types/Plugin";
import type { PluginManagerType } from "../types/pluginManager";
export default class PluginManager implements PluginManagerType {
    registry: Map<string, {
        instance: PluginInstance;
        metadata: {
            name: string;
            version: string;
            status: "registered" | "loaded" | "initialized" | "activated";
            dependencies: string[];
        };
    }>;
    hasPlugin(name: string): boolean;
    registerPlugin(plugin: PluginInstance): void;
    loadPlugin(name: string): Promise<void>;
    unloadPlugin(name: string): void;
    getPlugin(name: string): PluginInstance | undefined;
    fetchPluginCode(plugin: PluginMeta): Promise<string>;
    startAll(): Promise<void>;
    unregisterPlugin(plugin: PluginInstance): void;
}
