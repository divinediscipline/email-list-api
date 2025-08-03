import { Request, Response } from 'express';
import { EmailService } from '../services/emailService';
import { EmailFilters, PaginationParams, ApiResponse, AuthenticatedRequest } from '../types';

const emailService = new EmailService();

export class EmailController {
  async getEmails(req: Request, res: Response): Promise<void> {
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

      // Parse query parameters
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 15;
      const sortBy = req.query.sortBy as string;
      const sortOrder = req.query.sortOrder as 'asc' | 'desc';

      const filters: EmailFilters = {
        view: req.query.view as 'inbox' | 'starred' | 'important' | 'unread' | 'sent' | 'drafts' | 'trash',
        labels: req.query.labels ? (req.query.labels as string).split(',') : undefined,
        isRead: req.query.isRead !== undefined ? req.query.isRead === 'true' : undefined,
        isStarred: req.query.isStarred !== undefined ? req.query.isStarred === 'true' : undefined,
        isImportant: req.query.isImportant !== undefined ? req.query.isImportant === 'true' : undefined,
        hasAttachments: req.query.hasAttachments !== undefined ? req.query.hasAttachments === 'true' : undefined,
        search: req.query.search as string,
        dateFrom: req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined,
        dateTo: req.query.dateTo ? new Date(req.query.dateTo as string) : undefined
      };

      const pagination: PaginationParams = {
        page,
        limit,
        sortBy,
        sortOrder
      };

      const result = await emailService.getEmails(userId, filters, pagination);
      
      const response: ApiResponse<typeof result.emails> = {
        success: true,
        data: result.emails,
        pagination: result.pagination
      };
      
      res.status(200).json(response);
    } catch (error) {
      const response: ApiResponse<null> = {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get emails'
      };
      
      res.status(500).json(response);
    }
  }

  async getEmailById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      if (!id) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Email ID is required'
        };
        res.status(400).json(response);
        return;
      }

      const email = await emailService.getEmailById(id);
      
      if (!email) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Email not found'
        };
        res.status(404).json(response);
        return;
      }

      const response: ApiResponse<typeof email> = {
        success: true,
        data: email
      };
      
      res.status(200).json(response);
    } catch (error) {
      const response: ApiResponse<null> = {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get email'
      };
      
      res.status(500).json(response);
    }
  }

  async markAsRead(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      if (!id) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Email ID is required'
        };
        res.status(400).json(response);
        return;
      }

      const email = await emailService.markAsRead(id);
      
      if (!email) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Email not found'
        };
        res.status(404).json(response);
        return;
      }

      const response: ApiResponse<typeof email> = {
        success: true,
        data: email,
        message: 'Email marked as read'
      };
      
      res.status(200).json(response);
    } catch (error) {
      const response: ApiResponse<null> = {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to mark email as read'
      };
      
      res.status(500).json(response);
    }
  }

  async toggleStar(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      if (!id) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Email ID is required'
        };
        res.status(400).json(response);
        return;
      }

      const email = await emailService.toggleStar(id);
      
      if (!email) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Email not found'
        };
        res.status(404).json(response);
        return;
      }

      const response: ApiResponse<typeof email> = {
        success: true,
        data: email,
        message: `Email ${email.isStarred ? 'starred' : 'unstarred'}`
      };
      
      res.status(200).json(response);
    } catch (error) {
      const response: ApiResponse<null> = {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to toggle star'
      };
      
      res.status(500).json(response);
    }
  }

  async toggleImportant(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      if (!id) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Email ID is required'
        };
        res.status(400).json(response);
        return;
      }

      const email = await emailService.toggleImportant(id);
      
      if (!email) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Email not found'
        };
        res.status(404).json(response);
        return;
      }

      const response: ApiResponse<typeof email> = {
        success: true,
        data: email,
        message: `Email ${email.isImportant ? 'marked as important' : 'unmarked as important'}`
      };
      
      res.status(200).json(response);
    } catch (error) {
      const response: ApiResponse<null> = {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to toggle important'
      };
      
      res.status(500).json(response);
    }
  }

  async addLabel(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      if (!id) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Email ID is required'
        };
        res.status(400).json(response);
        return;
      }

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

      const { label } = req.body;
      
      if (!label) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Label is required'
        };
        res.status(400).json(response);
        return;
      }

      const email = await emailService.addLabel(id, label, userId);
      
      if (!email) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Email not found'
        };
        res.status(404).json(response);
        return;
      }

      const response: ApiResponse<typeof email> = {
        success: true,
        data: email,
        message: `Label '${label}' added to email`
      };
      
      res.status(200).json(response);
    } catch (error) {
      const response: ApiResponse<null> = {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to add label'
      };
      
      res.status(500).json(response);
    }
  }

  async removeLabel(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      if (!id) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Email ID is required'
        };
        res.status(400).json(response);
        return;
      }

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

      const { label } = req.body;
      
      if (!label) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Label is required'
        };
        res.status(400).json(response);
        return;
      }

      const email = await emailService.removeLabel(id, label, userId);
      
      if (!email) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Email not found'
        };
        res.status(404).json(response);
        return;
      }

      const response: ApiResponse<typeof email> = {
        success: true,
        data: email,
        message: `Label '${label}' removed from email`
      };
      
      res.status(200).json(response);
    } catch (error) {
      const response: ApiResponse<null> = {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to remove label'
      };
      
      res.status(500).json(response);
    }
  }

  async getEmailLabels(req: Request, res: Response): Promise<void> {
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

      const labels = await emailService.getEmailLabels(userId);
      
      const response: ApiResponse<typeof labels> = {
        success: true,
        data: labels
      };
      
      res.status(200).json(response);
    } catch (error) {
      const response: ApiResponse<null> = {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get email labels'
      };
      
      res.status(500).json(response);
    }
  }

  async createEmailLabel(req: Request, res: Response): Promise<void> {
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

      const { name, color } = req.body;
      
      if (!name || !color) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Name and color are required'
        };
        res.status(400).json(response);
        return;
      }

      const label = await emailService.createEmailLabel(userId, name, color);
      
      const response: ApiResponse<typeof label> = {
        success: true,
        data: label,
        message: 'Email label created successfully'
      };
      
      res.status(201).json(response);
    } catch (error) {
      const response: ApiResponse<null> = {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create email label'
      };
      
      res.status(500).json(response);
    }
  }

  async deleteEmailLabel(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      if (!id) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Label ID is required'
        };
        res.status(400).json(response);
        return;
      }

      const success = await emailService.deleteEmailLabel(id);
      
      if (!success) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Email label not found'
        };
        res.status(404).json(response);
        return;
      }

      const response: ApiResponse<null> = {
        success: true,
        message: 'Email label deleted successfully'
      };
      
      res.status(200).json(response);
    } catch (error) {
      const response: ApiResponse<null> = {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete email label'
      };
      
      res.status(500).json(response);
    }
  }

  async getEmailCounts(req: Request, res: Response): Promise<void> {
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

      const counts = await emailService.getEmailCounts(userId);
      
      const response: ApiResponse<typeof counts> = {
        success: true,
        data: counts
      };
      
      res.status(200).json(response);
    } catch (error) {
      const response: ApiResponse<null> = {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get email counts'
      };
      
      res.status(500).json(response);
    }
  }

  async deleteEmail(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      if (!id) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Email ID is required'
        };
        res.status(400).json(response);
        return;
      }

      const success = await emailService.deleteEmail(id);
      
      if (!success) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Email not found'
        };
        res.status(404).json(response);
        return;
      }

      const response: ApiResponse<null> = {
        success: true,
        message: 'Email deleted successfully'
      };
      
      res.status(200).json(response);
    } catch (error) {
      const response: ApiResponse<null> = {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete email'
      };
      
      res.status(500).json(response);
    }
  }
} 