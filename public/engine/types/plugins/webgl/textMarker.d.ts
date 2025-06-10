import { THREE, BasePlugin } from "../basePlugin";
interface TextStyle {
    fontSize: number;
    fontFamily: string;
    fontWeight: 'normal' | 'bold' | 'lighter' | 'bolder';
    color: string;
    textAlign: 'left' | 'center' | 'right';
    lineHeight: number;
    maxWidth?: number;
    textShadow?: {
        color: string;
        blur: number;
        offsetX: number;
        offsetY: number;
    };
}
interface BackgroundStyle {
    color: string;
    opacity: number;
    borderRadius: number;
    padding: {
        top: number;
        right: number;
        bottom: number;
        left: number;
    };
    border?: {
        width: number;
        color: string;
        style: 'solid' | 'dashed' | 'dotted';
    };
    gradient?: {
        type: 'linear' | 'radial';
        colors: string[];
        stops?: number[];
    };
}
interface ImageConfig {
    url: string;
    width?: number;
    height?: number;
    position: 'left' | 'right' | 'top' | 'bottom' | 'background';
    margin?: number;
    opacity?: number;
}
interface TextMarkerConfig {
    text: string;
    position: Array<number> | THREE.Vector3;
    textStyle?: Partial<TextStyle>;
    backgroundStyle?: Partial<BackgroundStyle>;
    image?: ImageConfig;
    scale?: number;
    rotation?: number;
    show?: boolean;
    autoSize?: boolean;
    minSize?: number;
    maxSize?: number;
    billboard?: boolean;
    clickable?: boolean;
    onClick?: (markerId: string) => void;
    onHover?: (markerId: string, isHovered: boolean) => void;
    name?: string;
    userData?: any;
}
export declare class TextMarkerPlugin extends BasePlugin {
    private scene;
    private camera;
    private renderer;
    private markerInstances;
    private instanceIdCounter;
    private raycaster;
    private mouse;
    private enableDebugMode;
    private defaultTextStyle;
    private defaultBackgroundStyle;
    private imageCache;
    constructor(meta?: any);
    /**
     * 插件初始化
     */
    init(coreInterface: any): Promise<void>;
    /**
     * 基类要求的load方法
     */
    load(): Promise<void>;
    /**
     * 预加载常用资源
     */
    private preloadCommonResources;
    /**
     * 设置事件监听器
     */
    private setupEventListeners;
    /**
     * 添加文本标记
     */
    addMarker(config: TextMarkerConfig): string;
    /**
     * 渲染标记到Canvas
     */
    private renderMarker;
    /**
     * 文本换行处理
     */
    private wrapText;
    /**
     * 计算文本尺寸
     */
    private calculateTextSize;
    /**
     * 计算总尺寸
     */
    private calculateTotalSize;
    /**
     * 绘制背景
     */
    private drawBackground;
    /**
     * 绘制圆角矩形
     */
    private drawRoundedRect;
    /**
     * 绘制图片
     */
    private drawImage;
    /**
     * 绘制文本
     */
    private drawText;
    /**
     * 加载图片
     */
    private loadImage;
    /**
     * 更新Sprite尺寸
     */
    private updateSpriteSize;
    /**
     * 更新边界框
     */
    private updateBoundingBox;
    /**
     * 鼠标点击事件
     */
    private onMouseClick;
    /**
     * 鼠标移动事件
     */
    private onMouseMove;
    /**
     * 更新鼠标位置
     */
    private updateMousePosition;
    /**
     * 渲染事件处理
     */
    private onRender;
    /**
     * 处理自动缩放
     */
    private handleAutoScaling;
    /**
     * 更新标记配置
     */
    updateMarker(markerId: string, config: Partial<TextMarkerConfig>): boolean;
    /**
     * 移除标记
     */
    removeMarker(markerId: string): boolean;
    /**
     * 设置标记可见性
     */
    setVisible(markerId: string, visible: boolean): boolean;
    /**
     * 获取所有标记
     */
    getAllMarkers(): {
        [key: string]: any;
    };
    /**
     * 获取标记信息
     */
    getMarkerInfo(markerId: string): any;
    /**
     * 批量添加标记
     */
    addMarkerBatch(configs: TextMarkerConfig[]): Promise<string[]>;
    /**
     * 清除所有标记
     */
    clearAllMarkers(): void;
    /**
     * 生成标记ID
     */
    private generateMarkerId;
    /**
     * 销毁插件
     */
    dispose(): void;
}
export {};
