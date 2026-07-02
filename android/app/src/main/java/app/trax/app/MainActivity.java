package com.TraX.app;

import android.os.Bundle;
import android.view.WindowManager;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // Baseline Android IME setup for Capacitor WebView.
        // Keep the window able to receive the soft keyboard and avoid resizing
        // the WebView while IME opens, which has caused focus deadlocks on real
        // devices with this app.
        getWindow().clearFlags(WindowManager.LayoutParams.FLAG_ALT_FOCUSABLE_IM);
        getWindow().setSoftInputMode(
            WindowManager.LayoutParams.SOFT_INPUT_STATE_UNSPECIFIED |
            WindowManager.LayoutParams.SOFT_INPUT_ADJUST_PAN
        );

        WebView webView = getBridge() != null ? getBridge().getWebView() : null;
        if (webView == null) return;
        webView.setFocusable(true);
        webView.setFocusableInTouchMode(true);
        webView.requestFocusFromTouch();
    }
}
