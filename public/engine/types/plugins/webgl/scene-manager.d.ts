import { THREE, BasePlugin } from "../basePlugin";
export declare class SceneManager extends BasePlugin {
    private sceneGraph;
    private activeScene?;
    constructor(meta: any);
    loadScene(config: {
        name: string;
        setup: (scene: THREE.Scene) => void;
        teardown?: () => void;
    }): void;
    switchScene(name: string): void;
    addModelToScene(): Promise<void>;
}
