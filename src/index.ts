import { promises as fs } from 'node:fs';
import type { Server as HttpServer } from 'node:http';
import { config } from './config.js';
import { logger } from './logger.js';
import { sessionManager } from './services/session-manager.js';
import { sseManager } from './services/sse.js';
import { webSocketManager } from './services/websocket.js';
import { startServer } from './server.js';

const shouldRestoreSessions =
  process.env.RESTORE_SESSIONS_ON_STARTUP === 'true' ||
  (process.env.RESTORE_SESSIONS_ON_STARTUP === undefined && config.RECOVER_SESSIONS);

export async function restoreSessionsOnStartup(): Promise<void> {
  if (!shouldRestoreSessions) {
    return;
  }

  try {
    await fs.mkdir(config.SESSIONS_PATH, { recursive: true });
    const entries = await fs.readdir(config.SESSIONS_PATH, { withFileTypes: true });

    for (const entry of entries) {
      const match = entry.name.match(/^session-(.+)$/);
      if (!entry.isDirectory() || !match) {
        continue;
      }

      const sessionId = match[1];
      if (!sessionId) {
        continue;
      }

      try {
        await sessionManager.startSession(sessionId);
        logger.info({ sessionId }, 'Session restored on startup');
      } catch (error) {
        logger.error({ sessionId, error }, 'Failed restoring session on startup');
      }
    }
  } catch (error) {
    logger.error({ error }, 'Failed scanning session directory for restore');
  }
}

export async function terminateAllSessions(): Promise<void> {
  const sessions = sessionManager.getAllSessions();

  for (const session of sessions) {
    try {
      await sessionManager.terminateSession(session.id as unknown as string);
    } catch (error) {
      logger.error({ sessionId: session.id, error }, 'Failed terminating session during shutdown');
    }
  }
}

export function createShutdownHandler(
  server: Pick<HttpServer, 'close'>,
  exit: (code: number) => void = process.exit,
) {
  return async (signal: NodeJS.Signals): Promise<void> => {
    logger.info({ signal }, 'Received shutdown signal');
    await terminateAllSessions();
    sseManager.closeAll();
    await webSocketManager.close();

    server.close((error?: Error) => {
      if (error) {
        logger.error({ error }, 'Error while closing HTTP server');
        exit(1);
        return;
      }

      logger.info('HTTP server closed gracefully');
      exit(0);
    });
  };
}

export async function bootstrap(): Promise<void> {
  await restoreSessionsOnStartup();

  const server = startServer();

  server.listen(config.PORT, () => {
    logger.info({ port: config.PORT }, 'HTTP server started');
  });

  const shutdown = createShutdownHandler(server);

  process.on('SIGINT', () => {
    void shutdown('SIGINT');
  });

  process.on('SIGTERM', () => {
    void shutdown('SIGTERM');
  });
}

if (process.env.NODE_ENV !== 'test') {
  void bootstrap();
}
