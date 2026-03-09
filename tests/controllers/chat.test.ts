import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import express, { Express } from 'express';
import chatRoutes from '../../src/routes/chat.routes.js';
import { sessionManager } from '../../src/services/session-manager.js';

vi.mock('../../src/services/session-manager.js', () => ({
  sessionManager: {
    isConnected: vi.fn(),
    getSession: vi.fn(),
  },
}));

describe('Chat Controller', () => {
  let app: Express;

  const socket = {
    sendPresenceUpdate: vi.fn(),
    readMessages: vi.fn(),
    chatModify: vi.fn(),
  };

  const session = {
    socket,
    store: {
      messages: new Map([
        [
          '6281111111111@s.whatsapp.net',
          [
            { id: 'msg-1', text: 'Hello', timestamp: 1234567890 },
            { id: 'msg-2', text: 'World', timestamp: 1234567900 },
          ],
        ],
      ]),
      contacts: new Map([
        ['6281111111111@s.whatsapp.net', { id: '6281111111111@s.whatsapp.net', name: 'Alice' }],
      ]),
      labels: new Map([['label-1', { id: 'label-1', name: 'Important' }]]),
      labelAssociations: new Map<string, Set<string>>([
        ['6281111111111@s.whatsapp.net', new Set(['label-1'])],
      ]),
    },
  };

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/sessions/:sessionId', chatRoutes);
    app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
      res.status(err.statusCode || 500).json({ success: false, error: err.message || 'Internal server error' });
    });

    vi.clearAllMocks();
    vi.mocked(sessionManager.isConnected).mockReturnValue(true);
    vi.mocked(sessionManager.getSession).mockReturnValue(session as any);
  });

  describe('Presence Indicators', () => {
    it('should send typing indicator', async () => {
      socket.sendPresenceUpdate.mockResolvedValue(undefined);

      const response = await request(app)
        .post('/api/sessions/test-session/chats/6281111111111/typing')
        .send({});

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(socket.sendPresenceUpdate).toHaveBeenCalledWith('composing', '6281111111111@s.whatsapp.net');
    });

    it('should send recording indicator', async () => {
      socket.sendPresenceUpdate.mockResolvedValue(undefined);

      const response = await request(app)
        .post('/api/sessions/test-session/chats/6281111111111/recording')
        .send({});

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(socket.sendPresenceUpdate).toHaveBeenCalledWith('recording', '6281111111111@s.whatsapp.net');
    });

    it('should clear presence state', async () => {
      socket.sendPresenceUpdate.mockResolvedValue(undefined);

      const response = await request(app)
        .post('/api/sessions/test-session/chats/6281111111111/clear-state')
        .send({});

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(socket.sendPresenceUpdate).toHaveBeenCalledWith('paused', '6281111111111@s.whatsapp.net');
    });
  });

  describe('Mark Read/Unread', () => {
    it('should mark messages as read', async () => {
      socket.readMessages.mockResolvedValue(undefined);

      const response = await request(app)
        .post('/api/sessions/test-session/chats/6281111111111/seen')
        .send({ messageIds: ['msg-1', 'msg-2'] });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(socket.readMessages).toHaveBeenCalledWith([
        { remoteJid: '6281111111111@s.whatsapp.net', id: 'msg-1', fromMe: false },
        { remoteJid: '6281111111111@s.whatsapp.net', id: 'msg-2', fromMe: false },
      ]);
    });

    it('should mark chat as unread', async () => {
      socket.chatModify.mockResolvedValue(undefined);

      const response = await request(app)
        .post('/api/sessions/test-session/chats/6281111111111/mark-unread')
        .send({});

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(socket.chatModify).toHaveBeenCalledWith({ markRead: false }, '6281111111111@s.whatsapp.net');
    });
  });

  describe('Archive/Unarchive', () => {
    it('should archive chat', async () => {
      socket.chatModify.mockResolvedValue(undefined);

      const response = await request(app)
        .post('/api/sessions/test-session/chats/6281111111111/archive')
        .send({});

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(socket.chatModify).toHaveBeenCalledWith({ archive: true }, '6281111111111@s.whatsapp.net');
    });

    it('should unarchive chat', async () => {
      socket.chatModify.mockResolvedValue(undefined);

      const response = await request(app)
        .post('/api/sessions/test-session/chats/6281111111111/unarchive')
        .send({});

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(socket.chatModify).toHaveBeenCalledWith({ archive: false }, '6281111111111@s.whatsapp.net');
    });
  });

  describe('Pin/Unpin', () => {
    it('should pin chat', async () => {
      socket.chatModify.mockResolvedValue(undefined);

      const response = await request(app)
        .post('/api/sessions/test-session/chats/6281111111111/pin')
        .send({});

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(socket.chatModify).toHaveBeenCalledWith({ pin: true }, '6281111111111@s.whatsapp.net');
    });

    it('should unpin chat', async () => {
      socket.chatModify.mockResolvedValue(undefined);

      const response = await request(app)
        .post('/api/sessions/test-session/chats/6281111111111/unpin')
        .send({});

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(socket.chatModify).toHaveBeenCalledWith({ pin: false }, '6281111111111@s.whatsapp.net');
    });
  });

  describe('Mute/Unmute', () => {
    it('should mute chat with duration', async () => {
      socket.chatModify.mockResolvedValue(undefined);

      const response = await request(app)
        .post('/api/sessions/test-session/chats/6281111111111/mute')
        .send({ duration: 86400000 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(socket.chatModify).toHaveBeenCalledWith({ mute: 86400000 }, '6281111111111@s.whatsapp.net');
    });

    it('should unmute chat', async () => {
      socket.chatModify.mockResolvedValue(undefined);

      const response = await request(app)
        .post('/api/sessions/test-session/chats/6281111111111/unmute')
        .send({});

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(socket.chatModify).toHaveBeenCalledWith({ mute: null }, '6281111111111@s.whatsapp.net');
    });
  });

  describe('Fetch Messages', () => {
    it('should fetch messages with pagination', async () => {
      const response = await request(app)
        .get('/api/sessions/test-session/chats/6281111111111/messages')
        .query({ limit: 10, offset: 0 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.messages).toHaveLength(2);
      expect(response.body.data.total).toBe(2);
      expect(response.body.data.limit).toBe(10);
      expect(response.body.data.offset).toBe(0);
    });

    it('should fetch messages with default pagination', async () => {
      const response = await request(app)
        .get('/api/sessions/test-session/chats/6281111111111/messages');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.limit).toBe(50);
      expect(response.body.data.offset).toBe(0);
    });
  });

  describe('Chat Contact', () => {
    it('should get contact for chat', async () => {
      const response = await request(app)
        .get('/api/sessions/test-session/chats/6281111111111/contact');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual({ id: '6281111111111@s.whatsapp.net', name: 'Alice' });
    });
  });

  describe('Delete Chat', () => {
    it('should delete chat', async () => {
      socket.chatModify.mockResolvedValue(undefined);

      const response = await request(app)
        .delete('/api/sessions/test-session/chats/6281111111111');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(socket.chatModify).toHaveBeenCalledWith({ delete: true }, '6281111111111@s.whatsapp.net');
    });
  });

  describe('Clear Chat Messages', () => {
    it('should clear chat messages', async () => {
      socket.chatModify.mockResolvedValue(undefined);

      const response = await request(app)
        .post('/api/sessions/test-session/chats/6281111111111/clear')
        .send({
          messages: [
            { id: 'msg-1', fromMe: false, timestamp: 1234567890 },
          ],
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(socket.chatModify).toHaveBeenCalledWith(
        expect.objectContaining({
          clear: {
            messages: [{ id: 'msg-1', fromMe: false, timestamp: 1234567890 }],
          },
        }),
        '6281111111111@s.whatsapp.net'
      );
    });
  });

  describe('Chat Labels', () => {
    it('should get labels for chat', async () => {
      const response = await request(app)
        .get('/api/sessions/test-session/chats/6281111111111/labels');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([{ id: 'label-1', name: 'Important' }]);
    });

    it('should modify chat labels (add)', async () => {
      const response = await request(app)
        .post('/api/sessions/test-session/chats/6281111111111/labels/modify')
        .send({ labelIds: ['label-2'], action: 'add' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.labels).toContain('label-1');
      expect(response.body.data.labels).toContain('label-2');
    });

    it('should modify chat labels (remove)', async () => {
      const response = await request(app)
        .post('/api/sessions/test-session/chats/6281111111111/labels/modify')
        .send({ labelIds: ['label-1'], action: 'remove' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.labels).not.toContain('label-1');
    });
  });
});
