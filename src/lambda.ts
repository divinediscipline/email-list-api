import * as awsServerlessExpress from 'aws-serverless-express';
import app from './index';

// Create server instance for Lambda
const server = awsServerlessExpress.createServer(app);

// Lambda handler wrapper for Express app
export const handler = (event: any, context: any) => {
  awsServerlessExpress.proxy(server, event, context);
};
