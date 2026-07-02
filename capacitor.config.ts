import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.TraX.app',
  appName: 'TraX',
  webDir: 'dist',
  android: {
    allowMixedContent: false,
    androidScheme: 'https',
    imeMode: 'adjustResize', // Gestisce meglio il ridimensionamento IME
  },
  plugins: {
    SystemBars: {
      insetsHandling: 'manage', // Gestione migliorata degli insets (tastiera)
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
};

export default config;
