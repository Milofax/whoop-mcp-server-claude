import { describe, it, expect } from 'vitest';
import { buildPaginationUrl } from '../utils/pagination.js';

describe('buildPaginationUrl', () => {
  it('returns base path when no params', () => {
    expect(buildPaginationUrl('/cycle', {})).toBe('/cycle');
  });

  it('returns base path when params is undefined', () => {
    expect(buildPaginationUrl('/cycle')).toBe('/cycle');
  });

  it('appends limit', () => {
    expect(buildPaginationUrl('/cycle', { limit: 10 })).toBe('/cycle?limit=10');
  });

  it('appends all pagination params', () => {
    const url = buildPaginationUrl('/cycle', {
      limit: 10,
      start: '2024-01-01',
      end: '2024-02-01',
      nextToken: 'abc',
    });
    expect(url).toBe('/cycle?limit=10&start=2024-01-01&end=2024-02-01&nextToken=abc');
  });

  it('skips undefined params', () => {
    const url = buildPaginationUrl('/cycle', { limit: 5, start: undefined });
    expect(url).toBe('/cycle?limit=5');
  });
});
