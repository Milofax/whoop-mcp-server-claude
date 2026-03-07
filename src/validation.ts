import type { WhoopToolName, PaginationParams } from './types.js';

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

function requireString(args: Record<string, unknown>, field: string): string {
  const val = args[field];
  if (val == null || typeof val !== 'string') {
    throw new ValidationError(`${field} is required and must be a string`);
  }
  return val;
}

function requireNumber(args: Record<string, unknown>, field: string): number {
  const val = args[field];
  if (val == null || typeof val !== 'number') {
    throw new ValidationError(`${field} is required and must be a number`);
  }
  return val;
}

function validatePagination(args: Record<string, unknown>): PaginationParams {
  const params: PaginationParams = {};
  if (args.limit != null) {
    if (typeof args.limit !== 'number') throw new ValidationError('limit must be a number');
    if (args.limit > 25) throw new ValidationError('limit must be at most 25');
    if (args.limit < 1) throw new ValidationError('limit must be at least 1');
    params.limit = args.limit;
  }
  if (args.start != null) {
    if (typeof args.start !== 'string') throw new ValidationError('start must be a string');
    params.start = args.start;
  }
  if (args.end != null) {
    if (typeof args.end !== 'string') throw new ValidationError('end must be a string');
    params.end = args.end;
  }
  if (args.nextToken != null) {
    if (typeof args.nextToken !== 'string') throw new ValidationError('nextToken must be a string');
    params.nextToken = args.nextToken;
  }
  return params;
}

type ValidatedArgs =
  | { type: 'none' }
  | { type: 'cycleId'; cycleId: number }
  | { type: 'sleepId'; sleepId: string }
  | { type: 'workoutId'; workoutId: string }
  | { type: 'pagination'; params: PaginationParams }
  | { type: 'code'; code: string }
  | { type: 'refreshToken'; refreshToken: string }
  | { type: 'accessToken'; accessToken: string };

export function validateToolArgs(toolName: WhoopToolName, args: Record<string, unknown>): ValidatedArgs {
  switch (toolName) {
    case 'whoop-get-user-profile':
    case 'whoop-get-user-body-measurements':
    case 'whoop-revoke-user-access':
    case 'whoop-get-authorization-url':
      return { type: 'none' };

    case 'whoop-get-cycle-by-id':
    case 'whoop-get-sleep-for-cycle':
    case 'whoop-get-recovery-for-cycle':
      return { type: 'cycleId', cycleId: requireNumber(args, 'cycleId') };

    case 'whoop-get-sleep-by-id':
      return { type: 'sleepId', sleepId: requireString(args, 'sleepId') };

    case 'whoop-get-workout-by-id':
      return { type: 'workoutId', workoutId: requireString(args, 'workoutId') };

    case 'whoop-get-cycle-collection':
    case 'whoop-get-recovery-collection':
    case 'whoop-get-sleep-collection':
    case 'whoop-get-workout-collection':
      return { type: 'pagination', params: validatePagination(args) };

    case 'whoop-exchange-code-for-token':
      return { type: 'code', code: requireString(args, 'code') };

    case 'whoop-refresh-token':
      return { type: 'refreshToken', refreshToken: requireString(args, 'refreshToken') };

    case 'whoop-set-access-token':
      return { type: 'accessToken', accessToken: requireString(args, 'accessToken') };
  }
}
