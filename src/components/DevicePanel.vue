<template>
  <div class="device-panel">
    <div class="panel-header">
      <h2>设备信息</h2>
      <div class="connection-status" :class="{ connected: isConnected }">
        <span class="status-dot"></span>
        <span>{{ isConnected ? '已连接' : '未连接' }}</span>
      </div>
    </div>

    <div class="panel-content">
      <!-- 连接配置 -->
      <div class="section">
        <h3>连接配置</h3>
        <div class="form-group">
          <label>ROS Bridge URL</label>
          <input 
            v-model="rosUrl" 
            type="text" 
            placeholder="ws://localhost:9090"
            :disabled="isConnected"
          />
        </div>
        <button 
          class="btn" 
          :class="isConnected ? 'btn-danger' : 'btn-primary'"
          @click="toggleConnection"
        >
          {{ isConnected ? '断开连接' : '连接' }}
        </button>
      </div>

      <!-- 设备状态 -->
      <div class="section">
        <h3>设备状态</h3>
        <div class="info-grid">
          <div class="info-item">
            <span class="label">设备名称</span>
            <span class="value">{{ deviceInfo.name }}</span>
          </div>
          <div class="info-item">
            <span class="label">设备ID</span>
            <span class="value">{{ deviceInfo.id }}</span>
          </div>
          <div class="info-item">
            <span class="label">运行状态</span>
            <span class="value" :class="statusClass">{{ deviceInfo.status }}</span>
          </div>
          <div class="info-item">
            <span class="label">电池电量</span>
            <div class="battery-bar">
              <div class="battery-level" :style="{ width: deviceInfo.battery + '%' }"></div>
              <span class="battery-text">{{ deviceInfo.battery }}%</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 位置信息 -->
      <div class="section">
        <h3>位置信息</h3>
        <div class="info-grid">
          <div class="info-item">
            <span class="label">X</span>
            <span class="value">{{ position.x.toFixed(3) }} m</span>
          </div>
          <div class="info-item">
            <span class="label">Y</span>
            <span class="value">{{ position.y.toFixed(3) }} m</span>
          </div>
          <div class="info-item">
            <span class="label">Z</span>
            <span class="value">{{ position.z.toFixed(3) }} m</span>
          </div>
          <div class="info-item">
            <span class="label">航向角</span>
            <span class="value">{{ position.yaw.toFixed(1) }}°</span>
          </div>
        </div>
      </div>

      <!-- 传感器状态 -->
      <div class="section">
        <h3>传感器状态</h3>
        <div class="sensor-list">
          <div 
            v-for="sensor in sensors" 
            :key="sensor.name" 
            class="sensor-item"
          >
            <span class="sensor-dot" :class="sensor.status"></span>
            <span class="sensor-name">{{ sensor.name }}</span>
            <span class="sensor-status">{{ sensor.statusText }}</span>
          </div>
        </div>
      </div>

      <!-- 快捷操作 -->
      <div class="section">
        <h3>快捷操作</h3>
        <div class="action-buttons">
          <button class="btn btn-secondary" @click="resetOdom">
            重置里程计
          </button>
          <button class="btn btn-secondary" @click="emergencyStop">
            紧急停止
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'DevicePanel',
  emits: ['connection-change'],
  data() {
    return {
      rosUrl: 'ws://localhost:9090',
      isConnected: false,
      deviceInfo: {
        name: 'Sea-Robot-01',
        id: 'SR-2024-001',
        status: '待机中',
        battery: 85
      },
      position: {
        x: 0,
        y: 0,
        z: 0,
        yaw: 0
      },
      sensors: [
        { name: 'LiDAR', status: 'online', statusText: '正常' },
        { name: 'IMU', status: 'online', statusText: '正常' },
        { name: 'GPS', status: 'warning', statusText: '信号弱' },
        { name: '摄像头', status: 'online', statusText: '正常' },
        { name: '声呐', status: 'offline', statusText: '离线' }
      ]
    };
  },
  computed: {
    statusClass() {
      const statusMap = {
        '运行中': 'status-running',
        '待机中': 'status-idle',
        '故障': 'status-error',
        '充电中': 'status-charging'
      };
      return statusMap[this.deviceInfo.status] || '';
    }
  },
  methods: {
    toggleConnection() {
      if (this.isConnected) {
        this.disconnect();
      } else {
        this.connect();
      }
    },
    connect() {
      // TODO: 实现 ROS 连接逻辑
      console.log('Connecting to:', this.rosUrl);
      this.isConnected = true;
      this.$emit('connection-change', true);
    },
    disconnect() {
      // TODO: 实现断开连接逻辑
      console.log('Disconnecting...');
      this.isConnected = false;
      this.$emit('connection-change', false);
    },
    resetOdom() {
      console.log('Reset odometry');
      // TODO: 发送重置里程计命令
    },
    emergencyStop() {
      console.log('Emergency stop!');
      // TODO: 发送紧急停止命令
    }
  }
};
</script>

<style scoped>
.device-panel {
  height: 100%;
  background: #ffffff;
  color: #1f2937;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.panel-header {
  padding: 16px 20px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.panel-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1e293b;
}

.connection-status {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #64748b;
}

.connection-status.connected {
  color: #16a34a;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #94a3b8;
}

.connection-status.connected .status-dot {
  background: #16a34a;
  box-shadow: 0 0 8px #16a34a;
}

.panel-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.section {
  margin-bottom: 24px;
}

.section h3 {
  font-size: 14px;
  font-weight: 500;
  color: #64748b;
  margin: 0 0 12px 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.form-group {
  margin-bottom: 12px;
}

.form-group label {
  display: block;
  font-size: 12px;
  color: #64748b;
  margin-bottom: 6px;
}

.form-group input {
  width: 100%;
  padding: 10px 12px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  color: #1e293b;
  font-size: 14px;
  transition: border-color 0.2s;
}

.form-group input:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.form-group input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  background: #f1f5f9;
}

.btn {
  padding: 10px 16px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  width: 100%;
}

.btn-primary {
  background: #6366f1;
  color: #fff;
}

.btn-primary:hover {
  background: #5558e3;
}

.btn-danger {
  background: #ef4444;
  color: #fff;
}

.btn-danger:hover {
  background: #dc2626;
}

.btn-secondary {
  background: #e2e8f0;
  color: #475569;
}

.btn-secondary:hover {
  background: #cbd5e1;
}

.info-grid {
  display: grid;
  gap: 12px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  background: #f8fafc;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
}

.info-item .label {
  font-size: 13px;
  color: #64748b;
}

.info-item .value {
  font-size: 14px;
  font-weight: 500;
  color: #1e293b;
}

.status-running {
  color: #16a34a !important;
}

.status-idle {
  color: #d97706 !important;
}

.status-error {
  color: #dc2626 !important;
}

.status-charging {
  color: #2563eb !important;
}

.battery-bar {
  width: 100px;
  height: 20px;
  background: #e2e8f0;
  border-radius: 4px;
  position: relative;
  overflow: hidden;
}

.battery-level {
  height: 100%;
  background: linear-gradient(90deg, #22c55e, #16a34a);
  border-radius: 4px;
  transition: width 0.3s;
}

.battery-text {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 11px;
  font-weight: 600;
  color: #1e293b;
}

.sensor-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.sensor-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: #f8fafc;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
}

.sensor-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.sensor-dot.online {
  background: #16a34a;
  box-shadow: 0 0 6px #16a34a;
}

.sensor-dot.warning {
  background: #d97706;
  box-shadow: 0 0 6px #d97706;
}

.sensor-dot.offline {
  background: #94a3b8;
}

.sensor-name {
  flex: 1;
  font-size: 14px;
  color: #1e293b;
}

.sensor-status {
  font-size: 12px;
  color: #64748b;
}

.action-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.action-buttons .btn {
  width: auto;
}

/* 滚动条样式 */
.panel-content::-webkit-scrollbar {
  width: 6px;
}

.panel-content::-webkit-scrollbar-track {
  background: #f1f5f9;
}

.panel-content::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

.panel-content::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
</style>
