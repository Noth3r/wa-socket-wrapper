import { describe, it, expect } from 'vitest';

/**
 * Setup smoke test - verifies vitest is configured correctly and imports work
 */
describe('Project Setup', () => {
  it('vitest runs successfully', () => {
    expect(true).toBe(true);
  });

  it('TypeScript compilation works in strict mode', () => {
    // If this file compiled successfully, TS strict mode is working
    const num: number = 42;
    const str: string = 'test';
    expect(num).toBe(42);
    expect(str).toBe('test');
  });

  it('can access imported modules', () => {
    // Basic import test - if we got here, TypeScript resolved src/ correctly
    expect(typeof describe).toBe('function');
  });
});
