import { createRouter, createWebHistory } from 'vue-router'
import WebGLTestView from '@/views/WebGLTestView.vue'
import EnginePrototypeView from '@/views/EnginePrototypeView.vue'
import CSS3DExampleView from '@/views/CSS3DExample.vue'
import TextMarkerTestView from '@/views/TextMarkerTestView.vue'
import HDRSkyTestView from '@/views/HDRSkyTest.vue'
import HDRSkyBasicExampleView from '@/views/HDRSkyBasicExample.vue'
import ModelLoadTestView from '@/views/ModelLoadTest.vue'
import AsyncLoadingTestView from '@/views/AsyncLoadingTestView.vue'
// import CSS3DAdvancedView from '@/views/CSS3DAdvanced.vue'
import DefaultViews from '@/views/DefaultViews.vue'


const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/default'
    },
    {
      path: '/webgl-test',
      name: 'webgl-test',
      component: WebGLTestView,
      // beforeEnter: (to, from, next) => {
      //   if (!window.WebGLRenderingContext) {
      //     next('/')
      //     return
      //   }
      //   next()
      // }
    },
    {
      path: '/engine-prototype',
      name: 'engine-prototype',
      component: EnginePrototypeView,
      meta: {
        title: '引擎原型测试'
      }
    },
    {
      path: '/css3d-example',
      name: 'css3d-example',
      component: CSS3DExampleView,
      meta: {
        title: 'CSS3D示例'
      }
    },
    {
      path: '/text-marker-test',
      name: 'text-marker-test',
      component: TextMarkerTestView,
      meta: {
        title: '图文标注测试'
      }
    },
    {
      path: '/hdr-sky-test',
      name: 'hdr-sky-test',
      component: HDRSkyTestView,
      // component: HDRSkyBasicExampleView,
      meta: {
        title: 'HDR天空盒测试'
      }
    },
    {
      path: '/model-load-test',
      name: 'model-load-test',
      component: ModelLoadTestView,
      meta: {
        title: '模型加载性能测试'
      }
    },
    {
      path: '/async-loading-test',
      name: 'async-loading-test',
      component: AsyncLoadingTestView,
      meta: {
        title: '异步模型加载测试'
      }
    },
    // {
    //   path:"/css3d-advanced",
    //   name:"css3d-advanced",
    //   component:CSS3DAdvancedView,
    //   meta:{
    //     title:"CSS3D高级案例"
    //   }
    // }
    {
      path: '/default',
      name: 'default',
      component: DefaultViews,
      meta: {
        title: '默认场景'
      }
    }
  ]
})

export default router