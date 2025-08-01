import pool from './config';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const seedDatabase = async () => {
  const client = await pool.connect();
  
  try {
    console.log('🌱 Seeding database with initial data...');
    
    // Create a test user
    const hashedPassword = await bcrypt.hash('password123', 10);
    const userId = uuidv4();
    
    await client.query(`
      INSERT INTO users (id, email, password, name, role)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (email) DO NOTHING
    `, [userId, 'test@example.com', hashedPassword, 'Test User', 'user']);
    
    // Create email labels
    const labels = [
      { id: uuidv4(), name: 'Work', color: '#3B82F6' },
      { id: uuidv4(), name: 'Family', color: '#10B981' },
      { id: uuidv4(), name: 'Friends', color: '#F59E0B' },
      { id: uuidv4(), name: 'Office', color: '#8B5CF6' }
    ];
    
    for (const label of labels) {
      await client.query(`
        INSERT INTO email_labels (id, user_id, name, color)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT DO NOTHING
      `, [label.id, userId, label.name, label.color]);
    }
    
    // Create sample emails
    const sampleEmails = [
      {
        from: 'Nuno Affiliate',
        to: 'test@example.com',
        subject: 'Your application to the Nuno Affiliate Network',
        body: 'Thank you for your interest in joining our affiliate network. We are reviewing your application and will get back to you soon.',
        isRead: false,
        isStarred: true,
        isImportant: false,
        hasAttachments: false,
        folder: 'inbox',
        labels: ['Work']
      },
      {
        from: 'Michael Adams',
        to: 'test@example.com',
        subject: 'Invitation to the company anniversary party',
        body: 'You are cordially invited to our annual company celebration. Please RSVP by the end of the week.',
        isRead: false,
        isStarred: true,
        isImportant: false,
        hasAttachments: true,
        folder: 'inbox',
        labels: ['Work', 'Office']
      },
      {
        from: 'Bunnny Cms',
        to: 'test@example.com',
        subject: 'Added a new features: Dynamic database',
        body: 'We have added new dynamic database features to our CMS. Check out the latest updates in your dashboard.',
        isRead: false,
        isStarred: true,
        isImportant: false,
        hasAttachments: false,
        folder: 'inbox',
        labels: ['Work']
      }
    ];
    
    for (const emailData of sampleEmails) {
      const emailId = uuidv4();
      
      await client.query(`
        INSERT INTO emails (id, user_id, "from", "to", subject, body, is_read, is_starred, is_important, has_attachments, folder)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      `, [
        emailId, userId, emailData.from, emailData.to, emailData.subject, emailData.body,
        emailData.isRead, emailData.isStarred, emailData.isImportant, emailData.hasAttachments, emailData.folder
      ]);
      
      // Add labels to email
      for (const labelName of emailData.labels) {
        const label = labels.find(l => l.name === labelName);
        if (label) {
          await client.query(`
            INSERT INTO email_label_mappings (email_id, label_id)
            VALUES ($1, $2)
          `, [emailId, label.id]);
        }
      }
      
      // Add attachment if email has attachments
      if (emailData.hasAttachments) {
        await client.query(`
          INSERT INTO attachments (email_id, filename, size, type, url)
          VALUES ($1, $2, $3, $4, $5)
        `, [emailId, 'invitation.pdf', 1024000, 'application/pdf', '/uploads/invitation.pdf']);
      }
    }
    
    // Create sample notifications
    const notifications = [
      {
        title: 'Welcome to Email API',
        message: 'Thank you for using our email service. Your account has been successfully created.',
        type: 'success'
      },
      {
        title: 'New Feature Available',
        message: 'We have added new features to improve your email experience.',
        type: 'info'
      }
    ];
    
    for (const notification of notifications) {
      await client.query(`
        INSERT INTO notifications (user_id, title, message, type)
        VALUES ($1, $2, $3, $4)
      `, [userId, notification.title, notification.message, notification.type]);
    }
    
    // Create sample messages
    const messages = [
      {
        title: 'System Maintenance',
        content: 'Scheduled maintenance will occur tonight at 2 AM EST.',
        type: 'system'
      },
      {
        title: 'Account Update',
        content: 'Your account settings have been updated successfully.',
        type: 'user'
      }
    ];
    
    for (const message of messages) {
      await client.query(`
        INSERT INTO messages (user_id, title, content, type)
        VALUES ($1, $2, $3, $4)
      `, [userId, message.title, message.content, message.type]);
    }
    
    console.log('✅ Database seeded successfully');
    console.log('📧 Test user: test@example.com / password123');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    client.release();
  }
};

const runSeed = async () => {
  try {
    await seedDatabase();
    console.log('✅ Database seeding completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

if (require.main === module) {
  runSeed();
}

export default seedDatabase; 