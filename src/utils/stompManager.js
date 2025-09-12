import { Stomp, Client } from '@stomp/stompjs'
/**
 * STOMP WebSocket 通信管理器
 * 提供连接管理、自动重连、订阅管理、心跳机制等功能
 */
class StompManager {
  constructor() {
    this.client = null
    this.url = ''
    this.options = {}
    this.isConnected = false
    this.isConnecting = false
    this.subscriptions = new Map() // 存储订阅信息
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 5
    this.reconnectDelay = 3000
    this.reconnectTimer = null
    this.connectTimer = null // 连接超时定时器
    this.connectTimeout = 10000 // 连接超时时间(ms)
    this.eventListeners = new Map() // 事件监听器
    this.pendingConnect = null // 存储待处理的连接Promise
    
    // 连接状态常量
    this.STATES = {
      DISCONNECTED: 'disconnected',
      CONNECTING: 'connecting',
      CONNECTED: 'connected',
      RECONNECTING: 'reconnecting',
      ERROR: 'error'
    }
    
    this.currentState = this.STATES.DISCONNECTED
  }

  /**
   * 初始化连接
   * @param {string} url WebSocket 服务器地址
   * @param {Object} options 连接选项
   * @param {string} options.login 用户名
   * @param {string} options.passcode 密码
   * @param {Object} options.headers 自定义头部
   * @param {boolean} options.debug 是否开启调试模式
   * @param {number} options.heartbeatIncoming 传入心跳间隔(ms)
   * @param {number} options.heartbeatOutgoing 传出心跳间隔(ms)
   * @returns {Promise} 连接Promise
   */
  connect(url, options = {}) {
    // 如果正在连接，返回相同的Promise
    if (this.pendingConnect) {
      return this.pendingConnect
    }

    if (this.isConnected) {
      console.warn('StompManager: 已连接，跳过重复连接')
      return Promise.resolve(this.client)
    }

    this.pendingConnect = new Promise((resolve, reject) => {
      if (this.isConnecting) {
        console.warn('StompManager: 正在连接中，请等待...')
        return
      }

      this.url = url
      this.options = {
        login: '',
        passcode: '',
        headers: {},
        debug: false,
        heartbeatIncoming: 10000,
        heartbeatOutgoing: 10000,
        connectTimeout: this.connectTimeout,
        ...options
      }

      // 更新连接超时时间
      if (this.options.connectTimeout) {
        this.connectTimeout = this.options.connectTimeout
      }

      this.isConnecting = true
      this.currentState = this.STATES.CONNECTING
      this._emit('stateChange', this.currentState)

      // 设置连接超时
      this.connectTimer = setTimeout(() => {
        if (this.isConnecting) {
          console.error('StompManager: 连接超时')
          this._clearConnectTimer()
          this.isConnecting = false
          this.currentState = this.STATES.ERROR
          const timeoutError = new Error('Connection timeout')
          this._emit('error', timeoutError)
          this._emit('stateChange', this.currentState)
          reject(timeoutError)
        }
      }, this.connectTimeout)

      try {
        // 创建 WebSocket 连接
        const ws = new WebSocket(url)
        
        // 监听 WebSocket 连接错误（同步）
        ws.onerror = (event) => {
          console.error('StompManager: WebSocket 连接错误', event)
          this._clearConnectTimer()
          this.isConnected = false
          this.isConnecting = false
          this.currentState = this.STATES.ERROR
          this.pendingConnect = null
          
          const error = new Error(`WebSocket connection failed: ${url}`)
          this._emit('error', error)
          this._emit('stateChange', this.currentState)
          reject(error)
        }
        
        // 监听 WebSocket 连接关闭
        ws.onclose = (event) => {
          console.log('StompManager: WebSocket 连接关闭', event.code, event.reason)
          this._clearConnectTimer()
          
          // 如果是异常关闭且还在连接过程中，触发错误
          if (this.isConnecting && event.code !== 1000) {
            this.isConnected = false
            this.isConnecting = false
            this.currentState = this.STATES.ERROR
            this.pendingConnect = null
            
            const error = new Error(`WebSocket connection closed unexpectedly: ${event.code} ${event.reason}`)
            this._emit('error', error)
            this._emit('stateChange', this.currentState)
            reject(error)
            return
          }
          
          // 正常关闭处理
          this.isConnected = false
          this.isConnecting = false
          this.currentState = this.STATES.DISCONNECTED
          this.pendingConnect = null
          
          this._emit('disconnect')
          this._emit('stateChange', this.currentState)
          this._handleReconnect()
        }
        
        this.client = Stomp.over(ws)

        // 设置调试模式
        if (this.options.debug) {
          if (typeof this.options.debug === 'function') {
            this.client.debug = this.options.debug
          } else {
            this.client.debug = (str) => {
              console.log('STOMP Debug:', str)
            }
          }
        } else {
          this.client.debug = null
        }

        // 设置心跳
        this.client.heartbeat.outgoing = this.options.heartbeatOutgoing
        this.client.heartbeat.incoming = this.options.heartbeatIncoming

        // 连接成功回调
        const onConnect = (frame) => {
          console.log('StompManager: 连接成功', frame)
          this._clearConnectTimer()
          this.isConnected = true
          this.isConnecting = false
          this.reconnectAttempts = 0
          this.currentState = this.STATES.CONNECTED
          this.pendingConnect = null
          
          this._emit('connect', frame)
          this._emit('stateChange', this.currentState)
          this._resubscribeAll()
          
          resolve(this.client)
        }

        // 连接错误回调
        const onError = (error) => {
          console.error('StompManager: 连接错误', error)
          this._clearConnectTimer()
          this.isConnected = false
          this.isConnecting = false
          this.currentState = this.STATES.ERROR
          this.pendingConnect = null
          
          this._emit('error', error)
          this._emit('stateChange', this.currentState)
          this._handleReconnect()
          
          reject(error)
        }

        // 绑定 WebSocket 关闭事件（已在上面处理）
        // ws.onclose = onWebSocketClose

        // 开始连接
        this.client.connect(
          this.options.login,
          this.options.passcode,
          onConnect,
          onError,
          this.options.headers
        )

      } catch (error) {
        console.error('StompManager: 创建连接失败', error)
        this._clearConnectTimer()
        this.isConnecting = false
        this.currentState = this.STATES.ERROR
        this.pendingConnect = null
        this._emit('error', error)
        this._emit('stateChange', this.currentState)
        reject(error)
      }
    })

    return this.pendingConnect
  }

  /**
   * 断开连接
   */
  disconnect() {
    // 清理所有定时器
    this._clearReconnectTimer()
    this._clearConnectTimer()
    this.pendingConnect = null

    if (this.client && this.isConnected) {
      this.client.disconnect(() => {
        console.log('StompManager: 已断开连接')
        this.isConnected = false
        this.isConnecting = false
        this.currentState = this.STATES.DISCONNECTED
        this._emit('disconnect')
        this._emit('stateChange', this.currentState)
      })
    } else {
      this.isConnected = false
      this.isConnecting = false
      this.currentState = this.STATES.DISCONNECTED
      this._emit('stateChange', this.currentState)
    }

    // 清空订阅
    this.subscriptions.clear()
  }

  /**
   * 发送消息
   * @param {string} destination 目标地址
   * @param {Object|string} body 消息体
   * @param {Object} headers 消息头
   */
  send(destination, body = {}, headers = {}) {
    if (!this.isConnected || !this.client) {
      console.warn('StompManager: 未连接，无法发送消息')
      return false
    }

    try {
      const message = typeof body === 'string' ? body : JSON.stringify(body)
      this.client.send(destination, headers, message)
      console.log('StompManager: 消息已发送', { destination, body, headers })
      this._emit('messageSent', { destination, body, headers })
      return true
    } catch (error) {
      console.error('StompManager: 发送消息失败', error)
      this._emit('error', error)
      return false
    }
  }

  /**
   * 订阅主题
   * @param {string} destination 订阅地址
   * @param {Function} callback 消息回调函数
   * @param {Object} headers 订阅头部
   * @returns {string} 订阅ID
   */
  subscribe(destination, callback, headers = {}) {
    if (!destination || typeof callback !== 'function') {
      throw new Error('StompManager: 订阅参数无效')
    }

    const subscriptionId = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // 存储订阅信息
    this.subscriptions.set(subscriptionId, {
      destination,
      callback,
      headers,
      subscription: null
    })

    // 如果已连接，立即订阅
    if (this.isConnected && this.client) {
      this._doSubscribe(subscriptionId)
    }

    console.log('StompManager: 订阅已添加', { subscriptionId, destination })
    return subscriptionId
  }

  /**
   * 取消订阅
   * @param {string} subscriptionId 订阅ID
   */
  unsubscribe(subscriptionId) {
    const subscriptionInfo = this.subscriptions.get(subscriptionId)
    if (!subscriptionInfo) {
      console.warn('StompManager: 订阅不存在', subscriptionId)
      return
    }

    // 取消实际订阅
    if (subscriptionInfo.subscription) {
      subscriptionInfo.subscription.unsubscribe()
    }

    // 移除订阅信息
    this.subscriptions.delete(subscriptionId)
    console.log('StompManager: 订阅已取消', subscriptionId)
  }

  /**
   * 执行实际订阅操作
   * @private
   */
  _doSubscribe(subscriptionId) {
    const subscriptionInfo = this.subscriptions.get(subscriptionId)
    if (!subscriptionInfo) return

    try {
      const subscription = this.client.subscribe(
        subscriptionInfo.destination,
        (message) => {
          try {
            let body = message.body
            // 尝试解析 JSON
            try {
              body = JSON.parse(message.body)
            } catch (e) {
              // 保持原始字符串
            }

            const messageData = {
              destination: subscriptionInfo.destination,
              body,
              headers: message.headers,
              ack: message.ack?.bind(message),
              nack: message.nack?.bind(message)
            }

            subscriptionInfo.callback(messageData)
            this._emit('messageReceived', messageData)
          } catch (error) {
            console.error('StompManager: 处理消息失败', error)
            this._emit('error', error)
          }
        },
        subscriptionInfo.headers
      )

      subscriptionInfo.subscription = subscription
      console.log('StompManager: 订阅成功', subscriptionInfo.destination)
    } catch (error) {
      console.error('StompManager: 订阅失败', error)
      this._emit('error', error)
    }
  }

  /**
   * 重新订阅所有主题
   * @private
   */
  _resubscribeAll() {
    if (!this.isConnected || !this.client) return

    for (const [subscriptionId] of this.subscriptions) {
      this._doSubscribe(subscriptionId)
    }
    console.log('StompManager: 重新订阅完成', this.subscriptions.size)
  }

  /**
   * 清理连接超时定时器
   * @private
   */
  _clearConnectTimer() {
    if (this.connectTimer) {
      clearTimeout(this.connectTimer)
      this.connectTimer = null
    }
  }

  /**
   * 清理重连定时器
   * @private
   */
  _clearReconnectTimer() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
  }

  /**
   * 处理自动重连
   * @private
   */
  _handleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('StompManager: 达到最大重连次数，停止重连')
      this.currentState = this.STATES.ERROR
      this._emit('stateChange', this.currentState)
      this._emit('reconnectFailed')
      return
    }

    this._clearReconnectTimer()

    this.currentState = this.STATES.RECONNECTING
    this._emit('stateChange', this.currentState)

    this.reconnectTimer = setTimeout(() => {
      this.reconnectAttempts++
      console.log(`StompManager: 尝试重连 ${this.reconnectAttempts}/${this.maxReconnectAttempts}`)
      this._emit('reconnectAttempt', this.reconnectAttempts)
      
      this.connect(this.url, this.options)
        .catch(error => {
          console.error('StompManager: 重连失败', error)
        })
    }, this.reconnectDelay)
  }

  /**
   * 获取连接状态
   * @returns {Object} 状态信息
   */
  getStatus() {
    return {
      isConnected: this.isConnected,
      isConnecting: this.isConnecting,
      currentState: this.currentState,
      url: this.url,
      subscriptionsCount: this.subscriptions.size,
      reconnectAttempts: this.reconnectAttempts,
      maxReconnectAttempts: this.maxReconnectAttempts
    }
  }

  /**
   * 设置重连配置
   * @param {number} maxAttempts 最大重连次数
   * @param {number} delay 重连延迟(ms)
   */
  setReconnectConfig(maxAttempts, delay) {
    this.maxReconnectAttempts = maxAttempts
    this.reconnectDelay = delay
  }

  /**
   * 添加事件监听器
   * @param {string} event 事件名称
   * @param {Function} listener 监听器函数
   */
  on(event, listener) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set())
    }
    this.eventListeners.get(event).add(listener)
  }

  /**
   * 移除事件监听器
   * @param {string} event 事件名称
   * @param {Function} listener 监听器函数
   */
  off(event, listener) {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      listeners.delete(listener)
      if (listeners.size === 0) {
        this.eventListeners.delete(event)
      }
    }
  }

  /**
   * 触发事件
   * @private
   */
  _emit(event, data) {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(data)
        } catch (error) {
          console.error('StompManager: 事件监听器执行错误', error)
        }
      })
    }
  }

  /**
   * 获取所有订阅信息
   * @returns {Array} 订阅信息列表
   */
  getSubscriptions() {
    const subscriptions = []
    for (const [id, info] of this.subscriptions) {
      subscriptions.push({
        id,
        destination: info.destination,
        headers: info.headers,
        isActive: !!info.subscription
      })
    }
    return subscriptions
  }

  /**
   * 清空所有订阅
   */
  clearSubscriptions() {
    for (const [subscriptionId] of this.subscriptions) {
      this.unsubscribe(subscriptionId)
    }
  }

  /**
   * 销毁实例，清理所有资源
   */
  destroy() {
    this.disconnect()
    this.clearSubscriptions()
    this.eventListeners.clear()
    this.subscriptions.clear()
  }

  /**
   * 获取订阅信息由目标地址
   * @param {string} destination 目标地址
   * @returns {Array} 订阅信息列表
   */
  getSubscriptionsByDestination(destination) {
    const subscriptions = []
    for (const [id, info] of this.subscriptions) {
      if (info.destination === destination) {
        subscriptions.push({
          id,
          destination: info.destination,
          headers: info.headers,
          isActive: !!info.subscription
        })
      }
    }
    return subscriptions
  }

  /**
   * 检查连接健康状态
   * @returns {boolean} 连接是否健康
   */
  isHealthy() {
    return this.isConnected && this.currentState === this.STATES.CONNECTED
  }
}

// 创建单例实例
const stompManager = new StompManager()

export default stompManager
export { StompManager }


// import stompManager from '@/utils/stompManager'

// // 连接到 WebSocket 服务器
// stompManager.connect('ws://localhost:8080/ws', {
//   login: 'user',
//   passcode: 'pass',
//   debug: true,
//   heartbeatInterval: 30000
// })

// // 监听连接状态
// stompManager.on('connect', () => {
//   console.log('已连接到服务器')
// })

// stompManager.on('stateChange', (state) => {
//   console.log('连接状态变化:', state)
// })

// // 订阅主题
// const subscriptionId = stompManager.subscribe('/topic/messages', (message) => {
//   console.log('收到消息:', message.body)
// })

// // 发送消息
// stompManager.send('/app/chat', {
//   text: 'Hello, World!',
//   timestamp: Date.now()
// })

// // 获取连接状态
// console.log(stompManager.getStatus())

// // 断开连接
// // stompManager.disconnect()