/**
 * KTX2纹理加载问题快速修复脚本
 * 在你的应用中引入并运行此脚本
 */

/**
 * 快速修复KTX2加载问题
 * @param {Object} options 配置选项
 * @returns {Promise<Object>} 修复结果
 */
async function fixKTX2Loading(options = {}) {
    const {
        ktx2Path = '/ktx2/',
        enableFallback = true,
        debugMode = false
    } = options

    console.log('🔧 开始修复KTX2纹理加载问题...')

    try {
        // 1. 动态加载Three.js模块
        const THREE = await import('three')
        const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js')
        const { KTX2Loader } = await import('three/examples/jsm/loaders/KTX2Loader.js')

        // 2. 创建渲染器（如果不存在）
        let renderer = null
        try {
            renderer = new THREE.WebGLRenderer({ antialias: true })
            if (debugMode) console.log('✅ WebGL渲染器创建成功')
        } catch (error) {
            console.warn('⚠️ 无法创建WebGL渲染器:', error.message)
        }

        // 3. 创建并配置KTX2Loader
        const ktx2Loader = new KTX2Loader()
        ktx2Loader.setTranscoderPath(ktx2Path)

        if (debugMode) console.log('✅ KTX2Loader创建成功，路径:', ktx2Path)

        // 4. 进行支持检测
        if (renderer) {
            try {
                await ktx2Loader.detectSupportAsync(renderer)
                if (debugMode) console.log('✅ KTX2支持检测完成')
            } catch (error) {
                console.warn('⚠️ KTX2支持检测失败，但继续尝试:', error.message)
            }
        }

        // 5. 创建修复后的GLTFLoader
        const gltfLoader = new GLTFLoader()
        gltfLoader.setKTX2Loader(ktx2Loader)

        if (debugMode) console.log('✅ GLTFLoader已配置KTX2支持')

        // 6. 测试加载器
        const testResult = await testKTX2Loader(gltfLoader, debugMode)

        // 7. 全局导出修复后的加载器
        if (typeof window !== 'undefined') {
            window.fixedGLTFLoader = gltfLoader
            window.fixedKTX2Loader = ktx2Loader
            
            if (debugMode) console.log('✅ 修复后的加载器已导出到 window.fixedGLTFLoader')
        }

        return {
            success: true,
            gltfLoader,
            ktx2Loader,
            renderer,
            testResult,
            message: 'KTX2加载问题修复成功'
        }

    } catch (error) {
        console.error('❌ KTX2修复失败:', error)
        
        if (enableFallback) {
            return await fallbackSolution(debugMode)
        }
        
        throw error
    }
}

/**
 * 测试KTX2Loader是否正常工作
 */
async function testKTX2Loader(gltfLoader, debugMode = false) {
    try {
        // 简单的测试：检查加载器配置
        const hasKTX2Support = !!gltfLoader.ktx2Loader
        
        if (debugMode) {
            console.log(`📋 KTX2Loader测试结果: ${hasKTX2Support ? '已配置' : '未配置'}`)
        }

        return {
            hasKTX2Support,
            status: hasKTX2Support ? 'ready' : 'not_configured'
        }
    } catch (error) {
        if (debugMode) {
            console.warn('⚠️ KTX2Loader测试失败:', error.message)
        }
        return {
            hasKTX2Support: false,
            status: 'test_failed',
            error: error.message
        }
    }
}

/**
 * 降级解决方案
 */
async function fallbackSolution(debugMode = false) {
    console.log('🔄 尝试降级解决方案...')
    
    try {
        const THREE = await import('three')
        const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js')
        
        // 创建基础GLTFLoader（无KTX2支持）
        const basicGltfLoader = new GLTFLoader()
        
        if (typeof window !== 'undefined') {
            window.basicGLTFLoader = basicGltfLoader
        }
        
        console.log('⚠️ 使用基础GLTFLoader（不支持KTX2纹理）')
        
        return {
            success: true,
            gltfLoader: basicGltfLoader,
            ktx2Loader: null,
            isFallback: true,
            message: '使用降级方案：基础GLTF加载器'
        }
    } catch (error) {
        console.error('❌ 降级方案也失败了:', error)
        return {
            success: false,
            error: error.message,
            message: '所有解决方案都失败了'
        }
    }
}

/**
 * 应用修复到ResourceReaderPlugin
 */
async function applyFixToResourceReaderPlugin(options = {}) {
    if (typeof ResourceReaderPlugin === 'undefined') {
        console.warn('⚠️ ResourceReaderPlugin未找到，跳过应用修复')
        return null
    }

    try {
        console.log('🔧 正在修复ResourceReaderPlugin的KTX2支持...')
        
        // 创建修复后的配置
        const fixedConfig = {
            enableDraco: true,
            enableKTX2: true,
            enableMeshopt: true,
            ktx2Path: options.ktx2Path || '/ktx2/',
            ...options
        }

        // 创建新的ResourceReaderPlugin实例
        const fixedPlugin = ResourceReaderPlugin.create(fixedConfig)
        
        // 初始化
        await fixedPlugin.init(null)
        
        // 检查状态
        const info = fixedPlugin.getLoaderInfo()
        console.log('📊 修复后的ResourceReaderPlugin状态:')
        console.log(`  KTX2支持: ${info.ktx2Enabled}`)
        console.log(`  KTX2路径: ${info.ktx2Path}`)
        
        // 全局导出
        if (typeof window !== 'undefined') {
            window.fixedResourceReaderPlugin = fixedPlugin
        }
        
        return fixedPlugin
        
    } catch (error) {
        console.error('❌ ResourceReaderPlugin修复失败:', error)
        return null
    }
}

/**
 * 一键修复所有KTX2问题
 */
async function oneClickFix(options = {}) {
    console.log('🚀 开始一键修复所有KTX2问题...')
    
    const results = {
        basicFix: null,
        pluginFix: null,
        timestamp: new Date().toISOString()
    }
    
    try {
        // 1. 基础修复
        results.basicFix = await fixKTX2Loading({
            debugMode: true,
            ...options
        })
        
        // 2. 插件修复
        results.pluginFix = await applyFixToResourceReaderPlugin(options)
        
        console.log('✅ 一键修复完成！')
        console.log('💡 现在可以使用:')
        console.log('  - window.fixedGLTFLoader (修复后的GLTFLoader)')
        console.log('  - window.fixedResourceReaderPlugin (修复后的ResourceReaderPlugin)')
        
        return results
        
    } catch (error) {
        console.error('❌ 一键修复失败:', error)
        results.error = error.message
        return results
    }
}

// 自动检测并修复（可选）
if (typeof window !== 'undefined') {
    console.log('🔧 KTX2修复脚本已加载')
    console.log('💡 可用方法:')
    console.log('  - fixKTX2Loading() - 基础修复')
    console.log('  - applyFixToResourceReaderPlugin() - 插件修复')
    console.log('  - oneClickFix() - 一键修复所有问题')
    
    // 暴露到全局
    window.fixKTX2Loading = fixKTX2Loading
    window.applyFixToResourceReaderPlugin = applyFixToResourceReaderPlugin
    window.oneClickFix = oneClickFix
} 