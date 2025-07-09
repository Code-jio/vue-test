# 力引导关系图配置系统

本配置系统允许您通过 JSON 配置文件完全定制力引导关系图的外观和行为。

## 配置文件结构

### 1. 场景配置 (scene)
```json
{
  "scene": {
    "background": "0x0d0d0d",    // 背景色
    "camera": {
      "position": [0, 0, 20],    // 相机位置
      "fov": 45,                 // 视野角度
      "near": 0.1,               // 近裁剪面
      "far": 1000                // 远裁剪面
    }
  }
}
```

### 2. 光照配置 (lighting)
```json
{
  "lighting": {
    "intensity": 1.5,           // 全局光照强度
    "ambient": {                // 环境光
      "color": "0x6a4c93",
      "intensity": 0.25
    },
    "directional": {            // 方向光
      "color": "0xf8f4ff",
      "intensity": 0.9,
      "position": [10, 10, 10],
      "castShadow": true
    },
    "pointLights": [            // 点光源数组
      {
        "id": "purple",
        "color": "0xba68c8",
        "intensity": 1.2,
        "distance": 35,
        "position": [8, 8, 8],
        "animation": {          // 动画配置
          "movement": {
            "x": { "function": "sin", "speed": 0.5, "amplitude": 12 },
            "z": { "function": "cos", "speed": 0.5, "amplitude": 12 }
          },
          "intensity": {
            "base": 1.0,
            "function": "sin",
            "speed": 2,
            "amplitude": 0.4
          }
        }
      }
    ]
  }
}
```

### 3. 物理配置 (physics)
```json
{
  "physics": {
    "damping": 0.85,            // 阻尼系数
    "timeStep": 0.01,           // 时间步长
    "centerForce": 0.1,         // 中心力
    "repulsionStrength": 500,   // 斥力强度
    "attractionStrength": 500   // 引力强度
  }
}
```

### 4. 节点配置 (nodes)
```json
{
  "nodes": {
    "defaultCount": 20,         // 默认节点数量
    "levels": {
      "1": {                    // 第一级节点（根节点）
        "name": "root",
        "radius": 1.0,          // 节点半径
        "color": "0x9c27b0",    // 节点颜色
        "colorVariation": {     // 颜色变化范围
          "min": 0.9,
          "max": 1.1
        },
        "material": {           // 材质配置
          "emissiveColor": "0x7b1fa2",
          "emissiveIntensity": 0.4,
          "roughness": 0.1,
          "metalness": 0.9,
          "envMapIntensity": 1.2
        },
        "animation": {          // 动画配置
          "emissiveVariation": {
            "base": 0.4,
            "function": "sin",
            "speed": 2,
            "amplitude": 0.15
          }
        },
        "position": {           // 位置配置
          "type": "center",
          "coordinates": [0, 0, 0]
        }
      }
    }
  }
}
```

### 5. 连接配置 (connections)
```json
{
  "connections": {
    "types": {
      "root-main": {            // 根节点到主节点的连接
        "length": 3,            // 连接长度
        "strength": 0.5,        // 连接强度
        "color": "0xba68c8",    // 连接颜色
        "opacity": 0.8,         // 透明度
        "animation": {          // 动画配置
          "opacityVariation": {
            "base": 0.6,
            "function": "sin",
            "speed": 3,
            "amplitude": 0.2
          }
        }
      }
    }
  }
}
```

### 6. 相机控制配置 (cameraControls)
```json
{
  "cameraControls": {
    "enableDamping": true,        // 启用阻尼
    "dampingFactor": 0.05,        // 阻尼系数
    "autoRotate": true,           // 自动旋转
    "autoRotateSpeed": 1.0,       // 自动旋转速度
    "enableZoom": true,           // 启用缩放
    "enablePan": true,            // 启用平移
    "minDistance": 5,             // 最小距离
    "maxDistance": 100,           // 最大距离
    "minPolarAngle": 0,           // 最小极角
    "maxPolarAngle": 3.141592653589793  // 最大极角 (π)
  }
}
```

### 7. 控制配置 (controls)
```json
{
  "controls": {
    "nodeCount": {              // 节点数量控制
      "min": 5,
      "max": 50,
      "default": 20
    },
    "autoAddNodes": {           // 自动添加节点
      "interval": 3000,         // 间隔（毫秒）
      "maxNodes": 50            // 最大节点数
    }
  }
}
```

### 8. 动画配置 (animation)
```json
{
  "animation": {
    "newNodeAnimation": {       // 新节点动画
      "duration": 50,           // 持续时间
      "speed": 0.02,            // 速度
      "initialScale": 0.1,      // 初始缩放
      "easing": "easeOutCubic"  // 缓动函数
    },
    "spawnPosition": {          // 生成位置
      "type": "random",
      "range": 20
    }
  }
}
```

### 9. 标签配置 (labels)
```json
{
  "labels": {
    "trainee": {                // 训练人员信息
      "name": "张三"            // 参训人员姓名
    },
    "secondLevel": [            // 二级节点配置
      {
        "id": "behavior",       // 行为节点
        "name": "行为",
        "items": [              // 具体行为列表
          "打开灭火器",
          "进入2号舱室",
          "打开排烟机",
          "下达搜救指令",
          "关闭排水阀"
          // ... 更多行为
        ]
      },
      {
        "id": "factor",         // 评分因子节点
        "name": "评分因子",
        "items": [              // 具体评分因子列表
          "准确性",
          "及时性",
          "有效性",
          "全面性",
          "稳定性"
          // ... 更多评分因子
        ]
      },
      {
        "id": "task",           // 任务节点
        "name": "任务",
        "items": [              // 具体任务列表
          "炉灶火灭火",
          "会人员搜救",
          "迷笼逃脱",
          "机舱火灾扑救",
          "伤员搬运"
          // ... 更多任务
        ]
      }
    ]
  }
}
```

#### 标签系统说明：
- **第一级节点（根节点）**：显示参训人员姓名，可在 `labels.trainee.name` 中配置
- **第二级节点**：显示三个主要类别（行为、评分因子、任务），固定显示 `secondLevel` 数组中的名称
- **第三级节点**：显示具体的行为、评分因子或任务项目，从对应类别的 `items` 数组中循环获取

#### 标签样式特点：
- 使用 CSS2D 技术实现，始终面向相机
- 不同层级有不同的样式和颜色：
  - 第一级：紫色主题，最大字体
  - 第二级：橙色主题，中等字体
  - 第三级：青色主题，最小字体
- 支持半透明背景和毛玻璃效果
- 自动适应文本长度，防止换行

## 使用方法

### 1. 创建新的配置文件
在 `src/config/` 目录下创建新的 JSON 配置文件，例如：
- `graph-config.json` (默认配置)
- `graph-config-galaxy.json` (银河系主题)
- `graph-config-network.json` (网络主题)

### 2. 修改 Vue 组件
在 `testGraph.vue` 中修改导入语句：
```javascript
// 使用默认配置
import graphConfig from '../config/graph-config.json'

// 使用银河系主题
import graphConfig from '../config/graph-config-galaxy.json'
```

### 3. 配置文件切换
您可以创建一个配置选择器，让用户动态切换不同的配置文件：

```javascript
// 配置文件映射
const configFiles = {
  'default': () => import('../config/graph-config.json'),
  'galaxy': () => import('../config/graph-config-galaxy.json'),
  'network': () => import('../config/graph-config-network.json')
}

// 动态加载配置
const loadConfig = async (configName) => {
  const config = await configFiles[configName]()
  // 重新初始化场景
  initScene()
  generateGraphData()
  createObjects()
}
```

## 配置文件示例

### 默认配置 (graph-config.json)
紫色/橙色/青色的科技主题，适合展示层级关系。

### 银河系配置 (graph-config-galaxy.json)
白色/金色/蓝色的宇宙主题，更大的节点和更柔和的光照。

## 自定义配置

您可以通过以下方式自定义配置：

1. **颜色主题**：修改 `color` 和 `emissiveColor` 字段
2. **节点大小**：调整 `radius` 值
3. **光照效果**：修改 `lighting` 配置
4. **物理行为**：调整 `physics` 参数
5. **相机控制**：修改 `cameraControls` 配置
6. **动画效果**：修改 `animation` 配置

## 颜色值格式

颜色值使用十六进制格式，以 `"0x"` 开头：
- `"0xffffff"` - 白色
- `"0xff0000"` - 红色
- `"0x00ff00"` - 绿色
- `"0x0000ff"` - 蓝色
- `"0x000000"` - 黑色

## 相机控制参数

相机控制参数详细说明：

### 基础控制
- `enableDamping` - 启用阻尼，使相机移动更平滑
- `dampingFactor` - 阻尼系数 (0-1)，值越小阻尼越强
- `enableZoom` - 是否允许缩放
- `enablePan` - 是否允许平移

### 自动旋转
- `autoRotate` - 启用自动旋转
- `autoRotateSpeed` - 自动旋转速度，正值顺时针，负值逆时针

### 距离限制
- `minDistance` - 相机与目标的最小距离
- `maxDistance` - 相机与目标的最大距离

### 角度限制
- `minPolarAngle` - 垂直旋转的最小角度 (0 = 顶部)
- `maxPolarAngle` - 垂直旋转的最大角度 (π ≈ 3.14 = 底部)

### 推荐配置
```json
{
  "科技主题": {
    "autoRotateSpeed": 1.0,
    "dampingFactor": 0.05
  },
  "银河主题": {
    "autoRotateSpeed": 0.5,
    "dampingFactor": 0.03
  },
  "静态展示": {
    "autoRotate": false,
    "dampingFactor": 0.1
  }
}
```

## 动画函数

支持的动画函数：
- `"sin"` - 正弦函数
- `"cos"` - 余弦函数

动画参数：
- `base` - 基础值
- `function` - 函数类型
- `speed` - 速度
- `amplitude` - 振幅
- `indexOffset` - 索引偏移（用于创建不同步效果）

## 最佳实践

1. **性能优化**：避免过多的点光源和复杂的动画
2. **视觉平衡**：确保颜色搭配和谐
3. **用户体验**：保持控制参数在合理范围内
4. **主题一致性**：确保所有配置项都符合同一主题

通过这个配置系统，您可以轻松创建各种风格的力引导关系图，无需修改核心代码。 