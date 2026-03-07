import { describe, it, expect } from 'vitest';
import {
  WHOOP_TOOL_NAMES,
  AUTH_BYPASS_TOOLS,
  type OAuthTokenResponse,
  type StoredTokenData,
  type ITokenStorage,
  type WhoopToolName,
} from '../types.js';

describe('types', () => {
  it('OAuthTokenResponse shape has required fields', () => {
    const token: OAuthTokenResponse = {
      access_token: 'abc',
      refresh_token: 'def',
      expires_in: 3600,
      token_type: 'bearer',
      scope: 'read:profile',
    };
    expect(token.access_token).toBe('abc');
    expect(token.refresh_token).toBe('def');
    expect(token.expires_in).toBe(3600);
    expect(token.token_type).toBe('bearer');
    expect(token.scope).toBe('read:profile');
  });

  it('ITokenStorage can be implemented', async () => {
    let stored: StoredTokenData | null = null;

    const mockStorage: ITokenStorage = {
      async load() { return stored; },
      async save(data) { stored = data; },
    };

    expect(await mockStorage.load()).toBeNull();

    const data: StoredTokenData = { accessToken: 'a', refreshToken: 'b', timestamp: '2024-01-01' };
    await mockStorage.save(data);
    expect(await mockStorage.load()).toEqual(data);
  });

  it('WHOOP_TOOL_NAMES contains all 16 tool names', () => {
    expect(WHOOP_TOOL_NAMES).toHaveLength(16);
  });

  it('WhoopToolName union covers all names', () => {
    const names: WhoopToolName[] = [...WHOOP_TOOL_NAMES];
    expect(names).toHaveLength(16);
    expect(names).toContain('whoop-get-user-profile');
    expect(names).toContain('whoop-set-access-token');
  });

  it('AUTH_BYPASS_TOOLS contains auth tools', () => {
    expect(AUTH_BYPASS_TOOLS.has('whoop-set-access-token')).toBe(true);
    expect(AUTH_BYPASS_TOOLS.has('whoop-get-authorization-url')).toBe(true);
    expect(AUTH_BYPASS_TOOLS.has('whoop-exchange-code-for-token')).toBe(true);
    expect(AUTH_BYPASS_TOOLS.has('whoop-refresh-token')).toBe(true);
    expect(AUTH_BYPASS_TOOLS.has('whoop-get-user-profile')).toBe(false);
  });
});
