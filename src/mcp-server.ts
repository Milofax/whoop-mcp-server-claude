import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { WhoopApiClient } from './whoop-api.js';
import type { WhoopApiConfig, WhoopToolName } from './types.js';
import { AUTH_BYPASS_TOOLS, WHOOP_TOOL_NAMES } from './types.js';
import { getToolDefinitions } from './schemas.js';
import { dispatchTool } from './tool-registry.js';
import { wrapTextResponse, wrapErrorResponse } from './tool-helpers.js';

export class WhoopMcpServer {
  private server: Server;
  private whoopClient: WhoopApiClient;

  constructor(config: WhoopApiConfig) {
    this.whoopClient = new WhoopApiClient(config);

    this.server = new Server(
      { name: 'whoop-mcp-server', version: '1.0.0' },
      { capabilities: { tools: {} } },
    );

    this.setupToolHandlers();
  }

  setAccessToken(token: string): void {
    this.whoopClient.setAccessToken(token);
  }

  private setupToolHandlers(): void {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: getToolDefinitions(),
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      if (!WHOOP_TOOL_NAMES.includes(name as WhoopToolName)) {
        return wrapErrorResponse(new Error(`Unknown tool: ${name}`));
      }

      const toolName = name as WhoopToolName;

      // Auth guard: data tools require a valid token
      if (!AUTH_BYPASS_TOOLS.has(toolName) && !this.whoopClient.hasToken()) {
        return wrapErrorResponse(
          new Error('No access token set. Use whoop-set-access-token, whoop-get-authorization-url, or whoop-exchange-code-for-token first.'),
        );
      }

      try {
        const result = await dispatchTool(toolName, this.whoopClient, (args ?? {}) as Record<string, unknown>);
        return typeof result === 'string'
          ? { content: [{ type: 'text', text: result }] }
          : wrapTextResponse(result);
      } catch (error) {
        return wrapErrorResponse(error);
      }
    });
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('WHOOP MCP Server started');
  }
}
