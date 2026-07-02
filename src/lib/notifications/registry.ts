import type { NotificationEvent, NotificationPrefKey, PushPayload } from "./types";

/**
 * Per-event handler describing:
 *  - which preference toggle gates delivery
 *  - how to build the FCM payload (title / body / data)
 *  - a stable dedup key (actor + entity + type) so rapid duplicates are dropped
 *
 * To add a new event type: extend `NotificationEvent`, then register a handler here.
 * No other file needs to change.
 */
export interface EventHandler<E extends NotificationEvent> {
  prefKey: NotificationPrefKey;
  buildPayload: (event: E, recipientId: string) => Omit<PushPayload, "user_id">;
  dedupKey: (event: E, recipientId: string) => string;
}

type Registry = {
  [K in NotificationEvent["type"]]: EventHandler<Extract<NotificationEvent, { type: K }>>;
};

export const eventRegistry: Registry = {
  follow: {
    prefKey: "new_follower",
    buildPayload: (e) => ({
      title: "New follower",
      body: `${e.actorName ?? "Someone"} started following you`,
      data: { type: "follow", actor_id: e.actorId },
    }),
    dedupKey: (e, r) => `follow:${e.actorId}:${r}`,
  },
  like: {
    prefKey: "likes",
    buildPayload: (e) => ({
      title: "New like",
      body: `${e.actorName ?? "Someone"} liked ${e.albumTitle ? `“${e.albumTitle}”` : "your log"}`,
      data: { type: "like", actor_id: e.actorId, log_id: e.logId },
    }),
    dedupKey: (e) => `like:${e.actorId}:${e.logId}`,
  },
  comment: {
    prefKey: "comments",
    buildPayload: (e) => ({
      title: "New comment",
      body: e.preview
        ? `${e.actorName ?? "Someone"}: ${e.preview.slice(0, 80)}`
        : `${e.actorName ?? "Someone"} commented on your log`,
      data: { type: "comment", actor_id: e.actorId, log_id: e.logId },
    }),
    // Comments can legitimately repeat from the same actor on the same log,
    // so include a coarse time bucket (10s window) to only suppress accidental doubles.
    dedupKey: (e) => `comment:${e.actorId}:${e.logId}:${Math.floor(Date.now() / 10_000)}`,
  },
};
