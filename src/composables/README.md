# Composables 模块说明

本目录包含了引擎应用的各个功能模块，按照功能职责进行了清晰拆分。

## 模块结构

### 🚀 useEngine.js - 引擎核心功能
负责引擎的初始化、插件管理和基础3D场景功能。

**主要功能：**
- 引擎核心初始化
- 插件注册和管理
- 模型加载
- 相机控制
- 资源管理

**导出内容：**
```javascript
const { 
  engineReady,           // 引擎就绪状态
  initStatus,            // 初始化状态
  initializeEngine,      // 初始化引擎
  loadModel,             // 加载模型
  resetCamera,           // 重置相机
  getEngineInstance,     // 获取引擎实例
  // ... 更多方法
} = useEngine()
```

### 🌐 useCSS3D.js - CSS3D功能
管理Vue组件到3D对象的转换和CSS3D渲染。

**主要功能：**
- CSS3D插件初始化
- Vue组件3D化
- 动画效果
- 组件交互
- 渲染循环

**导出内容：**
```javascript
const {
  css3dReady,            // CSS3D就绪状态
  css3dObjects,          // 3D对象列表
  createVueCard,         // 创建卡片3D对象
  animate3DObjects,      // 动画演示
  debugCSS3DObjects,     // 调试功能
  // ... 更多方法
} = useCSS3D()
```

### 🔍 useDebug.js - 调试和日志
提供统一的调试日志管理功能。

**主要功能：**
- 日志记录和分级
- 日志过滤和导出
- 统计分析
- 快捷调试方法

**导出内容：**
```javascript
const {
  debugLogs,             // 日志列表
  addDebugLog,           // 添加日志
  exportDebugLogs,       // 导出日志
  debugInfo,             // 快捷info日志
  debugError,            // 快捷error日志
  // ... 更多方法
} = useDebug()
```

### 📊 usePerformance.js - 性能监控
监控和分析应用的性能指标。

**主要功能：**
- FPS监控
- 内存使用监控
- 相机距离监控
- 性能分析和优化建议

**导出内容：**
```javascript
const {
  fpsCounter,            // FPS计数器
  cameraDistance,        // 相机距离
  startFpsMonitoring,    // 开始FPS监控
  analyzePerformance,    // 性能分析
  // ... 更多方法
} = usePerformance()
```

### 🎮 useControls.js - 控制和交互
管理键盘、鼠标和触摸交互。

**主要功能：**
- 键盘控制
- 触摸手势
- 全屏切换
- 设备适配
- 控制帮助

**导出内容：**
```javascript
const {
  setupAdaptiveControls, // 自适应控制设置
  toggleFullscreen,      // 切换全屏
  getControlsHelp,       // 获取控制帮助
  getDeviceType,         // 设备类型检测
  // ... 更多方法
} = useControls()
```

## 使用示例

### 基本用法
```javascript
import { useEngine } from '@/composables/useEngine'
import { useDebug } from '@/composables/useDebug'

export default {
  setup() {
    const { engineReady, initializeEngine } = useEngine()
    const { addDebugLog } = useDebug()
    
    onMounted(async () => {
      await initializeEngine(addDebugLog)
    })
    
    return {
      engineReady
    }
  }
}
```

### 完整集成
参考 `EnginePrototypeView.vue` 中的使用方式，展示了如何将所有模块组合使用。

## 架构优势

### 🧩 模块化设计
- **职责单一**：每个模块负责特定功能领域
- **松耦合**：模块间通过明确接口交互
- **易测试**：独立模块便于单元测试

### 🔄 可复用性
- **跨组件复用**：composable可在多个组件中使用
- **逻辑复用**：相同功能无需重复实现
- **配置灵活**：支持不同场景的配置需求

### 🛠️ 可维护性
- **代码分离**：功能逻辑与UI逻辑分离
- **易于调试**：问题定位更加精确
- **团队协作**：不同开发者可专注不同模块

### ⚡ 性能优化
- **按需加载**：只导入需要的功能
- **内存管理**：统一的清理机制
- **避免重复**：共享状态和逻辑

## 扩展指南

### 添加新功能模块
1. 在 `composables` 目录创建新文件
2. 按照现有模式组织代码结构
3. 导出响应式状态和方法
4. 在主组件中导入使用

### 修改现有模块
1. 保持向后兼容
2. 更新相关文档
3. 测试模块间交互
4. 通知团队成员

## 最佳实践

### 命名规范
- **文件命名**：use + 功能名称（驼峰式）
- **函数命名**：动词开头，描述清晰
- **状态命名**：名词形式，语义明确

### 错误处理
- **统一错误格式**：使用 addDebugLog 记录错误
- **异常边界**：适当的 try-catch 块
- **用户反馈**：友好的错误提示

### 性能考虑
- **避免内存泄漏**：正确清理事件监听器
- **节流防抖**：高频操作优化
- **懒加载**：大型资源按需加载

这种模块化架构使代码更清晰、可维护，并且便于团队协作开发。 