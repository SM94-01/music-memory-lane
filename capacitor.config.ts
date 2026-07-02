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
      // Android is handled natively with windowSoftInputMode="adjustPan".
      // Avoid the fullscreen resize workaround: it can create focus/resize
      // loops in Android WebView when auth inputs receive focus.
      resizeOnFullScreen: false,
    },
  },
};

export default config;
