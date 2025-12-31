/**
 * 应用配置文件
 * 所有可配置参数集中管理
 */

const config = {
  // ROS Bridge 配置
  ros: {
    // WebSocket 连接地址
    bridgeUrl: 'ws://localhost:8760',
    // 连接超时时间 (毫秒)
    connectionTimeout: 5000
  },

  // 话题配置
  topics: {
    // 点击点话题
    clickPoint: '/clicked_point'
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
    pcdPath: '/home/cmc/develop/Seaever/Sea-AI/sea_slam/maps/szlib_1103/map.pcd'
  },

  // 设备默认信息
  device: {
    name: 'SeaDog_v1',
    id: 'SR-2024-001',
    status: '待机中',
    battery: 85
  },

  // Lichtblick 配置
  lichtblick: {
    // iframe 源地址
    src: 'lichtblick/.webpack/renderer/main_window/index.html'
  }
};

export default config;
