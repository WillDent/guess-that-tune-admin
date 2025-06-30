import { createNotification, markAsRead, isUnread, Notification } from '../../lib/notifications';

describe('Notification logic utility', () => {
  beforeAll(() => {
    // Mock crypto.randomUUID if not present
    if (!global.crypto) {
      // @ts-ignore
      global.crypto = {};
    }
    if (!global.crypto.randomUUID) {
      // @ts-ignore
      global.crypto.randomUUID = () => 'test-uuid';
    }
  });

  it('creates a notification with correct fields', () => {
    const notif = createNotification({
      userId: 'user1',
      type: 'info',
      message: 'Test message',
      metadata: { foo: 'bar' },
    });
    expect(notif.userId).toBe('user1');
    expect(notif.type).toBe('info');
    expect(notif.message).toBe('Test message');
    expect(notif.read).toBe(false);
    expect(typeof notif.createdAt).toBe('string');
    expect(notif.metadata).toEqual({ foo: 'bar' });
    expect(typeof notif.id).toBe('string');
  });

  it('markAsRead returns a copy with read=true', () => {
    const notif: Notification = createNotification({ userId: 'u', type: 't', message: 'm' });
    const readNotif = markAsRead(notif);
    expect(readNotif).not.toBe(notif);
    expect(readNotif.read).toBe(true);
    expect(notif.read).toBe(false);
  });

  it('isUnread returns true for unread, false for read', () => {
    const notif: Notification = createNotification({ userId: 'u', type: 't', message: 'm' });
    expect(isUnread(notif)).toBe(true);
    const readNotif = markAsRead(notif);
    expect(isUnread(readNotif)).toBe(false);
  });
}); 