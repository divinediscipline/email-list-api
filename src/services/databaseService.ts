import pool from '../database/config';
import { User, Email, EmailLabel, Notification, Message, Attachment } from '../types';

export class DatabaseService {
  // Expose pool for external access
  public pool = pool;

  // Transform database result (snake_case) to application format (camelCase)
  private transformEmailFromDatabase(dbEmail: any): Email {
    return {
      id: dbEmail.id,
      userId: dbEmail.user_id,
      from: dbEmail.from,
      to: dbEmail.to,
      subject: dbEmail.subject,
      body: dbEmail.body,
      isRead: dbEmail.is_read,
      isStarred: dbEmail.is_starred,
      isImportant: dbEmail.is_important,
      hasAttachments: dbEmail.has_attachments,
      attachments: [], // Will be populated separately
      labels: dbEmail.labels || [],
      timestamp: dbEmail.timestamp,
      createdAt: dbEmail.created_at,
      updatedAt: dbEmail.updated_at
    };
  }

  // User operations
  async createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    const client = await pool.connect();
    try {
      const result = await client.query(`
        INSERT INTO users (email, password, name, role, avatar)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `, [userData.email, userData.password, userData.name, userData.role, userData.avatar]);
      
      return result.rows[0];
    } finally {
      client.release();
    }
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const client = await pool.connect();
    try {
      const result = await client.query('SELECT * FROM users WHERE email = $1', [email]);
      return result.rows[0] || null;
    } finally {
      client.release();
    }
  }

  async getUserById(id: string): Promise<User | null> {
    const client = await pool.connect();
    try {
      const result = await client.query('SELECT * FROM users WHERE id = $1', [id]);
      return result.rows[0] || null;
    } finally {
      client.release();
    }
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    const client = await pool.connect();
    try {
      // Map camelCase property names to snake_case column names
      const columnMapping: Record<string, string> = {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
      };

      const mappedUpdates: Record<string, any> = {};
      Object.keys(updates).forEach(key => {
        const columnName = columnMapping[key] || key;
        mappedUpdates[columnName] = updates[key as keyof User];
      });

      const fields = Object.keys(mappedUpdates).map((key, index) => `"${key}" = $${index + 2}`).join(', ');
      const values = Object.values(mappedUpdates);
      
      const result = await client.query(`
        UPDATE users SET ${fields} WHERE id = $1 RETURNING *
      `, [id, ...values]);
      
      return result.rows[0] || null;
    } finally {
      client.release();
    }
  }

  // Email operations
  async createEmail(emailData: Omit<Email, 'id' | 'createdAt' | 'updatedAt'>): Promise<Email> {
    const client = await pool.connect();
    try {
      const result = await client.query(`
        INSERT INTO emails (user_id, "from", "to", subject, body, is_read, is_starred, is_important, has_attachments, timestamp)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `, [
        emailData.userId, emailData.from, emailData.to, emailData.subject, emailData.body,
        emailData.isRead, emailData.isStarred, emailData.isImportant, emailData.hasAttachments,
        emailData.timestamp
      ]);
      
      // Transform the created email from snake_case to camelCase
      return this.transformEmailFromDatabase(result.rows[0]);
    } finally {
      client.release();
    }
  }

  async getEmailsByUserId(
    userId: string,
    filters: any = {},
    pagination: any = { page: 1, limit: 15 }
  ): Promise<{ emails: Email[]; total: number }> {
    const client = await pool.connect();
    try {
      let whereClause = 'WHERE e.user_id = $1';
      const params: any[] = [userId];
      let paramIndex = 2;

      // Handle view filters
      if (filters.view) {
        switch (filters.view) {
          case 'starred':
            whereClause += ` AND e.is_starred = true`;
            break;
          case 'important':
            whereClause += ` AND e.is_important = true`;
            break;
          case 'unread':
            whereClause += ` AND e.is_read = false`;
            break;
          case 'sent':
            // For sent emails, we'd need to implement a different logic
            // For now, we'll treat it as a special case
            break;
          case 'drafts':
            // For drafts, we'd need to implement a different logic
            // For now, we'll treat it as a special case
            break;
          case 'trash':
            // For trash, we'd need to implement a different logic
            // For now, we'll treat it as a special case
            break;
        }
      }

      if (filters.isRead !== undefined) {
        whereClause += ` AND e.is_read = $${paramIndex}`;
        params.push(filters.isRead);
        paramIndex++;
      }

      if (filters.isStarred !== undefined) {
        whereClause += ` AND e.is_starred = $${paramIndex}`;
        params.push(filters.isStarred);
        paramIndex++;
      }

      if (filters.isImportant !== undefined) {
        whereClause += ` AND e.is_important = $${paramIndex}`;
        params.push(filters.isImportant);
        paramIndex++;
      }

      if (filters.search) {
        whereClause += ` AND (e.subject ILIKE $${paramIndex} OR e."from" ILIKE $${paramIndex} OR e.body ILIKE $${paramIndex})`;
        params.push(`%${filters.search}%`);
        paramIndex++;
      }

      // Handle label filtering
      if (filters.labels && filters.labels.length > 0) {
        const labelPlaceholders = filters.labels.map((_: any, index: number) => `$${paramIndex + index}`).join(',');
        whereClause += ` AND e.id IN (
          SELECT email_id FROM email_label_mappings elm
          JOIN email_labels el ON elm.label_id = el.id
          WHERE el.name IN (${labelPlaceholders}) AND el.user_id = $1
        )`;
        params.push(...filters.labels);
        paramIndex += filters.labels.length;
      }

      // Get total count
      const countResult = await client.query(`
        SELECT COUNT(*) FROM emails e ${whereClause}
      `, params);
      const total = parseInt(countResult.rows[0].count);

      // Get paginated results with labels
      const offset = (pagination.page - 1) * pagination.limit;
      const sortBy = pagination.sortBy || 'timestamp';
      const sortOrder = pagination.sortOrder || 'desc';
      
      const result = await client.query(`
        SELECT e.*, 
               ARRAY_AGG(DISTINCT el.name) FILTER (WHERE el.name IS NOT NULL) as labels
        FROM emails e
        LEFT JOIN email_label_mappings elm ON e.id = elm.email_id
        LEFT JOIN email_labels el ON elm.label_id = el.id AND el.user_id = e.user_id
        ${whereClause}
        GROUP BY e.id
        ORDER BY e.${sortBy} ${sortOrder}
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `, [...params, pagination.limit, offset]);

      // Transform emails from snake_case to camelCase
      const emails = result.rows.map(row => this.transformEmailFromDatabase(row));
      
      return {
        emails,
        total
      };
    } finally {
      client.release();
    }
  }

  async getEmailById(id: string): Promise<Email | null> {
    const client = await pool.connect();
    try {
      const result = await client.query(`
        SELECT e.*, 
               ARRAY_AGG(DISTINCT el.name) FILTER (WHERE el.name IS NOT NULL) as labels
        FROM emails e
        LEFT JOIN email_label_mappings elm ON e.id = elm.email_id
        LEFT JOIN email_labels el ON elm.label_id = el.id
        WHERE e.id = $1
        GROUP BY e.id
      `, [id]);
      
      if (!result.rows[0]) return null;
      
      // Transform snake_case to camelCase
      const email = this.transformEmailFromDatabase(result.rows[0]);
      return email;
    } finally {
      client.release();
    }
  }

  async updateEmail(id: string, updates: Partial<Email>): Promise<Email | null> {
    const client = await pool.connect();
    try {
      // Map camelCase property names to snake_case column names
      const columnMapping: Record<string, string> = {
        userId: 'user_id',
        isRead: 'is_read',
        isStarred: 'is_starred',
        isImportant: 'is_important',
        hasAttachments: 'has_attachments',
        createdAt: 'created_at',
        updatedAt: 'updated_at'
      };

      const mappedUpdates: Record<string, any> = {};
      Object.keys(updates).forEach(key => {
        if (key !== 'labels' && key !== 'attachments') { // Skip labels and attachments
          const columnName = columnMapping[key] || key;
          mappedUpdates[columnName] = updates[key as keyof Email];
        }
      });

      const fields = Object.keys(mappedUpdates).map((key, index) => `"${key}" = $${index + 2}`).join(', ');
      const values = Object.values(mappedUpdates);
      
      const result = await client.query(`
        UPDATE emails SET ${fields} WHERE id = $1 RETURNING *
      `, [id, ...values]);
      
      if (!result.rows[0]) return null;
      
      // Transform the updated email from snake_case to camelCase
      return this.transformEmailFromDatabase(result.rows[0]);
    } finally {
      client.release();
    }
  }

  async deleteEmail(id: string): Promise<boolean> {
    const client = await pool.connect();
    try {
      const result = await client.query('DELETE FROM emails WHERE id = $1', [id]);
      return (result.rowCount || 0) > 0;
    } finally {
      client.release();
    }
  }

  async getEmailCounts(userId: string): Promise<Record<string, number>> {
    const client = await pool.connect();
    try {
      const result = await client.query(`
        SELECT 
          COUNT(*) as inbox,
          COUNT(*) FILTER (WHERE is_starred = true) as starred,
          COUNT(*) FILTER (WHERE is_important = true) as important,
          COUNT(*) FILTER (WHERE is_read = false) as unread
        FROM emails
        WHERE user_id = $1
      `, [userId]);
      
      const row = result.rows[0];
      return {
        inbox: parseInt(row.inbox),
        starred: parseInt(row.starred),
        important: parseInt(row.important),
        unread: parseInt(row.unread),
        sent: 0, // Will be implemented when sent emails are supported
        drafts: 0, // Will be implemented when drafts are supported
        trash: 0 // Will be implemented when trash is supported
      };
    } finally {
      client.release();
    }
  }

  // Label operations
  async getEmailLabels(userId: string): Promise<EmailLabel[]> {
    const client = await pool.connect();
    try {
      const result = await client.query('SELECT * FROM email_labels WHERE user_id = $1', [userId]);
      return result.rows;
    } finally {
      client.release();
    }
  }

  async createEmailLabel(labelData: Omit<EmailLabel, 'id'>): Promise<EmailLabel> {
    const client = await pool.connect();
    try {
      const result = await client.query(`
        INSERT INTO email_labels (user_id, name, color)
        VALUES ($1, $2, $3)
        RETURNING *
      `, [labelData.userId, labelData.name, labelData.color]);
      
      return result.rows[0];
    } finally {
      client.release();
    }
  }

  async deleteEmailLabel(id: string): Promise<boolean> {
    const client = await pool.connect();
    try {
      const result = await client.query('DELETE FROM email_labels WHERE id = $1', [id]);
      return (result.rowCount || 0) > 0;
    } finally {
      client.release();
    }
  }

  async addLabelToEmail(emailId: string, labelId: string): Promise<boolean> {
    const client = await pool.connect();
    try {
      const result = await client.query(`
        INSERT INTO email_label_mappings (email_id, label_id)
        VALUES ($1, $2)
        ON CONFLICT DO NOTHING
      `, [emailId, labelId]);
      return true;
    } finally {
      client.release();
    }
  }

  async removeLabelFromEmail(emailId: string, labelId: string): Promise<boolean> {
    const client = await pool.connect();
    try {
      const result = await client.query(`
        DELETE FROM email_label_mappings 
        WHERE email_id = $1 AND label_id = $2
      `, [emailId, labelId]);
      return (result.rowCount || 0) > 0;
    } finally {
      client.release();
    }
  }

  async getLabelByName(userId: string, labelName: string): Promise<EmailLabel | null> {
    const client = await pool.connect();
    try {
      const result = await client.query(`
        SELECT * FROM email_labels 
        WHERE user_id = $1 AND name = $2
      `, [userId, labelName]);
      return result.rows[0] || null;
    } finally {
      client.release();
    }
  }

  // Notification operations
  async getNotifications(userId: string): Promise<Notification[]> {
    const client = await pool.connect();
    try {
      const result = await client.query(`
        SELECT * FROM notifications 
        WHERE user_id = $1 
        ORDER BY timestamp DESC
      `, [userId]);
      return result.rows;
    } finally {
      client.release();
    }
  }

  async createNotification(notificationData: Omit<Notification, 'id'>): Promise<Notification> {
    const client = await pool.connect();
    try {
      const result = await client.query(`
        INSERT INTO notifications (user_id, title, message, type, is_read, timestamp)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `, [
        notificationData.userId, notificationData.title, notificationData.message,
        notificationData.type, notificationData.isRead, notificationData.timestamp
      ]);
      
      return result.rows[0];
    } finally {
      client.release();
    }
  }

  async updateNotification(id: string, updates: Partial<Notification>): Promise<Notification | null> {
    const client = await pool.connect();
    try {
      // Map camelCase property names to snake_case column names
      const columnMapping: Record<string, string> = {
        isRead: 'is_read'
      };

      const mappedUpdates: Record<string, any> = {};
      Object.keys(updates).forEach(key => {
        const columnName = columnMapping[key] || key;
        mappedUpdates[columnName] = updates[key as keyof Notification];
      });

      const fields = Object.keys(mappedUpdates).map((key, index) => `"${key}" = $${index + 2}`).join(', ');
      const values = Object.values(mappedUpdates);
      
      const result = await client.query(`
        UPDATE notifications SET ${fields} WHERE id = $1 RETURNING *
      `, [id, ...values]);
      
      return result.rows[0] || null;
    } finally {
      client.release();
    }
  }

  async deleteNotification(id: string): Promise<boolean> {
    const client = await pool.connect();
    try {
      const result = await client.query('DELETE FROM notifications WHERE id = $1', [id]);
      return (result.rowCount || 0) > 0;
    } finally {
      client.release();
    }
  }

  // Message operations
  async getMessages(userId: string): Promise<Message[]> {
    const client = await pool.connect();
    try {
      const result = await client.query(`
        SELECT * FROM messages 
        WHERE user_id = $1 
        ORDER BY timestamp DESC
      `, [userId]);
      return result.rows;
    } finally {
      client.release();
    }
  }

  async createMessage(messageData: Omit<Message, 'id'>): Promise<Message> {
    const client = await pool.connect();
    try {
      const result = await client.query(`
        INSERT INTO messages (user_id, title, content, type, is_read, timestamp)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `, [
        messageData.userId, messageData.title, messageData.content,
        messageData.type, messageData.isRead, messageData.timestamp
      ]);
      
      return result.rows[0];
    } finally {
      client.release();
    }
  }

  async updateMessage(id: string, updates: Partial<Message>): Promise<Message | null> {
    const client = await pool.connect();
    try {
      // Map camelCase property names to snake_case column names
      const columnMapping: Record<string, string> = {
        isRead: 'is_read'
      };

      const mappedUpdates: Record<string, any> = {};
      Object.keys(updates).forEach(key => {
        const columnName = columnMapping[key] || key;
        mappedUpdates[columnName] = updates[key as keyof Message];
      });

      const fields = Object.keys(mappedUpdates).map((key, index) => `"${key}" = $${index + 2}`).join(', ');
      const values = Object.values(mappedUpdates);
      
      const result = await client.query(`
        UPDATE messages SET ${fields} WHERE id = $1 RETURNING *
      `, [id, ...values]);
      
      return result.rows[0] || null;
    } finally {
      client.release();
    }
  }

  async deleteMessage(id: string): Promise<boolean> {
    const client = await pool.connect();
    try {
      const result = await client.query('DELETE FROM messages WHERE id = $1', [id]);
      return (result.rowCount || 0) > 0;
    } finally {
      client.release();
    }
  }

  // Attachment operations
  async getAttachmentsByEmailId(emailId: string): Promise<Attachment[]> {
    const client = await pool.connect();
    try {
      const result = await client.query('SELECT * FROM attachments WHERE email_id = $1', [emailId]);
      return result.rows;
    } finally {
      client.release();
    }
  }

  async createAttachment(attachmentData: Omit<Attachment, 'id'>): Promise<Attachment> {
    const client = await pool.connect();
    try {
      const result = await client.query(`
        INSERT INTO attachments (email_id, filename, size, type, url)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `, [
        attachmentData.emailId, attachmentData.filename, attachmentData.size,
        attachmentData.type, attachmentData.url
      ]);
      
      return result.rows[0];
    } finally {
      client.release();
    }
  }

  // Cleanup operations
  async cleanupOldData(retentionHours: number): Promise<void> {
    const client = await pool.connect();
    try {
      const cutoffTime = new Date(Date.now() - retentionHours * 60 * 60 * 1000);
      
      // Clean up old emails
      await client.query(`
        DELETE FROM emails 
        WHERE created_at < $1
      `, [cutoffTime]);
      
      // Clean up old notifications
      await client.query(`
        DELETE FROM notifications 
        WHERE created_at < $1
      `, [cutoffTime]);
      
      // Clean up old messages
      await client.query(`
        DELETE FROM messages 
        WHERE created_at < $1
      `, [cutoffTime]);
      
      console.log(`✅ Cleaned up data older than ${retentionHours} hours`);
    } finally {
      client.release();
    }
  }
}

export default new DatabaseService(); 