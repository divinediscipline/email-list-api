import { Router } from 'express';
import { NotificationController } from '../controllers/notificationController';
import { authenticateToken } from '../middleware/auth';

const router = Router();
const notificationController = new NotificationController();

// All notification routes require authentication
router.use(authenticateToken);

// Notifications
router.get('/notifications', notificationController.getNotifications.bind(notificationController));
router.get('/notifications/unread-count', notificationController.getUnreadNotificationCount.bind(notificationController));
router.patch('/notifications/:id/read', notificationController.markNotificationAsRead.bind(notificationController));
router.patch('/notifications/mark-all-read', notificationController.markAllNotificationsAsRead.bind(notificationController));
router.delete('/notifications/:id', notificationController.deleteNotification.bind(notificationController));

// Messages
router.get('/messages', notificationController.getMessages.bind(notificationController));
router.get('/messages/unread-count', notificationController.getUnreadMessageCount.bind(notificationController));
router.patch('/messages/:id/read', notificationController.markMessageAsRead.bind(notificationController));
router.patch('/messages/mark-all-read', notificationController.markAllMessagesAsRead.bind(notificationController));
router.delete('/messages/:id', notificationController.deleteMessage.bind(notificationController));

export default router; 