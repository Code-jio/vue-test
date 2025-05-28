<template>
  <div class="tag-media" id="vue-media-1">
    <h4>🎬 媒体展示</h4>
    <div class="media-content">
      <div class="video-placeholder" @click="playVideo">
        <div class="play-button">▶️</div>
        <span>点击播放视频</span>
      </div>
      <div class="media-info">
        <p>分辨率: 1920x1080</p>
        <p>时长: {{ videoDuration }}</p>
        <p>格式: MP4</p>
        <p>状态: {{ playbackStatus }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const videoDuration = ref('02:34')
const playbackStatus = ref('暂停中')

const playVideo = () => {
  playbackStatus.value = playbackStatus.value === '播放中' ? '暂停中' : '播放中'
  console.log('🎬 视频播放状态:', playbackStatus.value)
  alert(`视频${playbackStatus.value === '播放中' ? '开始播放' : '已暂停'}`)
}

// 暴露方法供外部调用
defineExpose({
  playVideo
})
</script>

<style scoped>
/* 媒体样式 */
.tag-media {
  background: #1a1a1a;
  color: white;
  border-radius: 8px;
  padding: 16px;
  max-width: 300px;
}

.tag-media h4 {
  margin: 0 0 16px 0;
  color: #fff;
}

.media-content {
  width: 100%;
}

.video-placeholder {
  background: #333;
  height: 100px;
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s;
  margin-bottom: 12px;
  border: 2px solid transparent;
}

.video-placeholder:hover {
  background: #444;
  border-color: #666;
}

.play-button {
  font-size: 24px;
  margin-bottom: 8px;
  transition: transform 0.3s;
}

.video-placeholder:hover .play-button {
  transform: scale(1.2);
}

.video-placeholder span {
  font-size: 12px;
  color: #ccc;
}

.media-info {
  font-size: 12px;
  color: #ccc;
}

.media-info p {
  margin: 4px 0;
  padding: 2px 0;
  border-bottom: 1px solid #333;
}

.media-info p:last-child {
  border-bottom: none;
}
</style> 