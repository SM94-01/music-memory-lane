import { useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { initPushNotifications, flushCachedToken, isNativePlatform } from './index';

/**
 * Boots FCM once the app mounts, and re-flushes the cached token
 * whenever the user signs in (so tokens minted before login get attached).
 */
export function usePushNotifications() {
  const { session } = useAuth();

  useEffect(() => {
    if (!isNativePlatform()) return;
    if (!session?.user.id) return;
    const timer = window.setTimeout(() => {
      const active = document.activeElement;
      const isTyping = active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement;
      if (!isTyping) void initPushNotifications();
    }, 2500);
    return () => window.clearTimeout(timer);
  }, [session?.user.id]);

  useEffect(() => {
    if (!isNativePlatform()) return;
    if (session?.user.id) void flushCachedToken();
  }, [session?.user.id]);
}
