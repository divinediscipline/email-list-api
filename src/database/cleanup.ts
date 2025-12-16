import pool from './config';
import dotenv from 'dotenv';

dotenv.config();

// Configurable retention period (default: 48 hours)
const RETENTION_HOURS = parseInt(process.env.DATA_RETENTION_HOURS || '48');

const cleanupOldData = async () => {
  const client = await pool.connect();
  
  try {
    console.log(`🧹 Starting data cleanup for data older than ${RETENTION_HOURS} hours...`);
    
    // Delete old emails and related data
    const emailResult = await client.query(`
      DELETE FROM emails 
      WHERE created_at < NOW() - INTERVAL '${RETENTION_HOURS} hours'
    `);
    
    // Delete old notifications
    const notificationResult = await client.query(`
      DELETE FROM notifications 
      WHERE created_at < NOW() - INTERVAL '${RETENTION_HOURS} hours'
    `);
    
    // Delete old messages
    const messageResult = await client.query(`
      DELETE FROM messages 
      WHERE created_at < NOW() - INTERVAL '${RETENTION_HOURS} hours'
    `);
    
    // Delete orphaned attachments (emails were deleted due to CASCADE)
    const attachmentResult = await client.query(`
      DELETE FROM attachments 
      WHERE email_id NOT IN (SELECT id FROM emails)
    `);
    
    // Delete orphaned email label mappings
    const labelMappingResult = await client.query(`
      DELETE FROM email_label_mappings 
      WHERE email_id NOT IN (SELECT id FROM emails) 
      OR label_id NOT IN (SELECT id FROM email_labels)
    `);
    
    console.log(`✅ Cleanup completed successfully:`);
    console.log(`   - Deleted ${emailResult.rowCount} old emails`);
    console.log(`   - Deleted ${notificationResult.rowCount} old notifications`);
    console.log(`   - Deleted ${messageResult.rowCount} old messages`);
    console.log(`   - Deleted ${attachmentResult.rowCount} orphaned attachments`);
    console.log(`   - Deleted ${labelMappingResult.rowCount} orphaned label mappings`);
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    throw error;
  } finally {
    client.release();
  }
};

const runCleanup = async () => {
  try {
    await cleanupOldData();
    console.log('✅ Data cleanup completed successfully');
    
    // Only exit if running as a script (not in Lambda)
    if (require.main === module) {
      process.exit(0);
    }
  } catch (error) {
    console.error('❌ Cleanup failed:', error);
    
    // Only exit if running as a script (not in Lambda)
    if (require.main === module) {
      process.exit(1);
    }
    
    // Re-throw error for Lambda to handle
    throw error;
  }
};

if (require.main === module) {
  runCleanup();
}

export default cleanupOldData; 