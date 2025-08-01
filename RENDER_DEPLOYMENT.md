# Render Deployment Guide

This guide will help you deploy the Email API to Render without Docker.

## Prerequisites

- A GitHub account
- A Render account (sign up at [render.com](https://render.com))
- Your code pushed to a GitHub repository

## Step 1: Connect Your Repository

1. Log in to your Render dashboard
2. Click "New +" → "Web Service"
3. Connect your GitHub account if not already connected
4. Select your repository containing the Email API

## Step 2: Configure the Web Service

### Basic Configuration
- **Name**: `email-api` (or your preferred name)
- **Environment**: `Node`
- **Region**: Choose closest to your users
- **Branch**: `main` (or your default branch)
- **Root Directory**: Leave empty (if code is in root)

### Build & Deploy Settings
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`
- **Plan**: Free (for testing) or Paid (for production)

## Step 3: Set Environment Variables

In your Render dashboard, add these environment variables:

### Required Variables
```bash
NODE_ENV=production
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
DATA_RETENTION_HOURS=48
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MS=900000
ALLOWED_ORIGINS=https://yourdomain.com
```

### Database Variables (will be set after creating database)
```bash
DB_HOST=your-postgres-host.render.com
DB_PORT=5432
DB_NAME=email_api
DB_USER=your_db_user
DB_PASSWORD=your_db_password
```

## Step 4: Create PostgreSQL Database

1. In your Render dashboard, click "New +" → "PostgreSQL"
2. Configure the database:
   - **Name**: `email-api-db`
   - **Database**: `email_api`
   - **User**: `email_api_user`
   - **Plan**: Free (for testing) or Paid (for production)
   - **Region**: Same as your web service

3. After creation, copy the connection details and add them to your web service environment variables

## Step 5: Deploy and Initialize

1. **Deploy**: Click "Create Web Service" to start the deployment
2. **Wait for Build**: Monitor the build logs for any issues
3. **Database Initialization**: The application will automatically:
   - Run database migrations on startup
   - Clear all existing data from the database
   - Seed the database with fresh sample data (realistic user and 20 records each for emails, notifications, and messages)

**Note**: Database seeding is now automatic and will occur on every application startup. The seeding process clears all existing data and creates fresh sample data, ensuring a clean slate for each deployment.

## Step 6: Verify Deployment

1. **Health Check**: Visit `https://your-app.onrender.com/health`
2. **API Documentation**: Visit `https://your-app.onrender.com/api`
3. **Test Endpoints**: Use the test-api.http file or Postman
4. **Login with Test User**: 
   - Email: `sarah.johnson@techcorp.com`
   - Password: `SecurePass123!`

## Environment Variables Reference

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `NODE_ENV` | Environment mode | Yes | `production` |
| `PORT` | Server port | No | Set by Render |
| `JWT_SECRET` | JWT signing secret | Yes | - |
| `DB_HOST` | PostgreSQL host | Yes | - |
| `DB_PORT` | PostgreSQL port | Yes | `5432` |
| `DB_NAME` | Database name | Yes | `email_api` |
| `DB_USER` | Database user | Yes | - |
| `DB_PASSWORD` | Database password | Yes | - |
| `DATA_RETENTION_HOURS` | Data retention period | No | `48` |
| `RATE_LIMIT_MAX_REQUESTS` | Rate limit requests | No | `100` |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window | No | `900000` |
| `ALLOWED_ORIGINS` | CORS allowed origins | No | `https://yourdomain.com` |

## Troubleshooting

### Common Issues

1. **Build Fails**
   - Check that all dependencies are in package.json
   - Verify Node.js version is 18+
   - Check build logs for specific errors

2. **Database Connection Failed**
   - Verify database environment variables are set correctly
   - Check that PostgreSQL database is running
   - Ensure database credentials are correct

3. **App Crashes on Start**
   - Check that all required environment variables are set
   - Verify the start command is correct
   - Check application logs for errors

4. **Health Check Fails**
   - Verify database connection
   - Check that all services are running
   - Review error logs

### Useful Commands

```bash
# Check application health
curl https://your-app.onrender.com/health

# View API documentation
curl https://your-app.onrender.com/api

# Test database connection
npm run db:migrate

# Manual data cleanup
npm run db:cleanup

# Manual database seeding (if needed)
npm run db:seed
```

## Monitoring and Maintenance

### Logs
- Access logs through Render dashboard
- Monitor application performance
- Check for errors and warnings

### Database Management
- Monitor database usage
- Set up automated backups (available on paid plans)
- Run periodic cleanup: `npm run db:cleanup`

### Scaling
- Free tier: Limited resources, suitable for testing
- Paid plans: Better performance, more resources
- Auto-scaling available on paid plans

## Security Best Practices

1. **Environment Variables**
   - Use strong JWT secrets
   - Never commit secrets to Git
   - Rotate secrets regularly

2. **Database Security**
   - Use strong database passwords
   - Enable SSL connections
   - Regular security updates

3. **Application Security**
   - Keep dependencies updated
   - Monitor for security vulnerabilities
   - Use HTTPS (automatic on Render)

## Cost Optimization

### Free Tier Limits
- 750 hours/month for web services
- 90 hours/month for databases
- Limited bandwidth and storage

### Paid Plans
- Unlimited usage
- Better performance
- Priority support
- Custom domains

## Support

- **Render Documentation**: [docs.render.com](https://docs.render.com)
- **Render Support**: Available through dashboard
- **GitHub Issues**: For code-related problems
- **Community**: Render Discord and forums

## Next Steps

After successful deployment:

1. **Set up Custom Domain** (optional)
2. **Configure SSL** (automatic on Render)
3. **Set up Monitoring** (available on paid plans)
4. **Configure Backups** (available on paid plans)
5. **Scale as Needed** (upgrade to paid plans) 