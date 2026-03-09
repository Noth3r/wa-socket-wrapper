import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import express, { Express } from 'express';
import clientRoutes from '../../src/routes/client.routes.js';
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

describe('Client Routes', () => {
  let app: Express;

  const socket = {
    sendMessage: vi.fn(),
    onWhatsApp: vi.fn(),
    profilePictureUrl: vi.fn(),
    updateProfileStatus: vi.fn(),
    updateProfileName: vi.fn(),
    updateProfilePicture: vi.fn(),
    removeProfilePicture: vi.fn(),
    sendPresenceUpdate: vi.fn(),
    groupCreate: vi.fn(),
  };

  const session = {
    socket,
    store: {
      contacts: new Map([
        ['6281111111111@s.whatsapp.net', { id: '6281111111111@s.whatsapp.net', name: 'Alice' }],
      ]),
      chats: new Map([
        ['6282222222222@s.whatsapp.net', { id: '6282222222222@s.whatsapp.net', name: 'Bob', unreadCount: 1 }],
      ]),
      messages: new Map([
        [
          '6282222222222@s.whatsapp.net',
          new Map([['ABCD', { id: 'ABCD', key: { id: 'ABCD' }, text: 'quoted message' }]]),
        ],
      ]),
      labels: new Map([['label-1', { id: 'label-1', name: 'Important' }]]),
      labelAssociations: new Map<string, Set<string>>([
        ['6282222222222@s.whatsapp.net', new Set(['label-1'])],
      ]),
      blockedContacts: ['6289999999999@s.whatsapp.net'],
    },
  };

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/sessions/:sessionId/client', clientRoutes);
    app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
      res.status(err.statusCode || 500).json({ success: false, error: err.message || 'Internal server error' });
    });

    vi.clearAllMocks();
    vi.mocked(sessionManager.isConnected).mockReturnValue(true);
    vi.mocked(sessionManager.getSession).mockReturnValue(session as any);
  });

  it('sendMessage with text content type', async () => {
    socket.sendMessage.mockResolvedValue({ key: { id: 'msg-1' } });

    const response = await request(app)
      .post('/api/sessions/test-session/client/send-message')
      .send({
        chatId: '6282222222222',
        contentType: 'text',
        content: 'hello',
        options: {
          mentions: ['+62 811-1111-1111'],
          quotedMessageId: 'ABCD',
        },
      });

    expect(response.status).toBe(200);
    expect(socket.sendMessage).toHaveBeenCalledWith(
      '6282222222222@s.whatsapp.net',
      { text: 'hello' },
      expect.objectContaining({ mentions: ['6281111111111@s.whatsapp.net'], quoted: expect.any(Object) })
    );
  });

  it('sendMessage with image content type', async () => {
    vi.mocked(prepareMediaForSending).mockResolvedValue({ image: Buffer.from('x'), caption: 'caption' } as any);
    socket.sendMessage.mockResolvedValue({ key: { id: 'msg-2' } });

    const response = await request(app)
      .post('/api/sessions/test-session/client/send-message')
      .send({ chatId: '6282222222222', contentType: 'image', content: 'data:image/png;base64,abc', options: { caption: 'caption' } });

    expect(response.status).toBe(200);
    expect(prepareMediaForSending).toHaveBeenCalledWith('data:image/png;base64,abc', 'image', { caption: 'caption' });
    expect(socket.sendMessage).toHaveBeenCalledWith('6282222222222@s.whatsapp.net', { image: expect.any(Buffer), caption: 'caption' }, {});
  });

  it('sendMessage with location', async () => {
    socket.sendMessage.mockResolvedValue({ key: { id: 'msg-3' } });

    const response = await request(app)
      .post('/api/sessions/test-session/client/send-message')
      .send({
        chatId: '6282222222222@s.whatsapp.net',
        contentType: 'location',
        content: { degreesLatitude: -6.2, degreesLongitude: 106.8 },
      });

    expect(response.status).toBe(200);
    expect(socket.sendMessage).toHaveBeenCalledWith(
      '6282222222222@s.whatsapp.net',
      { location: { degreesLatitude: -6.2, degreesLongitude: 106.8 } },
      {}
    );
  });

  it('sendMessage with poll', async () => {
    socket.sendMessage.mockResolvedValue({ key: { id: 'msg-4' } });

    const response = await request(app)
      .post('/api/sessions/test-session/client/send-message')
      .send({
        chatId: '6282222222222',
        contentType: 'poll',
        content: { name: 'Pick one', values: ['A', 'B'], selectableCount: 1 },
      });

    expect(response.status).toBe(200);
    expect(socket.sendMessage).toHaveBeenCalledWith(
      '6282222222222@s.whatsapp.net',
      { poll: { name: 'Pick one', values: ['A', 'B'], selectableCount: 1 } },
      {}
    );
  });

  it('GET contacts returns array', async () => {
    const response = await request(app).get('/api/sessions/test-session/client/contacts');
    expect(response.status).toBe(200);
    expect(response.body.data).toEqual([{ id: '6281111111111@s.whatsapp.net', name: 'Alice' }]);
  });

  it('GET chats returns array', async () => {
    const response = await request(app).get('/api/sessions/test-session/client/chats');
    expect(response.status).toBe(200);
    expect(response.body.data).toEqual([{ id: '6282222222222@s.whatsapp.net', name: 'Bob', unreadCount: 1 }]);
  });

  it('is-registered checks number', async () => {
    socket.onWhatsApp.mockResolvedValue([{ jid: '6281234567890@s.whatsapp.net', exists: true }]);

    const response = await request(app)
      .post('/api/sessions/test-session/client/is-registered')
      .send({ number: '6281234567890' });

    expect(response.status).toBe(200);
    expect(socket.onWhatsApp).toHaveBeenCalledWith('6281234567890');
  });

  it('profile-picture-url returns URL or null', async () => {
    socket.profilePictureUrl.mockResolvedValue(null);

    const response = await request(app)
      .post('/api/sessions/test-session/client/profile-picture-url')
      .send({ contactId: '6281234567890' });

    expect(response.status).toBe(200);
    expect(socket.profilePictureUrl).toHaveBeenCalledWith('6281234567890@s.whatsapp.net', 'image');
    expect(response.body.data).toBeNull();
  });

  it('set-status updates status', async () => {
    socket.updateProfileStatus.mockResolvedValue(undefined);

    const response = await request(app)
      .post('/api/sessions/test-session/client/set-status')
      .send({ status: 'busy' });

    expect(response.status).toBe(200);
    expect(socket.updateProfileStatus).toHaveBeenCalledWith('busy');
  });

  it('presence/available sends presence', async () => {
    socket.sendPresenceUpdate.mockResolvedValue(undefined);

    const response = await request(app)
      .post('/api/sessions/test-session/client/presence/available')
      .send({});

    expect(response.status).toBe(200);
    expect(socket.sendPresenceUpdate).toHaveBeenCalledWith('available');
  });

  it('create-group returns group info', async () => {
    socket.groupCreate.mockResolvedValue({ id: '123@g.us', subject: 'Team' });

    const response = await request(app)
      .post('/api/sessions/test-session/client/create-group')
      .send({ name: 'Team', participants: ['6281111111111', '6282222222222'] });

    expect(response.status).toBe(200);
    expect(socket.groupCreate).toHaveBeenCalledWith('Team', [
      '6281111111111@s.whatsapp.net',
      '6282222222222@s.whatsapp.net',
    ]);
    expect(response.body.data).toEqual({ id: '123@g.us', subject: 'Team' });
  });

  it('returns error for invalid session (not connected)', async () => {
    vi.mocked(sessionManager.isConnected).mockReturnValue(false);

    const response = await request(app).get('/api/sessions/test-session/client/chats');

    expect(response.status).toBe(503);
    expect(response.body.success).toBe(false);
  });
});
