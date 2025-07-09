<template>
    <div class="force-graph-container">
        <div ref="containerRef" class="graph-canvas"></div>
    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import { THREE, OrbitControls } from '../main'
import graphConfig from '../config/graph-config-galaxy.json'
// import graphConfig from '../config/graph-config.json'

// 配置解析器
class ConfigParser {
    constructor(config) {
        this.config = config
    }

    // 解析颜色值
    parseColor(colorStr) {
        return parseInt(colorStr.replace('0x', ''), 16)
    }

    // 获取动画函数值
    getAnimationValue(animConfig, time, index = 0) {
        const { base, function: func, speed, amplitude, indexOffset = 0 } = animConfig
        let value = base
        
        switch (func) {
            case 'sin':
                value += Math.sin(time * speed + index * indexOffset) * amplitude
                break
            case 'cos':
                value += Math.cos(time * speed + index * indexOffset) * amplitude
                break
        }
        
        return value
    }

    // 获取动画位置
    getAnimationPosition(animConfig, time, basePosition) {
        const result = [...basePosition]
        
        Object.keys(animConfig).forEach(axis => {
            const axisConfig = animConfig[axis]
            const axisIndex = axis === 'x' ? 0 : axis === 'y' ? 1 : 2
            
            let value = result[axisIndex]
            const offset = axisConfig.offset || 0
            
            switch (axisConfig.function) {
                case 'sin':
                    value = Math.sin(time * axisConfig.speed) * axisConfig.amplitude + offset
                    break
                case 'cos':
                    value = Math.cos(time * axisConfig.speed) * axisConfig.amplitude + offset
                    break
            }
            
            result[axisIndex] = value
        })
        
        return result
    }
}

// 响应式数据
const containerRef = ref(null)
const configParser = new ConfigParser(graphConfig)

// 从配置文件初始化响应式数据
const nodeCount = ref(graphConfig.nodes.defaultCount) // 节点数量
const repulsionStrength = ref(graphConfig.physics.repulsionStrength) // 斥力强度
const attractionStrength = ref(graphConfig.physics.attractionStrength) // 引力强度
const animationRunning = ref(true) // 动画运行状态
const lightIntensity = ref(graphConfig.lighting.intensity) // 光照强度
const currentNodeCount = ref(0) // 当前节点数量（响应式）
const autoAddNodes = ref(false) // 自动添加节点开关

// Three.js 变量
let scene, camera, renderer, controls
let ambientLight, directionalLight, fillLight, topLight
let nodes = []
let links = []
let nodeObjects = []
let linkObjects = []
let animationId = null
let autoAddTimer = null

// 光源变量
let pointLights = []
let clock = new THREE.Clock()

// 力引导算法参数 - 从配置文件读取
const damping = graphConfig.physics.damping
const timeStep = graphConfig.physics.timeStep
const centerForce = graphConfig.physics.centerForce

// 鼠标交互
let raycaster = new THREE.Raycaster()
let mouse = new THREE.Vector2()
let selectedNode = null
let isDragging = false

// 节点类
class Node {
    constructor(id, x = 0, y = 0, z = 0) {
        this.id = id
        this.position = new THREE.Vector3(x, y, z)
        this.velocity = new THREE.Vector3(0, 0, 0) // 速度
        this.force = new THREE.Vector3(0, 0, 0) // 力
        this.mass = 1 // 质量
        this.radius = 0.5 // 半径
        this.color = new THREE.Color().setHSL(Math.random(), 0.7, 0.6) // 颜色
        this.fixed = false // 是否固定
        
        // 动画相关属性
        this.targetPosition = null // 目标位置
        this.initialPosition = null // 初始位置
        this.isAnimating = false // 是否动画
        this.animationProgress = 0 // 动画进度
        this.initialScale = 0 // 初始缩放
    }

    // 应用力
    applyForce(force) {
        this.force.add(force)
    }

    // 更新位置
    update() {
        if (this.fixed) return
        
        // 应用力到速度
        this.velocity.add(this.force.clone().multiplyScalar(timeStep / this.mass))
        
        // 应用阻尼
        this.velocity.multiplyScalar(damping)
        
        // 更新位置
        this.position.add(this.velocity.clone().multiplyScalar(timeStep))
        
        // 重置力
        this.force.set(0, 0, 0)
    }
}

// 连接类
class Link {
    constructor(source, target, length = 2) {
        this.source = source
        this.target = target
        this.length = length
        this.strength = 0.5
    }
}

// 初始化 Three.js 场景
const initScene = () => {
    // 创建场景
    scene = new THREE.Scene()
    scene.background = new THREE.Color(configParser.parseColor(graphConfig.scene.background))

    // 创建相机
    const cameraConfig = graphConfig.scene.camera
    camera = new THREE.PerspectiveCamera(cameraConfig.fov, window.innerWidth / window.innerHeight, cameraConfig.near, cameraConfig.far)
    camera.position.set(...cameraConfig.position)

    // 创建渲染器
    const rendererConfig = graphConfig.renderer
    renderer = new THREE.WebGLRenderer({ antialias: rendererConfig.antialias })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.shadowMap.enabled = rendererConfig.shadowMap.enabled
    renderer.shadowMap.type = THREE[rendererConfig.shadowMap.type]
    containerRef.value.appendChild(renderer.domElement)

    // 根据配置创建轨道控制器
    controls = new OrbitControls(camera, renderer.domElement)
    const controlsConfig = graphConfig.cameraControls
    
    controls.enableDamping = controlsConfig.enableDamping
    controls.dampingFactor = controlsConfig.dampingFactor
    controls.autoRotate = controlsConfig.autoRotate
    controls.autoRotateSpeed = controlsConfig.autoRotateSpeed
    controls.enableZoom = controlsConfig.enableZoom
    controls.enablePan = controlsConfig.enablePan
    controls.minDistance = controlsConfig.minDistance
    controls.maxDistance = controlsConfig.maxDistance
    controls.minPolarAngle = controlsConfig.minPolarAngle
    controls.maxPolarAngle = controlsConfig.maxPolarAngle

    // 根据配置创建光源系统
    const lightConfig = graphConfig.lighting
    
    // 环境光
    ambientLight = new THREE.AmbientLight(
        configParser.parseColor(lightConfig.ambient.color),
        lightConfig.ambient.intensity * lightIntensity.value
    )
    scene.add(ambientLight)

    // 主方向光
    directionalLight = new THREE.DirectionalLight(
        configParser.parseColor(lightConfig.directional.color),
        lightConfig.directional.intensity * lightIntensity.value
    )
    directionalLight.position.set(...lightConfig.directional.position)
    directionalLight.castShadow = lightConfig.directional.castShadow
    directionalLight.shadow.mapSize.width = 2048
    directionalLight.shadow.mapSize.height = 2048
    scene.add(directionalLight)

    // 动态点光源
    pointLights = []
    lightConfig.pointLights.forEach(lightData => {
        const pointLight = new THREE.PointLight(
            configParser.parseColor(lightData.color),
            lightData.intensity * lightIntensity.value,
            lightData.distance
        )
        pointLight.position.set(...lightData.position)
        pointLight.userData = { 
            config: lightData,
            basePosition: [...lightData.position],
            baseColor: configParser.parseColor(lightData.color)
        }
        scene.add(pointLight)
        pointLights.push(pointLight)
    })

    // 补充光源
    fillLight = new THREE.DirectionalLight(
        configParser.parseColor(lightConfig.fillLight.color),
        lightConfig.fillLight.intensity * lightIntensity.value
    )
    fillLight.position.set(...lightConfig.fillLight.position)
    scene.add(fillLight)

    // 顶部光源
    topLight = new THREE.DirectionalLight(
        configParser.parseColor(lightConfig.topLight.color),
        lightConfig.topLight.intensity * lightIntensity.value
    )
    topLight.position.set(...lightConfig.topLight.position)
    scene.add(topLight)

    // 添加鼠标事件监听
    renderer.domElement.addEventListener('mousedown', onMouseDown)
    renderer.domElement.addEventListener('mousemove', onMouseMove)
    renderer.domElement.addEventListener('mouseup', onMouseUp)
    window.addEventListener('resize', onWindowResize)
}

// 计算节点位置的共用函数
const calculateNodePosition = (index, totalNodes, level2Count, level = null) => {
    let x, y, z
    
    // 确定节点层级
    if (level === null) {
        if (index === 0) {
            level = 1
        } else if (index <= level2Count) {
            level = 2
        } else {
            level = 3
        }
    }
    
    const nodeConfig = graphConfig.nodes.levels[level]
    
    if (level === 1) {
        // 根节点位于中心
        const pos = nodeConfig.position
        x = pos.coordinates[0]
        y = pos.coordinates[1]
        z = pos.coordinates[2]
    } else if (level === 2) {
        // 第二级节点围绕根节点分布
        const pos = nodeConfig.position
        const angle = (index - 1) * (Math.PI * 2 / level2Count)
        x = Math.cos(angle) * pos.radius
        y = Math.sin(angle) * pos.radius
        z = (Math.random() - 0.5) * pos.zVariation
    } else {
        // 第三级节点围绕对应的第二级节点分布
        const parentIndex = ((index - level2Count - 1) % level2Count) + 1
        const parentAngle = (parentIndex - 1) * (Math.PI * 2 / level2Count)
        const parentRadius = graphConfig.nodes.levels[2].position.radius
        const parentX = Math.cos(parentAngle) * parentRadius
        const parentY = Math.sin(parentAngle) * parentRadius
        
        const pos = nodeConfig.position
        const subAngle = Math.random() * Math.PI * 2
        const subRadius = pos.radiusMin + Math.random() * (pos.radiusMax - pos.radiusMin)
        x = parentX + Math.cos(subAngle) * subRadius
        y = parentY + Math.sin(subAngle) * subRadius
        z = (Math.random() - 0.5) * pos.zVariation
    }
    
    return { x, y, z }
}

// 生成图数据
const generateGraphData = () => {
    nodes = []
    links = []

    // 层级网络参数
    const totalNodes = nodeCount.value
    const level2Count = Math.min(graphConfig.nodes.levels[2].position.maxCount, Math.floor(totalNodes * 0.3))

    // 创建节点 - 层级网络
    for (let i = 0; i < nodeCount.value; i++) {
        let nodeLevel
        if (i === 0) {
            nodeLevel = 1
        } else if (i <= level2Count) {
            nodeLevel = 2
        } else {
            nodeLevel = 3
        }
        
        const position = calculateNodePosition(i, totalNodes, level2Count, nodeLevel)
        const node = new Node(i, position.x, position.y, position.z)
        
        // 根据配置设置节点属性
        const nodeConfig = graphConfig.nodes.levels[nodeLevel]
        node.radius = nodeConfig.radius
        node.level = nodeLevel
        
        // 设置颜色变化
        const colorVariation = nodeConfig.colorVariation.min + 
                              Math.random() * (nodeConfig.colorVariation.max - nodeConfig.colorVariation.min)
        node.color = new THREE.Color(configParser.parseColor(nodeConfig.color)).multiplyScalar(colorVariation)
        
        nodes.push(node)
    }

    // 创建连接 - 层级网络
    // 第一级（根节点）连接到所有第二级节点
    for (let i = 1; i <= level2Count; i++) {
        const connectionType = graphConfig.connections.types['root-main']
        links.push(new Link(nodes[0], nodes[i], connectionType.length))
    }
    
    // 第二级节点连接到第三级节点
    const level2Nodes = nodes.slice(1, level2Count + 1)
    const level3Nodes = nodes.slice(level2Count + 1)
    
    // 将第三级节点分配给第二级节点
    level3Nodes.forEach((level3Node, index) => {
        const parentIndex = index % level2Nodes.length
        const parentNode = level2Nodes[parentIndex]
        const connectionType = graphConfig.connections.types['main-sub']
        links.push(new Link(parentNode, level3Node, connectionType.length))
    })
    
    // 更新响应式节点计数
    currentNodeCount.value = nodes.length
}

// 创建单个节点的3D对象
const createNodeObject = (node) => {
    // 创建球体
    const geometry = new THREE.SphereGeometry(node.radius, 20, 20)
    
    // 根据配置使用不同的材质效果
    const nodeConfig = graphConfig.nodes.levels[node.level]
    const materialConfig = nodeConfig.material
    
    const material = new THREE.MeshStandardMaterial({ 
        color: node.color,
        emissive: new THREE.Color(configParser.parseColor(materialConfig.emissiveColor))
                    .multiplyScalar(materialConfig.emissiveIntensity),
        roughness: materialConfig.roughness,
        metalness: materialConfig.metalness,
        envMapIntensity: materialConfig.envMapIntensity
    })
    
    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.copy(node.position)
    mesh.castShadow = true
    mesh.receiveShadow = true
    mesh.userData = { node: node }
    
    // 如果是动画节点，设置初始缩放
    if (node.isAnimating) {
        const animConfig = graphConfig.animation.newNodeAnimation
        mesh.scale.set(animConfig.initialScale, animConfig.initialScale, animConfig.initialScale)
    }
    
    // 将球体添加到场景中
    scene.add(mesh)
    
    // 存储到数组中
    nodeObjects.push(mesh)
    
    return mesh
}

// 创建单个连接的3D对象
const createLinkObject = (link) => {
    const geometry = new THREE.BufferGeometry()
    const positions = new Float32Array(6)
    
    positions[0] = link.source.position.x
    positions[1] = link.source.position.y
    positions[2] = link.source.position.z
    positions[3] = link.target.position.x
    positions[4] = link.target.position.y
    positions[5] = link.target.position.z
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    
    // 根据连接配置使用不同颜色和效果
    let connectionConfig
    if (link.source.level === 1 || link.target.level === 1) {
        connectionConfig = graphConfig.connections.types['root-main']
    } else if (link.source.level === 2 || link.target.level === 2) {
        connectionConfig = graphConfig.connections.types['main-sub']
    } else {
        connectionConfig = graphConfig.connections.types['sub-sub']
    }
    
    const material = new THREE.LineBasicMaterial({ 
        color: configParser.parseColor(connectionConfig.color), 
        transparent: true, 
        opacity: connectionConfig.opacity
    })
    const line = new THREE.Line(geometry, material)
    line.userData = { connectionConfig: connectionConfig }
    scene.add(line)
    linkObjects.push(line)
    
    return line
}

// 创建3D对象
const createObjects = () => {
    // 清除现有对象
    nodeObjects.forEach(obj => scene.remove(obj))
    linkObjects.forEach(obj => scene.remove(obj))
    nodeObjects = []
    linkObjects = []

    // 创建节点对象
    nodes.forEach(node => {
        createNodeObject(node)
    })

    // 创建连接对象
    links.forEach(link => {
        createLinkObject(link)
    })
}

// 力引导算法
const applyForces = () => {
    // 重置所有节点的力
    nodes.forEach(node => {
        node.force.set(0, 0, 0)
    })

    // 计算斥力
    for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
            const nodeA = nodes[i]
            const nodeB = nodes[j]
            
            const distance = nodeA.position.distanceTo(nodeB.position)
            if (distance > 0) {
                const direction = nodeA.position.clone().sub(nodeB.position).normalize()
                const force = direction.multiplyScalar(repulsionStrength.value / (distance * distance))
                
                nodeA.applyForce(force)
                nodeB.applyForce(force.clone().negate())
            }
        }
    }

    // 计算引力（连接力）
    links.forEach(link => {
        const distance = link.source.position.distanceTo(link.target.position)
        const displacement = distance - link.length
        
        if (distance > 0) {
            const direction = link.target.position.clone().sub(link.source.position).normalize()
            const force = direction.multiplyScalar(displacement * attractionStrength.value * link.strength)
            
            link.source.applyForce(force)
            link.target.applyForce(force.clone().negate())
        }
    })

    // 添加中心力，防止节点飘得太远
    nodes.forEach(node => {
        const centerForceVector = node.position.clone().negate().multiplyScalar(centerForce)
        node.applyForce(centerForceVector)
    })
}

// 更新物理模拟
const updatePhysics = () => {
    if (!animationRunning.value) return

    applyForces()
    
    // 更新节点位置
    nodes.forEach(node => {
        if (node.isAnimating) {
            // 处理新增节点的动画
            const animConfig = graphConfig.animation.newNodeAnimation
            node.animationProgress += animConfig.speed
            
            if (node.animationProgress >= 1) {
                // 动画完成
                node.position.copy(node.targetPosition)
                node.isAnimating = false
                node.animationProgress = 1
            } else {
                // 缓动动画（使用easeOutCubic）
                const easeOut = 1 - Math.pow(1 - node.animationProgress, 3)
                
                // 存储初始位置（如果还没有存储）
                if (!node.initialPosition) {
                    node.initialPosition = node.position.clone()
                }
                
                // 在初始位置和目标位置之间进行插值
                node.position.lerpVectors(node.initialPosition, node.targetPosition, easeOut)
            }
        } else {
            node.update()
        }
    })

    // 更新球体位置
    nodeObjects.forEach((mesh, index) => {
        const node = nodes[index]
        if (node && mesh) {
            // 更新球体位置
            mesh.position.copy(node.position)
            
            // 处理球体缩放动画
            if (node.isAnimating) {
                const scale = 0.1 + (node.animationProgress * 0.9) // 从0.1缩放到1.0
                mesh.scale.set(scale, scale, scale)
            } else if (mesh.scale.x < 1) {
                // 确保动画完成后缩放为1
                mesh.scale.set(1, 1, 1)
            }
        }
    })

    // 更新连接线
    linkObjects.forEach((line, index) => {
        const link = links[index]
        if (link) {
            const positions = line.geometry.attributes.position
            
            // 使用节点的实际位置更新连接线
            positions.setXYZ(0, link.source.position.x, link.source.position.y, link.source.position.z)
            positions.setXYZ(1, link.target.position.x, link.target.position.y, link.target.position.z)
            
            positions.needsUpdate = true
        }
    })
}

// 渲染循环
const animate = () => {
    animationId = requestAnimationFrame(animate)
    
    const elapsedTime = clock.getElapsedTime()
    
    // 更新物理模拟
    updatePhysics()
    
    // 动态光源效果
    pointLights.forEach(light => {
        const lightConfig = light.userData.config
        const animConfig = lightConfig.animation
        
        // 更新位置
        if (animConfig.movement) {
            const newPosition = configParser.getAnimationPosition(
                animConfig.movement, 
                elapsedTime, 
                light.userData.basePosition
            )
            light.position.set(...newPosition)
        }
        
        // 更新强度
        if (animConfig.intensity) {
            light.intensity = configParser.getAnimationValue(
                animConfig.intensity, 
                elapsedTime
            ) * lightIntensity.value
        }
        
        // 更新颜色变化
        if (animConfig.colorVariation) {
            const colorIntensity = configParser.getAnimationValue(
                animConfig.colorVariation, 
                elapsedTime
            )
            light.color.setHex(light.userData.baseColor).multiplyScalar(colorIntensity)
        }
    })
    

    
    // 节点材质动态效果
    nodeObjects.forEach((mesh, index) => {
        const node = nodes[index]
        if (node && mesh) {
            const nodeConfig = graphConfig.nodes.levels[node.level]
            const animConfig = nodeConfig.animation?.emissiveVariation
            
            if (animConfig) {
                const emissiveIntensity = configParser.getAnimationValue(
                    animConfig, 
                    elapsedTime, 
                    index
                )
                mesh.material.emissive = new THREE.Color(
                    configParser.parseColor(nodeConfig.material.emissiveColor)
                ).multiplyScalar(emissiveIntensity)
            }
        }
    })
    
    // 连接线闪烁效果
    linkObjects.forEach((line, index) => {
        const connectionConfig = line.userData.connectionConfig
        if (connectionConfig && connectionConfig.animation?.opacityVariation) {
            const animConfig = connectionConfig.animation.opacityVariation
            const opacity = configParser.getAnimationValue(
                animConfig, 
                elapsedTime, 
                index
            )
            line.material.opacity = opacity
        }
    })
    
    controls.update()
    
    // 强制更新所有对象的变换矩阵
    scene.updateMatrixWorld(true)
    
    // 普通渲染
    renderer.render(scene, camera)
}

// 鼠标事件处理
const onMouseDown = (event) => {
    const rect = renderer.domElement.getBoundingClientRect()
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
    
    raycaster.setFromCamera(mouse, camera)
    const intersects = raycaster.intersectObjects(nodeObjects)
    
    if (intersects.length > 0) {
        selectedNode = intersects[0].object.userData.node
        selectedNode.fixed = true
        isDragging = true
        controls.enabled = false
    }
}

const onMouseMove = (event) => {
    if (isDragging && selectedNode) {
        const rect = renderer.domElement.getBoundingClientRect()
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
        
        raycaster.setFromCamera(mouse, camera)
        
        // 简化的拖拽实现：在相机平面上移动
        const distance = camera.position.distanceTo(selectedNode.position)
        const vector = new THREE.Vector3(mouse.x, mouse.y, 0.5)
        vector.unproject(camera)
        
        const direction = vector.sub(camera.position).normalize()
        selectedNode.position.copy(camera.position.clone().add(direction.multiplyScalar(distance)))
        selectedNode.velocity.set(0, 0, 0)
    }
}

const onMouseUp = () => {
    if (selectedNode) {
        selectedNode.fixed = false
        selectedNode = null
        // selectedGroup = null // Removed as per edit hint
    }
    isDragging = false
    controls.enabled = true
}

// 窗口大小调整
const onWindowResize = () => {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
}

// 重新生成图
const regenerateGraph = () => {
    generateGraphData()
    createObjects()
}

// 重置位置
const resetPositions = () => {
    const totalNodes = nodeCount.value
    const level2Count = Math.min(5, Math.floor(totalNodes * 0.3))
    
    nodes.forEach((node, i) => {
        const position = calculateNodePosition(i, totalNodes, level2Count)
        node.position.set(position.x, position.y, position.z)
        node.velocity.set(0, 0, 0)
        node.force.set(0, 0, 0)
    })
}



// 切换自动添加节点
const toggleAutoAddNodes = () => {
    if (autoAddNodes.value) {
        // 开启自动添加
        const autoAddConfig = graphConfig.controls.autoAddNodes
        autoAddTimer = setInterval(() => {
            if (currentNodeCount.value < autoAddConfig.maxNodes) { // 限制最大节点数
                addRandomNode()
            } else {
                // 达到最大节点数，自动关闭
                autoAddNodes.value = false
                clearInterval(autoAddTimer)
                autoAddTimer = null
            }
        }, autoAddConfig.interval)
    } else {
        // 关闭自动添加
        if (autoAddTimer) {
            clearInterval(autoAddTimer)
            autoAddTimer = null
        }
    }
}

// 添加随机节点
const addRandomNode = () => {
    const newNodeId = nodes.length
    const totalNodes = nodes.length
    const level2Count = Math.min(5, Math.floor(totalNodes * 0.3))
    
    // 智能决定新节点的层级
    let newLevel, parentNode = null
    
    if (nodes.length === 0) {
        // 如果没有节点，创建根节点
        newLevel = 1
    } else if (nodes.filter(n => n.level === 2).length < 5) {
        // 如果第二级节点少于5个，添加第二级节点
        newLevel = 2
        parentNode = nodes[0] // 连接到根节点
    } else {
        // 否则添加第三级节点
        newLevel = 3
        const level2Nodes = nodes.filter(n => n.level === 2)
        parentNode = level2Nodes[Math.floor(Math.random() * level2Nodes.length)]
    }
    
    // 计算新节点的目标位置
    let targetPosition
    if (newLevel === 1) {
        targetPosition = { x: 0, y: 0, z: 0 }
    } else if (newLevel === 2) {
        const level2Nodes = nodes.filter(n => n.level === 2)
        const angle = level2Nodes.length * (Math.PI * 2 / 5)
        targetPosition = {
            x: Math.cos(angle) * 5,
            y: Math.sin(angle) * 5,
            z: (Math.random() - 0.5) * 2
        }
    } else {
        // 第三级节点围绕选定的父节点
        const subAngle = Math.random() * Math.PI * 2
        const subRadius = 2 + Math.random() * 1.5
        targetPosition = {
            x: parentNode.position.x + Math.cos(subAngle) * subRadius,
            y: parentNode.position.y + Math.sin(subAngle) * subRadius,
            z: parentNode.position.z + (Math.random() - 0.5) * 3
        }
    }
    
    // 创建新节点，初始位置设为随机位置（用于动画效果）
    const spawnConfig = graphConfig.animation.spawnPosition
    const range = spawnConfig.range
    const randomStartPos = {
        x: (Math.random() - 0.5) * range,
        y: (Math.random() - 0.5) * range,
        z: (Math.random() - 0.5) * range
    }
    
    const newNode = new Node(newNodeId, randomStartPos.x, randomStartPos.y, randomStartPos.z)
    
    // 根据配置设置节点属性
    const nodeConfig = graphConfig.nodes.levels[newLevel]
    newNode.radius = nodeConfig.radius
    newNode.level = newLevel
    
    // 设置颜色变化
    const colorVariation = nodeConfig.colorVariation.min + 
                          Math.random() * (nodeConfig.colorVariation.max - nodeConfig.colorVariation.min)
    newNode.color = new THREE.Color(configParser.parseColor(nodeConfig.color)).multiplyScalar(colorVariation)
    
    // 存储目标位置和初始位置用于动画
    newNode.targetPosition = new THREE.Vector3(targetPosition.x, targetPosition.y, targetPosition.z)
    newNode.initialPosition = new THREE.Vector3(randomStartPos.x, randomStartPos.y, randomStartPos.z)
    newNode.isAnimating = true
    newNode.animationProgress = 0
    
    nodes.push(newNode)
    
    // 创建连接
    if (parentNode) {
        const newLink = new Link(parentNode, newNode, newLevel === 2 ? 3 : 2)
        links.push(newLink)
    }
    
    // 创建新节点的3D对象
    createNodeObject(newNode)
    
    // 创建新连接的3D对象
    if (parentNode) {
        createLinkObject(links[links.length - 1])
    }
    
    // 更新响应式节点计数
    currentNodeCount.value = nodes.length
}

// 生命周期钩子
onMounted(() => {
    // 确保DOM完全渲染后再初始化场景
    setTimeout(() => {
        initScene()
        generateGraphData()
        createObjects() 
        animate()
        // 设置初始节点数量
        currentNodeCount.value = nodes.length
    }, 100)
})

onUnmounted(() => {
    if (animationId) {
        cancelAnimationFrame(animationId)
    }
    if (autoAddTimer) {
        clearInterval(autoAddTimer)
        autoAddTimer = null
    }
    window.removeEventListener('resize', onWindowResize)
})


</script>

<style scoped>
.force-graph-container {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    overflow: hidden;
    margin: 0;
    padding: 0;
}

.graph-canvas {
    width: 100%;
    height: 100%;
    display: block;
}

.graph-canvas canvas {
    display: block;
    width: 100%;
    height: 100%;
    margin: 0;
    padding: 0;
}
</style>

<!-- 
力引导关系图 - 培训人员评估系统
- 三级层级结构：参训人员 → 类别 → 具体项目
- 支持拖拽交互和物理模拟
-->