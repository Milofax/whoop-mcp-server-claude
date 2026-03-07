import { describe, it, expect } from 'vitest';
import { validateToolArgs, ValidationError } from '../validation.js';

describe('validateToolArgs', () => {
  it('validates cycleId for whoop-get-cycle-by-id', () => {
    const result = validateToolArgs('whoop-get-cycle-by-id', { cycleId: 123 });
    expect(result).toEqual({ type: 'cycleId', cycleId: 123 });
  });

  it('throws when cycleId is missing', () => {
    expect(() => validateToolArgs('whoop-get-cycle-by-id', {}))
      .toThrow('cycleId is required');
  });

  it('throws when cycleId is wrong type', () => {
    expect(() => validateToolArgs('whoop-get-cycle-by-id', { cycleId: 'abc' }))
      .toThrow('cycleId is required and must be a number');
  });

  it('throws when limit exceeds 25', () => {
    expect(() => validateToolArgs('whoop-get-cycle-collection', { limit: 30 }))
      .toThrow('limit must be at most 25');
  });

  it('accepts valid pagination params', () => {
    const result = validateToolArgs('whoop-get-cycle-collection', {
      limit: 10,
      start: '2024-01-01',
      end: '2024-02-01',
      nextToken: 'abc',
    });
    expect(result).toEqual({
      type: 'pagination',
      params: { limit: 10, start: '2024-01-01', end: '2024-02-01', nextToken: 'abc' },
    });
  });

  it('accepts empty pagination params', () => {
    const result = validateToolArgs('whoop-get-cycle-collection', {});
    expect(result).toEqual({ type: 'pagination', params: {} });
  });

  it('validates string code for exchange', () => {
    const result = validateToolArgs('whoop-exchange-code-for-token', { code: 'mycode' });
    expect(result).toEqual({ type: 'code', code: 'mycode' });
  });

  it('validates accessToken for set-access-token', () => {
    const result = validateToolArgs('whoop-set-access-token', { accessToken: 'tok123' });
    expect(result).toEqual({ type: 'accessToken', accessToken: 'tok123' });
  });

  it('returns none for tools without args', () => {
    expect(validateToolArgs('whoop-get-user-profile', {})).toEqual({ type: 'none' });
    expect(validateToolArgs('whoop-get-authorization-url', {})).toEqual({ type: 'none' });
  });

  it('throws ValidationError type', () => {
    try {
      validateToolArgs('whoop-get-cycle-by-id', {});
    } catch (e) {
      expect(e).toBeInstanceOf(ValidationError);
    }
  });
});
