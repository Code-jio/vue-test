import { THREE, BasePlugin } from "../basePlugin";
export declare class LODPlugin extends BasePlugin {
    private lodGroups;
    private camera;
    private scene;
    private renderer;
    private meta;
    constructor(meta: any);
    initialize(): void;
    private updateLODLevels;
    update(): void;
    destroy(): void;
    addLODGroup(name: string, lodGroup: THREE.LOD): void;
    removeLODGroup(name: string): void;
    onCameraMoved(): void;
    private triggerLODUpdatedEvent;
    private handleModelLoaded;
}
