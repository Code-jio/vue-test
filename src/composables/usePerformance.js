import { ref } from 'vue'

// 性能监控功能管理
export function usePerformance() {
  // 响应式状态
  const fpsCounter = ref(0)
  const cameraDistance = ref(0)
  
  // 内部状态
  let animationId = null
  let lastTime = performance.now()
  let frameCount = 0

  // 启动FPS监控
  const startFpsMonitoring = (engineReady) => {
    const updateFps = () => {
      frameCount++
      const currentTime = performance.now()

      if (currentTime - lastTime >= 1000) {
        fpsCounter.value = Math.round(
          (frameCount * 1000) / (currentTime - lastTime)
        )
        frameCount = 0
        lastTime = currentTime
      }

      if (engineReady.value) {
        animationId = requestAnimationFrame(updateFps)
      }
    }

    updateFps()
  }

  // 停止FPS监控
  const stopFpsMonitoring = () => {
    if (animationId) {
      cancelAnimationFrame(animationId)
      animationId = null
    }
  }

  // 设置相机位置监控
  const setupCameraMonitoring = (orbitControlPlugin, baseScenePlugin, addDebugLog) => {
    if (!orbitControlPlugin || !baseScenePlugin) return

    // 初始距离
    updateCameraDistance(orbitControlPlugin)

    // 监听相机移动事件
    EngineKernel.eventBus.on("camera-moved", () => {
      updateCameraDistance(orbitControlPlugin)

      const distance = orbitControlPlugin.getDistanceFromCenter()
      if (distance > 18000) {
        console.log(`警告：相机接近边界，距离: ${distance.toFixed(2)}`)
        addDebugLog("warning", `⚠️ 相机接近边界: ${distance.toFixed(2)}m`)
      }
    })
  }

  // 更新相机距离显示
  const updateCameraDistance = (orbitControlPlugin) => {
    if (orbitControlPlugin) {
      cameraDistance.value = orbitControlPlugin
        .getDistanceFromCenter()
        .toFixed(2)
    }
  }

  // 获取性能统计信息
  const getPerformanceStats = () => {
    return {
      fps: fpsCounter.value,
      cameraDistance: parseFloat(cameraDistance.value),
      timestamp: new Date().toISOString(),
      memory: performance.memory ? {
        used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
        total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
        limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
      } : null
    }
  }

  // 性能分析
  const analyzePerformance = (addDebugLog) => {
    const stats = getPerformanceStats()
    
    addDebugLog("info", `📊 性能统计: FPS=${stats.fps}, 相机距离=${stats.cameraDistance}m`)
    
    if (stats.memory) {
      addDebugLog("info", `💾 内存使用: ${stats.memory.used}MB / ${stats.memory.total}MB (限制: ${stats.memory.limit}MB)`)
      
      // 内存使用率警告
      const memoryUsage = stats.memory.used / stats.memory.limit
      if (memoryUsage > 0.8) {
        addDebugLog("warning", `⚠️ 内存使用率过高: ${(memoryUsage * 100).toFixed(1)}%`)
      }
    }
    
    // FPS性能评估
    if (stats.fps < 30) {
      addDebugLog("warning", `⚠️ FPS过低: ${stats.fps} (建议>30)`)
    } else if (stats.fps >= 60) {
      addDebugLog("success", `✅ FPS良好: ${stats.fps}`)
    }
    
    return stats
  }

  // 性能优化建议
  const getOptimizationSuggestions = () => {
    const suggestions = []
    const stats = getPerformanceStats()
    
    if (stats.fps < 30) {
      suggestions.push("🔧 降低渲染质量或减少场景复杂度")
      suggestions.push("🔧 启用性能模式或关闭阴影")
    }
    
    if (stats.memory && stats.memory.used > 500) {
      suggestions.push("🔧 清理不必要的资源和缓存")
      suggestions.push("🔧 减少纹理分辨率或模型复杂度")
    }
    
    if (parseFloat(stats.cameraDistance) > 10000) {
      suggestions.push("🔧 考虑使用LOD技术或裁剪远距离对象")
    }
    
    return suggestions
  }

  // 重置性能计数器
  const resetPerformanceCounters = () => {
    fpsCounter.value = 0
    frameCount = 0
    lastTime = performance.now()
  }

  return {
    // 状态
    fpsCounter,
    cameraDistance,
    
    // 方法
    startFpsMonitoring,
    stopFpsMonitoring,
    setupCameraMonitoring,
    updateCameraDistance,
    getPerformanceStats,
    analyzePerformance,
    getOptimizationSuggestions,
    resetPerformanceCounters
  }
} 