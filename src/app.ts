import cors from 'cors';
import express, { type Express, type Request, type Response, type RequestHandler } from 'express';
import pinoHttp from 'pino-http';
import { config } from './config.js';
import { logger } from './logger.js';
import { apiKeyAuth, rateLimiter, createErrorHandler } from './middleware/index.js';
import routes from './routes/index.js';
import { sendError } from './utils/response.js';

export function createApp(): Express {
  const app = express();

  app.use(cors({ origin: config.CORS_ORIGINS }));
  app.use(express.json({ limit: config.MAX_ATTACHMENT_SIZE }));
  const httpLogger = (pinoHttp as unknown as (options: { logger: typeof logger }) => RequestHandler)({ logger });
  app.use(httpLogger);
  app.use(apiKeyAuth);
  app.use(rateLimiter);

  app.use('/api', routes);

  app.use((req: Request, res: Response) => {
    sendError(res, 404, 'Route not found');
  });

  app.use(createErrorHandler(logger));

  return app;
}

export default createApp;
