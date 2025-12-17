/**
 * GLTF模型缓存工具类
 * 提供IndexedDB存储、缓存管理、过期清理等功能
 */
interface GLTFModelCacheData {
    url: string;
    bufferData: ArrayBuffer;
    jsonData: any;
    timestamp: number;
    expiresAt: number;
}
declare class GLTFModelCache {
    private dbName;
    private storeName;
    private version;
    private db;
    private defaultExpiration;
    /**
     * 初始化数据库
     */
    private initDB;
    /**
     * 存储模型数据到缓存
     * @param url 模型URL，作为唯一键
     * @param bufferData 原始buffer数据
     * @param jsonData 解析后的JSON数据
     * @param expiration 过期时间（毫秒），默认7天
     */
    store(url: string, bufferData: ArrayBuffer, jsonData: any, expiration?: number): Promise<void>;
    /**
     * 从缓存中读取模型数据
     * @param url 模型URL
     * @returns 缓存数据，如果不存在则返回null
     */
    get(url: string): Promise<GLTFModelCacheData | null>;
    /**
     * 删除指定URL的缓存
     * @param url 模型URL
     */
    delete(url: string): Promise<void>;
    /**
     * 清理所有过期缓存
     */
    cleanupExpired(): Promise<void>;
    /**
     * 清空所有缓存
     */
    clear(): Promise<void>;
    /**
     * 获取缓存统计信息
     * @returns 缓存数量
     */
    getStats(): Promise<number>;
}
export declare const gltfModelCache: GLTFModelCache;
export {};
