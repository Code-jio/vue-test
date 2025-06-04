# 🌅 HDR天空盒示例

这是一个使用EngineKernel引擎创建HDR天空盒的基础示例，展示了如何复用`useEngine`代码来创建具有真实感光照的3D场景。

## 🎯 功能特性

### ✅ 已实现功能
- **HDR环境贴图天空盒**：使用`rustig_koppie_puresky_2k.hdr`文件
- **基于物理的渲染**：支持金属度和粗糙度材质
- **实时曝光调节**：可以动态调整HDR强度
- **环境光照**：HDR贴图提供真实的环境光照
- **材质反射**：金属材质能够反射HDR环境
- **复用引擎代码**：完全基于`useEngine`组合式API

### 🎮 交互控制
- **重置相机**：恢复到默认视角
- **添加测试对象**：动态添加高反射金属球体
- **曝光调节**：实时调整HDR强度（0.1x - 2.0x）
- **轨道控制**：鼠标拖拽旋转、滚轮缩放

## 📁 文件结构

```
vue-test/
├── src/
│   ├── views/
│   │   ├── HDRSkyTest.vue          # 完整功能的HDR天空盒测试页面
│   │   └── HDRSkyBasicExample.vue  # 简化的基础示例
│   ├── composables/
│   │   ├── useEngine.js            # 引擎核心功能（复用）
│   │   └── useDebug.js             # 调试日志功能（复用）
│   └── router/index.js             # 路由配置
├── public/
│   └── skybox/
│       ├── rustig_koppie_puresky_2k.hdr  # 2K HDR天空盒文件
│       └── rustig_koppie_puresky_4k.hdr  # 4K HDR天空盒文件
└── README-HDR-SkyBox.md           # 本文档
```

## 🚀 技术实现

### 1. 引擎初始化
```javascript
// 复用useEngine的初始化逻辑
await initializeEngine(addDebugLog)

// 等待引擎就绪
await waitForEngineReady()
```

### 2. HDR天空盒插件注册
```javascript
engineInstance.register({
  name: 'HDRSkyBoxPlugin',
  path: '/plugins/webgl/skyBox',
  pluginClass: EngineKernel.SkyBox,
  userData: {
    scene: baseScenePlugin.scene,
    camera: baseScenePlugin.camera,
    renderer: baseScenePlugin.renderer,
    skyBoxType: EngineKernel.SkyBoxType.HDR_ENVIRONMENT,
    hdrMapPath: '/skybox/rustig_koppie_puresky_2k.hdr',
    hdrIntensity: 1.0,
    size: 50000
  }
})
```

### 3. 材质配置
```javascript
// 高反射金属材质，展示HDR环境反射
const material = new THREE.MeshStandardMaterial({ 
  color: 0xffffff, 
  metalness: 0.9,    // 高金属度
  roughness: 0.1     // 低粗糙度（高反射）
})
```

### 4. 曝光控制
```javascript
// 实时调整HDR曝光强度
baseScenePlugin.renderer.toneMappingExposure = parseFloat(hdrIntensity.value)
```

## 🎨 设计原则

### SOLID原则遵循
1. **单一职责**：每个函数只负责一个功能
2. **开闭原则**：通过插件系统扩展功能
3. **依赖倒置**：依赖抽象的useEngine接口

### 代码复用策略
- **useEngine复用**：完全复用现有的引擎初始化逻辑
- **useDebug复用**：复用调试日志系统
- **插件化架构**：HDR天空盒作为独立插件

### 错误处理
- **异常捕获**：所有异步操作都有try-catch
- **状态检查**：操作前检查引擎就绪状态
- **用户反馈**：通过日志系统提供详细反馈

## 🌟 使用方法

### 1. 启动项目
```bash
cd vue-test
npm run dev
```

### 2. 访问示例
- 完整版：`http://localhost:5173/hdr-sky-test`
- 基础版：需要添加路由配置

### 3. 操作指南
1. 等待引擎初始化完成（状态点变绿）
2. 点击"重置相机"调整视角
3. 点击"添加测试对象"创建反射球体
4. 拖拽"曝光强度"滑块调节HDR效果
5. 使用鼠标拖拽旋转场景，滚轮缩放

## 🔧 技术细节

### HDR文件格式
- **格式**：RGBE (.hdr)
- **映射**：等距柱状投影 (EquirectangularReflectionMapping)
- **色调映射**：ACES Filmic Tone Mapping
- **用途**：环境光照 + 背景 + 反射

### 渲染管线
1. **HDR加载**：RGBELoader加载.hdr文件
2. **环境设置**：scene.background + scene.environment
3. **色调映射**：renderer.toneMapping + toneMappingExposure
4. **材质响应**：MeshStandardMaterial基于物理渲染

### 性能优化
- **文件大小**：优先使用2K版本（3.9MB vs 15MB）
- **纹理缓存**：Three.js自动缓存已加载纹理
- **渲染优化**：合理的renderOrder设置

## 🐛 常见问题

### Q: HDR文件加载失败？
A: 检查文件路径和网络连接，确保HDR文件在public/skybox目录下

### Q: 看不到HDR效果？
A: 确保使用MeshStandardMaterial，并设置合适的metalness和roughness值

### Q: 场景太暗或太亮？
A: 调整HDR强度滑块，或检查renderer.toneMappingExposure设置

### Q: 引擎初始化失败？
A: 检查EngineKernel是否正确加载，查看浏览器控制台错误信息

## 📚 扩展方向

### 功能扩展
- [ ] 支持多个HDR文件切换
- [ ] 添加程序化天空对比
- [ ] 实现日夜循环效果
- [ ] 添加后处理效果

### 性能优化
- [ ] HDR文件预加载
- [ ] LOD系统集成
- [ ] 渲染性能监控

### 用户体验
- [ ] 拖拽上传HDR文件
- [ ] 预设场景配置
- [ ] 导出场景截图

## 📖 相关文档

- [EngineKernel SkyBox插件文档](../../EngineKernel/docs/README-skybox.md)
- [Three.js HDR文档](https://threejs.org/docs/#examples/en/loaders/RGBELoader)
- [useEngine组合式API文档](./src/composables/README.md)

---

**作者**: EngineKernel团队  
**更新时间**: 2024年  
**版本**: v1.0.0 