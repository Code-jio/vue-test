import { BasePlugin } from "../basePlugin";
declare enum SkyBoxType {
    CUBE_TEXTURE = "cubeTexture",// 立方体贴图
    PROCEDURAL_SKY = "proceduralSky",// 程序化天空
    ENVIRONMENT_MAP = "environmentMap",// 环境贴图
    HDR_ENVIRONMENT = "hdrEnvironment"
}
interface SkyBoxConfig {
    type: SkyBoxType;
    size?: number;
    texturePaths?: string[];
    envMapPath?: string;
    hdrMapPath?: string;
    hdrIntensity?: number;
    exrMapPath?: string;
    exrIntensity?: number;
    exrDataType?: 'HalfFloat' | 'Float';
    skyConfig?: {
        turbidity?: number;
        rayleigh?: number;
        mieCoefficient?: number;
        mieDirectionalG?: number;
        sunPosition?: {
            x: number;
            y: number;
            z: number;
        };
        elevation?: number;
        azimuth?: number;
        exposure?: number;
    };
}
export declare class SkyBox extends BasePlugin {
    private cubeTextureLoader;
    private textureLoader;
    private rgbeLoader;
    private exrLoader;
    private scene;
    private camera;
    private renderer;
    private mesh;
    private config;
    private boundHandleResize;
    private skyMaterial;
    private sun;
    constructor(meta: any);
    private parseConfig;
    initialize(): void;
    private createSkyBox;
    private createCubeTextureSkyBox;
    private createEnvironmentMapSkyBox;
    private createHDREnvironmentSkyBox;
    private loadHDREnvironment;
    private loadEXREnvironment;
    private setupEnvironmentTexture;
    private createProceduralSkyBox;
    private addToScene;
    /**
     * 更新天空参数（仅对程序化天空有效）
     */
    updateSkyConfig(newConfig: Partial<SkyBoxConfig['skyConfig']>): void;
    /**
     * 切换天空盒类型
     */
    switchSkyBoxType(newType: SkyBoxType, newConfig?: Partial<SkyBoxConfig>): void;
    /**
     * 获取当前天空盒信息
     */
    getSkyBoxInfo(): {
        type: SkyBoxType;
        isLoaded: boolean;
        config: SkyBoxConfig;
    };
    /**
     * 设置天空盒可见性
     */
    setVisible(visible: boolean): void;
    private cleanupCurrentSkyBox;
    private handleResize;
    private sceneReadyHandler;
    destroy(): void;
}
export { SkyBoxType };
export type { SkyBoxConfig };
