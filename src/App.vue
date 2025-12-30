<template>
  <div id="app">
    <div class="main-layout">
      <!-- 左侧设备信息面板 -->
      <aside class="sidebar">
        <DevicePanel @connection-change="onConnectionChange" />
      </aside>
      
      <!-- 右侧可视化面板 -->
      <main class="content">
        <LichtblickViewer src="/lichtblick/.webpack/index.html" />
      </main>
    </div>
  </div>
</template>

<script>
import DevicePanel from './components/DevicePanel.vue';
import LichtblickViewer from './components/LichtblickViewer.vue';

export default {
  name: 'App',
  components: {
    DevicePanel,
    LichtblickViewer
  },
  methods: {
    onConnectionChange(isConnected) {
      console.log('Connection status:', isConnected);
    }
  }
};
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  width: 100%;
  height: 100%;
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

#app {
  width: 100%;
  height: 100%;
  background: #f8fafc;
}

.main-layout {
  display: flex;
  width: 100%;
  height: 100%;
}

.sidebar {
  width: 320px;
  min-width: 280px;
  max-width: 400px;
  height: 100%;
  border-right: 1px solid #e2e8f0;
  flex-shrink: 0;
}

.content {
  flex: 1;
  height: 100%;
  overflow: hidden;
}
</style>
