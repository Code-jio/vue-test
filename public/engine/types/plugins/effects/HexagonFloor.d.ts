import * as THREE from 'three';
export declare class HexagonFloor {
    scene: THREE.Scene;
    floorMesh: THREE.Mesh | null;
    width: number;
    height: number;
    animationTime: number;
    constructor(scene: THREE.Scene, width?: number, height?: number);
    init(): Promise<void>;
    private createHexagonFloor;
    update(time: number): void;
    setVisible(visible: boolean): void;
    getVisible(): boolean;
    dispose(): void;
}
