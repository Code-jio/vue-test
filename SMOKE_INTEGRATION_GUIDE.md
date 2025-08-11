# 🌫️ 烟雾特效集成指南

## 概述

烟雾特效已成功集成到DefaultViews.vue组件中，现在可以直接在页面中使用各种烟雾效果。

## 使用方法

### 1. 初始化烟雾系统

系统启动时会自动初始化烟雾管理器：

```javascript
// 在onMounted钩子中已自动初始化
initSmokeManager();
```

### 2. 创建烟雾效果

#### 预设烟雾效果
```javascript
// 创建所有预设烟雾效果
createSmokeEffects();

// 单独创建预设烟雾
const factorySmoke = smokeExamples.createFactorySmoke(); // 工厂烟囱
const campfireSmoke = smokeExamples.createCampfireSmoke(); // 篝火烟雾
const steamSmoke = smokeExamples.createSteamSmoke(); // 蒸汽烟雾
const explosionSmoke = smokeExamples.createExplosionSmoke({x: 0, y: 5, z: 0}); // 爆炸烟雾
```

#### 自定义烟雾效果
```javascript
// 使用基础方法创建自定义烟雾
const customSmoke = createSmoke({
    position: { x: 10, y: 5, z: 20 },
    maxParticles: 150,
    emissionRate: 12,
    particleSize: 2.5,
    lifetime: 6.0,
    colorStart: [0.7, 0.6, 0.5],
    colorEnd: [0.3, 0.3, 0.3],
    spread: { x: 4, y: 2, z: 4 }
});
```

#### 动态位置烟雾
```javascript
// 在指定位置创建烟雾
createSmokeAtPosition({ x: 5, y: 2, z: 0 }, 'explosion');
createSmokeAtPosition({ x: -5, y: 1, z: 10 }, 'steam');
```

### 3. 烟雾控制面板

页面左上方提供了完整的烟雾控制面板：

- **预设烟雾**：一键创建工厂烟囱、篝火、蒸汽等预设烟雾
- **动态烟雾**：创建爆炸烟雾和随机蒸汽烟雾
- **烟雾列表**：显示所有活跃烟雾，支持开关和移除操作
- **状态提示**：操作成功/失败的状态反馈

### 4. 烟雾管理

#### 切换烟雾状态
```javascript
// 开启/关闭特定烟雾
toggleSmoke('factory-smoke-1');
```

#### 移除烟雾
```javascript
// 移除单个烟雾
removeSmoke('factory-smoke-1');

// 清除所有烟雾
clearAllSmokes();
```

#### 更新烟雾效果
```javascript
// 在渲染循环中自动更新
updateSmokeControls(deltaTime);
```

## 预设类型

| 预设类型 | 描述 | 适用场景 |
|---------|------|----------|
| factory | 工厂烟囱烟雾 | 工业场景、烟囱 |
| campfire | 篝火烟雾 | 露营、户外场景 |
| steam | 蒸汽烟雾 | 温泉、锅炉 |
| explosion | 爆炸烟雾 | 特效、爆破场景 |
| custom | 自定义烟雾 | 任意场景 |

## 性能优化

1. **粒子数量控制**：根据场景复杂度调整maxParticles
2. **自动清理**：爆炸烟雾3秒后自动移除
3. **批量操作**：使用clearAllSmokes()一次性清理
4. **状态管理**：使用activeSmokes数组跟踪活跃烟雾

## 调试技巧

1. **控制台日志**：所有操作都有详细的控制台输出
2. **状态监控**：activeSmokes数组实时显示活跃烟雾
3. **错误处理**：完善的错误捕获和状态提示
4. **性能监控**：可查看当前活跃烟雾数量

## 示例代码

```javascript
// 完整示例：创建和管理烟雾效果
const initSmokeDemo = () => {
    // 初始化烟雾管理器
    initSmokeManager();
    
    // 创建预设烟雾
    createSmokeEffects();
    
    // 创建动态爆炸烟雾
    setInterval(() => {
        createExplosionAtCenter();
    }, 5000);
    
    // 创建随机蒸汽烟雾
    setInterval(() => {
        createSteamAtRandom();
    }, 3000);
};
```

现在你可以直接在DefaultViews页面中使用这些烟雾特效了！