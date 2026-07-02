import { isNativePlatform } from './platform';
import { saveDeviceToken, flushCachedToken } from './tokenStore';
import { handleForegroundNotification, handleNotificationTap } from './handlers';

let initialized = false;

/**
 * Initialize Firebase Cloud Messaging on native platforms.
 *
 * - No-op on web / SSR.
 * - Requests notification permission (Android 13+ requires POST_NOTIFICATIONS).
 * - Registers the device with FCM and persists the token to `public.device_tokens`.
 * - Wires listeners for token refresh, foreground notifications, and taps.
 *
 * Safe to call multiple times — subsequent calls are no-ops.
 */
export async function initPushNotifications(): Promise<void> {
  if (initialized) return;
  if (!isNativePlatform()) return;

  const { PushNotifications } = await import('@capacitor/push-notifications');

  // 1. Permission
  let perm = await PushNotifications.checkPermissions();
  if (perm.receive === 'prompt' || perm.receive === 'prompt-with-rationale') {
    perm = await PushNotifications.requestPermissions();
  }
  if (perm.receive !== 'granted') {
    console.warn('[push] permission not granted:', perm.receive);
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

  initialized = true;
}

export { saveDeviceToken, removeDeviceToken, flushCachedToken } from './tokenStore';
export { isNativePlatform, getPlatform } from './platform';
