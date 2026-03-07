import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import { WhoopApiClient } from '../whoop-api.js';

vi.mock('axios', () => {
  const mockAxiosInstance = {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  };

  return {
    default: {
      create: vi.fn(() => ({ ...mockAxiosInstance })),
      post: vi.fn(),
    },
  };
});

describe('WhoopApiClient', () => {
  const config = {
    clientId: 'test-client-id',
    clientSecret: 'test-client-secret',
    redirectUri: 'http://localhost:3000/callback',
  };
  let client: WhoopApiClient;

  beforeEach(() => {
    vi.clearAllMocks();
    client = new WhoopApiClient(config);
  });

  it('creates two axios instances (API and OAuth)', () => {
    expect(axios.create).toHaveBeenCalledTimes(2);
    expect(axios.create).toHaveBeenCalledWith(
      expect.objectContaining({ baseURL: 'https://api.prod.whoop.com/developer/v2' }),
    );
    expect(axios.create).toHaveBeenCalledWith(
      expect.objectContaining({ baseURL: 'https://api.prod.whoop.com/oauth/oauth2' }),
    );
  });

  it('hasToken() returns false when no token set', () => {
    expect(client.hasToken()).toBe(false);
  });

  it('hasToken() returns true after setAccessToken', () => {
    client.setAccessToken('test-token');
    expect(client.hasToken()).toBe(true);
  });

  it('getAuthorizationUrl() returns correct URL', () => {
    const url = client.getAuthorizationUrl();
    expect(url).toContain('https://api.prod.whoop.com/oauth/oauth2/auth');
    expect(url).toContain('client_id=test-client-id');
    expect(url).toContain('redirect_uri=');
    expect(url).toContain('response_type=code');
    expect(url).toContain('scope=');
  });

  it('getAuthorizationUrl() includes state when provided', () => {
    const url = client.getAuthorizationUrl('my-state-123');
    expect(url).toContain('state=my-state-123');
  });

  it('getUserProfile() calls correct endpoint', async () => {
    const mockProfile = { user_id: 1, email: 'test@test.com', first_name: 'A', last_name: 'B' };
    // Access the internal client created by axios.create
    const apiInstance = (axios.create as ReturnType<typeof vi.fn>).mock.results[0].value;
    apiInstance.get.mockResolvedValue({ data: mockProfile });

    const result = await client.getUserProfile();
    expect(apiInstance.get).toHaveBeenCalledWith('/user/profile/basic');
    expect(result).toEqual(mockProfile);
  });

  it('getCycleCollection() uses buildPaginationUrl', async () => {
    const apiInstance = (axios.create as ReturnType<typeof vi.fn>).mock.results[0].value;
    apiInstance.get.mockResolvedValue({ data: { records: [], next_token: null } });

    await client.getCycleCollection({ limit: 10 });
    expect(apiInstance.get).toHaveBeenCalledWith('/cycle?limit=10');
  });

  it('exchangeCodeForToken() posts via oauthClient', async () => {
    const oauthInstance = (axios.create as ReturnType<typeof vi.fn>).mock.results[1].value;
    const mockTokenResp = { access_token: 'at', refresh_token: 'rt', expires_in: 3600, token_type: 'bearer', scope: '' };
    oauthInstance.post.mockResolvedValue({ data: mockTokenResp });

    const result = await client.exchangeCodeForToken('test-code');
    expect(oauthInstance.post).toHaveBeenCalledWith('/token', expect.any(URLSearchParams));
    expect(result).toEqual(mockTokenResp);
  });

  it('refreshToken() posts via oauthClient', async () => {
    const oauthInstance = (axios.create as ReturnType<typeof vi.fn>).mock.results[1].value;
    const mockTokenResp = { access_token: 'at2', refresh_token: 'rt2', expires_in: 7200, token_type: 'bearer', scope: '' };
    oauthInstance.post.mockResolvedValue({ data: mockTokenResp });

    const result = await client.refreshToken('old-refresh-token');
    expect(oauthInstance.post).toHaveBeenCalledWith('/token', expect.any(URLSearchParams));
    expect(result).toEqual(mockTokenResp);
  });
});
