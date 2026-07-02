import { Capacitor } from '@capacitor/core';

/** True only on a native Capacitor build (Android/iOS), not on web/SSR. */
export function isNativePlatform(): boolean {
  try {
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

export function getPlatform(): 'android' | 'ios' | 'web' {
  try {
    const p = Capacitor.getPlatform();
    if (p === 'android' || p === 'ios') return p;
  } catch {
    /* ignore */
  }
  return 'web';
}
