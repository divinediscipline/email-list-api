import { Notification, Message } from '../types';
import databaseService from './databaseService';

export class NotificationService {
  async getNotifications(userId: string, limit: number = 10): Promise<Notification[]> {
    try {
      const notifications = await databaseService.getNotifications(userId);
      return notifications.slice(0, limit);
    } catch (error) {
      console.error('Error getting notifications:', error);
      throw error;
    }
  }

  async getUnreadNotificationCount(userId: string): Promise<number> {
    try {
      const notifications = await databaseService.getNotifications(userId);
      return notifications.filter(notification => !notification.isRead).length;
    } catch (error) {
      console.error('Error getting unread notification count:', error);
      throw error;
    }
  }

  async markNotificationAsRead(id: string): Promise<Notification | null> {
    try {
      return await databaseService.updateNotification(id, { isRead: true });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  async markAllNotificationsAsRead(userId: string): Promise<void> {
    try {
      const notifications = await databaseService.getNotifications(userId);
      const unreadNotifications = notifications.filter(n => !n.isRead);
      
      for (const notification of unreadNotifications) {
        await databaseService.updateNotification(notification.id, { isRead: true });
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  async createNotification(
    userId: string,
    title: string,
    message: string,
    type: 'info' | 'success' | 'warning' | 'error' = 'info'
  ): Promise<Notification> {
    try {
      return await databaseService.createNotification({
        userId,
        title,
        message,
        type,
        isRead: false,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  async deleteNotification(id: string): Promise<boolean> {
    try {
      return await databaseService.deleteNotification(id);
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }

  async getMessages(userId: string, limit: number = 10): Promise<Message[]> {
    try {
      const messages = await databaseService.getMessages(userId);
      return messages.slice(0, limit);
    } catch (error) {
      console.error('Error getting messages:', error);
      throw error;
    }
  }

  async getUnreadMessageCount(userId: string): Promise<number> {
    try {
      const messages = await databaseService.getMessages(userId);
      return messages.filter(message => !message.isRead).length;
    } catch (error) {
      console.error('Error getting unread message count:', error);
      throw error;
    }
  }

  async markMessageAsRead(id: string): Promise<Message | null> {
    try {
      return await databaseService.updateMessage(id, { isRead: true });
    } catch (error) {
      console.error('Error marking message as read:', error);
      throw error;
    }
  }

  async markAllMessagesAsRead(userId: string): Promise<void> {
    try {
      const messages = await databaseService.getMessages(userId);
      const unreadMessages = messages.filter(m => !m.isRead);
      
      for (const message of unreadMessages) {
        await databaseService.updateMessage(message.id, { isRead: true });
      }
    } catch (error) {
      console.error('Error marking all messages as read:', error);
      throw error;
    }
  }

  async createMessage(
    userId: string,
    title: string,
    content: string,
    type: 'system' | 'user' = 'system'
  ): Promise<Message> {
    try {
      return await databaseService.createMessage({
        userId,
        title,
        content,
        type,
        isRead: false,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Error creating message:', error);
      throw error;
    }
  }

  async deleteMessage(id: string): Promise<boolean> {
    try {
      return await databaseService.deleteMessage(id);
    } catch (error) {
      console.error('Error deleting message:', error);
      throw error;
    }
  }
} 