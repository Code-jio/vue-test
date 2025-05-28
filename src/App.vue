<script setup>
// 使用路由系统，不需要直接导入组件
</script>

<template>
  <div id="app">
    <!-- 导航菜单 -->
    <nav class="nav-menu" v-if="$route.path !== '/engine-prototype'">
      <div class="nav-container">
        <h1 class="nav-title">三维引擎测试平台</h1>
        <div class="nav-links">
          <router-link to="/engine-prototype" class="nav-link">引擎原型测试</router-link>
          <router-link to="/webgl-test" class="nav-link">WebGL基础测试</router-link>
        </div>
      </div>
    </nav>

    <!-- 路由视图 -->
    <router-view />
  </div>
</template>

<style scoped>
#app {
  width: 100%;
  height: 100vh;
  margin: 0;
  padding: 0;
}

.nav-menu {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background: rgba(33, 37, 41, 0.95);
  backdrop-filter: blur(10px);
  z-index: 1001;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.nav-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 24px;
  max-width: 1200px;
  margin: 0 auto;
}

.nav-title {
  color: #ffffff;
  font-size: 18px;
  font-weight: 600;
  margin: 0;
}

.nav-links {
  display: flex;
  gap: 20px;
}

.nav-link {
  color: #ffffff;
  text-decoration: none;
  padding: 8px 16px;
  border-radius: 4px;
  font-size: 14px;
  transition: all 0.2s;
  border: 1px solid transparent;
}

.nav-link:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.2);
}

.nav-link.router-link-active {
  background: #007bff;
  border-color: #007bff;
}
</style>
