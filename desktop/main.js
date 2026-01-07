const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');

// 保持对window对象的全局引用
let mainWindow;

function createWindow() {
  // 隐藏菜单栏
  Menu.setApplicationMenu(null);

  // 创建浏览器窗口
  mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    minWidth: 1200,
    minHeight: 800,
    autoHideMenuBar: true, // 自动隐藏菜单栏
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false
    },
    // icon: path.join(__dirname, '../public/icon.png'),
    icon: path.join(__dirname, 'icons', 'icon.png'),
    show: false // 先隐藏窗口，等加载完成后再显示
  });

  // 窗口准备好后全屏显示
  mainWindow.once('ready-to-show', () => {
    mainWindow.maximize(); // 默认最大化
    mainWindow.show();
  });

  // 根据环境加载不同的URL
  if (process.env.NODE_ENV === 'development') {
    // 开发环境：加载 vue-cli-service 的开发服务器
    mainWindow.loadURL('http://localhost:8080');
    // 打开开发者工具
    mainWindow.webContents.openDevTools();
  } else {
    // 生产环境：加载打包后的文件
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // 当窗口关闭时触发
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Electron 初始化完成后创建窗口
app.whenReady().then(() => {
  createWindow();

  // macOS 特有的行为
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// 所有窗口关闭时退出应用 (Windows & Linux)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// 处理证书错误（如果连接本地ROS服务需要）
app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
  event.preventDefault();
  callback(true);
});
