import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'

const THREE = EngineKernel.THREE;
const OrbitControls = EngineKernel.OrbitControls;
const EffectComposer = EngineKernel.EffectComposer;
const RenderPass = EngineKernel.RenderPass;
const UnrealBloomPass = EngineKernel.UnrealBloomPass;
const ShaderPass = EngineKernel.ShaderPass;
const FXAAShader = EngineKernel.FXAAShader;
const OutputPass = EngineKernel.OutputPass;
const CSS2DRenderer = EngineKernel.CSS2DRenderer;
const CSS2DObject = EngineKernel.CSS2DObject;

// 全局样式
import './style/global.css'

createApp(App)
  .use(router)
  .mount('#app')

export { THREE, OrbitControls, CSS2DObject, CSS2DRenderer }
