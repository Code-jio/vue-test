<template>
  <div class="webgl-container">
    <canvas ref="canvasRef" class="webgl-canvas" id="container" />
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
// import { Workbox } from 'workbox-window' // 暂时注释掉

const canvasRef = ref(null);
const fps = ref(0);
const drawCalls = ref(0);

onMounted(async () => {
  const engine = new EngineKernel.BaseCore({
    pluginsParams: [
      {
        name: "ResourceReaderPlugin",
        path: "/plugins/ResourceReaderPlugin",
        supportedFormats: ["gltf", "fbx"],
        pluginClass: EngineKernel.ResourceReaderPlugin,
        userData: {
          url: "/static",
        },
      },
      {
        name: "BaseScene",
        path: "/plugins/scene",
        pluginClass: EngineKernel.BaseScene,
        userData: {
          rendererConfig: {
            container: document.getElementById("container"),
          },
        },
      },
    ],
  }).register({
    name: "RenderLoopPlugin",
    path: "/plugins/webgl/renderLoop",
    pluginClass: EngineKernel.RenderLoop,
    userData: {},
  });

  let baseScene = engine.getPlugin("BaseScene");
  console.log("🚀 ~ engine:", engine);
  console.log(baseScene, "基础场景插件");

  engine.register({
    name: "orbitControl",
    path: "/plugin/webgl/renderLoop",
    pluginClass: EngineKernel.orbitControls,
    userData: {
      camera: baseScene.camera,
      domElement: baseScene.renderer.domElement,
    },
  });

  engine.on("init-complete", () => {
    let gltfLoader = engine.getPlugin("ResourceReaderPlugin").gltfLoader;

    gltfLoader.load("/static/model/Horse.glb", (gltf) => {
      console.log("gltf", gltf);
      gltf.scene.scale.set(0.01, 0.01, 0.01); // 调整模型大小
      gltf.scene.position.set(0, 0, 0);

      // 调试模型材质
      gltf.scene.traverse((child) => {
        if (child.material) {
          child.material.needsUpdate = true;
        }
      });

      // 添加模型到场景
      engine.getPlugin("BaseScene").scene.add(gltf.scene);
    });

    // 渲染循环
    engine.getPlugin("RenderLoopPlugin").initialize();
  });


  // 在WebGLTestView.vue中添加调试代码
  const cache = await caches.keys();
  console.log('Active Caches:', cache);

  // 检查特定资源缓存状态
  const response = await caches.match('/static/model/Horse.gltf');
  console.log('Cache Status:', response ? 'Cached' : 'Missed');
});
</script>

<style scoped>
#container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  z-index: -1;

  background: #ffffff;
  /* 白色背景 */
}
</style>
