import THREE from "./three-imports";
declare function degreesToRadians(degrees: number): number;
declare function radiansToDegrees(radians: number): number;
declare function clamp(value: number, min: number, max: number): number;
declare function lerp(start: number, end: number, factor: number): number;
declare function lerpVector3(start: THREE.Vector3, end: THREE.Vector3, factor: number): THREE.Vector3;
declare function distance2D(x1: number, y1: number, x2: number, y2: number): number;
declare function distance3D(v1: THREE.Vector3, v2: THREE.Vector3): number;
declare function randomColor(): string;
declare function deepClone<T>(obj: T): T;
declare function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void;
declare function throttle<T extends (...args: any[]) => any>(func: T, limit: number): (...args: Parameters<T>) => void;
declare function isMobile(): boolean;
declare function formatFileSize(bytes: number): string;
declare function sleep(ms: number): Promise<void>;
declare function safeDeepClone(obj: any, visited?: WeakMap<object, any>): any;
/**
 * 深度合并配置对象（防止循环引用）
 */
declare function mergeConfigs(defaultConfig: any, userConfig: any): any;
/**
 * 设置物体透明度（自动保存原始材质）
 * @param object 需要设置透明度的Three.js物体
 * @param opacity 目标透明度值（0-1之间）
 * @param transparent 是否启用透明（默认为true，当opacity小于1时自动启用）
 * @param saveOriginal 是否保存原始材质信息（默认为true，用于后续恢复）
 *
 * 注意：当saveOriginal为true时，会自动保存原始材质信息，后续可通过restoreOriginalOpacity恢复
 */
declare function setObjectOpacity(object: THREE.Object3D, opacity: number, transparent?: boolean, saveOriginal?: boolean): void;
/**
 * 恢复物体的原始透明度（使用之前在setObjectOpacity中保存的材质信息）
 * @param object 需要恢复透明度的Three.js物体
 * @param forceRestore 是否强制恢复，即使没有保存的材质信息也会尝试恢复
 */
declare function restoreOriginalOpacity(object: THREE.Object3D, forceRestore?: boolean): void;
/**
 * 判断三点是否构成逆时针转向
 * @param a 第一个点
 * @param b 第二个点
 * @param c 第三个点
 * @returns 大于0表示逆时针，等于0表示共线，小于0表示顺时针
 */
declare function ccw(a: {
    x: number;
    y: number;
}, b: {
    x: number;
    y: number;
}, c: {
    x: number;
    y: number;
}): number;
/**
 * 计算点集的凸包
 * @param points 输入点集
 * @returns 凸包顶点数组
 */
declare function computeConvexHull(points: THREE.Vector3[]): THREE.Vector3[];
/**
 * 提取3D对象的2D平面轮廓（俯视视角）,专用于房间
 * @param object3D 3D对象，包含所有mesh
 * @param options 配置选项
 * @returns 2D平面轮廓顶点数组（世界坐标）
 */
declare function extractObjectContour(object3D: THREE.Object3D, options?: {
    tolerance?: number;
    floorRatio?: number;
    debugMode?: boolean;
}): THREE.Vector3[];
/**
 * 将轮廓的几何中心移动到原点
 * @param contour 轮廓顶点数组
 * @returns 平移后的轮廓顶点数组，几何中心位于原点
 */
declare function centerContourAtOrigin(contour: THREE.Vector3[]): THREE.Vector3[];
/**
 * 为对象提取并保存轮廓信息到userData
 * @param object3D 3D对象
 * @param options 配置选项
 * @returns 是否成功提取并保存轮廓
 */
declare function extractAndSaveObjectBounding(object3D: THREE.Object3D, options?: {
    objectName?: string;
    tolerance?: number;
    floorRatio?: number;
    debugMode?: boolean;
    saveToUserData?: boolean;
    saveCenteredContour?: boolean;
}): boolean;
/**
 * 将 THREE.Vector3 转换为 {x, y, z} 对象
 * @param vec - THREE.Vector3 实例
 * @returns 包含 x, y, z 属性的普通对象
 */
declare function vector3ToObject(vec: THREE.Vector3): {
    x: number;
    y: number;
    z: number;
};
/**
 * 将 { x, y, z } 对象转换为 THREE.Vector3
 * @param obj - 包含 x, y, z 属性的对象
 * @returns THREE.Vector3 实例
 */
declare function objectToVector3(obj: {
    x: number;
    y: number;
    z: number;
}): THREE.Vector3;
/**
 * 将 mesh 的材质克隆并修改颜色，原始材质保存在 mesh.userData.originalMaterial 或 mesh.userData.originalMaterials
 * @param mesh - 你要修改的 Three.js mesh
 * @param targetHexColor - 目标颜色（十六进制，例如 0x00ff00）
 */
declare function changeMeshColor(mesh: THREE.Mesh, targetHexColor: number): void;
/**
 * 从 mesh.userData 恢复原始材质
 * @param mesh - 你要恢复的 Three.js mesh
 */
declare function restoreMeshOriginalMaterial(mesh: THREE.Mesh): void;
export { degreesToRadians, // 角度转弧度
radiansToDegrees, // 弧度转角度
clamp, // 限制数值在指定范围内
lerp, //线性插值
lerpVector3, // 向量线性插值
distance2D, // 计算两点之间的距离
distance3D, // 计算3D空间中的距离
randomColor, // 生成随机颜色
deepClone, // 深度克隆对象（简单对象）
debounce, // 防抖函数
throttle, // 节流函数
isMobile, // 判断是否为移动设备
formatFileSize, // 格式化文件大小
sleep, // 等待指定时间
safeDeepClone, // 安全深度克隆
mergeConfigs, // 深度合并配置对象（防止循环引用）
setObjectOpacity, // 设置物体透明度（自动保存原始材质）
restoreOriginalOpacity, // 恢复物体的原始透明度（使用之前在setObjectOpacity中保存的材质信息）
ccw, // 判断三点是否构成逆时针转向
computeConvexHull, // 计算点集的凸包
extractObjectContour, // 提取3D对象的2D平面轮廓（俯视视角）,专用于房间
extractAndSaveObjectBounding, // 为对象提取并保存轮廓信息到userData
centerContourAtOrigin, // 将轮廓的几何中心移动到原点
objectToVector3, // 对象转向量
vector3ToObject, // 向量转对象
changeMeshColor, // 将 mesh 的材质克隆并修改颜色，原始材质保存在 mesh.userData
restoreMeshOriginalMaterial };
