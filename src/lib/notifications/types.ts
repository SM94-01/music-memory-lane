/**
 * Notification service — shared types.
 *
 * Every push-worthy event in the app is described by a discriminated union
 * so the dispatcher can look up the correct notification preference key,
 * derive the message copy, and stay extensible for new event types.
 */

/** Preference keys mirror the columns of `public.notification_prefs`. */
export type NotificationPrefKey = "new_follower" | "likes" | "comments";

export type NotificationEvent =
  | {
      type: "follow";
      /** Profile id of the user who performed the follow. */
      actorId: string;
      /** Profile id of the user being followed. */
      recipientId: string;
      actorName?: string;
    }
  | {
      type: "like";
      /** Profile id of the user who liked. */
      actorId: string;
      /** Album log id that was liked. */
      logId: string;
      actorName?: string;
      /** Optional album title for richer copy. */
      albumTitle?: string;
    }
  | {
      type: "comment";
      /** Profile id of the commenter. */
      actorId: string;
      /** Album log id that was commented on. */
      logId: string;
      actorName?: string;
      albumTitle?: string;
      /** Short preview of the comment body. */
      preview?: string;
    };

export type NotificationType = NotificationEvent["type"];

/** Payload delivered to the `send-push-notification` edge function. */
export interface PushPayload {
  user_id: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}
