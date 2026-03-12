import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { WhoopMcpServer } from './mcp-server.js';
import { WhoopApiClient } from './whoop-api.js';
import { FileTokenStorage } from './auth/file-token-storage.js';
import type { WhoopApiConfig, StoredTokenData } from './types.js';
import { maskToken } from './utils/sanitize.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const config: WhoopApiConfig = {
  clientId: process.env.WHOOP_CLIENT_ID ?? '',
  clientSecret: process.env.WHOOP_CLIENT_SECRET ?? '',
  redirectUri: process.env.WHOOP_REDIRECT_URI ?? 'http://localhost:3000/callback',
};

if (!config.clientId || !config.clientSecret) {
  console.error('Missing required environment variables: WHOOP_CLIENT_ID, WHOOP_CLIENT_SECRET');
  process.exit(1);
}

const TOKENS_FILE = path.join(__dirname, '..', 'whoop-tokens.json');

async function testTokens(accessToken: string, tokenStorage: FileTokenStorage): Promise<boolean> {
  try {
    const client = new WhoopApiClient({ ...config, accessToken }, tokenStorage);
    const profile = await client.getUserProfile();
    console.error('Access token valid. User:', profile.first_name, profile.last_name);
    // Sync back any tokens updated by auto-refresh interceptor
    if (client.getAccessToken() !== accessToken) {
      config.accessToken = client.getAccessToken();
      config.refreshToken = client.getRefreshToken();
      console.error('Tokens were auto-refreshed during validation');
    }
    return true;
  } catch {
    console.error('Access token invalid or expired');
    return false;
  }
}

async function refreshAccessToken(refreshToken: string): Promise<StoredTokenData | null> {
  try {
    console.error('Attempting token refresh...');
    const client = new WhoopApiClient(config);
    const result = await client.refreshToken(refreshToken);
    console.error('Token refresh successful. Expires in:', result.expires_in, 'seconds');

    const tokenStorage = new FileTokenStorage(TOKENS_FILE);
    const data: StoredTokenData = {
      accessToken: result.access_token,
      refreshToken: result.refresh_token,
      timestamp: new Date().toISOString(),
    };
    await tokenStorage.save(data);
    console.error('Updated tokens saved. Access token:', maskToken(result.access_token));
    return data;
  } catch {
    console.error('Token refresh failed');
    return null;
  }
}

async function startMcpServer(): Promise<void> {
  console.error('Starting WHOOP MCP Server...');

  const tokenStorage = new FileTokenStorage(TOKENS_FILE);
  let tokenData = await tokenStorage.load();
  let isValid = false;

  if (tokenData) {
    console.error('Loaded saved tokens from', TOKENS_FILE);
    config.refreshToken = tokenData.refreshToken;
    isValid = await testTokens(tokenData.accessToken, tokenStorage);

    if (!isValid && tokenData.refreshToken) {
      const refreshed = await refreshAccessToken(tokenData.refreshToken);
      if (refreshed) {
        config.accessToken = refreshed.accessToken;
        config.refreshToken = refreshed.refreshToken;
        isValid = true;
      }
    }
  } else {
    console.error('No saved tokens found. Run auth first: npm run auth');
  }

  const server = new WhoopMcpServer(config, tokenStorage);

  if (isValid) {
    console.error('Starting MCP server with valid tokens');
  } else {
    console.error('Starting MCP server WITHOUT valid tokens. Auth tools available, data tools will return auth errors.');
  }

  await server.run();
}

process.on('SIGINT', () => {
  console.error('Shutting down WHOOP MCP Server...');
  process.exit(0);
});

startMcpServer().catch((error) => {
  console.error('Failed to start server:', error instanceof Error ? error.message : error);
  process.exit(1);
});
