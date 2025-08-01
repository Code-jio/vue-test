# 高级压缩解码器设置指南

## 📋 概述

此项目支持三种先进的3D资源压缩技术，每种都需要相应的解码器文件。本指南将帮助你正确设置所有必需的解码器。

## 📁 目录结构

```
public/
├── draco/                 # DRACO几何体压缩解码器
│   ├── gltf/             # glTF专用DRACO解码器
│   ├── draco_decoder.js
│   ├── draco_decoder.wasm
│   └── README.md
├── ktx2/                 # KTX2纹理压缩解码器 [新增]
│   ├── basis_transcoder.js
│   ├── basis_transcoder.wasm
│   └── README.md
└── meshopt/              # Meshopt网格量化解码器 [新增]
    ├── meshopt_decoder.js
    ├── meshopt_decoder.wasm
    └── README.md
```

## 🎯 压缩技术对比

| 技术 | 类型 | 压缩率 | 适用场景 | 解码器状态 |
|------|------|--------|----------|------------|
| DRACO | 几何体压缩 | 80-90% | 复杂模型 | ✅ 已配置 |
| KTX2 | 纹理压缩 | 75-85% | 高分辨率纹理 | ⚠️ 需要设置 |
| Meshopt | 网格量化 | 60-70% | 所有模型 | ✅ Three.js内置 |

## 🔧 快速设置

### 1. 检查当前状态

```bash
# 检查解码器目录
ls -la public/draco/     # 应该有文件
ls -la public/ktx2/      # 目前只有占位符
ls -la public/meshopt/   # 目前只有占位符
```

### 2. 安装KTX2解码器（必需）

#### 方法A：从Three.js复制（推荐）
```bash
# 确保已安装Three.js
npm install three

# 复制BASIS Universal解码器
cp node_modules/three/examples/jsm/libs/basis/* public/ktx2/
```

#### 方法B：从官方下载
```bash
# 下载预编译版本
wget https://github.com/BinomialLLC/basis_universal/releases/latest/download/basis_transcoder.js -O public/ktx2/basis_transcoder.js
wget https://github.com/BinomialLLC/basis_universal/releases/latest/download/basis_transcoder.wasm -O public/ktx2/basis_transcoder.wasm
```

#### 方法C：使用CDN（开发环境）
```javascript
// 配置使用CDN
const loader = ResourceReaderPlugin.create({
    enableKTX2: true,
    ktx2Path: "https://cdn.jsdelivr.net/npm/three@latest/examples/jsm/libs/basis/"
})
```

### 3. Meshopt解码器（可选）

Meshopt解码器通常由Three.js自动处理，但如果需要自定义：

```bash
# 从Three.js复制（如果需要）
cp node_modules/three/examples/jsm/libs/meshopt_decoder.module.js public/meshopt/meshopt_decoder.js
```

## ⚡ 验证设置

### 创建验证脚本

```typescript
// public/test-decoders.js
async function verifyDecoders() {
    const results = {
        draco: false,
        ktx2: false,
        meshopt: false
    }
    
    // 检查DRACO
    try {
        const dracoResponse = await fetch('/draco/draco_decoder.wasm')
        results.draco = dracoResponse.ok
    } catch (e) {
        console.error('DRACO检查失败:', e)
    }
    
    // 检查KTX2
    try {
        const ktx2Response = await fetch('/ktx2/basis_transcoder.wasm')
        results.ktx2 = ktx2Response.ok
    } catch (e) {
        console.error('KTX2检查失败:', e)
    }
    
    // 检查Meshopt（Three.js内置）
    try {
        const { MeshoptDecoder } = await import('three/examples/jsm/libs/meshopt_decoder.module.js')
        await MeshoptDecoder.ready
        results.meshopt = true
    } catch (e) {
        console.error('Meshopt检查失败:', e)
    }
    
    console.log('🔍 解码器状态检查:')
    console.log(`  DRACO: ${results.draco ? '✅' : '❌'}`)
    console.log(`  KTX2: ${results.ktx2 ? '✅' : '❌'}`)
    console.log(`  Meshopt: ${results.meshopt ? '✅' : '❌'}`)
    
    return results
}

// 运行验证
verifyDecoders()
```

### 在应用中测试

```typescript
// 在你的应用中测试
import { ResourceReaderPlugin } from './EngineKernel/src/plugins/webgl/resourceReaderPlugin'

const loader = ResourceReaderPlugin.create({
    enableDraco: true,
    enableKTX2: true,
    enableMeshopt: true
})

await loader.init(null)

// 获取支持状态
const info = loader.getLoaderInfo()
console.log('📊 支持状态:', {
    DRACO: info.dracoEnabled,
    KTX2: info.ktx2Enabled,
    Meshopt: info.meshoptEnabled
})
```

## 📦 文件大小参考

### 预期文件大小：

```
draco/
├── draco_decoder.wasm      ~279KB
├── draco_decoder.js        ~703KB
└── gltf/
    ├── draco_decoder.wasm  ~188KB
    └── draco_decoder.js    ~500KB

ktx2/
├── basis_transcoder.wasm   ~1.5MB
└── basis_transcoder.js     ~200KB

meshopt/
├── meshopt_decoder.wasm    ~50KB   (可选)
└── meshopt_decoder.js      ~30KB   (可选)
```

## 🚨 常见问题

### Q: KTX2纹理不显示？
```bash
# 检查解码器文件
curl -I http://localhost:3000/ktx2/basis_transcoder.wasm
# 应该返回 200 OK

# 检查控制台错误
# 打开浏览器开发者工具查看错误信息
```

### Q: Meshopt量化模型变形？
```javascript
// 检查Three.js版本
console.log('Three.js版本:', THREE.REVISION)
// 确保使用 r148+ 版本

// 检查模型是否正确量化
const info = model.userData
console.log('模型信息:', info)
```

### Q: DRACO解码失败？
```bash
# 确认DRACO文件完整性
ls -la public/draco/
# 应该看到 .js 和 .wasm 文件

# 检查服务器配置
# 确保服务器正确提供 .wasm 文件的 MIME 类型
```

## 🔧 开发环境配置

### Vite配置（Vue项目）

```javascript
// vite.config.js
export default {
    server: {
        fs: {
            allow: ['..']  // 允许访问上级目录
        }
    },
    assetsInclude: ['**/*.wasm']  // 包含WASM文件
}
```

### Webpack配置

```javascript
// webpack.config.js
module.exports = {
    module: {
        rules: [
            {
                test: /\.wasm$/,
                type: 'asset/resource'
            }
        ]
    }
}
```

## 🚀 生产环境优化

### CDN部署

```javascript
// 生产环境使用CDN
const isProduction = process.env.NODE_ENV === 'production'

const loader = ResourceReaderPlugin.create({
    enableDraco: true,
    enableKTX2: true,
    enableMeshopt: true,
    
    // 生产环境使用CDN
    dracoPath: isProduction 
        ? "https://cdn.example.com/decoders/draco/" 
        : "/draco/",
    ktx2Path: isProduction 
        ? "https://cdn.example.com/decoders/ktx2/" 
        : "/ktx2/",
})
```

### 文件压缩

```bash
# 使用gzip压缩解码器文件
gzip -k public/draco/*.wasm
gzip -k public/ktx2/*.wasm

# 配置服务器自动gzip压缩
# 在nginx.conf中：
# gzip_types application/wasm;
```

## 📈 性能监控

### 加载时间监控

```javascript
// 监控解码器加载性能
const startTime = performance.now()

const loader = ResourceReaderPlugin.create({
    enableDraco: true,
    enableKTX2: true,
    enableMeshopt: true
})

await loader.init(null)

const loadTime = performance.now() - startTime
console.log(`🔧 解码器初始化耗时: ${loadTime.toFixed(2)}ms`)
```

### 文件大小统计

```javascript
// 统计解码器文件大小
async function getDecoderSizes() {
    const files = [
        '/draco/draco_decoder.wasm',
        '/ktx2/basis_transcoder.wasm',
        '/meshopt/meshopt_decoder.wasm'
    ]
    
    for (const file of files) {
        try {
            const response = await fetch(file, { method: 'HEAD' })
            const size = response.headers.get('content-length')
            console.log(`📦 ${file}: ${(parseInt(size) / 1024).toFixed(1)}KB`)
        } catch (e) {
            console.log(`❌ ${file}: 文件不存在`)
        }
    }
}
```

## 🔮 下一步

1. **验证当前设置** - 运行验证脚本
2. **安装KTX2解码器** - 按照上述方法安装
3. **测试加载性能** - 使用示例模型测试
4. **优化生产配置** - 配置CDN和压缩
5. **监控性能指标** - 设置性能监控

---

🎉 **恭喜！** 完成设置后，你的项目将支持业界最先进的3D资源压缩技术！ 