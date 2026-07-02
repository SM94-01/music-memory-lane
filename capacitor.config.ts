import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.trax',
  appName: 'TraX',
  webDir: 'dist',
  android: {
    // Required so Google Play accepts release APKs; also prevents cleartext HTTP.
    allowMixedContent: false,
    // Debuggable is auto-toggled by Gradle; leaving unset is intentional.
  },
  plugins: {
    PushNotifications: {
      // Android displays banners in foreground when 'alert' is set.
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
};

export default config;
