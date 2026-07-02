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
    // captureInput path replaces WebView's IME connection and can break text
    // entry on real devices.
    captureInput: false,
    // IMPORTANT: keep this enabled. Capacitor calls requestFocusFromTouch() on
    // startup when initialFocus is true; without it, Android WebView can focus
    // DOM inputs without opening the soft keyboard and then stop responding.
    initialFocus: true,
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
