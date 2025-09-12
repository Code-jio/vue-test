import stompManager from '@/utils/stompManager'

/**
 * WebSocket 应用服务
 * 提供应用层的 WebSocket 配置和业务逻辑封装
 * 基于 stompManager 进行简单包装，避免功能重复
 */
class WebSocketService {
  constructor() {
    this.isInitialized = false
    this.businessSubscriptions = new Map() // 业务订阅记录
  }

  /**
   * 初始化 WebSocket 连接
   * @param {Object} config 配置对象
   */
  async init(config = {}) {
    if (this.isInitialized) {
      console.warn('WebSocket 服务已初始化')
      return stompManager
    }

    const defaultConfig = {
      url: import.meta.env.VITE_APP_WS_URL,
      options: {
        debug: (str) => console.debug('[STOMP]', str),
        heartbeatIncoming: 30000,
        heartbeatOutgoing: 30000,
        connectTimeout: 10000
      }
    }

    const finalConfig = { ...defaultConfig, ...config }

    try {
      // 设置一次性业务事件监听器
      this._setupBusinessEventListeners()
      
      // 直接使用 stompManager 连接
      await stompManager.connect(finalConfig.url, finalConfig.options)
      
      this.isInitialized = true
      console.log('✅ WebSocket 服务初始化成功')
      return stompManager
    } catch (error) {
      console.error('❌ WebSocket 服务初始化失败:', error)
      throw error
    }
  }

  /**
   * 设置业务层事件监听器（一次性设置）
   * @private
   */
  _setupBusinessEventListeners() {
    // 只设置业务相关的事件处理，避免重复
    stompManager.on('connect', () => {
      console.log('🔗 WebSocket 业务服务已就绪')
    })

    stompManager.on('reconnectFailed', () => {
      console.error('🔥 WebSocket 重连失败，请检查网络连接')
      // 这里可以添加业务层的处理逻辑，比如显示全局提示
    })
  }

  /**
   * 业务订阅包装 - 添加业务逻辑处理
   * @param {string} destination 目标地址
   * @param {Function} callback 回调函数
   * @param {Object} options 选项
   * @returns {string} 订阅ID
   */
  subscribe(destination, callback, options = {}) {
    if (!this.isInitialized) {
      throw new Error('WebSocket 服务未初始化，请先调用 init() 方法')
    }

    // 包装回调函数，添加业务层处理
    const wrappedCallback = (message) => {
      try {
        // 业务层预处理
        if (options.preprocess) {
          message = options.preprocess(message)
        }
        
        callback(message)
        
        // 业务层后处理
        if (options.postprocess) {
          options.postprocess(message)
        }
      } catch (error) {
        console.error(`❌ 订阅 ${destination} 消息处理错误:`, error)
        if (options.onError) {
          options.onError(error, message)
        }
      }
    }

    // 直接使用 stompManager 的订阅功能
    const subscriptionId = stompManager.subscribe(destination, wrappedCallback, options.headers)

    // 记录业务订阅信息
    this.businessSubscriptions.set(subscriptionId, {
      destination,
      originalCallback: callback,
      options
    })

    console.log(`📨 已订阅业务主题: ${destination}`)
    return subscriptionId
  }

  /**
   * 取消业务订阅
   * @param {string} subscriptionId 订阅ID
   */
  unsubscribe(subscriptionId) {
    stompManager.unsubscribe(subscriptionId)
    this.businessSubscriptions.delete(subscriptionId)
    console.log(`📭 已取消业务订阅: ${subscriptionId}`)
  }

  /**
   * 业务消息发送包装
   * @param {string} destination 目标地址
   * @param {Object|string} body 消息体
   * @param {Object} headers 消息头
   * @returns {boolean} 发送是否成功
   */
  send(destination, body, headers = {}) {
    if (!this.isInitialized) {
      console.warn('⚠️ WebSocket 服务未初始化，无法发送消息')
      return false
    }

    // 添加业务层的消息头
    const businessHeaders = {
      'app-version': '1.0.0',
      'timestamp': Date.now().toString(),
      ...headers
    }

    return stompManager.send(destination, body, businessHeaders)
  }

  /**
   * 获取服务状态（组合 stompManager 状态和业务状态）
   * @returns {Object} 状态信息
   */
  getStatus() {
    return {
      ...stompManager.getStatus(),
      isInitialized: this.isInitialized,
      businessSubscriptions: this.businessSubscriptions.size
    }
  }

  /**
   * 获取业务订阅列表
   * @returns {Array} 业务订阅信息
   */
  getBusinessSubscriptions() {
    const subscriptions = []
    for (const [id, info] of this.businessSubscriptions) {
      subscriptions.push({
        id,
        destination: info.destination,
        hasPreprocess: !!info.options.preprocess,
        hasPostprocess: !!info.options.postprocess,
        hasErrorHandler: !!info.options.onError
      })
    }
    return subscriptions
  }

  /**
   * 重置服务（保持 stompManager 连接）
   */
  reset() {
    // 清理业务订阅
    for (const [subscriptionId] of this.businessSubscriptions) {
      this.unsubscribe(subscriptionId)
    }
    this.isInitialized = false
    console.log('🔄 WebSocket 业务服务已重置')
  }

  /**
   * 销毁服务
   */
  destroy() {
    this.reset()
    // 注意：不销毁 stompManager，因为它可能被其他地方使用
    console.log('🗑️ WebSocket 业务服务已销毁')
  }

  // 直接暴露 stompManager 的常用方法，避免重复实现
  get manager() {
    return stompManager
  }

  // 快捷方法：直接访问 stompManager 的方法
  on(event, listener) {
    return stompManager.on(event, listener)
  }

  off(event, listener) {
    return stompManager.off(event, listener)
  }

  isHealthy() {
    return stompManager.isHealthy()
  }

  disconnect() {
    this.reset()
    return stompManager.disconnect()
  }
}

// 创建单例实例
const webSocketService = new WebSocketService()

// 自动初始化
webSocketService.init().catch(error => {
  console.error('WebSocket 服务自动启动失败:', error)
})

// 设置 UWB 位置数据订阅（业务逻辑示例）
webSocketService.init().then(() => {
  const uwbSubscriptionId = webSocketService.subscribe(
    '/uwb/position/real/time',
    (message) => {
      console.log('📍 UWB 位置数据:', message.body)
      // 这里可以添加具体的位置数据处理逻辑
    },
    {
      preprocess: (message) => {
        // 预处理：数据验证
        if (!message.body || typeof message.body !== 'object') {
          throw new Error('UWB 数据格式错误')
        }
        return message
      },
      onError: (error, message) => {
        console.error('UWB 数据处理错误:', error)
      }
    }
  )
  
  console.log('UWB 订阅ID:', uwbSubscriptionId)
})

// 导出服务实例和类
export default webSocketService
export { WebSocketService, stompManager }