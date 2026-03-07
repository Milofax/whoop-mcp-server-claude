import { describe, it, expect, vi, beforeEach } from 'vitest';
import { dispatchTool } from '../tool-registry.js';
import { WhoopApiClient } from '../whoop-api.js';
import { WHOOP_TOOL_NAMES } from '../types.js';

describe('tool-registry', () => {
  let client: WhoopApiClient;

  beforeEach(() => {
    client = new WhoopApiClient({
      clientId: 'test-id',
      clientSecret: 'test-secret',
      redirectUri: 'http://localhost:3000/callback',
    });
  });

  it('throws for unknown tool name', () => {
    expect(() => dispatchTool('nonexistent-tool', client, {})).toThrow('Unknown tool: nonexistent-tool');
  });

  it('all 16 tool names have registered handlers', async () => {
    // Tools with no required args should resolve without "Unknown tool"
    const noArgTools = [
      'whoop-get-user-profile',
      'whoop-get-user-body-measurements',
      'whoop-revoke-user-access',
      'whoop-get-authorization-url',
    ];
    for (const name of noArgTools) {
      // Mock all API methods to avoid real HTTP calls
      vi.spyOn(client, 'getUserProfile').mockResolvedValue({ user_id: 1, email: '', first_name: '', last_name: '' });
      vi.spyOn(client, 'getUserBodyMeasurements').mockResolvedValue({ height_meter: 1, weight_kilogram: 1, max_heart_rate: 1 });
      vi.spyOn(client, 'revokeUserAccess').mockResolvedValue();
      vi.spyOn(client, 'getAuthorizationUrl').mockReturnValue('url');
      await expect(dispatchTool(name, client, {})).resolves.toBeDefined();
    }

    // Tools with required args: verify they don't throw "Unknown tool" but throw ValidationError
    const argTools = WHOOP_TOOL_NAMES.filter((n) => !noArgTools.includes(n));
    for (const name of argTools) {
      try {
        await dispatchTool(name, client, {});
      } catch (e: unknown) {
        // Should be a validation error, NOT "Unknown tool"
        expect((e as Error).message).not.toContain('Unknown tool');
      }
    }
  });

  it('whoop-get-authorization-url calls getAuthorizationUrl', async () => {
    vi.spyOn(client, 'getAuthorizationUrl').mockReturnValue('https://mock-auth-url');
    const result = await dispatchTool('whoop-get-authorization-url', client, {});
    expect(result).toBe('https://mock-auth-url');
    expect(client.getAuthorizationUrl).toHaveBeenCalled();
  });

  it('whoop-set-access-token calls setAccessToken', async () => {
    vi.spyOn(client, 'setAccessToken');
    const result = await dispatchTool('whoop-set-access-token', client, { accessToken: 'my-token' });
    expect(result).toBe('Access token set successfully');
    expect(client.setAccessToken).toHaveBeenCalledWith('my-token');
  });

  it('whoop-get-user-profile calls getUserProfile', async () => {
    const mockProfile = { user_id: 1, email: 'test@test.com', first_name: 'John', last_name: 'Doe' };
    vi.spyOn(client, 'getUserProfile').mockResolvedValue(mockProfile);
    const result = await dispatchTool('whoop-get-user-profile', client, {});
    expect(result).toEqual(mockProfile);
  });

  it('whoop-get-cycle-collection passes pagination params', async () => {
    const mockCollection = { records: [], next_token: undefined };
    vi.spyOn(client, 'getCycleCollection').mockResolvedValue(mockCollection);
    await dispatchTool('whoop-get-cycle-collection', client, { limit: 10, start: '2024-01-01' });
    expect(client.getCycleCollection).toHaveBeenCalledWith({ limit: 10, start: '2024-01-01' });
  });

  it('whoop-get-cycle-by-id calls getCycleById', async () => {
    const mockCycle = { id: 42 } as ReturnType<typeof client.getCycleById> extends Promise<infer T> ? T : never;
    vi.spyOn(client, 'getCycleById').mockResolvedValue(mockCycle);
    await dispatchTool('whoop-get-cycle-by-id', client, { cycleId: 42 });
    expect(client.getCycleById).toHaveBeenCalledWith(42);
  });

  it('whoop-exchange-code-for-token calls exchangeCodeForToken', async () => {
    const mockResponse = { access_token: 'at', refresh_token: 'rt', expires_in: 3600, token_type: 'bearer', scope: '' };
    vi.spyOn(client, 'exchangeCodeForToken').mockResolvedValue(mockResponse);
    await dispatchTool('whoop-exchange-code-for-token', client, { code: 'auth-code' });
    expect(client.exchangeCodeForToken).toHaveBeenCalledWith('auth-code');
  });
});
