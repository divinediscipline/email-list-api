# Email List API

A production-ready REST API for email client applications with PostgreSQL database persistence and automatic data cleanup, optimized for Render hosting. Built with a Gmail-like interface where emails stay in the inbox and filtering is done through views.

## Features

- 🔐 **Authentication & Authorization** - JWT-based authentication with role-based access
- 📧 **Email Management** - Full CRUD operations for emails with filtering and pagination
- 🏷️ **Email Labels** - Organize emails with custom labels and colors (Gmail-style)
- 👁️ **View-based Filtering** - Filter emails by starred, important, unread, etc. (no folder moving)
- 🔔 **Notifications & Messages** - Real-time notifications and system messages
- 🗄️ **PostgreSQL Database** - Persistent data storage with proper indexing
- 🧹 **Automatic Cleanup** - Configurable data retention (default: 48 hours)
- 🚀 **Production Ready** - Optimized for Render hosting with health checks
- 🔒 **Security** - Rate limiting, CORS, Helmet, input validation
- 📊 **Monitoring** - Health checks, logging, error handling

## Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: PostgreSQL 15+
- **Authentication**: JWT
- **Validation**: express-validator
- **Security**: Helmet, CORS, Rate Limiting
- **Scheduling**: node-cron
- **Hosting**: Render

## Quick Start

### Using Render (Recommended)

1. **Fork/Clone the repository**
   ```bash
   git clone <repository-url>
   cd email-list-api
   ```

2. **Deploy to Render**
   - Connect your GitHub repository to Render
   - Create a new Web Service
   - Set build command: `npm install && npm run build`
   - Set start command: `npm start`
   - Add environment variables (see Environment Variables section)

3. **Set up PostgreSQL on Render**
   - Create a new PostgreSQL database on Render
   - Copy the database connection details
   - Add them to your environment variables

4. **Initialize the database**
   ```bash
   # Run migrations (after deployment)
   npm run db:migrate
   
   # Seed with sample data (optional)
   npm run db:seed
   ```

### Local Development

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up PostgreSQL database**
   ```bash
   # Create database
   createdb email_api
   
   # Or using psql
   psql -U postgres
   CREATE DATABASE email_api;
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

4. **Run database migrations**
   ```bash
   npm run build
   npm run db:migrate
   npm run db:seed
   ```

5. **Start the server**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm run build
   npm start
   ```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `production` | Environment mode |
| `PORT` | `3000` | Server port (Render sets this automatically) |
| `DB_HOST` | `localhost` | PostgreSQL host (Render database URL) |
| `DB_PORT` | `5432` | PostgreSQL port |
| `DB_NAME` | `email_api` | Database name |
| `DB_USER` | `postgres` | Database user |
| `DB_PASSWORD` | `password` | Database password |
| `JWT_SECRET` | `fallback-secret` | JWT signing secret |
| `DATA_RETENTION_HOURS` | `48` | Data retention period |
| `ALLOWED_ORIGINS` | `https://yourdomain.com` | CORS allowed origins |

## Render Deployment

### 1. Create a Render Account
- Sign up at [render.com](https://render.com)
- Connect your GitHub account

### 2. Create a Web Service
- Click "New +" → "Web Service"
- Connect your GitHub repository
- Configure the service:
  - **Name**: `email-api`
  - **Environment**: `Node`
  - **Build Command**: `npm install`
  - **Start Command**: `npm start`
  - **Plan**: Free or Paid (recommended for production)

### 3. Set Environment Variables
In your Render dashboard, add these environment variables:

```bash
NODE_ENV=production
JWT_SECRET=your-super-secret-jwt-key-change-this
DATA_RETENTION_HOURS=48
RATE_LIMIT_MAX_REQUESTS=100
ALLOWED_ORIGINS=https://yourdomain.com
```

### 4. Create PostgreSQL Database
- Click "New +" → "PostgreSQL"
- Choose a plan (Free tier available)
- Copy the connection details
- Add database environment variables to your web service

### 5. Database Environment Variables
Add these to your web service environment variables:

```bash
DB_HOST=your-postgres-host.render.com
DB_PORT=5432
DB_NAME=your_db_name
DB_USER=your_db_user
DB_PASSWORD=your_db_password
```

### 6. Initialize Database
After deployment, run these commands in Render's shell:

```bash
npm run db:migrate
npm run db:seed
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile
- `PUT /api/auth/change-password` - Change password

### Emails
- `GET /api/emails` - Get emails with filtering and pagination
- `GET /api/emails/counts` - Get email counts by view
- `GET /api/emails/:id` - Get specific email
- `DELETE /api/emails/:id` - Delete email
- `PATCH /api/emails/:id/read` - Mark email as read
- `PATCH /api/emails/:id/star` - Toggle email star
- `PATCH /api/emails/:id/important` - Toggle email important

### Email Views (Gmail-style filtering)
- `GET /api/emails?view=inbox` - All emails (default)
- `GET /api/emails?view=starred` - Starred emails
- `GET /api/emails?view=important` - Important emails
- `GET /api/emails?view=unread` - Unread emails
- `GET /api/emails?view=sent` - Sent emails (future)
- `GET /api/emails?view=drafts` - Draft emails (future)
- `GET /api/emails?view=trash` - Deleted emails (future)

### Labels (Gmail-style)
- `GET /api/emails/labels` - Get email labels
- `POST /api/emails/labels` - Create email label
- `DELETE /api/emails/labels/:id` - Delete email label
- `PATCH /api/emails/:id/labels/add` - Add label to email
- `PATCH /api/emails/:id/labels/remove` - Remove label from email

### Notifications
- `GET /api/notifications/notifications` - Get notifications
- `GET /api/notifications/notifications/unread-count` - Get unread count
- `PATCH /api/notifications/notifications/:id/read` - Mark as read
- `PATCH /api/notifications/notifications/mark-all-read` - Mark all as read

### Messages
- `GET /api/notifications/messages` - Get messages
- `GET /api/notifications/messages/unread-count` - Get unread count
- `PATCH /api/notifications/messages/:id/read` - Mark as read
- `PATCH /api/notifications/messages/mark-all-read` - Mark all as read

## Email System Design

### Gmail-like Interface
- **Emails stay in inbox**: No folder moving, just view-based filtering
- **Starring**: Toggle star status (like Gmail's star feature)
- **Important marking**: Toggle important status
- **Labels**: Multiple labels per email (many-to-many relationship)
- **Views**: Filter emails by status (starred, important, unread, etc.)

### Key Differences from Traditional Folders
- Emails remain in the inbox and are filtered by their properties
- Starring an email doesn't move it to a "starred folder"
- Labels work like Gmail - multiple labels can be applied to one email
- Views are just filters, not physical folder locations

## Data Retention

The API automatically cleans up old data to manage storage space:

- **Default retention**: 48 hours
- **Configurable**: Set `DATA_RETENTION_HOURS` environment variable
- **Automatic cleanup**: Runs every 6 hours
- **Affected data**: Emails, notifications, messages, attachments

## Database Schema

### Tables
- `users` - User accounts and authentication
- `emails` - Email messages with metadata (no folder column)
- `attachments` - File attachments for emails
- `email_labels` - Custom labels for organizing emails
- `email_label_mappings` - Many-to-many relationship between emails and labels
- `notifications` - System notifications
- `messages` - System and user messages

### Indexes
- Email queries by user, timestamp, starred, important, read status
- Notification and message queries by user
- Attachment queries by email
- Label queries by user

## Development

### Scripts

```bash
# Development
npm run dev              # Start development server
npm run build           # Build TypeScript
npm run lint            # Run ESLint
npm run lint:fix        # Fix linting issues

# Database
npm run db:migrate      # Run database migrations
npm run db:seed         # Seed database with sample data
npm run db:cleanup      # Manually run data cleanup

# Testing
npm test                # Run tests
```

### Database Operations

```bash
# Run migrations
npm run db:migrate

# Seed database
npm run db:seed

# Manual cleanup
npm run db:cleanup
```

## Security Features

- **JWT Authentication** - Secure token-based authentication
- **Password Hashing** - bcrypt with salt rounds
- **Rate Limiting** - Prevent abuse and DDoS
- **CORS Protection** - Configured for production domains
- **Helmet Security** - Security headers and CSP
- **Input Validation** - Request validation and sanitization
- **SQL Injection Protection** - Parameterized queries
- **XSS Protection** - Content Security Policy

## Monitoring & Health Checks

- **Health Endpoint**: `/health` - Database connectivity and service status
- **Graceful Shutdown**: Proper cleanup on SIGTERM/SIGINT
- **Error Logging**: Structured error logging with stack traces
- **Performance**: Compression and optimized database queries
- **Render Logs**: Access logs through Render dashboard

## Render-Specific Features

- **Auto-deploy**: Automatic deployments on Git push
- **Environment Variables**: Secure environment variable management
- **Database Integration**: Easy PostgreSQL setup
- **SSL**: Automatic SSL certificates
- **Custom Domains**: Easy domain configuration
- **Scaling**: Easy scaling options

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check environment variables in Render dashboard
   - Verify PostgreSQL database is running
   - Check database credentials

2. **Build Fails**
   - Ensure Node.js version is 18+
   - Check package.json for correct scripts
   - Verify all dependencies are installed

3. **App Crashes**
   - Check Render logs for error details
   - Verify all required environment variables are set
   - Check database connectivity

### Useful Commands

```bash
# Check application health
curl https://your-app.onrender.com/health

# View API documentation
curl https://your-app.onrender.com/api

# Manual database cleanup
npm run db:cleanup
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- Create an issue on GitHub
- Check the API documentation at `/api` endpoint
- Review the health check at `/health` endpoint
- Check Render logs in your dashboard 