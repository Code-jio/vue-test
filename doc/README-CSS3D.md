# CSS3D 示例使用说明

## 📋 概述

本项目展示了如何使用CSS3D插件将Vue组件转化为3D对象，并在Three.js场景中进行渲染。提供了基础示例和高级示例两个版本。

## 🗂️ 文件结构

```
vue-test/src/
├── views/
│   ├── CSS3DExample.vue      # 基础CSS3D示例
│   ├── CSS3DAdvanced.vue     # 高级CSS3D示例（带控制器）
│   └── README-CSS3D.md       # 使用说明（本文件）
├── components/
│   ├── Chart3D.vue           # 图表组件
│   ├── Card3D.vue            # 卡片组件
│   ├── Form3D.vue            # 表单组件
│   ├── Controls3D.vue        # 控制组件
│   └── Media3D.vue           # 媒体组件
└── EngineKernel/src/plugins/webgl/
    └── css3DRender.ts        # CSS3D渲染插件
```

## 🚀 快速开始

### 1. 基础示例 (CSS3DExample.vue)

**功能特点：**
- ✅ 创建基础三维场景
- ✅ 将Vue组件转化为CSS3D对象
- ✅ 支持连续渲染和按需渲染
- ✅ 基础的对象管理功能

**使用方法：**
```javascript
// 1. 创建基础场景
createBasicScene()

// 2. 添加Vue组件
addVueComponents()

// 3. 切换渲染模式
updateRenderMode()
```

### 2. 高级示例 (CSS3DAdvanced.vue)

**功能特点：**
- ✅ 轨道控制器 (OrbitControls)
- ✅ 实时相机位置调节
- ✅ 对象动画和排列
- ✅ FPS监控
- ✅ 完整的资源管理

**核心功能：**
- 🎮 场景控制：初始化、添加组件、动画控制
- 📹 相机控制：位置调节、视角重置
- 🎪 对象控制：旋转、缩放、排列方式
- 📊 状态监控：场景状态、对象数量、FPS

## 🛠️ 核心API

### CSS3DRenderPlugin 插件方法

```javascript
// 创建CSS3D对象
const objectId = css3dPlugin.createCSS3DObject({
  element: htmlElement,           // HTML元素
  position: [x, y, z],           // 位置
  rotation: [x, y, z],           // 旋转
  scale: number | [x, y, z],     // 缩放
  visible: boolean,              // 可见性
  opacity: number,               // 透明度
  interactive: boolean,          // 交互性
  complete: () => {},            // 完成回调
  onUpdate: () => {},            // 更新回调
  onDestroy: () => {}            // 销毁回调
})

// 移除对象
css3dPlugin.removeObject(objectId)

// 清空所有对象
css3dPlugin.clearAll()

// 设置渲染模式
css3dPlugin.setRenderMode('continuous' | 'onDemand')

// 销毁插件
css3dPlugin.destroyPlugin()
```

## 🎯 Vue组件集成

### 组件要求

每个Vue组件必须具备：
1. **唯一ID**: 用于DOM选择和克隆
2. **固定尺寸**: 避免3D空间中的布局问题
3. **自包含样式**: 使用scoped样式防止冲突

### 示例组件结构

```vue
<template>
  <div class="tag-component" id="vue-component-unique-id">
    <!-- 组件内容 -->
  </div>
</template>

<script setup>
// 组件逻辑
const handleAction = () => {
  console.log('组件交互')
}

// 暴露方法供外部调用
defineExpose({
  handleAction
})
</script>

<style scoped>
.tag-component {
  background: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 16px;
  max-width: 300px; /* 固定尺寸 */
}
</style>
```

## ⚡ 性能优化

### 渲染优化
```javascript
// 使用按需渲染减少CPU消耗
css3dPlugin.setRenderMode('onDemand')

// 限制对象数量
const MAX_OBJECTS = 10

// 使用对象池复用DOM元素
const objectPool = new Map()
```

### 内存管理
```javascript
// 及时清理不用的对象
css3dPlugin.removeObject(unusedObjectId)

// 组件卸载时清理所有资源
onUnmounted(() => {
  css3dPlugin.destroyPlugin()
})
```

## 🎨 自定义配置

### 场景配置
```javascript
// 场景背景色
scene.background = new THREE.Color(0x111122)

// 相机参数
const camera = new THREE.PerspectiveCamera(
  75,                                    // 视野角度
  window.innerWidth / window.innerHeight, // 宽高比
  0.1,                                   // 近裁剪面
  2000                                   // 远裁剪面
)
```

### 光照配置
```javascript
// 环境光
const ambientLight = new THREE.AmbientLight(0x404040, 0.4)

// 方向光
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
directionalLight.position.set(10, 10, 5)
```

## 🐛 常见问题

### Q: Vue组件在3D场景中无法交互？
**A:** 确保设置 `interactive: true` 和正确的CSS pointer-events

### Q: 组件在3D空间中显示异常？
**A:** 检查组件的CSS定位和尺寸，避免使用相对定位

### Q: 渲染性能不佳？
**A:** 使用按需渲染模式，减少同时显示的对象数量

### Q: 内存泄漏问题？
**A:** 确保在组件卸载时调用插件的销毁方法

## 🔧 调试工具

### 控制台日志
```javascript
// 启用详细日志
console.log('✅ 成功创建CSS3D对象')
console.error('❌ 创建失败:', error)
```

### 性能监控
```javascript
// FPS监控
const fps = Math.round((frameCount * 1000) / (currentTime - lastTime))

// 对象计数
console.log(`当前对象数量: ${createdObjects.length}`)
```

## 📚 扩展阅读

- [Three.js 官方文档](https://threejs.org/docs/)
- [CSS3DRenderer 文档](https://threejs.org/docs/#examples/en/renderers/CSS3DRenderer)
- [Vue 3 Composition API](https://vuejs.org/guide/extras/composition-api-faq.html)

## 🤝 贡献指南

1. 遵循SOLID原则
2. 每个函数只干一件事
3. 异常必须处理
4. 变量名要说人话
5. 用中文注释关键逻辑

---

**最后更新**: 2024年
**作者**: AI Assistant
**版本**: 1.0.0 