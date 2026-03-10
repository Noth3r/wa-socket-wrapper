import cors from 'cors';
import express, { type Express, type Request, type Response, type RequestHandler } from 'express';
import pinoHttp from 'pino-http';
import swaggerUi from 'swagger-ui-express';
import { config } from './config.js';
import { logger } from './logger.js';
import { apiKeyAuth, rateLimiter, createErrorHandler } from './middleware/index.js';
import routes from './routes/index.js';
import { swaggerSpec } from './swagger.js';
import { sendError } from './utils/response.js';

export function createApp(): Express {
  const app = express();

  app.use(cors({ origin: config.CORS_ORIGINS }));
  app.use(express.json({ limit: config.MAX_ATTACHMENT_SIZE }));
  const httpLogger = (pinoHttp as unknown as (options: { logger: typeof logger }) => RequestHandler)({ logger });
  app.use(httpLogger);

  // Swagger documentation (if enabled) - BEFORE auth middleware
  console.log('[DEBUG] ENABLE_SWAGGER:', config.ENABLE_SWAGGER);
  if (config.ENABLE_SWAGGER) {
    console.log('[SWAGGER] Registering Swagger UI at /api-docs');
    logger.info('[SWAGGER] Registering Swagger UI at /api-docs');
    logger.info(`[SWAGGER] Spec has ${Object.keys(swaggerSpec.paths || {}).length} paths`);
    
    // Swagger UI - correct pattern: serve first, then setup
    app.use('/api-docs', swaggerUi.serve);
    app.get('/api-docs', swaggerUi.setup(swaggerSpec, {
      customSiteTitle: 'WA-Socket API Documentation',
      customCss: '.swagger-ui .topbar { display: none }',
    }));
    
    // JSON spec endpoint
    app.get('/api-docs.json', (req: Request, res: Response) => {
      res.json(swaggerSpec);
    });
    
    console.log('[SWAGGER] Swagger routes registered successfully');
    logger.info('[SWAGGER] Swagger routes registered successfully');
  } else {
    console.log('[SWAGGER] Swagger is DISABLED');
  }

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
