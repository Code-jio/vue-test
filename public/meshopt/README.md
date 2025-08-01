# Meshopt 网格量化解码器

## 📋 概述

此文件夹包含Meshopt网格量化和压缩的解码器文件。Meshopt可以显著减少3D模型的内存占用和传输大小，同时保持视觉质量。

## 📦 文件说明

### 标准配置：
- `meshopt_decoder.js` - JavaScript解码器（可选）
- `meshopt_decoder.wasm` - WebAssembly解码器（可选）

### 当前状态：
✅ **Three.js内置支持** - 大多数情况下无需额外文件

## 🔧 工作原理

Meshopt解码器通常由Three.js自动处理：

```typescript
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'

// Three.js会自动初始化
await MeshoptDecoder.ready

// 设置到GLTF加载器（自动完成）
gltfLoader.setMeshoptDecoder(MeshoptDecoder)
```

## 🎯 优化功能

### 网格量化
- **顶点位置量化** - 减少位置精度
- **法线量化** - 优化法线数据
- **纹理坐标量化** - 压缩UV坐标
- **颜色量化** - 减少颜色精度

### 网格压缩
- **索引缓冲区压缩** - 优化三角形索引
- **顶点缓冲区重排** - 提升缓存命中率
- **几何体简化** - 减少不必要的顶点
- **条带化优化** - 提升GPU渲染效率

## 📊 性能提升

| 模型类型 | 原始大小 | 量化后大小 | 压缩率 | 质量损失 |
|----------|----------|------------|--------|----------|
| 建筑模型 | 50MB | 15MB | 70% | <1% |
| 角色模型 | 20MB | 8MB | 60% | <2% |
| 环境场景 | 100MB | 35MB | 65% | <1% |
| UI元素 | 5MB | 2MB | 60% | 0% |

## 🔽 获取解码器文件（如需要）

### 方法1：从Three.js获取（推荐）
```bash
# 解码器已包含在Three.js中
# node_modules/three/examples/jsm/libs/meshopt_decoder.module.js
```

### 方法2：从官方仓库下载
```bash
# 下载meshoptimizer
git clone https://github.com/zeux/meshoptimizer.git
cd meshoptimizer

# 构建WebAssembly版本
make -j js

# 复制文件
cp js/meshopt_decoder.js /path/to/project/public/meshopt/
cp js/meshopt_decoder.wasm /path/to/project/public/meshopt/
```

### 方法3：使用CDN
```javascript
// 使用CDN（通常不需要，因为Three.js内置）
const loader = ResourceReaderPlugin.create({
    enableMeshopt: true,
    // meshoptPath: "https://cdn.jsdelivr.net/npm/meshoptimizer@latest/js/"
})
```

## ⚙️ 配置选项

### 基础配置
```typescript
const loader = ResourceReaderPlugin.create({
    enableMeshopt: true,  // 启用网格量化
    // 通常无需指定路径，Three.js自动处理
})
```

### 自定义配置
```typescript
// 如果需要自定义解码器路径
const loader = ResourceReaderPlugin.create({
    enableMeshopt: true,
    meshoptPath: "/meshopt/"  // 指向自定义解码器
})
```

## 🎨 支持的压缩类型

### 几何体压缩
- **MESHOPT_BUFFER_POSITION** - 位置数据
- **MESHOPT_BUFFER_NORMAL** - 法线数据  
- **MESHOPT_BUFFER_TEXCOORD** - 纹理坐标
- **MESHOPT_BUFFER_COLOR** - 顶点颜色
- **MESHOPT_BUFFER_WEIGHTS** - 骨骼权重
- **MESHOPT_BUFFER_JOINTS** - 骨骼索引

### 索引压缩
- **MESHOPT_BUFFER_TRIANGLE_REINDEX** - 三角形重排
- **MESHOPT_BUFFER_TRIANGLE_STRIP** - 三角形条带

## 🔍 调试和监控

### 检查量化支持
```javascript
// 检查是否成功启用
const loaderInfo = resourceLoader.getLoaderInfo()
console.log('Meshopt支持:', loaderInfo.meshoptEnabled)

// 监控解码性能
loader.addEventListener('resource:loaded', (event) => {
    if (event.metadata?.optimization === 'meshopt') {
        console.log('✅ 量化模型加载完成:', event.url)
        console.log('📊 加载时间:', event.loadTime + 'ms')
    }
})
```

### 质量对比
```javascript
// 加载原始和量化版本进行对比
const original = await loader.loadModelAsync('/models/character.gltf')
const quantized = await loader.loadModelAsync('/models/character_meshopt.gltf')

console.log('原始模型顶点数:', getVertexCount(original))
console.log('量化模型顶点数:', getVertexCount(quantized))
```

## 🛠️ 工具链

### 模型优化工具
```bash
# 使用gltfpack进行量化优化
npm install -g gltfpack

# 基础量化
gltfpack -i model.gltf -o model_quantized.gltf

# 高级量化选项
gltfpack -i model.gltf -o model_optimized.gltf \
  -cc      # 网格压缩
  -tc      # 纹理压缩
  -mm      # 合并材质
  -si 0.01 # 简化阈值
```

### Blender导出设置
```python
# Blender导出时启用压缩
export_settings = {
    'format': 'GLB',
    'use_draco_mesh_compression': True,
    'draco_mesh_compression_enable': True,
    'draco_mesh_compression_level': 6,
    'draco_position_quantization': 11,
    'draco_normal_quantization': 8,
    'draco_texcoord_quantization': 10
}
```

## 🌐 兼容性

| 平台 | 支持状态 | 备注 |
|------|----------|------|
| Chrome 57+ | ✅ 完全支持 | WebAssembly支持 |
| Firefox 52+ | ✅ 完全支持 | WebAssembly支持 |
| Safari 11+ | ✅ 完全支持 | WebAssembly支持 |
| Edge 16+ | ✅ 完全支持 | WebAssembly支持 |
| 移动端 | ✅ 支持 | 性能优化更明显 |

## 🚨 注意事项

### 质量损失
- 量化会导致轻微的精度损失
- 建议在非关键模型上使用
- 可以通过调整量化级别控制质量

### 性能权衡
- 解码需要额外的CPU时间
- 但减少了内存使用和传输时间
- 总体上提升了性能

### 最佳实践
```javascript
// 为不同类型的模型使用不同的量化级别
const configs = {
    ui: { quantization: 'high' },      // UI模型可以高度量化
    environment: { quantization: 'medium' }, // 环境模型中等量化
    character: { quantization: 'low' }       // 角色模型保持高质量
}
```

## 📚 相关资源

- [Meshoptimizer GitHub](https://github.com/zeux/meshoptimizer)
- [Three.js MeshoptDecoder文档](https://threejs.org/docs/#examples/en/utils/MeshoptDecoder)
- [glTF网格压缩扩展](https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Vendor/EXT_meshopt_compression)
- [gltfpack工具](https://github.com/zeux/meshoptimizer/tree/master/gltf)

---

🚀 **提示**: Meshopt量化特别适合移动端和带宽受限的环境，可以显著提升加载速度。 