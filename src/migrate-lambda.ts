import { Handler } from 'aws-lambda';
import dotenv from 'dotenv';
import pool from './database/config';
import { Pool } from 'pg';

// Load environment variables
dotenv.config();

// Function to create database if it doesn't exist
async function ensureDatabaseExists() {
  const dbName = process.env.DB_NAME || 'email_api';
  
  // Create a connection to the default 'postgres' database
  const defaultPool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: 'postgres', // Connect to default database
    password: process.env.DB_PASSWORD || 'password',
    port: parseInt(process.env.DB_PORT || '5432'),
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  try {
    console.log(`🔍 Checking if database "${dbName}" exists...`);
    
    // Check if database exists
    const checkResult = await defaultPool.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [dbName]
    );

    if (checkResult.rows.length === 0) {
      console.log(`🏗️  Database "${dbName}" does not exist. Creating it...`);
      // Database doesn't exist, create it
      await defaultPool.query(`CREATE DATABASE ${dbName}`);
      console.log(`✅ Database "${dbName}" created successfully`);
    } else {
      console.log(`✅ Database "${dbName}" already exists`);
    }
  } finally {
    await defaultPool.end();
  }
}

// Direct Lambda handler for migrations (NOT wrapped with serverless-express)
export const handler: Handler = async (event, context) => {
  console.log('🚀 Migration Lambda invoked');
  console.log('📋 Event:', JSON.stringify(event, null, 2));
  console.log('🔧 Environment:', process.env.NODE_ENV);
  
  const startTime = Date.now();
  
  try {
    // First, ensure the database exists
    await ensureDatabaseExists();
    
    // Test database connection
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
