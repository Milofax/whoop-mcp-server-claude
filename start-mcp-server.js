#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { WhoopMcpServer } from './dist/mcp-server.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TOKENS_FILE = path.join(__dirname, 'whoop-tokens.json');

const WHOOP_CONFIG = {
  clientId: '062d270e-37a8-43d3-865c-f9560c5a3e13',
  clientSecret: '4bbbb2fb1ce77f9f250455ff2c1fbfc862c0de100a93de22999b887aeae28bf6',
  redirectUri: 'http://localhost:3000/callback'
};

// Function to load saved tokens
function loadTokens() {
  try {
    if (fs.existsSync(TOKENS_FILE)) {
      const tokenData = JSON.parse(fs.readFileSync(TOKENS_FILE, 'utf8'));
      console.error('✅ Loaded saved tokens from whoop-tokens.json');
      console.error('📅 Tokens saved on:', tokenData.timestamp);
      return tokenData;
    } else {
      console.error('❌ No saved tokens found. Please run the authentication first:');
      console.error('   cd ' + __dirname + ' && node src/auth-app.js');
      return null;
    }
  } catch (error) {
    console.error('❌ Error loading tokens:', error.message);
    return null;
  }
}

// Function to save tokens
function saveTokens(accessToken, refreshToken) {
  const tokenData = {
    accessToken,
    refreshToken,
    timestamp: new Date().toISOString()
  };
  fs.writeFileSync(TOKENS_FILE, JSON.stringify(tokenData, null, 2));
  console.error('💾 Updated tokens saved to whoop-tokens.json');
}

// Function to refresh tokens using refresh token
async function refreshAccessToken(refreshToken) {
  try {
    console.error('🔄 Attempting to refresh access token...');
    const { WhoopApiClient } = await import('./dist/whoop-api.js');
    const client = new WhoopApiClient(WHOOP_CONFIG);

    const result = await client.refreshToken(refreshToken);
    console.error('✅ Token refresh successful!');
    console.error('⏰ New token expires in:', result.expires_in, 'seconds');

    // Save the new tokens
    saveTokens(result.access_token, result.refresh_token);

    return {
      accessToken: result.access_token,
      refreshToken: result.refresh_token
    };
  } catch (error) {
    console.error('❌ Token refresh failed:', error.message);
    return null;
  }
}

// Function to test if tokens are still valid
async function testTokens(accessToken) {
  try {
    const { WhoopApiClient } = await import('./dist/whoop-api.js');
    const client = new WhoopApiClient(WHOOP_CONFIG);
    client.setAccessToken(accessToken);

    const userProfile = await client.getUserProfile();
    console.error('✅ Access token is valid!');
    console.error('👤 User:', userProfile.first_name, userProfile.last_name);
    console.error('📧 Email:', userProfile.email);
    return true;
  } catch (error) {
    console.error('❌ Access token is invalid or expired:', error.message);
    return false;
  }
}

// Main function
async function startMcpServer() {
  console.error('🚀 Starting WHOOP MCP Server...');
  console.error('');

  // Load saved tokens
  let tokenData = loadTokens();
  if (!tokenData) {
    process.exit(1);
  }

  // Test if tokens are still valid
  let isValid = await testTokens(tokenData.accessToken);

  // If not valid, try to refresh
  if (!isValid && tokenData.refreshToken) {
    console.error('');
    const newTokens = await refreshAccessToken(tokenData.refreshToken);
    if (newTokens) {
      tokenData.accessToken = newTokens.accessToken;
      tokenData.refreshToken = newTokens.refreshToken;
      isValid = true;
    }
  }

  if (!isValid) {
    console.error('');
    console.error('🔄 Both access token and refresh token are invalid.');
    console.error('   Please re-authenticate by running:');
    console.error('   cd ' + __dirname + ' && node src/auth-app.js');
    process.exit(1);
  }
  
  console.error('');
  console.error('🎯 Starting MCP server with valid tokens...');

  // Create and start the MCP server
  const server = new WhoopMcpServer(WHOOP_CONFIG);

  // Set the access token
  server.whoopClient.setAccessToken(tokenData.accessToken);

  try {
    await server.run();
  } catch (error) {
    console.error('❌ Failed to start MCP server:', error.message);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.error('\n👋 Shutting down WHOOP MCP Server...');
  process.exit(0);
});

// Start the server
startMcpServer().catch((error) => {
  console.error('❌ Failed to start server:', error.message);
  process.exit(1);
});
