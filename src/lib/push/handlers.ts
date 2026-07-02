import type { PushNotificationSchema, ActionPerformed } from '@capacitor/push-notifications';

/**
 * Called when a push arrives while the app is in the foreground.
 * Extend this to show an in-app toast, refresh queries, etc.
 */
export function handleForegroundNotification(notification: PushNotificationSchema) {
  console.log('[push] foreground notification', notification);
  // TODO: wire to in-app toast / query invalidation as needed.
}

/**
 * Called when the user taps a push notification (foreground or background).
 * `data` may contain deep-link info (e.g. { route: '/album/123' }).
 */
export function handleNotificationTap(action: ActionPerformed) {
  const data = action.notification.data ?? {};
  console.log('[push] notification tapped', data);

  const route = typeof data.route === 'string' ? data.route : null;
  if (route && typeof window !== 'undefined') {
    // Simple deep-link: navigate via history so TanStack Router picks it up.
    window.location.assign(route);
  }
}
