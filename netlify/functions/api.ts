import express from 'express';
import serverless from 'serverless-http';
import { createApiRouter } from '../../server/app';

const app = express();
app.use('/api', createApiRouter());
app.use('/.netlify/functions/api', createApiRouter());

export const handler = serverless(app);
