import { createRouter, createWebHistory } from 'vue-router'
import WebGLTestView from '@/views/WebGLTestView.vue'
import EnginePrototypeView from '@/views/EnginePrototypeView.vue'
import CSS3DExampleView from '@/views/CSS3DExample.vue'
// import CSS3DAdvancedView from '@/views/CSS3DAdvanced.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/engine-prototype'
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
    // {
    //   path:"/css3d-advanced",
    //   name:"css3d-advanced",
    //   component:CSS3DAdvancedView,
    //   meta:{
    //     title:"CSS3D高级案例"
    //   }
    // }
  ]
})

export default router