import { v4 as uuidv4 } from 'uuid';
import { Email, EmailFilters, PaginationParams, EmailLabel, EmailFolder } from '../types';
import databaseService from './databaseService';

export class EmailService {
  async getEmails(
    userId: string,
    filters: EmailFilters = {},
    pagination: PaginationParams = { page: 1, limit: 15 }
  ): Promise<{ emails: Email[]; total: number; pagination: any }> {
    try {
      const result = await databaseService.getEmailsByUserId(userId, filters, pagination);
      
      // Get attachments for each email
      const emailsWithAttachments = await Promise.all(
        result.emails.map(async (email) => {
          const attachments = await databaseService.getAttachmentsByEmailId(email.id);
          return {
            ...email,
            attachments
          };
        })
      );

      const totalPages = Math.ceil(result.total / pagination.limit);

      return {
        emails: emailsWithAttachments,
        total: result.total,
        pagination: {
          page: pagination.page,
          limit: pagination.limit,
          total: result.total,
          totalPages
        }
      };
    } catch (error) {
      console.error('Error getting emails:', error);
      throw error;
    }
  }

  async getEmailById(id: string): Promise<Email | null> {
    try {
      const email = await databaseService.getEmailById(id);
      if (!email) return null;
      
      const attachments = await databaseService.getAttachmentsByEmailId(id);
      return {
        ...email,
        attachments
      };
    } catch (error) {
      console.error('Error getting email by id:', error);
      throw error;
    }
  }

  async markAsRead(id: string): Promise<Email | null> {
    try {
      const email = await databaseService.updateEmail(id, { isRead: true });
      if (!email) return null;
      
      const attachments = await databaseService.getAttachmentsByEmailId(id);
      return {
        ...email,
        attachments
      };
    } catch (error) {
      console.error('Error marking email as read:', error);
      throw error;
    }
  }

  async toggleStar(id: string): Promise<Email | null> {
    try {
      const email = await databaseService.getEmailById(id);
      if (!email) return null;
      
      const updatedEmail = await databaseService.updateEmail(id, { 
        isStarred: !email.isStarred 
      });
      if (!updatedEmail) return null;
      
      const attachments = await databaseService.getAttachmentsByEmailId(id);
      return {
        ...updatedEmail,
        attachments
      };
    } catch (error) {
      console.error('Error toggling star:', error);
      throw error;
    }
  }

  async toggleImportant(id: string): Promise<Email | null> {
    try {
      const email = await databaseService.getEmailById(id);
      if (!email) return null;
      
      const updatedEmail = await databaseService.updateEmail(id, { 
        isImportant: !email.isImportant 
      });
      if (!updatedEmail) return null;
      
      const attachments = await databaseService.getAttachmentsByEmailId(id);
      return {
        ...updatedEmail,
        attachments
      };
    } catch (error) {
      console.error('Error toggling important:', error);
      throw error;
    }
  }

  async moveToFolder(id: string, folder: EmailFolder): Promise<Email | null> {
    try {
      const email = await databaseService.updateEmail(id, { folder });
      if (!email) return null;
      
      const attachments = await databaseService.getAttachmentsByEmailId(id);
      return {
        ...email,
        attachments
      };
    } catch (error) {
      console.error('Error moving email to folder:', error);
      throw error;
    }
  }

  async addLabel(id: string, label: string): Promise<Email | null> {
    try {
      // This would need to be implemented with the label mapping table
      // For now, we'll just return the email as is
      const email = await databaseService.getEmailById(id);
      if (!email) return null;
      
      const attachments = await databaseService.getAttachmentsByEmailId(id);
      return {
        ...email,
        attachments
      };
    } catch (error) {
      console.error('Error adding label:', error);
      throw error;
    }
  }

  async removeLabel(id: string, label: string): Promise<Email | null> {
    try {
      // This would need to be implemented with the label mapping table
      // For now, we'll just return the email as is
      const email = await databaseService.getEmailById(id);
      if (!email) return null;
      
      const attachments = await databaseService.getAttachmentsByEmailId(id);
      return {
        ...email,
        attachments
      };
    } catch (error) {
      console.error('Error removing label:', error);
      throw error;
    }
  }

  async getEmailLabels(userId: string): Promise<EmailLabel[]> {
    try {
      return await databaseService.getEmailLabels(userId);
    } catch (error) {
      console.error('Error getting email labels:', error);
      throw error;
    }
  }

  async createEmailLabel(userId: string, name: string, color: string): Promise<EmailLabel> {
    try {
      return await databaseService.createEmailLabel({ userId, name, color });
    } catch (error) {
      console.error('Error creating email label:', error);
      throw error;
    }
  }

  async deleteEmailLabel(id: string): Promise<boolean> {
    try {
      return await databaseService.deleteEmailLabel(id);
    } catch (error) {
      console.error('Error deleting email label:', error);
      throw error;
    }
  }

  async getEmailCounts(userId: string): Promise<Record<EmailFolder, number>> {
    try {
      const counts = await databaseService.getEmailCounts(userId);
      return {
        inbox: counts.inbox || 0,
        starred: counts.starred || 0,
        sent: counts.sent || 0,
        important: counts.important || 0,
        drafts: counts.drafts || 0,
        trash: counts.trash || 0
      };
    } catch (error) {
      console.error('Error getting email counts:', error);
      throw error;
    }
  }

  async deleteEmail(id: string): Promise<boolean> {
    try {
      return await databaseService.deleteEmail(id);
    } catch (error) {
      console.error('Error deleting email:', error);
      throw error;
    }
  }
} 