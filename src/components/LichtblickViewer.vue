<template>
  <div class="lichtblick-viewer">
    <div class="viewer-header">
      <h3>可视化面板</h3>
      <div class="viewer-controls">
        <button class="icon-btn" title="刷新" @click="reloadIframe">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
          </svg>
        </button>
        <button class="icon-btn" title="全屏" @click="toggleFullscreen">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M8 3H5a2 2 0 0 0-2 2v3" />
            <path d="M21 8V5a2 2 0 0 0-2-2h-3" />
            <path d="M3 16v3a2 2 0 0 0 2 2h3" />
            <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
          </svg>
        </button>
      </div>
    </div>
    <div ref="viewerContent" class="viewer-content">
      <!-- 移动端/Capacitor 环境显示不支持提示 -->
      <div v-if="showMobileWarning" class="mobile-warning">
        <div class="warning-icon">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <circle cx="12" cy="12" r="10" />
            <line
              x1="12"
              y1="8"
              x2="12"
              y2="12"
            />
            <line
              x1="12"
              y1="16"
              x2="12.01"
              y2="16"
            />
          </svg>
        </div>
        <h4>3D 可视化暂不支持移动端</h4>
        <p>Lichtblick 需要 WebGL 和 SharedArrayBuffer 支持，这些功能在移动端浏览器中受限。</p>
        <p>请使用桌面版（Linux/Windows）获得完整体验。</p>
        <button class="btn btn-secondary" @click="tryLoadAnyway">
          仍然尝试加载
        </button>
      </div>
      <!-- 正常显示 iframe -->
      <template v-else>
        <iframe 
          ref="iframe"
          :src="iframeSrc"
          frameborder="0"
          allowfullscreen
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen; webgl; webgl2"
          @load="onIframeLoad"
          @error="onIframeError"
        ></iframe>
        <div v-if="isLoading" class="loading-overlay">
          <div class="spinner"></div>
          <span>加载中...</span>
        </div>
        <div v-if="hasError" class="error-overlay">
          <span>加载失败，请检查文件路径</span>
          <button class="btn btn-primary" @click="reloadIframe">
            重试
          </button>
        </div>
      </template>
    </div>
  </div>
</template>

<script>
export default {
  name: 'LichtblickViewer',
  props: {
    src: {
      type: String,
      default: '/lichtblick/.webpack/index.html'
    }
  },
  data() {
    return {
      isLoading: true,
      hasError: false,
      isFullscreen: false,
      isMobile: false,
      isCapacitor: false,
      forceLoad: false  // 强制加载（即使在移动端）
    };
  },
  computed: {
    // 是否显示移动端警告
    showMobileWarning() {
      return this.isCapacitor && !this.forceLoad;
    },
    iframeSrc() {
      // 检测运行环境
      const isElectron = typeof window !== 'undefined' && window.process && window.process.type === 'renderer';
      const isCapacitor = typeof window !== 'undefined' && typeof window.Capacitor !== 'undefined';
      const isProduction = process.env.NODE_ENV === 'production';
      
      // 在 Capacitor (Android/iOS) 环境中
      if (isCapacitor) {
        // Capacitor 使用 http://localhost/ 作为基础 URL
        // 直接使用绝对路径，Capacitor 会正确处理
        if (this.src.startsWith('/')) {
          return this.src;
        }
        return '/' + this.src;
      }
      
      // 在 Electron 生产环境中，使用相对路径（因为 file:// 协议不支持绝对路径）
      if (isElectron || isProduction) {
        // 将绝对路径转换为相对路径
        if (this.src.startsWith('/')) {
          return '.' + this.src;
        }
      }
      return this.src;
    }
  },
  mounted() {
    // 检测是否为移动端或 Capacitor 环境
    this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    this.isCapacitor = typeof window.Capacitor !== 'undefined';
    
    document.addEventListener('fullscreenchange', () => {
      this.isFullscreen = !!document.fullscreenElement;
    });
    
    // 设置一个超时检测，如果 iframe 加载时间过长可能是有问题
    setTimeout(() => {
      if (this.isLoading && (this.isMobile || this.isCapacitor)) {
        console.warn('Lichtblick 在移动设备上加载超时，WebGL 可能不被支持');
      }
    }, 10000);
  },
  methods: {
    onIframeLoad() {
      this.isLoading = false;
      this.hasError = false;
    },
    onIframeError() {
      this.isLoading = false;
      this.hasError = true;
    },
    reloadIframe() {
      this.isLoading = true;
      this.hasError = false;
      const iframe = this.$refs.iframe;
      if (iframe) {
        const currentSrc = iframe.src.split('?')[0];
        iframe.src = currentSrc + '?t=' + Date.now();
      }
    },
    tryLoadAnyway() {
      // 强制加载 iframe，即使在移动端
      this.forceLoad = true;
      this.isLoading = true;
    },
    toggleFullscreen() {
      const container = this.$refs.viewerContent;
      if (!container) {
        return;
      }

      if (!document.fullscreenElement) {
        container.requestFullscreen().then(() => {
          this.isFullscreen = true;
        }).catch(err => {
          console.error('Fullscreen error:', err);
        });
      } else {
        document.exitFullscreen().then(() => {
          this.isFullscreen = false;
        });
      }
    }
  }
};
</script>

<style scoped>
.lichtblick-viewer {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #f8fafc;
}

.viewer-header {
  padding: 6px 16px;
  background: #ffffff;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.viewer-header h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 500;
  color: #1e293b;
}

.viewer-controls {
  display: flex;
  gap: 8px;
}

.icon-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s;
}

.icon-btn:hover {
  background: #e2e8f0;
  color: #1e293b;
}

.viewer-content {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.viewer-content iframe {
  width: 100%;
  height: 100%;
  border: none;
}

.loading-overlay,
.error-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(248, 250, 252, 0.95);
  gap: 16px;
}

.loading-overlay span,
.error-overlay span {
  color: #64748b;
  font-size: 14px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e2e8f0;
  border-top-color: #6366f1;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: #6366f1;
  color: #fff;
}

.btn-primary:hover {
  background: #5558e3;
}

.btn-secondary {
  background: #e2e8f0;
  color: #475569;
}

.btn-secondary:hover {
  background: #cbd5e1;
}

/* 移动端警告样式 */
.mobile-warning {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #f8fafc;
  padding: 24px;
  text-align: center;
}

.mobile-warning .warning-icon {
  color: #f59e0b;
  margin-bottom: 16px;
}

.mobile-warning h4 {
  margin: 0 0 12px 0;
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
}

.mobile-warning p {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #64748b;
  max-width: 300px;
}

.mobile-warning .btn {
  margin-top: 16px;
}
</style>
