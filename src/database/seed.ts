import pool from './config';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const seedDatabase = async () => {
  const client = await pool.connect();
  
  try {
    console.log('🌱 Seeding database with initial data...');
    
    // Clear all existing data (in reverse dependency order)
    console.log('🧹 Clearing existing data...');
    await client.query('DELETE FROM email_label_mappings');
    await client.query('DELETE FROM attachments');
    await client.query('DELETE FROM emails');
    await client.query('DELETE FROM email_labels');
    await client.query('DELETE FROM notifications');
    await client.query('DELETE FROM messages');
    await client.query('DELETE FROM users');
    console.log('✅ Existing data cleared');
    
    // Create a realistic user
    const hashedPassword = await bcrypt.hash('SecurePass123!', 10);
    const userId = uuidv4();
    
    await client.query(`
      INSERT INTO users (id, email, password, name, role)
      VALUES ($1, $2, $3, $4, $5)
    `, [userId, 'sarah.johnson@techcorp.com', hashedPassword, 'Sarah Johnson', 'user']);
    console.log('✅ Created user: sarah.johnson@techcorp.com');
    
    // Create email labels
    const labels = [
      { id: uuidv4(), name: 'Work', color: '#3B82F6' },
      { id: uuidv4(), name: 'Personal', color: '#10B981' },
      { id: uuidv4(), name: 'Finance', color: '#F59E0B' },
      { id: uuidv4(), name: 'Travel', color: '#8B5CF6' },
      { id: uuidv4(), name: 'Shopping', color: '#EC4899' },
      { id: uuidv4(), name: 'Health', color: '#06B6D4' }
    ];
    
    for (const label of labels) {
      await client.query(`
        INSERT INTO email_labels (id, user_id, name, color)
        VALUES ($1, $2, $3, $4)
      `, [label.id, userId, label.name, label.color]);
    }
    console.log('✅ Created email labels');
    
    // Create 20 realistic sample emails
    const sampleEmails = [
      {
        from: 'hr@techcorp.com',
        to: 'sarah.johnson@techcorp.com',
        subject: 'Welcome to TechCorp - Your First Day Tomorrow',
        body: 'Hi Sarah, Welcome to TechCorp! We\'re excited to have you join our team. Your orientation starts tomorrow at 9 AM in the main conference room. Please bring your ID and laptop. Looking forward to meeting you!',
        isRead: false,
        isStarred: true,
        isImportant: true,
        hasAttachments: true,
        labels: ['Work']
      },
      {
        from: 'support@netflix.com',
        to: 'sarah.johnson@techcorp.com',
        subject: 'Your Netflix subscription has been renewed',
        body: 'Hi Sarah, Your Netflix subscription has been successfully renewed for $15.99/month. Your next billing date is March 15, 2024. Thank you for being a valued member!',
        isRead: true,
        isStarred: false,
        isImportant: false,
        hasAttachments: false,
        labels: ['Personal']
      },
      {
        from: 'noreply@linkedin.com',
        to: 'sarah.johnson@techcorp.com',
        subject: 'You have 3 new connection requests',
        body: 'You have 3 new connection requests from professionals in your network. Expand your professional network by accepting these connections.',
        isRead: false,
        isStarred: false,
        isImportant: false,
        hasAttachments: false,
        labels: ['Work']
      },
      {
        from: 'booking@airbnb.com',
        to: 'sarah.johnson@techcorp.com',
        subject: 'Your upcoming trip to Paris - Important details',
        body: 'Your Airbnb reservation in Paris is confirmed for March 20-25. Check-in is at 3 PM. The host will send you the key code 2 hours before arrival.',
        isRead: false,
        isStarred: true,
        isImportant: true,
        hasAttachments: true,
        labels: ['Travel', 'Personal']
      },
      {
        from: 'security@chase.com',
        to: 'sarah.johnson@techcorp.com',
        subject: 'Security Alert: New login detected',
        body: 'We detected a new login to your Chase account from San Francisco, CA. If this was you, no action is needed. If not, please contact us immediately.',
        isRead: false,
        isStarred: true,
        isImportant: true,
        hasAttachments: false,
        labels: ['Finance']
      },
      {
        from: 'appointments@healthcare.com',
        to: 'sarah.johnson@techcorp.com',
        subject: 'Reminder: Annual physical exam tomorrow at 2 PM',
        body: 'This is a reminder for your annual physical exam with Dr. Smith tomorrow at 2 PM. Please arrive 15 minutes early to complete paperwork.',
        isRead: false,
        isStarred: true,
        isImportant: true,
        hasAttachments: false,
        labels: ['Health']
      },
      {
        from: 'noreply@github.com',
        to: 'sarah.johnson@techcorp.com',
        subject: 'Pull request #1234 needs your review',
        body: 'A pull request titled "Add new user authentication feature" in the email-api repository needs your review. Please review the changes and provide feedback.',
        isRead: false,
        isStarred: true,
        isImportant: true,
        hasAttachments: false,
        labels: ['Work']
      },
      {
        from: 'team@asana.com',
        to: 'sarah.johnson@techcorp.com',
        subject: 'New task assigned: Review Q1 marketing strategy',
        body: 'You have been assigned a new task: "Review Q1 marketing strategy" due by March 15. Please review the attached documents and provide feedback.',
        isRead: false,
        isStarred: true,
        isImportant: true,
        hasAttachments: true,
        labels: ['Work']
      },
      {
        from: 'noreply@eventbrite.com',
        to: 'sarah.johnson@techcorp.com',
        subject: 'Your tickets for Tech Conference 2024',
        body: 'Your tickets for Tech Conference 2024 on April 15-17 are confirmed. Event details and QR codes are attached. See you there!',
        isRead: false,
        isStarred: true,
        isImportant: true,
        hasAttachments: true,
        labels: ['Work', 'Travel']
      },
      {
        from: 'support@dropbox.com',
        to: 'sarah.johnson@techcorp.com',
        subject: 'Storage alert: You\'re using 85% of your space',
        body: 'You\'re currently using 8.5 GB of your 10 GB Dropbox storage. Consider upgrading to get more space or clean up old files.',
        isRead: false,
        isStarred: true,
        isImportant: false,
        hasAttachments: false,
        labels: ['Work']
      },
      {
        from: 'noreply@zoom.us',
        to: 'sarah.johnson@techcorp.com',
        subject: 'Meeting reminder: Weekly team sync in 30 minutes',
        body: 'Your weekly team sync meeting starts in 30 minutes. Join the meeting using the link provided. Agenda: Q1 review and Q2 planning.',
        isRead: false,
        isStarred: true,
        isImportant: true,
        hasAttachments: false,
        labels: ['Work']
      },
      {
        from: 'noreply@calendly.com',
        to: 'sarah.johnson@techcorp.com',
        subject: 'New meeting scheduled: Interview with John Smith',
        body: 'A new meeting has been scheduled: "Interview with John Smith" on March 18 at 10 AM. The meeting will be conducted via Zoom.',
        isRead: false,
        isStarred: true,
        isImportant: true,
        hasAttachments: false,
        labels: ['Work']
      },
      {
        from: 'support@amazon.com',
        to: 'sarah.johnson@techcorp.com',
        subject: 'Your Amazon Prime membership expires in 7 days',
        body: 'Your Amazon Prime membership will expire on March 20. Renew now to continue enjoying free shipping, Prime Video, and other benefits.',
        isRead: false,
        isStarred: true,
        isImportant: false,
        hasAttachments: false,
        labels: ['Shopping', 'Personal']
      },
      {
        from: 'orders@starbucks.com',
        to: 'sarah.johnson@techcorp.com',
        subject: 'Your Starbucks order is ready for pickup',
        body: 'Your grande caramel macchiato is ready for pickup at the Market Street location. Order #98765. Thank you for using the Starbucks app!',
        isRead: true,
        isStarred: true,
        isImportant: false,
        hasAttachments: false,
        labels: ['Personal']
      },
      {
        from: 'support@uber.com',
        to: 'sarah.johnson@techcorp.com',
        subject: 'Your ride receipt from yesterday',
        body: 'Here\'s your receipt for your Uber ride from San Francisco Airport to Downtown. Total: $45.20. Thank you for choosing Uber!',
        isRead: true,
        isStarred: true,
        isImportant: false,
        hasAttachments: true,
        labels: ['Travel', 'Finance']
      },
      {
        from: 'noreply@spotify.com',
        to: 'sarah.johnson@techcorp.com',
        subject: 'New releases from artists you follow',
        body: 'Check out the latest releases from artists you follow on Spotify. New music from Taylor Swift, The Weeknd, and more!',
        isRead: true,
        isStarred: false,
        isImportant: false,
        hasAttachments: false,
        labels: ['Personal']
      },
      {
        from: 'support@slack.com',
        to: 'sarah.johnson@techcorp.com',
        subject: 'Weekly digest: Your team activity',
        body: 'Here\'s your weekly digest of team activity. You have 15 unread messages and 3 mentions. Stay connected with your team!',
        isRead: true,
        isStarred: false,
        isImportant: false,
        hasAttachments: false,
        labels: ['Work']
      },
      {
        from: 'noreply@trello.com',
        to: 'sarah.johnson@techcorp.com',
        subject: 'Card due soon: Complete project proposal',
        body: 'The card "Complete project proposal" is due in 2 days. Make sure to update the status and add any final touches.',
        isRead: true,
        isStarred: false,
        isImportant: true,
        hasAttachments: false,
        labels: ['Work']
      },
      {
        from: 'support@figma.com',
        to: 'sarah.johnson@techcorp.com',
        subject: 'Design file shared with you',
        body: 'A new design file has been shared with you. "Mobile App UI Design" is now available for your review and feedback.',
        isRead: true,
        isStarred: false,
        isImportant: false,
        hasAttachments: false,
        labels: ['Work']
      },
      {
        from: 'noreply@notion.com',
        to: 'sarah.johnson@techcorp.com',
        subject: 'Page updated: Project documentation',
        body: 'The page "Project documentation" has been updated by your teammate. Review the changes and provide feedback if needed.',
        isRead: true,
        isStarred: false,
        isImportant: false,
        hasAttachments: false,
        labels: ['Work']
      }
    ];

    // Create label mapping for easy lookup
    const labelMap = new Map();
    for (const label of labels) {
      labelMap.set(label.name, label.id);
    }

    // Insert emails and create label mappings
    for (const email of sampleEmails) {
      const emailId = uuidv4();
      
      // Insert email (without folder)
      await client.query(`
        INSERT INTO emails (id, user_id, "from", "to", subject, body, is_read, is_starred, is_important, has_attachments)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `, [
        emailId, userId, email.from, email.to, email.subject, email.body,
        email.isRead, email.isStarred, email.isImportant, email.hasAttachments
      ]);

      // Create label mappings
      for (const labelName of email.labels) {
        const labelId = labelMap.get(labelName);
        if (labelId) {
          await client.query(`
            INSERT INTO email_label_mappings (email_id, label_id)
            VALUES ($1, $2)
          `, [emailId, labelId]);
        }
      }

      // Create attachments for emails that have them
      if (email.hasAttachments) {
        const attachmentId = uuidv4();
        await client.query(`
          INSERT INTO attachments (id, email_id, filename, size, type, url)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [
          attachmentId, emailId, 'screenshot.jpg', 
          Math.floor(Math.random() * 5000000) + 1000000, // Random size between 1-6MB
          'image/jpeg', '/uploads/screenshot.jpg'
        ]);
      }
    }
    console.log('✅ Created 20 sample emails with labels');

    // Create 20 sample notifications
    const notifications = [
      { title: 'New email received', message: 'You have a new email from hr@techcorp.com', type: 'info' },
      { title: 'Meeting reminder', message: 'Team sync meeting starts in 15 minutes', type: 'warning' },
      { title: 'Task completed', message: 'Project proposal has been submitted successfully', type: 'success' },
      { title: 'System update', message: 'Email system will be updated tonight at 2 AM', type: 'info' },
      { title: 'Storage warning', message: 'You\'re running low on storage space', type: 'warning' },
      { title: 'Backup completed', message: 'Your emails have been backed up successfully', type: 'success' },
      { title: 'New feature available', message: 'Email labels feature is now available', type: 'info' },
      { title: 'Security alert', message: 'New login detected from San Francisco', type: 'warning' },
      { title: 'Subscription renewed', message: 'Your premium subscription has been renewed', type: 'success' },
      { title: 'Maintenance scheduled', message: 'System maintenance scheduled for tomorrow', type: 'info' },
      { title: 'Password expired', message: 'Your password will expire in 3 days', type: 'warning' },
      { title: 'Sync completed', message: 'All emails have been synchronized', type: 'success' },
      { title: 'New contact added', message: 'John Smith has been added to your contacts', type: 'info' },
      { title: 'Quota exceeded', message: 'You\'ve exceeded your monthly email quota', type: 'warning' },
      { title: 'Update available', message: 'A new version of the email client is available', type: 'info' },
      { title: 'Backup failed', message: 'Email backup failed. Please try again', type: 'error' },
      { title: 'Connection restored', message: 'Email server connection has been restored', type: 'success' },
      { title: 'Filter created', message: 'New email filter has been created successfully', type: 'success' },
      { title: 'Import completed', message: 'Email import from Gmail completed', type: 'success' },
      { title: 'Account locked', message: 'Your account has been temporarily locked', type: 'error' },
      { title: 'Welcome back', message: 'Welcome back! You have 5 unread messages', type: 'info' }
    ];

    for (const notification of notifications) {
      await client.query(`
        INSERT INTO notifications (user_id, title, message, type)
        VALUES ($1, $2, $3, $4)
      `, [userId, notification.title, notification.message, notification.type]);
    }
    console.log('✅ Created 20 sample notifications');

    // Create 20 sample messages
    const messages = [
      { title: 'System Message', content: 'Welcome to your email client! Get started by exploring your inbox.', type: 'system' },
      { title: 'Tips & Tricks', content: 'Use labels to organize your emails. You can apply multiple labels to a single email.', type: 'system' },
      { title: 'Keyboard Shortcuts', content: 'Press Ctrl+K to search, Ctrl+E to compose, and Ctrl+Enter to send.', type: 'system' },
      { title: 'Security Notice', content: 'Your account is protected with two-factor authentication.', type: 'system' },
      { title: 'Storage Info', content: 'You\'re using 2.5 GB of your 10 GB storage allowance.', type: 'system' },
      { title: 'Backup Status', content: 'Your emails are automatically backed up every 24 hours.', type: 'system' },
      { title: 'Sync Status', content: 'All emails are synchronized with the server.', type: 'system' },
      { title: 'Feature Update', content: 'New email templates are now available for quick responses.', type: 'system' },
      { title: 'Maintenance Notice', content: 'Scheduled maintenance will occur tonight at 2 AM EST.', type: 'system' },
      { title: 'Performance Tip', content: 'Archive old emails to improve performance and reduce storage usage.', type: 'system' },
      { title: 'Privacy Reminder', content: 'Your emails are encrypted and secure. We never read your messages.', type: 'system' },
      { title: 'Support Available', content: 'Need help? Contact support at help@emailclient.com', type: 'system' },
      { title: 'Update Available', content: 'A new version is available. Update now for the latest features.', type: 'system' },
      { title: 'Connection Status', content: 'Connected to email server. All systems operational.', type: 'system' },
      { title: 'Filter Applied', content: 'Your custom filter "Work Emails" has been applied to 15 messages.', type: 'system' },
      { title: 'Import Complete', content: 'Successfully imported 1,247 emails from your previous client.', type: 'system' },
      { title: 'Backup Complete', content: 'Your emails have been backed up to the cloud successfully.', type: 'system' },
      { title: 'Security Scan', content: 'Security scan completed. No threats detected.', type: 'system' },
      { title: 'Storage Cleanup', content: 'Cleaned up 500 MB of temporary files to free up space.', type: 'system' },
      { title: 'Welcome Message', content: 'Thank you for choosing our email client. We hope you enjoy using it!', type: 'system' },
      { title: 'Feature Guide', content: 'Check out our feature guide to learn about all available options.', type: 'system' }
    ];

    for (const message of messages) {
      await client.query(`
        INSERT INTO messages (user_id, title, content, type)
        VALUES ($1, $2, $3, $4)
      `, [userId, message.title, message.content, message.type]);
    }
    console.log('✅ Created 20 sample messages');

    console.log('🎉 Database seeding completed successfully!');
    console.log('📧 Sample user: sarah.johnson@techcorp.com');
    console.log('🔑 Password: SecurePass123!');
    console.log('📊 Created: 20 emails, 20 notifications, 20 messages, 6 labels');

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
    
    // Only exit if running as a script (not in Lambda)
    if (require.main === module) {
      process.exit(0);
    }
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    
    // Only exit if running as a script (not in Lambda)
    if (require.main === module) {
      process.exit(1);
    }
    
    // Re-throw error for Lambda to handle
    throw error;
  }
};

if (require.main === module) {
  runSeed();
}

export default runSeed; 