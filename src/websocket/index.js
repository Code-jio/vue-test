import stompManager from '@/utils/stompManager'

// WebSocket配置常量
const WS_CONFIG = {
  HEARTBEAT_INTERVAL: 30000,
  CONNECT_TIMEOUT: 10000,
  DEBUG_ENABLED: true
}

// 错误处理函数
const handleError = (error) => {
  console.error('WebSocket连接错误:', error)
}

// 初始化WebSocket连接
function initWebSocket() {
  setupEventListeners()
  
  return stompManager.connect(import.meta.env.VITE_APP_WS_URL, {
    debug: WS_CONFIG.DEBUG_ENABLED ? (str) => console.debug('[STOMP]', str) : false,
    heartbeatIncoming: WS_CONFIG.HEARTBEAT_INTERVAL,
    heartbeatOutgoing: WS_CONFIG.HEARTBEAT_INTERVAL,
    connectTimeout: WS_CONFIG.CONNECT_TIMEOUT
  }).catch(handleError)
}

// 设置事件监听器
function setupEventListeners() {
  // 连接成功
  stompManager.on('connect', (frame) => {
    console.log('WebSocket已连接到服务器', frame)
    subscribeToTopics()
  })

  // 连接状态变化
  stompManager.on('stateChange', (state) => {
    console.log('WebSocket状态变化:', state)
  })

  // 错误处理
  stompManager.on('error', handleError)

  // 重连事件
  stompManager.on('reconnectAttempt', (attempt) => {
    console.log(`WebSocket重连尝试: ${attempt}/${stompManager.maxReconnectAttempts}`)
  })

  // 重连失败
  stompManager.on('reconnectFailed', () => {
    console.error('WebSocket重连失败，请检查网络连接')
  })
}

// 订阅业务相关的主题
function subscribeToTopics() {
  // 订阅实时位置数据
  const positionSubscription = stompManager.subscribe('/uwb/position/real/time', (message) => {
    try {
      const data = JSON.parse(message.body)
      console.log('收到实时位置数据:', data)
      // 这里可以触发全局事件或更新状态管理器
    } catch (error) {
      console.error('解析位置数据失败:', error)
    }
  })
  
  console.log('WebSocket主题订阅完成，位置订阅ID:', positionSubscription)
}

// 初始化并导出
const wsConnection = initWebSocket()

// 打印初始状态
console.log('WebSocket初始状态:', stompManager.getStatus())

// 导出stompManager实例和连接Promise
export { stompManager as default, wsConnection }