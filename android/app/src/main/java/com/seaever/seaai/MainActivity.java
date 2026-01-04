package com.seaever.seaai;

import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // 获取 WebView 并配置设置
        WebView webView = getBridge().getWebView();
        WebSettings settings = webView.getSettings();
        
        // 启用 JavaScript
        settings.setJavaScriptEnabled(true);
        
        // 启用 DOM Storage (Lichtblick 需要)
        settings.setDomStorageEnabled(true);
        
        // 允许文件访问 (用于加载本地 iframe)
        settings.setAllowFileAccess(true);
        settings.setAllowFileAccessFromFileURLs(true);
        settings.setAllowUniversalAccessFromFileURLs(true);
        
        // 允许混合内容 (http 和 https)
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
        
        // 启用硬件加速 (WebGL 需要)
        webView.setLayerType(WebView.LAYER_TYPE_HARDWARE, null);
        
        // 启用调试 (可选，发布时可移除)
        WebView.setWebContentsDebuggingEnabled(true);
        
        // 设置媒体自动播放
        settings.setMediaPlaybackRequiresUserGesture(false);
        
        // 设置默认文本编码
        settings.setDefaultTextEncodingName("UTF-8");
    }
}
