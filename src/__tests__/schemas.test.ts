import { describe, it, expect } from 'vitest';
import { getToolDefinitions } from '../schemas.js';
import { WHOOP_TOOL_NAMES } from '../types.js';

describe('getToolDefinitions', () => {
  const tools = getToolDefinitions();

  it('returns 16 tools', () => {
    expect(tools).toHaveLength(16);
  });

  it('all tools have name, description, inputSchema', () => {
    for (const tool of tools) {
      expect(tool).toHaveProperty('name');
      expect(tool).toHaveProperty('description');
      expect(tool).toHaveProperty('inputSchema');
      expect(typeof tool.name).toBe('string');
      expect(typeof tool.description).toBe('string');
      expect(tool.inputSchema).toBeDefined();
    }
  });

  it('tool names match WHOOP_TOOL_NAMES', () => {
    const names = tools.map((t) => t.name);
    expect(names).toEqual([...WHOOP_TOOL_NAMES]);
  });

  it('pagination tools share the same schema properties', () => {
    const paginationTools = [
      'whoop-get-cycle-collection',
      'whoop-get-recovery-collection',
      'whoop-get-sleep-collection',
      'whoop-get-workout-collection',
    ];

    const schemas = paginationTools.map((name) => {
      const tool = tools.find((t) => t.name === name);
      return tool?.inputSchema;
    });

    // All pagination schemas should be the exact same reference (shared)
    for (let i = 1; i < schemas.length; i++) {
      expect(schemas[i]).toBe(schemas[0]);
    }
  });
});
