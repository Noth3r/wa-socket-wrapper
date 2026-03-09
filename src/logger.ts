import pino, { Logger, ChildLoggerOptions } from 'pino';
import { config } from './config.js';

// Determine if we should use pretty printing
const isDevelopment = process.env.NODE_ENV === 'development' || config.LOG_LEVEL === 'debug';

// Create base logger with pino-pretty transport in development
const pinoLogger = pino(
  {
    level: config.LOG_LEVEL || 'info',
    timestamp: pino.stdTimeFunctions.isoTime,
  },
  isDevelopment
    ? pino.transport({
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      })
    : undefined
);

/**
 * Default logger instance
 */
export const logger: Logger = pinoLogger;

/**
 * Create a child logger with module context
 * @param module - Module name to bind to logger context
 * @returns Child logger with module binding
 */
export function createLogger(module: string): Logger {
  return pinoLogger.child({ module });
}

export default logger;
