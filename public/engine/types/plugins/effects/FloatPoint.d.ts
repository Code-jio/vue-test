import * as THREE from 'three';
export interface FloatPointConfig {
    count?: number;
    range?: {
        x: number;
        y: number;
        z: number;
    };
    floatSpeed?: number;
    breatheFrequency?: number;
    color?: THREE.Color;
    size?: number;
}
export declare class FloatPoint {
    private scene;
    private points;
    private material;
    private geometry;
    private positions;
    private colors;
    private sizes;
    private opacities;
    private velocities;
    private breathePhases;
    private config;
    private clock;
    private circleTexture;
    constructor(scene: THREE.Scene, config?: FloatPointConfig);
    private init;
    private createCircleTexture;
    update(elapsedTime: number): void;
    setVisible(visible: boolean): void;
    getVisible(): boolean;
    dispose(): void;
    updateConfig(config: Partial<FloatPointConfig>): void;
}
