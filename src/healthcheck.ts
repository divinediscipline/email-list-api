import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const testDatabaseConnection = async (): Promise<void> => {
  console.log('🔍 Testing remote database connection...');
  console.log(`📍 Host: ${process.env.DB_HOST}`);
  console.log(`📊 Database: ${process.env.DB_NAME}`);
  console.log(`👤 User: ${process.env.DB_USER}`);
  console.log(`🔌 Port: ${process.env.DB_PORT}`);
  console.log('');

  const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'email_api',
    password: process.env.DB_PASSWORD || 'password',
    port: parseInt(process.env.DB_PORT || '5432'),
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    connectionTimeoutMillis: 5000,
  });

  let client;
  
  try {
    console.log('⏳ Attempting to connect...');
    client = await pool.connect();
    
    console.log('✅ Successfully connected to the database!');
    console.log('');
    
    // Test a simple query
    console.log('🔍 Running test query...');
    const result = await client.query('SELECT version(), current_database(), current_user, NOW() as server_time');
    
    console.log('✅ Query executed successfully!');
    console.log('');
    console.log('📊 Database Information:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Version: ${result.rows[0].version}`);
    console.log(`Database: ${result.rows[0].current_database}`);
    console.log(`User: ${result.rows[0].current_user}`);
    console.log(`Server Time: ${result.rows[0].server_time}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    
    // Check tables
    console.log('🔍 Checking database tables...');
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    if (tablesResult.rows.length > 0) {
      console.log(`✅ Found ${tablesResult.rows.length} table(s):`);
      tablesResult.rows.forEach((row, index) => {
        console.log(`   ${index + 1}. ${row.table_name}`);
      });
    } else {
      console.log('⚠️  No tables found in the database');
    }
    
    console.log('');
    console.log('✅ Database health check PASSED');
    process.exit(0);
    
  } catch (error) {
    console.error('');
    console.error('❌ Database health check FAILED');
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    if (error instanceof Error) {
      console.error('Error:', error.message);
      
      // Provide helpful troubleshooting info
      if (error.message.includes('ENOTFOUND')) {
        console.error('');
        console.error('💡 Troubleshooting: Cannot resolve hostname');
        console.error('   - Check if DB_HOST is correct');
        console.error('   - Verify network connectivity');
        console.error('   - Check if you need VPN access');
      } else if (error.message.includes('ETIMEDOUT') || error.message.includes('timeout')) {
        console.error('');
        console.error('💡 Troubleshooting: Connection timeout');
        console.error('   - Database might be down');
        console.error('   - Firewall might be blocking connection');
        console.error('   - Check if IP is whitelisted on Render');
      } else if (error.message.includes('password authentication failed')) {
        console.error('');
        console.error('💡 Troubleshooting: Authentication failed');
        console.error('   - Check DB_USER and DB_PASSWORD');
        console.error('   - Verify credentials in Render dashboard');
      } else if (error.message.includes('SSL')) {
        console.error('');
        console.error('💡 Troubleshooting: SSL connection issue');
        console.error('   - Check if SSL is properly configured');
        console.error('   - Verify NODE_ENV setting');
      }
    } else {
      console.error('Error:', error);
    }
    
    console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    process.exit(1);
    
  } finally {
    if (client) {
      client.release();
    }
    await pool.end();
  }
};

// Run the test
testDatabaseConnection();



