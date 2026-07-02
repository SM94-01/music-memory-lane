import type { CapacitorConfig } from '@capacitor/cli';
import { KeyboardResize } from '@capacitor/keyboard';

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
      // `Body` resizes the <body> element on keyboard open — the most stable
      // mode on Android WebView for form-heavy screens. `Native` is known to
      // cause input focus freezes on some Android versions (see Capacitor
      // issue tracker), which is what we were hitting on /auth.
      resize: KeyboardResize.Body,
      resizeOnFullScreen: true,
    },
  },
};

export default config;
