import type { WhoopApiClient } from './whoop-api.js';
import type { WhoopToolName } from './types.js';
import { validateToolArgs } from './validation.js';

type ToolHandler = (client: WhoopApiClient, args: Record<string, unknown>) => Promise<unknown>;

const TOOL_HANDLERS: Record<WhoopToolName, ToolHandler> = {
  'whoop-get-user-profile': (client) => client.getUserProfile(),
  'whoop-get-user-body-measurements': (client) => client.getUserBodyMeasurements(),
  'whoop-revoke-user-access': async (client) => {
    await client.revokeUserAccess();
    return 'User access revoked successfully';
  },

  'whoop-get-cycle-by-id': (client, args) => {
    const v = validateToolArgs('whoop-get-cycle-by-id', args);
    if (v.type !== 'cycleId') throw new Error('Unexpected validation result');
    return client.getCycleById(v.cycleId);
  },
  'whoop-get-cycle-collection': (client, args) => {
    const v = validateToolArgs('whoop-get-cycle-collection', args);
    if (v.type !== 'pagination') throw new Error('Unexpected validation result');
    return client.getCycleCollection(v.params);
  },
  'whoop-get-sleep-for-cycle': (client, args) => {
    const v = validateToolArgs('whoop-get-sleep-for-cycle', args);
    if (v.type !== 'cycleId') throw new Error('Unexpected validation result');
    return client.getSleepForCycle(v.cycleId);
  },

  'whoop-get-recovery-collection': (client, args) => {
    const v = validateToolArgs('whoop-get-recovery-collection', args);
    if (v.type !== 'pagination') throw new Error('Unexpected validation result');
    return client.getRecoveryCollection(v.params);
  },
  'whoop-get-recovery-for-cycle': (client, args) => {
    const v = validateToolArgs('whoop-get-recovery-for-cycle', args);
    if (v.type !== 'cycleId') throw new Error('Unexpected validation result');
    return client.getRecoveryForCycle(v.cycleId);
  },

  'whoop-get-sleep-by-id': (client, args) => {
    const v = validateToolArgs('whoop-get-sleep-by-id', args);
    if (v.type !== 'sleepId') throw new Error('Unexpected validation result');
    return client.getSleepById(v.sleepId);
  },
  'whoop-get-sleep-collection': (client, args) => {
    const v = validateToolArgs('whoop-get-sleep-collection', args);
    if (v.type !== 'pagination') throw new Error('Unexpected validation result');
    return client.getSleepCollection(v.params);
  },

  'whoop-get-workout-by-id': (client, args) => {
    const v = validateToolArgs('whoop-get-workout-by-id', args);
    if (v.type !== 'workoutId') throw new Error('Unexpected validation result');
    return client.getWorkoutById(v.workoutId);
  },
  'whoop-get-workout-collection': (client, args) => {
    const v = validateToolArgs('whoop-get-workout-collection', args);
    if (v.type !== 'pagination') throw new Error('Unexpected validation result');
    return client.getWorkoutCollection(v.params);
  },

  'whoop-get-authorization-url': (client) => Promise.resolve(client.getAuthorizationUrl()),
  'whoop-exchange-code-for-token': (client, args) => {
    const v = validateToolArgs('whoop-exchange-code-for-token', args);
    if (v.type !== 'code') throw new Error('Unexpected validation result');
    return client.exchangeCodeForToken(v.code);
  },
  'whoop-refresh-token': (client, args) => {
    const v = validateToolArgs('whoop-refresh-token', args);
    if (v.type !== 'refreshToken') throw new Error('Unexpected validation result');
    return client.refreshToken(v.refreshToken);
  },
  'whoop-set-access-token': (client, args) => {
    const v = validateToolArgs('whoop-set-access-token', args);
    if (v.type !== 'accessToken') throw new Error('Unexpected validation result');
    client.setAccessToken(v.accessToken);
    return Promise.resolve('Access token set successfully');
  },
};

export function dispatchTool(toolName: string, client: WhoopApiClient, args: Record<string, unknown>): Promise<unknown> {
  const handler = TOOL_HANDLERS[toolName as WhoopToolName];
  if (!handler) throw new Error(`Unknown tool: ${toolName}`);
  return handler(client, args);
}
