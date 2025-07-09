# 3D力图系统配置文档

> 本文档详细说明了3D力图系统的配置文件和使用方法

## 配置文件说明

### 主题配置文件
- **`graph-config.js`** - 默认主题配置（紫橙青色彩搭配，消防训练主题）
- **`graph-config-galaxy.js`** - 银河系主题配置（深色宇宙背景，星光效果，星际任务主题）

### 主题切换方法
在 `testGraph.vue` 中修改导入配置：

```javascript
// 使用默认主题
import graphConfig from '../config/graph-config.js'

// 使用银河系主题
import graphConfig from '../config/graph-config-galaxy.js'
```

### 主题特色对比
| 特色 | 默认主题 | 银河系主题 |
|------|----------|------------|
| 背景色 | 深灰色 (#0d0d0d) | 深蓝黑色 (#000011) |
| 节点颜色 | 紫色、橙色、青色 | 白色、橙色、蓝色 |
| 光照效果 | 标准光照 | 星光闪烁 |
| 标签样式 | 半透明背景 | 发光效果 |
| 参训人员 | 张三 | 银河系指挥官 |
| 内容主题 | 消防训练 | 星际任务 |
| 文字内容 | 灭火器、舱室、搜救等 | 护盾系统、星舰、导航等 |

## 默认主题配置 (graph-config.js)

### 配置文件结构

### 1. 场景配置 (scene)

```javascript
scene: {
  background: "0x0d0d0d",              // 场景背景色（16进制颜色值）
  camera: {
    position: [0, 0, 20],              // 相机初始位置 [x, y, z]
    fov: 45,                           // 相机视野角度（推荐值：30-75度）
    near: 0.1,                         // 相机近裁剪面距离
    far: 1000                          // 相机远裁剪面距离
  }
}
```

### 2. 光照系统 (lighting)

#### 2.1 全局光照设置
- `intensity`: 全局光照强度倍数（推荐值：0.5-3.0）

#### 2.2 环境光 (ambient)
- `color`: 环境光颜色（16进制值）
- `intensity`: 环境光强度（推荐值：0.1-0.5）

#### 2.3 主方向光 (directional)
- `color`: 主方向光颜色
- `intensity`: 主方向光强度（推荐值：0.5-1.5）
- `position`: 光源位置 [x, y, z]
- `castShadow`: 是否产生阴影（true/false）

#### 2.4 点光源 (pointLights)
每个点光源包含：
- `id`: 光源唯一标识
- `color`: 光源颜色
- `intensity`: 光源强度
- `distance`: 光源影响距离
- `position`: 光源位置
- `animation`: 动画配置
  - `movement`: 位置动画（支持sin/cos函数）
  - `intensity`: 强度动画
  - `colorVariation`: 颜色变化动画

### 3. 物理引擎 (physics)

```javascript
physics: {
  damping: 0.85,                      // 阻尼系数（0-1，越大阻尼越大）
  timeStep: 0.01,                     // 物理时间步长（推荐值：0.01-0.05）
  centerForce: 0.1,                   // 中心引力强度（防止节点飘散）
  repulsionStrength: 500,             // 节点斥力强度（节点互相排斥）
  attractionStrength: 500             // 连接引力强度（连接的节点相互吸引）
}
```

### 4. 节点配置 (nodes)

#### 4.1 层级配置 (levels)
每个层级包含：
- `name`: 层级名称
- `radius`: 节点半径（推荐值：0.2-2.0）
- `fontSize`: 文字大小（像素值）
- `color`: 节点颜色（16进制）
- `colorVariation`: 颜色变化范围
- `material`: 材质配置
  - `emissiveColor`: 发光颜色
  - `emissiveIntensity`: 发光强度
  - `roughness`: 粗糙度（0-1）
  - `metalness`: 金属度（0-1）
  - `envMapIntensity`: 环境映射强度
- `animation`: 动画配置
- `position`: 位置配置

### 5. CSS3D标签配置 (css3d) ⭐

这是最新添加的重要配置部分：

```javascript
css3d: {
  enabled: true,                      // 是否启用CSS3D标签
  scale: {
    fixed: 0.05,                     // 固定缩放比例（推荐值：0.01-0.2）
    levelBased: {                    // 按层级设置的缩放比例 ⭐
      enabled: true,                 // 是否启用按层级缩放
      levels: {
        "1": 1.0,                    // 根节点缩放比例（最大）
        "2": 0.6,                    // 二级节点缩放比例（中等）
        "3": 0.1                     // 三级节点缩放比例（最小）
      }
    },
    dynamicScaling: {                 // 动态缩放配置（近大远小效果）
      enabled: false,                 // 是否启用动态缩放
      baseScale: 0.4,                 // 基础缩放
      maxScale: 0.8,                  // 最大缩放
      minScale: 0.15,                 // 最小缩放
      nearDistance: 10,               // 近距离阈值
      farDistance: 50                 // 远距离阈值
    }
  },
  animation: {                        // CSS3D动画配置
    fadeIn: {                         // 淡入动画（新增节点）
      duration: "0.8s",               // 动画持续时间
      easing: "ease-out",             // 缓动函数
      keyframes: {                    // 关键帧配置
        "0%": { opacity: 0, transform: "scale(0.03)" },
        "60%": { opacity: 0.8, transform: "scale(0.11)" },
        "100%": { opacity: 1, transform: "scale(0.1)" }
      }
    },
    fadeOut: {                        // 淡出动画（删除节点）
      duration: "0.5s",               // 动画持续时间
      easing: "ease-in",              // 缓动函数
      keyframes: {
        "0%": { opacity: 1, transform: "scale(0.1)" },
        "100%": { opacity: 0, transform: "scale(0.03)" }
      }
    }
  },
  style: {                            // CSS3D样式配置
    background: "rgba(0, 0, 0, 0.7)", // 背景色（支持rgba）
    borderRadius: "4px",              // 圆角半径
    padding: "2px 6px",               // 内边距
    backdropFilter: "blur(2px)",      // 背景模糊效果
    border: "1px solid rgba(255, 255, 255, 0.2)", // 边框
    minWidth: "20px",                 // 最小宽度
    color: "white",                   // 文字颜色
    fontFamily: "Arial, sans-serif",  // 字体
    fontWeight: "bold",               // 字体粗细
    textShadow: "1px 1px 2px rgba(0,0,0,0.8)", // 文字阴影
    textAlign: "center",              // 文字对齐
    whiteSpace: "nowrap",             // 文字换行
    userSelect: "none",               // 用户选择
    pointerEvents: "none"             // 指针事件
  }
}
```

### 6. 相机控制 (cameraControls)

```javascript
cameraControls: {
  enableDamping: true,                // 启用阻尼（平滑运动）
  dampingFactor: 0.05,                // 阻尼系数（0-1）
  autoRotate: true,                   // 自动旋转
  autoRotateSpeed: 1.0,               // 自动旋转速度
  enableZoom: true,                   // 启用缩放
  enablePan: true,                    // 启用平移
  minDistance: 5,                     // 最小距离
  maxDistance: 100,                   // 最大距离
  minPolarAngle: 0,                   // 最小极角
  maxPolarAngle: Math.PI              // 最大极角（π）
}
```

### 7. 动态控制 (controls)

#### 7.1 动态节点功能 (dynamicNodes)
```javascript
dynamicNodes: {
  interval: 3000,                   // 操作间隔（毫秒）
  minNodes: 3,                      // 每个二级节点最少子节点数
  maxNodes: 8,                      // 每个二级节点最多子节点数
  initialNodes: 4,                  // 初始子节点数量
  enabled: true                     // 功能启用状态
}
```

#### 7.2 自适应大小功能 (adaptiveSize)
```javascript
adaptiveSize: {
  enabled: true,                    // 功能启用状态
  radiusRange: {                    // 半径范围
    min: 0.8,                       // 最小倍数
    max: 1.6                        // 最大倍数
  },
  textLengthRange: {                // 文字长度范围
    min: 2,                         // 最小长度
    max: 16                         // 最大长度
  }
}
```

## 配置使用方法

### 1. 基本使用
```javascript
import graphConfig from '../config/graph-config.js'

// 使用配置
const sceneBackground = graphConfig.scene.background
const css3dScale = graphConfig.css3d.scale.fixed
```

### 2. CSS3D配置的使用
```javascript
// 获取CSS3D配置
const css3dConfig = graphConfig.css3d
const css3dStyle = css3dConfig.style

// 应用样式
labelDiv.style.background = css3dStyle.background
labelDiv.style.color = css3dStyle.color

// 应用缩放
const fixedScale = css3dConfig.scale.fixed
label.scale.set(fixedScale, fixedScale, fixedScale)
```

## 配置调优建议

### 1. 文字大小调整
- 调整 `nodes.levels[n].fontSize` 来改变文字大小
- 调整 `css3d.scale.fixed` 来改变整体标签缩放
- 调整 `css3d.scale.levelBased.levels` 来设置每个层级的缩放比例

### 2. 视觉效果优化
- 调整 `css3d.style.background` 改变标签背景
- 调整 `css3d.style.textShadow` 改变文字阴影效果
- 调整 `css3d.style.backdropFilter` 改变背景模糊效果

### 3. 动画效果调整
- 修改 `css3d.animation.fadeIn.duration` 调整动画速度
- 修改 `css3d.animation.fadeIn.keyframes` 调整动画效果

### 4. 层级缩放功能 ⭐
设置不同层级节点的缩放比例：
```javascript
css3d: {
  scale: {
    levelBased: {
      enabled: true,                 // 启用层级缩放
      levels: {
        "1": 1.0,                    // 根节点：最大（100%）
        "2": 0.6,                    // 二级节点：中等（60%）
        "3": 0.1                     // 三级节点：最小（10%）
      }
    }
  }
}
```

### 5. 动态缩放功能
如需启用近大远小效果：
```javascript
css3d: {
  scale: {
    dynamicScaling: {
      enabled: true,                 // 启用动态缩放
      baseScale: 0.4,               // 基础缩放
      maxScale: 0.8,                // 最大缩放（近距离）
      minScale: 0.15,               // 最小缩放（远距离）
      nearDistance: 10,             // 近距离阈值
      farDistance: 50               // 远距离阈值
    }
  }
}
```

### 6. 缩放优先级说明
不同缩放模式的优先级（从高到低）：
1. **层级缩放** (levelBased) - 按节点层级设置固定缩放比例
2. **动态缩放** (dynamicScaling) - 距离相机的近大远小效果
3. **固定缩放** (fixed) - 全局统一缩放比例

推荐使用层级缩放，可以清晰区分不同层级的重要性。

### 7. 缩放值优化建议
根据需要调整层级缩放值：
- **内容重要性**：重要的层级使用较大的缩放值（如根节点1.0）
- **视觉层次**：确保层级间有明显的大小差异（如1.0 → 0.6 → 0.1）
- **屏幕适配**：在不同屏幕尺寸下测试，确保文字可读性
- **动态场景**：考虑节点动态增减时的视觉效果

### 示例配置调整：
```javascript
// 突出根节点的配置
levels: {
  "1": 1.5,    // 根节点：加大强调
  "2": 0.8,    // 二级节点：中等
  "3": 0.2     // 三级节点：较小
}

// 平衡显示的配置
levels: {
  "1": 1.0,    // 根节点：标准
  "2": 0.7,    // 二级节点：稍小
  "3": 0.4     // 三级节点：更清晰
}
```

## 注意事项

1. **颜色格式**：使用16进制格式，如 "0xff0000"（红色）
2. **缩放值**：CSS3D缩放建议在 0.01-0.2 之间
3. **动画时间**：使用CSS时间格式，如 "0.8s"
4. **配置同步**：修改配置后需要重新加载页面生效
5. **性能考虑**：过多的动画效果可能影响性能

## 故障排除

### 1. 文字显示过大/过小
- 检查 `css3d.scale.fixed` 值
- 检查 `nodes.levels[n].fontSize` 值

### 2. 样式不生效
- 确认配置文件导入路径正确
- 检查JavaScript语法是否正确

### 3. 动画不工作
- 检查 `css3d.enabled` 是否为 true
- 检查CSS动画语法是否正确 