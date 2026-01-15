<template>
  <div id="app">
    <div class="main-layout">
      <!-- 左侧设备信息面板 -->
      <aside class="sidebar">
        <DevicePanel 
          ref="devicePanel"
          @connection-change="onConnectionChange" 
        />
      </aside>
      
      <!-- 右侧面板区域 -->
      <main class="content">
        <!-- 标签页头部 -->
        <div class="tab-header">
          <button 
            class="tab-btn"
            :class="{ active: activeTab === 'visualizer' }"
            @click="activeTab = 'visualizer'"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <rect
                x="2"
                y="3"
                width="20"
                height="14"
                rx="2"
                ry="2"
              />
              <line
                x1="8"
                y1="21"
                x2="16"
                y2="21"
              />
              <line
                x1="12"
                y1="17"
                x2="12"
                y2="21"
              />
            </svg>
            可视化面板
          </button>
          <button 
            class="tab-btn"
            :class="{ active: activeTab === 'keyposes' }"
            @click="activeTab = 'keyposes'"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
              <line
                x1="8"
                y1="2"
                x2="8"
                y2="18"
              />
              <line
                x1="16"
                y1="6"
                x2="16"
                y2="22"
              />
            </svg>
            拓扑航点面板
          </button>
        </div>
        
        <!-- 面板内容区域 - 使用v-show保持状态 -->
        <div class="tab-content">
          <div v-show="activeTab === 'visualizer'" class="tab-panel">
            <LichtblickViewer src="/lichtblick/.webpack/index.html" />
          </div>
          <div v-show="activeTab === 'keyposes'" class="tab-panel">
            <KeyposesViewer :ros="rosConnection" />
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script>
import DevicePanel from './components/DevicePanel.vue';
import LichtblickViewer from './components/LichtblickViewer.vue';
import KeyposesViewer from './components/KeyposesViewer.vue';

export default {
  name: 'App',
  components: {
    DevicePanel,
    LichtblickViewer,
    KeyposesViewer
  },
  data() {
    return {
      activeTab: 'visualizer',
      rosConnection: null
    };
  },
  methods: {
    onConnectionChange(isConnected, ros) {
      console.log('Connection status:', isConnected);
      this.rosConnection = isConnected ? ros : null;
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
  display: flex;
  flex-direction: column;
}

.tab-header {
  display: flex;
  background: #2d2d2d;
  border-bottom: 1px solid #404040;
  padding: 0;
  flex-shrink: 0;
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 16px;
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  color: #9ca3af;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.tab-btn:hover {
  background: #3d3d3d;
  color: #e0e0e0;
}

.tab-btn.active {
  background: #1e1e1e;
  color: #e0e0e0;
  border-bottom-color: #3b82f6;
}

.tab-content {
  flex: 1;
  overflow: hidden;
  position: relative;
}

.tab-panel {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
}
</style>
