import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import express, { Express } from 'express';
import messageRoutes from '../../src/routes/message.routes.js';
import { sessionManager } from '../../src/services/session-manager.js';
import { downloadMediaFromMessage } from '../../src/services/media.js';

vi.mock('../../src/services/session-manager.js', () => ({
  sessionManager: {
    isConnected: vi.fn(),
    getSession: vi.fn(),
  },
}));

vi.mock('../../src/services/media.js', () => ({
  downloadMediaFromMessage: vi.fn(),
}));

describe('Message Routes', () => {
  let app: Express;

  const socket = {
    sendMessage: vi.fn(),
    chatModify: vi.fn(),
    pollVote: vi.fn(),
  };

  const storedMessage = {
    key: {
      remoteJid: '6281111111111@s.whatsapp.net',
      id: 'MSG-1',
      fromMe: true,
    },
    message: {
      extendedTextMessage: {
        contextInfo: {
          mentionedJid: ['6282222222222@s.whatsapp.net'],
          quotedMessage: { conversation: 'quoted-text' },
        },
      },
      imageMessage: {
        mimetype: 'image/png',
      },
    },
    reactions: [{ text: '👍', senderTimestampMs: 1 }],
    status: 'READ',
    messageTimestamp: 1730000000,
    participant: '6281111111111@s.whatsapp.net',
  };

  const session = {
    socket,
    store: {
      messages: new Map([
        [
          '6281111111111@s.whatsapp.net',
          new Map([
            ['MSG-1', storedMessage],
          ]),
        ],
      ]),
      contacts: new Map([
        ['6281111111111@s.whatsapp.net', { id: '6281111111111@s.whatsapp.net', name: 'Sender User' }],
      ]),
    },
  };

  const validMessageKey = {
    remoteJid: '6281111111111@s.whatsapp.net',
    id: 'MSG-1',
    fromMe: true,
  };

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/sessions/:sessionId/messages', messageRoutes);
    app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
      res.status(err.statusCode || 500).json({ success: false, error: err.message || 'Internal server error' });
    });

    vi.clearAllMocks();
    vi.mocked(sessionManager.isConnected).mockReturnValue(true);
    vi.mocked(sessionManager.getSession).mockReturnValue(session as any);
  });

  it('delete message success', async () => {
    socket.sendMessage.mockResolvedValue({ key: { id: 'delete-ok' } });

    const response = await request(app)
      .post('/api/sessions/test-session/messages/delete')
      .send({ messageKey: validMessageKey });

    expect(response.status).toBe(200);
    expect(socket.sendMessage).toHaveBeenCalledWith(validMessageKey.remoteJid, { delete: validMessageKey });
  });

  it('edit message success', async () => {
    socket.sendMessage.mockResolvedValue({ key: { id: 'edit-ok' } });

    const response = await request(app)
      .post('/api/sessions/test-session/messages/edit')
      .send({ messageKey: validMessageKey, text: 'edited text' });

    expect(response.status).toBe(200);
    expect(socket.sendMessage).toHaveBeenCalledWith(validMessageKey.remoteJid, { text: 'edited text', edit: validMessageKey });
  });

  it('react to message', async () => {
    socket.sendMessage.mockResolvedValue({ key: { id: 'react-ok' } });

    const response = await request(app)
      .post('/api/sessions/test-session/messages/react')
      .send({ messageKey: validMessageKey, emoji: '🔥' });

    expect(response.status).toBe(200);
    expect(socket.sendMessage).toHaveBeenCalledWith(validMessageKey.remoteJid, {
      react: { text: '🔥', key: validMessageKey },
    });
  });

  it('forward message', async () => {
    socket.sendMessage.mockResolvedValue({ key: { id: 'forward-ok' } });

    const response = await request(app)
      .post('/api/sessions/test-session/messages/forward')
      .send({ messageKey: validMessageKey, targetJid: '6283333333333@s.whatsapp.net' });

    expect(response.status).toBe(200);
    expect(socket.sendMessage).toHaveBeenCalledWith('6283333333333@s.whatsapp.net', { forward: storedMessage });
  });

  it('star and unstar message', async () => {
    socket.chatModify.mockResolvedValue(undefined);

    const starResponse = await request(app)
      .post('/api/sessions/test-session/messages/star')
      .send({ messageKey: validMessageKey });

    const unstarResponse = await request(app)
      .post('/api/sessions/test-session/messages/unstar')
      .send({ messageKey: validMessageKey });

    expect(starResponse.status).toBe(200);
    expect(unstarResponse.status).toBe(200);
    expect(socket.chatModify).toHaveBeenNthCalledWith(
      1,
      { star: { messages: [validMessageKey], star: true } },
      validMessageKey.remoteJid
    );
    expect(socket.chatModify).toHaveBeenNthCalledWith(
      2,
      { star: { messages: [validMessageKey], star: false } },
      validMessageKey.remoteJid
    );
  });

  it('download media returns base64', async () => {
    vi.mocked(downloadMediaFromMessage).mockResolvedValue({
      buffer: Buffer.from('file-bytes'),
      mimetype: 'image/png',
      filename: 'img.png',
    });

    const response = await request(app)
      .post('/api/sessions/test-session/messages/download-media')
      .send({ messageKey: validMessageKey, type: 'image' });

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual({
      mimetype: 'image/png',
      filename: 'img.png',
      data: Buffer.from('file-bytes').toString('base64'),
    });
  });

  it('reply with quoted message', async () => {
    socket.sendMessage.mockResolvedValue({ key: { id: 'reply-ok' } });

    const response = await request(app)
      .post('/api/sessions/test-session/messages/reply')
      .send({
        messageKey: validMessageKey,
        content: { text: 'reply body' },
      });

    expect(response.status).toBe(200);
    expect(socket.sendMessage).toHaveBeenCalledWith(
      validMessageKey.remoteJid,
      { text: 'reply body' },
      { quoted: storedMessage }
    );
  });

  it('error handling for invalid message key', async () => {
    const response = await request(app)
      .post('/api/sessions/test-session/messages/delete')
      .send({ messageKey: { id: 'missing-required-fields' } });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toContain('messageKey.remoteJid');
  });
});
