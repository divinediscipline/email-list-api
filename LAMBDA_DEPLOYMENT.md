# AWS Lambda Deployment Guide

This is an AI created guide I thought could be helpful for the lambda deployment. Of course many things here are not necessary. 

## Prerequisites

- AWS Account with appropriate permissions
- AWS CLI configured (optional, for CLI deployment)
- RDS PostgreSQL database (or Aurora Serverless)
- Node.js 18+ runtime

## Architecture Overview

- **Lambda Function**: Handles API requests via API Gateway
- **API Gateway**: REST API endpoint
- **RDS/Aurora PostgreSQL**: Database (must be accessible from Lambda)
- **VPC**: Required if database is in private subnet

## Step 1: Build the Application

```bash
npm install
npm run build
```

This creates the `dist/` directory with compiled JavaScript files.

## Step 2: Create Lambda Deployment Package

### Option A: Manual Package Creation

1. Create a deployment package:
   ```bash
   cd dist
   zip -r ../lambda-deployment.zip .
   cd ..
   zip -r lambda-deployment.zip node_modules
   ```

2. Upload `lambda-deployment.zip` to Lambda

### Option B: Using AWS SAM or Serverless Framework

See infrastructure as code section below.

## Step 3: Create Lambda Function

### Basic Configuration

- **Function Name**: `email-api` (or your preferred name)
- **Runtime**: Node.js 18.x or higher
- **Architecture**: x86_64
- **Handler**: `lambda.handler`
- **Memory**: 512 MB (minimum), 1024 MB (recommended)
- **Timeout**: 30 seconds (adjust based on your needs)

### Handler Configuration

The handler is located at: `dist/lambda.js`

Lambda will automatically detect it's running in Lambda environment via `AWS_LAMBDA_FUNCTION_NAME` environment variable.

## Step 4: Set Environment Variables

In Lambda Console → Configuration → Environment variables, set:

### Required Variables

```bash
DB_HOST=your-rds-endpoint.xxxxx.us-east-1.rds.amazonaws.com
DB_PORT=5432
DB_NAME=email_api
DB_USER=postgres
DB_PASSWORD=your-secure-password
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
NODE_ENV=production
```

### Recommended Variables

```bash
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
DATA_RETENTION_HOURS=48
```

### Optional Variables

```bash
# Not used in Lambda, but can be set for consistency
ENABLE_DATA_CLEANUP=false
```

**Note**: `AWS_LAMBDA_FUNCTION_NAME` is automatically set by AWS Lambda - do NOT set it manually.

## Step 5: Configure VPC (if database is in VPC)

If your RDS database is in a VPC:

1. **VPC Configuration**:
   - Select your VPC
   - Select at least 2 subnets (in different Availability Zones)
   - Select security group that allows outbound to RDS port 5432

2. **Security Group Rules**:
   - Lambda security group → Allow outbound to RDS security group on port 5432
   - RDS security group → Allow inbound from Lambda security group on port 5432

**Important**: Lambda in VPC has longer cold starts. Consider RDS Proxy for connection pooling.

## Step 6: Configure API Gateway

### Create REST API

1. Create new REST API in API Gateway
2. Create resource: `/` (root)
3. Create method: `ANY` (or specific methods: GET, POST, PUT, DELETE, PATCH)
4. Integration type: Lambda Function
5. Select your Lambda function
6. Enable CORS if needed (or handle in application code)

### Configure Proxy Integration

Enable "Use Lambda Proxy integration" for all methods to pass through requests properly.

### Deploy API

1. Create new deployment stage (e.g., `prod`, `dev`)
2. Note the API Gateway endpoint URL

## Step 7: Database Setup

### Initialize Database

Before deploying, initialize the database schema:

1. **Option A: Run migrations locally** (if you have database access):
   ```bash
   npm run build
   npm run db:migrate
   npm run db:seed  # Optional: seed with sample data
   ```

2. **Option B: Create a one-time Lambda function** for migrations:
   - Handler: `database.migrate`
   - Run once, then delete or disable

3. **Option C: Use RDS Query Editor** or psql to run migrations manually

### Database Connection

Ensure your RDS instance:
- Is accessible from Lambda (public endpoint or VPC configuration)
- Has SSL enabled (code handles this automatically in production)
- Has proper security groups configured

## Step 8: IAM Permissions

Lambda execution role needs:

### Basic Permissions

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:*:*:*"
    }
  ]
}
```

### VPC Permissions (if using VPC)

```json
{
  "Effect": "Allow",
  "Action": [
    "ec2:CreateNetworkInterface",
    "ec2:DescribeNetworkInterfaces",
    "ec2:DeleteNetworkInterface",
    "ec2:AssignPrivateIpAddresses",
    "ec2:UnassignPrivateIpAddresses"
  ],
  "Resource": "*"
}
```

### Secrets Manager (if using AWS Secrets Manager)

```json
{
  "Effect": "Allow",
  "Action": [
    "secretsmanager:GetSecretValue"
  ],
  "Resource": "arn:aws:secretsmanager:*:*:secret:your-secret-name-*"
}
```

## Step 9: Test Deployment

### Test Lambda Function

1. Use Lambda Console test feature:
   - Create test event with API Gateway event structure
   - Or use simple test: `{}`

2. Check CloudWatch Logs for:
   - Successful database connection
   - No errors on startup
   - Handler execution

### Test API Gateway

```bash
curl https://your-api-id.execute-api.region.amazonaws.com/stage/health
```

Expected response:
```json
{
  "success": true,
  "message": "Email API is running",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "production",
  "database": "connected",
  "version": "1.0.0"
}
```

## Step 10: Monitoring & Logging

### CloudWatch Logs

- Logs automatically created: `/aws/lambda/email-api`
- Monitor for errors, cold starts, timeouts
- Set up CloudWatch Alarms for errors

### CloudWatch Metrics

Monitor:
- Invocations
- Duration
- Errors
- Throttles
- Cold starts

### X-Ray (Optional)

Enable AWS X-Ray for distributed tracing:
- Add X-Ray SDK to dependencies
- Enable in Lambda configuration

## Step 11: Cleanup Job (Optional)

For automatic data cleanup, create a separate Lambda function:

### Cleanup Lambda Function

- **Handler**: `database.cleanup`
- **Runtime**: Node.js 18.x
- **Schedule**: EventBridge rule (every 6 hours)
- **Environment Variables**: Same database variables as main Lambda

### EventBridge Rule

```json
{
  "ScheduleExpression": "rate(6 hours)",
  "Targets": [
    {
      "Arn": "arn:aws:lambda:region:account:function:email-api-cleanup",
      "Id": "1"
    }
  ]
}
```

## Infrastructure as Code (Optional)

### AWS SAM Template Example

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31

Resources:
  EmailAPI:
    Type: AWS::Serverless::Function
    Properties:
      Handler: lambda.handler
      Runtime: nodejs18.x
      CodeUri: dist/
      Environment:
        Variables:
          DB_HOST: !Ref DatabaseEndpoint
          DB_PORT: '5432'
          DB_NAME: email_api
          DB_USER: postgres
          DB_PASSWORD: !Ref DatabasePassword
          JWT_SECRET: !Ref JwtSecret
          NODE_ENV: production
      VpcConfig:
        SecurityGroupIds:
          - !Ref LambdaSecurityGroup
        SubnetIds:
          - !Ref PrivateSubnet1
          - !Ref PrivateSubnet2
      Events:
        ApiGateway:
          Type: Api
          Properties:
            Path: /{proxy+}
            Method: ANY
```

### Serverless Framework Example

```yaml
service: email-api

provider:
  name: aws
  runtime: nodejs18.x
  region: us-east-1
  environment:
    DB_HOST: ${env:DB_HOST}
    DB_PORT: 5432
    DB_NAME: email_api
    DB_USER: ${env:DB_USER}
    DB_PASSWORD: ${env:DB_PASSWORD}
    JWT_SECRET: ${env:JWT_SECRET}
    NODE_ENV: production

functions:
  api:
    handler: dist/lambda.handler
    events:
      - http:
          path: /{proxy+}
          method: ANY
          cors: true
```

## Troubleshooting

### Common Issues

1. **Database Connection Timeout**
   - Check VPC configuration
   - Verify security groups
   - Check RDS endpoint is correct
   - Ensure RDS is publicly accessible or Lambda is in same VPC

2. **Cold Start Issues**
   - Increase Lambda memory (faster CPU)
   - Use RDS Proxy for connection pooling
   - Consider provisioned concurrency

3. **Timeout Errors**
   - Increase Lambda timeout
   - Check database query performance
   - Monitor CloudWatch metrics

4. **Handler Not Found**
   - Verify handler path: `lambda.handler`
   - Ensure `dist/lambda.js` exists in deployment package
   - Check file structure in ZIP

5. **Environment Variables Not Set**
   - Verify all required variables are set
   - Check variable names (case-sensitive)
   - Ensure no typos

### Useful Commands

```bash
# Test Lambda locally (if using SAM)
sam local start-api

# View CloudWatch Logs
aws logs tail /aws/lambda/email-api --follow

# Invoke Lambda directly
aws lambda invoke --function-name email-api --payload '{}' response.json
```

## Security Best Practices

1. **Secrets Management**
   - Use AWS Secrets Manager for sensitive values (DB password, JWT_SECRET)
   - Rotate secrets regularly
   - Never commit secrets to code

2. **VPC Configuration**
   - Use private subnets for Lambda when possible
   - Restrict security group rules
   - Use RDS Proxy for connection pooling

3. **IAM Roles**
   - Follow principle of least privilege
   - Use separate roles for different functions
   - Regularly audit permissions

4. **API Gateway**
   - Enable API key authentication if needed
   - Use WAF for DDoS protection
   - Enable CloudWatch logging

## Cost Optimization

1. **Lambda**
   - Right-size memory allocation
   - Use provisioned concurrency only if needed
   - Monitor and optimize cold starts

2. **RDS**
   - Use Aurora Serverless v2 for variable workloads
   - Enable auto-pause for dev/test environments
   - Monitor connection pooling

3. **API Gateway**
   - Use caching where appropriate
   - Monitor request volume
   - Consider API Gateway caching

## Next Steps

After successful deployment:

1. Set up custom domain (optional)
2. Configure CloudWatch Alarms
3. Set up CI/CD pipeline
4. Configure backup strategy for RDS
5. Set up monitoring dashboards
6. Document API endpoints for frontend team

## Support

- **AWS Lambda Documentation**: https://docs.aws.amazon.com/lambda/
- **API Gateway Documentation**: https://docs.aws.amazon.com/apigateway/
- **RDS Documentation**: https://docs.aws.amazon.com/rds/
- **CloudWatch Documentation**: https://docs.aws.amazon.com/cloudwatch/
