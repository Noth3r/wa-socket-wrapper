# WA-Socket REST API

> Production-ready WhatsApp Web API using Baileys - No Chromium, No Browser Dependencies

WA-Socket provides a lightweight, fast, and reliable REST API for interacting with WhatsApp. Unlike other solutions that rely on Puppeteer or Playwright, WA-Socket uses the Baileys library to communicate directly with WhatsApp Web's WebSocket, significantly reducing memory usage and improving performance.

## Features

- ✅ **Multi-Session Support** - Manage multiple WhatsApp accounts simultaneously
- ✅ **REST API** - Comprehensive endpoints for messages, chats, groups, and contacts
- ✅ **WebSocket Events** - Real-time event streaming per session
- ✅ **SSE QR Streaming** - Server-sent events for seamless authentication
- ✅ **No Chromium** - Lightweight footprint (~150MB vs ~900MB for browser-based APIs)
- ✅ **TypeScript** - Full type safety and robust error handling
- ✅ **Webhook Support** - 23 event types with configurable delivery and retries
- ✅ **Rate Limiting** - Built-in protection against API abuse

## Quick Start

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment**:
   ```bash
   cp .env.example .env
   # Edit .env and set your API_KEY
   ```

3. **Start development server**:
   ```bash
   npm run dev
   ```

The server will be running at `http://localhost:3000`.

## Docker Deployment

1. **Start with docker-compose**:
   ```bash
   docker-compose up -d
   ```

2. **View logs**:
   ```bash
   docker-compose logs -f
   ```

## Configuration

All configuration is handled via environment variables. See `.env.example` for a full list of options.

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | HTTP server port | `3000` |
| `API_KEY` | Authentication key (required for most endpoints) | - |
| `BASE_PATH` | Base path for all API routes | `/` |
| `ENABLE_WEBHOOK` | Enable webhook delivery | `true` |
| `ENABLE_WEBSOCKET` | Enable WebSocket event streaming | `false` |
| `LOG_LEVEL` | Logging verbosity (error, warn, info, debug) | `info` |
| `SESSIONS_PATH` | Directory for session data | `./sessions` |

## API Overview

### Route Groups

- **Health**: `/api/health` - System status and ping
- **Sessions**: `/api/sessions` - Session lifecycle management
- **Messages**: `/api/sessions/:sessionId/messages` - Sending and managing messages
- **Chats**: `/api/sessions/:sessionId/chats` - Chat history and metadata
- **Groups**: `/api/sessions/:sessionId/groups` - Group management
- **Contacts**: `/api/sessions/:sessionId/contacts` - Contact information
- **Channels**: `/api/sessions/:sessionId/channels` - WhatsApp Channels support

### Example Requests

**Start a Session**:
```bash
curl -X POST http://localhost:3000/api/sessions/my-session/start \
  -H "x-api-key: your-api-key"
```

**Send a Text Message**:
```bash
curl -X POST http://localhost:3000/api/sessions/my-session/messages/send \
  -H "x-api-key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "chatId": "6281234567890@s.whatsapp.net",
    "contentType": "text",
    "content": { "text": "Hello from WA-Socket!" }
  }'
```

**Get Session Status**:
```bash
curl http://localhost:3000/api/sessions/my-session/status \
  -H "x-api-key: your-api-key"
```

## Authentication

All endpoints (except `/api/health/ping`) require API key authentication via the `x-api-key` header:

```bash
x-api-key: your-api-key-here
```

Set your `API_KEY` in the `.env` file.

## Webhook Events

WA-Socket can send POST requests to a configured webhook URL when events occur. Supported events include:

- `connection.update` - Connection status changes (connecting, open, close)
- `qr` - New QR code for authentication
- `messages.upsert` - New message received
- `messages.update` - Message status updated (read, delivered, etc.)
- `messages.reaction` - New reaction to a message
- `group-participants.update` - Group member changes
- `presence.update` - Contact online/typing status

Configure `BASE_WEBHOOK_URL` in your `.env` to enable global webhooks.

## QR Code Authentication

Use Server-Sent Events (SSE) to stream QR codes for authentication in real-time:

```bash
curl -N http://localhost:3000/api/sessions/my-session/qr/stream \
  -H "x-api-key: your-api-key"
```

Example JavaScript implementation:
```javascript
const eventSource = new EventSource('http://localhost:3000/api/sessions/my-session/qr/stream?apiKey=your-api-key');

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.event === 'qr') {
    console.log('New QR Code:', data.data.qr);
    // Render QR code using a library like qrcode.react
  } else if (data.event === 'connection.update' && data.data.connection === 'open') {
    console.log('Authenticated successfully!');
    eventSource.close();
  }
};
```

## WebSocket Events

Real-time event streaming is available via WebSockets if `ENABLE_WEBSOCKET=true` is set.

```javascript
const ws = new WebSocket('ws://localhost:3000/ws/my-session?apiKey=your-api-key');

ws.onmessage = (event) => {
  const payload = JSON.parse(event.data);
  console.log('Received event:', payload.event, payload.data);
};
```

## License

MIT
