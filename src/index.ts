import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import cron from 'node-cron';
import dotenv from 'dotenv';
import path from 'path';

// Import routes
import authRoutes from './routes/authRoutes';
import emailRoutes from './routes/emailRoutes';
import navigationRoutes from './routes/navigationRoutes';
import notificationRoutes from './routes/notificationRoutes';

// Import database services
import databaseService from './services/databaseService';
import cleanupOldData from './database/cleanup';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// Compression middleware for production
if (process.env.NODE_ENV === 'production') {
  app.use(compression());
}

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.ALLOWED_ORIGINS?.split(',') || ['https://yourdomain.com'] 
    : ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Logging middleware
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static file serving for uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Test database connection
    const client = await databaseService.pool.connect();
    client.release();
    
    res.json({
      success: true,
      message: 'Email API is running',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      database: 'connected',
      version: '1.0.0'
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      message: 'Email API is running but database is disconnected',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      database: 'disconnected',
      error: process.env.NODE_ENV === 'production' ? 'Database connection failed' : (error as Error).message
    });
  }
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/emails', emailRoutes);
app.use('/api/navigation', navigationRoutes);
app.use('/api/notifications', notificationRoutes);

// API documentation endpoint
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'Email Client API',
    version: '1.0.0',
    endpoints: {
      auth: {
        'POST /api/auth/register': 'Register a new user',
        'POST /api/auth/login': 'Login user',
        'POST /api/auth/logout': 'Logout user',
        'GET /api/auth/profile': 'Get user profile',
        'PUT /api/auth/profile': 'Update user profile',
        'PUT /api/auth/change-password': 'Change user password'
      },
      emails: {
        'GET /api/emails': 'Get emails with filtering and pagination',
        'GET /api/emails/counts': 'Get email counts by folder',
        'GET /api/emails/:id': 'Get specific email',
        'DELETE /api/emails/:id': 'Delete email',
        'PATCH /api/emails/:id/read': 'Mark email as read',
        'PATCH /api/emails/:id/star': 'Toggle email star',
        'PATCH /api/emails/:id/important': 'Toggle email important',
        'PATCH /api/emails/:id/move': 'Move email to folder',
        'PATCH /api/emails/:id/labels/add': 'Add label to email',
        'PATCH /api/emails/:id/labels/remove': 'Remove label from email',
        'GET /api/emails/labels': 'Get email labels',
        'POST /api/emails/labels': 'Create email label',
        'DELETE /api/emails/labels/:id': 'Delete email label'
      },
      navigation: {
        'GET /api/navigation/items': 'Get navigation items',
        'GET /api/navigation/upgrade-info': 'Get upgrade information'
      },
      notifications: {
        'GET /api/notifications/notifications': 'Get notifications',
        'GET /api/notifications/notifications/unread-count': 'Get unread notification count',
        'PATCH /api/notifications/notifications/:id/read': 'Mark notification as read',
        'PATCH /api/notifications/notifications/mark-all-read': 'Mark all notifications as read',
        'DELETE /api/notifications/notifications/:id': 'Delete notification',
        'GET /api/notifications/messages': 'Get messages',
        'GET /api/notifications/messages/unread-count': 'Get unread message count',
        'PATCH /api/notifications/messages/:id/read': 'Mark message as read',
        'PATCH /api/notifications/messages/mark-all-read': 'Mark all messages as read',
        'DELETE /api/notifications/messages/:id': 'Delete message'
      }
    },
    authentication: 'Bearer token required for protected endpoints',
    pagination: 'Use ?page=1&limit=15 for pagination',
    filtering: 'Use query parameters for filtering emails',
    dataRetention: `${process.env.DATA_RETENTION_HOURS || 48} hours`
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Global error handler:', err);
  
  // Log error details in development
  if (process.env.NODE_ENV !== 'production') {
    console.error('Error stack:', err.stack);
  }
  
  res.status(err.status || 500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message
  });
});

// Schedule automatic data cleanup
const scheduleCleanup = () => {
  const retentionHours = parseInt(process.env.DATA_RETENTION_HOURS || '48');
  
  // Run cleanup every 6 hours
  cron.schedule('0 */6 * * *', async () => {
    try {
      console.log(`🧹 Running scheduled cleanup for data older than ${retentionHours} hours...`);
      await cleanupOldData();
      console.log('✅ Scheduled cleanup completed successfully');
    } catch (error) {
      console.error('❌ Scheduled cleanup failed:', error);
    }
  });
  
  console.log(`⏰ Scheduled automatic cleanup every 6 hours (retention: ${retentionHours} hours)`);
};

// Graceful shutdown
const gracefulShutdown = (signal: string) => {
  console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);
  
  // Close database connections
  databaseService.pool.end();
  
  console.log('✅ Graceful shutdown completed');
  process.exit(0);
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 Email API server running on port ${PORT}`);
  console.log(`📚 API documentation available at http://localhost:${PORT}/api`);
  console.log(`💚 Health check available at http://localhost:${PORT}/health`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🗄️  Database: ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || '5432'}`);
  console.log(`⏰ Data retention: ${process.env.DATA_RETENTION_HOURS || '48'} hours`);
  
  // Schedule cleanup after server starts
  scheduleCleanup();
});

// Handle server errors
server.on('error', (error) => {
  console.error('❌ Server error:', error);
  process.exit(1);
});

export default app; 