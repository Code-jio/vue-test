import { createRouter, createWebHistory } from 'vue-router'
import WebGLTestView from '@/views/WebGLTestView.vue'
import EnginePrototypeView from '@/views/EnginePrototypeView.vue'

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
    }
  ]
})

export default router