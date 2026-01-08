#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { WhoopMcpServer } from './dist/mcp-server.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env file if present
dotenv.config({ path: path.join(__dirname, '.env') });

const WHOOP_CONFIG = {
  clientId: process.env.WHOOP_CLIENT_ID,
  clientSecret: process.env.WHOOP_CLIENT_SECRET,
  redirectUri: process.env.WHOOP_REDIRECT_URI || 'http://localhost:3000/callback'
};

// Validate required environment variables
if (!WHOOP_CONFIG.clientId || !WHOOP_CONFIG.clientSecret) {
  console.error('❌ Missing required environment variables!');
  console.error('   Please set WHOOP_CLIENT_ID and WHOOP_CLIENT_SECRET');
  console.error('   Either via environment or in a .env file');
  process.exit(1);
}

const TOKENS_FILE = path.join(__dirname, 'whoop-tokens.json');

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
  const tokenData = loadTokens();
  if (!tokenData) {
    process.exit(1);
  }

  // Test if tokens are still valid
  const isValid = await testTokens(tokenData.accessToken);
  if (!isValid) {
    console.error('');
    console.error('🔄 Please re-authenticate by running:');
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
