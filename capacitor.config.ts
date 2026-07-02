import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.TraX.app',
  appName: 'TraX',
  webDir: 'dist',
  android: {
    // Required so Google Play accepts release APKs; also prevents cleartext HTTP.
    allowMixedContent: false,
    androidScheme: 'https',
    // Keep Android's normal WebView input connection. The alternative
    // captureInput path is known to break/lock IME text entry on real devices.
    captureInput: false,
    // Do not force initial focus on the WebView at startup; let tapped inputs
    // own focus so Android can open the correct keyboard/input connection.
    initialFocus: false,
    // The Keyboard plugin attaches native IME/window-insets listeners on load.
    // This app does not need those APIs at runtime, so exclude it from Android
    // to avoid WebView focus freezes on real devices.
    includePlugins: ['@capacitor/app', '@capacitor/push-notifications'],
  },
  plugins: {
    SystemBars: {
      insetsHandling: 'css',
      style: 'DARK',
      hidden: false,
    },
    PushNotifications: {
      // Android displays banners in foreground when 'alert' is set.
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
};

export default config;
