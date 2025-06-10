import { BasePlugin } from "../basePlugin";
export declare class WebGLContextLose extends BasePlugin {
    private renderer;
    private scene;
    private camera;
    constructor(meta: any);
    private handleContextLost;
    private handleOutOfMemory;
    private handleRenderBlock;
}
