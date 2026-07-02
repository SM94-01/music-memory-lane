import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.TraX.app',
  appName: 'TraX',
  webDir: 'dist',
  android: {
    allowMixedContent: false,
    androidScheme: 'https',
  },
  plugins: {
    SystemBars: {
      insetsHandling: 'disable',
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
};

export default config;
