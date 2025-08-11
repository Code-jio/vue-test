# 烟雾特效调试指南

## 🚨 问题总结

经过分析，你的烟雾特效不生效的主要原因如下：

### 1. 架构差异问题
- **示例文件(Smoke.vue)**：使用独立的Three.js场景，完全控制渲染循环
- **你的项目**：基于EngineKernel框架，需要与现有系统集成

### 2. 初始化时机问题
- **原代码**：立即执行`createSmoke()`，但此时场景可能未完全初始化
- **解决方案**：使用`setTimeout`延迟初始化，确保环境准备就绪

### 3. 全局变量依赖
- **原代码**：依赖`window.smokeManager`等全局变量，但可能未正确挂载
- **解决方案**：添加环境检查，提供降级处理

### 4. 更新循环问题
- **原代码**：手动更新粒子系统，但缺少与EngineKernel的集成
- **解决方案**：使用EngineKernel的事件系统统一更新

## ✅ 修复方案

### 已实施的修复

1. **创建调试版本** (`debug-smoke.js`)
   - 添加环境检查
   - 延迟初始化
   - 多重烟雾源
   - 调试标记

2. **增强错误处理**
   - 模块存在性检查
   - 详细的错误日志
   - 降级处理

3. **可视化调试**
   - 创建`SmokeDebugPanel.vue`
   - 实时参数调整
   - FPS监控

4. **控制台调试命令**
   ```javascript
   // 运行完整测试
   testSmoke()
   
   // 查看控制器
   window.smokeControls
   
   // 查看烟雾效果
   window.smokeEffects
   
   // 手动更新
   window.updateSmoke()
   ```

## 🎯 使用步骤

### 1. 启动项目
```bash
npm run dev
```

### 2. 打开浏览器控制台
- 按F12打开开发者工具
- 切换到Console标签

### 3. 执行测试
```javascript
// 在控制台执行
testSmoke()
```

### 4. 使用调试面板
- 右上角会出现"🌫️ 调试"按钮
- 点击展开控制面板
- 实时调整参数观察效果

### 5. 验证烟雾效果
- 查看是否有红色/绿色/蓝色调试球体出现
- 调整发射率参数观察变化
- 检查控制台错误信息

## 🔍 调试技巧

### 常见问题排查

1. **烟雾不可见**
   - 检查调试球体是否存在
   - 调整`particleSize`参数
   - 检查相机位置

2. **性能问题**
   - 降低`maxParticles`值
   - 减少`emissionRate`
   - 关闭调试标记

3. **位置偏移**
   - 调整烟雾源位置
   - 检查场景坐标系

### 参数建议

```javascript
// 初始推荐参数
{
    maxParticles: 600,      // 主烟雾
    particleSize: 4.0,
    emissionRate: 30,
    lifetime: 8.0,
    position: [0, 10, 0],  // 确保在视野内
    turbulence: 0.5
}
```

## 🛠️ 进阶调试

### 自定义烟雾位置
```javascript
// 在控制台创建新烟雾源
window.createSmokeAtPosition(50, 20, 30)
```

### 动态效果测试
```javascript
// 创建测试动画
let t = 0;
setInterval(() => {
    t += 0.1;
    window.smokeControls.windX = Math.sin(t) * 2;
    window.smokeControls.windY = 1.5 + Math.cos(t) * 0.5;
}, 100);
```

## 📊 性能监控

- **FPS显示**：调试面板右上角实时显示
- **粒子数量**：每个烟雾源的粒子数
- **内存使用**：观察控制台内存占用

## 🎮 交互功能

1. **点击创建烟雾**：可在任意位置创建临时烟雾
2. **参数实时调整**：滑动条立即生效
3. **一键重置**：恢复默认参数
4. **标记切换**：显示/隐藏调试球体

## 🔧 故障排除

如果仍然无法看到烟雾：

1. **检查纹理**
   - 确认`/public/textures/smoke1.png`存在
   - 检查网络请求是否404

2. **验证场景**
   - 确认`window.currentScene`存在
   - 检查相机位置和朝向

3. **查看日志**
   - 控制台是否有错误信息
   - 检查模块加载状态

4. **简化测试**
   ```javascript
   // 最简测试
   if (window.smokeEffectManager) {
       const smoke = window.smokeEffectManager.createSmokeEffect({
           maxParticles: 100,
           position: [0, 5, 0],
           particleSize: 10
       });
       console.log("测试烟雾:", smoke);
   }
   ```

## 📞 技术支持

如果问题仍未解决，请提供：
1. 控制台错误信息截图
2. 网络请求状态
3. 使用的浏览器版本
4. 项目启动日志