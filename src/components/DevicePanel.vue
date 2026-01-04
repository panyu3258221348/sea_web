<template>
  <div class="device-panel">
    <div class="panel-header">
      <div class="header-title">
        <img src="@/assets/OIP.webp" alt="海恒智能" class="header-logo" />
        <h2>设备信息</h2>
      </div>
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
            placeholder="ws://localhost:8760"
            :disabled="isConnected"
          />
        </div>
        <button 
          class="btn" 
          :class="isConnected ? 'btn-danger' : 'btn-primary'"
          :disabled="isConnecting"
          @click="toggleConnection"
        >
          {{ connectButtonText }}
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

      <!-- 里程计速度 -->
      <div class="section">
        <div class="section-header">
          <h3>里程计速度</h3>
          <div class="velocity-indicator" :class="{ active: odomReceived }"></div>
        </div>
        <div class="info-grid">
          <div class="info-item">
            <span class="label">线速度</span>
            <span class="value">{{ odomVelocity.linear.toFixed(3) }} m/s</span>
          </div>
          <div class="info-item">
            <span class="label">角速度</span>
            <span class="value">{{ odomVelocity.angular.toFixed(3) }} rad/s</span>
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
          <button 
            class="btn btn-danger"
            @click="emergencyStop"
            :disabled="!isConnected"
          >
            {{ isEmergencyStop ? '取消急停' : '紧急停止' }}
          </button>
        </div>
        <button 
          class="btn" 
          :class="showKeyposes ? 'btn-success' : 'btn-secondary'"
          @click="toggleKeyposes"
          :disabled="!isConnected"
          style="margin-top: 10px;"
        >
          {{ showKeyposes ? '隐藏关键点' : '显示关键点' }}
        </button>
      </div>

      <!-- 打点信息 -->
      <div class="section">
        <h3>打点信息</h3>
        <div class="point-card">
          <div class="point-header">
            <span class="point-source">clicked_point</span>
            <span class="point-dot" :class="{ active: clickPointReceived }"></span>
          </div>
          <div class="point-coords">
            <span class="coord-item"><span class="coord-label">X:</span> {{ clickPoint.x.toFixed(2) }}</span>
            <span class="coord-item"><span class="coord-label">Y:</span> {{ clickPoint.y.toFixed(2) }}</span>
          </div>
        </div>
        <div class="point-card" style="margin-top: 8px;">
          <div class="point-header">
            <span class="point-source">initialpose</span>
            <span class="point-dot" :class="{ active: initialPoseReceived }"></span>
          </div>
          <div class="point-coords">
            <span class="coord-item"><span class="coord-label">X:</span> {{ initialPose.x.toFixed(2) }}</span>
            <span class="coord-item"><span class="coord-label">Y:</span> {{ initialPose.y.toFixed(2) }}</span>
            <span class="coord-item"><span class="coord-label">Yaw:</span> {{ initialPose.yaw.toFixed(2) }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="panel-footer">
      <span>深圳市海恒智能有限公司</span>
    </div>
  </div>
</template>

<script>
// roslib 1.x 使用默认导出
import ROSLIB from 'roslib';
import config from '@/config';

export default {
  name: 'DevicePanel',
  emits: ['connection-change'],
  data() {
    return {
      rosUrl: config.ros.bridgeUrl,
      isConnected: false,
      isConnecting: false,
      ros: null,
      clickPointSubscriber: null,
      initialPoseSubscriber: null,
      clickPoint: {
        x: 0,
        y: 0
      },
      clickPointReceived: false,
      initialPose: {
        x: 0,
        y: 0,
        yaw: 0
      },
      initialPoseReceived: false,
      // 里程计速度
      odomVelocity: {
        linear: 0,
        angular: 0
      },
      odomReceived: false,
      odomSubscriber: null,
      deviceInfo: { ...config.device },
      // 自动连接
      autoConnectTimer: null,
      autoConnectInterval: 3000,  // 每3秒检测一次
      // 关键点显示状态
      showKeyposes: false,
      // 急停状态
      isEmergencyStop: false,
      emergencyStopTimer: null,
      emergencyStopPublisher: null
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
    },
    connectButtonText() {
      if (this.isConnecting) {
        return '连接中...';
      }
      return this.isConnected ? '断开连接' : '连接';
    }
  },
  beforeUnmount() {
    this.stopAutoConnect();
    this.stopEmergencyStop();
    this.disconnect();
  },
  mounted() {
    // 启动自动连接检测
    this.startAutoConnect();
  },
  methods: {
    startAutoConnect() {
      // 立即尝试一次
      this.tryAutoConnect();
      // 定时检测
      this.autoConnectTimer = setInterval(() => {
        this.tryAutoConnect();
      }, this.autoConnectInterval);
    },
    stopAutoConnect() {
      if (this.autoConnectTimer) {
        clearInterval(this.autoConnectTimer);
        this.autoConnectTimer = null;
      }
    },
    tryAutoConnect() {
      // 如果已连接或正在连接，不做任何事
      if (this.isConnected || this.isConnecting) {
        return;
      }
      
      // 尝试检测端口是否可用
      const testWs = new WebSocket(this.rosUrl);
      
      testWs.onopen = () => {
        console.log('Auto-connect: Port available, connecting...');
        testWs.close();
        // 端口可用，自动连接
        this.connect();
      };
      
      testWs.onerror = () => {
        // 端口不可用，静默失败
        testWs.close();
      };
      
      // 设置检测超时
      setTimeout(() => {
        if (testWs.readyState === WebSocket.CONNECTING) {
          testWs.close();
        }
      }, 2000);
    },
    toggleConnection() {
      if (this.isConnected) {
        this.disconnect();
      } else {
        this.connect();
      }
    },
    connect() {
      if (this.isConnecting) {
        return;
      }
      
      this.isConnecting = true;
      console.log('Connecting to:', this.rosUrl);
      
      // 创建 ROS 连接
      this.ros = new ROSLIB.Ros({
        url: this.rosUrl
      });
      
      // 连接成功
      this.ros.on('connection', () => {
        console.log('Connected to ROS Bridge');
        this.isConnected = true;
        this.isConnecting = false;
        this.$emit('connection-change', true);
        
        // 订阅 click_point 话题
        this.subscribeClickPoint();
        // 订阅 initialpose 话题
        this.subscribeInitialPose();
        // 订阅里程计话题
        this.subscribeOdom();
      });
      
      // 连接失败
      this.ros.on('error', (error) => {
        console.error('ROS connection error:', error);
        this.isConnecting = false;
        this.isConnected = false;
        alert('连接失败，请检查 ROS Bridge 是否启动');
      });
      
      // 连接关闭
      this.ros.on('close', () => {
        console.log('ROS connection closed');
        this.isConnected = false;
        this.isConnecting = false;
        this.$emit('connection-change', false);
      });
      
      // 设置连接超时
      setTimeout(() => {
        if (this.isConnecting) {
          this.isConnecting = false;
          if (this.ros) {
            this.ros.close();
          }
          alert('连接超时，请检查网络和 ROS Bridge 地址');
        }
      }, config.ros.connectionTimeout);
    },
    disconnect() {
      console.log('Disconnecting...');
      
      // 停止急停
      this.stopEmergencyStop();
      
      // 取消订阅
      if (this.clickPointSubscriber) {
        this.clickPointSubscriber.unsubscribe();
        this.clickPointSubscriber = null;
      }
      
      if (this.initialPoseSubscriber) {
        this.initialPoseSubscriber.unsubscribe();
        this.initialPoseSubscriber = null;
      }
      
      if (this.odomSubscriber) {
        this.odomSubscriber.unsubscribe();
        this.odomSubscriber = null;
      }
      
      // 关闭连接
      if (this.ros) {
        this.ros.close();
        this.ros = null;
      }
      
      this.isConnected = false;
      this.clickPointReceived = false;
      this.initialPoseReceived = false;
      this.odomReceived = false;
      this.$emit('connection-change', false);
    },
    subscribeClickPoint() {
      if (!this.ros) {
        return;
      }
      
      // 订阅 clicked_point 话题 (geometry_msgs/PointStamped)
      this.clickPointSubscriber = new ROSLIB.Topic({
        ros: this.ros,
        name: config.topics.clickPoint,
        messageType: 'geometry_msgs/PointStamped'
      });
      
      this.clickPointSubscriber.subscribe((message) => {
        console.log('Received click_point:', message);
        this.clickPoint.x = message.point.x;
        this.clickPoint.y = message.point.y;
        this.clickPointReceived = true;
      });
      
      console.log(`Subscribed to ${config.topics.clickPoint}`);
    },
    subscribeInitialPose() {
      if (!this.ros) {
        return;
      }
      
      // 订阅 initialpose 话题 (geometry_msgs/PoseWithCovarianceStamped)
      this.initialPoseSubscriber = new ROSLIB.Topic({
        ros: this.ros,
        name: config.topics.initialPose,
        messageType: 'geometry_msgs/PoseWithCovarianceStamped'
      });
      
      this.initialPoseSubscriber.subscribe((message) => {
        console.log('Received initialpose:', message);
        this.initialPose.x = message.pose.pose.position.x;
        this.initialPose.y = message.pose.pose.position.y;
        
        // 从四元数计算 yaw
        const q = message.pose.pose.orientation;
        const yaw = Math.atan2(2.0 * (q.w * q.z + q.x * q.y), 1.0 - 2.0 * (q.y * q.y + q.z * q.z));
        this.initialPose.yaw = yaw;
        
        this.initialPoseReceived = true;
      });
      
      console.log(`Subscribed to ${config.topics.initialPose}`);
    },
    subscribeOdom() {
      if (!this.ros) {
        return;
      }
      
      // 订阅里程计话题 (nav_msgs/Odometry)
      this.odomSubscriber = new ROSLIB.Topic({
        ros: this.ros,
        name: config.topics.odom,
        messageType: 'nav_msgs/Odometry'
      });
      
      this.odomSubscriber.subscribe((message) => {
        // 获取线速度 (x方向)
        this.odomVelocity.linear = message.twist.twist.linear.x;
        // 获取角速度 (z轴)
        this.odomVelocity.angular = message.twist.twist.angular.z;
        this.odomReceived = true;
      });
      
      console.log(`Subscribed to ${config.topics.odom}`);
    },
    resetOdom() {
      if (!this.ros || !this.isConnected) {
        alert('请先连接 ROS Bridge');
        return;
      }
      
      console.log('Calling relocalize service...');
      
      // 创建服务客户端
      const relocalizeService = new ROSLIB.Service({
        ros: this.ros,
        name: config.services.relocalize.name,
        serviceType: config.services.relocalize.type
      });
      
      // 创建请求
      const request = new ROSLIB.ServiceRequest({
        pcd_path: config.map.pcdPath,
        x: 0.0,
        y: 0.0,
        z: 0.0,
        yaw: 0.0,
        pitch: 0.0,
        roll: 0.0
      });
      
      // 调用服务
      relocalizeService.callService(request, (result) => {
        console.log('Relocalize service response:', result);
        alert('重定位成功');
      }, (error) => {
        console.error('Relocalize service error:', error);
        alert('重定位失败: ' + error);
      });
    },
    emergencyStop() {
      if (!this.ros || !this.isConnected) {
        alert('请先连接 ROS Bridge');
        return;
      }
      
      if (this.isEmergencyStop) {
        // 取消急停
        this.stopEmergencyStop();
        console.log('Emergency stop cancelled');
      } else {
        // 启动急停
        this.startEmergencyStop();
        console.log('Emergency stop activated');
      }
    },
    startEmergencyStop() {
      // 创建发布者
      this.emergencyStopPublisher = new ROSLIB.Topic({
        ros: this.ros,
        name: '/stop_robot/cmd_vel',
        messageType: 'geometry_msgs/Twist'
      });
      
      // 创建停止消息（所有速度为0）
      const stopMessage = new ROSLIB.Message({
        linear: { x: 0.0, y: 0.0, z: 0.0 },
        angular: { x: 0.0, y: 0.0, z: 0.0 }
      });
      
      // 20Hz = 50ms 间隔
      this.emergencyStopTimer = setInterval(() => {
        if (this.emergencyStopPublisher && this.ros && this.isConnected) {
          this.emergencyStopPublisher.publish(stopMessage);
        }
      }, 50);
      
      this.isEmergencyStop = true;
      console.log('Publishing stop commands at 20Hz to /stop_robot/cmd_vel');
    },
    stopEmergencyStop() {
      if (this.emergencyStopTimer) {
        clearInterval(this.emergencyStopTimer);
        this.emergencyStopTimer = null;
      }
      
      if (this.emergencyStopPublisher) {
        this.emergencyStopPublisher.unadvertise();
        this.emergencyStopPublisher = null;
      }
      
      this.isEmergencyStop = false;
    },
    toggleKeyposes() {
      if (!this.ros || !this.isConnected) {
        alert('请先连接 ROS Bridge');
        return;
      }
      
      // 切换状态
      const newState = !this.showKeyposes;
      
      // 创建服务客户端
      const showKeyposeService = new ROSLIB.Service({
        ros: this.ros,
        name: '/show_keyposes',
        serviceType: 'std_srvs/srv/SetBool'
      });
      
      // 创建请求
      const request = new ROSLIB.ServiceRequest({
        data: newState
      });
      
      // 调用服务
      showKeyposeService.callService(request, (result) => {
        console.log('Show keyposes response:', result);
        this.showKeyposes = newState;
      }, (error) => {
        console.error('Show keyposes error:', error);
        alert('设置失败: ' + error);
      });
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
  padding: 12px 20px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.header-logo {
  height: 36px;
  width: auto;
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

.btn-success {
  background: #16a34a;
  color: #fff;
}

.btn-success:hover {
  background: #15803d;
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

/* 打点信息样式 */
.point-card {
  padding: 10px 12px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
}

.point-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.point-source {
  font-size: 11px;
  color: #6366f1;
  font-weight: 600;
  background: #eef2ff;
  padding: 2px 8px;
  border-radius: 4px;
}

.point-coords {
  display: flex;
  gap: 24px;
}

.coord-item {
  font-size: 13px;
  font-weight: 600;
  color: #1e293b;
  font-family: 'Monaco', 'Consolas', monospace;
}

.coord-item .coord-label {
  color: #64748b;
  font-weight: 500;
}

.coord-inline {
  display: flex;
  align-items: center;
  gap: 4px;
}

.coord-inline .coord-label {
  font-size: 12px;
  color: #64748b;
  font-weight: 500;
}

.coord-inline .coord-value {
  font-size: 13px;
  font-weight: 600;
  color: #1e293b;
  font-family: 'Monaco', 'Consolas', monospace;
  min-width: 55px;
}

.point-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #94a3b8;
}

.point-dot.active {
  background: #16a34a;
  box-shadow: 0 0 8px #16a34a;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* 里程计速度样式 */
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.section-header h3 {
  margin-bottom: 0;
}

.velocity-indicator {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #94a3b8;
  flex-shrink: 0;
}

.velocity-indicator.active {
  background: #16a34a;
  box-shadow: 0 0 8px #16a34a;
  animation: pulse 2s infinite;
}

.panel-footer {
  padding: 8px 20px;
  background: #f8fafc;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: center;
  align-items: center;
}

.panel-footer span {
  font-size: 11px;
  color: #64748b;
  letter-spacing: 0.5px;
}
</style>
