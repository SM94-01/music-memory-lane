import { isNativePlatform } from './platform';
import { saveDeviceToken, flushCachedToken } from './tokenStore';
import { handleForegroundNotification, handleNotificationTap } from './handlers';

let initPromise: Promise<void> | null = null;

/**
 * Initialize Firebase Cloud Messaging on native platforms.
 *
 * - No-op on web / SSR.
 * - Requests notification permission (Android 13+ requires POST_NOTIFICATIONS).
 * - Registers the device with FCM and persists the token to `public.user_push_tokens`.
 * - Wires listeners for token refresh, foreground notifications, and taps.
 *
 * Concurrent-safe: subsequent calls share the same in-flight promise so we
 * never attach duplicate listeners (which would fire `saveDeviceToken` twice
 * for every FCM registration event).
 */
export async function initPushNotifications(): Promise<void> {
  if (!isNativePlatform()) return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const { PushNotifications } = await import('@capacitor/push-notifications');

    // 1. Permission
    let perm = await PushNotifications.checkPermissions();
    if (perm.receive === 'prompt' || perm.receive === 'prompt-with-rationale') {
      perm = await PushNotifications.requestPermissions();
    }
    if (perm.receive !== 'granted') {
      console.warn('[push] permission not granted:', perm.receive);
      initPromise = null; // allow retry after the user changes permission
      return;
    }

    // 2. Listeners — attach BEFORE register() so we don't miss the first token.
    await PushNotifications.addListener('registration', (token) => {
      // Fires on first register AND whenever Firebase rotates the token.
      void saveDeviceToken(token.value);
    });

    await PushNotifications.addListener('registrationError', (err) => {
      console.error('[push] registration error', err);
    });

    await PushNotifications.addListener('pushNotificationReceived', handleForegroundNotification);
    await PushNotifications.addListener('pushNotificationActionPerformed', handleNotificationTap);

    // 3. Register with FCM
    await PushNotifications.register();

    // 4. Flush any token captured before the user was signed in.
    await flushCachedToken();
  })();

  return initPromise;
}

export { saveDeviceToken, removeDeviceToken, flushCachedToken } from './tokenStore';
export { isNativePlatform, getPlatform } from './platform';
