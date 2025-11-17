import { THREE, BasePlugin } from "../basePlugin";
import { EffectComposer } from "../../utils/three-imports";
export declare class OutLinePlugin extends BasePlugin {
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    composer: EffectComposer | null;
    outline: any;
    private _selectArray;
    constructor(meta: any);
    init(): Promise<void>;
    get selectArray(): any[];
    set selectArray(value: any[]);
    clearOutline(): void;
    addOutline(objects: THREE.Object3D | THREE.Object3D[]): void;
    destroy(): void;
}
