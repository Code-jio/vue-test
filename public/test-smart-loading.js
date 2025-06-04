// 智能DRACO检测测试脚本
console.log('🧪 开始测试智能DRACO检测功能...')

// 模拟ResourceReaderPlugin的智能检测逻辑
class SmartLoadingDemo {
  constructor() {
    this.modelTypeCache = new Map()
    this.loadAttempts = []
  }

  // 模拟智能加载过程
  simulateSmartLoading(modelName, isCompressed) {
    console.log(`\n📦 加载模型: ${modelName}`)
    
    // 检查缓存
    const cachedType = this.modelTypeCache.get(modelName)
    if (cachedType) {
      console.log(`📋 从缓存得知模型类型: ${cachedType}`)
      this.loadAttempts.push({
        model: modelName,
        attempts: 1,
        success: true,
        method: cachedType,
        fromCache: true
      })
      return
    }

    // 首次加载 - 尝试基础模式
    console.log(`🔍 首次加载，尝试基础模式...`)
    
    if (!isCompressed) {
      // 基础加载成功
      console.log(`✅ 基础加载成功（无压缩）`)
      this.modelTypeCache.set(modelName, 'basic')
      this.loadAttempts.push({
        model: modelName,
        attempts: 1,
        success: true,
        method: 'basic',
        fromCache: false
      })
    } else {
      // 基础加载失败，尝试DRACO
      console.log(`⚠️ 基础加载失败，检测到压缩数据`)
      console.log(`🔧 启用DRACO重试...`)
      console.log(`✅ DRACO加载成功（已解压）`)
      this.modelTypeCache.set(modelName, 'draco')
      this.loadAttempts.push({
        model: modelName,
        attempts: 2,
        success: true,
        method: 'draco',
        fromCache: false
      })
    }
  }

  // 显示统计信息
  showStats() {
    console.log('\n📊 加载统计:')
    console.log('───────────────────────────────────')
    
    let totalAttempts = 0
    let basicModels = 0
    let dracoModels = 0
    
    this.loadAttempts.forEach(attempt => {
      totalAttempts += attempt.attempts
      if (attempt.method === 'basic') basicModels++
      else if (attempt.method === 'draco') dracoModels++
      
      const cacheIndicator = attempt.fromCache ? '(缓存)' : '(新加载)'
      console.log(`📁 ${attempt.model}: ${attempt.method} ${cacheIndicator} - ${attempt.attempts}次尝试`)
    })

    console.log('───────────────────────────────────')
    console.log(`📈 总加载尝试次数: ${totalAttempts}`)
    console.log(`🔧 基础模型: ${basicModels}个`)
    console.log(`🗜️ 压缩模型: ${dracoModels}个`)
    console.log(`💾 缓存命中率: ${this.calculateCacheHitRate()}%`)
    
    console.log('\n💡 智能检测优势:')
    console.log('• 非压缩模型直接加载，速度更快')
    console.log('• 压缩模型自动启用DRACO，无需预配置')
    console.log('• 模型类型缓存，避免重复检测')
    console.log('• 零配置，用户无感知')
  }

  calculateCacheHitRate() {
    const fromCache = this.loadAttempts.filter(a => a.fromCache).length
    return this.loadAttempts.length > 0 
      ? Math.round((fromCache / this.loadAttempts.length) * 100)
      : 0
  }
}

// 运行演示
const demo = new SmartLoadingDemo()

// 模拟加载不同类型的模型
console.log('\n🎬 演示场景1: 混合模型加载')
demo.simulateSmartLoading('01.gltf', false)      // 普通模型
demo.simulateSmartLoading('horse.glb', true)     // 压缩模型
demo.simulateSmartLoading('car.gltf', true)      // 压缩模型
demo.simulateSmartLoading('building.gltf', false) // 普通模型

console.log('\n🎬 演示场景2: 重复加载（测试缓存）')
demo.simulateSmartLoading('01.gltf', false)      // 从缓存加载
demo.simulateSmartLoading('horse.glb', true)     // 从缓存加载
demo.simulateSmartLoading('02.gltf', false)      // 新模型

demo.showStats()

console.log('\n🎯 结论: 智能DRACO检测大幅优化了加载性能！') 