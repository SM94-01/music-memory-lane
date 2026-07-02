import { supabase } from '@/integrations/supabase/client';
import { getPlatform } from './platform';

const LAST_TOKEN_KEY = 'trax.fcm.lastToken';
const LAST_UPSERT_KEY = 'trax.fcm.lastUpsert'; // "<profileId>:<token>"

async function getProfileId(authUserId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('auth_user_id', authUserId)
    .maybeSingle();
  if (error) {
    console.error('[push] failed to resolve profile id', error);
    return null;
  }
  return data?.id ?? null;
}

/**
 * Persist (or refresh) the current device's FCM token for the signed-in user.
 * Writes to `public.user_push_tokens` — one row per device, keyed by unique token.
 * A user can have multiple devices; re-registering the same token just refreshes it.
 *
 * Idempotent: if the same (profileId, token) pair was already upserted this
 * session, we skip the DB round-trip. FCM rotation still triggers a real write
 * because the token value differs.
 */
export async function saveDeviceToken(token: string): Promise<void> {
  const { data: sess } = await supabase.auth.getSession();
  const authUserId = sess.session?.user.id;
  if (!authUserId) {
    // Not signed in yet — cache locally, flush on next init after login.
    try { localStorage.setItem(LAST_TOKEN_KEY, token); } catch { /* ignore */ }
    return;
  }

  const profileId = await getProfileId(authUserId);
  if (!profileId) {
    try { localStorage.setItem(LAST_TOKEN_KEY, token); } catch { /* ignore */ }
    return;
  }

  const marker = `${profileId}:${token}`;
  try {
    if (localStorage.getItem(LAST_UPSERT_KEY) === marker) return;
  } catch { /* ignore */ }

  const platform = getPlatform();
  const now = new Date().toISOString();

  const { error } = await supabase
    .from('user_push_tokens')
    .upsert(
      {
        user_id: profileId,
        token,
        platform,
        updated_at: now,
        last_seen_at: now,
      },
      { onConflict: 'token' },
    );

  if (error) {
    console.error('[push] failed to save device token', error);
    return;
  }

  try {
    localStorage.setItem(LAST_TOKEN_KEY, token);
    localStorage.setItem(LAST_UPSERT_KEY, marker);
  } catch { /* ignore */ }
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
  await supabase.from('user_push_tokens').delete().eq('token', token);
  try {
    localStorage.removeItem(LAST_TOKEN_KEY);
    localStorage.removeItem(LAST_UPSERT_KEY);
  } catch { /* ignore */ }
}
