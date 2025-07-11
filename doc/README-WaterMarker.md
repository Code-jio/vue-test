# WaterMarker 水体生成功能使用指南

## 概述

WaterMarker 是一个用于在 3D 场景中生成指定轮廓水体的功能模块。它支持根据自定义轮廓创建具有动态波浪效果的水体，包括水面、侧面和底面的完整渲染。

## 特性

- 🌊 **自定义轮廓**：支持任意形状的轮廓输入
- 🎨 **丰富的视觉效果**：包括波浪动画、透明度、反射和折射
- 🎛️ **实时控制**：支持运行时修改所有参数
- 🏗️ **多种预设**：提供平静、波涛汹涌、热带海水、深海等预设
- 🔧 **完整的几何体**：自动生成顶面、底面和侧面

## 基本使用

### 1. 导入功能

```javascript
import { createWaterMarker } from "@/composables/default";
```

### 2. 创建基础水体

```javascript
// 创建一个简单的矩形水体
const waterMarker = createWaterMarker({
    height: 2.0,
    position: { x: 0, y: 0, z: 0 },
    contour: [
        { x: -10, y: 0, z: -10 },
        { x: 10, y: 0, z: -10 },
        { x: 10, y: 0, z: 10 },
        { x: -10, y: 0, z: 10 }
    ]
});
```

### 3. 创建复杂轮廓水体

```javascript
// 创建一个L型水体
const lShapeWater = createWaterMarker({
    height: 3.0,
    position: { x: 20, y: 0, z: 20 },
    contour: [
        { x: -15, y: 0, z: -15 },
        { x: 15, y: 0, z: -15 },
        { x: 15, y: 0, z: 5 },
        { x: 5, y: 0, z: 5 },
        { x: 5, y: 0, z: 15 },
        { x: -15, y: 0, z: 15 }
    ],
    waterColor: 0x20b2aa,
    transparency: 0.8,
    waveScale: 1.5,
    distortionScale: 4.0
});
```

### 4. 创建圆形水体

```javascript
// 创建圆形水体
const circleContour = [];
const radius = 12;
const segments = 20;

for (let i = 0; i < segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    circleContour.push({
        x: Math.cos(angle) * radius,
        y: 0,
        z: Math.sin(angle) * radius
    });
}

const circleWater = createWaterMarker({
    height: 2.5,
    position: { x: -30, y: 0, z: -30 },
    contour: circleContour,
    waterColor: 0x4a90e2,
    transparency: 0.6,
    enableAnimation: true
});
```

## 配置参数

### 必需参数

| 参数 | 类型 | 说明 |
|------|------|------|
| `height` | Number | 水体高度，必须大于 0 |
| `contour` | Array | 轮廓坐标数组，至少需要 3 个点 |

### 可选参数

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `position` | Object | `{x:0, y:0, z:0}` | 水体位置 |
| `waterColor` | Number | `0x4a90e2` | 水体颜色（16进制） |
| `transparency` | Number | `0.7` | 透明度 (0-1) |
| `reflectivity` | Number | `0.8` | 反射强度 (0-1) |
| `refractionRatio` | Number | `1.33` | 折射比率 |
| `flowSpeed` | Number | `0.5` | 水流速度 |
| `waveScale` | Number | `1.0` | 波纹缩放 |
| `distortionScale` | Number | `3.7` | 扭曲强度 |
| `enableAnimation` | Boolean | `true` | 是否启用动画 |
| `debugMode` | Boolean | `false` | 调试模式 |

### 回调函数

| 参数 | 类型 | 说明 |
|------|------|------|
| `onCreated` | Function | 水体创建完成时的回调 |
| `onAddedToScene` | Function | 添加到场景完成时的回调 |

## 运行时控制

所有 WaterMarker 实例都会自动暴露控制方法到全局，可以通过 `window.waterMarkerControls` 访问：

### 基础控制

```javascript
// 设置位置
window.waterMarkerControls.setPosition(x, y, z);

// 设置水体颜色
window.waterMarkerControls.setWaterColor(0x20b2aa);

// 设置透明度
window.waterMarkerControls.setTransparency(0.8);
```

### 波浪控制

```javascript
// 设置波浪参数
window.waterMarkerControls.setWaveParameters(waveScale, distortionScale);

// 启用/禁用动画
window.waterMarkerControls.setAnimationEnabled(true);

// 更新轮廓
window.waterMarkerControls.updateContour(newContourArray);
```

### 预设配置

```javascript
// 平静水面
window.waterMarkerControls.presets.calm();

// 波涛汹涌
window.waterMarkerControls.presets.rough();

// 热带海水
window.waterMarkerControls.presets.tropical();

// 深海
window.waterMarkerControls.presets.deepOcean();
```

### 测试工具

```javascript
// 创建矩形水体
window.waterMarkerControls.test.createSimpleRect(width, height);

// 创建圆形水体
window.waterMarkerControls.test.createCircle(radius, segments);

// 波浪演示
window.waterMarkerControls.test.waveDemo();
```

## 完整示例

```javascript
// 创建一个完整配置的水体
const advancedWater = createWaterMarker({
    // 基础几何
    height: 4.0,
    position: { x: 0, y: -1, z: 0 },
    contour: [
        { x: -20, y: 0, z: -20 },
        { x: 20, y: 0, z: -20 },
        { x: 20, y: 0, z: 20 },
        { x: -20, y: 0, z: 20 }
    ],
    
    // 视觉效果
    waterColor: 0x4a90e2,
    transparency: 0.75,
    reflectivity: 0.9,
    refractionRatio: 1.33,
    
    // 动画参数
    flowSpeed: 0.8,
    waveScale: 1.3,
    distortionScale: 4.5,
    enableAnimation: true,
    
    // 调试和回调
    debugMode: true,
    onCreated: (waterMarker) => {
        console.log('🌊 水体创建完成:', waterMarker);
    },
    onAddedToScene: (waterMarker) => {
        console.log('🌊 水体已添加到场景:', waterMarker);
    }
});

// 5秒后切换到热带海水预设
setTimeout(() => {
    window.waterMarkerControls.presets.tropical();
}, 5000);
```

## 性能优化建议

1. **轮廓点数量**：建议轮廓点数不超过 50 个，以保持良好的性能
2. **动画控制**：在不需要动画时设置 `enableAnimation: false`
3. **透明度设置**：避免过低的透明度值，可能影响渲染性能
4. **合理的扭曲强度**：过高的 `distortionScale` 可能导致视觉效果不佳

## 故障排除

### 常见问题

1. **水体不显示**
   - 检查轮廓是否正确定义
   - 确保 `height` 参数大于 0
   - 检查位置是否在相机视野内

2. **动画不工作**
   - 确保 `enableAnimation` 设置为 `true`
   - 检查渲染循环是否正常运行

3. **性能问题**
   - 减少轮廓点数量
   - 降低 `distortionScale` 值
   - 关闭不必要的动画

### 调试方法

```javascript
// 获取调试信息
window.waterMarkerControls.debug();

// 获取当前配置
const config = window.waterMarkerControls.getOptions();
console.log('当前配置:', config);
```

## 更新日志

- **v1.0.0**：初始版本，支持基础水体生成和动画效果
- 支持自定义轮廓输入
- 提供完整的运行时控制接口
- 内置多种预设配置和测试工具 