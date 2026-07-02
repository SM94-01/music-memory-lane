package com.TraX.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
  @Override
  public void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    
    // Prevent input method from resizing the view
    // Instead, pan the content so the input stays visible
    getWindow().setSoftInputMode(
      android.view.WindowManager.LayoutParams.SOFT_INPUT_STATE_HIDDEN |
      android.view.WindowManager.LayoutParams.SOFT_INPUT_ADJUST_PAN
    );
  }
}
