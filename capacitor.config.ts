import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.TraX.app',
  appName: 'TraX',
  webDir: 'dist',
  android: {
    // Required so Google Play accepts release APKs; also prevents cleartext HTTP.
    allowMixedContent: false,
    androidScheme: 'https',
  },
  plugins: {
    PushNotifications: {
      // Android displays banners in foreground when 'alert' is set.
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    Keyboard: {
      // Android uses windowSoftInputMode="adjustResize" in AndroidManifest.
      // Do not enable the fullscreen workaround here: this app is not running
      // with an overlaying status bar, and the workaround can create a resize
      // loop in Android WebView when an input receives focus.
      resizeOnFullScreen: false,
    },
  },
};

export default config;
