<template>
  <div id="css3d-advanced-container">
    <!-- 控制面板 -->
    <div class="control-panel">
      <h3>🎮 CSS3D 高级示例</h3>
      
      <!-- 场景控制 -->
      <div class="control-section">
        <h4>场景控制</h4>
        <div class="control-group">
          <button @click="initScene" class="btn primary">初始化场景</button>
          <button @click="addAllComponents" class="btn success">添加所有组件</button>
          <button @click="startAnimation" class="btn info">开始动画</button>
          <button @click="stopAnimation" class="btn warning">停止动画</button>
        </div>
      </div>

      <!-- 相机控制 -->
      <div class="control-section">
        <h4>相机控制</h4>
        <div class="control-group">
          <label>相机位置 X: <span>{{ cameraPosition.x }}</span></label>
          <input type="range" v-model.number="cameraPosition.x" min="-500" max="500" @input="updateCameraPosition">
        </div>
        <div class="control-group">
          <label>相机位置 Y: <span>{{ cameraPosition.y }}</span></label>
          <input type="range" v-model.number="cameraPosition.y" min="-500" max="500" @input="updateCameraPosition">
        </div>
        <div class="control-group">
          <label>相机位置 Z: <span>{{ cameraPosition.z }}</span></label>
          <input type="range" v-model.number="cameraPosition.z" min="100" max="1000" @input="updateCameraPosition">
        </div>
        <button @click="resetCamera" class="btn secondary">重置相机</button>
      </div>

      <!-- 对象控制 -->
      <div class="control-section">
        <h4>对象控制</h4>
        <div class="control-group">
          <button @click="rotateObjects" class="btn info">旋转对象</button>
          <button @click="scaleObjects" class="btn info">缩放对象</button>
          <button @click="arrangeCircle" class="btn info">圆形排列</button>
          <button @click="arrangeGrid" class="btn info">网格排列</button>
        </div>
      </div>

      <!-- 状态信息 -->
      <div class="status-info">
        <p>场景状态: {{ sceneStatus }}</p>
        <p>对象数量: {{ objectCount }}</p>
        <p>动画状态: {{ animationStatus }}</p>
        <p>FPS: {{ fps }}</p>
      </div>
    </div>

    <!-- 隐藏的Vue组件容器 -->
    <div class="vue-components-container" style="display: none;">
      <Chart3D ref="chartRef" />
      <Card3D ref="cardRef" />
      <Form3D ref="formRef" />
      <Controls3D ref="controlsRef" />
      <Media3D ref="mediaRef" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import Chart3D from '../components/Chart3D.vue'
import Card3D from '../components/Card3D.vue'
import Form3D from '../components/Form3D.vue'
import Controls3D from '../components/Controls3D.vue'
import Media3D from '../components/Media3D.vue'

// 响应式数据
const sceneStatus = ref('未初始化')
const objectCount = ref(0)
const animationStatus = ref('停止')
const fps = ref(0)

// 相机控制
const cameraPosition = ref({
  x: 0,
  y: 0,
  z: 600
})

// 组件引用
const chartRef = ref(null)
const cardRef = ref(null)
const formRef = ref(null)
const controlsRef = ref(null)
const mediaRef = ref(null)

// 核心对象
let css3dPlugin = null
let scene = null
let camera = null
let renderer = null
let controls = null

// 对象管理
let createdObjects = []
let objectData = new Map()

// 动画相关
let animationId = null
let lastTime = 0
let frameCount = 0

/**
 * 初始化Three.js基础场景（包含相机控制）
 */
const initThreeScene = async () => {
  try {
    // 检查THREE是否存在
    if (typeof THREE === 'undefined') {
      throw new Error('THREE.js未正确加载')
    }

    // 创建场景
    scene = new THREE.Scene()
    scene.background = new THREE.Color(0x111122)

    // 创建相机
    camera = new THREE.PerspectiveCamera(
      75, 
      window.innerWidth / window.innerHeight, 
      0.1, 
      2000
    )
    camera.position.set(cameraPosition.value.x, cameraPosition.value.y, cameraPosition.value.z)

    // 创建WebGL渲染器
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setClearColor(0x111122, 1)
    document.body.appendChild(renderer.domElement)

    // 添加轨道控制器
    const { OrbitControls } = await import('three/examples/jsm/controls/OrbitControls.js')
    controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.05

    // 添加光照系统
    const ambientLight = new THREE.AmbientLight(0x404040, 0.4)
    scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(10, 10, 5)
    directionalLight.castShadow = true
    scene.add(directionalLight)

    // 添加辅助网格
    const gridHelper = new THREE.GridHelper(800, 20, 0x444444, 0x222222)
    scene.add(gridHelper)

    console.log('✅ Three.js高级场景初始化完成')
    sceneStatus.value = '场景已创建'
    
  } catch (error) {
    console.error('❌ Three.js场景初始化失败:', error)
    sceneStatus.value = '场景创建失败'
    throw error
  }
}

/**
 * 初始化CSS3D插件
 */
const initCSS3DPlugin = async () => {
  try {
    // 动态导入CSS3D插件
    const { CSS3DRenderPlugin } = await import('../../EngineKernel/src/plugins/webgl/css3DRender')
    
    // 创建插件实例
    const meta = {
      userData: {
        scene: scene,
        camera: camera
      }
    }
    
    css3dPlugin = new CSS3DRenderPlugin(meta)
    await css3dPlugin.init()
    css3dPlugin.setRenderMode('continuous')
    
    console.log('✅ CSS3D插件初始化完成')
    sceneStatus.value = '插件已就绪'
    
  } catch (error) {
    console.error('❌ CSS3D插件初始化失败:', error)
    sceneStatus.value = '插件初始化失败'
    throw error
  }
}

/**
 * 初始化场景（主函数）
 */
const initScene = async () => {
  try {
    sceneStatus.value = '正在初始化...'
    
    // 清理现有场景
    if (css3dPlugin) {
      css3dPlugin.destroyPlugin()
    }
    if (renderer && renderer.domElement.parentNode) {
      renderer.domElement.parentNode.removeChild(renderer.domElement)
    }
    
    // 重新初始化
    await initThreeScene()
    await initCSS3DPlugin()
    
    sceneStatus.value = '场景初始化完成'
    console.log('🎉 高级CSS3D场景初始化成功！')
    
  } catch (error) {
    console.error('❌ 场景初始化失败:', error)
    sceneStatus.value = '初始化失败'
  }
}

/**
 * 添加所有Vue组件
 */
const addAllComponents = async () => {
  if (!css3dPlugin) {
    alert('请先初始化场景！')
    return
  }

  try {
    sceneStatus.value = '正在添加组件...'
    await nextTick()

    // 定义组件配置
    const componentConfigs = [
      {
        id: 'vue-chart-1',
        cloneId: 'chart-3d-clone',
        css3dId: 'vue-chart-3d',
        position: [-300, 150, 0],
        rotation: [0, 0.2, 0],
        scale: 1.2,
        name: '图表组件'
      },
      {
        id: 'vue-card-1',
        cloneId: 'card-3d-clone',
        css3dId: 'vue-card-3d',
        position: [300, 100, -100],
        rotation: [0, -0.3, 0],
        scale: 1.0,
        name: '卡片组件'
      },
      {
        id: 'vue-form-1',
        cloneId: 'form-3d-clone',
        css3dId: 'vue-form-3d',
        position: [0, -150, 50],
        rotation: [0.1, 0, 0],
        scale: 1.1,
        name: '表单组件'
      }
    ]

    // 创建所有组件
    for (const config of componentConfigs) {
      const element = document.getElementById(config.id)
      if (element) {
        const clone = element.cloneNode(true)
        clone.id = config.cloneId
        document.body.appendChild(clone)
        
        const objectId = css3dPlugin.createCSS3DObject({
          element: clone,
          position: config.position,
          rotation: config.rotation,
          scale: config.scale,
          id: config.css3dId,
          complete: () => console.log(`✅ ${config.name}已添加到3D场景`)
        })
        
        createdObjects.push(objectId)
        objectData.set(objectId, {
          ...config,
          originalPosition: [...config.position],
          originalRotation: [...config.rotation],
          originalScale: config.scale
        })
      }
    }

    objectCount.value = createdObjects.length
    sceneStatus.value = `已添加 ${createdObjects.length} 个组件`
    
    console.log('🎉 所有Vue组件已添加完成！')
    
  } catch (error) {
    console.error('❌ 添加组件失败:', error)
    sceneStatus.value = '添加组件失败'
  }
}

/**
 * 更新相机位置
 */
const updateCameraPosition = () => {
  if (camera) {
    camera.position.set(
      cameraPosition.value.x,
      cameraPosition.value.y,
      cameraPosition.value.z
    )
    css3dPlugin?.markNeedsRender?.()
  }
}

/**
 * 重置相机
 */
const resetCamera = () => {
  cameraPosition.value = { x: 0, y: 0, z: 600 }
  updateCameraPosition()
  if (controls) {
    controls.reset()
  }
}

/**
 * 旋转对象动画
 */
const rotateObjects = () => {
  createdObjects.forEach((id, index) => {
    const data = objectData.get(id)
    if (data) {
      const newRotation = [
        data.originalRotation[0] + Math.sin(Date.now() * 0.001 + index) * 0.5,
        data.originalRotation[1] + Math.cos(Date.now() * 0.001 + index) * 0.5,
        data.originalRotation[2]
      ]
      
      // 这里需要直接访问CSS3D对象来更新旋转
      // 由于插件封装，我们可以通过重新创建来实现
      console.log(`🔄 旋转对象 ${id}`)
    }
  })
}

/**
 * 缩放对象动画
 */
const scaleObjects = () => {
  createdObjects.forEach((id, index) => {
    const data = objectData.get(id)
    if (data) {
      const scaleMultiplier = 1 + Math.sin(Date.now() * 0.002 + index) * 0.3
      console.log(`📏 缩放对象 ${id}, 缩放系数: ${scaleMultiplier}`)
    }
  })
}

/**
 * 圆形排列
 */
const arrangeCircle = () => {
  const radius = 250
  const angleStep = (Math.PI * 2) / createdObjects.length
  
  createdObjects.forEach((id, index) => {
    const angle = index * angleStep
    const x = Math.cos(angle) * radius
    const z = Math.sin(angle) * radius
    
    console.log(`🔄 圆形排列对象 ${id} 到位置 (${x.toFixed(1)}, 0, ${z.toFixed(1)})`)
  })
}

/**
 * 网格排列
 */
const arrangeGrid = () => {
  const spacing = 200
  const cols = Math.ceil(Math.sqrt(createdObjects.length))
  
  createdObjects.forEach((id, index) => {
    const row = Math.floor(index / cols)
    const col = index % cols
    const x = (col - cols / 2) * spacing
    const z = (row - cols / 2) * spacing
    
    console.log(`📋 网格排列对象 ${id} 到位置 (${x.toFixed(1)}, 0, ${z.toFixed(1)})`)
  })
}

/**
 * 开始动画循环
 */
const startAnimation = () => {
  if (animationId) return
  
  animationStatus.value = '运行中'
  
  const animate = (currentTime) => {
    animationId = requestAnimationFrame(animate)
    
    // 计算FPS
    frameCount++
    if (currentTime - lastTime >= 1000) {
      fps.value = Math.round((frameCount * 1000) / (currentTime - lastTime))
      frameCount = 0
      lastTime = currentTime
    }
    
    // 更新控制器
    if (controls) {
      controls.update()
    }
    
    // 渲染场景
    if (renderer && scene && camera) {
      renderer.render(scene, camera)
    }
  }
  
  animate(performance.now())
  console.log('🎬 动画循环已开始')
}

/**
 * 停止动画循环
 */
const stopAnimation = () => {
  if (animationId) {
    cancelAnimationFrame(animationId)
    animationId = null
    animationStatus.value = '停止'
    fps.value = 0
    console.log('⏹️ 动画循环已停止')
  }
}

/**
 * 清理所有资源
 */
const cleanup = () => {
  stopAnimation()
  
  if (css3dPlugin) {
    css3dPlugin.destroyPlugin()
  }
  
  if (renderer && renderer.domElement.parentNode) {
    renderer.domElement.parentNode.removeChild(renderer.domElement)
  }
  
  // 清理克隆的DOM元素
  ['chart-3d-clone', 'card-3d-clone', 'form-3d-clone'].forEach(id => {
    const element = document.getElementById(id)
    if (element) element.remove()
  })
  
  createdObjects = []
  objectData.clear()
  objectCount.value = 0
  
  console.log('🗑️ 所有资源已清理')
}

// 生命周期
onMounted(() => {
  console.log('🚀 CSS3D高级示例页面已挂载')
  
  // 自动初始化场景
  setTimeout(initScene, 1000)
})

onUnmounted(() => {
  cleanup()
  console.log('👋 CSS3D高级示例页面已卸载')
})
</script>

<style scoped>
#css3d-advanced-container {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: #111122;
}

/* 控制面板样式 */
.control-panel {
  position: fixed;
  top: 20px;
  right: 20px;
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid #ddd;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  z-index: 1000;
  min-width: 320px;
  max-height: 90vh;
  overflow-y: auto;
}

.control-panel h3 {
  margin: 0 0 20px 0;
  color: #333;
  font-size: 18px;
  text-align: center;
}

.control-section {
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #eee;
}

.control-section:last-of-type {
  border-bottom: none;
}

.control-section h4 {
  margin: 0 0 12px 0;
  color: #555;
  font-size: 14px;
  font-weight: 600;
}

.control-group {
  margin-bottom: 10px;
}

.control-group label {
  display: block;
  margin-bottom: 6px;
  font-weight: 500;
  color: #666;
  font-size: 12px;
}

.control-group input[type="range"] {
  width: 100%;
  margin-bottom: 8px;
}

/* 按钮样式 */
.btn {
  padding: 6px 12px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 11px;
  margin-right: 6px;
  margin-bottom: 6px;
  transition: all 0.2s;
  font-weight: 500;
}

.btn.primary { background: #007bff; color: white; }
.btn.primary:hover { background: #0056b3; }

.btn.success { background: #28a745; color: white; }
.btn.success:hover { background: #218838; }

.btn.info { background: #17a2b8; color: white; }
.btn.info:hover { background: #138496; }

.btn.warning { background: #ffc107; color: #212529; }
.btn.warning:hover { background: #e0a800; }

.btn.secondary { background: #6c757d; color: white; }
.btn.secondary:hover { background: #5a6268; }

/* 状态信息样式 */
.status-info {
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  padding: 12px;
  border-radius: 8px;
  margin-top: 16px;
  border: 1px solid #dee2e6;
}

.status-info p {
  margin: 4px 0;
  font-size: 11px;
  color: #495057;
  font-weight: 500;
}

/* Vue组件容器 */
.vue-components-container {
  position: absolute;
  top: -9999px;
  left: -9999px;
  visibility: hidden;
}

/* 滚动条样式 */
.control-panel::-webkit-scrollbar {
  width: 6px;
}

.control-panel::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.control-panel::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.control-panel::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style> 