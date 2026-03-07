import type { Tool } from '@modelcontextprotocol/sdk/types.js';

const PAGINATION_SCHEMA = {
  type: 'object' as const,
  properties: {
    limit: { type: 'number' as const, description: 'Limit on the number of records returned (max 25)' },
    start: { type: 'string' as const, description: 'Return records after or during this time (ISO 8601)' },
    end: { type: 'string' as const, description: 'Return records that intersect or ended before this time (ISO 8601)' },
    nextToken: { type: 'string' as const, description: 'Next token from previous response for pagination' },
  },
  required: [] as string[],
};

const EMPTY_SCHEMA = {
  type: 'object' as const,
  properties: {},
  required: [] as string[],
};

export function getToolDefinitions(): Tool[] {
  return [
    {
      name: 'whoop-get-user-profile',
      description: 'Get basic user profile information (name, email) for the authenticated user',
      inputSchema: EMPTY_SCHEMA,
    },
    {
      name: 'whoop-get-user-body-measurements',
      description: 'Get body measurements (height, weight, max heart rate) for the authenticated user',
      inputSchema: EMPTY_SCHEMA,
    },
    {
      name: 'whoop-revoke-user-access',
      description: 'Revoke the access token granted by the user',
      inputSchema: EMPTY_SCHEMA,
    },
    {
      name: 'whoop-get-cycle-by-id',
      description: 'Get the cycle for the specified ID',
      inputSchema: {
        type: 'object' as const,
        properties: {
          cycleId: { type: 'number' as const, description: 'ID of the cycle to retrieve' },
        },
        required: ['cycleId'],
      },
    },
    {
      name: 'whoop-get-cycle-collection',
      description: 'Get all physiological cycles for a user, paginated',
      inputSchema: PAGINATION_SCHEMA,
    },
    {
      name: 'whoop-get-sleep-for-cycle',
      description: 'Get sleep data for a specific cycle',
      inputSchema: {
        type: 'object' as const,
        properties: {
          cycleId: { type: 'number' as const, description: 'ID of the cycle to get sleep data for' },
        },
        required: ['cycleId'],
      },
    },
    {
      name: 'whoop-get-recovery-collection',
      description: 'Get all recovery data for a user, paginated',
      inputSchema: PAGINATION_SCHEMA,
    },
    {
      name: 'whoop-get-recovery-for-cycle',
      description: 'Get recovery data for a specific cycle',
      inputSchema: {
        type: 'object' as const,
        properties: {
          cycleId: { type: 'number' as const, description: 'ID of the cycle to get recovery data for' },
        },
        required: ['cycleId'],
      },
    },
    {
      name: 'whoop-get-sleep-by-id',
      description: 'Get the sleep record for the specified ID',
      inputSchema: {
        type: 'object' as const,
        properties: {
          sleepId: { type: 'string' as const, description: 'ID of the sleep record to retrieve' },
        },
        required: ['sleepId'],
      },
    },
    {
      name: 'whoop-get-sleep-collection',
      description: 'Get all sleep records for a user, paginated',
      inputSchema: PAGINATION_SCHEMA,
    },
    {
      name: 'whoop-get-workout-by-id',
      description: 'Get the workout record for the specified ID',
      inputSchema: {
        type: 'object' as const,
        properties: {
          workoutId: { type: 'string' as const, description: 'ID of the workout record to retrieve' },
        },
        required: ['workoutId'],
      },
    },
    {
      name: 'whoop-get-workout-collection',
      description: 'Get all workout records for a user, paginated',
      inputSchema: PAGINATION_SCHEMA,
    },
    {
      name: 'whoop-get-authorization-url',
      description: 'Get the authorization URL for OAuth flow',
      inputSchema: EMPTY_SCHEMA,
    },
    {
      name: 'whoop-exchange-code-for-token',
      description: 'Exchange authorization code for access token',
      inputSchema: {
        type: 'object' as const,
        properties: {
          code: { type: 'string' as const, description: 'Authorization code from OAuth callback' },
        },
        required: ['code'],
      },
    },
    {
      name: 'whoop-refresh-token',
      description: 'Refresh access token using refresh token',
      inputSchema: {
        type: 'object' as const,
        properties: {
          refreshToken: { type: 'string' as const, description: 'Refresh token for getting new access token' },
        },
        required: ['refreshToken'],
      },
    },
    {
      name: 'whoop-set-access-token',
      description: 'Set the access token for API calls',
      inputSchema: {
        type: 'object' as const,
        properties: {
          accessToken: { type: 'string' as const, description: 'Access token to use for API calls' },
        },
        required: ['accessToken'],
      },
    },
  ];
}
