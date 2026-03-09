import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import express, { Express } from 'express';
import contactRoutes from '../../src/routes/contact.routes.js';
import { sessionManager } from '../../src/services/session-manager.js';

vi.mock('../../src/services/session-manager.js', () => ({
  sessionManager: {
    isConnected: vi.fn(),
    getSession: vi.fn(),
  },
}));

describe('Contact Routes', () => {
  let app: Express;

  const socket = {
    updateBlockStatus: vi.fn(),
    fetchStatus: vi.fn(),
    profilePictureUrl: vi.fn(),
    groupFetchAllParticipating: vi.fn(),
  };

  const session = {
    socket,
    store: {
      contacts: new Map([
        ['6281111111111@s.whatsapp.net', { 
          id: '6281111111111@s.whatsapp.net', 
          name: 'Test Contact',
          notify: 'Test User',
        }],
      ]),
      chats: new Map([
        ['6281111111111@s.whatsapp.net', {
          id: '6281111111111@s.whatsapp.net',
          conversationTimestamp: 1730000000,
          unreadCount: 0,
        }],
      ]),
    },
  };

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/sessions/:sessionId/contacts', contactRoutes);
    app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
      res.status(err.statusCode || 500).json({ success: false, error: err.message || 'Internal server error' });
    });

    vi.clearAllMocks();
    vi.mocked(sessionManager.isConnected).mockReturnValue(true);
    vi.mocked(sessionManager.getSession).mockReturnValue(session as any);
  });

  it('get contact info success', async () => {
    const response = await request(app)
      .post('/api/sessions/test-session/contacts/info')
      .send({ jid: '6281111111111@s.whatsapp.net' });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('id', '6281111111111@s.whatsapp.net');
    expect(response.body.data).toHaveProperty('name', 'Test Contact');
  });

  it('get contact info - contact not found', async () => {
    const response = await request(app)
      .post('/api/sessions/test-session/contacts/info')
      .send({ jid: '6289999999999@s.whatsapp.net' });

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toContain('not found');
  });

  it('block contact success', async () => {
    socket.updateBlockStatus.mockResolvedValue({ status: 'blocked' });

    const response = await request(app)
      .post('/api/sessions/test-session/contacts/block')
      .send({ jid: '6281111111111@s.whatsapp.net' });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(socket.updateBlockStatus).toHaveBeenCalledWith('6281111111111@s.whatsapp.net', 'block');
  });

  it('unblock contact success', async () => {
    socket.updateBlockStatus.mockResolvedValue({ status: 'unblocked' });

    const response = await request(app)
      .post('/api/sessions/test-session/contacts/unblock')
      .send({ jid: '6281111111111@s.whatsapp.net' });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(socket.updateBlockStatus).toHaveBeenCalledWith('6281111111111@s.whatsapp.net', 'unblock');
  });

  it('get contact about success', async () => {
    socket.fetchStatus.mockResolvedValue({ status: 'Hey there! I am using WhatsApp.' });

    const response = await request(app)
      .post('/api/sessions/test-session/contacts/about')
      .send({ jid: '6281111111111@s.whatsapp.net' });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('status', 'Hey there! I am using WhatsApp.');
    expect(socket.fetchStatus).toHaveBeenCalledWith('6281111111111@s.whatsapp.net');
  });

  it('get contact about - privacy restriction', async () => {
    socket.fetchStatus.mockResolvedValue(null);

    const response = await request(app)
      .post('/api/sessions/test-session/contacts/about')
      .send({ jid: '6281111111111@s.whatsapp.net' });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('status', null);
  });

  it('get contact chat success', async () => {
    const response = await request(app)
      .post('/api/sessions/test-session/contacts/chat')
      .send({ jid: '6281111111111@s.whatsapp.net' });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('id', '6281111111111@s.whatsapp.net');
  });

  it('get contact chat - not found', async () => {
    const response = await request(app)
      .post('/api/sessions/test-session/contacts/chat')
      .send({ jid: '6289999999999@s.whatsapp.net' });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toBe(null);
  });

  it('get profile picture success', async () => {
    socket.profilePictureUrl.mockResolvedValue('https://example.com/profile.jpg');

    const response = await request(app)
      .post('/api/sessions/test-session/contacts/profile-picture')
      .send({ jid: '6281111111111@s.whatsapp.net' });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('url', 'https://example.com/profile.jpg');
    expect(socket.profilePictureUrl).toHaveBeenCalledWith('6281111111111@s.whatsapp.net', 'image');
  });

  it('get profile picture - privacy restriction', async () => {
    const error = new Error('item-not-found');
    (error as any).output = { statusCode: 404 };
    socket.profilePictureUrl.mockRejectedValue(error);

    const response = await request(app)
      .post('/api/sessions/test-session/contacts/profile-picture')
      .send({ jid: '6281111111111@s.whatsapp.net' });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('url', null);
  });

  it('get formatted number success', async () => {
    const response = await request(app)
      .post('/api/sessions/test-session/contacts/formatted-number')
      .send({ jid: '6281111111111@s.whatsapp.net' });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('formattedNumber', '6281111111111');
  });

  it('get country code success', async () => {
    const response = await request(app)
      .post('/api/sessions/test-session/contacts/country-code')
      .send({ jid: '6281111111111@s.whatsapp.net' });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('countryCode', '62');
  });

  it('get country code - US number', async () => {
    const response = await request(app)
      .post('/api/sessions/test-session/contacts/country-code')
      .send({ jid: '12125551234@s.whatsapp.net' });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('countryCode', '1');
  });

  it('get common groups success', async () => {
    socket.groupFetchAllParticipating.mockResolvedValue({
      'group1@g.us': {
        id: 'group1@g.us',
        subject: 'Test Group 1',
        participants: [
          { id: '6281111111111@s.whatsapp.net', admin: null },
          { id: '6282222222222@s.whatsapp.net', admin: 'admin' },
        ],
      },
      'group2@g.us': {
        id: 'group2@g.us',
        subject: 'Test Group 2',
        participants: [
          { id: '6283333333333@s.whatsapp.net', admin: null },
        ],
      },
    });

    const response = await request(app)
      .post('/api/sessions/test-session/contacts/common-groups')
      .send({ jid: '6281111111111@s.whatsapp.net' });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0]).toHaveProperty('id', 'group1@g.us');
  });

  it('get common groups - no common groups', async () => {
    socket.groupFetchAllParticipating.mockResolvedValue({
      'group1@g.us': {
        id: 'group1@g.us',
        subject: 'Test Group 1',
        participants: [
          { id: '6282222222222@s.whatsapp.net', admin: 'admin' },
        ],
      },
    });

    const response = await request(app)
      .post('/api/sessions/test-session/contacts/common-groups')
      .send({ jid: '6289999999999@s.whatsapp.net' });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveLength(0);
  });

  it('invalid jid error', async () => {
    const response = await request(app)
      .post('/api/sessions/test-session/contacts/info')
      .send({ jid: '' });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toContain('jid is required');
  });

  it('invalid jid format error', async () => {
    const response = await request(app)
      .post('/api/sessions/test-session/contacts/info')
      .send({ jid: '123' });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toContain('Invalid JID');
  });
});
