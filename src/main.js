import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'

const THREE = EngineKernel.THREE;
const OrbitControls = EngineKernel.OrbitControls;

const CSS3DRenderer = EngineKernel.CSS3DRenderer;
const CSS3DObject = EngineKernel.CSS3DObject;

// 全局样式
import './style/global.css'

createApp(App)
  .use(router)
  .mount('#app')

export { THREE, OrbitControls, CSS3DObject, CSS3DRenderer }
