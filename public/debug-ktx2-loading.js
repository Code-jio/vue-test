/**
 * KTX2纹理加载问题调试脚本
 * 使用方法：在浏览器控制台中运行此脚本
 */

async function debugKTX2Loading() {
    console.log('🔍 开始KTX2纹理加载调试...')

    // 1. 检查基础环境
    console.log('\n=== 基础环境检查 ===')
    console.log(`Three.js版本: ${typeof THREE !== 'undefined' ? THREE.REVISION : '未找到THREE.js'}`)
    console.log(`浏览器: ${navigator.userAgent}`)

    // 2. 检查解码器文件是否存在
    console.log('\n=== 解码器文件检查 ===')
    const requiredFiles = [
        '/ktx2/basis_transcoder.js',
        '/ktx2/basis_transcoder.wasm'
    ]

    for (const file of requiredFiles) {
        try {
            const response = await fetch(file, { method: 'HEAD' })
            const size = response.headers.get('content-length')
            console.log(`✅ ${file}: ${response.ok ? '存在' : '不存在'} (${size ? Math.round(size/1024) + 'KB' : '大小未知'})`)
        } catch (error) {
            console.log(`❌ ${file}: 加载失败 - ${error.message}`)
        }
    }

    // 3. 检查WebGL压缩纹理支持
    console.log('\n=== WebGL压缩纹理支持检查 ===')
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl')
    
    if (gl) {
        const extensions = {
            'ETC1': gl.getExtension('WEBGL_compressed_texture_etc1'),
            'S3TC': gl.getExtension('WEBGL_compressed_texture_s3tc'),
            'PVRTC': gl.getExtension('WEBGL_compressed_texture_pvrtc'),
            'ASTC': gl.getExtension('WEBGL_compressed_texture_astc'),
            'ETC': gl.getExtension('WEBGL_compressed_texture_etc')
        }

        Object.entries(extensions).forEach(([name, ext]) => {
            console.log(`${ext ? '✅' : '❌'} ${name}: ${ext ? '支持' : '不支持'}`)
        })
    } else {
        console.log('❌ WebGL不可用')
    }

    // 4. 测试KTX2Loader初始化
    console.log('\n=== KTX2Loader初始化测试 ===')
    try {
        // 动态导入Three.js KTX2Loader
        const threeModule = await import('three')
        const { KTX2Loader } = await import('three/examples/jsm/loaders/KTX2Loader.js')
        
        console.log('✅ KTX2Loader模块加载成功')
        
        // 创建KTX2Loader实例
        const ktx2Loader = new KTX2Loader()
        ktx2Loader.setTranscoderPath('/ktx2/')
        
        console.log('✅ KTX2Loader实例创建成功')
        
        // 检查解码器初始化
        try {
            await ktx2Loader.detectSupportAsync({ renderer: null })
            console.log('✅ KTX2Loader解码器检测成功')
        } catch (error) {
            console.log(`⚠️ KTX2Loader解码器检测警告: ${error.message}`)
        }

    } catch (error) {
        console.log(`❌ KTX2Loader初始化失败: ${error.message}`)
    }

    // 5. 检查ResourceReaderPlugin配置
    console.log('\n=== ResourceReaderPlugin配置检查 ===')
    if (typeof ResourceReaderPlugin !== 'undefined') {
        try {
            const loader = ResourceReaderPlugin.create({
                enableKTX2: true,
                ktx2Path: '/ktx2/'
            })
            
            await loader.init(null)
            const info = loader.getLoaderInfo()
            
            console.log('ResourceReaderPlugin状态:')
            console.log(`  KTX2启用: ${info.ktx2Enabled}`)
            console.log(`  KTX2路径: ${info.ktx2Path}`)
            console.log(`  支持格式: ${info.supportedFormats.join(', ')}`)

        } catch (error) {
            console.log(`❌ ResourceReaderPlugin测试失败: ${error.message}`)
        }
    } else {
        console.log('⚠️ ResourceReaderPlugin未找到')
    }

    // 6. 问题诊断建议
    console.log('\n=== 问题诊断建议 ===')
    console.log('如果KTX2纹理仍然无法加载，请检查：')
    console.log('1. 确保模型中的KTX2纹理文件路径正确')
    console.log('2. 检查服务器是否正确提供.ktx2文件的MIME类型')
    console.log('3. 确认纹理文件没有损坏')
    console.log('4. 检查控制台是否有其他相关错误信息')
    
    return {
        message: 'KTX2调试完成，请查看上述输出信息',
        timestamp: new Date().toISOString()
    }
}

// 自动运行调试
if (typeof window !== 'undefined') {
    console.log('🚀 KTX2调试脚本已加载，运行 debugKTX2Loading() 开始调试')
} 