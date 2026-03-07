import { describe, it, expect } from 'vitest';
import { sanitizeHtml, maskToken, generateCsrfState } from '../utils/sanitize.js';

describe('sanitizeHtml', () => {
  it('escapes <script> tags', () => {
    expect(sanitizeHtml('<script>alert(1)</script>')).toBe('&lt;script&gt;alert(1)&lt;/script&gt;');
  });

  it('escapes quotes and ampersand', () => {
    expect(sanitizeHtml('"hello" & \'world\'')).toBe('&quot;hello&quot; &amp; &#x27;world&#x27;');
  });

  it('escapes < and >', () => {
    expect(sanitizeHtml('a < b > c')).toBe('a &lt; b &gt; c');
  });

  it('returns empty string for null', () => {
    expect(sanitizeHtml(null)).toBe('');
  });

  it('returns empty string for undefined', () => {
    expect(sanitizeHtml(undefined)).toBe('');
  });

  it('passes through safe strings unchanged', () => {
    expect(sanitizeHtml('hello world')).toBe('hello world');
  });
});

describe('generateCsrfState', () => {
  it('returns 64-char hex string', () => {
    const state = generateCsrfState();
    expect(state).toHaveLength(64);
    expect(state).toMatch(/^[0-9a-f]{64}$/);
  });

  it('produces unique values', () => {
    const states = new Set(Array.from({ length: 100 }, () => generateCsrfState()));
    expect(states.size).toBe(100);
  });
});

describe('maskToken', () => {
  it('masks long tokens showing first/last 4 chars', () => {
    expect(maskToken('abcd1234efgh5678')).toBe('abcd...5678');
  });

  it('returns **** for short tokens', () => {
    expect(maskToken('short')).toBe('****');
  });

  it('returns **** for null', () => {
    expect(maskToken(null)).toBe('****');
  });

  it('returns **** for undefined', () => {
    expect(maskToken(undefined)).toBe('****');
  });

  it('masks exactly 8 char token', () => {
    expect(maskToken('12345678')).toBe('1234...5678');
  });
});
