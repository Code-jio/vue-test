import { nextTick, createApp } from 'vue'
export const renderComponentToHTML = (component) => {
    return new Promise((resolve, reject) => {
      try {
        // 创建一个临时的容器，但不隐藏它
        const tempContainer = document.createElement('div')
        tempContainer.style.position = 'absolute'
        tempContainer.style.top = '-9999px'  // 移到视窗外
        tempContainer.style.left = '-9999px'
        tempContainer.style.visibility = 'hidden'  // 隐藏但保持布局
        
        // 添加到DOM中（Vue实例需要在DOM中才能正常工作）
        document.body.appendChild(tempContainer)
        
        // 创建Vue应用实例
        const app = createApp(component)
        
        // 挂载组件到临时容器
        const instance = app.mount(tempContainer)
        
        // 等待下一个tick确保渲染完成
        nextTick(() => {
          // 获取渲染后的HTML元素
          const renderedElement = tempContainer.firstElementChild
          
          if (renderedElement) {
            // 不再克隆元素，直接使用原始元素
            // 将元素从临时容器移除，但保持Vue实例活跃
            tempContainer.removeChild(renderedElement)
            
            // 清理临时容器
            document.body.removeChild(tempContainer)
            
            // 保存Vue实例引用到全局，避免被垃圾回收
            if (!window.vueInstancesForCSS3D) {
              window.vueInstancesForCSS3D = new Map()
            }
            
            // 为元素生成唯一ID并保存Vue实例
            const elementId = `vue-instance-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
            renderedElement.setAttribute('data-vue-instance-id', elementId)
            window.vueInstancesForCSS3D.set(elementId, { app, instance })
            
            // 返回保持Vue实例活跃的元素
            resolve(renderedElement)
          } else {
            reject(new Error('组件渲染失败'))
          }
        })
        
      } catch (error) {
        reject(error)
      }
    })
}