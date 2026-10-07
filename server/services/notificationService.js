import Notification from '../models/Notification.js';

export const sendInAppNotification = async ({ userId, title, message, type = 'info', meta = {} }) => {
  const notification = await Notification.create({
    user: userId,
    title,
    message,
    type,
    meta
  });

  if (globalThis.io) {
    globalThis.io.emit('notification', {
      userId: String(userId),
      title,
      message,
      type,
      meta,
      notificationId: notification._id
    });
  }

  return notification;
};
