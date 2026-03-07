import http from 'node:http';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { WhoopApiClient } from './whoop-api.js';
import { sanitizeHtml, maskToken, generateCsrfState } from './utils/sanitize.js';
import { FileTokenStorage } from './auth/file-token-storage.js';
import type { WhoopApiConfig, StoredTokenData } from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const PORT = 3000;

const config: WhoopApiConfig = {
  clientId: process.env.WHOOP_CLIENT_ID ?? '',
  clientSecret: process.env.WHOOP_CLIENT_SECRET ?? '',
  redirectUri: process.env.WHOOP_REDIRECT_URI ?? 'http://localhost:3000/callback',
};

if (!config.clientId || !config.clientSecret) {
  console.error('Missing WHOOP_CLIENT_ID or WHOOP_CLIENT_SECRET');
  process.exit(1);
}

class AuthServer {
  private whoopClient: WhoopApiClient;
  private tokenStorage: FileTokenStorage;
  private currentState: string | null = null;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private httpServer: http.Server | null = null;

  constructor(apiConfig: WhoopApiConfig, tokensPath: string) {
    this.whoopClient = new WhoopApiClient(apiConfig);
    this.tokenStorage = new FileTokenStorage(tokensPath);
  }

  start(): void {
    this.httpServer = http.createServer((req, res) => this.handleRequest(req, res));
    this.httpServer.listen(PORT, () => {
      console.error(`Auth server running on http://localhost:${PORT}`);
      console.error('Visit the URL above to start authentication');
    });

    process.on('SIGINT', () => this.shutdown());
  }

  private shutdown(): void {
    console.error('Shutting down authentication server...');
    this.httpServer?.close(() => process.exit(0));
  }

  private async handleRequest(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
    const reqUrl = new URL(req.url ?? '/', `http://localhost:${PORT}`);

    if (reqUrl.pathname === '/') {
      this.handleRoot(res);
    } else if (reqUrl.pathname === '/callback') {
      await this.handleCallback(reqUrl, res);
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
    }
  }

  private handleRoot(res: http.ServerResponse): void {
    this.currentState = generateCsrfState();
    const authUrl = this.whoopClient.getAuthorizationUrl(this.currentState);

    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`<!DOCTYPE html>
<html><head><title>WHOOP Authentication</title>
<style>body{font-family:Arial,sans-serif;max-width:600px;margin:50px auto;padding:20px}
.container{background:#f9f9f9;padding:30px;border-radius:10px}
.button{background:#007bff;color:white;padding:12px 24px;text-decoration:none;border-radius:5px;display:inline-block;margin:10px 0}
.status{padding:10px;border-radius:5px;margin:10px 0}
.info{background:#d1ecf1;color:#0c5460}</style></head>
<body><div class="container">
<h1>WHOOP Authentication</h1>
<p>Click the button below to authenticate with WHOOP.</p>
<a href="${sanitizeHtml(authUrl)}" class="button">Connect to WHOOP</a>
<div class="status info"><strong>Status:</strong> Ready to authenticate</div>
</div></body></html>`);

    this.openBrowser(authUrl);
  }

  private async handleCallback(reqUrl: URL, res: http.ServerResponse): Promise<void> {
    const code = reqUrl.searchParams.get('code');
    const error = reqUrl.searchParams.get('error');
    const returnedState = reqUrl.searchParams.get('state');

    if (returnedState !== this.currentState) {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(this.renderError('Security Error', 'State parameter mismatch. Please try again.'));
      console.error('State parameter mismatch - possible CSRF attack');
      return;
    }

    if (error) {
      const desc = sanitizeHtml(reqUrl.searchParams.get('error_description') ?? 'No description');
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(this.renderError('OAuth Error', `${sanitizeHtml(error)}: ${desc}`));
      console.error('OAuth error:', error);
      return;
    }

    if (!code) {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(this.renderError('Error', 'No authorization code received.'));
      return;
    }

    try {
      const tokenResponse = await this.whoopClient.exchangeCodeForToken(code);
      this.accessToken = tokenResponse.access_token;
      this.refreshToken = tokenResponse.refresh_token;

      console.error('Authentication successful!');
      console.error('Access Token:', maskToken(this.accessToken));
      console.error('Expires in:', tokenResponse.expires_in, 'seconds');

      this.whoopClient.setAccessToken(this.accessToken);
      const userProfile = await this.whoopClient.getUserProfile();

      const tokenData: StoredTokenData = {
        accessToken: this.accessToken,
        refreshToken: this.refreshToken,
        timestamp: new Date().toISOString(),
      };
      await this.tokenStorage.save(tokenData);
      console.error('Tokens saved');

      const userName = sanitizeHtml(`${userProfile.first_name} ${userProfile.last_name}`);
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(`<!DOCTYPE html>
<html><head><title>WHOOP Authentication Success</title>
<style>body{font-family:Arial,sans-serif;max-width:600px;margin:50px auto;padding:20px}
.container{background:#f9f9f9;padding:30px;border-radius:10px}
.success{background:#d4edda;color:#155724;padding:10px;border-radius:5px;margin:10px 0}
.token{background:#f8f9fa;padding:10px;border-radius:5px;font-family:monospace;font-size:12px}</style></head>
<body><div class="container">
<h1>Authentication Successful!</h1>
<div class="success"><strong>Welcome, ${userName}!</strong></div>
<h3>Access Token:</h3><div class="token">${sanitizeHtml(maskToken(this.accessToken))}</div>
<h3>Refresh Token:</h3><div class="token">${sanitizeHtml(maskToken(this.refreshToken))}</div>
<p><strong>You can now use the WHOOP MCP server with Claude!</strong></p>
<p>Tokens saved. You can close this window.</p>
</div></body></html>`);

      setTimeout(() => this.shutdown(), 5000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(this.renderError('Authentication Failed', sanitizeHtml(msg)));
      console.error('Authentication failed:', msg);
    }
  }

  private renderError(title: string, message: string): string {
    return `<!DOCTYPE html>
<html><head><title>WHOOP - ${sanitizeHtml(title)}</title>
<style>body{font-family:Arial,sans-serif;max-width:600px;margin:50px auto;padding:20px}
.container{background:#f9f9f9;padding:30px;border-radius:10px}
.error{background:#f8d7da;color:#721c24;padding:10px;border-radius:5px;margin:10px 0}</style></head>
<body><div class="container">
<h1>${sanitizeHtml(title)}</h1>
<div class="error">${message}</div>
<p>Please try again.</p>
</div></body></html>`;
  }

  private openBrowser(url: string): void {
    const cmd = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open';
    const child = spawn(cmd, [url], { stdio: 'ignore' });
    child.on('error', () => {
      console.error(`Could not open browser. Visit: ${url}`);
    });
  }
}

const tokensPath = path.join(__dirname, '..', 'whoop-tokens.json');
const authServer = new AuthServer(config, tokensPath);
authServer.start();
