import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import { WebhookDispatcher } from '../../src/services/webhook.js';
import { config } from '../../src/config.js';
import type { WebhookEvent } from '../../src/types/webhook.js';
import type { SessionConfig } from '../../src/types/session.js';

vi.mock('axios');
vi.mock('../../src/config.js', () => ({
  config: {
    ENABLE_WEBHOOK: true,
    DISABLED_CALLBACKS: new Set<string>(),
    BASE_WEBHOOK_URL: 'https://example.com/webhook',
    API_KEY: 'test-api-key',
  },
}));

describe('WebhookDispatcher', () => {
  let dispatcher: WebhookDispatcher;
  const mockAxiosPost = vi.mocked(axios.post);

  beforeEach(() => {
    vi.clearAllMocks();
    dispatcher = new WebhookDispatcher();
    mockAxiosPost.mockResolvedValue({ status: 200, data: {} });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('dispatches webhook with correct payload format', async () => {
    const sessionId = 'test-session';
    const event: WebhookEvent = 'messages.upsert';
    const data = { messages: [{ key: { id: '123' } }] };

    await dispatcher.dispatch(sessionId, event, data);

    // Wait for async operations
    await new Promise(resolve => setTimeout(resolve, 50));

    expect(mockAxiosPost).toHaveBeenCalledTimes(1);
    expect(mockAxiosPost).toHaveBeenCalledWith(
      'https://example.com/webhook',
      expect.objectContaining({
        sessionId,
        event,
        data,
        timestamp: expect.any(String),
      }),
      expect.objectContaining({
        timeout: 5000,
        headers: expect.objectContaining({
          'x-api-key': 'test-api-key',
        }),
      })
    );
  });

  it('includes x-api-key header when configured', async () => {
    await dispatcher.dispatch('test-session', 'qr', { qr: 'test' });

    await new Promise(resolve => setTimeout(resolve, 50));

    expect(mockAxiosPost).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(Object),
      expect.objectContaining({
        headers: expect.objectContaining({
          'x-api-key': 'test-api-key',
        }),
      })
    );
  });

  it('skips dispatch when webhook disabled', async () => {
    const originalEnable = config.ENABLE_WEBHOOK;
    (config as any).ENABLE_WEBHOOK = false;

    await dispatcher.dispatch('test-session', 'qr', { qr: 'test' });

    await new Promise(resolve => setTimeout(resolve, 50));

    expect(mockAxiosPost).not.toHaveBeenCalled();

    (config as any).ENABLE_WEBHOOK = originalEnable;
  });

  it('skips dispatch for disabled callbacks', async () => {
    const originalDisabled = config.DISABLED_CALLBACKS;
    (config as any).DISABLED_CALLBACKS = new Set(['messages.upsert']);

    await dispatcher.dispatch('test-session', 'messages.upsert', { messages: [] });

    await new Promise(resolve => setTimeout(resolve, 50));

    expect(mockAxiosPost).not.toHaveBeenCalled();

    (config as any).DISABLED_CALLBACKS = originalDisabled;
  });

  it('uses per-session URL over base URL', async () => {
    const sessionConfig: SessionConfig = {
      webhookUrl: 'https://custom.example.com/webhook',
    };

    await dispatcher.dispatch('test-session', 'qr', { qr: 'test' }, sessionConfig);

    await new Promise(resolve => setTimeout(resolve, 50));

    expect(mockAxiosPost).toHaveBeenCalledWith(
      'https://custom.example.com/webhook',
      expect.any(Object),
      expect.any(Object)
    );
  });

  it('falls back to base URL when no session URL provided', async () => {
    await dispatcher.dispatch('test-session', 'qr', { qr: 'test' });

    await new Promise(resolve => setTimeout(resolve, 50));

    expect(mockAxiosPost).toHaveBeenCalledWith(
      'https://example.com/webhook',
      expect.any(Object),
      expect.any(Object)
    );
  });

  it('retries once on failure', async () => {
    mockAxiosPost
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({ status: 200, data: {} });

    await dispatcher.dispatch('test-session', 'qr', { qr: 'test' });

    await new Promise(resolve => setTimeout(resolve, 100));

    expect(mockAxiosPost).toHaveBeenCalledTimes(2);
  });

  it('logs delivery failure after retry', async () => {
    mockAxiosPost.mockRejectedValue(new Error('Network error'));

    await dispatcher.dispatch('test-session', 'qr', { qr: 'test' });

    await new Promise(resolve => setTimeout(resolve, 100));

    // Should attempt twice (initial + retry)
    expect(mockAxiosPost).toHaveBeenCalledTimes(2);
  });

  it('does not include x-api-key header when not configured', async () => {
    const originalKey = config.API_KEY;
    (config as any).API_KEY = undefined;

    await dispatcher.dispatch('test-session', 'qr', { qr: 'test' });

    await new Promise(resolve => setTimeout(resolve, 50));

    expect(mockAxiosPost).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(Object),
      expect.not.objectContaining({
        headers: expect.objectContaining({
          'x-api-key': expect.any(String),
        }),
      })
    );

    (config as any).API_KEY = originalKey;
  });

  it('includes timestamp in ISO format', async () => {
    const beforeDispatch = new Date().toISOString();
    
    await dispatcher.dispatch('test-session', 'qr', { qr: 'test' });

    await new Promise(resolve => setTimeout(resolve, 50));

    const callArgs = mockAxiosPost.mock.calls[0];
    const payload = callArgs[1] as any;
    
    expect(payload.timestamp).toBeDefined();
    expect(typeof payload.timestamp).toBe('string');
    expect(new Date(payload.timestamp).toISOString()).toBe(payload.timestamp);
  });

  it('skips dispatch when event not in session webhookEvents filter', async () => {
    const sessionConfig: SessionConfig = {
      webhookUrl: 'https://custom.example.com/webhook',
      webhookEvents: ['messages.upsert'],
    };

    await dispatcher.dispatch('test-session', 'chats.update', { chats: [] }, sessionConfig);

    await new Promise(resolve => setTimeout(resolve, 50));

    expect(mockAxiosPost).not.toHaveBeenCalled();
  });

  it('dispatches when event is in session webhookEvents filter', async () => {
    const sessionConfig: SessionConfig = {
      webhookUrl: 'https://custom.example.com/webhook',
      webhookEvents: ['messages.upsert', 'qr'],
    };

    await dispatcher.dispatch('test-session', 'messages.upsert', { messages: [] }, sessionConfig);

    await new Promise(resolve => setTimeout(resolve, 50));

    expect(mockAxiosPost).toHaveBeenCalledTimes(1);
  });

  it('dispatches all events when webhookEvents is not configured', async () => {
    const sessionConfig: SessionConfig = {
      webhookUrl: 'https://custom.example.com/webhook',
    };

    await dispatcher.dispatch('test-session', 'chats.update', { chats: [] }, sessionConfig);

    await new Promise(resolve => setTimeout(resolve, 50));

    expect(mockAxiosPost).toHaveBeenCalledTimes(1);
  }); 
});
