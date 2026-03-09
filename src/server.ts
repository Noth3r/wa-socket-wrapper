import http, { type Server as HttpServer, type IncomingMessage } from 'node:http';
import { Socket } from 'node:net';
import { createApp } from './app.js';
import { logger } from './logger.js';
import { webSocketManager } from './services/websocket.js';

export function startServer(): HttpServer {
  const app = createApp();
  const server = http.createServer(app);

  server.on('upgrade', (request: IncomingMessage, socket: Socket, head: Buffer) => {
    const url = new URL(request.url ?? '/', `http://${request.headers.host ?? 'localhost'}`);
    const wsMatch = url.pathname.match(/^\/ws\/([^/]+)$/);

    if (!wsMatch) {
      socket.destroy();
      return;
    }

    logger.debug({ path: url.pathname, sessionId: wsMatch[1] }, 'Handling WebSocket upgrade');
    webSocketManager.handleUpgrade(request, socket, head);
  });

  return server;
}

export default startServer;
