<template>
    <div class="force-graph-container">
        <div ref="containerRef" class="graph-canvas"></div>
    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import { THREE, OrbitControls, CSS3DRenderer, CSS3DObject } from '../main'
// import graphConfig from '../config/graph-config-galaxy.json'
import graphConfig from '../config/graph-config.json'

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

// 从配置文件中读取数据
const traineeName = graphConfig.labels.trainee.name
const firstLevelDefs = graphConfig.labels.secondLevel
const behaviorList = graphConfig.labels.secondLevel.find(item => item.id === 'behavior')?.items || []
const factorList = graphConfig.labels.secondLevel.find(item => item.id === 'factor')?.items || []
const taskList = graphConfig.labels.secondLevel.find(item => item.id === 'task')?.items || []

// 动态节点管理配置（从配置文件读取）
// 此功能实现了第三级子节点的动态增删，模拟实时数据变化
const dynamicNodeConfig = graphConfig.controls.dynamicNodes || {
    interval: 3000, // 每3秒执行一次动态操作
    minNodes: 3, // 每个二级节点最少子节点数
    maxNodes: 8, // 每个二级节点最多子节点数
    initialNodes: 4 // 初始子节点数量
}

// 跟踪每个二级节点已使用的文字索引
const usedIndices = {
    behavior: new Set(),
    factor: new Set(),
    task: new Set()
}

// 从配置文件初始化响应式数据
const repulsionStrength = ref(graphConfig.physics.repulsionStrength) // 斥力强度
const attractionStrength = ref(graphConfig.physics.attractionStrength) // 引力强度
const animationRunning = ref(true) // 动画运行状态
const lightIntensity = ref(graphConfig.lighting.intensity) // 光照强度
const currentNodeCount = ref(0) // 当前节点数量（响应式）
const dynamicNodeEnabled = ref(graphConfig.controls.dynamicNodes?.enabled || true) // 动态节点功能开关
const adaptiveSizeEnabled = ref(graphConfig.controls.adaptiveSize?.enabled || true) // 自适应大小功能开关

// Three.js 变量
let scene, camera, renderer, controls
let ambientLight, directionalLight, fillLight, topLight
let nodes = []
let links = []
let nodeObjects = []
let linkObjects = []
let animationId = null
let dynamicNodeTimer = null // 动态节点定时器

// CSS3D 变量
let css3dRenderer
let nodeLabels = []

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

// CSS3D标签优化变量
let lastCameraPosition = new THREE.Vector3()
let labelUpdateCounter = 0
const labelUpdateInterval = 2 // 每2帧更新一次标签（优化性能）

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
        this.name = '' // 节点名称
        this.nodeType = '' // 节点类型

        // 动画相关属性
        this.targetPosition = null // 目标位置
        this.initialPosition = null // 初始位置
        this.isAnimating = false // 是否动画
        this.animationProgress = 0 // 动画进度
        this.initialScale = 0 // 初始缩放

        // 文字和球体大小相关属性
        this.fontSize = 12 // 字体大小
        this.calculatedRadius = 0.5 // 根据文字计算的半径
    }

    // 根据文字长度计算球体大小，根据层级设置文字大小
    calculateSizeFromText(text, level) {
        const baseConfig = graphConfig.nodes.levels[level]

        // 如果自适应大小功能未开启，使用默认值
        if (!adaptiveSizeEnabled.value) {
            this.radius = baseConfig.radius
            this.calculatedRadius = baseConfig.radius
            this.fontSize = 12
            return {
                radius: this.radius,
                fontSize: this.fontSize
            }
        }

        // 文字长度影响因子（中文字符按2个字符计算）
        const chineseCharCount = (text.match(/[\u4e00-\u9fa5]/g) || []).length
        const englishCharCount = text.length - chineseCharCount
        const effectiveLength = chineseCharCount * 2 + englishCharCount

        // 根据文字长度计算球体半径（从配置文件读取范围）
        const adaptiveConfig = graphConfig.controls.adaptiveSize || {}
        const radiusRange = adaptiveConfig.radiusRange || { min: 0.8, max: 1.6 }
        const textLengthRange = adaptiveConfig.textLengthRange || { min: 2, max: 16 }

        const minRadius = baseConfig.radius * radiusRange.min
        const maxRadius = baseConfig.radius * radiusRange.max

        // 根据有效长度计算半径
        const normalizedLength = Math.max(textLengthRange.min, Math.min(textLengthRange.max, effectiveLength))
        const lengthFactor = (normalizedLength - textLengthRange.min) / (textLengthRange.max - textLengthRange.min)
        this.calculatedRadius = minRadius + (maxRadius - minRadius) * lengthFactor

        // 根据节点层级从配置文件中读取文字大小
        this.fontSize = baseConfig.fontSize || 12 // 如果配置文件中没有fontSize，使用默认值12

        // 更新节点半径
        this.radius = this.calculatedRadius

        return {
            radius: this.calculatedRadius,
            fontSize: this.fontSize
        }
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

    // 创建CSS3D渲染器
    css3dRenderer = new CSS3DRenderer()
    css3dRenderer.setSize(window.innerWidth, window.innerHeight)
    css3dRenderer.domElement.style.position = 'absolute'
    css3dRenderer.domElement.style.top = '0px'
    css3dRenderer.domElement.style.pointerEvents = 'none'
    containerRef.value.appendChild(css3dRenderer.domElement)

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



// 生成图数据
const generateGraphData = () => {
    nodes = []
    links = []

    // 重置已使用的索引
    usedIndices.behavior.clear()
    usedIndices.factor.clear()
    usedIndices.task.clear()

    // 创建根节点（参训人员）
    const rootNode = new Node(0, 0, 0, 0)
    const rootConfig = graphConfig.nodes.levels[1]
    rootNode.level = 1
    rootNode.name = traineeName
    rootNode.nodeType = 'trainee'

    // 根据文字内容计算球体和文字大小
    rootNode.calculateSizeFromText(traineeName, 1)

    const colorVariation = rootConfig.colorVariation.min +
        Math.random() * (rootConfig.colorVariation.max - rootConfig.colorVariation.min)
    rootNode.color = new THREE.Color(configParser.parseColor(rootConfig.color)).multiplyScalar(colorVariation)

    nodes.push(rootNode)

    // 创建二级节点（行为、评分因子、任务）
    const level2Nodes = []
    firstLevelDefs.forEach((def, index) => {
        const angle = (index * Math.PI * 2) / firstLevelDefs.length
        const radius = graphConfig.nodes.levels[2].position.radius
        const x = Math.cos(angle) * radius
        const y = Math.sin(angle) * radius
        const z = (Math.random() - 0.5) * graphConfig.nodes.levels[2].position.zVariation

        const node = new Node(index + 1, x, y, z)
        const nodeConfig = graphConfig.nodes.levels[2]
        node.level = 2
        node.name = def.name
        node.nodeType = def.id

        // 根据文字内容计算球体和文字大小
        node.calculateSizeFromText(def.name, 2)

        const colorVariation = nodeConfig.colorVariation.min +
            Math.random() * (nodeConfig.colorVariation.max - nodeConfig.colorVariation.min)
        node.color = new THREE.Color(configParser.parseColor(nodeConfig.color)).multiplyScalar(colorVariation)

        nodes.push(node)
        level2Nodes.push(node)

        // 连接到根节点
        const connectionType = graphConfig.connections.types['root-main']
        links.push(new Link(rootNode, node, connectionType.length))
    })

    // 创建初始的三级节点（每个二级节点只创建几个子节点）
    let nodeIdCounter = firstLevelDefs.length + 1

    // 为行为节点创建初始子节点
    const behaviorNode = level2Nodes.find(n => n.nodeType === 'behavior')
    const behaviorInitialCount = Math.min(dynamicNodeConfig.initialNodes, behaviorList.length)
    for (let i = 0; i < behaviorInitialCount; i++) {
        const randomIndex = getRandomUnusedIndex(behaviorList, usedIndices.behavior)
        if (randomIndex !== -1) {
            const item = behaviorList[randomIndex]
            usedIndices.behavior.add(randomIndex)
            const node = createThirdLevelNode(nodeIdCounter++, item, behaviorNode, i, behaviorInitialCount)
            nodes.push(node)

            const connectionType = graphConfig.connections.types['main-sub']
            links.push(new Link(behaviorNode, node, connectionType.length))
        }
    }

    // 为评分因子节点创建初始子节点
    const factorNode = level2Nodes.find(n => n.nodeType === 'factor')
    const factorInitialCount = Math.min(dynamicNodeConfig.initialNodes, factorList.length)
    for (let i = 0; i < factorInitialCount; i++) {
        const randomIndex = getRandomUnusedIndex(factorList, usedIndices.factor)
        if (randomIndex !== -1) {
            const item = factorList[randomIndex]
            usedIndices.factor.add(randomIndex)
            const node = createThirdLevelNode(nodeIdCounter++, item, factorNode, i, factorInitialCount)
            nodes.push(node)

            const connectionType = graphConfig.connections.types['main-sub']
            links.push(new Link(factorNode, node, connectionType.length))
        }
    }

    // 为任务节点创建初始子节点
    const taskNode = level2Nodes.find(n => n.nodeType === 'task')
    const taskInitialCount = Math.min(dynamicNodeConfig.initialNodes, taskList.length)
    for (let i = 0; i < taskInitialCount; i++) {
        const randomIndex = getRandomUnusedIndex(taskList, usedIndices.task)
        if (randomIndex !== -1) {
            const item = taskList[randomIndex]
            usedIndices.task.add(randomIndex)
            const node = createThirdLevelNode(nodeIdCounter++, item, taskNode, i, taskInitialCount)
            nodes.push(node)

            const connectionType = graphConfig.connections.types['main-sub']
            links.push(new Link(taskNode, node, connectionType.length))
        }
    }

    // 更新响应式节点计数
    currentNodeCount.value = nodes.length
}

// 创建第三级节点的辅助函数
const createThirdLevelNode = (id, name, parentNode, index, totalCount) => {
    const angle = (index * Math.PI * 2) / totalCount
    const pos = graphConfig.nodes.levels[3].position
    const radius = pos.radiusMin + Math.random() * (pos.radiusMax - pos.radiusMin)

    const x = parentNode.position.x + Math.cos(angle) * radius
    const y = parentNode.position.y + Math.sin(angle) * radius
    const z = parentNode.position.z + (Math.random() - 0.5) * pos.zVariation

    const node = new Node(id, x, y, z)
    const nodeConfig = graphConfig.nodes.levels[3]
    node.level = 3
    node.name = name
    node.nodeType = 'item'

    // 根据文字内容计算球体和文字大小
    node.calculateSizeFromText(name, 3)

    const colorVariation = nodeConfig.colorVariation.min +
        Math.random() * (nodeConfig.colorVariation.max - nodeConfig.colorVariation.min)
    node.color = new THREE.Color(configParser.parseColor(nodeConfig.color)).multiplyScalar(colorVariation)

    return node
}

// 获取随机未使用的索引
const getRandomUnusedIndex = (array, usedSet) => {
    const unusedIndices = []
    for (let i = 0; i < array.length; i++) {
        if (!usedSet.has(i)) {
            unusedIndices.push(i)
        }
    }

    if (unusedIndices.length === 0) return -1

    const randomIndex = Math.floor(Math.random() * unusedIndices.length)
    return unusedIndices[randomIndex]
}

// 获取下一个可用的节点ID
const getNextNodeId = () => {
    if (nodes.length === 0) return 1
    return Math.max(...nodes.map(n => n.id)) + 1
}

// 动态添加第三级节点
const addRandomThirdLevelNode = () => {
    // 随机选择一个二级节点类型
    const nodeTypes = ['behavior', 'factor', 'task']
    const randomType = nodeTypes[Math.floor(Math.random() * nodeTypes.length)]

    let parentNode, itemList, usedSet

    switch (randomType) {
        case 'behavior':
            parentNode = nodes.find(n => n.nodeType === 'behavior')
            itemList = behaviorList
            usedSet = usedIndices.behavior
            break
        case 'factor':
            parentNode = nodes.find(n => n.nodeType === 'factor')
            itemList = factorList
            usedSet = usedIndices.factor
            break
        case 'task':
            parentNode = nodes.find(n => n.nodeType === 'task')
            itemList = taskList
            usedSet = usedIndices.task
            break
    }

    // 检查是否已达到最大节点数
    const currentChildCount = nodes.filter(n => n.level === 3 &&
        links.some(l => l.source === parentNode && l.target === n)).length

    if (currentChildCount >= dynamicNodeConfig.maxNodes) {
        console.log(`${randomType} 节点已达到最大数量限制`)
        return
    }

    // 获取随机未使用的索引
    const randomIndex = getRandomUnusedIndex(itemList, usedSet)
    if (randomIndex === -1) {
        console.log(`${randomType} 节点已无可用文字`)
        return
    }

    const item = itemList[randomIndex]
    usedSet.add(randomIndex)

    console.log(`添加 ${randomType} 节点 "${item}" (索引: ${randomIndex})`)
    console.log(`添加后 ${randomType} 已使用索引:`, Array.from(usedSet))

    // 创建新节点
    const newNodeId = getNextNodeId()
    const newNode = createThirdLevelNode(newNodeId, item, parentNode, 0, 1)

    // 设置动画属性
    newNode.isAnimating = true
    newNode.animationProgress = 0
    newNode.targetPosition = newNode.position.clone()
    newNode.initialPosition = new THREE.Vector3(parentNode.position.x, parentNode.position.y, parentNode.position.z)
    newNode.position.copy(newNode.initialPosition)

    // 添加到数组
    nodes.push(newNode)

    // 创建连接
    const connectionType = graphConfig.connections.types['main-sub']
    const newLink = new Link(parentNode, newNode, connectionType.length)
    links.push(newLink)

    // 创建3D对象
    const nodeObject = createNodeObject(newNode)
    const linkObject = createLinkObject(newLink)

    // 更新节点计数
    currentNodeCount.value = nodes.length

    console.log(`添加了 ${randomType} 节点: ${item}`)

    // 验证添加后的索引完整性
    if (process.env.NODE_ENV === 'development') {
        setTimeout(() => {
            validateIndicesIntegrity()
        }, 50)
    }
}

// 动态删除第三级节点
const removeRandomThirdLevelNode = () => {
    // 获取所有三级节点
    const thirdLevelNodes = nodes.filter(n => n.level === 3)

    if (thirdLevelNodes.length === 0) {
        console.log('没有可删除的三级节点')
        return
    }

    // 按类型分组三级节点
    const nodesByType = {
        behavior: [],
        factor: [],
        task: []
    }

    thirdLevelNodes.forEach(node => {
        // 找到父节点类型
        const parentLink = links.find(l => l.target === node && l.source.level === 2)
        if (parentLink) {
            const parentType = parentLink.source.nodeType
            if (nodesByType[parentType]) {
                nodesByType[parentType].push(node)
            }
        }
    })

    // 随机选择一个类型，确保不会低于最小节点数
    const availableTypes = Object.keys(nodesByType).filter(type =>
        nodesByType[type].length > dynamicNodeConfig.minNodes
    )

    if (availableTypes.length === 0) {
        console.log('所有类型的节点都已达到最小数量限制')
        return
    }

    const randomType = availableTypes[Math.floor(Math.random() * availableTypes.length)]
    const candidateNodes = nodesByType[randomType]

    // 随机选择一个节点删除
    const randomNode = candidateNodes[Math.floor(Math.random() * candidateNodes.length)]

    // 从已使用索引中移除
    let itemList, usedSet
    switch (randomType) {
        case 'behavior':
            itemList = behaviorList
            usedSet = usedIndices.behavior
            break
        case 'factor':
            itemList = factorList
            usedSet = usedIndices.factor
            break
        case 'task':
            itemList = taskList
            usedSet = usedIndices.task
            break
    }

    const itemIndex = itemList.indexOf(randomNode.name)
    if (itemIndex !== -1) {
        const deleteSuccess = usedSet.delete(itemIndex)
        console.log(`从 ${randomType} 已使用索引中移除 "${randomNode.name}" (索引: ${itemIndex}): ${deleteSuccess ? '成功' : '失败'}`)
        console.log(`移除后 ${randomType} 已使用索引:`, Array.from(usedSet))
    } else {
        console.error(`错误：无法在 ${randomType} 数组中找到 "${randomNode.name}"`)
    }

    // 找到节点在数组中的索引
    const nodeIndex = nodes.indexOf(randomNode)
    if (nodeIndex === -1) {
        console.log('节点不存在于数组中')
        return
    }

    // 找到并删除相关的连接
    const relatedLinkIndices = []
    links.forEach((link, index) => {
        if (link.source === randomNode || link.target === randomNode) {
            relatedLinkIndices.push(index)
        }
    })

    // 从后往前删除连接（避免索引问题）
    relatedLinkIndices.reverse().forEach(linkIndex => {
        // 删除3D对象
        const linkObject = linkObjects[linkIndex]
        if (linkObject) {
            scene.remove(linkObject)
            linkObject.geometry.dispose()
            linkObject.material.dispose()
        }

        // 从数组中移除
        links.splice(linkIndex, 1)
        linkObjects.splice(linkIndex, 1)
    })

    // 删除节点的3D对象
    const nodeObject = nodeObjects[nodeIndex]
    if (nodeObject) {
        scene.remove(nodeObject)
        nodeObject.geometry.dispose()
        nodeObject.material.dispose()

        // 正确删除CSS3D标签
        nodeObject.children.forEach(child => {
            if (child.isCSS3DObject) {
                scene.remove(child)
                // 销毁DOM元素
                if (child.element && child.element.parentNode) {
                    child.element.parentNode.removeChild(child.element)
                }
            }
        })
    }

    // 删除对应的标签引用
    const nodeLabel = nodeLabels[nodeIndex]
    if (nodeLabel) {
        scene.remove(nodeLabel)
        // 销毁DOM元素
        if (nodeLabel.element && nodeLabel.element.parentNode) {
            nodeLabel.element.parentNode.removeChild(nodeLabel.element)
        }
    }

    // 从数组中移除
    nodes.splice(nodeIndex, 1)
    nodeObjects.splice(nodeIndex, 1)
    if (nodeLabels[nodeIndex]) {
        nodeLabels.splice(nodeIndex, 1)
    }

    // 更新节点计数
    currentNodeCount.value = nodes.length

    console.log(`删除了 ${randomType} 节点: ${randomNode.name}`)

    // 验证删除后的索引完整性
    if (process.env.NODE_ENV === 'development') {
        setTimeout(() => {
            validateIndicesIntegrity()
        }, 50)
    }
}

// 执行动态节点操作（增加或删除）
const performDynamicNodeOperation = () => {
    // 检查动态节点功能是否启用
    if (!dynamicNodeEnabled.value) {
        return
    }

    // 在开发模式下验证操作前的索引完整性
    if (process.env.NODE_ENV === 'development') {
        console.log('--- 动态操作前验证 ---')
        validateIndicesIntegrity()
    }

    // 随机决定是增加还是删除节点
    const shouldAdd = Math.random() > 0.5

    if (shouldAdd) {
        addRandomThirdLevelNode()
    } else {
        removeRandomThirdLevelNode()
    }
}

// 启动动态节点定时器
const startDynamicNodeTimer = () => {
    if (dynamicNodeTimer) {
        clearInterval(dynamicNodeTimer)
    }

    dynamicNodeTimer = setInterval(() => {
        performDynamicNodeOperation()
    }, dynamicNodeConfig.interval)

    console.log('动态节点定时器已启动')
}

// 停止动态节点定时器
const stopDynamicNodeTimer = () => {
    if (dynamicNodeTimer) {
        clearInterval(dynamicNodeTimer)
        dynamicNodeTimer = null
        console.log('动态节点定时器已停止')
    }
}

// 切换动态节点功能
const toggleDynamicNodes = () => {
    dynamicNodeEnabled.value = !dynamicNodeEnabled.value

    if (dynamicNodeEnabled.value) {
        console.log('动态节点功能已启用')
        if (!dynamicNodeTimer) {
            startDynamicNodeTimer()
        }
    } else {
        console.log('动态节点功能已禁用')
    }
}

// 切换自适应大小功能
const toggleAdaptiveSize = () => {
    adaptiveSizeEnabled.value = !adaptiveSizeEnabled.value

    console.log(`自适应大小功能已${adaptiveSizeEnabled.value ? '启用' : '禁用'}`)

    // 重新计算所有节点的大小
    nodes.forEach(node => {
        node.calculateSizeFromText(node.name, node.level)
    })

    // 重新创建3D对象以应用新的大小
    createObjects()

    console.log('节点大小已更新')
}

// 同步节点缩放和文字大小
const updateNodeScale = (nodeIndex, scale) => {
    const node = nodes[nodeIndex]
    const nodeObject = nodeObjects[nodeIndex]
    const label = nodeLabels[nodeIndex]

    if (node && nodeObject && label) {
        // 更新球体缩放
        nodeObject.scale.set(scale, scale, scale)

        // 同步更新文字大小，基于层级的基础大小进行缩放
        if (label.element) {
            const scaledFontSize = Math.max(6, Math.round(node.fontSize * scale))
            label.element.style.fontSize = `${scaledFontSize}px`

            // 如果CSS3D标签当前没有其他transform，应用球体缩放
            const currentTransform = label.element.style.transform
            if (!currentTransform.includes('scale(')) {
                label.element.style.transform = `scale(${scale})`
            }
        }
    }
}

// 显示节点大小信息
const showNodeSizeInfo = () => {
    console.log('=== 节点大小信息 ===')
    console.log('自适应大小功能：', adaptiveSizeEnabled.value ? '启用' : '禁用')
    console.log(`文字大小设置：Level 1(${graphConfig.nodes.levels[1].fontSize || 20}px) > Level 2(${graphConfig.nodes.levels[2].fontSize || 16}px) > Level 3(${graphConfig.nodes.levels[3].fontSize || 12}px)`)

    // 显示配置文件中的自适应大小设置
    const adaptiveConfig = graphConfig.controls.adaptiveSize || {}
    const radiusRange = adaptiveConfig.radiusRange || { min: 0.8, max: 1.6 }
    const textLengthRange = adaptiveConfig.textLengthRange || { min: 2, max: 16 }
    console.log(`球体半径范围：${radiusRange.min}-${radiusRange.max}倍基准半径`)
    console.log(`文字长度范围：${textLengthRange.min}-${textLengthRange.max}个字符`)

    nodes.forEach((node, index) => {
        // 计算文字的有效长度
        const chineseCharCount = (node.name.match(/[\u4e00-\u9fa5]/g) || []).length
        const englishCharCount = node.name.length - chineseCharCount
        const effectiveLength = chineseCharCount * 2 + englishCharCount

        // 获取当前缩放状态
        const nodeObject = nodeObjects[index]
        const currentScale = nodeObject ? nodeObject.scale.x : 1

        console.log(`节点 "${node.name}" (Level ${node.level}):`)
        console.log(`  文字长度: ${node.name.length} (中文: ${chineseCharCount}, 英文: ${englishCharCount})`)
        console.log(`  有效长度: ${effectiveLength}`)
        console.log(`  球体半径: ${node.radius.toFixed(3)} (基于文字长度计算)`)
        console.log(`  文字大小: ${node.fontSize}px (基于层级配置)`)
        console.log(`  计算半径: ${node.calculatedRadius.toFixed(3)}`)
        console.log(`  当前缩放: ${currentScale.toFixed(3)}`)
        console.log(`  实际球体大小: ${(node.radius * currentScale).toFixed(3)}`)
        console.log(`  实际文字大小: ${Math.round(node.fontSize * currentScale)}px`)
        console.log(`  是否动画中: ${node.isAnimating ? '是' : '否'}`)
        console.log('---')
    })

    console.log('========================')
}

// 手动测试动态节点功能（用于调试）
const testDynamicNodes = () => {
    console.log('=== 动态节点测试 ===')
    console.log('当前节点数量:', currentNodeCount.value)

    // 显示详细的索引使用情况
    console.log('行为节点 (behavior):')
    console.log('  总数:', behaviorList.length)
    console.log('  已使用索引:', Array.from(usedIndices.behavior))
    console.log('  已使用文字:', Array.from(usedIndices.behavior).map(i => behaviorList[i]))
    console.log('  可用索引数量:', behaviorList.length - usedIndices.behavior.size)

    console.log('评分因子 (factor):')
    console.log('  总数:', factorList.length)
    console.log('  已使用索引:', Array.from(usedIndices.factor))
    console.log('  已使用文字:', Array.from(usedIndices.factor).map(i => factorList[i]))
    console.log('  可用索引数量:', factorList.length - usedIndices.factor.size)

    console.log('任务节点 (task):')
    console.log('  总数:', taskList.length)
    console.log('  已使用索引:', Array.from(usedIndices.task))
    console.log('  已使用文字:', Array.from(usedIndices.task).map(i => taskList[i]))
    console.log('  可用索引数量:', taskList.length - usedIndices.task.size)

    // 手动执行一次动态操作
    console.log('\n执行动态操作...')
    performDynamicNodeOperation()

    // 输出操作后的状态
    setTimeout(() => {
        console.log('\n操作后节点数量:', currentNodeCount.value)
        console.log('========================')
    }, 100)
}

// 输出动态节点配置信息
const logDynamicNodeConfig = () => {
    console.log('=== 动态节点配置信息 ===')
    console.log('定时器间隔:', dynamicNodeConfig.interval + 'ms')
    console.log('每个二级节点最少子节点数:', dynamicNodeConfig.minNodes)
    console.log('每个二级节点最多子节点数:', dynamicNodeConfig.maxNodes)
    console.log('初始子节点数量:', dynamicNodeConfig.initialNodes)
    console.log('动态节点功能启用:', dynamicNodeEnabled.value)
    console.log('可用行为数量:', behaviorList.length)
    console.log('可用评分因子数量:', factorList.length)
    console.log('可用任务数量:', taskList.length)
    console.log('配置来源:', '从配置文件读取')
    console.log('========================')
}

// 显示层级文字大小设置
const showLevelFontSizes = () => {
    console.log('=== 层级文字大小设置 ===')
    console.log(`Level 1 (根节点): ${graphConfig.nodes.levels[1].fontSize || 20}px`)
    console.log(`Level 2 (二级节点): ${graphConfig.nodes.levels[2].fontSize || 16}px`)
    console.log(`Level 3 (三级节点): ${graphConfig.nodes.levels[3].fontSize || 12}px`)
    console.log('自适应大小功能:', adaptiveSizeEnabled.value ? '启用' : '禁用')

    // 按层级统计当前节点
    const levelCounts = { 1: 0, 2: 0, 3: 0 }
    nodes.forEach(node => {
        if (levelCounts[node.level] !== undefined) {
            levelCounts[node.level]++
        }
    })

    console.log('当前节点统计:')
    console.log(`  Level 1: ${levelCounts[1]} 个节点`)
    console.log(`  Level 2: ${levelCounts[2]} 个节点`)
    console.log(`  Level 3: ${levelCounts[3]} 个节点`)
    console.log('========================')
}

// 显示CSS3D标签缩放信息
const showCSS3DScaleInfo = () => {
    console.log('=== CSS3D标签缩放信息 ===')
    console.log('相机位置:', camera.position.x.toFixed(2), camera.position.y.toFixed(2), camera.position.z.toFixed(2))

    nodes.forEach((node, index) => {
        const distance = camera.position.distanceTo(node.position)
        const label = nodeLabels[index]

        if (label && label.element) {
            const transform = label.element.style.transform
            const scaleMatch = transform.match(/scale\(([^)]+)\)/)
            const currentScale = scaleMatch ? parseFloat(scaleMatch[1]) : 1

            console.log(`节点 "${node.name}" (Level ${node.level}):`)
            console.log(`  距相机距离: ${distance.toFixed(2)}`)
            console.log(`  当前缩放: ${currentScale.toFixed(3)}`)
            console.log(`  位置: (${node.position.x.toFixed(2)}, ${node.position.y.toFixed(2)}, ${node.position.z.toFixed(2)})`)
            console.log('---')
        }
    })

    console.log('========================')
}

// 调整CSS3D缩放参数
const adjustCSS3DScaleParams = (nearDistance = 10, farDistance = 50, maxScale = 1.8, minScale = 0.2) => {
    console.log('=== 调整CSS3D缩放参数 ===')
    console.log(`近距离阈值: ${nearDistance}`)
    console.log(`远距离阈值: ${farDistance}`)
    console.log(`最大缩放: ${maxScale}`)
    console.log(`最小缩放: ${minScale}`)
    console.log('参数已更新（需要重新启动动画循环生效）')
    console.log('========================')

    // 这里可以添加动态参数调整逻辑
}

// 验证索引完整性
const validateIndicesIntegrity = () => {
    console.log('=== 索引完整性验证 ===')

    // 验证行为节点
    const behaviorNodes = nodes.filter(n => n.level === 3 && behaviorList.includes(n.name))
    const behaviorNodeNames = behaviorNodes.map(n => n.name)
    const behaviorUsedIndices = Array.from(usedIndices.behavior)
    const behaviorUsedNames = behaviorUsedIndices.map(i => behaviorList[i])

    console.log('行为节点验证:')
    console.log('  实际节点名称:', behaviorNodeNames)
    console.log('  索引对应名称:', behaviorUsedNames)
    console.log('  数量一致:', behaviorNodeNames.length === behaviorUsedNames.length)
    console.log('  内容一致:', behaviorNodeNames.sort().join(',') === behaviorUsedNames.sort().join(','))

    // 验证评分因子节点
    const factorNodes = nodes.filter(n => n.level === 3 && factorList.includes(n.name))
    const factorNodeNames = factorNodes.map(n => n.name)
    const factorUsedIndices = Array.from(usedIndices.factor)
    const factorUsedNames = factorUsedIndices.map(i => factorList[i])

    console.log('评分因子验证:')
    console.log('  实际节点名称:', factorNodeNames)
    console.log('  索引对应名称:', factorUsedNames)
    console.log('  数量一致:', factorNodeNames.length === factorUsedNames.length)
    console.log('  内容一致:', factorNodeNames.sort().join(',') === factorUsedNames.sort().join(','))

    // 验证任务节点
    const taskNodes = nodes.filter(n => n.level === 3 && taskList.includes(n.name))
    const taskNodeNames = taskNodes.map(n => n.name)
    const taskUsedIndices = Array.from(usedIndices.task)
    const taskUsedNames = taskUsedIndices.map(i => taskList[i])

    console.log('任务节点验证:')
    console.log('  实际节点名称:', taskNodeNames)
    console.log('  索引对应名称:', taskUsedNames)
    console.log('  数量一致:', taskNodeNames.length === taskUsedNames.length)
    console.log('  内容一致:', taskNodeNames.sort().join(',') === taskUsedNames.sort().join(','))

    console.log('========================')
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

    // 创建CSS3D文本标签
    const labelDiv = document.createElement('div')
    labelDiv.className = node.isAnimating ? 'node-label new-node' : 'node-label'

    // 显示节点的实际名称
    labelDiv.textContent = node.name || `节点 ${node.id}`

    // 设置根据球体大小调整的文字样式
    labelDiv.style.color = 'white'
    labelDiv.style.fontFamily = 'Arial, sans-serif'
    labelDiv.style.fontSize = `${node.fontSize}px`
    labelDiv.style.pointerEvents = 'none'
    labelDiv.style.userSelect = 'none'
    labelDiv.style.textAlign = 'center'
    labelDiv.style.whiteSpace = 'nowrap'
    labelDiv.style.fontWeight = 'bold'
    labelDiv.style.textShadow = '1px 1px 2px rgba(0,0,0,0.8)'
    labelDiv.style.transformStyle = 'preserve-3d'

    const label = new CSS3DObject(labelDiv)
    label.position.set(0, 0, 0) // 标签位置在球心

    // 设置标签始终面向相机
    label.lookAt(camera.position)

    mesh.add(label)

    // 存储到数组中
    nodeObjects.push(mesh)
    nodeLabels.push(label)

    return mesh
}

// 创建单个连接的3D对象
const createLinkObject = (link) => {
    // 计算连接线的方向和长度
    const direction = new THREE.Vector3().subVectors(link.target.position, link.source.position)
    const length = direction.length()

    // 根据连接配置使用不同颜色和效果
    let connectionConfig
    if (link.source.level === 1 || link.target.level === 1) {
        connectionConfig = graphConfig.connections.types['root-main']
    } else if (link.source.level === 2 || link.target.level === 2) {
        connectionConfig = graphConfig.connections.types['main-sub']
    } else {
        connectionConfig = graphConfig.connections.types['sub-sub']
    }

    // 使用圆柱体几何体创建更粗的连接线，增粗50%
    const baseRadius = 0.02 // 基础半径
    const thickerRadius = baseRadius * 1.5 // 增粗50%
    const geometry = new THREE.CylinderGeometry(thickerRadius, thickerRadius, 1, 8) // 创建标准长度为1的圆柱体

    const material = new THREE.MeshBasicMaterial({
        color: configParser.parseColor(connectionConfig.color),
        transparent: true,
        opacity: connectionConfig.opacity
    })

    const cylinder = new THREE.Mesh(geometry, material)

    // 计算中点位置
    const midpoint = new THREE.Vector3().addVectors(link.source.position, link.target.position).multiplyScalar(0.5)
    cylinder.position.copy(midpoint)

    // 设置圆柱体的长度缩放
    cylinder.scale.y = length

    // 设置圆柱体的旋转以对准连接点
    cylinder.lookAt(link.target.position)
    cylinder.rotateX(Math.PI / 2)

    cylinder.userData = {
        connectionConfig: connectionConfig,
        link: link,
        isThickLine: true
    }

    scene.add(cylinder)
    linkObjects.push(cylinder)

    return cylinder
}

// 创建3D对象
const createObjects = () => {
    // 清除现有对象
    nodeObjects.forEach(obj => {
        scene.remove(obj)
        if (obj.geometry) obj.geometry.dispose()
        if (obj.material) obj.material.dispose()

        // 清理CSS3D标签
        obj.children.forEach(child => {
            if (child.isCSS3DObject) {
                scene.remove(child)
                if (child.element && child.element.parentNode) {
                    child.element.parentNode.removeChild(child.element)
                }
            }
        })
    })

    linkObjects.forEach(obj => {
        scene.remove(obj)
        if (obj.geometry) obj.geometry.dispose()
        if (obj.material) obj.material.dispose()
    })

    // 清理nodeLabels中的CSS3D对象
    nodeLabels.forEach(label => {
        if (label) {
            scene.remove(label)
            if (label.element && label.element.parentNode) {
                label.element.parentNode.removeChild(label.element)
            }
        }
    })

    nodeObjects = []
    linkObjects = []
    nodeLabels = []

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

    // 计算斥力（考虑节点半径）
    for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
            const nodeA = nodes[i]
            const nodeB = nodes[j]

            const distance = nodeA.position.distanceTo(nodeB.position)
            if (distance > 0) {
                // 考虑节点半径的最小距离
                const minDistance = nodeA.radius + nodeB.radius + 0.5 // 额外的缓冲距离
                const effectiveDistance = Math.max(distance, minDistance)

                const direction = nodeA.position.clone().sub(nodeB.position).normalize()

                // 如果距离小于最小距离，增加斥力
                const distanceMultiplier = distance < minDistance ? 2 : 1
                const force = direction.multiplyScalar(
                    (repulsionStrength.value * distanceMultiplier) / (effectiveDistance * effectiveDistance)
                )

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
                updateNodeScale(index, scale)
            } else if (mesh.scale.x < 1) {
                // 确保动画完成后缩放为1
                updateNodeScale(index, 1)
            }
        }
    })

    // 更新连接线
    linkObjects.forEach((cylinder, index) => {
        const link = links[index]
        if (link && cylinder.userData.isThickLine) {
            // 计算新的方向和长度
            const direction = new THREE.Vector3().subVectors(link.target.position, link.source.position)
            const length = direction.length()

            // 更新圆柱体的长度（原始圆柱体高度为1，需要缩放到实际长度）
            cylinder.scale.y = length

            // 计算中点位置
            const midpoint = new THREE.Vector3().addVectors(link.source.position, link.target.position).multiplyScalar(0.5)
            cylinder.position.copy(midpoint)

            // 设置圆柱体的旋转以对准连接点
            cylinder.lookAt(link.target.position)
            cylinder.rotateX(Math.PI / 2)
        }
    })
}

// 渲染循环
const animate = () => {
    animationId = requestAnimationFrame(animate)

    const elapsedTime = clock.getElapsedTime()

    // 更新物理模拟
    updatePhysics()

    // 更新CSS3D标签的近大远小效果（性能优化）
    labelUpdateCounter++
    const shouldUpdateLabels = labelUpdateCounter % labelUpdateInterval === 0
    const cameraPositionChanged = !camera.position.equals(lastCameraPosition)

    if (shouldUpdateLabels || cameraPositionChanged) {
        nodeObjects.forEach((mesh, index) => {
            const node = nodes[index]
            const label = nodeLabels[index]

            if (node && mesh && label) {
                // 计算节点到相机的距离
                const distance = camera.position.distanceTo(node.position)

                // 根据距离计算缩放比例（距离越近，缩放越大）
                const baseScale = 0.7 // 基础缩放（降低基础大小）
                const maxScale = 1.8 // 最大缩放（降低最大大小）
                const minScale = 0.2 // 最小缩放（降低最小大小）
                const nearDistance = 10 // 近距离阈值
                const farDistance = 50 // 远距离阈值

                // 使用非线性缩放函数实现更自然的近大远小效果
                let scale = baseScale
                if (distance <= nearDistance) {
                    // 近距离：使用反比例函数
                    const normalizedDistance = distance / nearDistance
                    scale = baseScale + (maxScale - baseScale) * (1 - normalizedDistance)
                } else if (distance >= farDistance) {
                    // 远距离：使用指数衰减
                    const normalizedDistance = Math.min(1, (distance - farDistance) / farDistance)
                    scale = baseScale - (baseScale - minScale) * (1 - Math.exp(-normalizedDistance * 2))
                } else {
                    // 中距离：使用平滑过渡
                    const normalizedDistance = (distance - nearDistance) / (farDistance - nearDistance)
                    scale = baseScale - (baseScale - minScale) * normalizedDistance * 0.5
                }

                // 应用缩放到CSS3D标签
                if (label.element) {
                    label.element.style.transform = `scale(${scale})`
                }

                // 让标签始终面向相机
                label.lookAt(camera.position)
            }
        })

        // 更新相机位置缓存
        lastCameraPosition.copy(camera.position)
    }

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
    linkObjects.forEach((cylinder, index) => {
        const connectionConfig = cylinder.userData.connectionConfig
        if (connectionConfig && connectionConfig.animation?.opacityVariation) {
            const animConfig = connectionConfig.animation.opacityVariation
            const opacity = configParser.getAnimationValue(
                animConfig,
                elapsedTime,
                index
            )
            cylinder.material.opacity = opacity
        }
    })

    controls.update()

    // 强制更新所有对象的变换矩阵
    scene.updateMatrixWorld(true)

    // 普通渲染
    renderer.render(scene, camera)

    // CSS3D渲染
    css3dRenderer.render(scene, camera)
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
    css3dRenderer.setSize(window.innerWidth, window.innerHeight)
}

// 重新生成图
const regenerateGraph = () => {
    // 停止当前的动态节点定时器
    stopDynamicNodeTimer()

    generateGraphData()
    createObjects()

    // 重新启动动态节点定时器
    startDynamicNodeTimer()
}

// 重置位置
const resetPositions = () => {
    nodes.forEach((node) => {
        if (node.level === 1) {
            // 根节点位于中心
            node.position.set(0, 0, 0)
        } else if (node.level === 2) {
            // 二级节点围绕根节点分布
            const index = firstLevelDefs.findIndex(def => def.id === node.nodeType)
            const angle = (index * Math.PI * 2) / firstLevelDefs.length
            const radius = graphConfig.nodes.levels[2].position.radius
            const x = Math.cos(angle) * radius
            const y = Math.sin(angle) * radius
            const z = (Math.random() - 0.5) * graphConfig.nodes.levels[2].position.zVariation
            node.position.set(x, y, z)
        } else if (node.level === 3) {
            // 三级节点围绕对应的二级节点分布
            let parentNode = null

            // 根据节点名称确定父节点
            if (behaviorList.includes(node.name)) {
                parentNode = nodes.find(n => n.nodeType === 'behavior')
            } else if (factorList.includes(node.name)) {
                parentNode = nodes.find(n => n.nodeType === 'factor')
            } else if (taskList.includes(node.name)) {
                parentNode = nodes.find(n => n.nodeType === 'task')
            }

            if (parentNode) {
                const pos = graphConfig.nodes.levels[3].position
                const angle = Math.random() * Math.PI * 2
                const radius = pos.radiusMin + Math.random() * (pos.radiusMax - pos.radiusMin)
                const x = parentNode.position.x + Math.cos(angle) * radius
                const y = parentNode.position.y + Math.sin(angle) * radius
                const z = parentNode.position.z + (Math.random() - 0.5) * pos.zVariation
                node.position.set(x, y, z)
            }
        }
        node.velocity.set(0, 0, 0)
        node.force.set(0, 0, 0)
    })
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
        // 启动动态节点定时器
        startDynamicNodeTimer()

        // 输出动态节点配置信息
        logDynamicNodeConfig()

        // 验证初始索引完整性
        validateIndicesIntegrity()

        // 在开发模式下暴露调试函数到全局
        if (process.env.NODE_ENV === 'development') {
            window.testDynamicNodes = testDynamicNodes
            window.toggleDynamicNodes = toggleDynamicNodes
            window.addNode = addRandomThirdLevelNode
            window.removeNode = removeRandomThirdLevelNode
            window.logConfig = logDynamicNodeConfig
            window.validateIndices = validateIndicesIntegrity
            window.toggleAdaptiveSize = toggleAdaptiveSize
            window.showNodeSizeInfo = showNodeSizeInfo
            window.updateNodeScale = updateNodeScale
            window.showLevelFontSizes = showLevelFontSizes
            window.showCSS3DScaleInfo = showCSS3DScaleInfo
            window.adjustCSS3DScaleParams = adjustCSS3DScaleParams
            console.log('调试函数已暴露:')
            console.log('动态节点功能:')
            console.log('- window.testDynamicNodes(): 测试动态节点功能')
            console.log('- window.toggleDynamicNodes(): 切换动态节点功能')
            console.log('- window.addNode(): 手动添加节点')
            console.log('- window.removeNode(): 手动删除节点')
            console.log('- window.logConfig(): 输出动态节点配置信息')
            console.log('- window.validateIndices(): 验证索引完整性')
            console.log('自适应大小功能:')
            console.log('- window.toggleAdaptiveSize(): 切换自适应大小功能')
            console.log('- window.showNodeSizeInfo(): 显示节点大小信息')
            console.log('- window.updateNodeScale(nodeIndex, scale): 手动缩放节点')
            console.log('- window.showLevelFontSizes(): 显示层级文字大小设置')
            console.log('CSS3D标签功能:')
            console.log('- window.showCSS3DScaleInfo(): 显示CSS3D标签缩放信息')
            console.log('- window.adjustCSS3DScaleParams(nearDistance, farDistance, maxScale, minScale): 调整缩放参数')
        }
    }, 100)
})

onUnmounted(() => {
    if (animationId) {
        cancelAnimationFrame(animationId)
    }

    // 停止动态节点定时器
    stopDynamicNodeTimer()

    // 清理所有3D对象和CSS3D标签
    nodeObjects.forEach(obj => {
        if (obj) {
            scene.remove(obj)
            if (obj.geometry) obj.geometry.dispose()
            if (obj.material) obj.material.dispose()

            // 清理CSS3D标签
            obj.children.forEach(child => {
                if (child.isCSS3DObject) {
                    scene.remove(child)
                    if (child.element && child.element.parentNode) {
                        child.element.parentNode.removeChild(child.element)
                    }
                }
            })
        }
    })

    linkObjects.forEach(obj => {
        if (obj) {
            scene.remove(obj)
            if (obj.geometry) obj.geometry.dispose()
            if (obj.material) obj.material.dispose()
        }
    })

    // 清理nodeLabels中的CSS3D对象
    nodeLabels.forEach(label => {
        if (label) {
            scene.remove(label)
            if (label.element && label.element.parentNode) {
                label.element.parentNode.removeChild(label.element)
            }
        }
    })

    // 清理渲染器
    if (renderer) {
        renderer.dispose()
    }

    // 清理CSS3D渲染器
    if (css3dRenderer && css3dRenderer.domElement) {
        if (css3dRenderer.domElement.parentNode) {
            css3dRenderer.domElement.parentNode.removeChild(css3dRenderer.domElement)
        }
    }

    window.removeEventListener('resize', onWindowResize)

    // 清理全局调试函数
    if (process.env.NODE_ENV === 'development') {
        delete window.testDynamicNodes
        delete window.toggleDynamicNodes
        delete window.addNode
        delete window.removeNode
        delete window.logConfig
        delete window.validateIndices
        delete window.toggleAdaptiveSize
        delete window.showNodeSizeInfo
        delete window.updateNodeScale
        delete window.showLevelFontSizes
        delete window.showCSS3DScaleInfo
        delete window.adjustCSS3DScaleParams
    }
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

/* CSS3D 节点标签样式 */
.node-label {
    text-align: center;
    white-space: nowrap;
    transition: opacity 0.3s ease, font-size 0.2s ease, transform 0.2s ease;
    background: rgba(0, 0, 0, 0.7);
    border-radius: 4px;
    padding: 2px 6px;
    backdrop-filter: blur(2px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    min-width: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    transform-style: preserve-3d;
}

/* 新增节点动画样式 */
.node-label.new-node {
    opacity: 0;
    animation: fadeInScale 0.8s ease-out forwards;
}

.node-label.removing-node {
    animation: fadeOutScale 0.5s ease-in forwards;
}

@keyframes fadeInScale {
    0% {
        opacity: 0;
        transform: scale(0.3);
    }

    60% {
        opacity: 0.8;
        transform: scale(1.1);
    }

    100% {
        opacity: 1;
        transform: scale(1);
    }
}

@keyframes fadeOutScale {
    0% {
        opacity: 1;
        transform: scale(1);
    }

    100% {
        opacity: 0;
        transform: scale(0.3);
    }
}
</style>

<!-- 

【动态力图系统】
==============

图结构：
- 根节点：参训人员名称（张三）
- 二级节点：行为、评分因子、任务
- 三级节点：具体项目（动态增删）

设计理念：
- 球体大小：根据文字长度计算（文字越长，球体越大）
- 文字大小：根据节点层级从配置文件读取（根节点最大，第三级最小）
- 层级视觉：越重要的节点，文字越大，便于用户识别层级关系
- 配置化：所有关键设置都在配置文件中，便于修改和维护

动态节点功能：
- 初始状态：每个二级节点有配置数量的子节点（默认4个）
- 间隔时间：从配置文件读取（默认每3秒）
- 节点数量范围：从配置文件读取（默认3-8个）
- 节点文字从配置文件中的数组随机选择
- 支持手动控制和调试

自适应大小功能：
- 根据文字长度自动调整球体大小（文字越长，球体越大）
- 根据节点层级设置文字大小（根节点最大，第三级最小）
- 中文字符按2个字符计算，英文字符按1个字符计算
- 球体大小范围：从配置文件读取（默认基准半径的0.8-1.6倍）
- 文字大小设置：从配置文件读取（默认Level 1(20px) > Level 2(16px) > Level 3(12px)）
- 支持开关控制
- 考虑节点半径的碰撞检测
- 缩放动画时文字大小同步变化

CSS3D标签功能：
- 使用CSS3DRenderer和CSS3DObject实现3D标签
- 实现近大远小的3D透视效果
- 标签始终面向相机，保持可读性
- 使用非线性缩放函数（反比例函数 + 指数衰减）
- 性能优化：每2帧更新一次标签，只有相机位置变化时才更新朝向
- 缩放参数：近距离阈值(10) / 远距离阈值(50) / 最大缩放(1.8) / 最小缩放(0.2)
- 支持transform-style: preserve-3d的3D变换

调试功能（开发模式）：
动态节点功能：
- window.testDynamicNodes()：测试动态节点功能
- window.toggleDynamicNodes()：切换动态节点功能
- window.addNode()：手动添加节点
- window.removeNode()：手动删除节点
- window.logConfig()：输出配置信息

自适应大小功能：
- window.toggleAdaptiveSize()：切换自适应大小功能
- window.showNodeSizeInfo()：显示节点大小信息
- window.updateNodeScale(nodeIndex, scale)：手动缩放节点
- window.showLevelFontSizes()：显示层级文字大小设置

CSS3D标签功能：
- window.showCSS3DScaleInfo()：显示CSS3D标签缩放信息
- window.adjustCSS3DScaleParams(nearDistance, farDistance, maxScale, minScale)：调整缩放参数

配置文件结构（graph-config.json）：
- 参训人员名称：graphConfig.labels.trainee.name
- 二级节点配置：graphConfig.labels.secondLevel
- 各层级文字大小：graphConfig.nodes.levels[n].fontSize
- 动态节点配置：graphConfig.controls.dynamicNodes
- 自适应大小配置：graphConfig.controls.adaptiveSize
- 行为、评分因子、任务的具体项目都在配置文件中定义
- 场景、光照、物理等所有参数都可在配置文件中修改

-->
