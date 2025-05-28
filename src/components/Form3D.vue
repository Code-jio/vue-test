<template>
  <div class="tag-form" id="vue-form-1">
    <h4>3D表单测试</h4>
    <div class="form-group">
      <label>用户名:</label>
      <input v-model="formData.username" placeholder="输入用户名" />
    </div>
    <div class="form-group">
      <label>邮箱:</label>
      <input v-model="formData.email" type="email" placeholder="输入邮箱" />
    </div>
    <div class="form-actions">
      <button @click="submitForm" class="submit-btn">提交</button>
      <button @click="resetForm" class="reset-btn">重置</button>
    </div>
  </div>
</template>

<script setup>
import { reactive } from 'vue'

const formData = reactive({
  username: '',
  email: ''
})

const submitForm = () => {
  console.log('📝 表单提交:', formData)
  alert(`提交成功！用户名: ${formData.username}`)
}

const resetForm = () => {
  formData.username = ''
  formData.email = ''
  console.log('🔄 表单已重置')
}
</script>

<style scoped>
/* 表单样式 */
.tag-form {
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 16px;
  max-width: 300px;
}

.tag-form h4 {
  margin: 0 0 16px 0;
  color: #333;
}

.form-group {
  margin-bottom: 12px;
}

.form-group label {
  display: block;
  margin-bottom: 4px;
  font-weight: 500;
  color: #495057;
}

.form-group input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 14px;
  box-sizing: border-box;
}

.form-actions {
  display: flex;
  gap: 8px;
  margin-top: 16px;
}

.submit-btn {
  background: #28a745;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  flex: 1;
}

.submit-btn:hover {
  background: #218838;
}

.reset-btn {
  background: #6c757d;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  flex: 1;
}

.reset-btn:hover {
  background: #5a6268;
}
</style> 