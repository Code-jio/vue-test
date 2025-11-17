import { THREE, BasePlugin } from "../basePlugin";
export declare class TechRingEffect extends BasePlugin {
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    private ringMesh;
    private animationTween;
    constructor(meta: any);
    init(): Promise<void>;
    private createTechRing;
    private startExpansionAnimation;
    private removeRing;
    triggerEffect(position?: THREE.Vector3): void;
    dispose(): void;
}
