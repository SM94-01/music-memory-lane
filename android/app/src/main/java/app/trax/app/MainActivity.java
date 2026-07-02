package com.TraX.app;

import android.os.Bundle;
import android.util.Log;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private static final String TAG = "TraXInput";

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        Log.i(TAG, "Android IME manifest baseline active: adjustPan, captureInput=false, initialFocus=true");
    }

    @Override
    public void onStart() {
        super.onStart();
        WebView webView = getBridge() != null ? getBridge().getWebView() : null;
        if (webView == null) return;
        webView.setFocusable(true);
        webView.setFocusableInTouchMode(true);
        webView.requestFocusFromTouch();
        Log.i(TAG, "WebView focus ready: webViewFocused=" + webView.hasFocus());
    }
}
