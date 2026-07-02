import { supabase } from '@/integrations/supabase/client';
import { getPlatform } from './platform';

const LAST_TOKEN_KEY = 'trax.fcm.lastToken';

/**
 * Persist (or refresh) the current device's FCM token for the signed-in user.
 * Safe to call multiple times — upserts by unique token.
 */
export async function saveDeviceToken(token: string): Promise<void> {
  const { data: sess } = await supabase.auth.getSession();
  const userId = sess.session?.user.id;
  if (!userId) {
    // Not signed in yet — cache locally, we'll flush on next init after login.
    try { localStorage.setItem(LAST_TOKEN_KEY, token); } catch { /* ignore */ }
    return;
  }

  const platform = getPlatform();
  const { error } = await supabase
    .from('device_tokens')
    .upsert(
      { user_id: userId, token, platform, updated_at: new Date().toISOString() },
      { onConflict: 'token' },
    );

  if (error) {
    console.error('[push] failed to save device token', error);
    return;
  }

  try { localStorage.setItem(LAST_TOKEN_KEY, token); } catch { /* ignore */ }
}

/** Flush any locally cached token after a delayed login. */
export async function flushCachedToken(): Promise<void> {
  try {
    const t = localStorage.getItem(LAST_TOKEN_KEY);
    if (t) await saveDeviceToken(t);
  } catch { /* ignore */ }
}

/** Remove the current device's token (e.g. on sign-out). */
export async function removeDeviceToken(token: string): Promise<void> {
  await supabase.from('device_tokens').delete().eq('token', token);
}
