import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WhoopApiClient } from '../whoop-api.js';
import { AUTH_BYPASS_TOOLS, WHOOP_TOOL_NAMES } from '../types.js';

describe('auth guard logic', () => {
  const config = { clientId: 'id', clientSecret: 'secret', redirectUri: 'http://localhost:3000/callback' };

  it('hasToken() returns false when no token set', () => {
    const client = new WhoopApiClient(config);
    expect(client.hasToken()).toBe(false);
  });

  it('hasToken() returns true after setAccessToken', () => {
    const client = new WhoopApiClient(config);
    client.setAccessToken('some-token');
    expect(client.hasToken()).toBe(true);
  });

  it('auth bypass tools are a subset of all tool names', () => {
    for (const tool of AUTH_BYPASS_TOOLS) {
      expect(WHOOP_TOOL_NAMES).toContain(tool);
    }
  });

  it('data tools are not in bypass set', () => {
    expect(AUTH_BYPASS_TOOLS.has('whoop-get-user-profile')).toBe(false);
    expect(AUTH_BYPASS_TOOLS.has('whoop-get-cycle-collection')).toBe(false);
    expect(AUTH_BYPASS_TOOLS.has('whoop-get-sleep-by-id')).toBe(false);
  });
});
