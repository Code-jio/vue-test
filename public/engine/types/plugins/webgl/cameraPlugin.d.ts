import { BasePlugin } from "../basePlugin";
export declare class CameraPlugin extends BasePlugin {
    private cameraType;
    private activeCamera;
    private aspectRatio;
    constructor(meta: any);
    init(coreInterface: any): Promise<void>;
    private registerCameraController;
    private handleCameraSwitch;
    private setupViewportListeners;
    private updateCameraParams;
}
