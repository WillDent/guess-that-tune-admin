// Notification logic utility for Guess That Tune

export interface Notification {
  id: string;
  userId: string;
  type: string;
  message: string;
  read: boolean;
  createdAt: string; // ISO string
  metadata?: Record<string, any>;
}

/**
 * Creates a new notification object (not DB insert, just logic).
 */
export function createNotification({
  userId,
  type,
  message,
  metadata,
}: {
  userId: string;
  type: string;
  message: string;
  metadata?: Record<string, any>;
}): Notification {
  return {
    id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2),
    userId,
    type,
    message,
    read: false,
    createdAt: new Date().toISOString(),
    ...(metadata ? { metadata } : {}),
  };
}

/**
 * Returns a copy of the notification marked as read.
 */
export function markAsRead(notification: Notification): Notification {
  return { ...notification, read: true };
}

/**
 * Returns true if the notification is unread.
 */
export function isUnread(notification: Notification): boolean {
  return !notification.read;
} 