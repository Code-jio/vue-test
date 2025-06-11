// 键盘控制和交互功能管理
export function useControls() {

  // 切换全屏
  const toggleFullscreen = (addDebugLog) => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        addDebugLog("success", "📺 进入全屏模式")
      }).catch(err => {
        addDebugLog("error", `❌ 全屏失败: ${err.message}`)
      })
    } else {
      document.exitFullscreen().then(() => {
        addDebugLog("success", "📺 退出全屏模式")
      }).catch(err => {
        addDebugLog("error", `❌ 退出全屏失败: ${err.message}`)
      })
    }
  }

  // 鼠标控制提示
  const getControlsHelp = () => {
    return [
      "• 左键拖拽：旋转视角",
      "• 右键拖拽：平移视角", 
      "• 滚轮：缩放视角",
      "• R键：重置相机位置",
      "• H键：显示帮助信息",
      "• F11：切换全屏",
      "• ESC：退出操作"
    ]
  }

  // 设置触摸控制（移动端）
  const setupTouchControls = (addDebugLog) => {
    let touchStartX = 0
    let touchStartY = 0
    let touchStartTime = 0

    const handleTouchStart = (event) => {
      if (event.touches.length === 1) {
        touchStartX = event.touches[0].clientX
        touchStartY = event.touches[0].clientY
        touchStartTime = Date.now()
      }
    }

    const handleTouchEnd = (event) => {
      if (event.changedTouches.length === 1) {
        const touchEndX = event.changedTouches[0].clientX
        const touchEndY = event.changedTouches[0].clientY
        const touchEndTime = Date.now()
        
        const deltaX = Math.abs(touchEndX - touchStartX)
        const deltaY = Math.abs(touchEndY - touchStartY)
        const deltaTime = touchEndTime - touchStartTime
        
        // 检测快速滑动手势
        if (deltaTime < 300 && (deltaX > 50 || deltaY > 50)) {
          if (deltaX > deltaY) {
            // 水平滑动
            if (touchEndX > touchStartX) {
              addDebugLog("info", "👆 向右滑动手势")
            } else {
              addDebugLog("info", "👆 向左滑动手势")
            }
          } else {
            // 垂直滑动
            if (touchEndY > touchStartY) {
              addDebugLog("info", "👆 向下滑动手势")
            } else {
              addDebugLog("info", "👆 向上滑动手势")
            }
          }
        }
      }
    }

    // 添加触摸事件监听
    document.addEventListener("touchstart", handleTouchStart, { passive: true })
    document.addEventListener("touchend", handleTouchEnd, { passive: true })

    // 返回清理函数
    return () => {
      document.removeEventListener("touchstart", handleTouchStart)
      document.removeEventListener("touchend", handleTouchEnd)
    }
  }

  // 检测设备类型
  const getDeviceType = () => {
    const userAgent = navigator.userAgent
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)
    const isTablet = /iPad|Android(?=.*\b(?:8|9|10|11)\b)/i.test(userAgent)
    
    return {
      isMobile,
      isTablet,
      isDesktop: !isMobile && !isTablet,
      hasTouch: 'ontouchstart' in window,
      userAgent
    }
  }

  // 自适应控制设置
  const setupAdaptiveControls = (engineReady, resetCamera, addDebugLog) => {
    const device = getDeviceType()
    let touchCleanup = null

    addDebugLog("info", `🖥️ 设备类型: ${device.isMobile ? '移动端' : device.isTablet ? '平板' : '桌面端'}`)

    // 触摸设备额外设置触摸控制
    if (device.hasTouch) {
      touchCleanup = setupTouchControls(addDebugLog)
      addDebugLog("success", "📱 触摸控制已启用")
    }

    // 返回综合清理函数
    return () => {
      if (touchCleanup) touchCleanup()
    }
  }

  // 控制状态检查
  const checkControlsStatus = (orbitControlPlugin, addDebugLog) => {
    if (!orbitControlPlugin) {
      addDebugLog("warning", "⚠️ 轨道控制器未初始化")
      return false
    }

    try {
      // 检查控制器基本状态
      const hasControls = orbitControlPlugin.getControl() ? true : false
      const distance = orbitControlPlugin.getDistanceFromCenter()
      
      const device = getDeviceType()
      addDebugLog("success", `✅ 控制系统就绪 (${device.isMobile ? '移动端' : '桌面端'})`)
      addDebugLog("info", `📍 相机距离: ${distance.toFixed(2)}m`)
      addDebugLog("info", `🎮 轨道控制器: ${hasControls ? '已激活' : '未激活'}`)
      
      return hasControls
    } catch (error) {
      addDebugLog("error", `❌ 控制器状态检查失败: ${error.message}`)
      return false
    }
  }

  // 强制重新初始化控制器
  const reinitializeControls = (orbitControlPlugin, addDebugLog) => {
    if (!orbitControlPlugin) {
      addDebugLog("error", "❌ 无法重新初始化：轨道控制器插件不存在")
      return false
    }

    try {
      // 重新初始化事件监听器
      orbitControlPlugin.initializeEventListeners()
      addDebugLog("success", "🔄 控制器事件监听器重新初始化完成")
      return true
    } catch (error) {
      addDebugLog("error", `❌ 重新初始化控制器失败: ${error.message}`)
      return false
    }
  }

  // 全面的控制器诊断
  const diagnoseControls = (engineInstance, baseScenePlugin, orbitControlPlugin, addDebugLog) => {
    addDebugLog("info", "🔍 开始全面控制器诊断...")

    // 1. 检查引擎实例
    if (!engineInstance) {
      addDebugLog("error", "❌ 引擎实例不存在")
      return false
    }
    addDebugLog("success", "✅ 引擎实例正常")

    // 2. 检查场景插件
    if (!baseScenePlugin) {
      addDebugLog("error", "❌ 基础场景插件不存在")
      return false
    }
    addDebugLog("success", "✅ 基础场景插件正常")

    // 3. 检查轨道控制器插件
    if (!orbitControlPlugin) {
      addDebugLog("error", "❌ 轨道控制器插件不存在")
      return false
    }
    addDebugLog("success", "✅ 轨道控制器插件存在")

    // 4. 检查Three.js控制器实例
    try {
      const control = orbitControlPlugin.getControl()
      if (!control) {
        addDebugLog("error", "❌ Three.js OrbitControls实例不存在")
        return false
      }
      addDebugLog("success", "✅ Three.js OrbitControls实例正常")

      // 5. 检查DOM元素
      if (!control.domElement) {
        addDebugLog("error", "❌ 控制器DOM元素不存在")
        return false
      }
      addDebugLog("success", "✅ 控制器DOM元素正常")

      // 6. 检查相机
      if (!control.object) {
        addDebugLog("error", "❌ 控制器相机对象不存在")
        return false
      }
      addDebugLog("success", "✅ 控制器相机对象正常")

      // 7. 检查事件监听器状态
      const distance = orbitControlPlugin.getDistanceFromCenter()
      addDebugLog("info", `📍 当前相机距离: ${distance.toFixed(2)}m`)

      // 8. 检查控制器设置
      addDebugLog("info", `⚙️ 启用缩放: ${control.enableZoom}`)
      addDebugLog("info", `⚙️ 启用旋转: ${control.enableRotate}`)
      addDebugLog("info", `⚙️ 启用平移: ${control.enablePan}`)
      addDebugLog("info", `⚙️ 阻尼: ${control.enableDamping}`)

      addDebugLog("success", "🎉 控制器诊断完成，一切正常")
      return true

    } catch (error) {
      addDebugLog("error", `❌ 控制器诊断失败: ${error.message}`)
      return false
    }
  }

  return {
    // 方法
    setupTouchControls,
    setupAdaptiveControls,
    toggleFullscreen,
    getControlsHelp,
    getDeviceType,
    checkControlsStatus,
    reinitializeControls,
    diagnoseControls
  }
} 