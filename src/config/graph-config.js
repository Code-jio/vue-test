/**
 * ========================================
 * 3D力图系统配置文件
 * ========================================
 * 
 * 此文件包含了3D力图系统的所有配置参数
 * 所有参数都有详细的注释说明其作用和可选值
 * 
 * 使用方法：
 * import graphConfig from './graph-config.js'
 * 
 * 更新时间：2024年
 * 版本：v2.0
 */

export default {
  // ========================================
  // 3D场景基础配置
  // ========================================
  scene: {
    background: "0x0d0d0d",              // 场景背景色（深灰色）
    camera: {
      position: [0, 0, 20],              // 相机初始位置 [x, y, z]
      fov: 45,                           // 相机视野角度（度）
      near: 0.1,                         // 相机近裁剪面距离
      far: 1000                          // 相机远裁剪面距离
    }
  },

  // ========================================
  // 光照系统配置
  // ========================================
  lighting: {
    intensity: 1.5,                     // 全局光照强度倍数
    ambient: {
      color: "0x6a4c93",                // 环境光颜色（紫色）
      intensity: 0.25                   // 环境光强度
    },
    directional: {
      color: "0xf8f4ff",                // 主方向光颜色（白色）
      intensity: 0.9,                   // 主方向光强度
      position: [10, 10, 10],           // 主方向光位置
      castShadow: true                   // 是否产生阴影
    },
    pointLights: [
      {
        id: "purple",                    // 紫色点光源
        color: "0xba68c8",              // 光源颜色
        intensity: 1.2,                 // 光源强度
        distance: 35,                   // 光源影响距离
        position: [8, 8, 8],            // 光源位置
        animation: {
          movement: {                    // 位置动画
            x: { function: "sin", speed: 0.5, amplitude: 12 },  // X轴正弦运动
            z: { function: "cos", speed: 0.5, amplitude: 12 }   // Z轴余弦运动
          },
          intensity: {                   // 强度动画
            base: 1.0,                  // 基础强度
            function: "sin",            // 动画函数类型
            speed: 2,                   // 动画速度
            amplitude: 0.4              // 动画幅度
          },
          colorVariation: {              // 颜色变化动画
            base: 0.8,                  // 基础颜色强度
            function: "sin",            // 动画函数类型
            speed: 1.2,                 // 动画速度
            amplitude: 0.2              // 动画幅度
          }
        }
      },
      {
        id: "orange",                    // 橙色点光源
        color: "0xff8a65",              // 光源颜色
        intensity: 1.2,                 // 光源强度
        distance: 35,                   // 光源影响距离
        position: [-8, 8, -8],          // 光源位置
        animation: {
          movement: {                    // 位置动画
            x: { function: "cos", speed: 0.7, amplitude: 10 },    // X轴余弦运动
            y: { function: "sin", speed: 0.4, amplitude: 8, offset: 5 }  // Y轴正弦运动（带偏移）
          },
          intensity: {                   // 强度动画
            base: 1.0,
            function: "cos",
            speed: 1.5,
            amplitude: 0.4
          },
          colorVariation: {              // 颜色变化动画
            base: 0.8,
            function: "cos",
            speed: 1.8,
            amplitude: 0.2
          }
        }
      },
      {
        id: "cyan",                      // 青色点光源
        color: "0x4dd0e1",              // 光源颜色
        intensity: 1.2,                 // 光源强度
        distance: 35,                   // 光源影响距离
        position: [0, -8, 8],           // 光源位置
        animation: {
          movement: {                    // 位置动画
            y: { function: "sin", speed: 0.3, amplitude: 10 },    // Y轴正弦运动
            z: { function: "cos", speed: 0.8, amplitude: 8 }      // Z轴余弦运动
          },
          intensity: {                   // 强度动画
            base: 1.0,
            function: "sin",
            speed: 1.8,
            amplitude: 0.4
          },
          colorVariation: {              // 颜色变化动画
            base: 0.8,
            function: "sin",
            speed: 2.2,
            amplitude: 0.2
          }
        }
      }
    ],
    fillLight: {
      color: "0x7ec8e3",                // 补充光颜色（青色）
      intensity: 0.35,                  // 补充光强度
      position: [-10, -10, -10]         // 补充光位置
    },
    topLight: {
      color: "0xffb74d",                // 顶部光颜色（橙色）
      intensity: 0.25,                  // 顶部光强度
      position: [0, 20, 0]              // 顶部光位置
    }
  },

  // ========================================
  // 物理引擎配置
  // ========================================
  physics: {
    damping: 0.85,                      // 阻尼系数（0-1，越大阻尼越大）
    timeStep: 0.01,                     // 物理时间步长
    centerForce: 0.1,                   // 中心引力强度
    repulsionStrength: 500,             // 全局基础斥力强度
    attractionStrength: 500,            // 全局基础引力强度
    levelBased: {                       // 按层级设置的物理参数 ⭐
      enabled: true,                    // 是否启用层级物理效果
      levels: {
        "1": {                          // 根节点物理参数（最强）
          mass: 3.0,                    // 质量倍数（影响惯性）
          repulsionMultiplier: 1.5,     // 斥力倍数
          attractionMultiplier: 1.5,    // 引力倍数
          centerForceMultiplier: 2.0,   // 中心力倍数
          influence: 2.0                // 对其他节点的影响倍数
        },
        "2": {                          // 二级节点物理参数（中等）
          mass: 1.5,                    // 质量倍数
          repulsionMultiplier: 1.0,     // 斥力倍数
          attractionMultiplier: 1.0,    // 引力倍数
          centerForceMultiplier: 1.0,   // 中心力倍数
          influence: 1.2                // 对其他节点的影响倍数
        },
        "3": {                          // 三级节点物理参数（最小）
          mass: 0.8,                    // 质量倍数
          repulsionMultiplier: 0.6,     // 斥力倍数
          attractionMultiplier: 0.8,    // 引力倍数
          centerForceMultiplier: 0.5,   // 中心力倍数
          influence: 0.8                // 对其他节点的影响倍数
        }
      }
    }
  },

  // ========================================
  // 节点配置
  // ========================================
  nodes: {
    defaultCount: 20,                   // 默认节点数量
    levels: {
      "1": {                              // 第一层级（根节点）
        name: "root",                   // 层级名称
        radius: 1.0,                    // 节点半径
        fontSize: 10,                   // 文字大小（像素）
        color: "0x9c27b0",              // 节点颜色（紫色）
        colorVariation: {               // 颜色变化范围
          min: 0.9,                     // 最小颜色强度倍数
          max: 1.1                      // 最大颜色强度倍数
        },
        material: {                     // 材质配置
          emissiveColor: "0x7b1fa2",    // 发光颜色
          emissiveIntensity: 0.4,       // 发光强度
          roughness: 0.1,               // 粗糙度（0-1）
          metalness: 0.9,               // 金属度（0-1）
          envMapIntensity: 1.2          // 环境映射强度
        },
        animation: {                    // 动画配置
          emissiveVariation: {          // 发光变化动画
            base: 0.4,                  // 基础发光强度
            function: "sin",            // 动画函数类型
            speed: 2,                   // 动画速度
            amplitude: 0.15             // 动画幅度
          }
        },
        position: {                     // 位置配置
          type: "center",               // 位置类型（中心）
          coordinates: [0, 0, 0]        // 具体坐标
        }
      },
      "2": {                              // 第二层级（主节点）
        name: "main",                   // 层级名称
        radius: 0.6,                    // 节点半径
        fontSize: 8,                    // 文字大小（像素）
        color: "0xff6b35",              // 节点颜色（橙色）
        colorVariation: {               // 颜色变化范围
          min: 0.85,                    // 最小颜色强度倍数
          max: 1.15                     // 最大颜色强度倍数
        },
        material: {                     // 材质配置
          emissiveColor: "0xd84315",    // 发光颜色
          emissiveIntensity: 0.15,      // 发光强度
          roughness: 0.15,              // 粗糙度
          metalness: 0.85,              // 金属度
          envMapIntensity: 1.0          // 环境映射强度
        },
        animation: {                    // 动画配置
          emissiveVariation: {          // 发光变化动画
            base: 0.15,                 // 基础发光强度
            function: "sin",            // 动画函数类型
            speed: 1.5,                 // 动画速度
            amplitude: 0.08             // 动画幅度
          }
        },
        position: {                     // 位置配置
          type: "circular",             // 位置类型（圆形分布）
          radius: 5,                    // 分布半径
          maxCount: 5,                  // 最大节点数
          zVariation: 2                 // Z轴变化范围
        }
      },
      "3": {                              // 第三层级（子节点）
        name: "sub",                    // 层级名称
        radius: 0.3,                    // 节点半径
        fontSize: 6,                    // 文字大小（像素）
        color: "0x00bcd4",              // 节点颜色（青色）
        colorVariation: {               // 颜色变化范围
          min: 0.8,                     // 最小颜色强度倍数
          max: 1.2                      // 最大颜色强度倍数
        },
        material: {                     // 材质配置
          emissiveColor: "0x006064",    // 发光颜色
          emissiveIntensity: 0.1,       // 发光强度
          roughness: 0.3,               // 粗糙度
          metalness: 0.6,               // 金属度
          envMapIntensity: 0.7          // 环境映射强度
        },
        animation: {                    // 动画配置
          emissiveVariation: {          // 发光变化动画
            base: 0.1,                  // 基础发光强度
            function: "sin",            // 动画函数类型
            speed: 1.8,                 // 动画速度
            amplitude: 0.05,            // 动画幅度
            indexOffset: 0.5            // 索引偏移（产生相位差）
          }
        },
        position: {                     // 位置配置
          type: "aroundParent",         // 位置类型（围绕父节点）
          radiusMin: 2,                 // 最小分布半径
          radiusMax: 3.5,               // 最大分布半径
          zVariation: 3                 // Z轴变化范围
        }
      }
    }
  },

  // ========================================
  // 连接线配置
  // ========================================
  connections: {
    types: {
      "root-main": {                      // 根节点到主节点的连接
        length: 3,                      // 连接长度
        strength: 0.5,                  // 连接强度
        color: "0xba68c8",              // 连接颜色
        opacity: 0.8,                   // 连接透明度
        animation: {                    // 动画配置
          opacityVariation: {           // 透明度变化动画
            base: 0.6,                  // 基础透明度
            function: "sin",            // 动画函数类型
            speed: 3,                   // 动画速度
            amplitude: 0.2              // 动画幅度
          }
        }
      },
      "main-sub": {                       // 主节点到子节点的连接
        length: 2,                      // 连接长度
        strength: 0.5,                  // 连接强度
        color: "0xff8a65",              // 连接颜色
        opacity: 0.7,                   // 连接透明度
        animation: {                    // 动画配置
          opacityVariation: {           // 透明度变化动画
            base: 0.7,                  // 基础透明度
            function: "cos",            // 动画函数类型
            speed: 2.5,                 // 动画速度
            amplitude: 0.15             // 动画幅度
          }
        }
      },
      "sub-sub": {                        // 子节点间的连接
        length: 2,                      // 连接长度
        strength: 0.5,                  // 连接强度
        color: "0x4dd0e1",              // 连接颜色
        opacity: 0.6,                   // 连接透明度
        animation: {                    // 动画配置
          opacityVariation: {           // 透明度变化动画
            base: 0.6,                  // 基础透明度
            function: "sin",            // 动画函数类型
            speed: 2,                   // 动画速度
            amplitude: 0.1              // 动画幅度
          }
        }
      }
    }
  },

  // ========================================
  // 动画配置
  // ========================================
  animation: {
    newNodeAnimation: {                 // 新节点动画配置
      duration: 50,                     // 动画持续时间（帧）
      speed: 0.02,                      // 动画速度
      initialScale: 0.1,                // 初始缩放
      easing: "easeOutCubic"            // 缓动函数类型
    },
    spawnPosition: {                    // 生成位置配置
      type: "random",                   // 生成类型（随机）
      range: 20                         // 生成范围
    }
  },

  // ========================================
  // CSS3D标签配置
  // ========================================
  css3d: {
    enabled: true,                      // 是否启用CSS3D标签
    scale: {
      fixed: 0.05,                     // 固定缩放比例（推荐值：0.05）
      levelBased: {                    // 按层级设置的缩放比例
        enabled: true,                 // 是否启用按层级缩放
        levels: {
          "1": 1.0,                    // 根节点缩放比例
          "2": 0.6,                    // 二级节点缩放比例
          "3": 0.3                     // 三级节点缩放比例
        }
      }
    },
    animation: {                        // CSS3D动画配置
      fadeIn: {                         // 淡入动画（新增节点）
        duration: "0.8s",               // 动画持续时间
        easing: "ease-out",             // 缓动函数
        keyframes: {                    // 关键帧配置
          "0%": { opacity: 0, transform: "scale(0.03)" },    // 起始状态
          "60%": { opacity: 0.8, transform: "scale(0.11)" }, // 中间状态
          "100%": { opacity: 1, transform: "scale(0.1)" }    // 结束状态
        }
      },
      fadeOut: {                        // 淡出动画（删除节点）
        duration: "0.5s",               // 动画持续时间
        easing: "ease-in",              // 缓动函数
        keyframes: {                    // 关键帧配置
          "0%": { opacity: 1, transform: "scale(0.1)" },     // 起始状态
          "100%": { opacity: 0, transform: "scale(0.03)" }   // 结束状态
        }
      }
    },
    style: {                            // CSS3D样式配置
      color: "white",                   // 文字颜色
      fontFamily: "Arial, sans-serif",  // 字体
      fontWeight: "bold",               // 字体粗细
      textAlign: "center",              // 文字对齐
      whiteSpace: "nowrap",             // 文字换行
      userSelect: "none"               // 用户选择
    }
  },

  // ========================================
  // 相机控制配置
  // ========================================
  cameraControls: {
    enableDamping: true,                // 启用阻尼
    dampingFactor: 0.05,                // 阻尼系数
    autoRotate: true,                   // 自动旋转
    autoRotateSpeed: 1.0,               // 自动旋转速度
    enableZoom: true,                   // 启用缩放
    enablePan: true,                    // 启用平移
    minDistance: 5,                     // 最小距离
    maxDistance: 100,                   // 最大距离
    minPolarAngle: 0.05,                   // 最小极角
    maxPolarAngle: Math.PI * 0.95             // 最大极角（π）
  },

  // ========================================
  // 控制配置
  // ========================================
  controls: {
    nodeCount: {                        // 节点数量控制
      min: 5,                           // 最小节点数
      max: 50,                          // 最大节点数
      default: 20                       // 默认节点数
    },
    repulsionStrength: {                // 斥力强度控制
      min: 100,                         // 最小斥力
      max: 10000,                       // 最大斥力
      default: 500                      // 默认斥力
    },
    attractionStrength: {               // 引力强度控制
      min: 100,                         // 最小引力
      max: 10000,                       // 最大引力
      default: 500                      // 默认引力
    },
    lightIntensity: {                   // 光照强度控制
      min: 0.5,                         // 最小光照
      max: 3,                           // 最大光照
      step: 0.1,                        // 调整步长
      default: 1.5                      // 默认光照
    },
    autoAddNodes: {                     // 自动添加节点
      interval: 3000,                   // 添加间隔（毫秒）
      maxNodes: 50                      // 最大节点数
    },
    dynamicNodes: {                     // 动态节点功能
      interval: 3000,                   // 操作间隔（毫秒）
      minNodes: 3,                      // 每个二级节点最少子节点数
      maxNodes: 8,                      // 每个二级节点最多子节点数
      initialNodes: 4,                  // 初始子节点数量
      enabled: true                     // 功能启用状态
    },
    adaptiveSize: {                     // 自适应大小功能
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
  },

  // ========================================
  // 渲染器配置
  // ========================================
  renderer: {
    antialias: true,                    // 抗锯齿
    shadowMap: {                        // 阴影配置
      enabled: true,                    // 启用阴影
      type: "PCFSoftShadowMap"          // 阴影类型
    }
  },

  // ========================================
  // 标签数据配置
  // ========================================
  labels: {
    trainee: {
      name: "张三"                      // 参训人员姓名
    },
    secondLevel: [                      // 二级节点配置
      {
        id: "behavior",                 // 行为节点
        name: "行为",                   // 显示名称
        items: [                        // 具体行为项目
          "打开灭火器", "进入2号舱室", "打开排烟机", "下达搜救指令", "关闭排水阀",
          "检查呼吸器", "佩戴防护服", "连接水带", "检查舱室温度", "关闭电源总闸",
          "组织队员集合", "进行舱室通风", "检查舱门密封", "记录操作日志", "进行伤员转移",
          "检查气体浓度", "进行现场警戒", "进行灭火剂补充", "检查通讯设备", "进行现场照明"
        ]
      },
      {
        id: "factor",                   // 评分因子节点
        name: "评分因子",               // 显示名称
        items: [                        // 具体评分因子
          "准确性", "及时性", "有效性", "全面性", "稳定性", "协同性", "规范性", "安全性",
          "可靠性", "灵活性", "预见性", "反应速度", "资源利用率", "团队协作", "沟通效率", "决策质量"
        ]
      },
      {
        id: "task",                     // 任务节点
        name: "任务",                   // 显示名称
        items: [                        // 具体任务项目
          "炉灶火灭火", "会人员搜救", "迷笼逃脱", "机舱火灾扑救", "伤员搬运", "舱室排烟",
          "设备断电", "现场警戒", "物资搬运", "现场照明", "通讯联络", "现场指挥",
          "现场评估", "现场记录", "现场复盘", "现场总结"
        ]
      }
    ]
  }
} 