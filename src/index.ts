import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
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

// Detect if running in AWS Lambda
const isLambda = !!process.env.AWS_LAMBDA_FUNCTION_NAME;

const app = express();
const PORT = process.env.PORT || 3001;

// Base path for Lambda deployment (API Gateway uses /email-list/v1 prefix)
const BASE_PATH = isLambda ? '/email-list/v1' : '';

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

// Compression middleware for production (disabled in Lambda - API Gateway handles compression)
// Compression in Lambda can cause issues with aws-serverless-express and browser clients
if (process.env.NODE_ENV === 'production' && !isLambda) {
  app.use(compression());
}

const getCorsOrigin = () => {
  const { ALLOWED_ORIGINS, NODE_ENV } = process.env;

  if (!ALLOWED_ORIGINS) {
    return true;
  }

  const normalized = ALLOWED_ORIGINS.trim();

  if (normalized === '*' || normalized.toLowerCase() === 'true') {
    return true;
  }

  const origins = normalized
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  return origins.length > 0 ? origins : true;
};

// CORS configuration
app.use(cors({
  origin: getCorsOrigin(),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));



// Logging middleware
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static file serving for uploads (only in non-Lambda environments)
if (!isLambda) {
  app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
}

// Health check endpoint
app.get(`${BASE_PATH}/health`, async (req, res) => {
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
      version: '1.0.0',
      basePath: BASE_PATH || '/'
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
app.use(`${BASE_PATH}/api/auth`, authRoutes);
app.use(`${BASE_PATH}/api/emails`, emailRoutes);
app.use(`${BASE_PATH}/api/navigation`, navigationRoutes);
app.use(`${BASE_PATH}/api/notifications`, notificationRoutes);

// Root endpoint - Welcome message with available endpoints
app.get(`${BASE_PATH}/`, (req, res) => {
  // Get the correct protocol (handle proxy/API Gateway scenarios)
  const protocol = req.get('x-forwarded-proto') || req.protocol;
  const host = req.get('host');
  
  res.json({
    success: true,
    message: 'Welcome to Email Client API',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    documentation: `${protocol}://${host}${BASE_PATH}/api`,
    quickStart: {
      step1: 'View full API documentation',
      step1Url: `${protocol}://${host}${BASE_PATH}/api`,
      step2: 'Check API health',
      step2Url: `${protocol}://${host}${BASE_PATH}/health`,
      step3: 'Login with sample credentials below to get started'
    },
    apiRoutes: {
      note: 'These are route prefixes. See /api documentation for specific endpoints.',
      authentication: `${protocol}://${host}${BASE_PATH}/api/auth/login, /api/auth/register, etc.`,
      emails: `${protocol}://${host}${BASE_PATH}/api/emails, /api/emails/:id, etc.`,
      navigation: `${protocol}://${host}${BASE_PATH}/api/navigation/items, etc.`,
      notifications: `${protocol}://${host}${BASE_PATH}/api/notifications/notifications, etc.`
    },
    sampleCredentials: {
      email: 'sarah.johnson@techcorp.com',
      password: 'SecurePass123!',
      note: 'Use these credentials to test the API endpoints'
    }
  });
});

// API documentation endpoint
app.get(`${BASE_PATH}/api`, (req, res) => {
  // Get the correct protocol (handle proxy/API Gateway scenarios)
  const protocol = req.get('x-forwarded-proto') || req.protocol;
  const host = req.get('host');
  
  res.json({
    success: true,
    message: 'Email Client API - Full Documentation',
    version: '1.0.0',
    baseUrl: `${protocol}://${host}${BASE_PATH}`,
    quickStart: {
      step1: 'Register a new user or login with existing credentials',
      step2: 'Copy the JWT token from the login response',
      step3: 'Use the token in Authorization header: Bearer <token>',
      step4: 'Access protected endpoints using the examples below'
    },
    authentication: {
      type: 'Bearer Token',
      header: 'Authorization: Bearer <token>',
      note: 'Required for all protected endpoints (except /api/auth/register and /api/auth/login)',
      example: 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
    },
    pagination: {
      parameters: '?page=1&limit=15',
      description: 'Use page and limit query parameters for pagination'
    },
    filtering: {
      description: 'Use query parameters for filtering emails',
      examples: {
        view: '?view=inbox|starred|important|unread|sent|drafts|trash',
        labels: '?labels=work,personal',
        search: '?search=meeting',
        dateRange: '?dateFrom=2024-01-01&dateTo=2024-01-31'
      }
    },
    dataRetention: `${process.env.DATA_RETENTION_HOURS || 48} hours`,
    endpoints: {
      auth: {
        register: {
          method: 'POST',
          path: '/api/auth/register',
          description: 'Register a new user',
          request: {
            headers: {
              'Content-Type': 'application/json'
            },
            body: {
              email: 'user@example.com',
              password: 'securepassword123',
              name: 'John Doe',
              role: 'user'
            }
          },
          response: {
            success: {
              status: 201,
              body: {
                success: true,
                data: {
                  id: 'user-123',
                  email: 'user@example.com',
                  name: 'John Doe',
                  role: 'user',
                  avatar: null,
                  createdAt: '2024-01-01T00:00:00.000Z',
                  updatedAt: '2024-01-01T00:00:00.000Z'
                },
                message: 'User registered successfully'
              }
            },
            error: {
              status: 400,
              body: {
                success: false,
                error: 'Email already exists'
              }
            }
          }
        },
        login: {
          method: 'POST',
          path: '/api/auth/login',
          description: 'Login user',
          request: {
            headers: {
              'Content-Type': 'application/json'
            },
            body: {
              email: 'user@example.com',
              password: 'securepassword123'
            }
          },
          response: {
            success: {
              status: 200,
              body: {
                success: true,
                data: {
                  user: {
                    id: 'user-123',
                    email: 'user@example.com',
                    name: 'John Doe',
                    role: 'user',
                    avatar: null,
                    createdAt: '2024-01-01T00:00:00.000Z',
                    updatedAt: '2024-01-01T00:00:00.000Z'
                  },
                  token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
                },
                message: 'Login successful'
              }
            },
            error: {
              status: 401,
              body: {
                success: false,
                error: 'Invalid credentials'
              }
            }
          }
        },
        profile: {
          method: 'GET',
          path: '/api/auth/profile',
          description: 'Get user profile',
          headers: {
            'Authorization': 'Bearer <token>'
          },
          response: {
            success: {
              status: 200,
              body: {
                success: true,
                data: {
                  id: 'user-123',
                  name: 'John Doe',
                  email: 'user@example.com',
                  role: 'user',
                  avatar: null,
                  unreadMessages: 5,
                  unreadNotifications: 2
                }
              }
            }
          }
        },
        updateProfile: {
          method: 'PUT',
          path: '/api/auth/profile',
          description: 'Update user profile',
          headers: {
            'Authorization': 'Bearer <token>',
            'Content-Type': 'application/json'
          },
          request: {
            body: {
              name: 'John Smith',
              avatar: 'https://example.com/avatar.jpg'
            }
          },
          response: {
            success: {
              status: 200,
              body: {
                success: true,
                data: {
                  id: 'user-123',
                  name: 'John Smith',
                  email: 'user@example.com',
                  role: 'user',
                  avatar: 'https://example.com/avatar.jpg',
                  unreadMessages: 5,
                  unreadNotifications: 2
                },
                message: 'Profile updated successfully'
              }
            }
          }
        },
        changePassword: {
          method: 'PUT',
          path: '/api/auth/change-password',
          description: 'Change user password',
          headers: {
            'Authorization': 'Bearer <token>',
            'Content-Type': 'application/json'
          },
          request: {
            body: {
              currentPassword: 'oldpassword123',
              newPassword: 'newpassword456'
            }
          },
          response: {
            success: {
              status: 200,
              body: {
                success: true,
                message: 'Password changed successfully'
              }
            },
            error: {
              status: 400,
              body: {
                success: false,
                error: 'Current password is incorrect'
              }
            }
          }
        }
      },
      emails: {
        getEmails: {
          method: 'GET',
          path: '/api/emails',
          description: 'Get emails with filtering and pagination',
          headers: {
            'Authorization': 'Bearer <token>'
          },
          query: {
            page: '1',
            limit: '15',
            view: 'inbox',
            labels: 'work,personal',
            search: 'meeting',
            isRead: 'false',
            isStarred: 'true',
            isImportant: 'false',
            hasAttachments: 'true',
            dateFrom: '2024-01-01',
            dateTo: '2024-01-31',
            sortBy: 'timestamp',
            sortOrder: 'desc'
          },
          response: {
            success: {
              status: 200,
              body: {
                success: true,
                data: [
                  {
                    id: 'email-123',
                    userId: 'user-123',
                    from: 'sender@example.com',
                    to: 'user@example.com',
                    subject: 'Meeting Tomorrow',
                    body: 'Hi, let\'s meet tomorrow at 2 PM...',
                    isRead: false,
                    isStarred: true,
                    isImportant: false,
                    hasAttachments: true,
                    attachments: [
                      {
                        id: 'att-123',
                        emailId: 'email-123',
                        filename: 'meeting-notes.pdf',
                        size: 1024000,
                        type: 'application/pdf',
                        url: '/uploads/meeting-notes.pdf'
                      }
                    ],
                    labels: ['work', 'meeting'],
                    timestamp: '2024-01-15T10:30:00.000Z',
                    createdAt: '2024-01-15T10:30:00.000Z',
                    updatedAt: '2024-01-15T10:30:00.000Z'
                  }
                ],
                pagination: {
                  page: 1,
                  limit: 15,
                  total: 45,
                  totalPages: 3
                }
              }
            }
          }
        },
        getEmailCounts: {
          method: 'GET',
          path: '/api/emails/counts',
          description: 'Get email counts by view',
          headers: {
            'Authorization': 'Bearer <token>'
          },
          response: {
            success: {
              status: 200,
              body: {
                success: true,
                data: {
                  inbox: 25,
                  starred: 8,
                  important: 12,
                  unread: 15,
                  sent: 30,
                  drafts: 3,
                  trash: 5
                }
              }
            }
          }
        },
        getEmailById: {
          method: 'GET',
          path: '/api/emails/:id',
          description: 'Get specific email',
          headers: {
            'Authorization': 'Bearer <token>'
          },
          response: {
            success: {
              status: 200,
              body: {
                success: true,
                data: {
                  id: 'email-123',
                  userId: 'user-123',
                  from: 'sender@example.com',
                  to: 'user@example.com',
                  subject: 'Meeting Tomorrow',
                  body: 'Hi, let\'s meet tomorrow at 2 PM...',
                  isRead: false,
                  isStarred: true,
                  isImportant: false,
                  hasAttachments: true,
                  attachments: [
                    {
                      id: 'att-123',
                      emailId: 'email-123',
                      filename: 'meeting-notes.pdf',
                      size: 1024000,
                      type: 'application/pdf',
                      url: '/uploads/meeting-notes.pdf'
                    }
                  ],
                  labels: ['work', 'meeting'],
                  timestamp: '2024-01-15T10:30:00.000Z',
                  createdAt: '2024-01-15T10:30:00.000Z',
                  updatedAt: '2024-01-15T10:30:00.000Z'
                }
              }
            }
          }
        },
        markAsRead: {
          method: 'PATCH',
          path: '/api/emails/:id/read',
          description: 'Mark email as read',
          headers: {
            'Authorization': 'Bearer <token>'
          },
          response: {
            success: {
              status: 200,
              body: {
                success: true,
                data: {
                  id: 'email-123',
                  isRead: true
                },
                message: 'Email marked as read'
              }
            }
          }
        },
        toggleStar: {
          method: 'PATCH',
          path: '/api/emails/:id/star',
          description: 'Toggle email star',
          headers: {
            'Authorization': 'Bearer <token>'
          },
          response: {
            success: {
              status: 200,
              body: {
                success: true,
                data: {
                  id: 'email-123',
                  isStarred: true
                },
                message: 'Email starred'
              }
            }
          }
        },
        toggleImportant: {
          method: 'PATCH',
          path: '/api/emails/:id/important',
          description: 'Toggle email important',
          headers: {
            'Authorization': 'Bearer <token>'
          },
          response: {
            success: {
              status: 200,
              body: {
                success: true,
                data: {
                  id: 'email-123',
                  isImportant: true
                },
                message: 'Email marked as important'
              }
            }
          }
        },
        addLabel: {
          method: 'PATCH',
          path: '/api/emails/:id/labels/add',
          description: 'Add label to email by label name (label will be created if it does not exist)',
          headers: {
            'Authorization': 'Bearer <token>',
            'Content-Type': 'application/json'
          },
          request: {
            body: {
              label: 'Work'
            },
            note: 'Use the label name (string), not the label ID. The label will be created automatically if it does not exist.'
          },
          response: {
            success: {
              status: 200,
              body: {
                success: true,
                data: {
                  id: 'email-123',
                  labels: ['work', 'meeting', 'important']
                },
                message: 'Label added to email'
              }
            }
          }
        },
        removeLabel: {
          method: 'PATCH',
          path: '/api/emails/:id/labels/remove',
          description: 'Remove label from email by label name',
          headers: {
            'Authorization': 'Bearer <token>',
            'Content-Type': 'application/json'
          },
          request: {
            body: {
              label: 'Work'
            },
            note: 'Use the label name (string), not the label ID.'
          },
          response: {
            success: {
              status: 200,
              body: {
                success: true,
                data: {
                  id: 'email-123',
                  labels: ['work', 'meeting']
                },
                message: 'Label removed from email'
              }
            }
          }
        },
        getLabels: {
          method: 'GET',
          path: '/api/emails/labels',
          description: 'Get email labels',
          headers: {
            'Authorization': 'Bearer <token>'
          },
          response: {
            success: {
              status: 200,
              body: {
                success: true,
                data: [
                  {
                    id: 'label-123',
                    userId: 'user-123',
                    name: 'Work',
                    color: '#ff6b6b'
                  },
                  {
                    id: 'label-456',
                    userId: 'user-123',
                    name: 'Personal',
                    color: '#4ecdc4'
                  }
                ]
              }
            }
          }
        },
        createLabel: {
          method: 'POST',
          path: '/api/emails/labels',
          description: 'Create email label',
          headers: {
            'Authorization': 'Bearer <token>',
            'Content-Type': 'application/json'
          },
          request: {
            body: {
              name: 'Project Alpha',
              color: '#ff6b6b'
            }
          },
          response: {
            success: {
              status: 201,
              body: {
                success: true,
                data: {
                  id: 'label-789',
                  userId: 'user-123',
                  name: 'Project Alpha',
                  color: '#ff6b6b'
                },
                message: 'Label created successfully'
              }
            }
          }
        },
        deleteLabel: {
          method: 'DELETE',
          path: '/api/emails/labels/:id',
          description: 'Delete email label',
          headers: {
            'Authorization': 'Bearer <token>'
          },
          response: {
            success: {
              status: 200,
              body: {
                success: true,
                message: 'Label deleted successfully'
              }
            }
          }
        },
        deleteEmail: {
          method: 'DELETE',
          path: '/api/emails/:id',
          description: 'Delete email',
          headers: {
            'Authorization': 'Bearer <token>'
          },
          response: {
            success: {
              status: 200,
              body: {
                success: true,
                message: 'Email deleted successfully'
              }
            }
          }
        }
      },
      navigation: {
        getItems: {
          method: 'GET',
          path: '/api/navigation/items',
          description: 'Get navigation items',
          headers: {
            'Authorization': 'Bearer <token>'
          },
          response: {
            success: {
              status: 200,
              body: {
                success: true,
                data: [
                  {
                    id: 'nav-1',
                    name: 'Inbox',
                    icon: 'inbox',
                    path: '/inbox',
                    children: []
                  },
                  {
                    id: 'nav-2',
                    name: 'Starred',
                    icon: 'star',
                    path: '/starred',
                    children: []
                  },
                  {
                    id: 'nav-3',
                    name: 'Important',
                    icon: 'important',
                    path: '/important',
                    children: []
                  }
                ]
              }
            }
          }
        },
        getUpgradeInfo: {
          method: 'GET',
          path: '/api/navigation/upgrade-info',
          description: 'Get upgrade information',
          headers: {
            'Authorization': 'Bearer <token>'
          },
          response: {
            success: {
              status: 200,
              body: {
                success: true,
                data: {
                  currentPlan: 'free',
                  features: [
                    'Up to 100 emails',
                    'Basic labels',
                    'Standard support'
                  ],
                  upgradeUrl: 'https://example.com/upgrade'
                }
              }
            }
          }
        }
      },
      notifications: {
        getNotifications: {
          method: 'GET',
          path: '/api/notifications/notifications',
          description: 'Get notifications',
          headers: {
            'Authorization': 'Bearer <token>'
          },
          query: {
            page: '1',
            limit: '10'
          },
          response: {
            success: {
              status: 200,
              body: {
                success: true,
                data: [
                  {
                    id: 'notif-123',
                    userId: 'user-123',
                    title: 'New Email',
                    message: 'You have received a new email from john@example.com',
                    type: 'info',
                    isRead: false,
                    timestamp: '2024-01-15T10:30:00.000Z'
                  }
                ],
                pagination: {
                  page: 1,
                  limit: 10,
                  total: 25,
                  totalPages: 3
                }
              }
            }
          }
        },
        getUnreadCount: {
          method: 'GET',
          path: '/api/notifications/notifications/unread-count',
          description: 'Get unread notification count',
          headers: {
            'Authorization': 'Bearer <token>'
          },
          response: {
            success: {
              status: 200,
              body: {
                success: true,
                data: {
                  count: 5
                }
              }
            }
          }
        },
        markAsRead: {
          method: 'PATCH',
          path: '/api/notifications/notifications/:id/read',
          description: 'Mark notification as read',
          headers: {
            'Authorization': 'Bearer <token>'
          },
          response: {
            success: {
              status: 200,
              body: {
                success: true,
                data: {
                  id: 'notif-123',
                  isRead: true
                },
                message: 'Notification marked as read'
              }
            }
          }
        },
        markAllAsRead: {
          method: 'PATCH',
          path: '/api/notifications/notifications/mark-all-read',
          description: 'Mark all notifications as read',
          headers: {
            'Authorization': 'Bearer <token>'
          },
          response: {
            success: {
              status: 200,
              body: {
                success: true,
                message: 'All notifications marked as read'
              }
            }
          }
        },
        deleteNotification: {
          method: 'DELETE',
          path: '/api/notifications/notifications/:id',
          description: 'Delete notification',
          headers: {
            'Authorization': 'Bearer <token>'
          },
          response: {
            success: {
              status: 200,
              body: {
                success: true,
                message: 'Notification deleted successfully'
              }
            }
          }
        },
        getMessages: {
          method: 'GET',
          path: '/api/notifications/messages',
          description: 'Get messages',
          headers: {
            'Authorization': 'Bearer <token>'
          },
          query: {
            page: '1',
            limit: '10'
          },
          response: {
            success: {
              status: 200,
              body: {
                success: true,
                data: [
                  {
                    id: 'msg-123',
                    userId: 'user-123',
                    title: 'Welcome to Email Client',
                    content: 'Welcome to your new email client!',
                    type: 'system',
                    isRead: false,
                    timestamp: '2024-01-15T10:30:00.000Z'
                  }
                ],
                pagination: {
                  page: 1,
                  limit: 10,
                  total: 15,
                  totalPages: 2
                }
              }
            }
          }
        },
        getUnreadMessageCount: {
          method: 'GET',
          path: '/api/notifications/messages/unread-count',
          description: 'Get unread message count',
          headers: {
            'Authorization': 'Bearer <token>'
          },
          response: {
            success: {
              status: 200,
              body: {
                success: true,
                data: {
                  count: 3
                }
              }
            }
          }
        },
        markMessageAsRead: {
          method: 'PATCH',
          path: '/api/notifications/messages/:id/read',
          description: 'Mark message as read',
          headers: {
            'Authorization': 'Bearer <token>'
          },
          response: {
            success: {
              status: 200,
              body: {
                success: true,
                data: {
                  id: 'msg-123',
                  isRead: true
                },
                message: 'Message marked as read'
              }
            }
          }
        },
        markAllMessagesAsRead: {
          method: 'PATCH',
          path: '/api/notifications/messages/mark-all-read',
          description: 'Mark all messages as read',
          headers: {
            'Authorization': 'Bearer <token>'
          },
          response: {
            success: {
              status: 200,
              body: {
                success: true,
                message: 'All messages marked as read'
              }
            }
          }
        },
        deleteMessage: {
          method: 'DELETE',
          path: '/api/notifications/messages/:id',
          description: 'Delete message',
          headers: {
            'Authorization': 'Bearer <token>'
          },
          response: {
            success: {
              status: 200,
              body: {
                success: true,
                message: 'Message deleted successfully'
              }
            }
          }
        }
      }
    },
    errorResponses: {
      '400': {
        description: 'Bad Request',
        example: {
          success: false,
          error: 'Invalid request parameters'
        }
      },
      '401': {
        description: 'Unauthorized',
        example: {
          success: false,
          error: 'Authentication required'
        }
      },
      '403': {
        description: 'Forbidden',
        example: {
          success: false,
          error: 'Access denied'
        }
      },
      '404': {
        description: 'Not Found',
        example: {
          success: false,
          error: 'Resource not found'
        }
      },
      '500': {
        description: 'Internal Server Error',
        example: {
          success: false,
          error: 'Internal server error'
        }
      }
    }
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

// Schedule automatic data cleanup (only in non-Lambda environments)
const scheduleCleanup = () => {
  // Check if cleanup is enabled via environment variable (disabled by default)
  const cleanupEnabled = process.env.ENABLE_DATA_CLEANUP === 'true';
  
  if (!cleanupEnabled) {
    console.log('🚫 Data cleanup is disabled by default. Set ENABLE_DATA_CLEANUP=true to enable.');
    return;
  }
  
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

// Graceful shutdown (only in non-Lambda environments)
const gracefulShutdown = (signal: string) => {
  console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);
  
  // Close database connections
  databaseService.pool.end();
  
  console.log('✅ Graceful shutdown completed');
  process.exit(0);
};

// Start server only if not running in Lambda
if (!isLambda) {
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
} else {
  console.log('🔷 Running in AWS Lambda environment');
}

export default app; 