import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Request, Response } from 'express';
import {
  listSessions,
  startSession,
  stopSession,
  getSessionStatus,
  getQRCode,
  requestPairingCode,
  restartSession,
  terminateSession,
  terminateInactiveSessions,
  terminateAllSessions,
} from '../../src/controllers/session.controller.js';

// Mock Request and Response helpers
function createMockRes() {
  return {
    json: vi.fn().mockReturnThis(),
    status: vi.fn().mockReturnThis(),
    end: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
  };
}

function createMockReq(params = {}, body = {}) {
  return {
    params,
    body,
  };
}

describe('Session Controller', () => {
  let req: Partial<Request>;
  let res: any;

  beforeEach(() => {
    res = createMockRes();
  });

  describe('listSessions', () => {
    it('should return empty sessions array initially', () => {
      req = createMockReq();
      listSessions(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();
    });

    it('should return sessions in correct format', () => {
      req = createMockReq();
      listSessions(req as Request, res as Response);

      const call = (res.json as any).mock.calls[0][0];
      expect(call).toHaveProperty('success', true);
      expect(call).toHaveProperty('data');
      expect(call.data).toHaveProperty('sessions');
    });
  });

  describe('startSession', () => {
    it('should reject invalid session ID', async () => {
      req = createMockReq({}, {});
      await startSession(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should accept valid session ID in params', async () => {
      req = createMockReq({ sessionId: 'test-1' }, {});
      await startSession(req as Request, res as Response);

      expect(res.status).toHaveBeenCalled();
    });

    it('should accept optional webhookUrl and webhookEvents', async () => {
      req = createMockReq(
        { sessionId: 'test-1' },
        { webhookUrl: 'http://example.com', webhookEvents: ['message', 'status'] }
      );
      await startSession(req as Request, res as Response);

      expect(res.json).toHaveBeenCalled();
    });

    it('should return session info on success', async () => {
      req = createMockReq({ sessionId: 'test-1' }, {});
      await startSession(req as Request, res as Response);

      const call = (res.json as any).mock.calls[0][0];
      expect(call).toHaveProperty('success', true);
      expect(call).toHaveProperty('data');
      expect(call.data).toHaveProperty('session');
    });
  });

  describe('stopSession', () => {
    it('should reject invalid session ID', async () => {
      req = createMockReq({}, {});
      await stopSession(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return success message on stop', async () => {
      req = createMockReq({ sessionId: 'test-1' }, {});
      await stopSession(req as Request, res as Response);

      const call = (res.json as any).mock.calls[0][0];
      expect(call).toHaveProperty('success', true);
    });

    it('should return 200 status on successful stop', async () => {
      req = createMockReq({ sessionId: 'test-1' }, {});
      await stopSession(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  describe('getSessionStatus', () => {
    it('should reject invalid session ID', async () => {
      req = createMockReq({}, {});
      await getSessionStatus(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return session status', async () => {
      req = createMockReq({ sessionId: 'test-1' }, {});
      await getSessionStatus(req as Request, res as Response);

      const call = (res.json as any).mock.calls[0][0];
      expect(call).toHaveProperty('data');
      expect(call.data).toHaveProperty('status');
    });
  });

  describe('getQRCode', () => {
    it('should reject invalid session ID', async () => {
      req = createMockReq({}, {});
      await getQRCode(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return QR code data', async () => {
      req = createMockReq({ sessionId: 'test-1' }, {});
      await getQRCode(req as Request, res as Response);

      expect(res.json).toHaveBeenCalled();
    });
  });

  describe('requestPairingCode', () => {
    it('should reject invalid session ID', async () => {
      req = createMockReq({}, { phoneNumber: '1234567890' });
      await requestPairingCode(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should reject missing phoneNumber', async () => {
      req = createMockReq({ sessionId: 'test-1' }, {});
      await requestPairingCode(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should accept valid phoneNumber', async () => {
      req = createMockReq({ sessionId: 'test-1' }, { phoneNumber: '1234567890' });
      await requestPairingCode(req as Request, res as Response);

      expect(res.json).toHaveBeenCalled();
    });

    it('should return pairing code data', async () => {
      req = createMockReq({ sessionId: 'test-1' }, { phoneNumber: '1234567890' });
      await requestPairingCode(req as Request, res as Response);

      const call = (res.json as any).mock.calls[0][0];
      expect(call).toHaveProperty('data');
      expect(call.data).toHaveProperty('pairingCode');
    });
  });

  describe('restartSession', () => {
    it('should reject invalid session ID', async () => {
      req = createMockReq({}, {});
      await restartSession(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return session info on restart', async () => {
      req = createMockReq({ sessionId: 'test-1' }, {});
      await restartSession(req as Request, res as Response);

      const call = (res.json as any).mock.calls[0][0];
      expect(call).toHaveProperty('data');
      expect(call.data).toHaveProperty('session');
    });
  });

  describe('terminateSession', () => {
    it('should reject invalid session ID', async () => {
      req = createMockReq({}, {});
      await terminateSession(req as Request, res as Response);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return success on terminate', async () => {
      req = createMockReq({ sessionId: 'test-1' }, {});
      await terminateSession(req as Request, res as Response);

      const call = (res.json as any).mock.calls[0][0];
      expect(call).toHaveProperty('success', true);
    });
  });

  describe('terminateInactiveSessions', () => {
    it('should return success message', async () => {
      req = createMockReq();
      await terminateInactiveSessions(req as Request, res as Response);

      const call = (res.json as any).mock.calls[0][0];
      expect(call).toHaveProperty('success', true);
    });
  });

  describe('terminateAllSessions', () => {
    it('should return success message', async () => {
      req = createMockReq();
      await terminateAllSessions(req as Request, res as Response);

      const call = (res.json as any).mock.calls[0][0];
      expect(call).toHaveProperty('success', true);
    });
  });

});
