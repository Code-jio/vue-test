<script setup>
import { ref } from 'vue'

const showNav = ref(false)

const toggleNav = () => {
  showNav.value = !showNav.value
}
</script>

<template>
  <div id="app">
    <!-- 导航菜单 -->
    <nav class="app-nav" v-if="showNav">
      <div class="nav-brand">🚀 EngineKernel</div>
      <div class="nav-links">
        <router-link to="/engine-prototype" class="nav-link" active-class="active">
          🔧 引擎原型测试
        </router-link>
        <router-link to="/webgl-test" class="nav-link" active-class="active">
          🎮 WebGL测试
        </router-link>
        <router-link to="/text-marker-test" class="nav-link" active-class="active">
          📝 图文标注测试
        </router-link>
        <router-link to="/hdr-sky-test" class="nav-link" active-class="active">
          🌅 HDR天空盒测试
        </router-link>
        <router-link to="/css3d-example" class="nav-link" active-class="active">
          🎨 CSS3D示例
        </router-link>
      </div>
      <button class="nav-toggle" @click="toggleNav">{{ showNav ? '隐藏' : '显示' }}</button>
    </nav>
    
    <!-- 折叠的导航按钮 -->
    <button v-if="!showNav" class="nav-toggle-mini" @click="toggleNav">📋</button>

    <!-- 路由视图 -->
    <router-view />
  </div>
</template>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  width: 100vw;
  height: 100vh;
  margin: 0;
  padding: 0;
  position: relative;
}

.app-nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 60px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid #e0e0e0;
  display: flex;
  align-items: center;
  padding: 0 20px;
  z-index: 1001;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.nav-brand {
  font-size: 18px;
  font-weight: bold;
  color: #2c3e50;
  margin-right: auto;
}

.nav-links {
  display: flex;
  gap: 20px;
  margin-right: 20px;
}

.nav-link {
  padding: 8px 16px;
  text-decoration: none;
  color: #666;
  border-radius: 6px;
  transition: all 0.2s;
  font-size: 14px;
  font-weight: 500;
}

.nav-link:hover {
  background: #f5f5f5;
  color: #2c3e50;
}

.nav-link.active {
  background: #007bff;
  color: white;
}

.nav-toggle {
  padding: 6px 12px;
  background: #6c757d;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: background 0.2s;
}

.nav-toggle:hover {
  background: #5a6268;
}

.nav-toggle-mini {
  position: fixed;
  top: 15px;
  left: 15px;
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid #ddd;
  border-radius: 50%;
  cursor: pointer;
  z-index: 1001;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.2s;
}

.nav-toggle-mini:hover {
  background: white;
  transform: scale(1.05);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .app-nav {
    height: auto;
    flex-direction: column;
    padding: 10px;
  }
  
  .nav-brand {
    margin-bottom: 10px;
  }
  
  .nav-links {
    flex-wrap: wrap;
    gap: 10px;
    margin-right: 0;
    margin-bottom: 10px;
  }
  
  .nav-link {
    padding: 6px 12px;
    font-size: 12px;
  }
}
</style>
