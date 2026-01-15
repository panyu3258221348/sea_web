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
            <span class="label">机器人消息</span>
            <span class="value robot-message">{{ robotMessage || '无' }}</span>
          </div>
          <div class="info-item">
            <span class="label">左电池电量</span>
            <div class="battery-bar">
              <div class="battery-level" :class="{ 'battery-low': deviceInfo.batteryLeft < 25 }" :style="{ width: deviceInfo.batteryLeft + '%' }"></div>
              <span class="battery-text">{{ deviceInfo.batteryLeft }}%</span>
            </div>
          </div>
          <div class="info-item">
            <span class="label">右电池电量</span>
            <div class="battery-bar">
              <div class="battery-level" :class="{ 'battery-low': deviceInfo.batteryRight < 25 }" :style="{ width: deviceInfo.batteryRight + '%' }"></div>
              <span class="battery-text">{{ deviceInfo.batteryRight }}%</span>
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
            <span class="value">{{ Math.abs(odomVelocity.linear) < 0.01 ? '0.00' : odomVelocity.linear.toFixed(2) }} m/s</span>
          </div>
          <div class="info-item">
            <span class="label">角速度</span>
            <span class="value">{{ Math.abs(odomVelocity.angular) < 0.1 ? '0.0' : odomVelocity.angular.toFixed(1) }} rad/s</span>
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
          >
            {{ isEmergencyStop ? '取消急停' : '紧急停止' }}
          </button>
        </div>
        <button 
          class="btn" 
          :class="showKeyposes ? 'btn-success' : 'btn-secondary'"
          style="margin-top: 10px;"
          @click="toggleKeyposes"
        >
          {{ showKeyposes ? '隐藏航点' : '显示航点' }}
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
        <button 
          class="btn btn-primary" 
          style="margin-top: 10px;"
          @click="showSaveWaypointDialog"
        >
          保存航点
        </button>
      </div>

      <!-- 地图信息 -->
      <div class="section">
        <h3>地图信息</h3>
        <div class="info-grid">
          <div class="info-item">
            <span class="label">地图分辨率</span>
            <span class="value">{{ mapResolution > 0 ? mapResolution.toFixed(3) + ' m/pixel' : '未获取' }}</span>
          </div>
        </div>
        <button 
          class="btn btn-secondary" 
          style="margin-top: 10px;"
          @click="downloadGridMap"
        >
          下载栅格地图
        </button>
        <button 
          class="btn btn-secondary" 
          style="margin-top: 10px;"
          @click="triggerUploadGridMap"
        >
          上传栅格地图
        </button>
        <input 
          ref="gridMapFileInput"
          type="file" 
          accept=".pgm"
          style="display: none;"
          @change="handleGridMapUpload"
        />
      </div>
    </div>

    <div class="panel-footer">
      <span>深圳市海恒智能有限公司</span>
    </div>

    <!-- 保存航点弹框 -->
    <div v-if="showWaypointDialog" class="dialog-overlay" @click="closeWaypointDialog">
      <div class="dialog-box" @click.stop>
        <div class="dialog-header">
          <h3>保存航点</h3>
          <button class="dialog-close" @click="closeWaypointDialog">
            ×
          </button>
        </div>
        <div class="dialog-content">
          <div class="form-group">
            <label>航点名称</label>
            <input 
              v-model="waypointName" 
              type="text" 
              placeholder="请输入航点名称"
            />
          </div>
          <div class="form-group">
            <label>InitialPose - X 坐标</label>
            <input 
              v-model.number="editInitialPose.x" 
              type="number" 
              step="0.01"
              placeholder="X坐标"
            />
          </div>
          <div class="form-group">
            <label>InitialPose - Y 坐标</label>
            <input 
              v-model.number="editInitialPose.y" 
              type="number" 
              step="0.01"
              placeholder="Y坐标"
            />
          </div>
          <div class="form-group">
            <label>InitialPose - Yaw 角度</label>
            <input 
              v-model.number="editInitialPose.yaw" 
              type="number" 
              step="0.01"
              placeholder="Yaw角度"
            />
          </div>
        </div>
        <div class="dialog-footer">
          <button class="btn btn-secondary" @click="closeWaypointDialog">
            取消
          </button>
          <button class="btn btn-primary" @click="saveWaypoint">
            确认
          </button>
        </div>
      </div>
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
      // 电池订阅器
      batteryLeftSubscriber: null,
      batteryRightSubscriber: null,
      // 机器人信息订阅器
      robotInfoSubscriber: null,
      // 机器人消息
      robotMessage: '',
      deviceInfo: { ...config.device },
      // 自动连接
      autoConnectTimer: null,
      autoConnectInterval: 3000,  // 每3秒检测一次
      // 关键点显示状态
      showKeyposes: false,
      // 急停状态
      isEmergencyStop: false,
      emergencyStopTimer: null,
      emergencyStopPublisher: null,
      // 航点保存
      showWaypointDialog: false,
      waypointName: '',
      editInitialPose: {
        x: 0,
        y: 0,
        yaw: 0
      },
      // 地图分辨率
      mapResolution: 0
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
        this.$emit('connection-change', true, this.ros);
        
        // 订阅 click_point 话题
        this.subscribeClickPoint();
        // 订阅 initialpose 话题
        this.subscribeInitialPose();
        // 订阅里程计话题
        this.subscribeOdom();
        // 订阅电池话题
        this.subscribeBatteryLeft();
        this.subscribeBatteryRight();
        // 订阅机器人信息话题
        this.subscribeRobotInfo();
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
      
      if (this.batteryLeftSubscriber) {
        this.batteryLeftSubscriber.unsubscribe();
        this.batteryLeftSubscriber = null;
      }
      
      if (this.batteryRightSubscriber) {
        this.batteryRightSubscriber.unsubscribe();
        this.batteryRightSubscriber = null;
      }
      
      if (this.robotInfoSubscriber) {
        this.robotInfoSubscriber.unsubscribe();
        this.robotInfoSubscriber = null;
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

      // 订阅 clicked_point 话题
      this.clickPointSubscriber = new ROSLIB.Topic({
        ros: this.ros,
        name: config.topics.clickPoint.topic,
        messageType: config.topics.clickPoint.messageType
      });

      this.clickPointSubscriber.subscribe((message) => {
        console.log('Received click_point:', message);
        this.clickPoint.x = message.point.x;
        this.clickPoint.y = message.point.y;
        this.clickPointReceived = true;
      });

      console.log(`Subscribed to ${config.topics.clickPoint.topic}`);
    },
    subscribeInitialPose() {
      if (!this.ros) {
        return;
      }
      
      // 订阅 initialpose 话题
      this.initialPoseSubscriber = new ROSLIB.Topic({
        ros: this.ros,
        name: config.topics.initialPose.topic,
        messageType: config.topics.initialPose.messageType
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
      
      console.log(`Subscribed to ${config.topics.initialPose.topic}`);
    },
    subscribeOdom() {
      if (!this.ros) {
        return;
      }
      
      // 订阅里程计话题
      this.odomSubscriber = new ROSLIB.Topic({
        ros: this.ros,
        name: config.topics.odom.topic,
        messageType: config.topics.odom.messageType
      });
      
      this.odomSubscriber.subscribe((message) => {
        // 获取线速度 (x方向)
        this.odomVelocity.linear = message.twist.twist.linear.x;
        // 获取角速度 (z轴)
        this.odomVelocity.angular = message.twist.twist.angular.z;
        this.odomReceived = true;
      });
      
      console.log(`Subscribed to ${config.topics.odom.topic}`);
    },
    subscribeBatteryLeft() {
      if (!this.ros) {
        return;
      }
      
      // 订阅左电池话题
      this.batteryLeftSubscriber = new ROSLIB.Topic({
        ros: this.ros,
        name: config.topics.batteryLeft.topic,
        messageType: config.topics.batteryLeft.messageType
      });
      
      this.batteryLeftSubscriber.subscribe((message) => {
        this.deviceInfo.batteryLeft = Math.round(message.percentage);
      });
      
      console.log(`Subscribed to ${config.topics.batteryLeft.topic}`);
    },
    subscribeBatteryRight() {
      if (!this.ros) {
        return;
      }
      
      // 订阅右电池话题
      this.batteryRightSubscriber = new ROSLIB.Topic({
        ros: this.ros,
        name: config.topics.batteryRight.topic,
        messageType: config.topics.batteryRight.messageType
      });
      
      this.batteryRightSubscriber.subscribe((message) => {
        this.deviceInfo.batteryRight = Math.round(message.percentage);
      });
      
      console.log(`Subscribed to ${config.topics.batteryRight.topic}`);
    },
    subscribeRobotInfo() {
      if (!this.ros) {
        return;
      }
      
      // 订阅机器人信息话题
      this.robotInfoSubscriber = new ROSLIB.Topic({
        ros: this.ros,
        name: config.topics.robotInfo.topic,
        messageType: config.topics.robotInfo.messageType
      });
      
      this.robotInfoSubscriber.subscribe((message) => {
        this.deviceInfo.name = message.robot_type;
        this.deviceInfo.id = message.robot_id;
        this.deviceInfo.status = message.status;
        this.robotMessage = message.robot_message || '';
      });
      
      console.log(`Subscribed to ${config.topics.robotInfo.topic}`);
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
        name: config.topics.emergencyStop.topic,
        messageType: config.topics.emergencyStop.messageType
      });

      // 创建停止消息（使用配置的速度值）
      const stopMessage = new ROSLIB.Message({
        linear: { x: config.emergencyStop.linearVelocity, y: 0.0, z: 0.0 },
        angular: { x: 0.0, y: 0.0, z: 0.0 }
      });

      // 使用配置的发布频率
      const interval = 1000 / config.emergencyStop.publishRate;
      this.emergencyStopTimer = setInterval(() => {
        if (this.emergencyStopPublisher && this.ros && this.isConnected) {
          this.emergencyStopPublisher.publish(stopMessage);
        }
      }, interval);
      
      this.isEmergencyStop = true;
      console.log(`Publishing stop commands at ${config.emergencyStop.publishRate}Hz to ${config.topics.emergencyStop.topic}`);
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
    showSaveWaypointDialog() {
      if (!this.ros || !this.isConnected) {
        alert('请先连接 ROS Bridge');
        return;
      }
      
      this.waypointName = '';
      // 初始化编辑的initialpose值为当前值（格式化为两位小数）
      this.editInitialPose.x = parseFloat(this.initialPose.x.toFixed(2));
      this.editInitialPose.y = parseFloat(this.initialPose.y.toFixed(2));
      this.editInitialPose.yaw = parseFloat(this.initialPose.yaw.toFixed(2));
      this.showWaypointDialog = true;
    },
    closeWaypointDialog() {
      this.showWaypointDialog = false;
      this.waypointName = '';
      this.editInitialPose = { x: 0, y: 0, yaw: 0 };
    },
    async saveWaypoint() {
      if (!this.waypointName.trim()) {
        alert('请输入航点名称');
        return;
      }
      
      try {
        // 将yaw角度(弧度)转换为四元数
        const yawRad = this.editInitialPose.yaw;
        const quaternion = {
          x: 0,
          y: 0,
          z: Math.sin(yawRad / 2),
          w: Math.cos(yawRad / 2)
        };
        
        // 构建符合后端API的请求数据
        const nodeData = {
          node_id: this.waypointName.trim(),
          pose: {
            position: {
              x: this.editInitialPose.x,
              y: this.editInitialPose.y,
              z: 0.0
            },
            orientation: quaternion
          },
          neighbors: []
        };
        
        console.log('保存航点到后端:', nodeData);
        
        // 调用后端API
        const response = await fetch(`${config.upload.serverUrl}/api/nodes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(nodeData)
        });
        
        const result = await response.json();
        
        if (result.success) {
          alert(`航点 "${nodeData.node_id}" 保存成功！`);
          this.closeWaypointDialog();
        } else {
          alert('保存失败: ' + result.error);
        }
      } catch (error) {
        console.error('保存航点失败:', error);
        alert('保存失败: ' + error.message);
      }
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
    },
    triggerUploadGridMap() {
      // 触发文件选择器
      this.$refs.gridMapFileInput.click();
    },
    async handleGridMapUpload(event) {
      const file = event.target.files[0];
      if (!file) {
        return;
      }
      
      // 检查文件扩展名
      const fileName = file.name.toLowerCase();
      if (!fileName.endsWith('.pgm')) {
        alert('请上传PGM格式的栅格地图文件！');
        // 清空文件选择器
        this.$refs.gridMapFileInput.value = '';
        return;
      }
      
      // 验证PGM文件头
      const isValid = await this.validatePGMFile(file);
      if (!isValid) {
        alert('文件格式不正确，请确保上传的是有效的PGM文件！');
        this.$refs.gridMapFileInput.value = '';
        return;
      }
      
      // 上传文件到Flask服务器
      try {
        const uploadUrl = config.upload.serverUrl;
        console.log(`正在上传 "${file.name}" 到 ${uploadUrl}（将重命名为 map.pgm）...`);
        
        const formData = new FormData();
        // 强制重命名为 map.pgm
        const renamedFile = new File([file], 'map.pgm', { type: file.type });
        // Flask使用 "file" 作为字段名
        formData.append('file', renamedFile);
        
        const response = await fetch(uploadUrl, {
          method: 'POST',
          body: formData
        });
        
        if (response.ok) {
          const responseText = await response.text();
          console.log('Upload success:', responseText);
          alert('上传成功！');
        } else {
          const errorText = await response.text();
          console.error('Upload failed:', response.status, errorText);
          alert(`上传失败 (${response.status})\n${errorText}`);
        }
      } catch (error) {
        console.error('Upload error:', error);
        alert(`网络错误: ${error.message}\n\n请检查:\n1. Flask服务是否正在运行: ${config.upload.serverUrl}\n2. 网络连接是否正常`);
      }

      // 清空文件选择器，允许重复上传同一文件
      this.$refs.gridMapFileInput.value = '';
    },
    async validatePGMFile(file) {
      return new Promise((resolve) => {
        const reader = new FileReader();
        
        // 只读取前1KB用于验证文件头
        const blob = file.slice(0, 1024);
        
        reader.onload = (e) => {
          try {
            const content = e.target.result;
            const text = new TextDecoder('utf-8').decode(new Uint8Array(content));
            const lines = text.split('\n').filter(line => !line.trim().startsWith('#'));
            
            // 检查PGM魔数（P2=ASCII, P5=Binary）
            if (lines.length === 0) {
              resolve(false);
              return;
            }
            
            const magicNumber = lines[0].trim();
            if (magicNumber !== 'P2' && magicNumber !== 'P5') {
              console.error('Invalid PGM magic number:', magicNumber);
              resolve(false);
              return;
            }
            
            // 检查是否有宽度和高度信息
            if (lines.length < 3) {
              console.error('PGM file missing width/height information');
              resolve(false);
              return;
            }
            
            // 验证宽度和高度是否为数字
            const dimensions = lines[1].trim().split(/\s+/);
            if (dimensions.length !== 2) {
              console.error('Invalid PGM dimensions format');
              resolve(false);
              return;
            }
            
            const width = parseInt(dimensions[0]);
            const height = parseInt(dimensions[1]);
            
            if (isNaN(width) || isNaN(height) || width <= 0 || height <= 0) {
              console.error('Invalid PGM dimensions:', width, height);
              resolve(false);
              return;
            }
            
            // 验证最大灰度值
            const maxVal = parseInt(lines[2].trim());
            if (isNaN(maxVal) || maxVal <= 0) {
              console.error('Invalid PGM max value:', maxVal);
              resolve(false);
              return;
            }
            
            console.log('Valid PGM file:', { magicNumber, width, height, maxVal });
            resolve(true);
          } catch (error) {
            console.error('Error validating PGM file:', error);
            resolve(false);
          }
        };
        
        reader.onerror = () => {
          console.error('Error reading file');
          resolve(false);
        };
        
        reader.readAsArrayBuffer(blob);
      });
    },
    downloadGridMap() {
      if (!this.ros || !this.isConnected) {
        alert('请先连接 ROS Bridge');
        return;
      }
      
      console.log('Subscribing to /map topic to download grid map...');
      
      // 创建临时订阅器获取地图数据
      const mapTopic = new ROSLIB.Topic({
        ros: this.ros,
        name: '/map',
        messageType: 'nav_msgs/OccupancyGrid'
      });
      
      // 订阅一次地图话题
      mapTopic.subscribe((message) => {
        console.log('Received map data:', message);
        
        try {
          // 解析地图数据
          const width = message.info.width;
          const height = message.info.height;
          const resolution = message.info.resolution;
          const data = message.data;
          
          // 更新地图分辨率
          this.mapResolution = resolution;
          
          // 生成PGM文件内容
          const pgmContent = this.generatePGM(width, height, data);
          
          // 触发下载
          this.downloadPGMFile(pgmContent, 'map.pgm');
          
          alert('地图文件下载成功！');
          
        } catch (error) {
          console.error('Failed to process map data:', error);
          alert('地图数据处理失败: ' + error.message);
        }
        
        // 取消订阅
        mapTopic.unsubscribe();
      });
      
      // 设置超时，如果5秒内没有收到地图数据
      setTimeout(() => {
        mapTopic.unsubscribe();
      }, 5000);
    },
    generatePGM(width, height, data) {
      // PGM格式：P5 (灰度图)
      // 头部: P5 宽度 高度 最大灰度值
      // 数据: 每个像素一个字节
      
      let pgm = `P5\n${width} ${height}\n255\n`;
      
      // 转换占用栅格数据到灰度值
      // ROS: -1=未知(灰色205), 0=空闲(白色254), 100=占用(黑色0)
      const pixels = new Uint8Array(data.length);
      for (let i = 0; i < data.length; i++) {
        const value = data[i];
        if (value === -1) {
          pixels[i] = 205; // 未知区域 - 灰色
        } else if (value === 0) {
          pixels[i] = 254; // 空闲区域 - 白色
        } else {
          // 占用概率转换为灰度值 (0-100 -> 254-0)
          pixels[i] = Math.round(254 - (value / 100.0) * 254);
        }
      }
      
      // 创建Blob
      const headerBlob = new Blob([pgm], { type: 'text/plain' });
      const dataBlob = new Blob([pixels], { type: 'application/octet-stream' });
      
      return new Blob([headerBlob, dataBlob], { type: 'image/x-portable-graymap' });
    },

    downloadPGMFile(content, filename) {
      // 创建下载链接
      const url = typeof content === 'string' 
        ? URL.createObjectURL(new Blob([content], { type: 'text/plain' }))
        : URL.createObjectURL(content);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // 释放URL对象
      setTimeout(() => URL.revokeObjectURL(url), 100);
      
      console.log('Downloaded:', filename);
    },
    triggerFileDownload(url) {
      // 创建一个隐藏的a标签并触发下载
      const link = document.createElement('a');
      link.href = url;
      link.download = 'grid_map.pgm'; // 设置下载文件名
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      console.log('Downloading file from:', url);
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

.robot-message {
  word-break: break-all;
  max-width: 150px;
  font-size: 12px !important;
  color: #475569 !important;
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
  transition: width 0.3s, background 0.3s;
}

.battery-level.battery-low {
  background: linear-gradient(90deg, #ef4444, #dc2626);
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

/* 对话框样式 */
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.dialog-box {
  background: white;
  border-radius: 8px;
  width: 400px;
  max-width: 90%;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  animation: dialogSlideIn 0.2s ease-out;
}

@keyframes dialogSlideIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #e2e8f0;
}

.dialog-header h3 {
  margin: 0;
  font-size: 16px;
  color: #1e293b;
  font-weight: 600;
}

.dialog-close {
  background: none;
  border: none;
  font-size: 24px;
  color: #64748b;
  cursor: pointer;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s;
}

.dialog-close:hover {
  background: #f1f5f9;
  color: #1e293b;
}

.dialog-content {
  padding: 20px;
}

.dialog-content .form-group {
  margin-bottom: 16px;
}

.dialog-content .form-group:last-child {
  margin-bottom: 0;
}

.dialog-content .form-group label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  color: #334155;
  font-weight: 500;
}

.dialog-content .form-group input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  font-size: 14px;
  transition: all 0.2s;
  box-sizing: border-box;
}

.dialog-content .form-group input:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 16px 20px;
  border-top: 1px solid #e2e8f0;
}

.dialog-footer .btn {
  width: auto;
  padding: 8px 20px;
  font-size: 14px;
}
</style>
