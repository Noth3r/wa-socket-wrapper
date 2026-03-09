import { describe, it, expect } from 'vitest';
import { config } from '../src/config';

describe('Config Module', () => {
  it('loads config with expected defaults', () => {
    expect(config).toBeDefined();
    expect(config.PORT).toBe(3000);
    expect(config.ENABLE_WEBHOOK).toBe(true);
    expect(config.ENABLE_WEBSOCKET).toBe(false);
    expect(config.MAX_ATTACHMENT_SIZE).toBe(10485760);
    expect(config.SET_MESSAGES_AS_SEEN).toBe(false);
  });

  it('has correct rate limit defaults', () => {
    expect(config.RATE_LIMIT_MAX).toBe(1000);
    expect(config.RATE_LIMIT_WINDOW_MS).toBe(1000);
  });

  it('has correct session management defaults', () => {
    expect(config.RECOVER_SESSIONS).toBe(true);
    expect(config.SESSIONS_PATH).toBe('./sessions');
  });

  it('has correct logging and path defaults', () => {
    expect(config.LOG_LEVEL).toBe('info');
    expect(config.BASE_PATH).toBe('/');
    expect(config.CORS_ORIGINS).toBe('*');
  });

  it('has correct proxy and callback defaults', () => {
    expect(config.TRUST_PROXY).toBe(false);
    expect(config.DISABLED_CALLBACKS).toBeInstanceOf(Set);
    expect(config.DISABLED_CALLBACKS.size).toBe(0);
  });

  it('exports config as typed object', () => {
    expect(typeof config.PORT).toBe('number');
    expect(typeof config.ENABLE_WEBHOOK).toBe('boolean');
    expect(typeof config.ENABLE_WEBSOCKET).toBe('boolean');
    expect(typeof config.SESSIONS_PATH).toBe('string');
    expect(config.DISABLED_CALLBACKS instanceof Set).toBe(true);
  });

  it('all required fields are present', () => {
    const requiredFields = [
      'PORT',
      'ENABLE_WEBHOOK',
      'ENABLE_WEBSOCKET',
      'MAX_ATTACHMENT_SIZE',
      'SET_MESSAGES_AS_SEEN',
      'DISABLED_CALLBACKS',
      'RATE_LIMIT_MAX',
      'RATE_LIMIT_WINDOW_MS',
      'RECOVER_SESSIONS',
      'SESSIONS_PATH',
      'LOG_LEVEL',
      'BASE_PATH',
      'CORS_ORIGINS',
      'TRUST_PROXY',
    ];

    for (const field of requiredFields) {
      expect(field in config).toBe(true);
    }
  });
});
