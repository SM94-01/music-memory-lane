package com.TraX.app;

import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.view.WindowManager;
import android.webkit.WebView;
import androidx.core.view.ViewCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private static final String TAG = "TraXInput";

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().setSoftInputMode(WindowManager.LayoutParams.SOFT_INPUT_STATE_UNSPECIFIED | WindowManager.LayoutParams.SOFT_INPUT_ADJUST_NOTHING);
        disableInsetsMutation();
        Log.i(TAG, "Android IME safe mode active: adjustNothing, SystemBars insets disabled, captureInput=false, initialFocus=true");
    }

    @Override
    public void onStart() {
        super.onStart();
        WebView webView = getBridge() != null ? getBridge().getWebView() : null;
        if (webView == null) return;
        webView.setFocusable(true);
        webView.setFocusableInTouchMode(true);
        webView.requestFocusFromTouch();
        disableInsetsMutation();
        Log.i(TAG, "WebView focus ready: webViewFocused=" + webView.hasFocus());
    }

    private void disableInsetsMutation() {
        WebView webView = getBridge() != null ? getBridge().getWebView() : null;
        if (webView == null) return;

        if (webView.getParent() instanceof View parent) {
            ViewCompat.setOnApplyWindowInsetsListener(parent, null);
            parent.setPadding(0, 0, 0, 0);
        }
        webView.setPadding(0, 0, 0, 0);
    }
}
