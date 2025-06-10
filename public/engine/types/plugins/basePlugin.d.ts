import { PluginMeta } from "../types/Plugin";
import { THREE } from "../utils/three-imports";
declare class BasePlugin {
    readonly name: string;
    readonly path: string;
    readonly strategy: "sync" | "async";
    readonly dependencies: string[];
    status: "unloaded" | "loaded" | "error";
    instance: any;
    exports: any;
    constructor(meta: PluginMeta);
    init(coreInterface: any): Promise<void>;
    load(): Promise<void>;
    unload(): Promise<void>;
}
export { THREE, BasePlugin };
