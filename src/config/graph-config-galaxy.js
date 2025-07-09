/**
 * ========================================
 * 3D银河系主题力图配置文件
 * ========================================
 * 
 * 此文件包含了银河系主题的3D力图系统配置参数
 * 采用深色宇宙背景，星光点缀，呈现银河系视觉效果
 * 
 * 主题特色：
 * - 深色宇宙背景
 * - 发光的星体节点
 * - 星光闪烁动画
 * - 银河系色彩搭配
 * 
 * 使用方法：
 * import graphConfig from './graph-config-galaxy.js'
 * 
 * 更新时间：2024年
 * 版本：v2.0 Galaxy Edition
 */

export default {
  // ========================================
  // 3D场景基础配置 - 宇宙深空主题
  // ========================================
  scene: {
    background: "0x000011",              // 深色宇宙背景（深蓝黑色）
    camera: {
      position: [0, 0, 25],              // 相机初始位置 [x, y, z]（稍远观察）
      fov: 50,                           // 相机视野角度（稍大的视野）
      near: 0.1,                         // 相机近裁剪面距离
      far: 1000                          // 相机远裁剪面距离
    }
  },

  // ========================================
  // 光照系统配置 - 星光照明系统
  // ========================================
  lighting: {
    intensity: 2.0,                     // 全局光照强度倍数（更强烈的星光）
    ambient: {
      color: "0x111144",                // 环境光颜色（深蓝色宇宙光）
      intensity: 0.3                    // 环境光强度（稍强的基础照明）
    },
    directional: {
      color: "0xffffff",                // 主方向光颜色（纯白星光）
      intensity: 1.0,                   // 主方向光强度
      position: [15, 15, 15],           // 主方向光位置
      castShadow: true                   // 是否产生阴影
    },
    pointLights: [
      {
        id: "centralStar",               // 中央恒星光源
        color: "0xffffff",              // 白色恒星光
        intensity: 1.8,                 // 强烈的恒星光芒
        distance: 50,                   // 光源影响距离
        position: [0, 0, 0],            // 位于中心位置
        animation: {
          movement: {                    // 恒星轻微摆动
            x: { function: "sin", speed: 0.2, amplitude: 8 },  // X轴缓慢摆动
            y: { function: "cos", speed: 0.3, amplitude: 5 }   // Y轴缓慢摆动
          },
          intensity: {                   // 恒星亮度脉动
            base: 1.8,                  // 基础亮度
            function: "sin",            // 正弦脉动
            speed: 1.5,                 // 脉动速度
            amplitude: 0.5              // 脉动幅度
          },
          colorVariation: {              // 恒星颜色变化
            base: 1.0,                  // 基础颜色强度
            function: "sin",            // 正弦变化
            speed: 0.8,                 // 变化速度
            amplitude: 0.1              // 变化幅度
          }
        }
      },
      {
        id: "orangeStar",                // 橙色恒星光源
        color: "0xffaa00",              // 橙色恒星光
        intensity: 1.2,                 // 中等恒星光芒
        distance: 40,                   // 光源影响距离
        position: [10, -10, 5],         // 偏离中心位置
        animation: {
          movement: {                    // 恒星轨道运动
            x: { function: "cos", speed: 0.4, amplitude: 6 },    // X轴轨道运动
            z: { function: "sin", speed: 0.5, amplitude: 8 }     // Z轴轨道运动
          },
          intensity: {                   // 恒星亮度脉动
            base: 1.2,                  // 基础亮度
            function: "cos",            // 余弦脉动
            speed: 1.2,                 // 脉动速度
            amplitude: 0.3              // 脉动幅度
          },
          colorVariation: {              // 恒星颜色变化
            base: 0.9,                  // 基础颜色强度
            function: "cos",            // 余弦变化
            speed: 1.0,                 // 变化速度
            amplitude: 0.15             // 变化幅度
          }
        }
      },
      {
        id: "blueStar",                  // 蓝色恒星光源
        color: "0x00aaff",              // 蓝色恒星光
        intensity: 1.0,                 // 较弱的恒星光芒
        distance: 35,                   // 光源影响距离
        position: [-8, 8, -3],          // 另一个偏离位置
        animation: {
          movement: {                    // 恒星轨道运动
            y: { function: "sin", speed: 0.3, amplitude: 7 },    // Y轴轨道运动
            z: { function: "cos", speed: 0.6, amplitude: 6 }     // Z轴轨道运动
          },
          intensity: {                   // 恒星亮度脉动
            base: 1.0,                  // 基础亮度
            function: "sin",            // 正弦脉动
            speed: 1.8,                 // 脉动速度
            amplitude: 0.4              // 脉动幅度
          },
          colorVariation: {              // 恒星颜色变化
            base: 0.8,                  // 基础颜色强度
            function: "sin",            // 正弦变化
            speed: 1.5,                 // 变化速度
            amplitude: 0.2              // 变化幅度
          }
        }
      }
    ],
    fillLight: {
      color: "0x2200ff",                // 补充光颜色（深蓝色）
      intensity: 0.2,                   // 补充光强度（较弱）
      position: [-20, -20, -20]         // 补充光位置
    },
    topLight: {
      color: "0xffff00",                // 顶部光颜色（黄色）
      intensity: 0.3,                   // 顶部光强度
      position: [0, 30, 0]              // 顶部光位置
    }
  },

  // ========================================
  // 物理引擎配置 - 银河系引力系统
  // ========================================
  physics: {
    damping: 0.9,                       // 阻尼系数（较高，模拟太空阻力）
    timeStep: 0.01,                     // 物理时间步长
    centerForce: 0.05,                  // 中心引力强度（较弱的银河系中心引力）
    repulsionStrength: 800,             // 节点斥力强度（较强，防止星体碰撞）
    attractionStrength: 300             // 连接引力强度（较弱，松散的星系结构）
  },

  // ========================================
  // 节点配置 - 星体系统
  // ========================================
  nodes: {
    defaultCount: 30,                   // 默认星体数量
    levels: {
      "1": {                              // 第一层级（中央恒星）
        name: "centralStar",            // 层级名称
        radius: 1.5,                    // 恒星半径（较大）
        fontSize: 12,                   // 文字大小（像素）
        color: "0xffffff",              // 恒星颜色（纯白色）
        colorVariation: {               // 颜色变化范围
          min: 0.8,                     // 最小颜色强度倍数
          max: 1.2                      // 最大颜色强度倍数
        },
        material: {                     // 材质配置
          emissiveColor: "0xffffff",    // 发光颜色（纯白发光）
          emissiveIntensity: 0.8,       // 发光强度（强烈发光）
          roughness: 0.0,               // 粗糙度（完全光滑）
          metalness: 1.0,               // 金属度（完全金属）
          envMapIntensity: 2.0          // 环境映射强度（强烈反射）
        },
        animation: {                    // 动画配置
          emissiveVariation: {          // 发光变化动画
            base: 0.8,                  // 基础发光强度
            function: "sin",            // 正弦变化
            speed: 1.5,                 // 变化速度
            amplitude: 0.3              // 变化幅度
          }
        },
        position: {                     // 位置配置
          type: "center",               // 位置类型（中心）
          coordinates: [0, 0, 0]        // 具体坐标
        }
      },
      "2": {                              // 第二层级（螺旋臂恒星）
        name: "spiralStars",            // 层级名称
        radius: 0.8,                    // 恒星半径（中等）
        fontSize: 9,                    // 文字大小（像素）
        color: "0xffaa00",              // 恒星颜色（橙黄色）
        colorVariation: {               // 颜色变化范围
          min: 0.7,                     // 最小颜色强度倍数
          max: 1.3                      // 最大颜色强度倍数
        },
        material: {                     // 材质配置
          emissiveColor: "0xff8800",    // 发光颜色（橙色发光）
          emissiveIntensity: 0.3,       // 发光强度（中等发光）
          roughness: 0.1,               // 粗糙度（近似光滑）
          metalness: 0.8,               // 金属度（高金属度）
          envMapIntensity: 1.5          // 环境映射强度（较强反射）
        },
        animation: {                    // 动画配置
          emissiveVariation: {          // 发光变化动画
            base: 0.3,                  // 基础发光强度
            function: "sin",            // 正弦变化
            speed: 1.0,                 // 变化速度
            amplitude: 0.2              // 变化幅度
          }
        },
        position: {                     // 位置配置
          type: "circular",             // 位置类型（圆形分布）
          radius: 8,                    // 分布半径（较大，形成螺旋臂）
          maxCount: 8,                  // 最大恒星数
          zVariation: 1                 // Z轴变化范围（较小）
        }
      },
      "3": {                              // 第三层级（外围星体）
        name: "outerStars",             // 层级名称
        radius: 0.4,                    // 星体半径（较小）
        fontSize: 7,                    // 文字大小（像素）
        color: "0x00aaff",              // 星体颜色（蓝色）
        colorVariation: {               // 颜色变化范围
          min: 0.6,                     // 最小颜色强度倍数
          max: 1.4                      // 最大颜色强度倍数
        },
        material: {                     // 材质配置
          emissiveColor: "0x0088ff",    // 发光颜色（蓝色发光）
          emissiveIntensity: 0.2,       // 发光强度（较弱发光）
          roughness: 0.2,               // 粗糙度（稍粗糙）
          metalness: 0.7,               // 金属度（中等金属度）
          envMapIntensity: 1.0          // 环境映射强度（标准反射）
        },
        animation: {                    // 动画配置
          emissiveVariation: {          // 发光变化动画
            base: 0.2,                  // 基础发光强度
            function: "sin",            // 正弦变化
            speed: 2.0,                 // 变化速度（较快闪烁）
            amplitude: 0.15,            // 变化幅度
            indexOffset: 0.3            // 索引偏移（产生相位差）
          }
        },
        position: {                     // 位置配置
          type: "aroundParent",         // 位置类型（围绕父恒星）
          radiusMin: 3,                 // 最小分布半径
          radiusMax: 6,                 // 最大分布半径
          zVariation: 4                 // Z轴变化范围（较大）
        }
      }
    }
  },

  // ========================================
  // 连接线配置 - 引力连接系统
  // ========================================
  connections: {
    types: {
      "root-main": {                      // 中央恒星到螺旋臂的连接
        length: 5,                      // 连接长度（较长）
        strength: 0.3,                  // 连接强度（较弱）
        color: "0xffffff",              // 连接颜色（白色）
        opacity: 0.9,                   // 连接透明度（较高）
        animation: {                    // 动画配置
          opacityVariation: {           // 透明度变化动画
            base: 0.7,                  // 基础透明度
            function: "sin",            // 正弦变化
            speed: 2,                   // 变化速度
            amplitude: 0.3              // 变化幅度
          }
        }
      },
      "main-sub": {                       // 螺旋臂到外围星体的连接
        length: 3,                      // 连接长度（中等）
        strength: 0.4,                  // 连接强度（中等）
        color: "0xffaa00",              // 连接颜色（橙色）
        opacity: 0.8,                   // 连接透明度（中等）
        animation: {                    // 动画配置
          opacityVariation: {           // 透明度变化动画
            base: 0.6,                  // 基础透明度
            function: "cos",            // 余弦变化
            speed: 1.5,                 // 变化速度
            amplitude: 0.2              // 变化幅度
          }
        }
      },
      "sub-sub": {                        // 外围星体间的连接
        length: 2,                      // 连接长度（较短）
        strength: 0.5,                  // 连接强度（较强）
        color: "0x00aaff",              // 连接颜色（蓝色）
        opacity: 0.7,                   // 连接透明度（中等）
        animation: {                    // 动画配置
          opacityVariation: {           // 透明度变化动画
            base: 0.5,                  // 基础透明度
            function: "sin",            // 正弦变化
            speed: 3,                   // 变化速度（较快）
            amplitude: 0.2              // 变化幅度
          }
        }
      }
    }
  },

  // ========================================
  // 动画配置 - 星体生成动画
  // ========================================
  animation: {
    newNodeAnimation: {                 // 新星体动画配置
      duration: 80,                     // 动画持续时间（帧）
      speed: 0.015,                     // 动画速度（较慢）
      initialScale: 0.05,               // 初始缩放（从小开始）
      easing: "easeOutCubic"            // 缓动函数类型
    },
    spawnPosition: {                    // 生成位置配置
      type: "random",                   // 生成类型（随机）
      range: 30                         // 生成范围（较大）
    }
  },

  // ========================================
  // CSS3D标签配置 - 星体标签系统
  // ========================================
  css3d: {
    enabled: true,                      // 是否启用CSS3D标签
    scale: {
      fixed: 0.03,                     // 固定缩放比例（较小，适合银河系主题）
      levelBased: {                    // 按层级设置的缩放比例
        enabled: true,                 // 是否启用按层级缩放
        levels: {
          "1": 1.2,                    // 中央恒星缩放比例（最大）
          "2": 0.8,                    // 螺旋臂恒星缩放比例（中等）
          "3": 0.4                     // 外围星体缩放比例（较小）
        }
      }
    },
    animation: {                        // CSS3D动画配置
      fadeIn: {                         // 淡入动画（新增星体）
        duration: "1.2s",               // 动画持续时间（较长）
        easing: "ease-out",             // 缓动函数
        keyframes: {                    // 关键帧配置
          "0%": { opacity: 0, transform: "scale(0.01)" },    // 起始状态
          "70%": { opacity: 0.9, transform: "scale(0.08)" }, // 中间状态
          "100%": { opacity: 1, transform: "scale(0.06)" }   // 结束状态
        }
      },
      fadeOut: {                        // 淡出动画（删除星体）
        duration: "0.8s",               // 动画持续时间
        easing: "ease-in",              // 缓动函数
        keyframes: {                    // 关键帧配置
          "0%": { opacity: 1, transform: "scale(0.06)" },    // 起始状态
          "100%": { opacity: 0, transform: "scale(0.01)" }   // 结束状态
        }
      }
    },
    style: {                            // CSS3D样式配置
      color: "white",                   // 文字颜色（白色，适合深色背景）
      fontFamily: "Arial, sans-serif",  // 字体
      fontWeight: "bold",               // 字体粗细
      textAlign: "center",              // 文字对齐
      whiteSpace: "nowrap",             // 文字换行
      userSelect: "none",               // 用户选择
      textShadow: "0 0 10px rgba(255, 255, 255, 0.8)", // 发光文字阴影
      background: "rgba(0, 0, 17, 0.8)", // 深色背景
      borderRadius: "6px",              // 圆角半径
      padding: "3px 8px",               // 内边距
      border: "1px solid rgba(255, 255, 255, 0.3)", // 边框
      backdropFilter: "blur(3px)"       // 背景模糊
    }
  },

  // ========================================
  // 相机控制配置 - 银河系观察模式
  // ========================================
  cameraControls: {
    enableDamping: true,                // 启用阻尼
    dampingFactor: 0.03,                // 阻尼系数（较小，更平滑）
    autoRotate: true,                   // 自动旋转
    autoRotateSpeed: 0.5,               // 自动旋转速度（较慢）
    enableZoom: true,                   // 启用缩放
    enablePan: true,                    // 启用平移
    minDistance: 8,                     // 最小距离（较近观察）
    maxDistance: 150,                   // 最大距离（远景观察）
    minPolarAngle: 0,                   // 最小极角
    maxPolarAngle: Math.PI              // 最大极角（π）
  },

  // ========================================
  // 控制配置 - 银河系参数控制
  // ========================================
  controls: {
    nodeCount: {                        // 星体数量控制
      min: 10,                          // 最小星体数
      max: 80,                          // 最大星体数
      default: 30                       // 默认星体数
    },
    repulsionStrength: {                // 斥力强度控制
      min: 200,                         // 最小斥力
      max: 15000,                       // 最大斥力
      default: 800                      // 默认斥力
    },
    attractionStrength: {               // 引力强度控制
      min: 50,                          // 最小引力
      max: 8000,                        // 最大引力
      default: 300                      // 默认引力
    },
    lightIntensity: {                   // 光照强度控制
      min: 0.8,                         // 最小光照
      max: 4.0,                         // 最大光照
      step: 0.1,                        // 调整步长
      default: 2.0                      // 默认光照
    },
    autoAddNodes: {                     // 自动添加星体
      interval: 2000,                   // 添加间隔（毫秒）
      maxNodes: 80                      // 最大星体数
    },
    dynamicNodes: {                     // 动态星体功能
      interval: 2000,                   // 操作间隔（毫秒）
      minNodes: 4,                      // 每个螺旋臂最少星体数
      maxNodes: 12,                     // 每个螺旋臂最多星体数
      initialNodes: 6,                  // 初始星体数量
      enabled: true                     // 功能启用状态
    },
    adaptiveSize: {                     // 自适应大小功能
      enabled: true,                    // 功能启用状态
      radiusRange: {                    // 半径范围
        min: 0.7,                       // 最小倍数
        max: 1.8                        // 最大倍数
      },
      textLengthRange: {                // 文字长度范围
        min: 2,                         // 最小长度
        max: 20                         // 最大长度
      }
    }
  },

  // ========================================
  // 渲染器配置 - 银河系渲染设置
  // ========================================
  renderer: {
    antialias: true,                    // 抗锯齿
    shadowMap: {                        // 阴影配置
      enabled: true,                    // 启用阴影
      type: "PCFSoftShadowMap"          // 阴影类型
    }
  },

  // ========================================
  // 标签数据配置 - 银河系数据
  // ========================================
  labels: {
    trainee: {
      name: "银河系指挥官"              // 参训人员姓名（银河系主题）
    },
    secondLevel: [                      // 二级节点配置
      {
        id: "behavior",                 // 行为节点
        name: "星际行为",               // 显示名称
        items: [                        // 具体行为项目
          "激活护盾系统", "进入2号星舰", "启动推进器", "下达导航指令", "关闭反物质阀",
          "检查生命支持", "佩戴太空服", "连接能量管", "检查舱室气压", "关闭主电源",
          "组织舰队集合", "进行舱室增压", "检查舱门密封", "记录航行日志", "进行人员转移",
          "检查辐射水平", "进行空间警戒", "进行燃料补充", "检查通讯阵列", "进行应急照明"
        ]
      },
      {
        id: "factor",                   // 评分因子节点
        name: "星际因子",               // 显示名称
        items: [                        // 具体评分因子
          "导航精度", "反应时间", "系统效率", "任务完成度", "轨道稳定性", "舰队协同", "操作规范", "空间安全",
          "设备可靠性", "战术灵活性", "危险预判", "应急响应", "资源配置", "团队合作", "通讯效率", "指挥决策"
        ]
      },
      {
        id: "task",                     // 任务节点
        name: "星际任务",               // 显示名称
        items: [                        // 具体任务项目
          "引擎故障修复", "人员搜救", "太空舱逃生", "反应堆冷却", "伤员救治", "舱室排气",
          "系统断电", "太空警戒", "物资转运", "应急照明", "星际通讯", "舰队指挥",
          "威胁评估", "任务记录", "行动复盘", "战术总结"
        ]
      }
    ]
  }
} 