import pool from '../database/config';
import { User, Email, EmailLabel, Notification, Message, Attachment } from '../types';

export class DatabaseService {
  // Expose pool for external access
  public pool = pool;

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
        INSERT INTO emails (user_id, "from", "to", subject, body, is_read, is_starred, is_important, has_attachments, folder, timestamp)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
      `, [
        emailData.userId, emailData.from, emailData.to, emailData.subject, emailData.body,
        emailData.isRead, emailData.isStarred, emailData.isImportant, emailData.hasAttachments,
        emailData.folder, emailData.timestamp
      ]);
      
      return result.rows[0];
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
      let whereClause = 'WHERE user_id = $1';
      const params: any[] = [userId];
      let paramIndex = 2;

      if (filters.folder) {
        whereClause += ` AND folder = $${paramIndex}`;
        params.push(filters.folder);
        paramIndex++;
      }

      if (filters.isRead !== undefined) {
        whereClause += ` AND is_read = $${paramIndex}`;
        params.push(filters.isRead);
        paramIndex++;
      }

      if (filters.isStarred !== undefined) {
        whereClause += ` AND is_starred = $${paramIndex}`;
        params.push(filters.isStarred);
        paramIndex++;
      }

      if (filters.isImportant !== undefined) {
        whereClause += ` AND is_important = $${paramIndex}`;
        params.push(filters.isImportant);
        paramIndex++;
      }

      if (filters.search) {
        whereClause += ` AND (subject ILIKE $${paramIndex} OR "from" ILIKE $${paramIndex} OR body ILIKE $${paramIndex})`;
        params.push(`%${filters.search}%`);
        paramIndex++;
      }

      // Get total count
      const countResult = await client.query(`
        SELECT COUNT(*) FROM emails ${whereClause}
      `, params);
      const total = parseInt(countResult.rows[0].count);

      // Get paginated results
      const offset = (pagination.page - 1) * pagination.limit;
      const sortBy = pagination.sortBy || 'timestamp';
      const sortOrder = pagination.sortOrder || 'desc';
      
      const result = await client.query(`
        SELECT * FROM emails ${whereClause}
        ORDER BY ${sortBy} ${sortOrder}
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `, [...params, pagination.limit, offset]);

      return {
        emails: result.rows,
        total
      };
    } finally {
      client.release();
    }
  }

  async getEmailById(id: string): Promise<Email | null> {
    const client = await pool.connect();
    try {
      const result = await client.query('SELECT * FROM emails WHERE id = $1', [id]);
      return result.rows[0] || null;
    } finally {
      client.release();
    }
  }

  async updateEmail(id: string, updates: Partial<Email>): Promise<Email | null> {
    const client = await pool.connect();
    try {
      // Map camelCase property names to snake_case column names
      const columnMapping: Record<string, string> = {
        isRead: 'is_read',
        isStarred: 'is_starred',
        isImportant: 'is_important',
        hasAttachments: 'has_attachments',
        userId: 'user_id',
        createdAt: 'created_at',
        updatedAt: 'updated_at'
      };

      const mappedUpdates: Record<string, any> = {};
      Object.keys(updates).forEach(key => {
        const columnName = columnMapping[key] || key;
        mappedUpdates[columnName] = updates[key as keyof Email];
      });

      const fields = Object.keys(mappedUpdates).map((key, index) => `"${key}" = $${index + 2}`).join(', ');
      const values = Object.values(mappedUpdates);
      
      const result = await client.query(`
        UPDATE emails SET ${fields} WHERE id = $1 RETURNING *
      `, [id, ...values]);
      
      return result.rows[0] || null;
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
        SELECT folder, COUNT(*) as count
        FROM emails
        WHERE user_id = $1
        GROUP BY folder
      `, [userId]);
      
      const counts: Record<string, number> = {
        inbox: 0,
        starred: 0,
        sent: 0,
        important: 0,
        drafts: 0,
        trash: 0
      };
      
      result.rows.forEach(row => {
        counts[row.folder] = parseInt(row.count);
      });
      
      return counts;
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
        userId: 'user_id',
        isRead: 'is_read',
        createdAt: 'created_at',
        updatedAt: 'updated_at'
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
        userId: 'user_id',
        isRead: 'is_read',
        createdAt: 'created_at',
        updatedAt: 'updated_at'
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

  // Cleanup old data
  async cleanupOldData(retentionHours: number): Promise<void> {
    const client = await pool.connect();
    try {
      await client.query(`
        DELETE FROM emails 
        WHERE created_at < NOW() - INTERVAL '${retentionHours} hours'
      `);
      
      await client.query(`
        DELETE FROM notifications 
        WHERE created_at < NOW() - INTERVAL '${retentionHours} hours'
      `);
      
      await client.query(`
        DELETE FROM messages 
        WHERE created_at < NOW() - INTERVAL '${retentionHours} hours'
      `);
    } finally {
      client.release();
    }
  }
}

export default new DatabaseService(); 