console.log('🚀 ResourceReaderPlugin默认参数测试')

// 演示不同的初始化方式
function demonstrateInitialization() {
  console.log('📋 ResourceReaderPlugin初始化方式:')
  
  console.log('\n1️⃣ 使用默认配置 (推荐)')
  console.log('const plugin = ResourceReaderPlugin.create()')
  console.log('✅ 启用DRACO解压')
  console.log('✅ 100MB缓存')
  console.log('✅ 3个并发加载')
  console.log('✅ 自动资源清理')
  
  console.log('\n2️⃣ 自定义部分配置')
  console.log('const plugin = ResourceReaderPlugin.create({')
  console.log('  maxCacheSize: 200 * 1024 * 1024, // 200MB缓存')
  console.log('  dracoPath: "/assets/draco/"       // 自定义DRACO路径')
  console.log('})')
  
  console.log('\n3️⃣ 禁用DRACO (轻量模式)')
  console.log('const plugin = ResourceReaderPlugin.createBasic()')
  console.log('✅ 更快的初始化')
  console.log('✅ 更小的内存占用')
  console.log('❌ 不支持压缩模型')
  
  console.log('\n4️⃣ 高性能配置')
  console.log('const plugin = ResourceReaderPlugin.createHighPerformance()')
  console.log('✅ 500MB大缓存')
  console.log('✅ 6个并发加载')
  console.log('✅ 禁用自动清理')
  console.log('✅ 适合大量模型应用')
  
  console.log('\n5️⃣ 传统构造函数方式 (仍然支持)')
  console.log('const plugin = new ResourceReaderPlugin({')
  console.log('  enableDraco: true,')
  console.log('  maxCacheSize: 50 * 1024 * 1024')
  console.log('})')
}

// 演示配置验证功能
function demonstrateValidation() {
  console.log('\n🔍 配置验证功能:')
  
  console.log('\n✅ 自动修正不合理配置:')
  console.log('- 缓存过小 (<10MB) → 自动调整为10MB')
  console.log('- 缓存过大 (>2GB) → 自动调整为2GB')
  console.log('- 并发数 <1 → 自动调整为1')
  console.log('- DRACO路径缺少斜杠 → 自动添加')
  console.log('- 未指定格式 → 使用默认 [gltf, glb]')
  
  console.log('\n⚠️ 性能建议:')
  console.log('- 并发数 >10 → 显示性能警告')
  console.log('- 根据设备性能调整配置')
}

// 演示预设配置使用场景
function demonstrateUseCases() {
  console.log('\n🎯 使用场景建议:')
  
  console.log('\n📱 移动设备/低配置:')
  console.log('ResourceReaderPlugin.create({')
  console.log('  maxCacheSize: 50 * 1024 * 1024,  // 50MB')
  console.log('  maxConcurrentLoads: 2            // 降低并发')
  console.log('})')
  
  console.log('\n🖥️ 桌面应用/高配置:')
  console.log('ResourceReaderPlugin.createHighPerformance({')
  console.log('  maxCacheSize: 1024 * 1024 * 1024 // 1GB')
  console.log('})')
  
  console.log('\n🌐 Web应用/通用:')
  console.log('ResourceReaderPlugin.create() // 使用默认配置')
  
  console.log('\n⚡ 原型开发/快速测试:')
  console.log('ResourceReaderPlugin.createBasic() // 禁用DRACO')
  
  console.log('\n🎮 游戏/大量模型:')
  console.log('ResourceReaderPlugin.createHighPerformance({')
  console.log('  autoDispose: false,              // 保持缓存')
  console.log('  maxConcurrentLoads: 8            // 高并发')
  console.log('})')
}

// 展示配置信息结构
function demonstrateConfigStructure() {
  console.log('\n📊 完整配置选项:')
  console.log('{')
  console.log('  url: string                    // 基础URL')
  console.log('  maxCacheSize: number           // 最大缓存大小(字节)')
  console.log('  maxConcurrentLoads: number     // 最大并发加载数')
  console.log('  enableDraco: boolean           // 启用DRACO解压')
  console.log('  dracoPath: string              // DRACO解码器路径')
  console.log('  supportedFormats: string[]     // 支持的文件格式')
  console.log('  autoDispose: boolean           // 自动释放过期资源')
  console.log('}')
  
  console.log('\n📈 默认值:')
  console.log('{')
  console.log('  url: "",')
  console.log('  maxCacheSize: 104857600,       // 100MB')
  console.log('  maxConcurrentLoads: 3,')
  console.log('  enableDraco: true,')
  console.log('  dracoPath: "/draco/",')
  console.log('  supportedFormats: ["gltf", "glb"],')
  console.log('  autoDispose: true')
  console.log('}')
}

// 执行演示
demonstrateInitialization()
demonstrateValidation()
demonstrateUseCases()
demonstrateConfigStructure()

console.log('\n✨ 默认参数功能演示完成!')
console.log('💡 建议: 大多数情况下直接使用 ResourceReaderPlugin.create() 即可') 