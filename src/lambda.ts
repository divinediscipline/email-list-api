import serverlessExpress from '@vendia/serverless-express';
import app from './index';

// Create Lambda handler wrapper for Express app
export const handler = serverlessExpress({ app });
