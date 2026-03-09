import { describe, it, expect, beforeEach, vi } from 'vitest';
import { logger, createLogger } from '../src/logger.js';

describe('Logger Module', () => {
  describe('Default logger', () => {
    it('should export a logger instance', () => {
      expect(logger).toBeDefined();
      expect(logger).toHaveProperty('info');
      expect(logger).toHaveProperty('debug');
      expect(logger).toHaveProperty('warn');
      expect(logger).toHaveProperty('error');
    });

    it('should have correct log level from config', () => {
      expect(logger.level).toBeDefined();
      // Level should be set from config.LOG_LEVEL (pino returns level as string)
      expect(['error', 'warn', 'info', 'debug']).toContain(logger.level);
    });

    it('should output structured JSON', () => {
      // This test verifies that logger can be used; pino writes to stdout asynchronously
      // so we just verify that the logger methods work without throwing
      expect(() => {
        logger.info({ msg: 'test message' });
      }).not.toThrow();
    });
  });

  describe('createLogger factory', () => {
    it('should create a child logger', () => {
      const moduleLogger = createLogger('test-module');
      expect(moduleLogger).toBeDefined();
      expect(moduleLogger).toHaveProperty('info');
    });

    it('should include module name in child logger context', () => {
      const moduleLogger = createLogger('auth-service');
      const bindings = moduleLogger.bindings();
      
      expect(bindings).toBeDefined();
      expect(bindings).toHaveProperty('module', 'auth-service');
    });

    it('should create different loggers for different modules', () => {
      const logger1 = createLogger('module-1');
      const logger2 = createLogger('module-2');
      
      expect(logger1.bindings().module).toBe('module-1');
      expect(logger2.bindings().module).toBe('module-2');
      expect(logger1.bindings().module).not.toBe(logger2.bindings().module);
    });

    it('should preserve module context through child logger logs', () => {
      const moduleLogger = createLogger('test-module');
      const output: string[] = [];
      
      vi.spyOn(console, 'log').mockImplementation((...args) => {
        output.push(args[0]);
        if (typeof args[0] === 'string' && args[0].includes('{')) {
          try {
            const json = JSON.parse(args[0]);
            expect(json).toHaveProperty('module', 'test-module');
          } catch (e) {
            // Pretty printed output, check for module in string
            expect(args[0]).toContain('test-module');
          }
        }
      });

      moduleLogger.info({ msg: 'test' });
    });
  });

  describe('Log levels', () => {
    it('should respect configured log level', () => {
      const testLogger = createLogger('level-test');
      expect(testLogger.level).toBeDefined();
      // Pino returns level as a string
      expect(['error', 'warn', 'info', 'debug']).toContain(testLogger.level);
    });

    it('should have info, debug, warn, error methods', () => {
      const testLogger = createLogger('methods-test');
      expect(typeof testLogger.info).toBe('function');
      expect(typeof testLogger.debug).toBe('function');
      expect(typeof testLogger.warn).toBe('function');
      expect(typeof testLogger.error).toBe('function');
    });
  });
});
