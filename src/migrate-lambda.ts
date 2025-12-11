import { Handler } from 'aws-lambda';
import dotenv from 'dotenv';
import pool from './database/config';

// Load environment variables
dotenv.config();

// Direct Lambda handler for migrations (NOT wrapped with serverless-express)
export const handler: Handler = async (event, context) => {
  console.log('🚀 Migration Lambda invoked');
  console.log('📋 Event:', JSON.stringify(event, null, 2));
  console.log('🔧 Environment:', process.env.NODE_ENV);
  
  const startTime = Date.now();
  
  try {
    // Test database connection first
    console.log('🔌 Testing database connection...');
    const client = await pool.connect();
    console.log('✅ Database connection successful');
    client.release();
    
    // Import and run migrations
    console.log('🌱 Starting database migrations...');
    const { default: runMigrations } = await import('./database/migrate');
    
    await runMigrations();
    
    const duration = Date.now() - startTime;
    console.log(`✅ Migration completed successfully in ${duration}ms`);
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: 'Database migration completed successfully',
        duration: `${duration}ms`,
        timestamp: new Date().toISOString()
      })
    };
    
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('❌ Migration failed:', error);
    console.error('Stack trace:', (error as Error).stack);
    
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        message: 'Database migration failed',
        error: (error as Error).message,
        duration: `${duration}ms`,
        timestamp: new Date().toISOString()
      })
    };
  }
};
