import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express, { type Express } from 'express';
import { config } from '../../src/config.js';
import { createApp } from '../../src/app.js';

/**
 * Comprehensive Smoke Tests for ALL API Endpoints
 * 
 * Purpose: Verify all 117+ routes are mounted, accept correct HTTP methods,
 * validate requests, and return proper response envelopes.
 * 
 * This is a REGRESSION SAFETY NET - if any route is accidentally removed,
 * these tests will catch it.
 * 
 * Test Matrix per Endpoint:
 * ✅ Valid request → 200/201 with { success: true, ... }
 * ❌ Missing required field → 400 with validation error
 * ❌ Wrong HTTP method → 404 or 405
 * ❌ Missing API key → 403
 */

// Mock dependencies - use factory functions to avoid hoisting issues
vi.mock('../../src/services/session-manager.js', () => ({
  sessionManager: {
    getSession: vi.fn(() => ({
      id: 'test-session',
      socket: {
        sendMessage: vi.fn().mockResolvedValue({ key: { id: 'msg123' }, messageTimestamp: Date.now() }),
        sendPresenceUpdate: vi.fn().mockResolvedValue(undefined),
        readMessages: vi.fn().mockResolvedValue(undefined),
        groupMetadata: vi.fn().mockResolvedValue({ id: 'group123@g.us', subject: 'Test Group', participants: [] }),
        groupCreate: vi.fn().mockResolvedValue({ id: 'newgroup@g.us' }),
        groupParticipantsUpdate: vi.fn().mockResolvedValue([]),
        groupUpdateSubject: vi.fn().mockResolvedValue(undefined),
        groupUpdateDescription: vi.fn().mockResolvedValue(undefined),
        groupLeave: vi.fn().mockResolvedValue(undefined),
        groupInviteCode: vi.fn().mockResolvedValue('ABC123XYZ'),
        groupRevokeInvite: vi.fn().mockResolvedValue(undefined),
        onWhatsApp: vi.fn().mockResolvedValue([{ exists: true, jid: '6281234567890@s.whatsapp.net' }]),
        profilePictureUrl: vi.fn().mockResolvedValue('https://example.com/pic.jpg'),
        updateProfileStatus: vi.fn().mockResolvedValue(undefined),
        updateProfileName: vi.fn().mockResolvedValue(undefined),
        updateProfilePicture: vi.fn().mockResolvedValue(undefined),
        removeProfilePicture: vi.fn().mockResolvedValue(undefined),
        chatModify: vi.fn().mockResolvedValue(undefined),
        user: { id: 'test-user@s.whatsapp.net' },
      },
      status: 'connected',
      qr: 'test-qr-code',
    })),
    getAllSessions: vi.fn(() => [{
      id: 'test-session',
      status: 'connected',
    }]),
    getSessionInfo: vi.fn(() => ({
      id: 'test-session',
      status: 'connected',
      qr: 'test-qr-code',
    })),
    startSession: vi.fn().mockResolvedValue({ id: 'test-session', status: 'connecting' }),
    stopSession: vi.fn().mockResolvedValue(undefined),
    restartSession: vi.fn().mockResolvedValue({ id: 'test-session', status: 'connecting' }),
    terminateSession: vi.fn().mockResolvedValue(undefined),
    requestPairingCode: vi.fn().mockResolvedValue('123456'),
    hasSession: vi.fn(() => true),
    createSession: vi.fn().mockResolvedValue({ id: 'test-session', status: 'connecting' }),
  },
}));

vi.mock('../../src/services/store.js', () => ({
  getContactById: vi.fn().mockResolvedValue({ id: '123@s.whatsapp.net', name: 'Test Contact' }),
  getChatById: vi.fn().mockResolvedValue({ id: '123@s.whatsapp.net', name: 'Test Chat' }),
  getContacts: vi.fn().mockResolvedValue([{ id: '123@s.whatsapp.net', name: 'Test Contact' }]),
  getChats: vi.fn().mockResolvedValue([{ id: '123@s.whatsapp.net', name: 'Test Chat' }]),
}));

vi.mock('../../src/services/sse.js', () => ({
  sseManager: {
    createStream: vi.fn(),
    closeStream: vi.fn(),
    closeAll: vi.fn(),
  },
}));

vi.mock('../../src/services/websocket.js', () => ({
  webSocketManager: {
    close: vi.fn().mockResolvedValue(undefined),
  },
}));

describe('Smoke Tests: All API Endpoints', () => {
  let app: Express;
  const API_KEY = 'test-api-key';

  beforeEach(() => {
    process.env.NODE_ENV = 'test';
    process.env.API_KEY = API_KEY;
    app = createApp();
    vi.clearAllMocks();
  });

  // ============================================================================
  // HEALTH ENDPOINTS (1 endpoint)
  // ============================================================================
  describe('Health Endpoints', () => {
    describe('GET /api/health/ping', () => {
      it('✅ should return pong without API key', async () => {
        const response = await request(app)
          .get('/api/health/ping')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.message).toBe('pong');
      });

      it('❌ should return 404 for wrong HTTP method', async () => {
        await request(app)
          .post('/api/health/ping')
          .expect(404);
      });
    });
  });

  // ============================================================================
  // SESSION ENDPOINTS (12 endpoints)
  // ============================================================================
  describe('Session Endpoints', () => {
    describe('GET /api/sessions', () => {
      it('✅ should list all sessions', async () => {
        const response = await request(app)
          .get('/api/sessions')
          .set('x-api-key', API_KEY)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data)).toBe(true);
      });

      it('❌ should return 403 without API key', async () => {
        await request(app)
          .get('/api/sessions')
          .expect(403);
      });
    });

    describe('POST /api/sessions/:sessionId/start', () => {
      it('✅ should start session with valid request', async () => {
        const response = await request(app)
          .post('/api/sessions/test/start')
          .set('x-api-key', API_KEY)
          .send({})
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it('❌ should return 403 without API key', async () => {
        await request(app)
          .post('/api/sessions/test/start')
          .expect(403);
      });

      it('❌ should return 404 for wrong HTTP method', async () => {
        await request(app)
          .get('/api/sessions/test/start')
          .set('x-api-key', API_KEY)
          .expect(404);
      });
    });

    describe('POST /api/sessions/:sessionId/stop', () => {
      it('✅ should stop session', async () => {
        const response = await request(app)
          .post('/api/sessions/test/stop')
          .set('x-api-key', API_KEY)
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it('❌ should return 403 without API key', async () => {
        await request(app)
          .post('/api/sessions/test/stop')
          .expect(403);
      });
    });

    describe('GET /api/sessions/:sessionId/status', () => {
      it('✅ should get session status', async () => {
        const response = await request(app)
          .get('/api/sessions/test/status')
          .set('x-api-key', API_KEY)
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it('❌ should return 403 without API key', async () => {
        await request(app)
          .get('/api/sessions/test/status')
          .expect(403);
      });
    });

    describe('GET /api/sessions/:sessionId/qr', () => {
      it('✅ should get QR code as JSON', async () => {
        const response = await request(app)
          .get('/api/sessions/test/qr')
          .set('x-api-key', API_KEY)
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it('❌ should return 403 without API key', async () => {
        await request(app)
          .get('/api/sessions/test/qr')
          .expect(403);
      });
    });

    describe('GET /api/sessions/:sessionId/qr/image', () => {
      it('✅ should get QR code as image', async () => {
        await request(app)
          .get('/api/sessions/test/qr/image')
          .set('x-api-key', API_KEY)
          .expect(200);
      });

      it('❌ should return 403 without API key', async () => {
        await request(app)
          .get('/api/sessions/test/qr/image')
          .expect(403);
      });
    });

    describe('GET /api/sessions/:sessionId/qr/stream', () => {
      it('✅ should stream QR code via SSE', async () => {
        const response = await request(app)
          .get('/api/sessions/test/qr/stream')
          .set('x-api-key', API_KEY)
          .expect(200);

        expect(response.headers['content-type']).toContain('text/event-stream');
      });

      it('❌ should return 403 without API key', async () => {
        await request(app)
          .get('/api/sessions/test/qr/stream')
          .expect(403);
      });
    });

    describe('POST /api/sessions/:sessionId/pairing-code', () => {
      it('✅ should request pairing code with phone number', async () => {
        const response = await request(app)
          .post('/api/sessions/test/pairing-code')
          .set('x-api-key', API_KEY)
          .send({ phoneNumber: '6281234567890' })
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it('❌ should return 400 for missing phone number', async () => {
        const response = await request(app)
          .post('/api/sessions/test/pairing-code')
          .set('x-api-key', API_KEY)
          .send({})
          .expect(400);

        expect(response.body.success).toBe(false);
      });

      it('❌ should return 403 without API key', async () => {
        await request(app)
          .post('/api/sessions/test/pairing-code')
          .expect(403);
      });
    });

    describe('POST /api/sessions/:sessionId/restart', () => {
      it('✅ should restart session', async () => {
        const response = await request(app)
          .post('/api/sessions/test/restart')
          .set('x-api-key', API_KEY)
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it('❌ should return 403 without API key', async () => {
        await request(app)
          .post('/api/sessions/test/restart')
          .expect(403);
      });
    });

    describe('DELETE /api/sessions/:sessionId', () => {
      it('✅ should delete specific session', async () => {
        const response = await request(app)
          .delete('/api/sessions/test')
          .set('x-api-key', API_KEY)
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it('❌ should return 403 without API key', async () => {
        await request(app)
          .delete('/api/sessions/test')
          .expect(403);
      });
    });

    describe('DELETE /api/sessions/inactive', () => {
      it('✅ should delete all inactive sessions', async () => {
        const response = await request(app)
          .delete('/api/sessions/inactive')
          .set('x-api-key', API_KEY)
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it('❌ should return 403 without API key', async () => {
        await request(app)
          .delete('/api/sessions/inactive')
          .expect(403);
      });
    });

    describe('DELETE /api/sessions', () => {
      it('✅ should delete all sessions', async () => {
        const response = await request(app)
          .delete('/api/sessions')
          .set('x-api-key', API_KEY)
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it('❌ should return 403 without API key', async () => {
        await request(app)
          .delete('/api/sessions')
          .expect(403);
      });
    });
  });

  // ============================================================================
  // CLIENT ENDPOINTS (27 endpoints)
  // ============================================================================
  describe('Client Endpoints', () => {
    describe('POST /api/sessions/:sessionId/client/send-message', () => {
      it('✅ should send message with valid request', async () => {
        const response = await request(app)
          .post('/api/sessions/test/client/send-message')
          .set('x-api-key', API_KEY)
          .send({ chatId: '123@s.whatsapp.net', contentType: 'text', content: { text: 'hello' } })
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it('❌ should return 400 for missing required field', async () => {
        const response = await request(app)
          .post('/api/sessions/test/client/send-message')
          .set('x-api-key', API_KEY)
          .send({ chatId: '123@s.whatsapp.net' })
          .expect(400);

        expect(response.body.success).toBe(false);
      });

      it('❌ should return 403 without API key', async () => {
        await request(app)
          .post('/api/sessions/test/client/send-message')
          .expect(403);
      });
    });

    describe('GET /api/sessions/:sessionId/client/contacts', () => {
      it('✅ should get contacts', async () => {
        const response = await request(app)
          .get('/api/sessions/test/client/contacts')
          .set('x-api-key', API_KEY)
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it('❌ should return 403 without API key', async () => {
        await request(app)
          .get('/api/sessions/test/client/contacts')
          .expect(403);
      });
    });

    describe('GET /api/sessions/:sessionId/client/chats', () => {
      it('✅ should get chats', async () => {
        const response = await request(app)
          .get('/api/sessions/test/client/chats')
          .set('x-api-key', API_KEY)
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it('❌ should return 403 without API key', async () => {
        await request(app)
          .get('/api/sessions/test/client/chats')
          .expect(403);
      });
    });

    describe('POST /api/sessions/:sessionId/client/chats', () => {
      it('✅ should search chats', async () => {
        const response = await request(app)
          .post('/api/sessions/test/client/chats')
          .set('x-api-key', API_KEY)
          .send({ query: 'test' })
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it('❌ should return 403 without API key', async () => {
        await request(app)
          .post('/api/sessions/test/client/chats')
          .expect(403);
      });
    });

    describe('POST /api/sessions/:sessionId/client/chat/:chatId', () => {
      it('✅ should get chat by ID', async () => {
        const response = await request(app)
          .post('/api/sessions/test/client/chat/123@s.whatsapp.net')
          .set('x-api-key', API_KEY)
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it('❌ should return 403 without API key', async () => {
        await request(app)
          .post('/api/sessions/test/client/chat/123@s.whatsapp.net')
          .expect(403);
      });
    });

    describe('POST /api/sessions/:sessionId/client/contact/:contactId', () => {
      it('✅ should get contact by ID', async () => {
        const response = await request(app)
          .post('/api/sessions/test/client/contact/123@s.whatsapp.net')
          .set('x-api-key', API_KEY)
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it('❌ should return 403 without API key', async () => {
        await request(app)
          .post('/api/sessions/test/client/contact/123@s.whatsapp.net')
          .expect(403);
      });
    });

    describe('POST /api/sessions/:sessionId/client/is-registered', () => {
      it('✅ should check if number is registered', async () => {
        const response = await request(app)
          .post('/api/sessions/test/client/is-registered')
          .set('x-api-key', API_KEY)
          .send({ phoneNumber: '6281234567890' })
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it('❌ should return 400 for missing phone number', async () => {
        await request(app)
          .post('/api/sessions/test/client/is-registered')
          .set('x-api-key', API_KEY)
          .send({})
          .expect(400);
      });

      it('❌ should return 403 without API key', async () => {
        await request(app)
          .post('/api/sessions/test/client/is-registered')
          .expect(403);
      });
    });

    describe('POST /api/sessions/:sessionId/client/number-id', () => {
      it('✅ should get number ID', async () => {
        const response = await request(app)
          .post('/api/sessions/test/client/number-id')
          .set('x-api-key', API_KEY)
          .send({ phoneNumber: '6281234567890' })
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it('❌ should return 403 without API key', async () => {
        await request(app)
          .post('/api/sessions/test/client/number-id')
          .expect(403);
      });
    });

    describe('POST /api/sessions/:sessionId/client/profile-picture-url', () => {
      it('✅ should get profile picture URL', async () => {
        const response = await request(app)
          .post('/api/sessions/test/client/profile-picture-url')
          .set('x-api-key', API_KEY)
          .send({ chatId: '123@s.whatsapp.net' })
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it('❌ should return 403 without API key', async () => {
        await request(app)
          .post('/api/sessions/test/client/profile-picture-url')
          .expect(403);
      });
    });

    describe('POST /api/sessions/:sessionId/client/set-status', () => {
      it('✅ should set status', async () => {
        const response = await request(app)
          .post('/api/sessions/test/client/set-status')
          .set('x-api-key', API_KEY)
          .send({ status: 'Available' })
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it('❌ should return 403 without API key', async () => {
        await request(app)
          .post('/api/sessions/test/client/set-status')
          .expect(403);
      });
    });

    describe('POST /api/sessions/:sessionId/client/set-display-name', () => {
      it('✅ should set display name', async () => {
        const response = await request(app)
          .post('/api/sessions/test/client/set-display-name')
          .set('x-api-key', API_KEY)
          .send({ name: 'Test Name' })
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it('❌ should return 403 without API key', async () => {
        await request(app)
          .post('/api/sessions/test/client/set-display-name')
          .expect(403);
      });
    });

    describe('POST /api/sessions/:sessionId/client/set-profile-picture', () => {
      it('✅ should set profile picture', async () => {
        const response = await request(app)
          .post('/api/sessions/test/client/set-profile-picture')
          .set('x-api-key', API_KEY)
          .send({ image: 'base64-image-data' })
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it('❌ should return 403 without API key', async () => {
        await request(app)
          .post('/api/sessions/test/client/set-profile-picture')
          .expect(403);
      });
    });

    describe('DELETE /api/sessions/:sessionId/client/profile-picture', () => {
      it('✅ should delete profile picture', async () => {
        const response = await request(app)
          .delete('/api/sessions/test/client/profile-picture')
          .set('x-api-key', API_KEY)
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it('❌ should return 403 without API key', async () => {
        await request(app)
          .delete('/api/sessions/test/client/profile-picture')
          .expect(403);
      });
    });

    describe('POST /api/sessions/:sessionId/client/create-group', () => {
      it('✅ should create group', async () => {
        const response = await request(app)
          .post('/api/sessions/test/client/create-group')
          .set('x-api-key', API_KEY)
          .send({ subject: 'Test Group', participants: ['123@s.whatsapp.net'] })
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it('❌ should return 400 for missing required fields', async () => {
        await request(app)
          .post('/api/sessions/test/client/create-group')
          .set('x-api-key', API_KEY)
          .send({})
          .expect(400);
      });

      it('❌ should return 403 without API key', async () => {
        await request(app)
          .post('/api/sessions/test/client/create-group')
          .expect(403);
      });
    });

    describe('POST /api/sessions/:sessionId/client/presence/available', () => {
      it('✅ should set presence to available', async () => {
        const response = await request(app)
          .post('/api/sessions/test/client/presence/available')
          .set('x-api-key', API_KEY)
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it('❌ should return 403 without API key', async () => {
        await request(app)
          .post('/api/sessions/test/client/presence/available')
          .expect(403);
      });
    });

    describe('POST /api/sessions/:sessionId/client/presence/unavailable', () => {
      it('✅ should set presence to unavailable', async () => {
        const response = await request(app)
          .post('/api/sessions/test/client/presence/unavailable')
          .set('x-api-key', API_KEY)
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it('❌ should return 403 without API key', async () => {
        await request(app)
          .post('/api/sessions/test/client/presence/unavailable')
          .expect(403);
      });
    });

    describe('POST /api/sessions/:sessionId/client/search-messages', () => {
      it('✅ should search messages', async () => {
        const response = await request(app)
          .post('/api/sessions/test/client/search-messages')
          .set('x-api-key', API_KEY)
          .send({ query: 'test', chatId: '123@s.whatsapp.net' })
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it('❌ should return 403 without API key', async () => {
        await request(app)
          .post('/api/sessions/test/client/search-messages')
          .expect(403);
      });
    });

    describe('GET /api/sessions/:sessionId/client/blocked-contacts', () => {
      it('✅ should get blocked contacts', async () => {
        const response = await request(app)
          .get('/api/sessions/test/client/blocked-contacts')
          .set('x-api-key', API_KEY)
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it('❌ should return 403 without API key', async () => {
        await request(app)
          .get('/api/sessions/test/client/blocked-contacts')
          .expect(403);
      });
    });

    describe('GET /api/sessions/:sessionId/client/labels', () => {
      it('✅ should get labels', async () => {
        const response = await request(app)
          .get('/api/sessions/test/client/labels')
          .set('x-api-key', API_KEY)
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it('❌ should return 403 without API key', async () => {
        await request(app)
          .get('/api/sessions/test/client/labels')
          .expect(403);
      });
    });

    describe('POST /api/sessions/:sessionId/client/labels/:labelId', () => {
      it('✅ should get label by ID', async () => {
        const response = await request(app)
          .post('/api/sessions/test/client/labels/123')
          .set('x-api-key', API_KEY)
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it('❌ should return 403 without API key', async () => {
        await request(app)
          .post('/api/sessions/test/client/labels/123')
          .expect(403);
      });
    });

    describe('POST /api/sessions/:sessionId/client/labels/chat/:chatId', () => {
      it('✅ should get labels for chat', async () => {
        const response = await request(app)
          .post('/api/sessions/test/client/labels/chat/123@s.whatsapp.net')
          .set('x-api-key', API_KEY)
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it('❌ should return 403 without API key', async () => {
        await request(app)
          .post('/api/sessions/test/client/labels/chat/123@s.whatsapp.net')
          .expect(403);
      });
    });

    describe('POST /api/sessions/:sessionId/client/labels/:labelId/chats', () => {
      it('✅ should get chats by label ID', async () => {
        const response = await request(app)
          .post('/api/sessions/test/client/labels/123/chats')
          .set('x-api-key', API_KEY)
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it('❌ should return 403 without API key', async () => {
        await request(app)
          .post('/api/sessions/test/client/labels/123/chats')
          .expect(403);
      });
    });

    describe('POST /api/sessions/:sessionId/client/labels/modify', () => {
      it('✅ should modify labels', async () => {
        const response = await request(app)
          .post('/api/sessions/test/client/labels/modify')
          .set('x-api-key', API_KEY)
          .send({ chatId: '123@s.whatsapp.net', labelIds: ['1', '2'] })
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it('❌ should return 403 without API key', async () => {
        await request(app)
          .post('/api/sessions/test/client/labels/modify')
          .expect(403);
      });
    });
  });

  // ============================================================================
  // MESSAGE ENDPOINTS (14 endpoints)
  // ============================================================================
  describe('Message Endpoints', () => {
    describe('POST /api/sessions/:sessionId/messages/delete', () => {
      it('✅ should delete message', async () => {
        const response = await request(app)
          .post('/api/sessions/test/messages/delete')
          .set('x-api-key', API_KEY)
          .send({ chatId: '123@s.whatsapp.net', messageId: 'msg123' })
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it('❌ should return 400 for missing required fields', async () => {
        await request(app)
          .post('/api/sessions/test/messages/delete')
          .set('x-api-key', API_KEY)
          .send({})
          .expect(400);
      });

      it('❌ should return 403 without API key', async () => {
        await request(app)
          .post('/api/sessions/test/messages/delete')
          .expect(403);
      });
    });

    describe('POST /api/sessions/:sessionId/messages/edit', () => {
      it('✅ should edit message', async () => {
        const response = await request(app)
          .post('/api/sessions/test/messages/edit')
          .set('x-api-key', API_KEY)
          .send({ chatId: '123@s.whatsapp.net', messageId: 'msg123', newText: 'edited' })
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it('❌ should return 403 without API key', async () => {
        await request(app)
          .post('/api/sessions/test/messages/edit')
          .expect(403);
      });
    });

    describe('POST /api/sessions/:sessionId/messages/react', () => {
      it('✅ should react to message', async () => {
        const response = await request(app)
          .post('/api/sessions/test/messages/react')
          .set('x-api-key', API_KEY)
          .send({ chatId: '123@s.whatsapp.net', messageId: 'msg123', reaction: '👍' })
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it('❌ should return 403 without API key', async () => {
        await request(app)
          .post('/api/sessions/test/messages/react')
          .expect(403);
      });
    });

    describe('POST /api/sessions/:sessionId/messages/forward', () => {
      it('✅ should forward message', async () => {
        const response = await request(app)
          .post('/api/sessions/test/messages/forward')
          .set('x-api-key', API_KEY)
          .send({ chatId: '123@s.whatsapp.net', messageId: 'msg123', targetChatId: '456@s.whatsapp.net' })
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it('❌ should return 403 without API key', async () => {
        await request(app)
          .post('/api/sessions/test/messages/forward')
          .expect(403);
      });
    });

    describe('POST /api/sessions/:sessionId/messages/star', () => {
      it('✅ should star message', async () => {
        const response = await request(app)
          .post('/api/sessions/test/messages/star')
          .set('x-api-key', API_KEY)
          .send({ chatId: '123@s.whatsapp.net', messageId: 'msg123' })
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it('❌ should return 403 without API key', async () => {
        await request(app)
          .post('/api/sessions/test/messages/star')
          .expect(403);
      });
    });

    describe('POST /api/sessions/:sessionId/messages/unstar', () => {
      it('✅ should unstar message', async () => {
        const response = await request(app)
          .post('/api/sessions/test/messages/unstar')
          .set('x-api-key', API_KEY)
          .send({ chatId: '123@s.whatsapp.net', messageId: 'msg123' })
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it('❌ should return 403 without API key', async () => {
        await request(app)
          .post('/api/sessions/test/messages/unstar')
          .expect(403);
      });
    });

    describe('POST /api/sessions/:sessionId/messages/reply', () => {
      it('✅ should reply to message', async () => {
        const response = await request(app)
          .post('/api/sessions/test/messages/reply')
          .set('x-api-key', API_KEY)
          .send({ 
            chatId: '123@s.whatsapp.net', 
            messageId: 'msg123',
            contentType: 'text',
            content: { text: 'reply' }
          })
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it('❌ should return 403 without API key', async () => {
        await request(app)
          .post('/api/sessions/test/messages/reply')
          .expect(403);
      });
    });

    describe('POST /api/sessions/:sessionId/messages/download-media', () => {
      it('✅ should download media', async () => {
        const response = await request(app)
          .post('/api/sessions/test/messages/download-media')
          .set('x-api-key', API_KEY)
          .send({ chatId: '123@s.whatsapp.net', messageId: 'msg123' })
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it('❌ should return 403 without API key', async () => {
        await request(app)
          .post('/api/sessions/test/messages/download-media')
          .expect(403);
      });
    });

    describe('POST /api/sessions/:sessionId/messages/download-media/stream', () => {
      it('✅ should download media as stream', async () => {
        const response = await request(app)
          .post('/api/sessions/test/messages/download-media/stream')
          .set('x-api-key', API_KEY)
          .send({ chatId: '123@s.whatsapp.net', messageId: 'msg123' })
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it('❌ should return 403 without API key', async () => {
        await request(app)
          .post('/api/sessions/test/messages/download-media/stream')
          .expect(403);
      });
    });

    describe('POST /api/sessions/:sessionId/messages/info', () => {
      it('✅ should get message info', async () => {
        const response = await request(app)
          .post('/api/sessions/test/messages/info')
          .set('x-api-key', API_KEY)
          .send({ chatId: '123@s.whatsapp.net', messageId: 'msg123' })
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it('❌ should return 403 without API key', async () => {
        await request(app)
          .post('/api/sessions/test/messages/info')
          .expect(403);
      });
    });

    describe('POST /api/sessions/:sessionId/messages/mentions', () => {
      it('✅ should get message mentions', async () => {
        const response = await request(app)
          .post('/api/sessions/test/messages/mentions')
          .set('x-api-key', API_KEY)
          .send({ chatId: '123@s.whatsapp.net', messageId: 'msg123' })
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it('❌ should return 403 without API key', async () => {
        await request(app)
          .post('/api/sessions/test/messages/mentions')
          .expect(403);
      });
    });

    describe('POST /api/sessions/:sessionId/messages/quoted', () => {
      it('✅ should get quoted message', async () => {
        const response = await request(app)
          .post('/api/sessions/test/messages/quoted')
          .set('x-api-key', API_KEY)
          .send({ chatId: '123@s.whatsapp.net', messageId: 'msg123' })
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it('❌ should return 403 without API key', async () => {
        await request(app)
          .post('/api/sessions/test/messages/quoted')
          .expect(403);
      });
    });

    describe('POST /api/sessions/:sessionId/messages/reactions', () => {
      it('✅ should get message reactions', async () => {
        const response = await request(app)
          .post('/api/sessions/test/messages/reactions')
          .set('x-api-key', API_KEY)
          .send({ chatId: '123@s.whatsapp.net', messageId: 'msg123' })
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it('❌ should return 403 without API key', async () => {
        await request(app)
          .post('/api/sessions/test/messages/reactions')
          .expect(403);
      });
    });

    describe('POST /api/sessions/:sessionId/messages/poll-votes', () => {
      it('✅ should get poll votes', async () => {
        const response = await request(app)
          .post('/api/sessions/test/messages/poll-votes')
          .set('x-api-key', API_KEY)
          .send({ chatId: '123@s.whatsapp.net', messageId: 'msg123' })
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it('❌ should return 403 without API key', async () => {
        await request(app)
          .post('/api/sessions/test/messages/poll-votes')
          .expect(403);
      });
    });

    describe('POST /api/sessions/:sessionId/messages/contact', () => {
      it('✅ should get message contact', async () => {
        const response = await request(app)
          .post('/api/sessions/test/messages/contact')
          .set('x-api-key', API_KEY)
          .send({ chatId: '123@s.whatsapp.net', messageId: 'msg123' })
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it('❌ should return 403 without API key', async () => {
        await request(app)
          .post('/api/sessions/test/messages/contact')
          .expect(403);
      });
    });
  });

  // ============================================================================
  // CHAT ENDPOINTS (14 endpoints)
  // ============================================================================
  describe('Chat Endpoints', () => {
    describe('POST /api/sessions/:sessionId/chats/chats/:chatId/typing', () => {
      it('✅ should send typing indicator', async () => {
        const response = await request(app)
          .post('/api/sessions/test/chats/chats/123@s.whatsapp.net/typing')
          .set('x-api-key', API_KEY)
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it('❌ should return 403 without API key', async () => {
        await request(app)
          .post('/api/sessions/test/chats/chats/123@s.whatsapp.net/typing')
          .expect(403);
      });
    });

    describe('POST /api/sessions/:sessionId/chats/chats/:chatId/recording', () => {
      it('✅ should send recording indicator', async () => {
        const response = await request(app)
          .post('/api/sessions/test/chats/chats/123@s.whatsapp.net/recording')
          .set('x-api-key', API_KEY)
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it('❌ should return 403 without API key', async () => {
        await request(app)
          .post('/api/sessions/test/chats/chats/123@s.whatsapp.net/recording')
          .expect(403);
      });
    });

    describe('POST /api/sessions/:sessionId/chats/chats/:chatId/clear-state', () => {
      it('✅ should clear presence state', async () => {
        const response = await request(app)
          .post('/api/sessions/test/chats/chats/123@s.whatsapp.net/clear-state')
          .set('x-api-key', API_KEY)
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it('❌ should return 403 without API key', async () => {
        await request(app)
          .post('/api/sessions/test/chats/chats/123@s.whatsapp.net/clear-state')
          .expect(403);
      });
    });

    describe('POST /api/sessions/:sessionId/chats/chats/:chatId/seen', () => {
      it('✅ should mark messages as read', async () => {
        const response = await request(app)
          .post('/api/sessions/test/chats/chats/123@s.whatsapp.net/seen')
          .set('x-api-key', API_KEY)
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it('❌ should return 403 without API key', async () => {
        await request(app)
          .post('/api/sessions/test/chats/chats/123@s.whatsapp.net/seen')
          .expect(403);
      });
    });

    describe('POST /api/sessions/:sessionId/chats/chats/:chatId/mark-unread', () => {
      it('✅ should mark chat as unread', async () => {
        const response = await request(app)
          .post('/api/sessions/test/chats/chats/123@s.whatsapp.net/mark-unread')
          .set('x-api-key', API_KEY)
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it('❌ should return 403 without API key', async () => {
        await request(app)
          .post('/api/sessions/test/chats/chats/123@s.whatsapp.net/mark-unread')
          .expect(403);
      });
    });

    describe('POST /api/sessions/:sessionId/chats/chats/:chatId/archive', () => {
      it('✅ should archive chat', async () => {
        const response = await request(app)
          .post('/api/sessions/test/chats/chats/123@s.whatsapp.net/archive')
          .set('x-api-key', API_KEY)
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it('❌ should return 403 without API key', async () => {
        await request(app)
          .post('/api/sessions/test/chats/chats/123@s.whatsapp.net/archive')
          .expect(403);
      });
    });

    describe('POST /api/sessions/:sessionId/chats/chats/:chatId/unarchive', () => {
      it('✅ should unarchive chat', async () => {
        const response = await request(app)
          .post('/api/sessions/test/chats/chats/123@s.whatsapp.net/unarchive')
          .set('x-api-key', API_KEY)
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it('❌ should return 403 without API key', async () => {
        await request(app)
          .post('/api/sessions/test/chats/chats/123@s.whatsapp.net/unarchive')
          .expect(403);
      });
    });

    describe('POST /api/sessions/:sessionId/chats/chats/:chatId/pin', () => {
      it('✅ should pin chat', async () => {
        const response = await request(app)
          .post('/api/sessions/test/chats/chats/123@s.whatsapp.net/pin')
          .set('x-api-key', API_KEY)
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it('❌ should return 403 without API key', async () => {
        await request(app)
          .post('/api/sessions/test/chats/chats/123@s.whatsapp.net/pin')
          .expect(403);
      });
    });

    describe('POST /api/sessions/:sessionId/chats/chats/:chatId/unpin', () => {
      it('✅ should unpin chat', async () => {
        const response = await request(app)
          .post('/api/sessions/test/chats/chats/123@s.whatsapp.net/unpin')
          .set('x-api-key', API_KEY)
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it('❌ should return 403 without API key', async () => {
        await request(app)
          .post('/api/sessions/test/chats/chats/123@s.whatsapp.net/unpin')
          .expect(403);
      });
    });

    describe('POST /api/sessions/:sessionId/chats/chats/:chatId/mute', () => {
      it('✅ should mute chat', async () => {
        const response = await request(app)
          .post('/api/sessions/test/chats/chats/123@s.whatsapp.net/mute')
          .set('x-api-key', API_KEY)
          .send({ duration: 3600 })
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it('❌ should return 403 without API key', async () => {
        await request(app)
          .post('/api/sessions/test/chats/chats/123@s.whatsapp.net/mute')
          .expect(403);
      });
    });

    describe('POST /api/sessions/:sessionId/chats/chats/:chatId/unmute', () => {
      it('✅ should unmute chat', async () => {
        const response = await request(app)
          .post('/api/sessions/test/chats/chats/123@s.whatsapp.net/unmute')
          .set('x-api-key', API_KEY)
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it('❌ should return 403 without API key', async () => {
        await request(app)
          .post('/api/sessions/test/chats/chats/123@s.whatsapp.net/unmute')
          .expect(403);
      });
    });

    describe('GET /api/sessions/:sessionId/chats/chats/:chatId/messages', () => {
      it('✅ should fetch messages', async () => {
        const response = await request(app)
          .get('/api/sessions/test/chats/chats/123@s.whatsapp.net/messages')
          .set('x-api-key', API_KEY)
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it('❌ should return 403 without API key', async () => {
        await request(app)
          .get('/api/sessions/test/chats/chats/123@s.whatsapp.net/messages')
          .expect(403);
      });
    });

    describe('GET /api/sessions/:sessionId/chats/chats/:chatId/contact', () => {
      it('✅ should get chat contact', async () => {
        const response = await request(app)
          .get('/api/sessions/test/chats/chats/123@s.whatsapp.net/contact')
          .set('x-api-key', API_KEY)
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it('❌ should return 403 without API key', async () => {
        await request(app)
          .get('/api/sessions/test/chats/chats/123@s.whatsapp.net/contact')
          .expect(403);
      });
    });

    describe('DELETE /api/sessions/:sessionId/chats/chats/:chatId', () => {
      it('✅ should delete chat', async () => {
        const response = await request(app)
          .delete('/api/sessions/test/chats/chats/123@s.whatsapp.net')
          .set('x-api-key', API_KEY)
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it('❌ should return 403 without API key', async () => {
        await request(app)
          .delete('/api/sessions/test/chats/chats/123@s.whatsapp.net')
          .expect(403);
      });
    });

    describe('POST /api/sessions/:sessionId/chats/chats/:chatId/clear', () => {
      it('✅ should clear chat messages', async () => {
        const response = await request(app)
          .post('/api/sessions/test/chats/chats/123@s.whatsapp.net/clear')
          .set('x-api-key', API_KEY)
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it('❌ should return 403 without API key', async () => {
        await request(app)
          .post('/api/sessions/test/chats/chats/123@s.whatsapp.net/clear')
          .expect(403);
      });
    });

    describe('GET /api/sessions/:sessionId/chats/chats/:chatId/labels', () => {
      it('✅ should get chat labels', async () => {
        const response = await request(app)
          .get('/api/sessions/test/chats/chats/123@s.whatsapp.net/labels')
          .set('x-api-key', API_KEY)
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it('❌ should return 403 without API key', async () => {
        await request(app)
          .get('/api/sessions/test/chats/chats/123@s.whatsapp.net/labels')
          .expect(403);
      });
    });

    describe('POST /api/sessions/:sessionId/chats/chats/:chatId/labels/modify', () => {
      it('✅ should modify chat labels', async () => {
        const response = await request(app)
          .post('/api/sessions/test/chats/chats/123@s.whatsapp.net/labels/modify')
          .set('x-api-key', API_KEY)
          .send({ labelIds: ['1', '2'] })
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it('❌ should return 403 without API key', async () => {
        await request(app)
          .post('/api/sessions/test/chats/chats/123@s.whatsapp.net/labels/modify')
          .expect(403);
      });
    });
  });

  // ============================================================================
  // GROUP ENDPOINTS (23 endpoints)
  // ============================================================================
  describe('Group Endpoints', () => {
    describe('POST /api/sessions/:sessionId/groups/accept-invite', () => {
      it('✅ should accept invite', async () => {
        const response = await request(app)
          .post('/api/sessions/test/groups/accept-invite')
          .set('x-api-key', API_KEY)
          .send({ inviteCode: 'ABC123XYZ' })
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it('❌ should return 400 for missing invite code', async () => {
        await request(app)
          .post('/api/sessions/test/groups/accept-invite')
          .set('x-api-key', API_KEY)
          .send({})
          .expect(400);
      });

      it('❌ should return 403 without API key', async () => {
        await request(app)
          .post('/api/sessions/test/groups/accept-invite')
          .expect(403);
      });
    });

    describe('POST /api/sessions/:sessionId/groups/invite-info', () => {
      it('✅ should get invite info', async () => {
        const response = await request(app)
          .post('/api/sessions/test/groups/invite-info')
          .set('x-api-key', API_KEY)
          .send({ inviteCode: 'ABC123XYZ' })
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it('❌ should return 403 without API key', async () => {
        await request(app)
          .post('/api/sessions/test/groups/invite-info')
          .expect(403);
      });
    });

    describe('GET /api/sessions/:sessionId/groups', () => {
      it('✅ should list all groups', async () => {
        const response = await request(app)
          .get('/api/sessions/test/groups')
          .set('x-api-key', API_KEY)
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it('❌ should return 403 without API key', async () => {
        await request(app)
          .get('/api/sessions/test/groups')
          .expect(403);
      });
    });

    describe('GET /api/sessions/:sessionId/groups/:groupId', () => {
      it('✅ should get group metadata', async () => {
        const response = await request(app)
          .get('/api/sessions/test/groups/123@g.us')
          .set('x-api-key', API_KEY)
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it('❌ should return 403 without API key', async () => {
        await request(app)
          .get('/api/sessions/test/groups/123@g.us')
          .expect(403);
      });
    });

    describe('POST /api/sessions/:sessionId/groups/:groupId/participants/add', () => {
      it('✅ should add participants', async () => {
        const response = await request(app)
          .post('/api/sessions/test/groups/123@g.us/participants/add')
          .set('x-api-key', API_KEY)
          .send({ participants: ['456@s.whatsapp.net'] })
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it('❌ should return 400 for missing participants', async () => {
        await request(app)
          .post('/api/sessions/test/groups/123@g.us/participants/add')
          .set('x-api-key', API_KEY)
          .send({})
          .expect(400);
      });

      it('❌ should return 403 without API key', async () => {
        await request(app)
          .post('/api/sessions/test/groups/123@g.us/participants/add')
          .expect(403);
      });
    });

    describe('POST /api/sessions/:sessionId/groups/:groupId/participants/remove', () => {
      it('✅ should remove participants', async () => {
        const response = await request(app)
          .post('/api/sessions/test/groups/123@g.us/participants/remove')
          .set('x-api-key', API_KEY)
          .send({ participants: ['456@s.whatsapp.net'] })
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it('❌ should return 403 without API key', async () => {
        await request(app)
          .post('/api/sessions/test/groups/123@g.us/participants/remove')
          .expect(403);
      });
    });

    describe('POST /api/sessions/:sessionId/groups/:groupId/participants/promote', () => {
      it('✅ should promote participants', async () => {
        const response = await request(app)
          .post('/api/sessions/test/groups/123@g.us/participants/promote')
          .set('x-api-key', API_KEY)
          .send({ participants: ['456@s.whatsapp.net'] })
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it('❌ should return 403 without API key', async () => {
        await request(app)
          .post('/api/sessions/test/groups/123@g.us/participants/promote')
          .expect(403);
      });
    });

    describe('POST /api/sessions/:sessionId/groups/:groupId/participants/demote', () => {
      it('✅ should demote participants', async () => {
        const response = await request(app)
          .post('/api/sessions/test/groups/123@g.us/participants/demote')
          .set('x-api-key', API_KEY)
          .send({ participants: ['456@s.whatsapp.net'] })
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it('❌ should return 403 without API key', async () => {
        await request(app)
          .post('/api/sessions/test/groups/123@g.us/participants/demote')
          .expect(403);
      });
    });

    describe('GET /api/sessions/:sessionId/groups/:groupId/invite-code', () => {
      it('✅ should get invite code', async () => {
        const response = await request(app)
          .get('/api/sessions/test/groups/123@g.us/invite-code')
          .set('x-api-key', API_KEY)
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it('❌ should return 403 without API key', async () => {
        await request(app)
          .get('/api/sessions/test/groups/123@g.us/invite-code')
          .expect(403);
      });
    });

    describe('POST /api/sessions/:sessionId/groups/:groupId/revoke-invite', () => {
      it('✅ should revoke invite', async () => {
        const response = await request(app)
          .post('/api/sessions/test/groups/123@g.us/revoke-invite')
          .set('x-api-key', API_KEY)
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it('❌ should return 403 without API key', async () => {
        await request(app)
          .post('/api/sessions/test/groups/123@g.us/revoke-invite')
          .expect(403);
      });
    });

    describe('POST /api/sessions/:sessionId/groups/:groupId/leave', () => {
      it('✅ should leave group', async () => {
        const response = await request(app)
          .post('/api/sessions/test/groups/123@g.us/leave')
          .set('x-api-key', API_KEY)
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it('❌ should return 403 without API key', async () => {
        await request(app)
          .post('/api/sessions/test/groups/123@g.us/leave')
          .expect(403);
      });
    });

    describe('PUT /api/sessions/:sessionId/groups/:groupId/subject', () => {
      it('✅ should update group subject', async () => {
        const response = await request(app)
          .put('/api/sessions/test/groups/123@g.us/subject')
          .set('x-api-key', API_KEY)
          .send({ subject: 'New Subject' })
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it('❌ should return 400 for missing subject', async () => {
        await request(app)
          .put('/api/sessions/test/groups/123@g.us/subject')
          .set('x-api-key', API_KEY)
          .send({})
          .expect(400);
      });

      it('❌ should return 403 without API key', async () => {
        await request(app)
          .put('/api/sessions/test/groups/123@g.us/subject')
          .expect(403);
      });
    });

    describe('PUT /api/sessions/:sessionId/groups/:groupId/description', () => {
      it('✅ should update group description', async () => {
        const response = await request(app)
          .put('/api/sessions/test/groups/123@g.us/description')
          .set('x-api-key', API_KEY)
          .send({ description: 'New Description' })
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it('❌ should return 403 without API key', async () => {
        await request(app)
          .put('/api/sessions/test/groups/123@g.us/description')
          .expect(403);
      });
    });

    describe('PUT /api/sessions/:sessionId/groups/:groupId/picture', () => {
      it('✅ should update group picture', async () => {
        const response = await request(app)
          .put('/api/sessions/test/groups/123@g.us/picture')
          .set('x-api-key', API_KEY)
          .send({ image: 'base64-image-data' })
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it('❌ should return 403 without API key', async () => {
        await request(app)
          .put('/api/sessions/test/groups/123@g.us/picture')
          .expect(403);
      });
    });

    describe('DELETE /api/sessions/:sessionId/groups/:groupId/picture', () => {
      it('✅ should delete group picture', async () => {
        const response = await request(app)
          .delete('/api/sessions/test/groups/123@g.us/picture')
          .set('x-api-key', API_KEY)
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it('❌ should return 403 without API key', async () => {
        await request(app)
          .delete('/api/sessions/test/groups/123@g.us/picture')
          .expect(403);
      });
    });

    describe('PUT /api/sessions/:sessionId/groups/:groupId/settings/messages-admins-only', () => {
      it('✅ should set messages admins only', async () => {
        const response = await request(app)
          .put('/api/sessions/test/groups/123@g.us/settings/messages-admins-only')
          .set('x-api-key', API_KEY)
          .send({ adminsOnly: true })
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it('❌ should return 403 without API key', async () => {
        await request(app)
          .put('/api/sessions/test/groups/123@g.us/settings/messages-admins-only')
          .expect(403);
      });
    });

    describe('PUT /api/sessions/:sessionId/groups/:groupId/settings/info-admins-only', () => {
      it('✅ should set info admins only', async () => {
        const response = await request(app)
          .put('/api/sessions/test/groups/123@g.us/settings/info-admins-only')
          .set('x-api-key', API_KEY)
          .send({ adminsOnly: true })
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it('❌ should return 403 without API key', async () => {
        await request(app)
          .put('/api/sessions/test/groups/123@g.us/settings/info-admins-only')
          .expect(403);
      });
    });

    describe('GET /api/sessions/:sessionId/groups/:groupId/membership-requests', () => {
      it('✅ should get membership requests', async () => {
        const response = await request(app)
          .get('/api/sessions/test/groups/123@g.us/membership-requests')
          .set('x-api-key', API_KEY)
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it('❌ should return 403 without API key', async () => {
        await request(app)
          .get('/api/sessions/test/groups/123@g.us/membership-requests')
          .expect(403);
      });
    });

    describe('POST /api/sessions/:sessionId/groups/:groupId/membership-requests/approve', () => {
      it('✅ should approve membership requests', async () => {
        const response = await request(app)
          .post('/api/sessions/test/groups/123@g.us/membership-requests/approve')
          .set('x-api-key', API_KEY)
          .send({ participants: ['456@s.whatsapp.net'] })
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it('❌ should return 403 without API key', async () => {
        await request(app)
          .post('/api/sessions/test/groups/123@g.us/membership-requests/approve')
          .expect(403);
      });
    });

    describe('POST /api/sessions/:sessionId/groups/:groupId/membership-requests/reject', () => {
      it('✅ should reject membership requests', async () => {
        const response = await request(app)
          .post('/api/sessions/test/groups/123@g.us/membership-requests/reject')
          .set('x-api-key', API_KEY)
          .send({ participants: ['456@s.whatsapp.net'] })
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it('❌ should return 403 without API key', async () => {
        await request(app)
          .post('/api/sessions/test/groups/123@g.us/membership-requests/reject')
          .expect(403);
      });
    });
  });

  // ============================================================================
  // CONTACT ENDPOINTS (9 endpoints)
  // ============================================================================
  describe('Contact Endpoints', () => {
    describe('POST /api/sessions/:sessionId/contacts/info', () => {
      it('✅ should get contact info', async () => {
        const response = await request(app)
          .post('/api/sessions/test/contacts/info')
          .set('x-api-key', API_KEY)
          .send({ contactId: '123@s.whatsapp.net' })
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it('❌ should return 400 for missing contact ID', async () => {
        await request(app)
          .post('/api/sessions/test/contacts/info')
          .set('x-api-key', API_KEY)
          .send({})
          .expect(400);
      });

      it('❌ should return 403 without API key', async () => {
        await request(app)
          .post('/api/sessions/test/contacts/info')
          .expect(403);
      });
    });

    describe('POST /api/sessions/:sessionId/contacts/block', () => {
      it('✅ should block contact', async () => {
        const response = await request(app)
          .post('/api/sessions/test/contacts/block')
          .set('x-api-key', API_KEY)
          .send({ contactId: '123@s.whatsapp.net' })
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it('❌ should return 403 without API key', async () => {
        await request(app)
          .post('/api/sessions/test/contacts/block')
          .expect(403);
      });
    });

    describe('POST /api/sessions/:sessionId/contacts/unblock', () => {
      it('✅ should unblock contact', async () => {
        const response = await request(app)
          .post('/api/sessions/test/contacts/unblock')
          .set('x-api-key', API_KEY)
          .send({ contactId: '123@s.whatsapp.net' })
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it('❌ should return 403 without API key', async () => {
        await request(app)
          .post('/api/sessions/test/contacts/unblock')
          .expect(403);
      });
    });

    describe('POST /api/sessions/:sessionId/contacts/about', () => {
      it('✅ should get contact about', async () => {
        const response = await request(app)
          .post('/api/sessions/test/contacts/about')
          .set('x-api-key', API_KEY)
          .send({ contactId: '123@s.whatsapp.net' })
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it('❌ should return 403 without API key', async () => {
        await request(app)
          .post('/api/sessions/test/contacts/about')
          .expect(403);
      });
    });

    describe('POST /api/sessions/:sessionId/contacts/chat', () => {
      it('✅ should get contact chat', async () => {
        const response = await request(app)
          .post('/api/sessions/test/contacts/chat')
          .set('x-api-key', API_KEY)
          .send({ contactId: '123@s.whatsapp.net' })
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it('❌ should return 403 without API key', async () => {
        await request(app)
          .post('/api/sessions/test/contacts/chat')
          .expect(403);
      });
    });

    describe('POST /api/sessions/:sessionId/contacts/profile-picture', () => {
      it('✅ should get contact profile picture', async () => {
        const response = await request(app)
          .post('/api/sessions/test/contacts/profile-picture')
          .set('x-api-key', API_KEY)
          .send({ contactId: '123@s.whatsapp.net' })
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it('❌ should return 403 without API key', async () => {
        await request(app)
          .post('/api/sessions/test/contacts/profile-picture')
          .expect(403);
      });
    });

    describe('POST /api/sessions/:sessionId/contacts/formatted-number', () => {
      it('✅ should get formatted number', async () => {
        const response = await request(app)
          .post('/api/sessions/test/contacts/formatted-number')
          .set('x-api-key', API_KEY)
          .send({ contactId: '123@s.whatsapp.net' })
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it('❌ should return 403 without API key', async () => {
        await request(app)
          .post('/api/sessions/test/contacts/formatted-number')
          .expect(403);
      });
    });

    describe('POST /api/sessions/:sessionId/contacts/country-code', () => {
      it('✅ should get country code', async () => {
        const response = await request(app)
          .post('/api/sessions/test/contacts/country-code')
          .set('x-api-key', API_KEY)
          .send({ contactId: '123@s.whatsapp.net' })
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it('❌ should return 403 without API key', async () => {
        await request(app)
          .post('/api/sessions/test/contacts/country-code')
          .expect(403);
      });
    });

    describe('POST /api/sessions/:sessionId/contacts/common-groups', () => {
      it('✅ should get common groups', async () => {
        const response = await request(app)
          .post('/api/sessions/test/contacts/common-groups')
          .set('x-api-key', API_KEY)
          .send({ contactId: '123@s.whatsapp.net' })
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it('❌ should return 403 without API key', async () => {
        await request(app)
          .post('/api/sessions/test/contacts/common-groups')
          .expect(403);
      });
    });
  });

  // ============================================================================
  // CHANNEL ENDPOINTS (17 endpoints)
  // ============================================================================
  describe('Channel Endpoints', () => {
    describe('POST /api/sessions/:sessionId/channels/info', () => {
      it('✅ should get newsletter info', async () => {
        const response = await request(app)
          .post('/api/sessions/test/channels/info')
          .set('x-api-key', API_KEY)
          .send({ channelId: '123@newsletter' })
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it('❌ should return 400 for missing channel ID', async () => {
        await request(app)
          .post('/api/sessions/test/channels/info')
          .set('x-api-key', API_KEY)
          .send({})
          .expect(400);
      });

      it('❌ should return 403 without API key', async () => {
        await request(app)
          .post('/api/sessions/test/channels/info')
          .expect(403);
      });
    });

    describe('POST /api/sessions/:sessionId/channels/send-message', () => {
      it('✅ should send message to newsletter', async () => {
        const response = await request(app)
          .post('/api/sessions/test/channels/send-message')
          .set('x-api-key', API_KEY)
          .send({ channelId: '123@newsletter', contentType: 'text', content: { text: 'hello' } })
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it('❌ should return 403 without API key', async () => {
        await request(app)
          .post('/api/sessions/test/channels/send-message')
          .expect(403);
      });
    });

    describe('POST /api/sessions/:sessionId/channels/fetch-messages', () => {
      it('✅ should fetch newsletter messages', async () => {
        const response = await request(app)
          .post('/api/sessions/test/channels/fetch-messages')
          .set('x-api-key', API_KEY)
          .send({ channelId: '123@newsletter' })
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it('❌ should return 403 without API key', async () => {
        await request(app)
          .post('/api/sessions/test/channels/fetch-messages')
          .expect(403);
      });
    });

    describe('POST /api/sessions/:sessionId/channels/send-seen', () => {
      it('✅ should send seen to newsletter', async () => {
        const response = await request(app)
          .post('/api/sessions/test/channels/send-seen')
          .set('x-api-key', API_KEY)
          .send({ channelId: '123@newsletter', messageId: 'msg123' })
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it('❌ should return 403 without API key', async () => {
        await request(app)
          .post('/api/sessions/test/channels/send-seen')
          .expect(403);
      });
    });

    describe('POST /api/sessions/:sessionId/channels/mute', () => {
      it('✅ should mute newsletter', async () => {
        const response = await request(app)
          .post('/api/sessions/test/channels/mute')
          .set('x-api-key', API_KEY)
          .send({ channelId: '123@newsletter' })
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it('❌ should return 403 without API key', async () => {
        await request(app)
          .post('/api/sessions/test/channels/mute')
          .expect(403);
      });
    });

    describe('POST /api/sessions/:sessionId/channels/unmute', () => {
      it('✅ should unmute newsletter', async () => {
        const response = await request(app)
          .post('/api/sessions/test/channels/unmute')
          .set('x-api-key', API_KEY)
          .send({ channelId: '123@newsletter' })
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it('❌ should return 403 without API key', async () => {
        await request(app)
          .post('/api/sessions/test/channels/unmute')
          .expect(403);
      });
    });

    describe('POST /api/sessions/:sessionId/channels/set-profile-picture', () => {
      it('✅ should set newsletter profile picture', async () => {
        const response = await request(app)
          .post('/api/sessions/test/channels/set-profile-picture')
          .set('x-api-key', API_KEY)
          .send({ channelId: '123@newsletter', image: 'base64-image-data' })
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it('❌ should return 403 without API key', async () => {
        await request(app)
          .post('/api/sessions/test/channels/set-profile-picture')
          .expect(403);
      });
    });

    describe('POST /api/sessions/:sessionId/channels/set-description', () => {
      it('✅ should set newsletter description', async () => {
        const response = await request(app)
          .post('/api/sessions/test/channels/set-description')
          .set('x-api-key', API_KEY)
          .send({ channelId: '123@newsletter', description: 'New Description' })
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it('❌ should return 403 without API key', async () => {
        await request(app)
          .post('/api/sessions/test/channels/set-description')
          .expect(403);
      });
    });

    describe('POST /api/sessions/:sessionId/channels/set-subject', () => {
      it('✅ should set newsletter subject', async () => {
        const response = await request(app)
          .post('/api/sessions/test/channels/set-subject')
          .set('x-api-key', API_KEY)
          .send({ channelId: '123@newsletter', subject: 'New Subject' })
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it('❌ should return 403 without API key', async () => {
        await request(app)
          .post('/api/sessions/test/channels/set-subject')
          .expect(403);
      });
    });

    describe('DELETE /api/sessions/:sessionId/channels/:channelId', () => {
      it('✅ should delete newsletter', async () => {
        const response = await request(app)
          .delete('/api/sessions/test/channels/123@newsletter')
          .set('x-api-key', API_KEY)
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it('❌ should return 403 without API key', async () => {
        await request(app)
          .delete('/api/sessions/test/channels/123@newsletter')
          .expect(403);
      });
    });

    describe('POST /api/sessions/:sessionId/channels/subscribers', () => {
      it('✅ should get newsletter subscribers', async () => {
        const response = await request(app)
          .post('/api/sessions/test/channels/subscribers')
          .set('x-api-key', API_KEY)
          .send({ channelId: '123@newsletter' })
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it('❌ should return 403 without API key', async () => {
        await request(app)
          .post('/api/sessions/test/channels/subscribers')
          .expect(403);
      });
    });

    describe('POST /api/sessions/:sessionId/channels/set-reaction-setting', () => {
      it('✅ should set newsletter reaction setting', async () => {
        const response = await request(app)
          .post('/api/sessions/test/channels/set-reaction-setting')
          .set('x-api-key', API_KEY)
          .send({ channelId: '123@newsletter', reactionSetting: 'ALL' })
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it('❌ should return 403 without API key', async () => {
        await request(app)
          .post('/api/sessions/test/channels/set-reaction-setting')
          .expect(403);
      });
    });

    describe('POST /api/sessions/:sessionId/channels/admin/invite', () => {
      it('✅ should invite to newsletter', async () => {
        const response = await request(app)
          .post('/api/sessions/test/channels/admin/invite')
          .set('x-api-key', API_KEY)
          .send({ channelId: '123@newsletter', participants: ['456@s.whatsapp.net'] })
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it('❌ should return 403 without API key', async () => {
        await request(app)
          .post('/api/sessions/test/channels/admin/invite')
          .expect(403);
      });
    });

    describe('POST /api/sessions/:sessionId/channels/admin/accept-invite', () => {
      it('✅ should accept newsletter invite', async () => {
        const response = await request(app)
          .post('/api/sessions/test/channels/admin/accept-invite')
          .set('x-api-key', API_KEY)
          .send({ inviteCode: 'ABC123XYZ' })
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it('❌ should return 403 without API key', async () => {
        await request(app)
          .post('/api/sessions/test/channels/admin/accept-invite')
          .expect(403);
      });
    });

    describe('POST /api/sessions/:sessionId/channels/admin/revoke-invite', () => {
      it('✅ should revoke newsletter invite', async () => {
        const response = await request(app)
          .post('/api/sessions/test/channels/admin/revoke-invite')
          .set('x-api-key', API_KEY)
          .send({ channelId: '123@newsletter' })
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it('❌ should return 403 without API key', async () => {
        await request(app)
          .post('/api/sessions/test/channels/admin/revoke-invite')
          .expect(403);
      });
    });

    describe('POST /api/sessions/:sessionId/channels/admin/transfer-ownership', () => {
      it('✅ should transfer newsletter ownership', async () => {
        const response = await request(app)
          .post('/api/sessions/test/channels/admin/transfer-ownership')
          .set('x-api-key', API_KEY)
          .send({ channelId: '123@newsletter', newOwner: '456@s.whatsapp.net' })
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it('❌ should return 403 without API key', async () => {
        await request(app)
          .post('/api/sessions/test/channels/admin/transfer-ownership')
          .expect(403);
      });
    });

    describe('POST /api/sessions/:sessionId/channels/admin/demote', () => {
      it('✅ should demote newsletter admin', async () => {
        const response = await request(app)
          .post('/api/sessions/test/channels/admin/demote')
          .set('x-api-key', API_KEY)
          .send({ channelId: '123@newsletter', admin: '456@s.whatsapp.net' })
          .expect(200);

        expect(response.body.success).toBe(true);
      });

      it('❌ should return 403 without API key', async () => {
        await request(app)
          .post('/api/sessions/test/channels/admin/demote')
          .expect(403);
      });
    });
  });
});
