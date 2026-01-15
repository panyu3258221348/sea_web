<template>
  <div class="keyposes-viewer">
    <div class="viewer-header">
      <h3>拓扑航点面板</h3>
      <div class="viewer-controls">
        <button class="icon-btn" title="重置视图" @click="resetView">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
          </svg>
        </button>
        <button class="icon-btn" title="加载地图" @click="loadMapFromROS">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line
              x1="12"
              y1="15"
              x2="12"
              y2="3"
            />
          </svg>
        </button>
        <button class="icon-btn" title="刷新航点" @click="loadNodes">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <circle cx="12" cy="12" r="3" />
            <path d="M12 2v4m0 12v4M2 12h4m12 0h4" />
          </svg>
        </button>
      </div>
    </div>
    <div ref="viewerContent" class="viewer-content">
      <div 
        ref="mapContainer"
        class="map-container"
        @wheel="handleWheel"
        @mousedown="handleMouseDown"
        @mousemove="handleMouseMove"
        @mouseup="handleMouseUp"
        @mouseleave="handleMouseUp"
        @touchstart="handleTouchStart"
        @touchmove="handleTouchMove"
        @touchend="handleTouchEnd"
      >
        <!-- 地图和航点图层 -->
        <div class="map-layer" :style="layerStyle">
          <canvas ref="mapCanvas" class="map-canvas"></canvas>
          <!-- SVG 航点图层 -->
          <svg 
            v-if="hasMap" 
            class="nodes-svg"
            :width="mapWidth" 
            :height="mapHeight"
            :viewBox="`0 0 ${mapWidth} ${mapHeight}`"
          >
            <!-- 箭头定义 -->
            <defs>
              <marker
                id="arrowhead"
                markerWidth="4"
                markerHeight="3"
                refX="3.5"
                refY="1.5"
                orient="auto"
              >
                <polygon points="0 0, 4 1.5, 0 3" fill="#22c55e" />
              </marker>
            </defs>
            <!-- 邻居连接线 -->
            <g v-for="(node, nodeId) in nodes" :key="'edge-' + nodeId">
              <line
                v-for="neighborId in (node.neighbors || [])"
                :key="nodeId + '-' + neighborId"
                :x1="worldToCanvasX(node.pose.position.x)"
                :y1="worldToCanvasY(node.pose.position.y)"
                :x2="getLineEndX(nodeId, neighborId)"
                :y2="getLineEndY(nodeId, neighborId)"
                stroke="#22c55e"
                stroke-width="0.5"
                marker-end="url(#arrowhead)"
              />
            </g>
            <!-- 航点圆点 -->
            <g v-for="(node, nodeId) in nodes" :key="'node-' + nodeId">
              <circle
                :cx="worldToCanvasX(node.pose.position.x)"
                :cy="worldToCanvasY(node.pose.position.y)"
                r="3"
                fill="#3b82f6"
                stroke="#fff"
                stroke-width="0.5"
                class="node-circle"
                @click.stop="selectNode(nodeId)"
              />
            </g>
          </svg>
        </div>
        <!-- 无地图提示 -->
        <div v-if="!hasMap" class="no-map-overlay">
          <div v-if="isLoadingMap" class="loading-state">
            <div class="spinner"></div>
            <p>正在加载地图...</p>
            <p class="hint">
              从 /map 话题获取数据中
            </p>
          </div>
          <div v-else-if="loadError" class="error-state">
            <div class="error-icon">
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
            <p>{{ loadError }}</p>
            <button class="retry-btn" @click="loadMapFromROS">
              重新加载
            </button>
          </div>
          <div v-else class="empty-state">
            <div class="no-map-icon">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="64"
                height="64"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
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
            </div>
            <p>暂无地图数据</p>
            <p class="hint">
              连接ROS后会自动加载，或点击右上角按钮手动加载
            </p>
          </div>
        </div>
      </div>
      <!-- 缩放信息 -->
      <div class="zoom-info">
        <span>缩放: {{ (scale * 100).toFixed(0) }}%</span>
        <span>旋转: {{ rotation.toFixed(1) }}°</span>
        <span v-if="Object.keys(nodes).length">航点: {{ Object.keys(nodes).length }}</span>
      </div>
    </div>

    <!-- 航点详情弹窗 -->
    <NodeEditDialog
      :show="!!selectedNode"
      :node-id="selectedNode"
      :node-data="selectedNode ? nodes[selectedNode] : null"
      :all-nodes="nodes"
      @close="closeNodeDetail"
      @save="saveNode"
      @delete="deleteNode"
      @add-neighbor="addNeighbor"
      @remove-neighbor="removeNeighbor"
    />
  </div>
</template>

<script>
import ROSLIB from 'roslib';
import config from '@/config';
import NodeEditDialog from './NodeEditDialog.vue';

export default {
  name: 'KeyposesViewer',
  components: {
    NodeEditDialog
  },
  props: {
    ros: {
      type: Object,
      default: null
    }
  },
  data() {
    return {
      hasMap: false,
      isLoadingMap: false,
      loadError: null,
      mapData: null,
      mapWidth: 0,
      mapHeight: 0,
      mapResolution: 0,
      mapOrigin: { x: 0, y: 0 },
      // 变换参数
      scale: 1,
      rotation: 0,
      translateX: 0,
      translateY: 0,
      // 交互状态
      isDragging: false,
      isRotating: false,
      lastMouseX: 0,
      lastMouseY: 0,
      lastTouchDistance: 0,
      lastTouchAngle: 0,
      mapTopic: null,
      // 航点数据
      nodes: {},
      selectedNode: null
    };
  },
  computed: {
    layerStyle() {
      return {
        transform: `translate(-50%, -50%) translate(${this.translateX}px, ${this.translateY}px) rotate(${this.rotation}deg) scale(${this.scale})`
      };
    }
  },
  watch: {
    ros(newRos) {
      console.log('ROS connection changed:', newRos ? 'connected' : 'disconnected');
      if (newRos && newRos.isConnected) {
        this.$nextTick(() => {
          this.loadMapFromROS();
          this.loadNodes();
        });
      } else {
        if (this.mapTopic) {
          this.mapTopic.unsubscribe();
          this.mapTopic = null;
        }
      }
    }
  },
  mounted() {
    this.$refs.mapContainer?.addEventListener('contextmenu', e => e.preventDefault());
    
    if (this.ros && this.ros.isConnected) {
      this.loadMapFromROS();
    }
    this.loadNodes();
  },
  methods: {
    // 世界坐标转Canvas坐标
    worldToCanvasX(worldX) {
      return (worldX - this.mapOrigin.x) / this.mapResolution;
    },
    worldToCanvasY(worldY) {
      return this.mapHeight - (worldY - this.mapOrigin.y) / this.mapResolution;
    },
    getNeighborX(neighborId) {
      const neighbor = this.nodes[neighborId];
      if (!neighbor) {
        return 0;
      }
      return this.worldToCanvasX(neighbor.pose.position.x);
    },
    getNeighborY(neighborId) {
      const neighbor = this.nodes[neighborId];
      if (!neighbor) {
        return 0;
      }
      return this.worldToCanvasY(neighbor.pose.position.y);
    },
    // 计算线终点（在目标圆点边缘停止，使箭头完整显示）
    getLineEndX(fromNodeId, toNodeId) {
      const fromNode = this.nodes[fromNodeId];
      const toNode = this.nodes[toNodeId];
      if (!fromNode || !toNode) {
        return 0;
      }
      const x1 = this.worldToCanvasX(fromNode.pose.position.x);
      const y1 = this.worldToCanvasY(fromNode.pose.position.y);
      const x2 = this.worldToCanvasX(toNode.pose.position.x);
      const y2 = this.worldToCanvasY(toNode.pose.position.y);
      const dx = x2 - x1;
      const dy = y2 - y1;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 1) {
        return x2;
      }
      // 在目标圆点边缘停止（圆点半径为3，留一点间隙）
      const offset = 3;
      return x2 - (dx / dist) * offset;
    },
    getLineEndY(fromNodeId, toNodeId) {
      const fromNode = this.nodes[fromNodeId];
      const toNode = this.nodes[toNodeId];
      if (!fromNode || !toNode) {
        return 0;
      }
      const x1 = this.worldToCanvasX(fromNode.pose.position.x);
      const y1 = this.worldToCanvasY(fromNode.pose.position.y);
      const x2 = this.worldToCanvasX(toNode.pose.position.x);
      const y2 = this.worldToCanvasY(toNode.pose.position.y);
      const dx = x2 - x1;
      const dy = y2 - y1;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 1) {
        return y2;
      }
      const offset = 3;
      return y2 - (dy / dist) * offset;
    },

    // 加载航点数据
    async loadNodes() {
      try {
        const response = await fetch(`${config.upload.serverUrl}/api/nodes`);
        const result = await response.json();
        if (result.success) {
          this.nodes = result.data || {};
          console.log('[KeyposesViewer] Loaded nodes:', Object.keys(this.nodes).length);
        } else {
          console.error('[KeyposesViewer] Failed to load nodes:', result.error);
        }
      } catch (error) {
        console.error('[KeyposesViewer] Error loading nodes:', error);
      }
    },

    // 选择航点
    selectNode(nodeId) {
      this.selectedNode = nodeId;
    },

    closeNodeDetail() {
      this.selectedNode = null;
    },

    async saveNode(editedData) {
      try {
        const response = await fetch(`${config.upload.serverUrl}/api/nodes/${editedData.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pose: editedData.pose,
            neighbors: editedData.neighbors
          })
        });
        const result = await response.json();
        if (result.success) {
          this.nodes[editedData.id] = {
            pose: editedData.pose,
            neighbors: editedData.neighbors
          };
          this.closeNodeDetail();
          alert('保存成功');
        } else {
          alert('保存失败: ' + result.error);
        }
      } catch (error) {
        alert('保存失败: ' + error.message);
      }
    },

    async deleteNode(nodeId) {
      if (!confirm(`确定要删除航点 "${nodeId}" 吗？`)) {
        return;
      }
      
      try {
        const response = await fetch(`${config.upload.serverUrl}/api/nodes/${nodeId}`, {
          method: 'DELETE'
        });
        const result = await response.json();
        if (result.success) {
          delete this.nodes[nodeId];
          for (const node of Object.values(this.nodes)) {
            const idx = node.neighbors?.indexOf(nodeId);
            if (idx > -1) {
              node.neighbors.splice(idx, 1);
            }
          }
          this.closeNodeDetail();
          alert('删除成功');
        } else {
          alert('删除失败: ' + result.error);
        }
      } catch (error) {
        alert('删除失败: ' + error.message);
      }
    },

    async addNeighbor(neighborId) {
      if (!neighborId || !this.selectedNode) {
        return;
      }
      try {
        const response = await fetch(`${config.upload.serverUrl}/api/nodes/${this.selectedNode}/neighbors`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ neighbor: neighborId })
        });
        const result = await response.json();
        if (result.success) {
          if (!this.nodes[this.selectedNode].neighbors) {
            this.nodes[this.selectedNode].neighbors = [];
          }
          this.nodes[this.selectedNode].neighbors.push(neighborId);
        } else {
          alert('添加失败: ' + result.error);
        }
      } catch (error) {
        alert('添加失败: ' + error.message);
      }
    },

    async removeNeighbor(neighborId) {
      if (!this.selectedNode) {
        return;
      }
      try {
        const response = await fetch(`${config.upload.serverUrl}/api/nodes/${this.selectedNode}/neighbors/${neighborId}`, {
          method: 'DELETE'
        });
        const result = await response.json();
        if (result.success) {
          const neighbors = this.nodes[this.selectedNode].neighbors;
          const idx = neighbors?.indexOf(neighborId);
          if (idx > -1) {
            neighbors.splice(idx, 1);
          }
        } else {
          alert('移除失败: ' + result.error);
        }
      } catch (error) {
        alert('移除失败: ' + error.message);
      }
    },
    // 从ROS加载地图
    loadMapFromROS() {
      if (!this.ros) {
        console.error('ROS not connected');
        this.loadError = '请先连接ROS Bridge';
        return;
      }

      if (!this.ros.isConnected) {
        console.error('ROS is not connected');
        this.loadError = 'ROS Bridge未连接';
        return;
      }

      console.log('[KeyposesViewer] Loading map from /map topic...');
      this.isLoadingMap = true;
      this.loadError = null;
      
      // 如果已有订阅，先取消
      if (this.mapTopic) {
        this.mapTopic.unsubscribe();
      }
      
      this.mapTopic = new ROSLIB.Topic({
        ros: this.ros,
        name: '/map',
        messageType: 'nav_msgs/OccupancyGrid'
      });

      let received = false;
      
      this.mapTopic.subscribe((message) => {
        if (received) {
          return;
        }
        received = true;
        
        console.log('[KeyposesViewer] Received map data:', {
          width: message.info.width,
          height: message.info.height,
          resolution: message.info.resolution
        });
        
        this.processMapData(message);
        this.isLoadingMap = false;
        this.loadError = null;
        this.mapTopic.unsubscribe();
        this.mapTopic = null;
      });

      // 10秒超时
      setTimeout(() => {
        if (!received) {
          console.error('[KeyposesViewer] Map loading timeout');
          this.isLoadingMap = false;
          this.loadError = '加载超时，请检查 /map 话题是否发布';
          if (this.mapTopic) {
            this.mapTopic.unsubscribe();
            this.mapTopic = null;
          }
        }
      }, 10000);
    },

    // 处理地图数据
    processMapData(message) {
      this.mapWidth = message.info.width;
      this.mapHeight = message.info.height;
      this.mapResolution = message.info.resolution;
      this.mapOrigin = {
        x: message.info.origin.position.x,
        y: message.info.origin.position.y
      };
      this.mapData = message.data;

      this.renderMap();
      this.hasMap = true;
      this.resetView();
    },

    // 渲染地图到Canvas
    renderMap() {
      const canvas = this.$refs.mapCanvas;
      if (!canvas || !this.mapData) {
        return;
      }

      canvas.width = this.mapWidth;
      canvas.height = this.mapHeight;

      const ctx = canvas.getContext('2d');
      const imageData = ctx.createImageData(this.mapWidth, this.mapHeight);
      const data = imageData.data;

      // 转换ROS占用栅格到RGBA
      for (let i = 0; i < this.mapData.length; i++) {
        const value = this.mapData[i];
        
        // 需要翻转Y轴（ROS地图原点在左下，Canvas在左上）
        const x = i % this.mapWidth;
        const y = Math.floor(i / this.mapWidth);
        const flippedY = this.mapHeight - 1 - y;
        const flippedIdx = (flippedY * this.mapWidth + x) * 4;

        let gray;
        if (value === -1) {
          // 未知区域 - 灰色
          gray = 128;
        } else if (value === 0) {
          // 空闲区域 - 白色
          gray = 255;
        } else {
          // 占用区域 - 根据概率变暗
          gray = Math.round(255 - (value / 100) * 255);
        }

        data[flippedIdx] = gray;
        data[flippedIdx + 1] = gray;
        data[flippedIdx + 2] = gray;
        data[flippedIdx + 3] = 255;
      }

      ctx.putImageData(imageData, 0, 0);
    },

    // 重置视图
    resetView() {
      const container = this.$refs.viewerContent;
      if (!container || !this.hasMap) {
        this.scale = 1;
        this.rotation = 0;
        this.translateX = 0;
        this.translateY = 0;
        return;
      }

      // 默认 100% 缩放，0 度旋转，居中显示
      this.scale = 1;
      this.rotation = 0;
      this.translateX = 0;
      this.translateY = 0;
    },

    // 鼠标滚轮缩放
    handleWheel(e) {
      e.preventDefault();
      
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      const newScale = Math.max(0.1, Math.min(10, this.scale * delta));
      
      // 以鼠标位置为中心缩放
      const rect = this.$refs.mapContainer.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      const scaleChange = newScale / this.scale;
      this.translateX = mouseX - (mouseX - this.translateX) * scaleChange;
      this.translateY = mouseY - (mouseY - this.translateY) * scaleChange;
      this.scale = newScale;
    },

    // 鼠标拖拽
    handleMouseDown(e) {
      if (e.button === 0) {
        // 左键 + Ctrl = 旋转
        if (e.ctrlKey || e.metaKey) {
          this.isRotating = true;
          this.lastMouseX = e.clientX;
          this.lastMouseY = e.clientY;
        } else {
          // 左键 = 平移
          this.isDragging = true;
          this.lastMouseX = e.clientX;
          this.lastMouseY = e.clientY;
        }
      } else if (e.button === 2) {
        // 右键 = 旋转
        e.preventDefault();
        this.isRotating = true;
        this.lastMouseX = e.clientX;
        this.lastMouseY = e.clientY;
      }
    },

    handleMouseMove(e) {
      if (this.isDragging) {
        // 平移
        const dx = e.clientX - this.lastMouseX;
        const dy = e.clientY - this.lastMouseY;
        this.translateX += dx;
        this.translateY += dy;
        this.lastMouseX = e.clientX;
        this.lastMouseY = e.clientY;
      } else if (this.isRotating) {
        // 旋转
        const dx = e.clientX - this.lastMouseX;
        this.rotation += dx * 0.5;
        this.lastMouseX = e.clientX;
        this.lastMouseY = e.clientY;
      }
    },

    handleMouseUp() {
      this.isDragging = false;
      this.isRotating = false;
    },

    // 触摸手势支持
    handleTouchStart(e) {
      if (e.touches.length === 1) {
        this.isDragging = true;
        this.lastMouseX = e.touches[0].clientX;
        this.lastMouseY = e.touches[0].clientY;
      } else if (e.touches.length === 2) {
        // 双指缩放/旋转
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        this.lastTouchDistance = Math.hypot(
          touch2.clientX - touch1.clientX,
          touch2.clientY - touch1.clientY
        );
        this.lastTouchAngle = Math.atan2(
          touch2.clientY - touch1.clientY,
          touch2.clientX - touch1.clientX
        ) * 180 / Math.PI;
      }
    },

    handleTouchMove(e) {
      e.preventDefault();
      
      if (e.touches.length === 1 && this.isDragging) {
        const dx = e.touches[0].clientX - this.lastMouseX;
        const dy = e.touches[0].clientY - this.lastMouseY;
        this.translateX += dx;
        this.translateY += dy;
        this.lastMouseX = e.touches[0].clientX;
        this.lastMouseY = e.touches[0].clientY;
      } else if (e.touches.length === 2) {
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        
        // 缩放
        const distance = Math.hypot(
          touch2.clientX - touch1.clientX,
          touch2.clientY - touch1.clientY
        );
        const scaleChange = distance / this.lastTouchDistance;
        this.scale = Math.max(0.1, Math.min(10, this.scale * scaleChange));
        this.lastTouchDistance = distance;
        
        // 旋转
        const angle = Math.atan2(
          touch2.clientY - touch1.clientY,
          touch2.clientX - touch1.clientX
        ) * 180 / Math.PI;
        this.rotation += angle - this.lastTouchAngle;
        this.lastTouchAngle = angle;
      }
    },

    handleTouchEnd() {
      this.isDragging = false;
    }
  }
};
</script>

<style scoped>
.keyposes-viewer {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #ffffff;
}

.viewer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: .375rem 1rem;
  background: #ffffff;
  border-bottom: .0625rem solid #e2e8f0;
}

.viewer-header h3 {
  margin: 0;
  font-size: .875rem;
  font-weight: 500;
  color: #1e293b;
}

.viewer-controls {
  display: flex;
  gap: .5rem;
}

.icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  background: #f1f5f9;
  border: .0625rem solid #e2e8f0;
  border-radius: .375rem;
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
  background: #f8fafc;
}

.map-container {
  width: 100%;
  height: 100%;
  position: relative;
  cursor: grab;
  overflow: hidden;
  background: #ffffff;
}

.map-container:active {
  cursor: grabbing;
}

.map-layer {
  position: absolute;
  top: 50%;
  left: 50%;
}

.map-canvas {
  display: block;
  image-rendering: pixelated;
  image-rendering: crisp-edges;
}

.nodes-svg {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
}

.node-circle {
  pointer-events: auto;
  cursor: pointer;
}

.node-circle:hover {
  fill: #2563eb;
}

.no-map-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #64748b;
  background: #ffffff;
}

.empty-state,
.loading-state,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.no-map-icon {
  margin-bottom: 1rem;
  color: #cbd5e1;
}

.no-map-overlay p {
  margin: .25rem 0;
  font-size: .875rem;
  color: #64748b;
}

.no-map-overlay .hint {
  font-size: .75rem;
  color: #94a3b8;
}

.spinner {
  width: 3rem;
  height: 3rem;
  border: .25rem solid #e2e8f0;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.error-icon {
  color: #ef4444;
  margin-bottom: 1rem;
}

.retry-btn {
  margin-top: .75rem;
  padding: .5rem 1rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: .25rem;
  font-size: .8125rem;
  cursor: pointer;
  transition: background 0.2s;
}

.retry-btn:hover {
  background: #2563eb;
}

.zoom-info {
  position: absolute;
  bottom: .75rem;
  right: .75rem;
  display: flex;
  gap: 1rem;
  padding: .375rem .75rem;
  background: rgba(255, 255, 255, 0.9);
  border: .0625rem solid #e2e8f0;
  border-radius: .25rem;
  font-size: .75rem;
  color: #64748b;
  box-shadow: 0 .0625rem .1875rem rgba(0, 0, 0, 0.1);
}
</style>
