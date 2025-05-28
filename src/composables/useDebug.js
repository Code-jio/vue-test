import { ref } from 'vue'

// 调试和日志功能管理
export function useDebug() {
  // 响应式状态
  const debugLogs = ref([])

  // 调试日志管理
  const addDebugLog = (level, message) => {
    const log = {
      id: Date.now() + Math.random(),
      time: new Date().toLocaleTimeString(),
      level,
      message,
    }
    debugLogs.value.unshift(log)

    // 保持最新的20条日志
    if (debugLogs.value.length > 20) {
      debugLogs.value = debugLogs.value.slice(0, 20)
    }
  }

  // 清空日志
  const clearDebugLogs = () => {
    debugLogs.value = []
    addDebugLog("info", "🧹 调试日志已清空")
  }

  // 导出日志
  const exportDebugLogs = () => {
    const logData = debugLogs.value.map(log => 
      `[${log.time}] ${log.level.toUpperCase()}: ${log.message}`
    ).join('\n')
    
    const blob = new Blob([logData], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `debug-logs-${new Date().toISOString().split('T')[0]}.txt`
    a.click()
    URL.revokeObjectURL(url)
    
    addDebugLog("success", "📄 调试日志已导出")
  }

  // 过滤日志
  const filterLogs = (level) => {
    if (!level) return debugLogs.value
    return debugLogs.value.filter(log => log.level === level)
  }

  // 统计日志数量
  const getLogStats = () => {
    const stats = {
      total: debugLogs.value.length,
      info: 0,
      success: 0,
      warning: 0,
      error: 0
    }
    
    debugLogs.value.forEach(log => {
      stats[log.level] = (stats[log.level] || 0) + 1
    })
    
    return stats
  }

  // 预设的调试快捷方法
  const debugInfo = (message) => addDebugLog("info", message)
  const debugSuccess = (message) => addDebugLog("success", message)
  const debugWarning = (message) => addDebugLog("warning", message)
  const debugError = (message) => addDebugLog("error", message)

  return {
    // 状态
    debugLogs,
    
    // 方法
    addDebugLog,
    clearDebugLogs,
    exportDebugLogs,
    filterLogs,
    getLogStats,
    
    // 快捷方法
    debugInfo,
    debugSuccess,
    debugWarning,
    debugError
  }
} 