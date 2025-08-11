# 烟雾效果使用指南

## 功能概述
基于改进版 SmokeMarker 类实现的完整烟雾效果系统，支持多种预设和自定义配置。

## 快速开始

### 1. 初始化烟雾管理器
```javascript
import { initSmokeManager } from '@/composables/default.js'

// 在引擎初始化后调用
initSmokeManager()
```

### 2. 在渲染循环中更新
```javascript
import { updateSmokeInRenderLoop } from '@/composables/default.js'

// 在主渲染循环中添加
function animate() {
    requestAnimationFrame(animate)
    
    // 更新烟雾效果
    updateSmokeInRenderLoop()
    
    // 其他渲染逻辑...
    renderer.render()
}
```

## 创建烟雾效果

### 基础创建
```javascript
import { createSmoke } from '@/composables/default.js'

// 创建基础烟雾
const smoke = createSmoke({
    position: { x: 0, y: 5, z: 0 },
    maxParticles: 100,
    emissionRate: 10,
    particleSize: 2.0,
    lifetime: 5.0,
    colorStart: [0.5, 0.5, 0.5],
    colorEnd: [0.2, 0.2, 0.2],
    spread: { x: 5, y: 2, z: 5 }
})
```

### 使用预设创建
```javascript
import { createSmokeWithPreset } from '@/composables/default.js'

// 使用预设创建
const factorySmoke = createSmokeWithPreset('factory', { x: 0, y: 10, z: 0 })
const campfireSmoke = createSmokeWithPreset('campfire', { x: 5, y: 1, z: 0 })
```

### 使用示例方法
```javascript
import { smokeExamples } from '@/composables/default.js'

// 快速创建示例烟雾
const factory = smokeExamples.createFactorySmoke()
const campfire = smokeExamples.createCampfireSmoke()
const explosion = smokeExamples.createExplosionSmoke({ x: 0, y: 5, z: 0 })
```

## 预设类型

| 预设名称 | 描述 | 粒子数 | 发射率 | 生命周期 |
|---------|------|--------|--------|----------|
| factory | 工厂烟囱烟雾 | 200 | 15 | 8.0s |
| campfire | 篝火烟雾 | 150 | 12 | 4.0s |
| steam | 蒸汽烟雾 | 80 | 8 | 3.0s |
| explosion | 爆炸烟雾 | 300 | 50 | 10.0s |

## 烟雾控制器方法

创建烟雾后会返回一个控制器对象，包含以下方法：

```javascript
const smoke = createSmoke({...})

// 位置控制
smoke.setPosition({ x: 10, y: 5, z: 0 })

// 发射率控制
smoke.setEmissionRate(20)

// 强度控制（0-2倍）
smoke.setIntensity(1.5)

// 颜色控制
smoke.setColor([0.8, 0.6, 0.4], [0.3, 0.3, 0.3])

// 获取统计信息
const stats = smoke.getStats()
console.log('活跃粒子:', stats.activeParticles)

// 移除烟雾
smoke.remove()
```

## 控制面板集成

### 添加烟雾到控制面板
```javascript
import { smokeControlData } from '@/composables/default.js'

const smoke = createSmoke({...})
smokeControlData.addSmoke(smoke.id, smoke)
```

### 全局控制
```javascript
// 设置全局强度（影响所有烟雾）
smokeControlData.setGlobalIntensity(1.2)

// 设置全局风向
smokeControlData.setWindForce({ x: 0.3, y: 0.6, z: 0.1 })

// 查看活跃烟雾
console.log('活跃烟雾:', Object.keys(smokeControlData.activeSmokes))
```

## 完整示例

```javascript
import { 
    initSmokeManager, 
    createSmoke, 
    createSmokeWithPreset,
    updateSmokeInRenderLoop 
} from '@/composables/default.js'

// 初始化
initSmokeManager()

// 创建烟雾
const factorySmoke = createSmokeWithPreset('factory', { x: 0, y: 10, z: 0 })
const customSmoke = createSmoke({
    position: { x: 10, y: 5, z: 5 },
    maxParticles: 150,
    emissionRate: 12,
    colorStart: [0.7, 0.5, 0.3],
    colorEnd: [0.2, 0.2, 0.2]
})

// 控制烟雾
setTimeout(() => {
    factorySmoke.setIntensity(1.5)
    customSmoke.setEmissionRate(20)
}, 2000)

// 渲染循环
function animate() {
    requestAnimationFrame(animate)
    updateSmokeInRenderLoop()
    renderer.render(scene, camera)
}
animate()
```

## 错误处理

所有创建方法都包含错误处理：

```javascript
createSmoke({
    position: { x: 0, y: 5, z: 0 },
    onCreated: (effect, id) => {
        console.log('烟雾创建成功:', id)
    },
    onError: (error) => {
        console.error('创建失败:', error.message)
    }
})
```

## 性能优化建议

1. **粒子数量**：根据场景复杂度调整 maxParticles
2. **发射率**：避免过高的 emissionRate 导致性能问题
3. **生命周期**：适当缩短 lifetime 减少内存占用
4. **批量更新**：使用 updateSmokeInRenderLoop 统一更新
5. **及时清理**：不再使用的烟雾及时调用 remove() 清理

## 调试技巧

```javascript
// 查看烟雾统计
const stats = smoke.getStats()
console.table(stats)

// 检查活跃烟雾
console.log('活跃烟雾数量:', Object.keys(smokeControlData.activeSmokes).length)

// 性能监控
console.log('粒子池利用率:', stats.utilization)
```