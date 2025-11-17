/**
 * Service Worker 导入工具
 * 提供通过引擎包导入方式使用 Service Worker 的功能
 */
/**
 * 获取 Service Worker 的 URL
 * 支持通过引擎包导入和本地文件两种方式
 */
export declare function getServiceWorkerUrl(): Promise<string>;
/**
 * 动态导入 Service Worker 文件
 * 支持开发和生产环境
 */
export declare function importServiceWorker(): Promise<string>;
/**
 * 检查 Service Worker 是否可用
 */
export declare function isServiceWorkerSupported(): boolean;
/**
 * 注册 Service Worker
 * @param swPath Service Worker 文件路径
 * @param scope Service Worker 作用域
 */
export declare function registerServiceWorker(swPath?: string, scope?: string): Promise<ServiceWorkerRegistration>;
/**
 * 获取 Service Worker 注册状态
 */
export declare function getServiceWorkerStatus(): Promise<{
    isRegistered: boolean;
    isActive: boolean;
    registration?: ServiceWorkerRegistration;
}>;
