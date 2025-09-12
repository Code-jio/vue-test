import stompManager from '@/utils/stompManager'

// 连接到 WebSocket 服务器
stompManager.connect(import.meta.env.VITE_APP_WS_URL, {
//   login: 'user',
//   passcode: 'pass',
  // debug: true,
  debug: (str) => console.debug('[STOMP]', str),
  heartbeatInterval: 30000
})

// 监听连接状态
stompManager.on('connect', () => {
  console.log('已连接到服务器')
})

stompManager.on('stateChange', (state) => {
  console.log('连接状态变化:', state)
})

// 订阅主题
const subscriptionId = stompManager.subscribe('/uwb/position/real/time', (message) => {
  console.log('收到消息:', message.body)
})

console.log(subscriptionId,"subscriptionId")

// // 发送消息
// stompManager.send('/app/chat', {
//   text: 'Hello, World!',
//   timestamp: Date.now()
// })

// 获取连接状态
console.log(stompManager.getStatus())

// 断开连接
// stompManager.disconnect()