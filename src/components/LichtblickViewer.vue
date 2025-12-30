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
            <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
            <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
            <path d="M16 21h5v-5" />
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
      <iframe 
        ref="iframe"
        :src="iframeSrc"
        frameborder="0"
        allowfullscreen
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
      isFullscreen: false
    };
  },
  computed: {
    iframeSrc() {
      return this.src;
    }
  },
  mounted() {
    document.addEventListener('fullscreenchange', () => {
      this.isFullscreen = !!document.fullscreenElement;
    });
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
  padding: 12px 16px;
  background: #ffffff;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.viewer-header h3 {
  margin: 0;
  font-size: 16px;
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
</style>
