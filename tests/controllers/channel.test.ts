import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import express, { Express } from 'express';
import channelRoutes from '../../src/routes/channel.routes.js';
import { sessionManager } from '../../src/services/session-manager.js';
import { prepareMediaForSending } from '../../src/services/media.js';

vi.mock('../../src/services/session-manager.js', () => ({
  sessionManager: {
    isConnected: vi.fn(),
    getSession: vi.fn(),
  },
}));

vi.mock('../../src/services/media.js', () => ({
  prepareMediaForSending: vi.fn(),
}));

describe('Channel Routes', () => {
  let app: Express;

  const socket = {
    newsletterMetadata: vi.fn(),
    sendMessage: vi.fn(),
    newsletterFetchMessages: vi.fn(),
    readMessages: vi.fn(),
    newsletterMute: vi.fn(),
    newsletterUnmute: vi.fn(),
    newsletterUpdatePicture: vi.fn(),
    newsletterUpdateDescription: vi.fn(),
    newsletterUpdateName: vi.fn(),
    newsletterDelete: vi.fn(),
    newsletterSubscribers: vi.fn(),
    newsletterReactionMode: vi.fn(),
    newsletterChangeOwner: vi.fn(),
    newsletterDemote: vi.fn(),
  };

  const session = { socket };

  beforeEach(() => {
    app = express();
    app.use(express.json({ limit: '10mb' }));
    app.use('/api/sessions/:sessionId/channels', channelRoutes);
    app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
      res.status(err.statusCode || 500).json({ success: false, error: err.message || 'Internal server error' });
    });

    vi.clearAllMocks();
    vi.mocked(sessionManager.isConnected).mockReturnValue(true);
    vi.mocked(sessionManager.getSession).mockReturnValue(session as any);
  });

  it('gets newsletter info by jid', async () => {
    socket.newsletterMetadata.mockResolvedValue({ 
      id: '123456789@newsletter', 
      name: 'Test Newsletter',
      description: 'Test description'
    });

    const response = await request(app)
      .post('/api/sessions/test-session/channels/info')
      .send({ type: 'jid', key: '123456789@newsletter' });

    expect(response.status).toBe(200);
    expect(socket.newsletterMetadata).toHaveBeenCalledWith('jid', '123456789@newsletter');
    expect(response.body.data).toHaveProperty('id', '123456789@newsletter');
  });

  it('sends message to newsletter', async () => {
    socket.sendMessage.mockResolvedValue({ 
      key: { id: 'msg123' },
      status: 'sent'
    });

    const response = await request(app)
      .post('/api/sessions/test-session/channels/send-message')
      .send({ 
        jid: '123456789@newsletter',
        content: { text: 'Hello newsletter!' }
      });

    expect(response.status).toBe(200);
    expect(socket.sendMessage).toHaveBeenCalledWith(
      '123456789@newsletter',
      { text: 'Hello newsletter!' }
    );
  });

  it('mutes newsletter', async () => {
    socket.newsletterMute.mockResolvedValue({ success: true });

    const response = await request(app)
      .post('/api/sessions/test-session/channels/mute')
      .send({ jid: '123456789@newsletter' });

    expect(response.status).toBe(200);
    expect(socket.newsletterMute).toHaveBeenCalledWith('123456789@newsletter');
  });

  it('updates newsletter description', async () => {
    socket.newsletterUpdateDescription.mockResolvedValue(undefined);

    const response = await request(app)
      .post('/api/sessions/test-session/channels/set-description')
      .send({ 
        jid: '123456789@newsletter',
        description: 'New description'
      });

    expect(response.status).toBe(200);
    expect(socket.newsletterUpdateDescription).toHaveBeenCalledWith(
      '123456789@newsletter',
      'New description'
    );
    expect(response.body.data.message).toBe('Newsletter description updated');
  });

  it('gets newsletter subscribers', async () => {
    socket.newsletterSubscribers.mockResolvedValue({ subscribers: 1250 });

    const response = await request(app)
      .post('/api/sessions/test-session/channels/subscribers')
      .send({ jid: '123456789@newsletter' });

    expect(response.status).toBe(200);
    expect(socket.newsletterSubscribers).toHaveBeenCalledWith('123456789@newsletter');
    expect(response.body.data).toEqual({ subscribers: 1250 });
  });

  it('handles errors for invalid jid', async () => {
    const response = await request(app)
      .post('/api/sessions/test-session/channels/mute')
      .send({ jid: 'invalid-jid' });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toContain('newsletter JID');
  });

  it('transfers newsletter ownership', async () => {
    socket.newsletterChangeOwner.mockResolvedValue(undefined);

    const response = await request(app)
      .post('/api/sessions/test-session/channels/admin/transfer-ownership')
      .send({ 
        jid: '123456789@newsletter',
        newOwnerJid: '628111111111@s.whatsapp.net'
      });

    expect(response.status).toBe(200);
    expect(socket.newsletterChangeOwner).toHaveBeenCalledWith(
      '123456789@newsletter',
      '628111111111@s.whatsapp.net'
    );
  });

  it('demotes newsletter admin', async () => {
    socket.newsletterDemote.mockResolvedValue(undefined);

    const response = await request(app)
      .post('/api/sessions/test-session/channels/admin/demote')
      .send({ 
        jid: '123456789@newsletter',
        userJid: '628111111111@s.whatsapp.net'
      });

    expect(response.status).toBe(200);
    expect(socket.newsletterDemote).toHaveBeenCalledWith(
      '123456789@newsletter',
      '628111111111@s.whatsapp.net'
    );
  });

  it('fetches newsletter messages', async () => {
    socket.newsletterFetchMessages.mockResolvedValue([
      { id: 'msg1', text: 'Hello' },
      { id: 'msg2', text: 'World' }
    ]);

    const response = await request(app)
      .post('/api/sessions/test-session/channels/fetch-messages')
      .send({ 
        jid: '123456789@newsletter',
        count: 10,
        since: 0,
        after: 0
      });

    expect(response.status).toBe(200);
    expect(socket.newsletterFetchMessages).toHaveBeenCalledWith(
      '123456789@newsletter',
      10,
      0,
      0
    );
  });

  it('returns 501 for unsupported newsletter reaction mode', async () => {
    // Remove the method to simulate unsupported feature
    delete (socket as any).newsletterReactionMode;

    const response = await request(app)
      .post('/api/sessions/test-session/channels/set-reaction-setting')
      .send({ 
        jid: '123456789@newsletter',
        mode: 'all'
      });

    expect(response.status).toBe(501);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toContain('not supported');
  });
});
