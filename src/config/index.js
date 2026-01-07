/**
 * 应用配置文件
 * 所有可配置参数集中管理
 */

const config = {
  // ROS Bridge 配置
  ros: {
    // WebSocket 连接地址 - 自动使用浏览器访问的主机IP
    get bridgeUrl() {
      const host = window.location.hostname || 'localhost';
      return `ws://${host}:8760`;
    },
    // 连接超时时间 (毫秒)
    connectionTimeout: 5000
  },

  // 话题配置
  topics: {
    // 点击点话题
    clickPoint: {
      topic: '/clicked_point',
      messageType: 'geometry_msgs/msg/PointStamped'
    },
    // 初始位姿话题
    initialPose: {
      topic: '/initialpose',
      messageType: 'geometry_msgs/msg/PoseWithCovarianceStamped'
    },
    // 里程计话题
    odom: {
      topic: '/fastlio2/lio_odom',
      messageType: 'nav_msgs/msg/Odometry'
    },
    // 急停话题
    emergencyStop: {
      topic: '/stop_robot/cmd_vel',
      messageType: 'geometry_msgs/msg/Twist'
    },
    // 左电池话题
    batteryLeft: {
      topic: '/tita3232802/system/battery/left',
      messageType: 'sensor_msgs/msg/BatteryState'
    },
    // 右电池话题
    batteryRight: {
      topic: '/tita3232802/system/battery/right',
      messageType: 'sensor_msgs/msg/BatteryState'
    },
    // 机器人信息话题
    robotInfo: {
      topic: '/robot/info',
      messageType: 'sea_interfaces/msg/RobotInfo'
    }
  },

  // 急停配置
  emergencyStop: {
    // 急停时的线速度 (m/s)，0 表示完全停止
    linearVelocity: -0.02,
    // 发布频率 (Hz)
    publishRate: 20
  },

  // 服务配置
  services: {
    // 重定位服务
    relocalize: {
      name: '/localizer/relocalize',
      type: 'interface/srv/Relocalize'
    }
  },

  // 地图配置
  map: {
    // PCD 点云地图路径
    pcdPath: '/home/sea/SEA/sea_slam/maps/szlib_1103/map.pcd'
  },

  // 设备默认信息
  device: {
    name: 'SeaDog_v1',
    id: 'SD-2025-001',
    status: '待机中',
    batteryLeft: 0,
    batteryRight: 0
  },

  // Lichtblick 配置
  lichtblick: {
    // iframe 源地址
    src: 'lichtblick/.webpack/renderer/main_window/index.html'
  }
};

export default config;
