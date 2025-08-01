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
        folder: 'inbox',
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
        folder: 'inbox',
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
        folder: 'inbox',
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
        folder: 'inbox',
        labels: ['Travel', 'Personal']
      },
      {
        from: 'orders@amazon.com',
        to: 'sarah.johnson@techcorp.com',
        subject: 'Your Amazon order #123-4567890-1234567 has shipped',
        body: 'Your order containing "Wireless Bluetooth Headphones" has shipped and is expected to arrive on March 12. Track your package here.',
        isRead: true,
        isStarred: false,
        isImportant: false,
        hasAttachments: false,
        folder: 'inbox',
        labels: ['Shopping']
      },
      {
        from: 'team@slack.com',
        to: 'sarah.johnson@techcorp.com',
        subject: 'Sarah Johnson joined #general',
        body: 'Sarah Johnson has joined the #general channel. Welcome to the team!',
        isRead: true,
        isStarred: false,
        isImportant: false,
        hasAttachments: false,
        folder: 'inbox',
        labels: ['Work']
      },
      {
        from: 'noreply@spotify.com',
        to: 'sarah.johnson@techcorp.com',
        subject: 'Your weekly mix is ready',
        body: 'Your personalized weekly mix featuring artists like Taylor Swift, Ed Sheeran, and The Weeknd is ready to stream. Discover new music tailored just for you.',
        isRead: false,
        isStarred: false,
        isImportant: false,
        hasAttachments: false,
        folder: 'inbox',
        labels: ['Personal']
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
        folder: 'inbox',
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
        folder: 'inbox',
        labels: ['Health']
      },
      {
        from: 'newsletter@techcrunch.com',
        to: 'sarah.johnson@techcorp.com',
        subject: 'TechCrunch Daily: Latest in Tech News',
        body: 'Today\'s top stories: Apple announces new iPhone features, Google releases Android 15 beta, and startup funding reaches new heights in Q1.',
        isRead: false,
        isStarred: false,
        isImportant: false,
        hasAttachments: false,
        folder: 'inbox',
        labels: ['Work']
      },
      {
        from: 'support@uber.com',
        to: 'sarah.johnson@techcorp.com',
        subject: 'Your ride receipt from yesterday',
        body: 'Here\'s your receipt for your Uber ride from San Francisco Airport to Downtown. Total: $45.20. Thank you for choosing Uber!',
        isRead: true,
        isStarred: false,
        isImportant: false,
        hasAttachments: true,
        folder: 'inbox',
        labels: ['Travel']
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
        folder: 'inbox',
        labels: ['Work']
      },
      {
        from: 'orders@starbucks.com',
        to: 'sarah.johnson@techcorp.com',
        subject: 'Your Starbucks order is ready for pickup',
        body: 'Your grande caramel macchiato is ready for pickup at the Market Street location. Order #98765. Thank you for using the Starbucks app!',
        isRead: true,
        isStarred: false,
        isImportant: false,
        hasAttachments: false,
        folder: 'inbox',
        labels: ['Personal']
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
        folder: 'inbox',
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
        folder: 'inbox',
        labels: ['Work', 'Travel']
      },
      {
        from: 'support@dropbox.com',
        to: 'sarah.johnson@techcorp.com',
        subject: 'Storage alert: You\'re using 85% of your space',
        body: 'You\'re currently using 8.5 GB of your 10 GB Dropbox storage. Consider upgrading to get more space or clean up old files.',
        isRead: false,
        isStarred: false,
        isImportant: false,
        hasAttachments: false,
        folder: 'inbox',
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
        folder: 'inbox',
        labels: ['Work']
      },
      {
        from: 'orders@sephora.com',
        to: 'sarah.johnson@techcorp.com',
        subject: 'Your Sephora order has been delivered',
        body: 'Your order containing "La Mer moisturizer" has been delivered to your doorstep. Please check your package and let us know if everything is as expected.',
        isRead: true,
        isStarred: false,
        isImportant: false,
        hasAttachments: false,
        folder: 'inbox',
        labels: ['Shopping']
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
        folder: 'inbox',
        labels: ['Work']
      },
      {
        from: 'support@amazon.com',
        to: 'sarah.johnson@techcorp.com',
        subject: 'Your Amazon Prime membership expires in 7 days',
        body: 'Your Amazon Prime membership will expire on March 20. Renew now to continue enjoying free shipping, Prime Video, and other benefits.',
        isRead: false,
        isStarred: false,
        isImportant: false,
        hasAttachments: false,
        folder: 'inbox',
        labels: ['Shopping']
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
        const attachmentTypes = ['application/pdf', 'image/jpeg', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        const attachmentNames = ['document.pdf', 'screenshot.jpg', 'report.docx'];
        
        const randomType = attachmentTypes[Math.floor(Math.random() * attachmentTypes.length)];
        const randomName = attachmentNames[Math.floor(Math.random() * attachmentNames.length)];
        const randomSize = Math.floor(Math.random() * 5000000) + 100000; // 100KB to 5MB
        
        await client.query(`
          INSERT INTO attachments (email_id, filename, size, type, url)
          VALUES ($1, $2, $3, $4, $5)
        `, [emailId, randomName, randomSize, randomType, `/uploads/${randomName}`]);
      }
    }
    console.log('✅ Created 20 sample emails with labels and attachments');
    
    // Create 20 sample notifications
    const notifications = [
      { title: 'Welcome to Email API', message: 'Your account has been successfully created. Welcome to our email service!', type: 'success' },
      { title: 'New Feature Available', message: 'We have added new email filtering and labeling features to improve your experience.', type: 'info' },
      { title: 'Security Update', message: 'Your account security has been enhanced with two-factor authentication.', type: 'warning' },
      { title: 'Storage Alert', message: 'You are using 85% of your email storage. Consider upgrading your plan.', type: 'warning' },
      { title: 'Backup Complete', message: 'Your email data has been successfully backed up to our secure servers.', type: 'success' },
      { title: 'Maintenance Notice', message: 'Scheduled maintenance will occur tonight at 2 AM EST. Service may be temporarily unavailable.', type: 'info' },
      { title: 'New Device Login', message: 'A new device has logged into your account from San Francisco, CA.', type: 'warning' },
      { title: 'Password Updated', message: 'Your password has been successfully updated. If this wasn\'t you, please contact support.', type: 'success' },
      { title: 'Email Sync Complete', message: 'All your emails have been synchronized across all your devices.', type: 'success' },
      { title: 'Storage Upgrade', message: 'Your storage plan has been upgraded to 50GB. Enjoy the extra space!', type: 'success' },
      { title: 'Account Verification', message: 'Please verify your email address to complete your account setup.', type: 'warning' },
      { title: 'New Label Created', message: 'Your new email label "Work" has been created successfully.', type: 'success' },
      { title: 'Email Deleted', message: 'The selected email has been moved to trash. You can restore it within 30 days.', type: 'info' },
      { title: 'Filter Applied', message: 'Your new email filter has been applied to incoming messages.', type: 'success' },
      { title: 'Backup Failed', message: 'Your email backup failed. Please try again or contact support.', type: 'error' },
      { title: 'Account Locked', message: 'Your account has been temporarily locked due to multiple failed login attempts.', type: 'error' },
      { title: 'Email Restored', message: 'The deleted email has been successfully restored to your inbox.', type: 'success' },
      { title: 'New Contact Added', message: 'A new contact has been added to your address book.', type: 'success' },
      { title: 'Sync Error', message: 'There was an error syncing your emails. Please check your internet connection.', type: 'error' },
      { title: 'Premium Features', message: 'Upgrade to premium to unlock advanced features like unlimited storage and priority support.', type: 'info' }
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
      { title: 'System Maintenance', content: 'Scheduled maintenance will occur tonight at 2 AM EST. Service may be temporarily unavailable during this time.', type: 'system' },
      { title: 'Account Update', content: 'Your account settings have been updated successfully. All changes have been applied.', type: 'user' },
      { title: 'Welcome Message', content: 'Welcome to our email service! We\'re excited to have you on board. Explore our features and let us know if you need help.', type: 'system' },
      { title: 'Security Alert', content: 'We detected unusual activity on your account. Please review your recent login activity.', type: 'system' },
      { title: 'Feature Announcement', content: 'We\'ve added new email templates and advanced search features. Check them out in your settings.', type: 'system' },
      { title: 'Storage Warning', content: 'You\'re approaching your storage limit. Consider deleting old emails or upgrading your plan.', type: 'system' },
      { title: 'Backup Status', content: 'Your email backup completed successfully. Your data is safe and secure.', type: 'system' },
      { title: 'New Device', content: 'A new device has been authorized for your account. If this wasn\'t you, please change your password.', type: 'system' },
      { title: 'Password Reset', content: 'Your password has been reset successfully. Please log in with your new password.', type: 'user' },
      { title: 'Email Recovery', content: 'We\'ve recovered 15 emails that were accidentally deleted. They\'re now back in your inbox.', type: 'system' },
      { title: 'Account Verification', content: 'Please verify your email address to complete your account setup and unlock all features.', type: 'system' },
      { title: 'Premium Upgrade', content: 'Upgrade to premium to enjoy unlimited storage, priority support, and advanced features.', type: 'system' },
      { title: 'Sync Complete', content: 'All your emails have been synchronized across all your devices. Everything is up to date.', type: 'system' },
      { title: 'Filter Applied', content: 'Your new email filter has been applied. Incoming emails will be automatically organized.', type: 'user' },
      { title: 'Contact Import', content: 'Your contacts have been successfully imported from your previous email service.', type: 'system' },
      { title: 'Calendar Sync', content: 'Your calendar has been synchronized with your email account. Events are now linked.', type: 'system' },
      { title: 'Theme Updated', content: 'Your email theme has been updated to the new dark mode. You can change it anytime in settings.', type: 'user' },
      { title: 'Notification Settings', content: 'Your notification preferences have been updated. You\'ll now receive alerts for important emails.', type: 'user' },
      { title: 'Data Export', content: 'Your email data export is ready for download. The file contains all your emails and contacts.', type: 'system' },
      { title: 'Account Recovery', content: 'Your account has been successfully recovered. All your data is intact and accessible.', type: 'system' }
    ];
    
    for (const message of messages) {
      await client.query(`
        INSERT INTO messages (user_id, title, content, type)
        VALUES ($1, $2, $3, $4)
      `, [userId, message.title, message.content, message.type]);
    }
    console.log('✅ Created 20 sample messages');
    
    console.log('✅ Database seeded successfully');
    console.log('📊 Summary:');
    console.log('   - 1 user created');
    console.log('   - 6 email labels created');
    console.log('   - 20 emails with labels and attachments');
    console.log('   - 20 notifications');
    console.log('   - 20 messages');
    console.log('📧 Test user: sarah.johnson@techcorp.com / SecurePass123!');
    
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