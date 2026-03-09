import { beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import express, { Express } from 'express';
import groupRoutes from '../../src/routes/group.routes.js';
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

describe('Group Routes', () => {
  let app: Express;

  const socket = {
    groupMetadata: vi.fn(),
    groupParticipantsUpdate: vi.fn(),
    groupInviteCode: vi.fn(),
    groupRevokeInvite: vi.fn(),
    groupLeave: vi.fn(),
    groupUpdateSubject: vi.fn(),
    groupUpdateDescription: vi.fn(),
    updateProfilePicture: vi.fn(),
    removeProfilePicture: vi.fn(),
    groupSettingUpdate: vi.fn(),
    groupRequestParticipantsList: vi.fn(),
    groupRequestParticipantsUpdate: vi.fn(),
    groupAcceptInvite: vi.fn(),
    groupGetInviteInfo: vi.fn(),
    groupFetchAllParticipating: vi.fn(),
  };

  const session = { socket };

  beforeEach(() => {
    app = express();
    app.use(express.json({ limit: '10mb' }));
    app.use('/api/sessions/:sessionId/groups', groupRoutes);
    app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
      res.status(err.statusCode || 500).json({ success: false, error: err.message || 'Internal server error' });
    });

    vi.clearAllMocks();
    vi.mocked(sessionManager.isConnected).mockReturnValue(true);
    vi.mocked(sessionManager.getSession).mockReturnValue(session as any);
  });

  it('gets group metadata', async () => {
    socket.groupMetadata.mockResolvedValue({ id: '123@g.us', subject: 'Team' });

    const response = await request(app).get('/api/sessions/test-session/groups/123@g.us');

    expect(response.status).toBe(200);
    expect(socket.groupMetadata).toHaveBeenCalledWith('123@g.us');
    expect(response.body.data).toEqual({ id: '123@g.us', subject: 'Team' });
  });

  it('adds participants', async () => {
    socket.groupParticipantsUpdate.mockResolvedValue([{ status: '200' }]);

    const response = await request(app)
      .post('/api/sessions/test-session/groups/123@g.us/participants/add')
      .send({ participants: ['+62 811-1111-1111'] });

    expect(response.status).toBe(200);
    expect(socket.groupParticipantsUpdate).toHaveBeenCalledWith(
      '123@g.us',
      ['6281111111111@s.whatsapp.net'],
      'add'
    );
  });

  it('removes participants', async () => {
    socket.groupParticipantsUpdate.mockResolvedValue([{ status: '200' }]);

    const response = await request(app)
      .post('/api/sessions/test-session/groups/123@g.us/participants/remove')
      .send({ participants: ['6281111111111'] });

    expect(response.status).toBe(200);
    expect(socket.groupParticipantsUpdate).toHaveBeenCalledWith(
      '123@g.us',
      ['6281111111111@s.whatsapp.net'],
      'remove'
    );
  });

  it('promotes participant to admin', async () => {
    socket.groupParticipantsUpdate.mockResolvedValue([{ status: '200' }]);

    const response = await request(app)
      .post('/api/sessions/test-session/groups/123@g.us/participants/promote')
      .send({ participants: ['6281111111111@s.whatsapp.net'] });

    expect(response.status).toBe(200);
    expect(socket.groupParticipantsUpdate).toHaveBeenCalledWith(
      '123@g.us',
      ['6281111111111@s.whatsapp.net'],
      'promote'
    );
  });

  it('gets invite code', async () => {
    socket.groupInviteCode.mockResolvedValue('INVITE-CODE');

    const response = await request(app).get('/api/sessions/test-session/groups/123@g.us/invite-code');

    expect(response.status).toBe(200);
    expect(socket.groupInviteCode).toHaveBeenCalledWith('123@g.us');
    expect(response.body.data).toEqual({ inviteCode: 'INVITE-CODE' });
  });

  it('updates group subject', async () => {
    socket.groupUpdateSubject.mockResolvedValue(undefined);

    const response = await request(app)
      .put('/api/sessions/test-session/groups/123@g.us/subject')
      .send({ subject: 'New Subject' });

    expect(response.status).toBe(200);
    expect(socket.groupUpdateSubject).toHaveBeenCalledWith('123@g.us', 'New Subject');
  });

  it('lists all groups', async () => {
    socket.groupFetchAllParticipating.mockResolvedValue({ '123@g.us': { id: '123@g.us' } });

    const response = await request(app).get('/api/sessions/test-session/groups');

    expect(response.status).toBe(200);
    expect(socket.groupFetchAllParticipating).toHaveBeenCalledTimes(1);
    expect(response.body.data).toEqual({ '123@g.us': { id: '123@g.us' } });
  });

  it('accepts invite', async () => {
    socket.groupAcceptInvite.mockResolvedValue('123@g.us');

    const response = await request(app)
      .post('/api/sessions/test-session/groups/accept-invite')
      .send({ code: 'ABCD1234' });

    expect(response.status).toBe(200);
    expect(socket.groupAcceptInvite).toHaveBeenCalledWith('ABCD1234');
    expect(response.body.data).toBe('123@g.us');
  });

  it('updates group picture', async () => {
    vi.mocked(prepareMediaForSending).mockResolvedValue({ image: Buffer.from('img') } as any);
    socket.updateProfilePicture.mockResolvedValue(undefined);

    const response = await request(app)
      .put('/api/sessions/test-session/groups/123@g.us/picture')
      .send({ content: 'data:image/png;base64,aGVsbG8=', options: {} });

    expect(response.status).toBe(200);
    expect(socket.updateProfilePicture).toHaveBeenCalledWith('123@g.us', expect.any(Buffer));
  });
});
