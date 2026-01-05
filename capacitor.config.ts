import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.seaever.sea_web',
  appName: 'sea_web',
  webDir: 'dist',
  server: {
    androidScheme: 'http',
    cleartext: true,
    // 允许加载本地文件
    allowNavigation: ['*']
  },
  android: {
    allowMixedContent: true,
    // 启用 WebView 调试
    webContentsDebuggingEnabled: true
  }
};

export default config;
