import { Request, Response } from 'express';
import { NotificationService } from '../services/notificationService';
import { ApiResponse, AuthenticatedRequest } from '../types';

const notificationService = new NotificationService();

export class NotificationController {
  async getNotifications(req: Request, res: Response): Promise<void> {
    try {
      const authenticatedReq = req as AuthenticatedRequest;
      const userId = authenticatedReq.user?.userId;
      if (!userId) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'User not authenticated'
        };
        res.status(401).json(response);
        return;
      }

      const limit = parseInt(req.query.limit as string) || 10;
      const notifications = await notificationService.getNotifications(userId, limit);
      
      const response: ApiResponse<typeof notifications> = {
        success: true,
        data: notifications
      };
      
      res.status(200).json(response);
    } catch (error) {
      const response: ApiResponse<null> = {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get notifications'
      };
      
      res.status(500).json(response);
    }
  }

  async getUnreadNotificationCount(req: Request, res: Response): Promise<void> {
    try {
      const authenticatedReq = req as AuthenticatedRequest;
      const userId = authenticatedReq.user?.userId;
      if (!userId) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'User not authenticated'
        };
        res.status(401).json(response);
        return;
      }

      const count = await notificationService.getUnreadNotificationCount(userId);
      
      const response: ApiResponse<{ count: number }> = {
        success: true,
        data: { count }
      };
      
      res.status(200).json(response);
    } catch (error) {
      const response: ApiResponse<null> = {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get unread notification count'
      };
      
      res.status(500).json(response);
    }
  }

  async markNotificationAsRead(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      if (!id) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Notification ID is required'
        };
        res.status(400).json(response);
        return;
      }

      const notification = await notificationService.markNotificationAsRead(id);
      
      if (!notification) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Notification not found'
        };
        res.status(404).json(response);
        return;
      }

      const response: ApiResponse<typeof notification> = {
        success: true,
        data: notification,
        message: 'Notification marked as read'
      };
      
      res.status(200).json(response);
    } catch (error) {
      const response: ApiResponse<null> = {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to mark notification as read'
      };
      
      res.status(500).json(response);
    }
  }

  async markAllNotificationsAsRead(req: Request, res: Response): Promise<void> {
    try {
      const authenticatedReq = req as AuthenticatedRequest;
      const userId = authenticatedReq.user?.userId;
      if (!userId) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'User not authenticated'
        };
        res.status(401).json(response);
        return;
      }

      await notificationService.markAllNotificationsAsRead(userId);
      
      const response: ApiResponse<null> = {
        success: true,
        message: 'All notifications marked as read'
      };
      
      res.status(200).json(response);
    } catch (error) {
      const response: ApiResponse<null> = {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to mark all notifications as read'
      };
      
      res.status(500).json(response);
    }
  }

  async deleteNotification(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      if (!id) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Notification ID is required'
        };
        res.status(400).json(response);
        return;
      }

      const success = await notificationService.deleteNotification(id);
      
      if (!success) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Notification not found'
        };
        res.status(404).json(response);
        return;
      }

      const response: ApiResponse<null> = {
        success: true,
        message: 'Notification deleted successfully'
      };
      
      res.status(200).json(response);
    } catch (error) {
      const response: ApiResponse<null> = {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete notification'
      };
      
      res.status(500).json(response);
    }
  }

  async getMessages(req: Request, res: Response): Promise<void> {
    try {
      const authenticatedReq = req as AuthenticatedRequest;
      const userId = authenticatedReq.user?.userId;
      if (!userId) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'User not authenticated'
        };
        res.status(401).json(response);
        return;
      }

      const limit = parseInt(req.query.limit as string) || 10;
      const messages = await notificationService.getMessages(userId, limit);
      
      const response: ApiResponse<typeof messages> = {
        success: true,
        data: messages
      };
      
      res.status(200).json(response);
    } catch (error) {
      const response: ApiResponse<null> = {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get messages'
      };
      
      res.status(500).json(response);
    }
  }

  async getUnreadMessageCount(req: Request, res: Response): Promise<void> {
    try {
      const authenticatedReq = req as AuthenticatedRequest;
      const userId = authenticatedReq.user?.userId;
      if (!userId) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'User not authenticated'
        };
        res.status(401).json(response);
        return;
      }

      const count = await notificationService.getUnreadMessageCount(userId);
      
      const response: ApiResponse<{ count: number }> = {
        success: true,
        data: { count }
      };
      
      res.status(200).json(response);
    } catch (error) {
      const response: ApiResponse<null> = {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get unread message count'
      };
      
      res.status(500).json(response);
    }
  }

  async markMessageAsRead(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      if (!id) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Message ID is required'
        };
        res.status(400).json(response);
        return;
      }

      const message = await notificationService.markMessageAsRead(id);
      
      if (!message) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Message not found'
        };
        res.status(404).json(response);
        return;
      }

      const response: ApiResponse<typeof message> = {
        success: true,
        data: message,
        message: 'Message marked as read'
      };
      
      res.status(200).json(response);
    } catch (error) {
      const response: ApiResponse<null> = {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to mark message as read'
      };
      
      res.status(500).json(response);
    }
  }

  async markAllMessagesAsRead(req: Request, res: Response): Promise<void> {
    try {
      const authenticatedReq = req as AuthenticatedRequest;
      const userId = authenticatedReq.user?.userId;
      if (!userId) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'User not authenticated'
        };
        res.status(401).json(response);
        return;
      }

      await notificationService.markAllMessagesAsRead(userId);
      
      const response: ApiResponse<null> = {
        success: true,
        message: 'All messages marked as read'
      };
      
      res.status(200).json(response);
    } catch (error) {
      const response: ApiResponse<null> = {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to mark all messages as read'
      };
      
      res.status(500).json(response);
    }
  }

  async deleteMessage(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      if (!id) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Message ID is required'
        };
        res.status(400).json(response);
        return;
      }

      const success = await notificationService.deleteMessage(id);
      
      if (!success) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Message not found'
        };
        res.status(404).json(response);
        return;
      }

      const response: ApiResponse<null> = {
        success: true,
        message: 'Message deleted successfully'
      };
      
      res.status(200).json(response);
    } catch (error) {
      const response: ApiResponse<null> = {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete message'
      };
      
      res.status(500).json(response);
    }
  }
} 