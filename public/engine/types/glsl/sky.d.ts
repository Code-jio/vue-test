import { THREE } from "../utils/three-imports";
interface SkyUniforms {
    [uniform: string]: {
        value: any;
    };
    turbidity: {
        value: number;
    };
    rayleigh: {
        value: number;
    };
    mieCoefficient: {
        value: number;
    };
    mieDirectionalG: {
        value: number;
    };
    sunPosition: {
        value: THREE.Vector3;
    };
    up: {
        value: THREE.Vector3;
    };
}
declare class Sky {
    isSky: boolean;
    mesh: THREE.Mesh;
    material: THREE.ShaderMaterial;
    static SkyShader: {
        name: string;
        uniforms: SkyUniforms;
        vertexShader: string;
        fragmentShader: string;
    };
    /**
     * Constructs a new skydome.
     */
    constructor();
    get position(): THREE.Vector3;
    get rotation(): THREE.Euler;
    get scale(): THREE.Vector3;
    get visible(): boolean;
    set visible(value: boolean);
    getMesh(): THREE.Mesh;
    setSunPosition(x: number, y: number, z: number): void;
    get turbidity(): {
        value: number;
    };
    get rayleigh(): {
        value: number;
    };
    get mieCoefficient(): {
        value: number;
    };
    get mieDirectionalG(): {
        value: number;
    };
    get sunPosition(): {
        value: THREE.Vector3;
    };
    dispose(): void;
}
export { Sky };
